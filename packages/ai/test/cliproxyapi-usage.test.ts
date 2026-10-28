import { describe, expect, it } from "bun:test";

import { ProviderHttpError } from "@oh-my-pi/pi-ai/error";
import type { FetchImpl } from "@oh-my-pi/pi-ai/types";
import { resolveUsedFraction, type UsageFetchContext, type UsageFetchParams } from "@oh-my-pi/pi-ai/usage";
import { cliproxyapiUsageProvider } from "@oh-my-pi/pi-ai/usage/cliproxyapi";

function makeCredential(overrides: Partial<UsageFetchParams["credential"]> = {}): UsageFetchParams["credential"] {
	return { type: "api_key", apiKey: "cpa-test-key", ...overrides };
}

type SeenRequest = { url?: string; headers?: Record<string, string> };

function makeCtx(body: unknown, status = 200, seen?: SeenRequest): UsageFetchContext {
	const fetch: FetchImpl = async (url, init) => {
		if (seen) {
			seen.url = String(url);
			seen.headers = init?.headers as Record<string, string> | undefined;
		}
		return new Response(JSON.stringify(body), {
			status,
			headers: { "content-type": "application/json" },
		});
	};
	return { fetch };
}

const MONTHLY_BODY = {
	name: "team-key",
	key_hash: "hashed",
	current_month: "2026-10",
	resets_at: "2026-10-31T16:00:00Z",
	quota: 20,
	used: 3.45,
	remaining: 16.55,
	exceeded: false,
};

