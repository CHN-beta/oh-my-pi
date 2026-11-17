import { XDEV_URL_PREFIX } from "@oh-my-pi/pi-tui/tools/xdev-url";

/** Built-in tools whose availability depends on the selected memory backend. */
export const MEMORY_BACKEND_TOOL_NAMES = ["retain", "recall", "reflect", "memory_edit", "learn"] as const;

/**
 * Prompt references for memory tools: `xdev://<name>` when the tool is mounted
 * as an xdev:// device (the only way to call it), else its bare name.
 */
export function memoryToolRefs(mountedDevices: readonly { name: string }[] = []): Record<string, string> {
	const mounted = new Set(mountedDevices.map(device => device.name));
	return Object.fromEntries(
		MEMORY_BACKEND_TOOL_NAMES.map(name => [name, mounted.has(name) ? `${XDEV_URL_PREFIX}${name}` : name]),
	);
}

/**
 * {@link memoryToolRefs} for a tool session. Reads mounted names only: xdev://
 * device entries compute catalog summaries from tool descriptions, which would
 * recurse when called from a memory tool's own description getter.
 */
export function sessionMemoryToolRefs(session: {
	xdev?: { mountedNames: ReadonlySet<string> };
}): Record<string, string> {
	return memoryToolRefs([...(session.xdev?.mountedNames ?? [])].map(name => ({ name })));
}
