/**
 * LaTeX → PNG rasterizer for terminal math graphics.
 *
 * Two stages, both in-process:
 *
 *   LaTeX ──MathJax──▶ SVG ──resvg (pi-natives)──▶ PNG
 *
 * MathJax runs with its *local* font cache, so every glyph is emitted as an
 * inline `<path>` and the SVG carries no font dependency. `rasterizeSvg` from
 * `@oh-my-pi/pi-natives` (the same resvg/usvg pipeline the file-preview and
 * git-TUI SVG paths use) then rasterizes it off the main thread, so no new
 * native surface and no external TeX/LaTeX binary is required.
 *
 * MathJax is a ~2.5 MB JavaScript dependency, and every launch without a
 * formula must not pay for it. The module is therefore pulled in through a
 * lazy `require()` on the first render: Bun keeps the bundled copy unevaluated
 * until that call, so a session that never shows math never parses it.
 *
 * Sizing follows MathJax's own conventions: the root `<svg>` reports
 * `width`/`height` in `ex`, and one `ex` is half an em, so the px size is
 * `ex * (emPx / 2)`. Rasters are produced at {@link DEVICE_SCALE}× the logical
 * cell box because terminal cell metrics are logical pixels on HiDPI displays;
 * the terminal downsamples the extra resolution back onto the cell grid.
 */

import { rasterizeSvg } from "@oh-my-pi/pi-natives";
import { getPngDimensions } from "../terminal-capabilities";

/** Largest LaTeX source accepted, in characters. Bounds pathological input. */
const MAX_LATEX_LENGTH = 20_000;

/**
 * Rasterization multiplier over the logical cell box. Terminal cell metrics
 * are logical pixels, so a 1× raster looks soft on HiDPI displays; the
 * terminal scales the oversized bitmap back down onto the cell grid.
 */
const DEVICE_SCALE = 2;

/** Hard ceiling for either raster edge, matching the native render limit. */
const MAX_RASTER_EDGE_PX = 4096;

/** Fallback colour when the caller supplies something unparseable. */
const DEFAULT_COLOR = "#ffffff";

export interface MathRaster {
	/** Base64 PNG bytes, ready for the Kitty graphics protocol. */
	readonly base64Data: string;
	readonly widthPx: number;
	readonly heightPx: number;
	/**
	 * Pixels per logical pixel. The raster is deliberately oversized for HiDPI
	 * crispness, so callers converting to terminal cells must divide the pixel
	 * size by `cellPx * deviceScale` to get the cell box to display it in.
	 */
	readonly deviceScale: number;
	/**
	 * Shrink factor applied to fit the requested box, `1` when the formula was
	 * rendered at its natural size. Inline callers use it to reject formulas
	 * that only fit on one text row by being shrunk to illegibility.
	 */
	readonly fitScale: number;
}

/**
 * A ready-to-emit terminal graphic for one formula.
 *
 * `lines` are final frame rows — Kitty Unicode-placeholder cells, which are
 * ordinary text cells, so they survive the renderer's slicing and reflow. The
 * rows carry their own SGR state and must not be re-styled by the caller.
 */
export interface MathGraphics {
	readonly lines: readonly string[];
	/** Width the block occupies in terminal cells, for centring and clipping. */
	readonly columns: number;
}

export interface MathRasterRequest {
	readonly latex: string;
	/** Display math (`$$…$$`, `\[…\]`) versus inline (`$…$`). */
	readonly display: boolean;
	/** Foreground colour as `#rrggbb`, applied through MathJax's `currentColor`. */
	readonly color: string;
	/** One em in device pixels — the terminal's font size. */
	readonly emPx: number;
	/** Box the raster must fit, in device pixels. */
	readonly maxWidthPx: number;
	readonly maxHeightPx: number;
}

interface MathJaxDocument {
	convert(source: string, options: Record<string, unknown>): unknown;
}

interface MathJaxAdaptor {
	innerHTML(node: unknown): string;
}

interface MathJaxConstructor {
	document(input: string, options: Record<string, unknown>): MathJaxDocument;
}

type MathJaxAdaptorFactory = (options: Record<string, unknown>) => MathJaxAdaptor;
interface MathJaxHandlerRegistrar {
	(adaptor: MathJaxAdaptor): void;
}
interface MathJaxJaxConstructor {
	new (options: Record<string, unknown>): unknown;
}

