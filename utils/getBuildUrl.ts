import { githubClient } from "../clients/github.ts";

export async function getBuildUrl(id: number) {
  const { data } = await githubClient.actions.listWorkflowRunArtifacts({
    owner: "SteamDeckHomebrew",
    repo: "decky-loader",
    run_id: id,
  });
  return data.artifacts[0]?.archive_download_url;
}
