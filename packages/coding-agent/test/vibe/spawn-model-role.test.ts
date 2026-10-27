/**
 * Contract: a vibe worker's spawn options carry the slot's agent definition
 * (model, prompt, tools) and the pre-expansion model role, plus an id built
 * from the worker name the user passed in.
 *
 * `resolveVibeWorkerAgent` resolves the slot's agent through normal discovery;
 * `#resolveWorker` then expands that definition's role alias (`@task`,
 * `@smol`, …) into concrete patterns, so the role survives only as a separate
 * field forwarded across `ResolvedVibeWorker` -> `VibeRecord` ->
 * `#buildSpawnOptions` -> `runSubprocess`. The executor keys the child's
 * inherited `retry.fallbackChains` entry off it; drop any link in that chain
 * and vibe children silently retry on the `default` role's chain.
 *
 * The id keeps only `[A-Za-z0-9_-]` from that name and falls back to a
 * generated name when nothing survives.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "bun:test";
import { AsyncJobManager } from "@oh-my-pi/pi-coding-agent/async/job-manager";
import { Settings } from "@oh-my-pi/pi-coding-agent/config/settings";
import { AgentRegistry } from "@oh-my-pi/pi-coding-agent/registry/agent-registry";
import type { ExecutorOptions } from "@oh-my-pi/pi-coding-agent/task/executor";
import * as executorModule from "@oh-my-pi/pi-coding-agent/task/executor";
import type { AgentDefinition } from "@oh-my-pi/pi-coding-agent/task/types";
import * as discoveryModule from "@oh-my-pi/pi-coding-agent/task/discovery";
import * as nameGenerator from "@oh-my-pi/pi-coding-agent/task/name-generator";
import type { SingleResult } from "@oh-my-pi/pi-tui/tools/task";
import type { ToolSession } from "@oh-my-pi/pi-coding-agent/tools";
import type { VibeCli } from "@oh-my-pi/pi-tui/tools/vibe";
import { VibeSessionRegistry } from "@oh-my-pi/pi-coding-agent/vibe/runtime";

function workerAgent(name: string, model?: string[]): AgentDefinition {
	return {
		name,
		description: `${name} worker`,
		systemPrompt: `You are the ${name} worker.`,
		model,
		source: "user",
	};
}

/** Discovery is stubbed so the slots resolve without touching the host's agent dirs. */
function stubDiscovery(agents: AgentDefinition[]): void {
	vi.spyOn(discoveryModule, "discoverAgents").mockResolvedValue({
		agents,
		projectAgentsDir: null,
		searchedDirs: ["<stubbed>"],
	});
}

const DEFAULT_AGENTS = [
	workerAgent("doc", ["@smol"]),
	workerAgent("code", ["@task"]),
	workerAgent("debug", ["provider/debug-model"]),
	workerAgent("design", ["provider/design-model"]),
	workerAgent("math", ["provider/math-model"]),
	workerAgent("exec", ["provider/exec-model"]),
];

function makeParentSession(settings: Settings): ToolSession {
	return {
		cwd: "/tmp",
		settings,
		asyncJobManager: new AsyncJobManager({ onJobComplete: () => {} }),
		getSessionId: () => "parent-session",
		// No session file: spawn skips lifecycle persistence and stays in-memory.
		getSessionFile: () => null,
		getArtifactsDir: () => null,
		taskDepth: 0,
		enableLsp: false,
	} as unknown as ToolSession;
}

/** Spawn one worker and capture the ExecutorOptions the vibe path hands the executor. */
async function spawnAndCaptureOptions(cli: VibeCli, settings: Settings, name?: string): Promise<ExecutorOptions> {
	const captured = Promise.withResolvers<ExecutorOptions>();
	vi.spyOn(executorModule, "runSubprocess").mockImplementation(async options => {
		captured.resolve(options);
		return {
			index: 0,
			id: options.id,
			agent: options.agent.name,
			agentSource: "bundled",
			task: options.task,
			exitCode: 0,
			output: "done",
			stderr: "",
			truncated: false,
			durationMs: 1,
			tokens: 0,
			requests: 0,
		} as SingleResult;
	});

	const registry = VibeSessionRegistry.global();
	await registry.spawn(makeParentSession(settings), { cli, name, prompt: "work" });
	return captured.promise;
}

