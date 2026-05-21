import fs from "node:fs/promises";
import path from "node:path";
import { config } from "../config.ts";

export async function checkIfInstalled(): Promise<boolean> {
  const pluginLoader = await fs.access(config.pluginLoaderDir).then(
    () => true,
    () => false,
  );
  const pluginLoader_noConsole = await fs
    .access(
      path.join(
        config.homeDir,
        "homebrew",
        "services",
        "PluginLoader_noconsole.exe",
      ),
    )
    .then(
      () => true,
      () => false,
    );
  if (pluginLoader && pluginLoader_noConsole) {
    return true;
  } else {
    return false;
  }
}
