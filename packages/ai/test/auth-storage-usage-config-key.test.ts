/**
 * A provider that exists only as a `models.yml` entry (an extension gateway such
 * as `cliproxyapi`) has no stored credential row. Usage must still be probed
 * with the pinned config key, against the gateway it was pinned for.
 */
import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import * as fs from "node:fs/promises";
import * as os from "node:os";
import * as path from "node:path";
import { AuthStorage, SqliteAuthCredentialStore } from "@oh-my-pi/pi-ai/auth-storage";
import { cliproxyapiUsageProvider } from "@oh-my-pi/pi-ai/usage/cliproxyapi";
import { removeWithRetries } from "../../utils/src/temp";
import { withEnv } from "./helpers";

describe("AuthStorage usage probes for config-only providers", () => {
	let tempDir = "";
	let store: SqliteAuthCredentialStore | null = null;
	let authStorage: AuthStorage | null = null;
	let seenUrl: string | undefined;
	let seenAuthorization: string | undefined;

	beforeEach(async () => {
		tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "pi-ai-usage-config-key-"));
		store = await SqliteAuthCredentialStore.open(path.join(tempDir, "agent.db"));
		seenUrl = undefined;
		seenAuthorization = undefined;
		const usageFetch = (async (input: string | URL | Request, init?: RequestInit) => {
			seenUrl = String(input);
			seenAuthorization = (init?.headers as Record<string, string> | undefined)?.Authorization;
			return Response.json({
				name: "team-key",
				key_hash: "hashed",
				current_month: "2026-10",
				resets_at: "2026-10-31T16:00:00Z",
				quota: 20,
				used: 3.45,
				remaining: 16.55,
				exceeded: false,
			});
		}) as unknown as typeof fetch;
		authStorage = new AuthStorage(store, {
			usageFetch,
			usageProviderResolver: provider => (provider === "cliproxyapi" ? cliproxyapiUsageProvider : undefined),
		});
	});

	afterEach(async () => {
		store?.close();
		store = null;
		authStorage = null;
		if (tempDir) {
			await removeWithRetries(tempDir);
			tempDir = "";
		}
	});

	test("probes a config-only provider with its configured key and base URL", async () => {
		await withEnv({ CLIPROXYAPI_API_KEY: undefined }, async () => {
			if (!authStorage) throw new Error("test setup failed");
			authStorage.keys.setConfig("cliproxyapi", "sk-config-key", {
				baseUrl: "https://cpa.example.test/v1",
			});

			const reports = await authStorage.usage.reports();
			const report = reports?.find(candidate => candidate.provider === "cliproxyapi");

			expect(report).toBeDefined();
			expect(report!.limits[0]!.amount).toMatchObject({ used: 3.45, limit: 20, unit: "usd" });
			expect(report!.metadata).toEqual({ accountId: "team-key", currentMonth: "2026-10" });
			expect(seenUrl).toBe("https://cpa.example.test/v1/quota");
			expect(seenAuthorization).toBe("Bearer sk-config-key");
		});
	});

	test("resolves a config key reference through the config-value resolver", async () => {
		await withEnv({ CLIPROXYAPI_API_KEY: "sk-from-env" }, async () => {
			if (!authStorage) throw new Error("test setup failed");
			authStorage.keys.setConfig("cliproxyapi", "CLIPROXYAPI_API_KEY");

			const reports = await authStorage.usage.reports();
			expect(reports?.some(candidate => candidate.provider === "cliproxyapi")).toBe(true);
			expect(seenAuthorization).toBe("Bearer sk-from-env");
		});
	});
});
