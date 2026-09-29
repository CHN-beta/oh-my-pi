import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import {
	bumpMarkdownRenderEpoch,
	KITTY_PLACEHOLDER,
	Markdown,
	type MarkdownTheme,
	TERMINAL,
	visibleWidth,
} from "@oh-my-pi/pi-tui";
import { setKittyGraphics } from "@oh-my-pi/pi-tui/kitty-graphics";
import { clearMathGraphicsCache, setMathGraphicsReadyHandler } from "@oh-my-pi/pi-tui/theme/math-cache";
import { ImageProtocol, setCellDimensions, setTerminalImageProtocol } from "@oh-my-pi/pi-tui/terminal-capabilities";
import { defaultMarkdownTheme } from "./test-themes.js";

const ORIGINAL_CELL_DIMENSIONS = { widthPx: 9, heightPx: 18 };

beforeEach(() => {
	clearMathGraphicsCache();
	setTerminalImageProtocol(ImageProtocol.Kitty);
	setKittyGraphics({ unicodePlaceholders: true });
	setCellDimensions({ ...ORIGINAL_CELL_DIMENSIONS });
});

afterEach(() => {
	clearMathGraphicsCache();
	setTerminalImageProtocol(null);
	setKittyGraphics({ unicodePlaceholders: false });
});

/** Terminal graphic rows, in order, with their placeholder-cell counts. */
function graphicRuns(lines: readonly string[]): number[] {
	return lines.filter(line => TERMINAL.isImageLine(line)).map(line => line.split(KITTY_PLACEHOLDER).length - 1);
}

/** A theme whose inline/display graphics are exactly `columns` cells wide. */
function fixedGraphicTheme(columns: number): MarkdownTheme {
	return {
		...defaultMarkdownTheme,
		resolveMathGraphics: () => ({ lines: [KITTY_PLACEHOLDER.repeat(columns)], columns }),
	};
}

const REFUSING_THEME: MarkdownTheme = {
	...defaultMarkdownTheme,
	resolveMathGraphics: () => null,
};

