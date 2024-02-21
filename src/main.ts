import * as core from "@actions/core";
import * as github from "@actions/github";
import { PullRequest, PullRequestEvent } from "@octokit/webhooks-types";

const GITHUB_TOKEN = core.getInput("github-token", { required: true });
const MAIN_BRANCH = core.getInput("main-branch") || "main";
const RELEASE_BRANCHES = core.getInput("release-branch").split(","); // comma-separated
// .map((regex) => RegExp(regex)); // regex

/**
 * The main function for the action.
 * @returns {Promise<void>} Resolves when the action is complete.
 */
export async function run(): Promise<void> {
  const octokit = github.getOctokit(GITHUB_TOKEN);
  if (github.context.eventName === "pull_request") {
    // https://docs.github.com/en/actions/using-workflows/events-that-trigger-workflows#pull_request
    const pullRequestEvent = github.context.payload as PullRequestEvent;
    if (pullRequestEvent.action === "opened") {
      onPullRequestOpened(pullRequestEvent.pull_request);
    }
  }
}

function onPullRequestOpened(pullRequest: PullRequest): void {
  const octokit = github.getOctokit(GITHUB_TOKEN);
  if (pullRequest.base.ref === MAIN_BRANCH) {
    const isHeadFeatureBranch = pullRequest.head.ref.startsWith("feature/");
    const isHeadFixBranch = pullRequest.head.ref.startsWith("fix/");
    if (!isHeadFeatureBranch && !isHeadFixBranch) {
      const message = "Branch name does not start with `feature/` or `fix/`.";
      core.setFailed(message);
      octokit.rest.issues.createComment({
        issue_number: github.context.issue.number,
        owner: github.context.repo.owner,
        repo: github.context.repo.repo,
        body: message,
      });
    }
  } else if (RELEASE_BRANCHES.includes(pullRequest.base.ref)) {
    if (!pullRequest.head.ref.startsWith("hotfix/")) {
      const message =
        "Only `hotfix/` branches are allowed to target release branch.";
      core.setFailed(message);
      octokit.rest.issues.createComment({
        issue_number: github.context.issue.number,
        owner: github.context.repo.owner,
        repo: github.context.repo.repo,
        body: message,
      });
    }
  }
}
