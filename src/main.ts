import * as core from "@actions/core";
import * as github from "@actions/github";
import { PullRequest, PullRequestEvent } from "@octokit/webhooks-types";

const GITHUB_TOKEN = core.getInput("github-token", { required: true });
const MAIN_BRANCH = core.getInput("main-branch", { required: true });
const RELEASE_BRANCHES = core.getInput("release-branch").split(","); // comma-separated

enum BranchPrefix {
  FEATURE = "feature",
  FIX = "fix",
  HOTFIX = "hotfix",
}

export async function run(): Promise<void> {
  if (github.context.eventName === "pull_request") {
    // https://docs.github.com/en/actions/using-workflows/events-that-trigger-workflows#pull_request
    const pullRequestEvent = github.context.payload as PullRequestEvent;
    switch (pullRequestEvent.action) {
      case "opened":
        await onPullRequestOpened(pullRequestEvent.pull_request);
        break;
      case "edited":
        await onPullReqeustEdited(pullRequestEvent.pull_request);
        break;
      default:
        break;
    }
  }
}

async function onPullRequestOpened(pullRequest: PullRequest): Promise<void> {
  if (pullRequest.base.ref === MAIN_BRANCH) {
    const isHeadFeatureBranch = pullRequest.head.ref.startsWith(
      BranchPrefix.FEATURE
    );
    const isHeadFixBranch = pullRequest.head.ref.startsWith(BranchPrefix.FIX);
    if (!isHeadFeatureBranch && !isHeadFixBranch) {
      const message = `Branch name does not start with \`${BranchPrefix.FEATURE}/\` or \`${BranchPrefix.FIX}/\`.`;
      core.setFailed(message);
      _createComment(message);
    }
  } else if (RELEASE_BRANCHES.includes(pullRequest.base.ref)) {
    await _checkHotfixBranchToReleaseBranch(pullRequest);
  }
}

async function onPullReqeustEdited(pullRequest: PullRequest): Promise<void> {
  await _checkHotfixBranchToReleaseBranch(pullRequest);
}

async function _checkHotfixBranchToReleaseBranch(
  pullRequest: PullRequest
): Promise<void> {
  if (!pullRequest.head.ref.startsWith(BranchPrefix.HOTFIX)) {
    return; // Ok: not a `hotfix` branch.
  }
  if (!RELEASE_BRANCHES.includes(pullRequest.base.ref)) {
    const message = `\`${BranchPrefix.HOTFIX}/*\` branches are allowed to target only \`${JSON.stringify(RELEASE_BRANCHES)}\` branch(es).`;
    core.setFailed(message);
    await _createComment(message);
    return;
  }
  // Ok: `hotfix` branch targets to `release` branch.
}

async function _createComment(body: string): Promise<void> {
  const octokit = github.getOctokit(GITHUB_TOKEN);
  await octokit.rest.issues.createComment({
    issue_number: github.context.issue.number,
    owner: github.context.repo.owner,
    repo: github.context.repo.repo,
    body: body,
  });
}
