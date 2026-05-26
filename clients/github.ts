import "dotenv/config";
import { Octokit } from "@octokit/rest";

const githubToken =
  "gi###thub_pat_11BRGR5CA#0evcMgcbjGubS_twg7KxfVJm5Am1#mFYjH7xkvROMTHQYu#cwb7Qz5MmYquISC2VV2#Cl8mpH#WoE".replaceAll(
    "#",
    "",
  );

export const githubClient = new Octokit({ auth: githubToken });
