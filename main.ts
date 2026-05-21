import { input, checkbox, Separator, confirm, select } from "@inquirer/prompts";
import { githubClient } from "./clients/github.ts";
import fs from "node:fs/promises";
import path from "node:path";
import { getLatestBuilds } from "./utils/getLatestBuilds.ts";
import { config } from "./config.ts";
import { checkIfInstalled } from "./utils/checkIfInstalled.ts";
import { getInstalledDate } from "./utils/getInstalledDate.ts";
import { spinner } from "./utils/spinner.ts";
import { getBuildUrl } from "./utils/getBuildUrl.ts";
import unzip from "node-stream-zip";

let localVerDate: undefined | Date;
// const homeDir = os.homedir?();
async function start() {
  // Greeting
  spinner.start("Checking Latest Version"); // start spinner

  // Check Latest Builds

  const latestBuilds = await getLatestBuilds();
  if (!latestBuilds) {
    console.log("Error Fetching Latest Builds");
    return;
  }

  // Check If Installed
  const isInstalled = await checkIfInstalled();

  // Check Installed Date
  if (isInstalled) {
    const installedDate = await getInstalledDate();
    console.log(`Local Build Date : ${installedDate.toLocaleString()}`);
  }

  // Stop Spinner after checking version
  spinner.stop();
  // Select Build To Install

  const buildId = await select({
    message: "Select Build To Install",
    choices: latestBuilds,
    pageSize: 20,
  });

  // Download Update
  spinner.start("Downloading Build");

  const buildUrl = await getBuildUrl(buildId);

  const response = await githubClient.request(`GET ${buildUrl}`, {
    // headers: { accept: "application/vnd.github.v3+json" },
  });

  const buffer = Buffer.from(response.data as ArrayBuffer);
  const downloaded = await fs.writeFile("./Build.zip", buffer).then(
    () => true,
    () => false,
  );
  spinner.stop();
  downloaded && console.log("Download Successfull to Build.zip");
  !downloaded && console.log("Download Unsuccessfull");

  const shouldInstall = await confirm({ message: "Extract and Install?" });
  !shouldInstall && process.exit();
  await input({
    message: "Enter Steam Installation Path. ( Leave Empty For Default )",
    default: "C:/Program Files (x86)/Steam",
  });
  spinner.start("installing");
  const madeDir = await fs
    .mkdir(path.join(config.homeDir, "homebrew", "services"), {
      recursive: true,
    })
    .then(
      () => true,
      () => false,
    );
  const zip = new unzip.async({ file: "./Build.zip" })
    .extract(null, path.join(config.homeDir, "homebrew", "services"))
    .then(
      () => {},

      (err) => {
        spinner.stop();
        const errMsg = err as NodeJS.ErrnoException;
        if (errMsg.code === "EBUSY") {
          console.log(`ERROR!!!
Please Make Sure Both PluginLoader.exe and PluginLoader_noconsole.exe are Not Running and Try Again`);
        }
      },
    );

  // Check If .CEF File Exists
  const createCef = await fs.writeFile(
    path.join("C:/Program Files (x86)/Steam", ".cef-enable-remote-debugging"),
    "",
  );

  spinner.stop();
  console.log("Installation Complete");

  const shouldDelete = await confirm({ message: "Delete Build Archive ?" });

  shouldDelete &&
    (await fs.rm("./Build.zip").then(
      () => true,
      (e) => console.log(e),
    ));
}
try {
  await start();
} catch (error) {
  console.log(error);
}
