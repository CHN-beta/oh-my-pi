import { ProviderHttpError } from "../error";
import type {
	UsageAmount,
	UsageFetchContext,
	UsageFetchParams,
	UsageLimit,
	UsageProvider,
	UsageReport,
} from "../usage";
import { isRecord } from "../utils";
import { DAY_MS, parseIsoTimestamp } from "./shared";

const PROVIDER = "cliproxyapi";
const DEFAULT_BASE_URL = "https://cliproxyapi.chn.moe/v1";
const QUOTA_PATH = "/quota";
const MONTHLY_WINDOW_MS = 30 * DAY_MS;

/**
 * `GET /v1/quota` (alias `/v1/usage`) on a CLIProxyAPI gateway. The gateway
 * meters one monthly USD allowance per client API key:
 *
 * ```json
 * {"name":"team","key_hash":"…","current_month":"2026-10","resets_at":"2026-10-31T16:00:00Z",
 *  "quota":20,"used":3.45,"remaining":16.55,"exceeded":false}
 * ```
 *
 * `quota`/`remaining` are `null` for an unlimited key, so the amount stays
 * used-only there: reporting a synthesized limit would draw a quota bar
 * against an allowance the key never had.
 */
interface ClientQuotaPayload {
	name?: unknown;
	key_hash?: unknown;
	current_month?: unknown;
	resets_at?: unknown;
	quota?: unknown;
	used?: unknown;
	remaining?: unknown;
	exceeded?: unknown;
}

function normalizeBaseUrl(baseUrl?: string): string {
	return (baseUrl?.trim() || DEFAULT_BASE_URL).replace(/\/+$/, "");
}

/** `/v1/quota` for both `https://host/v1` and `https://host` configured bases. */
function quotaEndpoint(baseUrl: string): string {
	return /\/v1$/i.test(baseUrl) ? `${baseUrl}${QUOTA_PATH}` : `${baseUrl}/v1${QUOTA_PATH}`;
}

/** Start of next month in local time, matching the gateway's own reset anchoring. */
function nextMonthStartMs(nowMs: number): number {
	const now = new Date(nowMs);
	return new Date(now.getFullYear(), now.getMonth() + 1, 1).getTime();
}

async function readUpstreamErrorMessage(response: Response): Promise<string | undefined> {
	try {
		const payload: unknown = await response.json();
		if (!isRecord(payload) || !isRecord(payload.error)) return undefined;
		const message = payload.error.message;
		return typeof message === "string" ? message : undefined;
	} catch {
		return undefined;
	}
}

async function fetchCliproxyapiUsage(params: UsageFetchParams, ctx: UsageFetchContext): Promise<UsageReport | null> {
	if (params.provider !== PROVIDER) return null;

	const credential = params.credential;
	const apiKey = credential.apiKey || credential.accessToken;
	if (!apiKey) return null;

	const url = quotaEndpoint(normalizeBaseUrl(params.baseUrl));
	let payload: unknown;
	try {
		const response = await ctx.fetch(url, {
			headers: {
				Authorization: `Bearer ${apiKey}`,
				Accept: "application/json",
			},
			signal: params.signal,
		});
		if (!response.ok) {
			// 401/403 mean the gateway rejected the key; throwing purges the
			// cached report and lets credential health report ok:false. Other
			// statuses are transient — `null` keeps the last-good report.
			if (response.status === 401 || response.status === 403) {
				const detail = await readUpstreamErrorMessage(response);
				throw new ProviderHttpError(
					`CLIProxyAPI quota endpoint returned ${response.status}${detail ? `: ${detail}` : ""}`,
					response.status,
				);
			}
			ctx.logger?.warn("CLIProxyAPI usage fetch failed", {
				status: response.status,
				statusText: response.statusText,
			});
			return null;
		}
		payload = (await response.json()) as unknown;
	} catch (error) {
		if (error instanceof ProviderHttpError) throw error;
		ctx.logger?.warn("CLIProxyAPI usage fetch error", { error: String(error) });
		return null;
	}

	if (!isRecord(payload)) return null;
	const data = payload as ClientQuotaPayload;
	// A gateway that predates `/v1/quota` answers with some other JSON body;
	// reporting a zero-spend month for it would invent quota data.
	if (
		data.key_hash === undefined &&
		data.current_month === undefined &&
		data.quota === undefined &&
		data.used === undefined &&
		data.remaining === undefined
	) {
		ctx.logger?.warn("CLIProxyAPI quota response had no quota fields");
		return null;
	}

	const usedVal = typeof data.used === "number" && Number.isFinite(data.used) ? data.used : 0;
	const quotaVal = typeof data.quota === "number" && Number.isFinite(data.quota) ? data.quota : undefined;
	const limitVal = quotaVal !== undefined && quotaVal > 0 ? quotaVal : undefined;
	const reportedRemaining =
		typeof data.remaining === "number" && Number.isFinite(data.remaining) ? data.remaining : undefined;
	const remainingVal = reportedRemaining ?? (limitVal !== undefined ? Math.max(0, limitVal - usedVal) : undefined);
	const usedFraction = limitVal !== undefined ? Math.min(1, Math.max(0, usedVal / limitVal)) : undefined;
	const remainingFraction = limitVal !== undefined ? Math.min(1, Math.max(0, 1 - (usedFraction ?? 0))) : undefined;

	const label =
		typeof data.current_month === "string" && data.current_month ? `Monthly (${data.current_month})` : "Monthly";
	const resetsAt = parseIsoTimestamp(data.resets_at) ?? nextMonthStartMs(Date.now());

	const amount: UsageAmount = { used: usedVal, unit: "usd" };
	if (limitVal !== undefined) amount.limit = limitVal;
	if (remainingVal !== undefined) amount.remaining = remainingVal;
	if (usedFraction !== undefined) amount.usedFraction = usedFraction;
	if (remainingFraction !== undefined) amount.remainingFraction = remainingFraction;

	const name = typeof data.name === "string" ? data.name : undefined;
	const exceeded = data.exceeded === true;
	const limit: UsageLimit = {
		id: "cliproxyapi:monthly",
		label,
		scope: {
			provider: PROVIDER,
			windowId: "monthly",
			...(name ? { accountId: name } : {}),
			shared: true,
		},
		window: { id: "monthly", label, durationMs: MONTHLY_WINDOW_MS, resetsAt },
		amount,
		status: exceeded ? "exhausted" : usedFraction !== undefined && usedFraction >= 0.9 ? "warning" : "ok",
	};

	return {
		provider: PROVIDER,
		fetchedAt: Date.now(),
		limits: [limit],
		metadata: {
			accountId: name,
			currentMonth: data.current_month,
		},
		raw: payload,
	};
}

export const cliproxyapiUsageProvider: UsageProvider = {
	id: PROVIDER,
	fetchUsage: fetchCliproxyapiUsage,
	supports: params => params.provider === PROVIDER,
	validatesCredentials: true,
};
