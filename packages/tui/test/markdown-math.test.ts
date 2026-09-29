import { describe, expect, it } from "bun:test";
import { stripVTControlCharacters } from "node:util";
import {
	bumpMarkdownRenderEpoch,
	Markdown,
	type MarkdownTheme,
	renderInlineMarkdown,
} from "../src/components/markdown";
import { KITTY_PLACEHOLDER } from "../src/kitty-graphics";
import { ImageProtocol, setTerminalImageProtocol, TERMINAL } from "../src/terminal-capabilities";
import { defaultMarkdownTheme } from "./test-themes.js";

// Image rows are only special-cased when a graphics protocol is active; without
// one the renderer would treat the placeholder cells as ordinary text.
setTerminalImageProtocol(ImageProtocol.Kitty);

/** Render markdown and return non-empty, ANSI-stripped, right-trimmed lines. */
function renderLines(md: string, width = 100): string[] {
	return new Markdown(md, 0, 0, defaultMarkdownTheme)
		.render(width)
		.map(line => stripVTControlCharacters(line).replace(/\s+$/, ""))
		.filter(line => line !== "");
}

describe("Markdown math rendering", () => {
	it("converts inline $…$ math inside prose", () => {
		const [line] = renderLines("the area is $A = \\pi r^2$ exactly");
		expect(line).toBe("the area is A = π r² exactly");
	});

	it("converts subscripts/superscripts in inline math without markdown mangling", () => {
		// `x_i^2` survives because intraword `_` is not emphasis and `^` is plain.
		const [line] = renderLines("energy $x_i^2 + y_j^2$ done");
		expect(line).toBe("energy xᵢ² + yⱼ² done");
	});

	it("renders an own-line $$…$$ matrix block as a bracketed grid", () => {
		const lines = renderLines("$$\n\\begin{bmatrix} a & b \\\\ c & d \\end{bmatrix}\n$$");
		// Two content rows around a centering gap row, in stretched brackets.
		expect(lines.length).toBe(3);
		expect(lines[0].startsWith("⎡")).toBe(true);
		expect(lines[lines.length - 1].endsWith("⎦")).toBe(true);
		expect(lines.join("").replace(/[\s⎡⎤⎢⎥⎣⎦]/g, "")).toBe("abcd");
	});

	it("stacks a \\[…\\] display quadratic formula with a drawn radical", () => {
		const lines = renderLines("\\[\nx = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}\n\\]");
		const barRow = lines.findIndex(line => line.includes("x ="));
		expect(barRow).toBeGreaterThan(1);
		expect(lines[barRow]).toContain("───");
		expect(lines[barRow - 1]).toContain("-b ± ╲│ b² - 4ac");
		expect(lines[barRow - 2]).toContain("┌");
		expect(lines[barRow + 1]).toContain("2a");
	});

	it("stacks a single-line $$…$$ display fraction in a reply paragraph", () => {
		// Models commonly emit display math on one line; it must still stack.
		const lines = renderLines("Here:\n\n$$\\frac{a+b}{c}$$\n\nDone.");
		const barRow = lines.findIndex(line => line.includes("─"));
		expect(barRow).toBeGreaterThan(0);
		expect(lines[barRow - 1]).toContain("a+b");
		expect(lines[barRow + 1]).toContain("c");
	});

	it("keeps display math inside a list item multi-line", () => {
		const lines = renderLines("- result:\n\n  $$\n  \\begin{bmatrix} a \\\\ b \\end{bmatrix}\n  $$");
		// The matrix rows must land on distinct lines (not flattened to "[a b]").
		const openRow = lines.findIndex(line => line.includes("⎡ a"));
		const closeRow = lines.findIndex(line => line.includes("b ⎦"));
		expect(openRow).toBeGreaterThanOrEqual(0);
		expect(closeRow).toBeGreaterThan(openRow);
	});

	it("leaves math inside an inline code span literal", () => {
		const [line] = renderLines("use `$x^2$` literally and $y^2$ as math");
		expect(line).toBe("use $x^2$ literally and y² as math");
	});

	it("leaves math inside a fenced code block literal", () => {
		const lines = renderLines("```\n$a$ and $b$\n```");
		expect(lines.some(l => l.includes("$a$ and $b$"))).toBe(true);
	});

	it("does not convert currency-style dollars", () => {
		const [line] = renderLines("it costs $5 and $10 total");
		expect(line).toBe("it costs $5 and $10 total");
	});

	it("closes a span at the first unescaped delimiter", () => {
		// `\\` is a TeX row break, so that `)` is body text, not the closer.
		const [paren] = renderLines(String.raw`prose \(x \\) y\) end`);
		expect(paren).toBe("prose x  ) y end");
		// An escaped dollar cannot end display math either.
		const [dollar] = renderLines(String.raw`$$a \$$ b$$`);
		expect(dollar).toBe("a $ b");
	});

	it("renderInlineMarkdown converts inline math", () => {
		const out = stripVTControlCharacters(renderInlineMarkdown("energy $E=mc^2$ here", defaultMarkdownTheme));
		expect(out).toBe("energy E=mc² here");
	});

	it("renderInlineMarkdown handles a top-level display math token", () => {
		// A bare $$…$$ becomes a top-level `math` token; it must not leak raw LaTeX.
		const out = stripVTControlCharacters(renderInlineMarkdown("$$E = mc^2$$", defaultMarkdownTheme));
		expect(out).toBe("E = mc²");
	});

	it("stacks a display $$…$$ fraction across multiple lines", () => {
		const lines = renderLines("$$\n\\frac{a+b}{c}\n$$");
		// numerator / bar / denominator
		const barRow = lines.findIndex(line => line.includes("─"));
		expect(barRow).toBeGreaterThan(0);
		expect(lines[barRow - 1]).toContain("a+b");
		expect(lines[barRow + 1]).toContain("c");
	});

	it("stacks fractions inside a bare \\begin{equation} block (mathEnvBlockExtension)", () => {
		const lines = renderLines("\\begin{equation}\nx = \\frac{a+b}{c}\n\\end{equation}");
		const barRow = lines.findIndex(line => line.includes("─"));
		expect(barRow).toBeGreaterThanOrEqual(0);
		expect(lines[barRow]).toContain("x =");
		expect(lines[barRow - 1]).toContain("a+b");
		expect(lines[barRow + 1]).toContain("c");
	});
});