interface MathJaxBundle {
	readonly adaptor: MathJaxAdaptor;
	readonly document: MathJaxDocument;
}

/**
 * `undefined` until the first successful load, `null` when loading failed
 * (missing dependency, incompatible runtime). A failed load is never retried:
 * every formula after it falls straight back to text rendering.
 */
let mathJax: MathJaxBundle | null | undefined;

/**
 * Evaluate MathJax on first use. Kept out of module scope deliberately: a
 * static import would add its parse and evaluation cost to every launch, and
 * most sessions never render a formula.
 */
function loadMathJax(): MathJaxBundle | null {
	if (mathJax !== undefined) return mathJax;
	try {
		// Deliberate lazy `require`: the bundler keeps `mathjax-full` bundled but
		// unevaluated until this call. See the module header.
		const mathjax = require("mathjax-full/js/mathjax.js").mathjax as MathJaxConstructor | undefined;
		const TeX = require("mathjax-full/js/input/tex.js").TeX as MathJaxJaxConstructor | undefined;
		const SVG = require("mathjax-full/js/output/svg.js").SVG as MathJaxJaxConstructor | undefined;
		const liteAdaptor = require("mathjax-full/js/adaptors/liteAdaptor.js").liteAdaptor as
			| MathJaxAdaptorFactory
			| undefined;
		const RegisterHTMLHandler = require("mathjax-full/js/handlers/html.js").RegisterHTMLHandler as
			| MathJaxHandlerRegistrar
			| undefined;
		const AllPackages = require("mathjax-full/js/input/tex/AllPackages.js").AllPackages as string[] | undefined;
		// These are untyped JavaScript entry points; validate the shapes this module
		// consumes instead of trusting them.
		if (
			typeof mathjax?.document !== "function" ||
			!TeX ||
			!SVG ||
			!liteAdaptor ||
			!RegisterHTMLHandler ||
			!Array.isArray(AllPackages)
		) {
			mathJax = null;
			return mathJax;
		}
		const adaptor = liteAdaptor({ cjkCharWidth: 1, unknownCharWidth: 0.6, unknownCharHeight: 0.8 });
		RegisterHTMLHandler(adaptor);
		const input = new TeX({
			// `html` would parse raw HTML in math, `noerrors`/`noundefined` would
			// silently swallow malformed source instead of failing it.
			packages: AllPackages.filter(name => name !== "html" && name !== "noerrors" && name !== "noundefined"),
			maxBuffer: MAX_LATEX_LENGTH,
			maxMacros: 1_000,
			tags: "none",
			formatError: (_jax: unknown, error: Error) => {
				throw error;
			},
		});
		const output = new SVG({ fontCache: "local", mtextInheritFont: true, unknownFamily: "serif" });
		mathJax = { adaptor, document: mathjax.document("", { InputJax: input, OutputJax: output }) };
	} catch {
		mathJax = null;
	}
	return mathJax;
}

function normalizeColor(color: string | undefined): string {
	return color && /^#[\da-f]{6}$/i.test(color) ? color.toLowerCase() : DEFAULT_COLOR;
}

/** First `<svg …>` opening tag inside a MathJax container, with its geometry. */
function readMathJaxSvg(container: string): { source: string; widthEx: number; heightEx: number } | null {
	const start = container.indexOf("<svg");
	const end = container.lastIndexOf("</svg>");
	if (start < 0 || end < start) return null;
	const source = container.slice(start, end + 6);
	const widthEx = /width="([\d.]+)ex"/.exec(source)?.[1];
	const heightEx = /height="([\d.]+)ex"/.exec(source)?.[1];
	if (widthEx === undefined || heightEx === undefined) return null;
	const width = Number.parseFloat(widthEx);
	const height = Number.parseFloat(heightEx);
	if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) return null;
	return { source, widthEx: width, heightEx: height };
}

