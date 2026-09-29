import { afterEach, beforeAll, describe, expect, it } from "bun:test";
import {
	bumpMarkdownRenderEpoch,
	ImageProtocol,
	Markdown,
	setCellDimensions,
	setTerminalImageProtocol,
	TERMINAL,
} from "@oh-my-pi/pi-tui";
import { setKittyGraphics } from "@oh-my-pi/pi-tui/kitty-graphics";
import { clearMathGraphicsCache, setMathGraphicsReadyHandler } from "@oh-my-pi/pi-tui/theme/math-cache";
import { getMarkdownTheme, getThemeByName, setMarkdownMathGraphics, setThemeInstance } from "@oh-my-pi/pi-tui/theme";
import { Settings } from "../../../src/config/settings";

const LATEX = String.raw`\hat{s}_{c,h}^{2023} = \frac{q_{c,h}^{2023} + \lambda_c \pi_{c,h}}{Q_c^{2023} + \lambda_c}`;

/** Resolve on the next math raster, or fail the test after a timeout. */
function nextRaster(): Promise<void> {
	return new Promise((resolve, reject) => {
		const timer = setTimeout(() => reject(new Error("math raster never landed")), 20_000);
		setMathGraphicsReadyHandler(() => {
			clearTimeout(timer);
			resolve();
		});
	});
}

function imageRows(lines: readonly string[]): string[] {
	return lines.filter(line => TERMINAL.isImageLine(line));
}

beforeAll(async () => {
	await Settings.init({ inMemory: true });
	const theme = await getThemeByName("dark");
	if (!theme) throw new Error("theme unavailable");
	setThemeInstance(theme);
	// The graphics path is gated on a Kitty terminal with Unicode placeholders.
	setTerminalImageProtocol(ImageProtocol.Kitty);
	setKittyGraphics({ unicodePlaceholders: true });
	setCellDimensions({ widthPx: 9, heightPx: 18 });
});

afterEach(() => {
	setMathGraphicsReadyHandler(undefined);
	setMarkdownMathGraphics(true);
	clearMathGraphicsCache();
});

describe("Math rendering setting", () => {
	it("renders display math as a terminal graphic once the raster lands", async () => {
		const markdown = new Markdown(`$$\n${LATEX}\n$$`, 0, 0, getMarkdownTheme());

		// The synchronous first pass has no raster yet, so the built-in Unicode
		// layout is drawn instead of a hole.
		expect(imageRows(markdown.render(100)).length).toBe(0);

		const ready = nextRaster();
		expect(imageRows(markdown.render(100)).length).toBe(0);
		await ready;

		// The host reacts by bumping the render epoch; simulate that here since no
		// `Tui` owns the cache in a test process.
		bumpMarkdownRenderEpoch();
		const rows = imageRows(markdown.render(100));
		expect(rows.length).toBeGreaterThan(0);
		expect(rows[0]).toContain("\x1b_G");
		for (const row of rows) expect(row.includes("\u{10eeee}")).toBe(true);
	});

	it("keeps the built-in Unicode layout when the setting is off", async () => {
		setMarkdownMathGraphics(false);
		const markdown = new Markdown(`$$\n${LATEX}\n$$`, 0, 0, getMarkdownTheme());
		expect(imageRows(markdown.render(100)).length).toBe(0);
		// The Unicode fallback still draws a fraction bar.
		expect(markdown.render(100).join("\n")).toContain("─");
	});

	it("falls back to Unicode when the terminal has no placeholder support", async () => {
		setKittyGraphics({ unicodePlaceholders: false });
		try {
			const markdown = new Markdown(`$$\n${LATEX}\n$$`, 0, 0, getMarkdownTheme());
			expect(imageRows(markdown.render(100)).length).toBe(0);
			expect(markdown.render(100).join("\n")).toContain("─");
		} finally {
			setKittyGraphics({ unicodePlaceholders: true });
		}
	});
});
