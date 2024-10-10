import * as fs from 'fs';
import * as path from 'path';
import AbstractParser from './abstract-parser';
import SchemaType from '../types';
export default class ProtobufParser extends AbstractParser {
  protected extensions = ['.proto'];
  protected schemaTypes = [SchemaType.PROTOBUF];
  protected extractDependencies(filePath: string): string[] {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split(/\r?\n/);
    const dependencies = lines
      .filter((line) => line.startsWith('import'))
      .map((line) => line.match(/"([^"]+)"/)?.[1])
      .filter((name): name is string => Boolean(name))
      .map((name) => {
        const fileNameWithExtension = path.basename(name); // Extract the filename including extension
        return fileNameWithExtension.replace(/\.\w+$/, ''); // Remove the extension
      });
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
