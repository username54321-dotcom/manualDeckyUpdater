import "dotenv/config";
import { Octokit } from "@octokit/rest";

const githubToken =
  process.env.GITHUB_TOKEN ||
  "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";

export const githubClient = new Octokit({ auth: githubToken });
