import * as fs from 'fs';
import AbstractParser from './abstract-parser';
export default class ProtobufParser extends AbstractParser {
  protected extensions = ['.proto'];

  protected extractDependencies(filePath: string): string[] {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split(/\r?\n/);
    const dependencies = lines
      .filter((line) => line.startsWith('import'))
      .map((line) => line.match(/"([^"]+)"/)?.[1])
      .filter((name): name is string => Boolean(name));
    return dependencies;
  }

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
