import { AvroTransformerConfig } from './transformer.types';
import AbstractTransformer from './abstract-transformer';

export default class AvroTransformer extends AbstractTransformer {
  private namespaceBuilder: (filepath: string) => string;
  constructor(config: AvroTransformerConfig) {
    super(config);
    if (!config.namespaceBuilder) {
      this.namespaceBuilder = (filepath: string) => filepath.replace(/\//g, '.');
    }
  }
  async transform(content: string, filePath: string): Promise<string> {
    const schema = JSON.parse(content);

    /* Set namespace to filePath */
    schema.namespace = this.namespaceBuilder(filePath);

    /* Remove namespace prefixes in type references */
    function removeNamespace(obj: unknown): void {
      if (Array.isArray(obj)) {
        obj.forEach((item) => removeNamespace(item));
      } else if (typeof obj === 'object' && obj !== null) {
        const objRecord = obj as Record<string, unknown>;
        for (const key in objRecord) {
          const value = objRecord[key];
          if (key === 'type' || key === 'items') {
            if (typeof value === 'string') {
              const typeName = value.split('.').pop();
              objRecord[key] = typeName;
            } else {
              removeNamespace(value);
            }
          } else {
            removeNamespace(value);
          }
        }
      }
    }
    removeNamespace(schema);
    return JSON.stringify(schema, null, 2);
  }
}