describe("Markdown math graphics hook", () => {
	// A stand-in for a real raster: Kitap placeholder cells are ordinary text, so
	// the renderer must treat these rows as image rows — no wrapping, no margin,
	// no background padding — and centre them inside the content width.
	const graphic = (columns: number, rows: number) => ({
		columns,
		lines: Array.from({ length: rows }, () => KITTY_PLACEHOLDER.repeat(columns)),
	});

	const themeWith = (resolveMathGraphics: MarkdownTheme["resolveMathGraphics"]): MarkdownTheme => ({
		...defaultMarkdownTheme,
		resolveMathGraphics,
	});

	it("renders display math through the hook, centred and unwrapped", () => {
		const seen: Array<[string, boolean, number]> = [];
		const theme = themeWith((latex, display, maxWidthCells) => {
			seen.push([latex, display, maxWidthCells]);
			return graphic(4, 2);
		});
		const lines = new Markdown("$$\nE = mc^2\n$$", 0, 0, theme).render(40);
		expect(seen.length).toBe(1);
		expect(seen[0]?.[0]).toContain("E = mc^2");
		expect(seen[0]?.[1]).toBe(true);
		expect(seen[0]?.[2]).toBe(40);

		const imageRows = lines.filter(line => TERMINAL.isImageLine(line));
		expect(imageRows.length).toBe(2);
		// (40 - 4) / 2 = 18 leading cells on every row, so the rows stay aligned.
		for (const row of imageRows) expect(row.startsWith(" ".repeat(18))).toBe(true);
		// Placeholder rows must survive verbatim: no margin padding appended.
		for (const row of imageRows) expect(row.endsWith(KITTY_PLACEHOLDER)).toBe(true);
	});

	it("falls back to the Unicode layout when the hook declines", () => {
		const lines = new Markdown(
			"$$\n\\frac{a+b}{c}\n$$",
			0,
			0,
			themeWith(() => null),
		).render(60);
		const barRow = lines.findIndex(line => stripVTControlCharacters(line).includes("─"));
		expect(barRow).toBeGreaterThan(0);
	});

	it("keeps a graphic inside a list item unindented so its rows stay aligned", () => {
		const theme = themeWith(() => graphic(3, 2));
		const lines = new Markdown("$$\nx\n$$", 0, 0, theme);
		const rows = lines.render(30).filter(line => TERMINAL.isImageLine(line));
		expect(rows.length).toBe(2);
		expect(rows[0]?.length).toBe(rows[1]?.length);
	});

	it("re-renders cached rows after the render epoch is bumped", () => {
		let columns = 2;
		const theme = themeWith(() => graphic(columns, 1));
		const md = new Markdown("$$\nx\n$$", 0, 0, theme);
		const first = md.render(20);
		expect(first.filter(line => TERMINAL.isImageLine(line))[0]?.length).toBeGreaterThan(0);

		// Simulate a raster landing: the hook now answers differently, so cached
		// rows must be dropped rather than replayed.
		columns = 6;
		bumpMarkdownRenderEpoch();
		const second = md.render(20);
		const before = first.find(line => TERMINAL.isImageLine(line))?.length ?? 0;
		const after = second.find(line => TERMINAL.isImageLine(line))?.length ?? 0;
		expect(after).toBeGreaterThan(before);
	});
});
