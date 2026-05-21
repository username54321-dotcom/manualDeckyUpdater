import fs from "node:fs/promises";
import { config } from "../config.ts";

export async function getInstalledDate(): Promise<Date> {
  const date = (await fs.stat(config.pluginLoaderDir)).mtime;
  return date;
}
