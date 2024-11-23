import * as fs from 'fs';
import * as path from 'path';
import AbstractParser from './abstract-parser';
import SchemaType from '../types';

export default class ProtobufParser extends AbstractParser {
  protected allowedExtensions = ['.proto'];
  protected extractDependencies(filePath: string): string[] {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split(/\r?\n/);
    const dependencies = lines
      .filter((line) => line.startsWith('import'))
      .map((line) => line.match(/"([^"]+)"/)?.[1])
      .filter((name): name is string => Boolean(name))
      .map((name) => {
        return path.basename(name); // Extract the filename including extension
      });
    return dependencies;
  }

  protected extractName(filePath: string): string {
    return path.basename(filePath);
  }
}
