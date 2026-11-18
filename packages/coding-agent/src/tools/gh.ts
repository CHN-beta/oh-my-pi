import type { GhToolDetails } from "@oh-my-pi/pi-tui/tools/github";
import { type } from "@oh-my-pi/omptype";
import type {
	AgentTool,
	AgentToolContext,
	AgentToolResult,
	AgentToolUpdateCallback,
	ToolApprovalDecision,
} from "@oh-my-pi/pi-agent-core";

import {
	BINARY_SNIFF_BYTES,
	formatBytes,
	isProbablyBinaryHeader,
	parseImageMetadata,
	prompt,
	untilAborted,
} from "@oh-my-pi/pi-utils";
import githubDescription from "../prompts/tools/github.md" with { type: "text" };
import { github } from "../utils/github";
import { loadImageAttachmentInput } from "../utils/image-loading";
import { webpExclusionForModel } from "@oh-my-pi/pi-tui/chat/image-loading";
import type { ToolSession } from ".";
import {
	buildTextResult,
	defaultGhHost,
	ghApiHostArgs,
	normalizeOptionalString,
	parseRepoRef,
	requireNonEmpty,
	resolveGitHubRepo,
} from "./gh-common";
import { executePrCheckout, executePrCreate, executePrPush } from "./gh-pr-checkout";
import { executeRunWatch } from "./gh-run-watch";
import {
	executeSearchCode,
	executeSearchCommits,
	executeSearchIssues,
	executeSearchPrs,
	executeSearchRepos,
} from "./gh-search";
import { executeRepoView } from "./gh-view";

import { ToolError } from "@oh-my-pi/pi-tui/tools/tool-errors";
import { toolResult } from "./tool-result";

import { cfgImagesAutoResize } from "../modes/settings";

export { formatRepoRef, parsePositiveDecimalInt, resolveDefaultRepoMemoized } from "./gh-common";
export {
	getOrFetchPrDiff,
	getPinnedPrDiff,
	type PrDiffFile,
	type PrDiffLookupOptions,
	type PrDiffPayload,
	parsePrUnifiedDiff,
	retainPrDiffGeneration,
} from "./gh-pr-diff";
export { buildSearchDateQualifier, parseSearchDateBound } from "./gh-search";
export {
	getOrFetchIssue,
	getOrFetchPr,
	githubIssueJsonWithStateReasonFallback,
	type IssueViewLookupOptions,
	type PrViewLookupOptions,
	type ViewLookupResult,
} from "./gh-view";

const GITHUB_READONLY_OPS: ReadonlySet<string> = new Set([
	"repo_view",
	"file_read",
	"search_issues",
	"search_prs",
	"search_code",
	"search_commits",
	"search_repos",
	"run_watch",
]);

const githubSchema = type({
	op: type(
		"'repo_view' | 'file_read' | 'pr_create' | 'pr_checkout' | 'pr_push' | 'search_issues' | 'search_prs' | 'search_code' | 'search_commits' | 'search_repos' | 'run_watch'",
	).describe("GitHub action"),
	"repo?": type("string").describe("owner/repo slug"),
	"branch?": type("string").describe("branch name"),
	"path?": type("string").describe("repo-relative file path"),
	"pr?": type("string | string[]").describe("PR number, URL, or branch"),
	"force?": type("boolean").describe("overwrite existing local branch"),
	"forceWithLease?": type("boolean").describe("push with --force-with-lease"),
	"title?": type("string").describe("PR title"),
	"body?": type("string").describe("PR markdown body"),
	"base?": type("string").describe("PR target base branch"),
	"head?": type("string").describe("PR source head branch"),
	"draft?": type("boolean").describe("create PR as draft"),
	"fill?": type("boolean").describe("populate PR title/body from commit history"),
	"reviewer?": type("string[]").describe("requested reviewers"),
	"assignee?": type("string[]").describe("assigned users"),
	"label?": type("string[]").describe("issue/PR labels"),
	"query?": type("string").describe("search query string"),
	"since?": type("string").describe("start date filter"),
	"until?": type("string").describe("end date filter"),
	"dateField?": type("'created' | 'updated'").describe("timestamp field to filter"),
	"limit?": type("number").describe("maximum result count"),
	"run?": type("string").describe("Actions workflow run id or URL"),
	"tail?": type("number").describe("trailing log lines per failed job"),
});

type GithubInput = typeof githubSchema.infer;

interface GitHubContentsFile {
	type?: string;
	encoding?: string;
	size?: number;
	content?: string;
	html_url?: string | null;
}

type GitHubContentsResponse = GitHubContentsFile | GitHubContentsFile[];

function isGitHubContentsFile(response: GitHubContentsResponse): response is GitHubContentsFile {
	return !Array.isArray(response) && response.type === "file";
}

function buildBinaryFileReadResult(
	filePath: string,
	size: number,
	sourceUrl: string,
	repo: string,
	branch: string | undefined,
): AgentToolResult<GhToolDetails> {
	return buildTextResult(
		`[Cannot read binary file '${filePath}' (${formatBytes(size)}); not valid UTF-8 text. Open ${sourceUrl} to view it.]`,
		sourceUrl,
		{ repo, branch },
	);
}

export class GithubTool implements AgentTool<typeof githubSchema, GhToolDetails> {
	readonly name = "github";
	readonly approval = (args: unknown): ToolApprovalDecision => {
		const rawOp = (args as Partial<GithubInput>).op;
		const op = typeof rawOp === "string" ? rawOp : "";
		return GITHUB_READONLY_OPS.has(op) ? "read" : "exec";
	};
	readonly summary = "Work with GitHub repositories, files, pull requests, and Actions";
	readonly loadMode = "discoverable";
	readonly label = "GitHub";
	readonly description = prompt.render(githubDescription);
	readonly parameters = githubSchema;
	readonly strict = true;

