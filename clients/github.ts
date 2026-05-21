import "dotenv/config";
import { Octokit } from "@octokit/rest";

const githubToken = process.env.GITHUB_TOKEN;

export const githubClient = new Octokit({ auth: githubToken });
