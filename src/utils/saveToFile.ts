import fs from "fs/promises";
import path from "path";

export async function saveToFile(content: string, filepath: string) {
  const filename = path.join(process.cwd(), filepath);

  try {
    await fs.writeFile(filename, content, "utf-8");
  } catch (error) {
    console.error("Error saving to file:", error);
  }
}
