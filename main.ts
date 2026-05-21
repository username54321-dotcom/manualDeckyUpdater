import { input, checkbox, Separator, confirm } from "@inquirer/prompts";
import ora from "ora";
import { githubClient } from "./clients/github.ts";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { isDate } from "node:util/types";
import unzip from "extract-zip";
import { mkdir } from "node:fs";

let localVerDate: undefined | Date;
const homeDir = os.homedir();
const spinner = ora();
async function start() {
  // Greeting
  spinner.start("Checking Latest Version"); // start spinner

  // Check Latest Ver
  const runId = await githubClient.rest.actions
    .listWorkflowRuns({
      owner: "SteamDeckHomebrew",
      repo: "decky-loader",
      workflow_id: "build-win.yml",
      status: "success",
      per_page: 1,
    })
    .then((x) => x.data.workflow_runs[0].id);
  const latestVer = await githubClient.rest.actions
    .listWorkflowRunArtifacts({
      owner: "SteamDeckHomebrew",
      repo: "decky-loader",
      run_id: runId,
    })
    .then((x) => x.data.artifacts[0]);
  spinner.stop(); // Stop Spinner after checking version
  // Check If Installed
  const pluginLoaderDir = path.join(
    homeDir,
    "homebrew",
    "services",
    "PluginLoader.exe",
  );

  const pluginLoader = await fs
    .access(path.join(homeDir, "homebrew", "services", "PluginLoader.exe"))
    .then(
      () => true,
      () => false,
    );
  const pluginLoader_noConsole = await fs
    .access(
      path.join(homeDir, "homebrew", "services", "PluginLoader_noconsole.exe"),
    )
    .then(
      () => true,
      () => false,
    );
  if (pluginLoader && pluginLoader_noConsole) {
    //check Version Date
    localVerDate = (await fs.stat(pluginLoaderDir)).mtime;
    console.log(`

    Local Version Date : ${localVerDate.toLocaleString()}`);
  }
  console.log(`   Latest Version Date : ${new Date(latestVer.created_at as string).toLocaleString()} [${(latestVer.size_in_bytes / 1048576).toFixed(1)} MBs]
    `);

  if (
    isDate(localVerDate) &&
    localVerDate?.getTime() >= new Date(latestVer.created_at!).getTime()
  ) {
    console.log(`Latest Build Already Installed ! 
      Exiting in 5 Seconds...`);
    setTimeout(() => {
      process.exit();
    }, 5000);
    return;
  }

  // Download Update Prompt
  const downloadUpdate = await confirm({ message: "Download Update ?" });

  // Early Return
  if (!downloadUpdate) process.exit();

  // Download Update
  spinner.start("Downloading Update");
  const response = await githubClient.request(
    `GET ${latestVer.archive_download_url}`,
    {
      // headers: { accept: "application/vnd.github.v3+json" },
    },
  );

  const buffer = Buffer.from(response.data as ArrayBuffer);
  const downloaded = await fs.writeFile("./latestVer.zip", buffer).then(
    () => true,
    () => false,
  );
  spinner.stop();
  downloaded && console.log("Download Successfull");
  !downloaded && console.log("Download Unsuccessfull");

  const shouldInstall = await confirm({ message: "Extract and Install?" });
  !shouldInstall && process.exit();
  spinner.start("installing");
  const madeDir = await fs
    .mkdir(path.join(homeDir, "homebrew", "services"), { recursive: true })
    .then(
      () => true,
      () => false,
    );
  const extracted = await unzip("./latestVer.zip", {
    dir: path.join(homeDir, "homebrew", "services"),
  }).then(
    () => {
      console.log("Installation Complete");
      return true;
    },
    (x) => {
      console.log("Installation Failed", x);
      return false;
    },
  );
}

start();
