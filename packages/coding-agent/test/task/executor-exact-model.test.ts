import { afterEach, describe, expect, it, vi } from "bun:test";
import * as fs from "node:fs/promises";
import * as os from "node:os";
import * as path from "node:path";
import type { Model } from "@oh-my-pi/pi-ai";
import { unregisterCustomApis } from "@oh-my-pi/pi-ai/api-registry";
import { createMockModel, registerMockApi } from "@oh-my-pi/pi-ai/providers/mock";
import { Effort } from "@oh-my-pi/pi-catalog/effort";
import type { ThinkingConfig } from "@oh-my-pi/pi-catalog/types";
import { ModelRegistry } from "@oh-my-pi/pi-coding-agent/config/model-registry";
import { Settings } from "@oh-my-pi/pi-coding-agent/config/settings";
import { AgentRegistry } from "@oh-my-pi/pi-coding-agent/registry/agent-registry";
import type { CallerThinkingLevel } from "@oh-my-pi/pi-tui/tools/task";
import { AuthStorage } from "@oh-my-pi/pi-coding-agent/session/auth-storage";
import { SessionManager } from "@oh-my-pi/pi-coding-agent/session/session-manager";
import * as discovery from "@oh-my-pi/pi-coding-agent/task/discovery";
import { runStructuredSubagent } from "@oh-my-pi/pi-coding-agent/task/structured-subagent";
import type { ToolSession } from "@oh-my-pi/pi-coding-agent/tools";

const perCallSettings = (model: Model, extra: Record<string, unknown> = {}) =>
	Settings.isolated({
		"task.maxRecursionDepth": 2,
		"task.perCallModel": "off",
		"task.isolation.enabled": false,
		"compaction.enabled": false,
		modelRoles: { review: `mock/${model.id}` },
		...extra,
	});

const cleanups: (() => Promise<void>)[] = [];
let runs = 0;

/** Runs a bundled `worker` on a caller selector through the real executor, with `model` as the only registry entry. */
async function runWorker(options: {
	model: Model;
	perCallModel: string;
	thinkingLevel?: CallerThinkingLevel;
	settings?: Settings;
	assignment?: string;
	setup?: (modelRegistry: ModelRegistry) => void;
}) {
	const { model } = options;
	const run = ++runs;
	const sourceId = `executor-caller-model-${run}`;
	const agentId = `CallerModel${run}`;
	const cwd = await fs.mkdtemp(path.join(os.tmpdir(), "omp-executor-caller-model-"));
	const authStorage = await AuthStorage.create(":memory:");
	cleanups.push(async () => {
		await AgentRegistry.global().get(agentId)?.session?.dispose();
		AgentRegistry.global().unregister(agentId);
		unregisterCustomApis(sourceId);
		authStorage.close();
		await fs.rm(cwd, { recursive: true, force: true });
	});
	authStorage.keys.setRuntime("mock", "test-key");
	registerMockApi(sourceId);
	const modelRegistry = new ModelRegistry(authStorage, path.join(cwd, "models.yml"));
	const find = modelRegistry.find.bind(modelRegistry);
	vi.spyOn(modelRegistry, "find").mockImplementation((provider, id) =>
		provider === "mock" && id === model.id ? model : find(provider, id),
	);
	vi.spyOn(modelRegistry, "getAvailable").mockImplementation(() => [model]);
	vi.spyOn(modelRegistry, "getAll").mockImplementation(() => [model]);
	options.setup?.(modelRegistry);
	vi.spyOn(discovery, "discoverAgents").mockResolvedValue({
		agents: [{ name: "worker", description: "test", systemPrompt: "test", source: "bundled", tools: ["read"] }],
		projectAgentsDir: null,
	});
	const session = {
		cwd,
		hasUI: false,
		settings: options.settings ?? perCallSettings(model),
		authStorage,
		modelRegistry,
		restrictToolNames: true,
		enableMCP: false,
		enableLsp: false,
		enableIrc: false,
		getSessionFile: () => null,
		getSessionSpawns: () => "*",
		getSessionAgents: () => [],
	} as unknown as ToolSession;
	const execution = await runStructuredSubagent({
		session,
		invocationKind: "task",
		assignment: options.assignment ?? "Answer the question.",
		agent: "worker",
		perCallModel: options.perCallModel,
		thinkingLevel: options.thinkingLevel,
		structured: false,
		identity: { id: agentId },
		keepAlive: false,
	});
	return execution.result;
}

