import os from "node:os";
import path from "node:path";

const homeDir = os.homedir();
export const config = {
  homeDir: homeDir,
  pluginLoaderDir: path.join(
    homeDir,
    "homebrew",
    "services",
    "PluginLoader.exe",
  ),
  pluginLoader_noConsoleDir: path.join(
    homeDir,
    "homebrew",
    "services",
    "PluginLoader_noconsole.exe",
  ),
};
