import * as fs from 'fs';
import AbstractParser from './abstract-parser';
export default class ProtobufParser extends AbstractParser {
  protected extensions = ['.proto'];
  /**
   * Extracts the import dependencies from a `.proto` file.
   *
   * This method reads the file, looks for lines starting with `import`,
   * and extracts the imported file paths from the quotes. The resulting
   * array contains the paths of the dependencies referenced in the file.
   *
   * @param {string} filePath - The path to the `.proto` file to analyze.
   * @returns {string[]} - An array of imported file paths.
   */
  protected extractDependencies(filePath: string): string[] {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split(/\r?\n/);
    const dependencies = lines
      .filter((line) => line.startsWith('import'))
      .map((line) => line.match(/"([^"]+)"/)?.[1])
      .filter((name): name is string => Boolean(name));
    return dependencies;
  }

  /**
   * Extracts the namespace from a `.proto` file.
   *
   * This method searches for the `package` declaration and the first `message` in the file.
   * It returns the fully qualified namespace in the form `packageName.messageName`.
   *
   * @param {string} filePath - The path to the `.proto` file to analyze.
   * @returns {string} - The fully qualified namespace.
   * @throws {Error} - If a `package` or `message` declaration is not found.
   */
  protected extractNamespace(filePath: string): string {
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const packageRegex = /package\s+([\w.]+)\s*;/;
    const messageRegex = /message\s+(\w+)\s*{/;
    const packageMatch = fileContent.match(packageRegex);
    if (!packageMatch || packageMatch.length < 2) {
      throw new Error('Package declaration not found in the file');
    }
    const packageName = packageMatch[1];
    const messageMatch = fileContent.match(messageRegex);
    if (!messageMatch || messageMatch.length < 2) {
      throw new Error('Message declaration not found in the file');
    }
    const messageName = messageMatch[1];
    return `${packageName}.${messageName}`;
  }
}
