/**
 * Resolve LaTeX formulas to terminal graphics for the Markdown renderer.
 *
 * Markdown rendering is synchronous and runs on every streamed delta, while
 * rasterizing a formula is asynchronous. This module bridges the two: the
 * synchronous {@link resolveMathGraphics} answers from an LRU of finished
 * rasters and, on a miss, starts the raster in the background and reports
 * `null` so the caller draws the built-in Unicode layout for that frame. When
 * the raster lands, {@link setMathGraphicsReadyHandler} fires so the host can
 * drop its rendered-line caches and repaint — the formula then appears as an
 * image on the next frame.
 *
 * Graphics are emitted as Kitty *Unicode placeholder* cells: the image is
 * transmitted once under a stable id and then referenced by ordinary text
 * cells, so a formula behaves like text during slicing, reflow and repaint
 * instead of needing cursor-positioned placement. Terminals without that
 * support fall back to text permanently.
 */

import { LRUCache } from "@oh-my-pi/pi-utils/lru";
import { getKittyGraphics, renderKittyPlaceholderLines } from "../kitty-graphics";
import { type MathGraphics, rasterizeLatex } from "../render/math-image";
import { encodeKittyTransmit, getCellDimensions, ImageProtocol, TERMINAL } from "../terminal-capabilities";

/**
 * Tallest display formula, in terminal rows. A large matrix or `align`
 * environment would otherwise push the surrounding prose off screen.
 */
const MAX_DISPLAY_ROWS = 24;

/**
 * Smallest shrink an *inline* formula may receive and still be worth showing as
 * a graphic. An inline graphic has to fit inside one text row, so it is scaled
 * to the row's height; a formula whose natural height is much more than a row
 * (a matrix, a stacked system, a display-style operator with limits) would end
 * up an illegible smudge, and keeps the Unicode form instead. Ordinary single
 * line math — scripts, roots, accents, text-style fractions — sits between
 * 1.0 and 1.6 rows naturally and passes.
 */
const MIN_INLINE_FIT_SCALE = 0.6;

/** Bounded by entry count and by the retained placeholder rows. */
const CACHE_MAX = 128;
const CACHE_MAX_SIZE = 8 * 1024 * 1024;
const CACHE_MAX_ENTRY_SIZE = 512 * 1024;

/** Cached outcome for one `(latex, display, colour, cell box, width)` tuple. */
type MathCacheEntry = { readonly kind: "ready"; readonly graphics: MathGraphics } | { readonly kind: "failed" };

const cache = new LRUCache<string, MathCacheEntry>({
	max: CACHE_MAX,
	maxSize: CACHE_MAX_SIZE,
	maxEntrySize: CACHE_MAX_ENTRY_SIZE,
	sizeCalculation: (entry, key) =>
		key.length + (entry.kind === "ready" ? entry.graphics.lines.reduce((sum, line) => sum + line.length, 0) : 1),
});

/** Keys with a raster in flight, so a miss schedules exactly one render. */
const pending = new Set<string>();

let readyHandler: (() => void) | undefined;

/**
 * Invoked once per successfully rasterized formula, after the entry is cached.
 * The host uses it to invalidate rendered lines and schedule a repaint.
 */
export function setMathGraphicsReadyHandler(handler: (() => void) | undefined): void {
	readyHandler = handler;
}

let nextImageId = Math.floor(Math.random() * 0xffffff);

/**
 * Kitty image id per `(latex, display, colour)`, deliberately excluding the cell
 * box. A terminal resize then re-transmits under the same id and placement, so
 * the terminal replaces the placement in place instead of accumulating one
 * stored image per width the session has ever been viewed at.
 */
const imageIds = new Map<string, number>();
const IMAGE_ID_MAX = 512;

/** Stable, collision-free-enough Kitty image id (see {@link imageIds}). */
function imageIdFor(latex: string, display: boolean, color: string): number {
	const identity = `${display ? "d" : "i"}|${color}|${latex}`;
	const existing = imageIds.get(identity);
	if (existing !== undefined) return existing;
	// Step by 0x10000 so the low byte stays free, mirroring the inline-image
	// budget's id allocation in `components/image.ts`.
	nextImageId = (nextImageId + 0x10000) & 0xffffff;
	const id = nextImageId || 1;
	if (imageIds.size >= IMAGE_ID_MAX) {
		// Evict oldest; the terminal keeps the retired image until it purges it,
		// but its rows are gone and its id is never reused.
		const oldest = imageIds.keys().next();
		if (!oldest.done) imageIds.delete(oldest.value);
	}
	imageIds.set(identity, id);
	return id;
}