/**
 * Wrap MathJax's `<svg>` in a canvas of exactly `width`×`height` pixels.
 *
 * The outer element supplies the pixel geometry and the `color` that
 * MathJax's `currentColor` fills resolve against; the inner element keeps
 * MathJax's own `viewBox` (which is expressed in MathJax units and already
 * accounts for the italic/descender margins) so scaling stays correct.
 * Presentation-only attributes (`style`, `width`, `height`, `overflow`) are
 * stripped from the inner element so nothing overrides the canvas.
 */
function wrapSvg(source: string, color: string, width: number, height: number): string | null {
	const openingEnd = source.indexOf(">");
	if (openingEnd < 0) return null;
	const opening = source
		.slice(0, openingEnd + 1)
		.replace(/^<svg\s*/, "")
		.replace(/\s(?:width|height|x|y|color|style|overflow)="[^"]*"/g, "")
		.replace(/>$/, "")
		.trim();
	const body = source.slice(openingEnd + 1, -6);
	return [
		`<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"`,
		` width="${width}" height="${height}" color="${color}" viewBox="0 0 ${width} ${height}">`,
		`<svg x="0" y="0" width="${width}" height="${height}" overflow="visible" ${opening}>`,
		body,
		"</svg></svg>",
	].join("");
}

/**
 * Rasterize one LaTeX formula to a PNG.
 *
 * Returns `null` — never throws — for empty/invalid LaTeX, unavailable
 * MathJax, a raster outside the supported size range, or a native render
 * failure. Callers fall back to the built-in Unicode layout on `null`.
 */
export async function rasterizeLatex(request: MathRasterRequest): Promise<MathRaster | null> {
	const latex = request.latex.trim();
	if (latex.length === 0 || latex.length > MAX_LATEX_LENGTH) return null;
	const bundle = loadMathJax();
	if (!bundle) return null;

	const emPx = Math.max(1, request.emPx);
	const exPx = emPx / 2;
	const availableWidthPx = Math.max(1, request.maxWidthPx);
	const availableHeightPx = Math.max(1, request.maxHeightPx);

	let container: string;
	try {
		// `containerWidth` bounds MathJax's own display-math line breaking, so a
		// long formula wraps internally instead of overflowing the raster.
		const node = bundle.document.convert(latex, {
			display: request.display,
			em: emPx,
			ex: exPx,
			containerWidth: availableWidthPx,
		});
		container = bundle.adaptor.innerHTML(node);
	} catch {
		return null;
	}

	const svg = readMathJaxSvg(container);
	if (!svg) return null;

	const contentWidthPx = svg.widthEx * exPx;
	const contentHeightPx = svg.heightEx * exPx;
	// Shrink to fit the box, never enlarge: a formula narrower than the box must
	// keep its natural size instead of being stretched to the full width.
	const fit = Math.min(availableWidthPx / contentWidthPx, availableHeightPx / contentHeightPx, 1);
	if (!Number.isFinite(fit) || fit <= 0) return null;

	const widthPx = Math.max(1, Math.round(contentWidthPx * fit * DEVICE_SCALE));
	const heightPx = Math.max(1, Math.round(contentHeightPx * fit * DEVICE_SCALE));
	// The native side caps the product at 16M pixels; reject early so a caller
	// gets the text fallback instead of a thrown error.
	if (widthPx > MAX_RASTER_EDGE_PX || heightPx > MAX_RASTER_EDGE_PX || widthPx * heightPx > 16 * 1024 * 1024)
		return null;

	const canvas = wrapSvg(svg.source, normalizeColor(request.color), widthPx, heightPx);
	if (!canvas) return null;

	try {
		// `rasterizeSvg` may be absent on an addon older than this build: the
		// native package stubs missing exports with a throwing placeholder, which
		// the catch below turns into the text fallback.
		const png: Uint8Array = await rasterizeSvg(Buffer.from(canvas, "utf8"), widthPx, heightPx);
		if (!png || png.length === 0) return null;
		const base64Data = Buffer.from(png).toString("base64");
		// Trust the encoded PNG over the requested box: the native rasterizer
		// rounds its own output size.
		const dimensions = getPngDimensions(base64Data) ?? { widthPx, heightPx };
		return {
			base64Data,
			widthPx: dimensions.widthPx,
			heightPx: dimensions.heightPx,
			deviceScale: DEVICE_SCALE,
			fitScale: fit,
		};
	} catch {
		return null;
	}
}
