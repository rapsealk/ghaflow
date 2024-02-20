import * as core from "@actions/core";
import * as github from "@actions/github";
import { PullRequest, PullRequestEvent } from "@octokit/webhooks-types";

/**
 * The main function for the action.
 * @returns {Promise<void>} Resolves when the action is complete.
 */
export async function run(): Promise<void> {
  core.info("Hello, world!");
  switch (github.context.eventName) {
    case "pull_request": // https://docs.github.com/en/actions/using-workflows/events-that-trigger-workflows#pull_request
      const pullRequestEvent = github.context.payload as PullRequestEvent;
      if (pullRequestEvent.action === "opened") {
        onPullRequestOpened(pullRequestEvent.pull_request);
      }
      break;
    default:
      break;
  }
}

function onPullRequestOpened(pullRequest: PullRequest): void {
  core.info(
    `onPullRequestOpened(base:${pullRequest.base.ref}, head:${pullRequest.head})`
  );
  if (pullRequest.base.ref === "main") {
    const headRefBranchName = pullRequest.head.ref.replace(
      /^(refs\/heads\/)/,
      ""
    );
    const isFeatureBranch = headRefBranchName.startsWith("feature/");
    const isFixBranch = headRefBranchName.startsWith("fix/");
    if (!isFeatureBranch && !isFixBranch) {
      core.setFailed("Branch name does not start with `feature/` or `fix/`.");
    }
  }
}
