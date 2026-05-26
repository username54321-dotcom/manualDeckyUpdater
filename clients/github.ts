import "dotenv/config";
import { Octokit } from "@octokit/rest";

const githubToken =
  "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";

export const githubClient = new Octokit({ auth: githubToken });
