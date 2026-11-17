/** Canonical prefix for virtual tool-device URLs. */
export const XDEV_URL_PREFIX = "xdev://";

/** Returns the canonical tool name from a bare or `xdev://`-prefixed spelling. */
export function stripXdevUrlPrefix(name: string): string {
	return name.toLowerCase().startsWith(XDEV_URL_PREFIX) ? name.slice(XDEV_URL_PREFIX.length) : name;
}

/**
 * `xdev://` spelled in a tool-name charset without `:` or `/` (Anthropic allows
 * `[a-zA-Z0-9_-]`): models substitute underscores, so `xdev://recall` arrives as
 * `xd_recall`, `xdev__recall` or `xd___recall`.
 */
const XDEV_UNDERSCORE_PREFIX = /^xdev_+/i;

/** Returns `name` without an underscore-spelled `xdev://` prefix. */
export function stripXdevUnderscorePrefix(name: string): string {
	return name.replace(XDEV_UNDERSCORE_PREFIX, "");
}

/**
 * Parse an `xdev://` URL into its device target.
 * Returns `null` for other or malformed URLs and `name: null` for the root.
 *
 * A trailing `:raw` / `:A-B` stays in the name: the router peels read
 * selectors before the handler sees the URL, and `write` refuses a selector on
 * a device URL rather than peeling it, so approval and dispatch name the same
 * device.
 */
export function parseXdevUrl(input: string): { name: string | null } | null {
	const trimmed = input.trim();
	if (!trimmed.toLowerCase().startsWith(XDEV_URL_PREFIX)) return null;
	const name = trimmed.slice(XDEV_URL_PREFIX.length);
	if (name.length === 0) return { name: null };
	if (/[/?#]/.test(name)) return null;
	return { name };
}

/**
 * Parse a read-only `xdev://<tool>/<topic>` documentation URL.
 * Returns `null` for anything else, including bare device URLs.
 */
export function parseXdevTopicUrl(input: string): { name: string; topic: string } | null {
	const match = /^xdev:\/\/([^/?#]+)\/([^/?#]+)$/i.exec(input.trim());
	return match ? { name: match[1]!, topic: match[2]! } : null;
}

/** Whether a streaming path prefix could still become an `xdev://` URL. */
export function couldBecomeXdevUrl(partialPath: string): boolean {
	if (partialPath.length <= XDEV_URL_PREFIX.length) {
		return XDEV_URL_PREFIX.startsWith(partialPath.toLowerCase());
	}
	return partialPath.toLowerCase().startsWith(XDEV_URL_PREFIX);
}
