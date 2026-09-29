import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import { setKittyGraphics } from "../src/kitty-graphics";
import { type MathRasterRequest, rasterizeLatex } from "../src/render/math-image";
import { ImageProtocol, setCellDimensions, setTerminalImageProtocol } from "../src/terminal-capabilities";
import { clearMathGraphicsCache, resolveMathGraphics, setMathGraphicsReadyHandler } from "../src/theme/math-cache";

/** Wait for one asynchronous raster to land, or fail the test after a timeout. */
function nextReady(): Promise<void> {
	return readyCounter().ready;
}

/** Install a ready handler that counts arrivals; `ready` resolves on the first. */
function readyCounter(): { ready: Promise<void>; count: () => number } {
	let resolveReady: (() => void) | undefined;
	let arrivals = 0;
	const ready = new Promise<void>((resolve, reject) => {
		const timer = setTimeout(() => reject(new Error("math raster never landed")), 20_000);
		resolveReady = () => {
			clearTimeout(timer);
			resolve();
		};
	});
	setMathGraphicsReadyHandler(() => {
		arrivals++;
		resolveReady?.();
	});
	return { ready, count: () => arrivals };
}

const FRACTION = String.raw`\frac{a+b}{c}`;

function request(overrides: Partial<MathRasterRequest> = {}): MathRasterRequest {
	return {
		latex: FRACTION,
		display: true,
		color: "#ffffff",
		emPx: 18,
		maxWidthPx: 800,
		maxHeightPx: 400,
		...overrides,
	};
}

beforeEach(() => {
	clearMathGraphicsCache();
	setTerminalImageProtocol(ImageProtocol.Kitty);
	setKittyGraphics({ unicodePlaceholders: true });
	setCellDimensions({ widthPx: 9, heightPx: 18 });
});

afterEach(() => {
	setMathGraphicsReadyHandler(undefined);
});

describe("rasterizeLatex", () => {
	it("typesets a fraction to a PNG", async () => {
		const raster = await rasterizeLatex(request());

		expect(raster).not.toBeNull();
		expect(raster!.widthPx).toBeGreaterThan(0);
		expect(raster!.heightPx).toBeGreaterThan(0);
		// Oversized on purpose so HiDPI terminals downsample a crisp bitmap.
		expect(raster!.deviceScale).toBeGreaterThan(1);
		expect(raster!.base64Data.startsWith("iVBOR")).toBe(true);
	});

	it("resolves the requested colour through MathJax currentColor", async () => {
		const red = await rasterizeLatex(request({ color: "#ff0000" }));
		const blue = await rasterizeLatex(request({ color: "#0000ff" }));
		expect(red).not.toBeNull();
		expect(blue).not.toBeNull();
		// Same geometry, different fills — the only thing colour can change is
		// the emitted pixels.
		expect(red!.widthPx).toBe(blue!.widthPx);
		expect(red!.heightPx).toBe(blue!.heightPx);
		expect(red!.base64Data).not.toBe(blue!.base64Data);
	});

	it("returns null instead of throwing for malformed LaTeX", async () => {
		expect(await rasterizeLatex(request({ latex: String.raw`\frac{a}{` }))).toBeNull();
		expect(await rasterizeLatex(request({ latex: String.raw`\notacommand{x}` }))).toBeNull();
	});

	it("returns null for empty input", async () => {
		expect(await rasterizeLatex(request({ latex: "   " }))).toBeNull();
	});
});

describe("resolveMathGraphics", () => {
	it("schedules one raster per formula and serves it from cache afterwards", async () => {
		const counter = readyCounter();

		// The first call is a miss: the synchronous caller falls back to text.
		expect(resolveMathGraphics(String.raw`x^2`, true, 60, "#ffffff")).toBeNull();
		// A second miss for the same formula must not schedule a duplicate render.
		expect(resolveMathGraphics(String.raw`x^2`, true, 60, "#ffffff")).toBeNull();
		await counter.ready;
		expect(counter.count()).toBe(1);

		const graphics = resolveMathGraphics(String.raw`x^2`, true, 60, "#ffffff");
		expect(graphics).not.toBeNull();
		expect(graphics!.columns).toBeGreaterThan(0);
		expect(graphics!.lines.length).toBeGreaterThan(0);
		// Line 0 carries the Kitty transmit so a formula never sent still displays.
		expect(graphics!.lines[0]).toContain("\x1b_G");
		for (const line of graphics!.lines) expect(line.includes("\u{10eeee}")).toBe(true);
	});

	it("computes the cell box without distorting the aspect ratio", async () => {
		setMathGraphicsReadyHandler(() => {});
		const latex = String.raw`\sum_{i=0}^{n} \frac{x_i^2}{\sqrt{y_i}} = \alpha`;
		resolveMathGraphics(latex, true, 40, "#ffffff");
		await nextReady();
		const graphics = resolveMathGraphics(latex, true, 40, "#ffffff");
		expect(graphics).not.toBeNull();
		// Placeholder rows are all the same width, and no row exceeds the budget.
		expect(graphics!.columns).toBeLessThanOrEqual(40);
		for (const line of graphics!.lines) {
			expect(line.split("\u{10eeee}").length - 1).toBe(graphics!.columns);
		}
	});

	it("never exceeds the available cell width for an over-wide formula", async () => {
		setMathGraphicsReadyHandler(() => {});
		const latex = String.raw`\displaystyle\sum_{i=0}^{n}\frac{x_i^2+y_i^2+z_i^2}{\sqrt{\alpha_i+\beta_i+\gamma_i}}`;
		resolveMathGraphics(latex, true, 10, "#ffffff");
		await nextReady();
		const graphics = resolveMathGraphics(latex, true, 10, "#ffffff");
		expect(graphics).not.toBeNull();
		expect(graphics!.columns).toBeLessThanOrEqual(10);
	});

	it("declines when the terminal cannot render Unicode placeholders", () => {
		setKittyGraphics({ unicodePlaceholders: false });
		expect(resolveMathGraphics(String.raw`x^2`, true, 60, "#ffffff")).toBeNull();
	});

	it("keeps answering null for a formula that cannot be typeset", async () => {
		setMathGraphicsReadyHandler(() => {});
		const latex = String.raw`\frac{a}{`;
		expect(resolveMathGraphics(latex, true, 60, "#ffffff")).toBeNull();
		await Bun.sleep(750);
		// The failure is cached, so no new render is scheduled and the fallback
		// stays in place instead of flapping.
		expect(resolveMathGraphics(latex, true, 60, "#ffffff")).toBeNull();
	});
});
