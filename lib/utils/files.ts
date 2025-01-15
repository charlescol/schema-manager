import * as path from 'path';
import * as fs from 'fs';
import { dir } from 'console';
import SchemaType from '../types';
/**
 * Recursively retrieves all files from a directory and its subdirectories, with optional filtering by file extensions.
 *
 * @param {string} dir - The directory to search for files.
 * @param {string[]} [files=[]] - An array to store the file paths; used for recursion.
 * @param {string[]} [allowedExtensions] - An optional array of allowed file extensions (e.g., ['.js', '.txt']).
 * @returns {Promise<string[]>} - A promise that resolves to an array of file paths matching the criteria.
 * @throws {Error} - If an error occurs while reading the directory.
 */
export function getFiles(dir: string, files: string[] = [], allowedExtensions?: string[]): string[] {
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        getFiles(fullPath, files);
      } else if (entry.isFile()) {
        const fileExtension = path.extname(fullPath).toLowerCase();
        if (!allowedExtensions || allowedExtensions.includes(fileExtension)) {
          files.push(fullPath);
        }
      }
    }
    return files;
  } catch (error) {
    console.error(`Error getting files in directory: ${error}`);
    throw error;
  }
}

/**
 * Lists all files (not directories) in lowercase in a specified directory.
 *
 * @param {string} directoryPath - The path of the directory to list files from.
 * @returns {Promise<string[]>} - A promise that resolves to an array of file names in the directory.
 * @throws {Error} - If an error occurs while reading the directory.
 */
export async function listFilesInDirectory(directoryPath: string): Promise<string[]> {
  try {
    const files = await fs.promises.readdir(directoryPath, { withFileTypes: true });
    const fileNames = files.filter((file) => file.isFile()).map((file) => file.name.toLowerCase());
    return fileNames;
  } catch (error) {
    console.error(`Error listing files in directory: ${error}`);
    throw error;
  }
}
