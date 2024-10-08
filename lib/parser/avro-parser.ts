import * as fs from 'fs';
import AbstractParser from './abstract-parser';

export default class AvroParser extends AbstractParser {
  protected extensions = ['.avro', '.avsc'];

  protected extractDependencies(filePath: string): string[] {
    const content = fs.readFileSync(filePath, 'utf8');
    const schema = JSON.parse(content);
    const dependencies = new Set<string>();

    const primitiveTypes = ['null', 'boolean', 'int', 'long', 'float', 'double', 'bytes', 'string'];

    const extractDependenciesFromField = (field: any) => {
      if (typeof field === 'string') {
        if (!primitiveTypes.includes(field)) {
          dependencies.add((field as string).toLowerCase());
        }
      } else if (Array.isArray(field)) {
        field.forEach((item) => extractDependenciesFromField(item));
      } else if (field.type === 'record') {
        const recordName = field.name as string;
        dependencies.add(recordName.toLowerCase());
        if (field.fields) {
          extractDependenciesFromFields(field.fields);
        }
      } else if (field.type === 'array' && field.items) {
        extractDependenciesFromField(field.items);
      }
    };

    const extractDependenciesFromFields = (fields: { type: object }[]) => {
      fields.forEach((field) => {
        extractDependenciesFromField(field.type);
      });
    };

    if (schema.fields) {
      extractDependenciesFromFields(schema.fields);
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