describe("vibe worker spawn options", () => {
	beforeEach(() => {
		stubDiscovery(DEFAULT_AGENTS);
	});

	afterEach(() => {
		vi.restoreAllMocks();
		VibeSessionRegistry.resetGlobalForTests();
		AgentRegistry.resetGlobalForTests();
	});

	it("runs the `code` slot's own agent definition", async () => {
		const options = await spawnAndCaptureOptions(
			"code",
			Settings.isolated({
				modelRoles: { default: "anthropic/opus", task: "anthropic/sonnet" },
			}),
		);

		expect(options.agent.name).toBe("code");
		expect(options.agent.systemPrompt).toBe("You are the code worker.");
		expect(options.modelOverride).toEqual(["anthropic/sonnet"]);
		expect(options.modelRole).toBe("task");
	});

	it("forwards the `smol` role behind the `doc` slot's expanded patterns", async () => {
		const options = await spawnAndCaptureOptions(
			"doc",
			Settings.isolated({
				modelRoles: { default: "anthropic/opus", smol: "fast/hy3" },
			}),
		);

		expect(options.agent.name).toBe("doc");
		expect(options.modelOverride).toEqual(["fast/hy3"]);
		expect(options.modelRole).toBe("smol");
	});

	it("resolves the `math` slot's definition model as a concrete selector", async () => {
		const options = await spawnAndCaptureOptions(
			"math",
			Settings.isolated({ modelRoles: { default: "anthropic/opus" } }),
		);

		expect(options.agent.name).toBe("math");
		expect(options.modelOverride).toEqual(["provider/math-model"]);
		expect(options.modelRole).toBeUndefined();
	});

	it("keeps the role identity when a per-agent model override replaces the alias", async () => {
		// `task.agentModelOverrides` wins over the agent definition, and an explicit
		// selector carries no role — the child must then inherit `default`, not
		// capture the routing of whichever role happens to name the same model.
		const options = await spawnAndCaptureOptions(
			"code",
			Settings.isolated({
				modelRoles: { default: "anthropic/opus", task: "anthropic/sonnet" },
				"task.agentModelOverrides": { code: "openai-codex/sol" },
			}),
		);

		expect(options.modelOverride).toEqual(["openai-codex/sol"]);
		expect(options.modelRole).toBeUndefined();
	});

	it("restricts the first spawn to the worker agent's account pool, as revival does", async () => {
		// Without it a worker runs unrestricted until it is parked and revived.
		const options = await spawnAndCaptureOptions(
			"math",
			Settings.isolated({
				modelRoles: { default: "anthropic/opus", task: "anthropic/sonnet" },
				"task.agentAccountPools": {
					code: { anthropic: [] },
					math: { anthropic: ["email:a@example.com|org:org-a"] },
				},
			}),
		);

		expect(options.oauthAccountPools).toEqual({ anthropic: ["email:a@example.com|org:org-a"] });
	});

	it("fails the spawn with both config paths when the slot's agent is missing", async () => {
		stubDiscovery(DEFAULT_AGENTS.filter(agent => agent.name !== "math"));

		await expect(
			VibeSessionRegistry.global().spawn(makeParentSession(Settings.isolated()), {
				cli: "math",
				prompt: "derive it",
			}),
		).rejects.toThrow(
			/Vibe slot "math" needs an agent named "math".*\.omp\/agents\/math\.md.*~\/\.omp\/agent\/agents\/math\.md/s,
		);
	});

	it("keeps only [A-Za-z0-9_-] from a custom worker name", async () => {
		const options = await spawnAndCaptureOptions("code", Settings.isolated(), "../My Worker!");

		expect(options.id).toBe("MyWorker");
	});

	it("falls back to a generated name when nothing in the custom name survives", async () => {
		vi.spyOn(nameGenerator, "generateTaskName").mockReturnValue("GeneratedWorker");

		const options = await spawnAndCaptureOptions("code", Settings.isolated(), "!!!");

		expect(options.id).toBe("GeneratedWorker");
	});
});
