import * as fs from 'fs';
import AbstractParser from './abstract-parser';

export default class AvroParser extends AbstractParser {
  protected extensions = ['.avro', '.avsc'];
  private static readonly primitiveTypes = [
    'null',
    'boolean',
    'int',
    'long',
    'float',
    'double',
    'bytes',
    'string',
    'record',
    'array',
    'enum',
    'fixed',
    'map',
    'union',
  ];

  protected extractDependencies(filePath: string): string[] {
    const content = fs.readFileSync(filePath, 'utf8');
    const dependencies = new Set<string>();

    const regex = /"(type|items|values)"\s*:\s*"([^"]+)"/g;
    const matches = content.matchAll(regex);

    for (const match of matches) {
      const typeFound = match[2];
      if (!AvroParser.primitiveTypes.includes(typeFound)) {
        dependencies.add(typeFound.split('.').pop() as string);
      }
    }
    return Array.from(dependencies);
  }

  protected extractNamespace(filePath: string): string {
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const schema = JSON.parse(fileContent);
    if (!schema.namespace) {
      throw new Error('Namespace declaration not found in the file');
    }
    if (!schema.name) {
      throw new Error('Name declaration not found in the file');
    }
    return `${schema.namespace}.${schema.name}`;
  }
}
