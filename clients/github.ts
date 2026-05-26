import "dotenv/config";
import { Octokit } from "@octokit/rest";

const githubToken =
  "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";

export const githubClient = new Octokit({ auth: githubToken });
