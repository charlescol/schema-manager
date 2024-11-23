import * as fs from 'fs';
import AbstractParser from './abstract-parser';
import SchemaType from '../types';

export default class AvroParser extends AbstractParser {
  protected allowedExtensions = ['.avsc', '.avro'];
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
        dependencies.add(`${typeFound.split('.').pop() as string}.avsc`);
      }
    }
    return Array.from(dependencies);
  }

  protected extractName(filePath: string): string {
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