describe("caller model and thinking overrides", () => {
	afterEach(async () => {
		vi.restoreAllMocks();
		for (const cleanup of cleanups.splice(0)) await cleanup();
	});

	it.each(["mock/requested-model-complete", "@review"])(
		"resolves the caller's selector %p without an approval gate",
		async selector => {
			const model = createMockModel({
				id: "requested-model-complete",
				handler: () => ({ content: ["Exact answer."] }),
			});
			const result = await runWorker({
				model,
				perCallModel: selector,
				setup: modelRegistry => {
					let warm = false;
					vi.spyOn(modelRegistry, "getAvailable").mockImplementation(() => (warm ? [model] : []));
					vi.spyOn(modelRegistry, "awaitBackgroundRefresh").mockImplementation(async () => {
						warm = true;
					});
				},
			});
			expect(result.exitCode).toBe(0);
			expect(result.output).toBe("Exact answer.");
			expect(model.calls).toHaveLength(1);
		},
	);

	it("keeps running after the operator's role configuration changes mid-run", async () => {
		const settings = perCallSettings(createMockModel({ id: "revoked-model" }), { "retry.enabled": false });
		const model = createMockModel({
			id: "revoked-model",
			responses: [
				() => {
					settings.setModelRole("review", "mock/other-model");
					return { content: [{ type: "toolCall", name: "read", arguments: { path: "notes.txt" } }] };
				},
			],
			handler: () => ({ content: ["Answer after revocation."] }),
		});
		const result = await runWorker({
			model,
			settings,
			perCallModel: `mock/${model.id}`,
			assignment: "Read notes.txt, then answer.",
		});
		expect(result.output).toContain("Answer after revocation.");
	});

	it("ignores task.maxEffort for a caller-chosen `:high` selector", async () => {
		const model = Object.assign(
			createMockModel({ id: "laddered", reasoning: true, handler: () => ({ content: ["Uncapped answer."] }) }),
			{ thinking: { mode: "effort", efforts: [Effort.Low, Effort.Medium, Effort.High] } satisfies ThinkingConfig },
		);
		const result = await runWorker({
			model,
			settings: perCallSettings(model, { "task.maxEffort": "low" }),
			perCallModel: `mock/${model.id}:high`,
		});
		expect(result.exitCode).toBe(0);
		expect(model.calls.map(call => call.options?.reasoning)).toEqual([Effort.High]);
	});

	it("starts a model whose lowest effort is above task.maxEffort", async () => {
		const model = Object.assign(
			createMockModel({ id: "high-only", reasoning: true, handler: () => ({ content: ["Started."] }) }),
			{ thinking: { mode: "effort", efforts: [Effort.High] } satisfies ThinkingConfig },
		);
		const result = await runWorker({
			model,
			settings: perCallSettings(model, { "task.maxEffort": "low" }),
			perCallModel: `mock/${model.id}`,
		});
		expect(result.exitCode).toBe(0);
		expect(result.output).toBe("Started.");
	});

	it("applies a caller thinkingLevel above the selector's suffix and the ceiling", async () => {
		const model = Object.assign(
			createMockModel({ id: "level-override", reasoning: true, handler: () => ({ content: ["High."] }) }),
			{ thinking: { mode: "effort", efforts: [Effort.Low, Effort.High] } satisfies ThinkingConfig },
		);
		const result = await runWorker({
			model,
			settings: perCallSettings(model, { "task.maxEffort": "low" }),
			perCallModel: `mock/${model.id}:low`,
			thinkingLevel: "high",
		});
		expect(result.exitCode).toBe(0);
		expect(model.calls.map(call => call.options?.reasoning)).toEqual([Effort.High]);
	});

	it.each([
		{ id: "coding-router", selector: "mock/coding-router:low", identity: "mock/coding-router", level: Effort.Low },
		{
			id: "coding-router:low",
			selector: "mock/coding-router:low:high",
			identity: "mock/coding-router:low",
			level: Effort.High,
		},
	])("persists $selector as separate identity and thinking fields", async ({ id, selector, identity, level }) => {
		const model = Object.assign(
			createMockModel({ id, reasoning: true, handler: () => ({ content: ["Persisted."] }) }),
			{ thinking: { mode: "effort", efforts: [Effort.Low, Effort.High] } satisfies ThinkingConfig },
		);
		const init = vi.spyOn(SessionManager.prototype, "appendSessionInit");
		const result = await runWorker({
			model,
			settings: perCallSettings(model, { "task.maxEffort": "high" }),
			perCallModel: selector,
		});
		expect(result.exitCode).toBe(0);
		expect(init.mock.calls[0]?.[0]).toMatchObject({
			perCallModel: true,
			perCallModelIdentity: identity,
			perCallThinkingLevel: level,
		});
	});
});
