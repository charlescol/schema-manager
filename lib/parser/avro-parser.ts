import * as fs from 'fs';
import AbstractParser from './abstract-parser';

export default class AvroParser extends AbstractParser {
  protected extensions = ['.avro', '.avsc'];

  /**
   * Extracts the import dependencies from an Avro schema file.
   *
   * In Avro, schemas may reference other schemas via named types, but
   * there is no `import` statement like in Protobuf. So we will assume
   * that dependencies are defined within the `fields` section as `type`
   * declarations that reference named types, and we will collect these.
   *
   * @param {string} filePath - The path to the Avro file to analyze.
   * @returns {string[]} - An array of referenced schema names.
   */
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

  /**
   * Extracts the namespace from an Avro schema file.
   *
   * This method searches for the `namespace` and `name` properties in the Avro schema
   * and returns the fully qualified namespace in the form `namespace.name`.
   *
   * @param {string} filePath - The path to the Avro file to analyze.
   * @returns {string} - The fully qualified namespace.
   * @throws {Error} - If a `namespace` or `name` declaration is not found.
   */
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
