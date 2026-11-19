import { describe, expect, it } from "bun:test";
import type { Model } from "@oh-my-pi/pi-ai";
import { createMockModel } from "@oh-my-pi/pi-ai/providers/mock";
import { Settings } from "@oh-my-pi/pi-coding-agent/config/settings";
import {
	assertPerCallModelApproved,
	getPerCallModelAdvertisement,
	type PerCallModelGrants,
} from "@oh-my-pi/pi-coding-agent/task/model-approval";

const target = createMockModel({ id: "target" });
const unrelated = createMockModel({ id: "unrelated" });
const catalog = [target, unrelated];
const registry = {
	getAll: () => catalog,
	getAvailable: (kind?: string) => (kind === "chat" ? catalog : catalog),
};

function grantsFor(settings: Settings): PerCallModelGrants {
	return {
		settings,
		agentName: "worker",
		agentSource: "bundled",
		agentModel: undefined,
		parentModelPattern: undefined,
	};
}

// Contract: a caller-supplied model is never held to an allowlist, role grant, or
// parent-model grant. Dispatch resolution alone decides whether the selector names an
// available chat model, so approval admits every model for every agent.
describe("per-call model approval", () => {
	it.each([
		{ name: "nothing configured", settings: {} },
		{ name: "an allowlist that omits the model", settings: { "task.perCallModelAllow": ["mock/unrelated"] } },
		{ name: "a role grant for another model", settings: { modelRoles: { review: "mock/unrelated" } } },
		{
			name: "a disabled agent",
			settings: { "task.disabledAgents": ["worker"] },
		},
	])("admits any model with $name", ({ settings }) => {
		const grants = grantsFor(Settings.isolated(settings));
		expect(() => assertPerCallModelApproved(target, grants, registry)).not.toThrow();
		expect(() => assertPerCallModelApproved(unrelated, grants, registry)).not.toThrow();
	});

	it("admits a model that a project overlay does not list", () => {
		const settings = Settings.isolated({ "task.perCallModelAllow": ["mock/target"] }).overlay(
			{ "task.perCallModelAllow": ["mock/other"] },
			{ derived: true },
		);
		expect(() => assertPerCallModelApproved(target, grantsFor(settings), registry)).not.toThrow();
	});
});

describe("per-call model advertisement", () => {
	it("still reports configured role selectors and the parent model clause", () => {
		const settings = Settings.isolated({ modelRoles: { review: "mock/target" } });
		const advertisement = getPerCallModelAdvertisement(settings, undefined, registry);
		expect(advertisement.roles).toEqual([{ role: "review", patterns: ["mock/target"] }]);
		expect(advertisement.parentModelWithheld).toBe(false);
	});

	it("marks the own-model clause withheld when the parent's routing cannot be written as one selector", () => {
		const settings = Settings.isolated({ modelRoles: { smol: "mock/target" } });
		const multiRoute = {
			...target,
			compat: { openRouterRouting: { only: ["anthropic", "google-vertex"] } },
		} as unknown as Model;
		expect(getPerCallModelAdvertisement(settings, multiRoute).parentModelWithheld).toBe(true);
	});
});
