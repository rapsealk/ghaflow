import * as core from "@actions/core";
import * as github from "@actions/github";
import { PullRequest, PullRequestEvent } from "@octokit/webhooks-types";

const GITHUB_TOKEN = core.getInput("github-token", { required: true });

/**
 * The main function for the action.
 * @returns {Promise<void>} Resolves when the action is complete.
 */
export async function run(): Promise<void> {
  if (github.context.eventName === "pull_request") {
    // https://docs.github.com/en/actions/using-workflows/events-that-trigger-workflows#pull_request
    const pullRequestEvent = github.context.payload as PullRequestEvent;
    if (pullRequestEvent.action === "opened") {
      onPullRequestOpened(pullRequestEvent.pull_request);
    }
    const client = github.getOctokit(GITHUB_TOKEN);
    client.rest.issues.createComment({
      issue_number: github.context.issue.number,
      owner: github.context.repo.owner,
      repo: github.context.repo.repo,
      body: `PullRequestEvent.action: ${pullRequestEvent.action}`,
    });
  }
}

function onPullRequestOpened(pullRequest: PullRequest): void {
  if (pullRequest.base.ref === "main") {
    const isHeadFeatureBranch = pullRequest.head.ref.startsWith("feature/");
    const isHeadFixBranch = pullRequest.head.ref.startsWith("fix/");
    if (!isHeadFeatureBranch && !isHeadFixBranch) {
      const message = "Branch name does not start with `feature/` or `fix/`.";
      core.setFailed(message);
      const client = github.getOctokit(GITHUB_TOKEN);
      client.rest.issues.createComment({
        issue_number: github.context.issue.number,
        owner: github.context.repo.owner,
        repo: github.context.repo.repo,
        body: message,
      });
    }
  }
}
