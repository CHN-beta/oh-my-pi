/**
 * Contract: the vibe director controls each worker's model and thinking level per call.
 *
 * `vibe_spawn` forwards `model` (any selector, including a `:level` suffix) and
 * `thinkingLevel` into the first turn's executor options; `vibe_send` records a
 * retarget, applies it to a live idle worker through `setModelTemporary` /
 * `setThinkingLevel`, and forwards it to the follow-up turn. Both stick for later turns.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "bun:test";
import { AsyncJobManager } from "@oh-my-pi/pi-coding-agent/async/job-manager";
import { ThinkingLevel } from "@oh-my-pi/pi-agent-core/thinking";
import { createMockModel } from "@oh-my-pi/pi-ai/providers/mock";
import { Settings } from "@oh-my-pi/pi-coding-agent/config/settings";
import { AgentRegistry } from "@oh-my-pi/pi-coding-agent/registry/agent-registry";
import type { AgentSession } from "@oh-my-pi/pi-coding-agent/session/agent-session";
import type { ExecutorOptions, FollowUpTurnOptions } from "@oh-my-pi/pi-coding-agent/task/executor";
import * as executorModule from "@oh-my-pi/pi-coding-agent/task/executor";
import * as discoveryModule from "@oh-my-pi/pi-coding-agent/task/discovery";
import type { SingleResult } from "@oh-my-pi/pi-tui/tools/task";
import type { ToolSession } from "@oh-my-pi/pi-coding-agent/tools";
import { VibeSessionRegistry } from "@oh-my-pi/pi-coding-agent/vibe/runtime";

const OWNER = "vibe-override-parent";
const target = createMockModel({ id: "target-model" });
const other = createMockModel({ id: "other-model" });

function resultFor(options: {
	index: number;
	id: string;
	agent: { name: string; source: SingleResult["agentSource"] };
	task: string;
}): SingleResult {
	return {
		index: options.index,
		id: options.id,
		agent: options.agent.name,
		agentSource: options.agent.source,
		task: options.task,
		exitCode: 0,
		output: "done",
		stderr: "",
		truncated: false,
		durationMs: 1,
		tokens: 0,
		requests: 0,
	};
}

function makeParent(manager: AsyncJobManager): ToolSession {
	return {
		cwd: "/tmp",
		settings: Settings.isolated(),
		asyncJobManager: manager,
		modelRegistry: {
			getAll: () => [target, other],
			getAvailable: () => [target, other],
			isBackgroundRefreshPending: () => false,
		},
		getAgentId: () => OWNER,
		getSessionId: () => "vibe-override-session",
		getSessionFile: () => null,
		getArtifactsDir: () => null,
		taskDepth: 0,
		enableLsp: false,
	} as unknown as ToolSession;
}

function stubDiscovery(): void {
	vi.spyOn(discoveryModule, "discoverAgents").mockResolvedValue({
		agents: [
			{
				name: "code",
				description: "code worker",
				systemPrompt: "You are the code worker.",
				model: ["mock/base-model"],
				thinkingLevel: ThinkingLevel.Low,
				source: "user",
			},
		],
		projectAgentsDir: null,
		searchedDirs: ["<stubbed>"],
	});
}

describe("vibe worker model overrides", () => {
	let manager: AsyncJobManager;
	let parent: ToolSession;

	beforeEach(() => {
		stubDiscovery();
		manager = new AsyncJobManager({ onJobComplete: () => {} });
		parent = makeParent(manager);
	});

	afterEach(async () => {
		vi.restoreAllMocks();
		await manager.dispose({ timeoutMs: 100 });
		VibeSessionRegistry.resetGlobalForTests();
		AgentRegistry.resetGlobalForTests();
	});

	async function spawnAndSettle(options: {
		model?: string;
		thinkingLevel?: "high" | "xhigh";
		live?: Partial<AgentSession> & { isStreaming: boolean };
	}) {
		const captured = Promise.withResolvers<ExecutorOptions>();
		vi.spyOn(executorModule, "runSubprocess").mockImplementation(async spawnOptions => {
			captured.resolve(spawnOptions);
			return resultFor(spawnOptions);
		});
		const spawned = await VibeSessionRegistry.global().spawn(parent, {
			cli: "code",
			prompt: "work",
			...(options.model !== undefined ? { model: options.model } : {}),
			...(options.thinkingLevel !== undefined ? { thinkingLevel: options.thinkingLevel } : {}),
		});
		// Register the live ref before the first turn settles: settlement decides idle vs dead from it.
		if (options.live) {
			AgentRegistry.global().register({
				id: spawned.id,
				displayName: spawned.id,
				kind: "sub",
				parentId: OWNER,
				session: options.live as AgentSession,
				status: options.live.isStreaming ? "running" : "idle",
			});
		}
		await manager.getJob(spawned.jobId)?.promise;
		return { spawned, spawnOptions: await captured.promise };
	}

	it("forwards a spawn model and thinking level over the slot defaults", async () => {
		const { spawnOptions } = await spawnAndSettle({ model: "mock/target-model", thinkingLevel: "high" });
		expect(spawnOptions.modelOverride).toEqual(["mock/target-model"]);
		expect(spawnOptions.thinkingLevel).toBe(ThinkingLevel.High);
	});

	it("keeps a `:level` suffix in the selector and lets thinkingLevel still win", async () => {
		const withSuffix = await spawnAndSettle({ model: "mock/target-model:xhigh" });
		expect(withSuffix.spawnOptions.modelOverride).toEqual(["mock/target-model:xhigh"]);
		expect(withSuffix.spawnOptions.thinkingLevel).toBe(ThinkingLevel.Low);
	});

	it("retargets an idle worker and forwards the overrides to its next turn", async () => {
		const setThinkingLevel = vi.fn();
		const setModelTemporary = vi.fn(async () => undefined);
		const live = {
			isStreaming: false,
			setThinkingLevel,
			setModelTemporary,
			activeToolExecutionUpdates: () => [],
		} as unknown as AgentSession;
		const { spawned } = await spawnAndSettle({ live });

		const followUp = Promise.withResolvers<FollowUpTurnOptions>();
		vi.spyOn(executorModule, "runSubagentFollowUpTurn").mockImplementation(async options => {
			followUp.resolve(options);
			return resultFor({ index: 0, id: options.id, agent: options.agent, task: options.message });
		});

		const outcome = await VibeSessionRegistry.global().send(parent, {
			session: spawned.id,
			message: "switch it up",
			model: "mock/other-model",
			thinkingLevel: "high",
		});
		expect(outcome.mode).toBe("turn");
		expect(setThinkingLevel).toHaveBeenCalledWith("high");
		expect(setModelTemporary).toHaveBeenCalledWith(other, "high");

		const options = await followUp.promise;
		expect(options.modelSelector).toBe("mock/other-model");
		expect(options.thinkingLevel).toBe("high");
	});

	it("applies a thinking level to a streaming worker at once and defers the model", async () => {
		const release = Promise.withResolvers<void>();
		vi.spyOn(executorModule, "runSubprocess").mockImplementation(async spawnOptions => {
			await release.promise;
			return resultFor(spawnOptions);
		});
		const spawned = await VibeSessionRegistry.global().spawn(parent, { cli: "code", prompt: "work" });

		const setThinkingLevel = vi.fn();
		const setModelTemporary = vi.fn(async () => undefined);
		const steer = vi.fn(async () => {});
		const live = {
			isStreaming: true,
			setThinkingLevel,
			setModelTemporary,
			steer,
			activeToolExecutionUpdates: () => [],
		} as unknown as AgentSession;
		AgentRegistry.global().register({
			id: spawned.id,
			displayName: spawned.id,
			kind: "sub",
			parentId: OWNER,
			session: live,
			status: "running",
		});

		const outcome = await VibeSessionRegistry.global().send(parent, {
			session: spawned.id,
			message: "keep going",
			model: "mock/other-model",
			thinkingLevel: "xhigh",
		});
		expect(outcome).toEqual({ id: spawned.id, mode: "steered" });
		expect(steer).toHaveBeenCalledWith("keep going", undefined, { attribution: "agent" });
		expect(setThinkingLevel).toHaveBeenCalledWith("xhigh");
		// A mid-turn model switch would strand the running request; it waits for the next turn.
		expect(setModelTemporary).not.toHaveBeenCalled();

		release.resolve();
		await manager.getJob(spawned.jobId)?.promise;
	});
});
