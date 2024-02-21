import * as core from "@actions/core";
import * as github from "@actions/github";
import {
  PullRequest,
  PullRequestEvent,
  PushEvent,
} from "@octokit/webhooks-types";

const GITHUB_TOKEN = core.getInput("github-token", { required: true });

/**
 * The main function for the action.
 * @returns {Promise<void>} Resolves when the action is complete.
 */
export async function run(): Promise<void> {
  const octokit = github.getOctokit(GITHUB_TOKEN);
  switch (github.context.eventName) {
    case "push": // https://docs.github.com/en/actions/using-workflows/events-that-trigger-workflows#push
      const pushEvent = github.context.payload as PushEvent;
      console.log(
        `PushEvent(base_ref=${pushEvent.base_ref}, ref=${github.context.ref}, repo.owner=${github.context.repo.owner}, repo.repo=${github.context.repo.repo})`
      );
      const openedPullRequests = octokit.rest.pulls.list({
        base: pushEvent.base_ref || "main",
        head: [github.context.repo.owner, github.context.ref].join(":"),
        owner: github.context.repo.owner,
        repo: github.context.repo.repo,
        state: "open",
      });
      core.info(`OpenedPullRequests: ${JSON.stringify(openedPullRequests)}`);
      break;
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
  if (pullRequest.base.ref === "main") {
    const isHeadFeatureBranch = pullRequest.head.ref.startsWith("feature/");
    const isHeadFixBranch = pullRequest.head.ref.startsWith("fix/");
    if (!isHeadFeatureBranch && !isHeadFixBranch) {
      const message = "Branch name does not start with `feature/` or `fix/`.";
      core.setFailed(message);
      const octokit = github.getOctokit(GITHUB_TOKEN);
      octokit.rest.issues.createComment({
        issue_number: github.context.issue.number,
        owner: github.context.repo.owner,
        repo: github.context.repo.repo,
        body: message,
      });
    }
  }
}