/** One em in device pixels. Terminal cell metrics are the only font hint available. */
function emPx(): number {
	const override = Number.parseFloat(Bun.env.PI_MATH_EM_SCALE ?? "");
	const scale = Number.isFinite(override) && override > 0 ? override : 1;
	return Math.max(1, Math.round(getCellDimensions().heightPx * scale));
}

/** Whether formulas can be shown as graphics on this terminal at all. */
export function mathGraphicsSupported(): boolean {
	return TERMINAL.imageProtocol === ImageProtocol.Kitty && getKittyGraphics().unicodePlaceholders;
}

function cacheKey(latex: string, display: boolean, color: string, maxWidthCells: number, cell: CellBox): string {
	return `${display ? "d" : "i"}|${color}|${cell.emPx}|${cell.widthPx}x${cell.heightPx}|${maxWidthCells}|${latex}`;
}

interface CellBox {
	readonly emPx: number;
	readonly widthPx: number;
	readonly heightPx: number;
}

/**
 * Turn a raster into placeholder rows. Line 0 carries the one-time transmit, so
 * a formula that was never sent still displays — the transmit is idempotent
 * and replaces the stored image under the same id.
 */
function placeRaster(
	raster: { base64Data: string; widthPx: number; heightPx: number; deviceScale: number; fitScale: number },
	cell: CellBox,
	maxWidthCells: number,
	imageId: number,
	inline: boolean,
): MathGraphics | null {
	// An inline formula must not be shrunk just to fit the single row it lives
	// on — that trades a readable Unicode span for an illegible image.
	if (inline && raster.fitScale < MIN_INLINE_FIT_SCALE) return null;

	const scale = raster.deviceScale || 1;
	const columns = Math.min(maxWidthCells, Math.max(1, Math.ceil(raster.widthPx / (cell.widthPx * scale))));
	// Kitty scales the image into the `c`×`r` cell box, so the box has to carry
	// the raster's aspect ratio or the formula is squashed. Derive the row count
	// from the column count rather than rounding both independently — except
	// inline, where the box is exactly one row by definition.
	const rows = inline
		? 1
		: Math.max(1, Math.round((columns * cell.widthPx * raster.heightPx) / (raster.widthPx * cell.heightPx)));

	const lines = renderKittyPlaceholderLines({ imageId, placementId: imageId, columns, rows });
	if (lines.length === 0) return null;
	lines[0] = encodeKittyTransmit(raster.base64Data, imageId) + lines[0];
	return { lines, columns };
}

/**
 * Terminal graphic for a formula, or `null` when the caller should fall back to
 * the Unicode layout. Never throws and never blocks: a miss returns `null` and
 * schedules the raster.
 */
export function resolveMathGraphics(
	latex: string,
	display: boolean,
	maxWidthCells: number,
	color: string,
): MathGraphics | null {
	const source = latex.trim();
	if (source.length === 0 || maxWidthCells < 1) return null;
	if (!mathGraphicsSupported()) return null;

	const cell: CellBox = {
		emPx: emPx(),
		// Integer cell metrics keep `columns = widthPx / (cellWidthPx * scale)`
		// exact, so an exactly-fitting formula can never round up past the width
		// budget and get clipped.
		widthPx: Math.max(1, Math.floor(getCellDimensions().widthPx)),
		heightPx: Math.max(1, Math.floor(getCellDimensions().heightPx)),
	};
	const key = cacheKey(source, display, color, maxWidthCells, cell);
	const cached = cache.get(key);
	if (cached !== undefined) return cached.kind === "ready" ? cached.graphics : null;
	if (pending.has(key)) return null;

	pending.add(key);
	void rasterizeLatex({
		latex: source,
		display,
		color,
		emPx: cell.emPx,
		maxWidthPx: maxWidthCells * cell.widthPx,
		maxHeightPx: (display ? MAX_DISPLAY_ROWS : 1) * cell.heightPx,
	})
		.then(raster => {
			const graphics = raster
				? placeRaster(raster, cell, maxWidthCells, imageIdFor(source, display, color), !display)
				: null;
			// Cache failures too: a formula MathJax cannot typeset must not be
			// retried on every frame for the rest of the session.
			cache.set(key, graphics ? { kind: "ready", graphics } : { kind: "failed" });
			if (graphics) readyHandler?.();
		})
		.catch(() => {
			cache.set(key, { kind: "failed" });
		})
		.finally(() => {
			pending.delete(key);
		});

	return null;
}

/** Drop every cached graphic and in-flight marker (settings or theme change). */
export function clearMathGraphicsCache(): void {
	cache.clear();
	pending.clear();
	imageIds.clear();
}