describe("cliproxyapi usage provider", () => {
	it("maps a metered monthly allowance to a USD limit", async () => {
		const seen: SeenRequest = {};
		const report = await cliproxyapiUsageProvider.fetchUsage(
			{ provider: "cliproxyapi", credential: makeCredential(), baseUrl: "https://cpa.example.test/v1" },
			makeCtx(MONTHLY_BODY, 200, seen),
		);

		expect(seen.url).toBe("https://cpa.example.test/v1/quota");
		expect(seen.headers?.Authorization).toBe("Bearer cpa-test-key");
		expect(seen.headers?.Accept).toBe("application/json");

		expect(report).not.toBeNull();
		const limit = report!.limits[0]!;
		expect(limit.amount.unit).toBe("usd");
		expect(limit.amount.used).toBe(3.45);
		expect(limit.amount.limit).toBe(20);
		expect(limit.amount.remaining).toBe(16.55);
		expect(limit.amount.usedFraction).toBeCloseTo(0.1725, 6);
		expect(limit.amount.remainingFraction).toBeCloseTo(0.8275, 6);
		expect(resolveUsedFraction(limit)).toBeCloseTo(0.1725, 6);
		expect(limit.status).toBe("ok");
		expect(limit.scope).toEqual({
			provider: "cliproxyapi",
			windowId: "monthly",
			accountId: "team-key",
			shared: true,
		});
		expect(limit.window).toEqual({
			id: "monthly",
			label: "Monthly (2026-10)",
			durationMs: 30 * 24 * 60 * 60 * 1000,
			resetsAt: Date.parse("2026-10-31T16:00:00Z"),
		});
		expect(limit.label).toBe("Monthly (2026-10)");
		expect(report!.provider).toBe("cliproxyapi");
		expect(report!.metadata).toEqual({ accountId: "team-key", currentMonth: "2026-10" });
	});

	it("keeps an unlimited key used-only instead of inventing a quota", async () => {
		// The gateway reports quota/remaining as null for a key without an
		// allowance; a synthesized limit would draw a bar against a cap the key
		// never had and the CLI would print "$x / $y" instead of "$x used".
		const report = await cliproxyapiUsageProvider.fetchUsage(
			{ provider: "cliproxyapi", credential: makeCredential() },
			makeCtx({ ...MONTHLY_BODY, quota: null, remaining: null, exceeded: false }),
		);

		const limit = report!.limits[0]!;
		expect(limit.amount.used).toBe(3.45);
		expect(limit.amount.limit).toBeUndefined();
		expect(limit.amount.remaining).toBeUndefined();
		expect(limit.amount.usedFraction).toBeUndefined();
		expect(limit.amount.remainingFraction).toBeUndefined();
		expect(resolveUsedFraction(limit)).toBeUndefined();
		expect(limit.status).toBe("ok");
	});

	it("flags warning at 90% and exhausted past the quota", async () => {
		const warning = await cliproxyapiUsageProvider.fetchUsage(
			{ provider: "cliproxyapi", credential: makeCredential() },
			makeCtx({ ...MONTHLY_BODY, quota: 10, used: 9, remaining: 1 }),
		);
		expect(warning!.limits[0]!.status).toBe("warning");

		const exhausted = await cliproxyapiUsageProvider.fetchUsage(
			{ provider: "cliproxyapi", credential: makeCredential() },
			makeCtx({ ...MONTHLY_BODY, quota: 10, used: 12, remaining: 0, exceeded: true }),
		);
		expect(exhausted!.limits[0]!.status).toBe("exhausted");
		// Fractions stay clamped even when the gateway reports overage.
		expect(exhausted!.limits[0]!.amount.usedFraction).toBe(1);
		expect(exhausted!.limits[0]!.amount.remainingFraction).toBe(0);
	});

	it("appends /v1/quota to a bare gateway base and honors the default endpoint", async () => {
		const bare: SeenRequest = {};
		await cliproxyapiUsageProvider.fetchUsage(
			{ provider: "cliproxyapi", credential: makeCredential(), baseUrl: "https://cpa.example.test/" },
			makeCtx(MONTHLY_BODY, 200, bare),
		);
		expect(bare.url).toBe("https://cpa.example.test/v1/quota");

		const fallback: SeenRequest = {};
		await cliproxyapiUsageProvider.fetchUsage(
			{ provider: "cliproxyapi", credential: makeCredential() },
			makeCtx(MONTHLY_BODY, 200, fallback),
		);
		expect(fallback.url).toBe("https://cliproxyapi.chn.moe/v1/quota");
	});

	it("falls back to the start of next month when resets_at is missing or malformed", async () => {
		const before = Date.now();
		const report = await cliproxyapiUsageProvider.fetchUsage(
			{ provider: "cliproxyapi", credential: makeCredential() },
			makeCtx({ ...MONTHLY_BODY, resets_at: "not-a-date" }),
		);

		const resetsAt = report!.limits[0]!.window!.resetsAt!;
		expect(resetsAt).toBeGreaterThan(before);
		const resetDate = new Date(resetsAt);
		const now = new Date();
		expect(resetDate.getDate()).toBe(1);
		expect(resetDate.getHours()).toBe(0);
		expect(resetDate.getMinutes()).toBe(0);
		expect(resetDate.getMonth()).toBe((now.getMonth() + 1) % 12);
	});

	it("uses the access token when no api key is present", async () => {
		const seen: SeenRequest = {};
		await cliproxyapiUsageProvider.fetchUsage(
			{ provider: "cliproxyapi", credential: { type: "oauth", accessToken: "oauth-token" } },
			makeCtx(MONTHLY_BODY, 200, seen),
		);
		expect(seen.headers?.Authorization).toBe("Bearer oauth-token");
	});

	it("returns null without a credential and for other providers", async () => {
		const report = await cliproxyapiUsageProvider.fetchUsage(
			{ provider: "cliproxyapi", credential: { type: "api_key" } },
			makeCtx(MONTHLY_BODY),
		);
		expect(report).toBeNull();

		const otherProvider = await cliproxyapiUsageProvider.fetchUsage(
			{ provider: "openai", credential: makeCredential() },
			makeCtx(MONTHLY_BODY),
		);
		expect(otherProvider).toBeNull();
	});

	it("supports only cliproxyapi, regardless of credential shape", () => {
		expect(cliproxyapiUsageProvider.supports?.({ provider: "cliproxyapi", credential: makeCredential() })).toBe(true);
		expect(cliproxyapiUsageProvider.supports?.({ provider: "openai", credential: makeCredential() })).toBe(false);
	});

	it("throws on a rejected key so the cached report is purged", async () => {
		await expect(
			cliproxyapiUsageProvider.fetchUsage(
				{ provider: "cliproxyapi", credential: makeCredential() },
				makeCtx({ error: { message: "Invalid API key" } }, 401),
			),
		).rejects.toBeInstanceOf(ProviderHttpError);
	});

	it("returns null on a transient failure so the last-good report keeps serving", async () => {
		const report = await cliproxyapiUsageProvider.fetchUsage(
			{ provider: "cliproxyapi", credential: makeCredential() },
			makeCtx({ error: { message: "boom" } }, 503),
		);
		expect(report).toBeNull();
	});

	it("returns null for a JSON body that is not a quota response", async () => {
		// An older gateway without `/v1/quota` may answer `{}` with a 200; a
		// zero-spend month would be fabricated quota data.
		const report = await cliproxyapiUsageProvider.fetchUsage(
			{ provider: "cliproxyapi", credential: makeCredential() },
			makeCtx({ models: ["gpt-5"] }),
		);
		expect(report).toBeNull();
	});
});
