import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import { Markdown, type MarkdownTheme, TUI } from "@oh-my-pi/pi-tui";
import { setKittyGraphics } from "@oh-my-pi/pi-tui/kitty-graphics";
import { ImageProtocol, setCellDimensions, setTerminalImageProtocol } from "@oh-my-pi/pi-tui/terminal-capabilities";
import { clearMathGraphicsCache, resolveMathGraphics } from "@oh-my-pi/pi-tui/theme/math-cache";
import { defaultMarkdownTheme } from "./test-themes.js";
import { withoutTerminalMultiplexer } from "./helpers/terminal-multiplexer";
import { VirtualRenderScheduler } from "./virtual-render-scheduler";
import { VirtualTerminal } from "./virtual-terminal";

withoutTerminalMultiplexer();

const LATEX = String.raw`\frac{q_{c,h}^{2023} + \lambda_c}{Q_c^{2023}}`;

const theme: MarkdownTheme = {
	...defaultMarkdownTheme,
	resolveMathGraphics: (latex, display, maxWidthCells) =>
		resolveMathGraphics(latex, display, maxWidthCells, "#c0caf5"),
};

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

/**
 * Drive real paints until `predicate` holds, or give up. The raster is produced
 * off-thread and the TUI repaints from its own ready handler, so the test has to
 * let the render loop run rather than await a promise the production code owns.
 */
async function settleUntil(
	terminal: VirtualTerminal,
	scheduler: VirtualRenderScheduler,
	predicate: () => boolean,
	timeoutMs = 20_000,
): Promise<boolean> {
	const deadline = Date.now() + timeoutMs;
	do {
		await Bun.sleep(25);
		await scheduler.settle(terminal);
		if (predicate()) return true;
	} while (Date.now() < deadline);
	return false;
}

describe("display math as a terminal graphic", () => {
	it("places a Kitty image once the raster lands", async () => {
		const terminal = new VirtualTerminal(90, 24);
		const scheduler = new VirtualRenderScheduler();
		const tui = new TUI(terminal, undefined, { renderScheduler: scheduler });
		const markdown = new Markdown(`$$\n${LATEX}\n$$`, 0, 0, theme);
		tui.start();
		tui.showOverlay(markdown, { fullscreen: true, width: "100%", maxHeight: "100%" });
		await scheduler.settle(terminal);

		// The first paint has no raster yet, so the Unicode layout is drawn and no
		// graphics placement reaches the terminal.
		expect(terminal.graphicsPlacements().length).toBe(0);
		expect(terminal.getViewport().join("\n")).toContain("─");

		const placed = await settleUntil(terminal, scheduler, () => terminal.graphicsPlacements().length > 0);
		expect(placed).toBe(true);

		const placements = terminal.graphicsPlacements();
		expect(placements.length).toBe(1);
		const placement = placements[0]!;
		expect(placement.imageId).toBeGreaterThan(0);
		// The placement covers exactly the cell box the raster was sized for.
		expect(placement.numCols).toBeGreaterThan(0);
		expect(placement.numCols).toBeLessThanOrEqual(90);
		expect(placement.numRows).toBeGreaterThan(0);
		// Unicode placeholders are what let the formula behave like text cells.
		expect(placement.unicodePlacement).toBe(true);

		tui.stop();
	});

	it("places an inline formula on its text row without wrapping it in half", async () => {
		const terminal = new VirtualTerminal(60, 24);
		const scheduler = new VirtualRenderScheduler();
		const tui = new TUI(terminal, undefined, { renderScheduler: scheduler });
		// Long enough that the trailing prose has to wrap, so the run shares a row
		// with text and is followed by a wrap boundary.
		const markdown = new Markdown(`prose before $\\alpha$ ${"trailing words ".repeat(4)}`, 0, 0, theme);
		tui.start();
		tui.showOverlay(markdown, { fullscreen: true, width: "100%", maxHeight: "100%" });
		await scheduler.settle(terminal);

		const placed = await settleUntil(terminal, scheduler, () => terminal.graphicsPlacements().length > 0);
		expect(placed).toBe(true);

		const placements = terminal.graphicsPlacements();
		expect(placements.length).toBe(1);
		// The graphic lives on a text row: it is one cell tall, and prose is
		// painted on the same row on both sides of it.
		expect(placements[0]!.numRows).toBe(1);
		const viewport = terminal.getViewport();
		const row = viewport.find(line => line.includes("prose before"));
		expect(row).toBeDefined();
		expect(row).toContain("trailing");

		tui.stop();
	});

	it("keeps the Unicode layout when the terminal cannot place graphics", async () => {
		setKittyGraphics({ unicodePlaceholders: false });
		const terminal = new VirtualTerminal(90, 24);
		const scheduler = new VirtualRenderScheduler();
		const tui = new TUI(terminal, undefined, { renderScheduler: scheduler });
		tui.start();
		tui.showOverlay(new Markdown(`$$\n${LATEX}\n$$`, 0, 0, theme), {
			fullscreen: true,
			width: "100%",
			maxHeight: "100%",
		});
		await scheduler.settle(terminal);
		await Bun.sleep(250);
		await scheduler.settle(terminal);

		expect(terminal.graphicsPlacements().length).toBe(0);
		expect(terminal.getViewport().join("\n")).toContain("─");
		tui.stop();
	});
});
