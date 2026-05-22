import { githubClient } from "../clients/github.ts";
// type GetLatestVerUrl = {
//   id: number;
//   node_id: string;
//   name: string;
//   size_in_bytes: number;
//   url: string;
//   archive_download_url: string;
//   expired: boolean;
//   created_at: string | null;
//   expires_at: string | null;
//   updated_at: string | null;
//   digest?: string | null;
//   workflow_run?:
//     | {
//         id?: number;
//         repository_id?: number;
//         head_repository_id?: number;
//         head_branch?: string;
//         head_sha?: string;
//       }
//     | null
//     | undefined;
// } | null;

type Builds = { value: { id: number; createdAt: Date }; name: string }[];
export async function getLatestBuilds(
  numberOfBuilds?: number,
): Promise<Builds> {
  // Check Latest Ver
  const latestBuilds = await githubClient.rest.actions
    .listWorkflowRuns({
      owner: "SteamDeckHomebrew",
      repo: "decky-loader",
      workflow_id: "build-win.yml",
      status: "success",
      per_page: numberOfBuilds,
    })
    .then((x) => {
      return x.data.workflow_runs.map((x) => ({
        value: {
          id: x.id,
          createdAt: new Date(x.created_at),
        },
        name: new Date(x.created_at).toLocaleString(),
      }));
    });

  return latestBuilds;
}

await getLatestBuilds();