describe("inline math as a terminal graphic", () => {
	it("embeds the run in the line that holds it", () => {
		const lines = new Markdown("the area is $A$ exactly", 0, 0, fixedGraphicTheme(4)).render(40);
		expect(lines.length).toBe(1);
		const line = lines[0]!;
		expect(TERMINAL.isImageLine(line)).toBe(true);
		expect(line.split(KITTY_PLACEHOLDER).length - 1).toBe(4);
		// The surrounding prose survives on the same row — this is inline, not a
		// block — and the row is a normal text row, so it is padded to width.
		expect(Bun.stripANSI(line)).toContain("the area is");
		expect(Bun.stripANSI(line)).toContain("exactly");
		expect(visibleWidth(line)).toBe(40);
	});

	it("declines when the formula cannot fit where it starts", () => {
		// "abcdef " is 7 columns; only 3 remain of an 8-column row for a 4-cell run.
		const lines = new Markdown("abcdef $A$", 0, 0, fixedGraphicTheme(4)).render(8);
		expect(graphicRuns(lines)).toEqual([]);
		expect(Bun.stripANSI(lines.join("\n"))).toContain("A");
	});

	it("accepts a run that exactly fills the space left on the row", () => {
		// "abcdef " is 7 columns and the run is 3, so it ends on the last column.
		const lines = new Markdown("abcdef $A$", 0, 0, fixedGraphicTheme(3)).render(10);
		expect(graphicRuns(lines)).toEqual([3]);
		expect(visibleWidth(lines[0]!)).toBe(10);
	});

	it("never lets a wrap split a run, at any width", () => {
		const tail = "alpha beta gamma delta epsilon zeta eta theta iota kappa";
		for (let width = 12; width <= 60; width++) {
			const lines = new Markdown(`start $X$ ${tail}`, 0, 0, fixedGraphicTheme(5)).render(width);
			for (const line of lines) {
				if (!TERMINAL.isImageLine(line)) continue;
				// A split run would leave a partial placeholder band behind.
				expect(line.split(KITTY_PLACEHOLDER).length - 1).toBe(5);
			}
			for (const line of lines) expect(visibleWidth(line)).toBeLessThanOrEqual(width);
		}
	});

	it("keeps runs intact inside list items and blockquotes", () => {
		const listRows = new Markdown("- item $X$ tail", 0, 0, fixedGraphicTheme(3)).render(30);
		expect(graphicRuns(listRows)).toEqual([3]);

		const quoteRows = new Markdown("> quoted $X$ text", 0, 0, fixedGraphicTheme(3)).render(30);
		expect(graphicRuns(quoteRows)).toEqual([3]);
		// The quote border is outside the run, so the formula is not pushed over
		// the row budget by the two border cells.
		expect(Bun.stripANSI(quoteRows[0]!).startsWith("│")).toBe(true);
	});

	it("keeps the Unicode form inside table cells and headings", () => {
		const table = new Markdown("| a |\n| - |\n| $X$ |", 0, 0, fixedGraphicTheme(3)).render(30);
		expect(graphicRuns(table)).toEqual([]);

		const heading = new Markdown("# heading $X$", 0, 0, fixedGraphicTheme(3)).render(30);
		expect(graphicRuns(heading)).toEqual([]);
	});

	it("falls back to Unicode when the theme declines", () => {
		const lines = new Markdown("the area is $A = \\pi r^2$ exactly", 0, 0, REFUSING_THEME).render(40);
		expect(graphicRuns(lines)).toEqual([]);
		expect(Bun.stripANSI(lines[0]!)).toContain("A = π r²");
	});

	it("invalidates inline rows when a raster lands", () => {
		let columns = 2;
		const theme: MarkdownTheme = {
			...defaultMarkdownTheme,
			resolveMathGraphics: () => ({ lines: [KITTY_PLACEHOLDER.repeat(columns)], columns }),
		};
		const markdown = new Markdown("a $X$ b", 0, 0, theme);
		expect(graphicRuns(markdown.render(20))).toEqual([2]);

		columns = 6;
		bumpMarkdownRenderEpoch();
		expect(graphicRuns(markdown.render(20))).toEqual([6]);
	});
});

describe("inline math together with display math", () => {
	it("renders both in one message", async () => {
		const { rasterizeLatex } = await import("@oh-my-pi/pi-tui/render/math-image");
		const { resolveMathGraphics } = await import("@oh-my-pi/pi-tui/theme/math-cache");
		const theme: MarkdownTheme = {
			...defaultMarkdownTheme,
			resolveMathGraphics: (latex, display, maxWidthCells) =>
				resolveMathGraphics(latex, display, maxWidthCells, "#ffffff"),
		};

		const source = "In line: $\\alpha$ and $\\beta$.\n\n$$\\frac{a+b}{c}$$";
		clearMathGraphicsCache();
		setMathGraphicsReadyHandler(() => {});
		const markdown = new Markdown(source, 0, 0, theme);
		expect(graphicRuns(markdown.render(40))).toEqual([]);

		// Wait for every scheduled raster, then replay the render the way the TUI
		// does once its ready handler fires.
		const expected = ["\\alpha", "\\beta", "\\frac{a+b}{c}"];
		const deadline = Date.now() + 20_000;
		while (Date.now() < deadline) {
			await Bun.sleep(25);
			const ready = await Promise.all(
				expected.map(latex =>
					rasterizeLatex({
						latex,
						display: latex.includes("frac"),
						color: "#ffffff",
						emPx: 18,
						maxWidthPx: 40 * 9,
						maxHeightPx: 24 * 18,
					}),
				),
			);
			if (ready.every(Boolean)) break;
		}
		bumpMarkdownRenderEpoch();
		const lines = markdown.render(40);
		// One inline row (two runs on it) plus the three-row display fraction.
		expect(graphicRuns(lines).length).toBeGreaterThanOrEqual(2);
		const inlineRow = lines.find(line => line.includes("\u{10eeee}") && Bun.stripANSI(line).includes("In line:"));
		expect(inlineRow).toBeDefined();
		expect(inlineRow!.split(KITTY_PLACEHOLDER).length - 1).toBeGreaterThan(0);
	});
});
