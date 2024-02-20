import * as core from "@actions/core";
import * as github from "@actions/github";
import {
  PullRequest,
  PullRequestEvent,
  PushEvent,
} from "@octokit/webhooks-types";

/**
 * The main function for the action.
 * @returns {Promise<void>} Resolves when the action is complete.
 */
export async function run(): Promise<void> {
  core.info("Hello, world!");
  core.info(`github.context.eventName: ${github.context.eventName}`);
  switch (github.context.eventName) {
    case "pull_request": // https://docs.github.com/en/actions/using-workflows/events-that-trigger-workflows#pull_request
      const pullRequestEvent = github.context.payload as PullRequestEvent;
      // if (pullRequestEvent.action === "opened") {
      //   onPullRequestOpened(pullRequestEvent.pull_request);
      // }
      core.info(JSON.stringify(github.context.payload));
      core.info(`github.context.payload.action: ${pullRequestEvent.action}`);
      onPullRequestOpened(pullRequestEvent.pull_request);
      break;
    case "push": // https://docs.github.com/en/actions/using-workflows/events-that-trigger-workflows#push
      const pushEvent = github.context.payload as PushEvent;
      core.info(`github.context.payload.ref: ${pushEvent.ref}`);
      break;
    default:
      break;
  }
}

function onPullRequestOpened(pullRequest: PullRequest): void {
  core.info(
    `onPullRequestOpened(base:${pullRequest.base.ref}, head:${pullRequest.head})`
  );
  const baseRefBranchName = parseBranchName(pullRequest.base.ref);
  if (baseRefBranchName === "main") {
    const headRefBranchName = parseBranchName(pullRequest.head.ref);
    const isFeatureBranch = headRefBranchName.startsWith("feature/");
    const isFixBranch = headRefBranchName.startsWith("fix/");
    if (!isFeatureBranch && !isFixBranch) {
      core.setFailed("Branch name does not start with `feature/` or `fix/`.");
    }
  }
}

function parseBranchName(ref: string): string {
  return ref.replace(/^(refs\/heads\/)/, "");
}
