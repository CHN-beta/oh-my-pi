/**
 * Contract: each vibe slot resolves the agent definition of the same name from
 * real project discovery (`.omp/agents/<name>.md`), not from a bundled list.
 * The definition's `model:` is what makes the three slots independent, so this
 * exercises the parser -> discovery -> slot path end to end.
 */
import { describe, expect, it } from "bun:test";
import * as fs from "node:fs/promises";
import * as path from "node:path";
import { Settings } from "@oh-my-pi/pi-coding-agent/config/settings";
import { TempDir } from "@oh-my-pi/pi-utils";
import { resolveVibeWorkerAgent, type VibeParentSession } from "@oh-my-pi/pi-coding-agent/vibe/runtime";

function agentMd(name: string, model: string): string {
	return [
		"---",
		`name: ${name}`,
		`description: ${name} worker`,
		`model: "${model}"`,
		"---",
		`You are the ${name} worker.`,
		"",
	].join("\n");
}

function sessionFor(cwd: string): VibeParentSession {
	return {
		cwd,
		settings: Settings.isolated(),
		getSessionId: () => "vibe-test-session",
		getSessionFile: () => null,
	} as unknown as VibeParentSession;
}

async function projectWithAgents(...names: string[]): Promise<TempDir> {
	const directory = TempDir.createSync("@omp-vibe-agents-");
	const agentsDir = path.join(directory.path(), ".omp", "agents");
	await fs.mkdir(agentsDir, { recursive: true });
	for (const name of names) {
		await fs.writeFile(path.join(agentsDir, `${name}.md`), agentMd(name, `provider/${name}-model`));
	}
	return directory;
}

describe("vibe slot agent discovery", () => {
	it("resolves each slot to its project agent definition and model", async () => {
		using directory = await projectWithAgents("doc", "code", "math");
		const session = sessionFor(directory.path());

		const doc = await resolveVibeWorkerAgent(session, "doc", "doc");
		const code = await resolveVibeWorkerAgent(session, "code", "code");
		const math = await resolveVibeWorkerAgent(session, "math", "math");

		expect(doc.name).toBe("doc");
		expect(doc.model).toEqual(["provider/doc-model"]);
		expect(doc.systemPrompt).toContain("You are the doc worker.");
		expect(code.model).toEqual(["provider/code-model"]);
		expect(math.model).toEqual(["provider/math-model"]);
	});

	it("fails with both config paths and the searched directories when a slot has no definition", async () => {
		using directory = await projectWithAgents("doc", "code");

		await expect(
			resolveVibeWorkerAgent(sessionFor(directory.path()), "math", "vibe-slot-definitely-missing"),
		).rejects.toThrow(
			/vibe-slot-definitely-missing.*\.omp\/agents\/vibe-slot-definitely-missing\.md.*~\/\.omp\/agent\/agents\/vibe-slot-definitely-missing\.md/s,
		);
	});
});
