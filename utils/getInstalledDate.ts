import fs from "node:fs/promises";
import { config } from "../config.ts";

export async function getInstalledDate(): Promise<Date> {
  const date = (await fs.stat(config.pluginLoader_noConsoleDir)).mtime;
  return date;
}
