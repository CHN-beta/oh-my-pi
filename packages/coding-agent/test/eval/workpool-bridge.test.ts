import { afterEach, describe, expect, it, vi } from "bun:test";
import { createMockModel } from "@oh-my-pi/pi-ai/providers/mock";
import { AsyncJobManager } from "../../src/async";
import { Settings } from "../../src/config/settings";
import { runEvalWorkpool } from "../../src/eval/workpool-bridge";
import { AgentRegistry } from "../../src/registry/agent-registry";
import * as discovery from "../../src/task/discovery";
import * as structured from "../../src/task/structured-subagent";
import type { AgentDefinition } from "../../src/task/types";
import { WorkPoolRegistry } from "../../src/task/workpool";
import type { ToolSession } from "../../src/tools";

const SCOUT: AgentDefinition = {
	name: "scout",
	description: "Test scout",
	systemPrompt: "Inspect things.",
	source: "bundled",
};

const managers = new Set<AsyncJobManager>();

function makeSession(settings: Record<string, unknown> = {}): ToolSession {
	const manager = new AsyncJobManager({ retentionMs: 0 });
	managers.add(manager);
	return {
		cwd: "/tmp",
		hasUI: false,
		settings: Settings.isolated({
			"task.maxConcurrency": 2,
			"task.maxRecursionDepth": 2,
			"task.isolation.enabled": false,
			"task.enableLsp": false,
			...settings,
		}),
		asyncJobManager: manager,
		getAgentId: () => "Main",
		getSessionFile: () => null,
		getSessionSpawns: () => "*",
		getArtifactsDir: () => null,
	};
}

afterEach(async () => {
	for (const manager of managers) await manager.dispose();
	managers.clear();
	vi.restoreAllMocks();
	AgentRegistry.resetGlobalForTests();
	WorkPoolRegistry.resetForTests();
});

describe("runEvalWorkpool", () => {
	it("validates operation arguments", async () => {
		const session = makeSession();
		await expect(runEvalWorkpool(null, { session })).rejects.toThrow("arguments must be an object");
		await expect(runEvalWorkpool({}, { session })).rejects.toThrow("requires an op");
		await expect(runEvalWorkpool({ op: "create", agent: 4 }, { session })).rejects.toThrow(
			"agent must be a non-empty string",
		);
		await expect(runEvalWorkpool({ op: "status", name: "" }, { session })).rejects.toThrow(
			"requires a non-empty name",
		);
	});

	it("rejects unknown pool names", async () => {
		const session = makeSession();
		await expect(runEvalWorkpool({ op: "status", name: "missing" }, { session })).rejects.toThrow(
			'unknown workpool "missing"',
		);
	});

	it("creates unique default names and validates push and peek arguments", async () => {
		vi.spyOn(discovery, "discoverAgents").mockResolvedValue({ agents: [SCOUT], projectAgentsDir: null });
		const session = makeSession();
		const events: Array<Record<string, unknown>> = [];
		const first = await runEvalWorkpool(
			{ op: "create", agent: "scout" },
			{ session, emitStatus: event => events.push(event) },
		);
		const second = await runEvalWorkpool({ op: "create", agent: "scout" }, { session });
		expect(first).toEqual({ name: "scout-pool", agent: "scout", limit: 2 });
		expect(second).toEqual({ name: "scout-pool-2", agent: "scout", limit: 2 });
		expect(events).toEqual([{ op: "workpool", action: "create", pool: "scout-pool", count: 2 }]);
		await expect(runEvalWorkpool({ op: "push", name: "scout-pool", items: ["ok", 1] }, { session })).rejects.toThrow(
			"items string array",
		);
		expect(await runEvalWorkpool({ op: "peek", name: "scout-pool" }, { session })).toEqual({
			batches: [],
			pending: 0,
		});
		await expect(runEvalWorkpool({ op: "wait", name: "scout-pool" }, { session })).rejects.toThrow(
			'unknown workpool operation "wait"',
		);
	});
});

describe("workpool model validation", () => {
	it("accepts any resolvable worker model, including one the operator never approved", async () => {
		const approved = createMockModel();
		const unapproved = createMockModel({ id: "unapproved" });
		const agent: AgentDefinition = { ...SCOUT, source: "project", model: ["mock/unapproved"] };
		vi.spyOn(discovery, "discoverAgents").mockResolvedValue({ agents: [agent], projectAgentsDir: null });
		const session = Object.assign(makeSession({ "task.perCallModel": "off" }), {
			modelRegistry: { getAll: () => [approved, unapproved], getAvailable: () => [approved, unapproved] },
		});
		await expect(
			runEvalWorkpool({ op: "create", name: "unapproved", agent: "scout", model: "mock/unapproved" }, { session }),
		).resolves.toEqual({ name: "unapproved", agent: "scout", limit: 2 });
		await expect(
			runEvalWorkpool({ op: "create", name: "approved", agent: "scout", model: "mock/mock-model" }, { session }),
		).resolves.toEqual({ name: "approved", agent: "scout", limit: 2 });
	});

	it("rejects a model no available catalog entry matches before registering a pool", async () => {
		vi.spyOn(discovery, "discoverAgents").mockResolvedValue({ agents: [SCOUT], projectAgentsDir: null });
		const known = createMockModel();
		const session = Object.assign(makeSession({ "task.perCallModel": "off" }), {
			modelRegistry: {
				getAll: () => [known],
				getAvailable: () => [known],
				isBackgroundRefreshPending: () => false,
			},
		});
		await expect(
			runEvalWorkpool({ op: "create", name: "invalid", agent: "scout", model: "mock/missing" }, { session }),
		).rejects.toThrow(/No available model matches/);
		expect(WorkPoolRegistry.global().get("Main", "invalid")).toBeUndefined();
	});

	it.each(["", "   "])("treats a blank model (%p) as omitted", async model => {
		vi.spyOn(discovery, "discoverAgents").mockResolvedValue({ agents: [SCOUT], projectAgentsDir: null });
		const requested = Promise.withResolvers<unknown>();
		vi.spyOn(structured, "runStructuredSubagent").mockImplementation(async request => {
			requested.resolve(request.perCallModel);
			throw new Error("stop after dispatch");
		});
		// The gate stays off: no per-call route may reach the pool or its workers.
		const session = makeSession({ "task.perCallModel": "off" });

		await runEvalWorkpool({ op: "create", name: "blank", agent: "scout", model }, { session });
		await runEvalWorkpool({ op: "push", name: "blank", items: ["one"] }, { session });

		expect(await requested.promise).toBeUndefined();
	});

	// Losing the selector between bridge and pool would silently run workers on the agent's own model.
	it("hands the pool selector to workers", async () => {
		vi.spyOn(discovery, "discoverAgents").mockResolvedValue({ agents: [SCOUT], projectAgentsDir: null });
		const requested = Promise.withResolvers<unknown>();
		vi.spyOn(structured, "runStructuredSubagent").mockImplementation(async request => {
			requested.resolve(request.perCallModel);
			throw new Error("stop after dispatch");
		});
		const session = makeSession({ "task.perCallModel": "eval", modelRoles: { smol: "p/small" } });
		const model = "p/small";
		await runEvalWorkpool({ op: "create", name: "picked", agent: "scout", model }, { session });
		await runEvalWorkpool({ op: "push", name: "picked", items: ["one"] }, { session });
		expect(await requested.promise).toEqual(model);
	});
});