	constructor(private readonly session: ToolSession) {}

	static createIf(session: ToolSession): GithubTool | null {
		if (!github.available()) return null;
		return new GithubTool(session);
	}

	async execute(
		_toolCallId: string,
		params: GithubInput,
		signal?: AbortSignal,
		onUpdate?: AgentToolUpdateCallback<GhToolDetails>,
		_context?: AgentToolContext,
	): Promise<AgentToolResult<GhToolDetails>> {
		return untilAborted(signal, async () => {
			switch (params.op) {
				case "repo_view":
					return executeRepoView(this.session, params, signal);
				case "file_read":
					return executeFileRead(this.session, params, signal);
				case "pr_create":
					return executePrCreate(this.session, params, signal);
				case "pr_checkout":
					return executePrCheckout(this.session, params, signal);
				case "pr_push":
					return executePrPush(this.session, params, signal);
				case "search_issues":
					return executeSearchIssues(this.session, params, signal);
				case "search_prs":
					return executeSearchPrs(this.session, params, signal);
				case "search_code":
					return executeSearchCode(this.session, params, signal);
				case "search_commits":
					return executeSearchCommits(this.session, params, signal);
				case "search_repos":
					return executeSearchRepos(this.session, params, signal);
				case "run_watch":
					return executeRunWatch(this.session, this.name, params, signal, onUpdate);
			}
		});
	}
}

async function executeFileRead(
	session: ToolSession,
	params: GithubInput,
	signal: AbortSignal | undefined,
): Promise<AgentToolResult<GhToolDetails>> {
	const repo = await resolveGitHubRepo(session.cwd, normalizeOptionalString(params.repo), undefined, signal);
	const filePath = requireNonEmpty(normalizeOptionalString(params.path), "path");
	if (filePath.startsWith("/")) {
		throw new ToolError("path must be repository-relative");
	}
	const branch = normalizeOptionalString(params.branch);
	const endpointPath = filePath
		.split("/")
		.map(segment => encodeURIComponent(segment))
		.join("/");
	const ref = parseRepoRef(repo);
	const args = [
		"api",
		...ghApiHostArgs(ref),
		`/repos/${ref.slug}/contents/${endpointPath}`,
		"--method",
		"GET",
		"-H",
		"Accept: application/vnd.github+json",
		"-H",
		"Accept-Encoding: identity",
	];
	if (branch) {
		args.push("-f", `ref=${branch}`);
	}
	let response: GitHubContentsResponse;
	try {
		response = await github.json<GitHubContentsResponse>(session.cwd, args, signal, {
			repoProvided: true,
			trimOutput: false,
		});
	} catch (error) {
		if (!(error instanceof ToolError)) throw error;
		// Contents API 404s conflate repository, revision, path, and access failures; identify the request without guessing.
		const revision = branch ?? "HEAD";
		throw new ToolError(
			`GitHub file read failed for '${repo}@${revision}:${filePath}': ${error.message}`,
			error.context,
		);
	}
	if (!isGitHubContentsFile(response)) {
		throw new ToolError(`GitHub path '${filePath}' is not a file.`);
	}

	// A host-less ref went to gh's default host, so the link has to match it.
	const fallbackHost = ref.host ?? defaultGhHost();
	const fallbackSourceUrl = `https://${fallbackHost}/${ref.slug}/blob/${encodeURIComponent(branch ?? "HEAD")}/${endpointPath}`;
	const sourceUrl = response.html_url || fallbackSourceUrl;
	if (response.encoding !== "base64" || typeof response.content !== "string") {
		const size =
			typeof response.size === "number" && response.size >= 0 ? formatBytes(response.size) : "unknown size";
		return buildTextResult(
			`[GitHub did not return file bytes for '${filePath}' (${size}). Open ${sourceUrl} to view it.]`,
			sourceUrl,
			{ repo, branch },
		);
	}

	const encoded = response.content.replaceAll(/\s/g, "");
	const bytes = Buffer.from(encoded, "base64");
	const imageMetadata = parseImageMetadata(bytes);
	if (imageMetadata) {
		const image = await loadImageAttachmentInput({
			image: { type: "image", data: encoded, mimeType: imageMetadata.mimeType },
			label: filePath,
			uri: sourceUrl,
			autoResize: cfgImagesAutoResize.get(session.settings),
			excludeWebP: webpExclusionForModel(session.getActiveModel?.()),
		});
		if (image) {
			const dimensions =
				imageMetadata.width !== undefined && imageMetadata.height !== undefined
					? `\nDimensions: ${imageMetadata.width}x${imageMetadata.height}`
					: "";
			return toolResult<GhToolDetails>({ repo, branch })
				.content([
					{
						type: "text",
						text: `Image file: ${filePath}\nMIME: ${image.mimeType}\nSize: ${formatBytes(bytes.byteLength)}${dimensions}`,
					},
					{ type: "image", data: image.data, mimeType: image.mimeType },
				])
				.sourceUrl(sourceUrl)
				.done();
		}
	}

	if (isProbablyBinaryHeader(bytes.subarray(0, BINARY_SNIFF_BYTES))) {
		return buildBinaryFileReadResult(filePath, bytes.byteLength, sourceUrl, repo, branch);
	}
	try {
		return buildTextResult(new TextDecoder("utf-8", { fatal: true }).decode(bytes), sourceUrl, { repo, branch });
	} catch {
		return buildBinaryFileReadResult(filePath, bytes.byteLength, sourceUrl, repo, branch);
	}
}
