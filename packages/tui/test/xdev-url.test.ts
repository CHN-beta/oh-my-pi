import { describe, expect, it } from "bun:test";
import { parseXdevUrl } from "../src/tools/xdev-url";

describe("parseXdevUrl", () => {
	it("parses a bare device URL", () => {
		expect(parseXdevUrl("xdev://wiki_observe")).toEqual({ name: "wiki_observe" });
	});

	it("keeps a trailing :raw or :conflicts suffix in the device name", () => {
		// Write dispatch uses this name. Peeling it would run `ast_edit` for
		// `xdev://ast_edit:raw` and turn `xdev://:raw` into the root listing.
		expect(parseXdevUrl("xdev://wiki_observe:raw")).toEqual({ name: "wiki_observe:raw" });
		expect(parseXdevUrl("xdev://wiki_observe:RAW")).toEqual({ name: "wiki_observe:RAW" });
		expect(parseXdevUrl("xdev://ast_edit:conflicts")).toEqual({ name: "ast_edit:conflicts" });
		expect(parseXdevUrl("xdev://:raw")).toEqual({ name: ":raw" });
	});

	it("rejects path and query characters", () => {
		expect(parseXdevUrl("xdev://wiki_observe/docs")).toBeNull();
		expect(parseXdevUrl("xdev://wiki_observe?q=1")).toBeNull();
	});
});
