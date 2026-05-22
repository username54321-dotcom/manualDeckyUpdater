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
import chalk from "chalk";
import isElevated from "is-elevated";
import { exec, spawn } from "node:child_process";
import { promisify } from "node:util";

async function start() {
  // Check If Elevated
  const isAdmin = await isElevated();
  if (!isAdmin) {
    console.log(
      chalk.redBright(
        "Admin Permissions are Required. Please Restart App as Administrator.",
      ),
    );
    await new Promise(() => {});
  }

  // Choose Number Of Builds
  const numberOfBuilds = await input({
    message:
      "Choose Number of Lastest Checked Builds Between 1 and 100 - Defaults To 10 ",
    validate: (x) => parseInt(x) > 1 && parseInt(x) < 100,
    default: "10",
  });

  // Greeting
  spinner.start(chalk.greenBright("Checking Latest Builds")); // start spinner

  // Check Latest Builds

  const latestBuilds = await getLatestBuilds();
  if (!latestBuilds) {
    console.log(chalk.redBright("Error Fetching Latest Builds"));
    return;
  }

  // Check If Installed
  const isInstalled = await checkIfInstalled();

  // Check Installed Date
  if (isInstalled) {
    const installedDate = await getInstalledDate();
    console.log(
      `
      Local Build Date : ${chalk.blueBright.bgBlack.bold(installedDate.toLocaleString())}`,
    );
  }

  // Stop Spinner after checking version
  spinner.stop();
  // Select Build To Install

  const chosenBuild = await select({
    message: chalk.greenBright("Select Build To Install"),
    choices: latestBuilds.map((x) => ({ name: x.name, value: x.value })),
    pageSize: 20,
  });

  // Download Update
  spinner.start(chalk.greenBright("Downloading Build"));

  const buildUrl = await getBuildUrl(chosenBuild.id);

  const response = await githubClient.request(`GET ${buildUrl}`, {
    // headers: { accept: "application/vnd.github.v3+json" },
  });

  const buffer = Buffer.from(response.data as ArrayBuffer);
  const downloaded = await fs.writeFile("./Build.zip", buffer).then(
    () => true,
    () => false,
  );
  spinner.stop();
  downloaded &&
    console.log(chalk.blueBright("Download Successfull to Build.zip"));
  !downloaded && console.log(chalk.redBright("Download Unsuccessfull"));

  // Should Install Prompt ?
  const shouldInstall = await confirm({ message: "Extract and Install?" });
  !shouldInstall && process.exit();
  await input({
    message: "Enter Steam Installation Path. ( Leave Empty For Default )",
    default: "C:/Program Files (x86)/Steam",
  });

  // End Tasks
  const asyncExec = promisify(exec);
  await asyncExec("taskkill /F /IM PluginLoader_noconsole.exe /T");

  // Installing
  spinner.start("Installing");
  const madeDir = await fs
    .mkdir(path.join(config.homeDir, "homebrew", "services"), {
      recursive: true,
    })
    .then(
      () => true,
      () => false,
    );

  // Unzipping The Build into Path

  try {
    const zip = new unzip.async({ file: "./Build.zip" });

    await zip.extract(null, path.join(config.homeDir, "homebrew", "services"));

    await zip.close();
  } catch (error) {
    spinner.stop();
    const errMsg = error as NodeJS.ErrnoException;
    if (errMsg.code === "EBUSY") {
      console.log(
        chalk.redBright(`
  ERROR!!!
  Please Make Sure Both PluginLoader.exe and PluginLoader_noconsole.exe are Not Running and Try Again`),
      );
    }
  }
  spinner.stop();

  // Setting the Correct Modified Date

  await fs
    .utimes(
      path.join(
        config.homeDir,
        "homebrew",
        "services",
        "PluginLoader_noconsole.exe",
      ),
      new Date(),
      chosenBuild.createdAt,
    )
    .catch((x) => console.log(x));
  await fs
    .utimes(
      path.join(config.homeDir, "homebrew", "services", "PluginLoader.exe"),
      new Date(),
      chosenBuild.createdAt,
    )
    .catch((x) => console.log(x));

  // Check If .CEF File Exists
  const createCef = await fs.writeFile(
    path.join("C:/Program Files (x86)/Steam", ".cef-enable-remote-debugging"),
    "",
  );

  spinner.stop();
  console.log(chalk.greenBright.bold("Installation Complete"));

  const startNewBuild = await confirm({ message: "Start New Decky Build ?" });
  if (startNewBuild) {
    const child = spawn(config.pluginLoader_noConsoleDir, [], {
      detached: true,
      stdio: "ignore",
      windowsHide: true,
    });
  }

  const shouldDelete = await confirm({
    message: chalk.green("Delete Build Archive ?"),
  });

  shouldDelete &&
    (await fs.rm("./Build.zip").then(
      () => true,
      (e) => console.log(e),
    ));
  process.exit();
}
try {
  await start();
} catch (error) {
  console.log(error);
}
