import * as path from 'path';
import AbstractTransformer from './abstract-transformer';
import { JsonTransformerConfig, TransformParameters } from './transformer.types';

export default class JsonTransformer extends AbstractTransformer {
  private namespaceBuilder: (filepath: string) => string;

  constructor(config?: JsonTransformerConfig) {
    super(config || {});
    this.namespaceBuilder = config?.namespaceBuilder || ((filepath: string) => filepath.replace(/\//g, '.'));
  }

  async transform(content: string, param: TransformParameters): Promise<string> {
    /* Update $ref values to use paths relative to `filePath` */
    const refRegex = /("\$ref"\s*:\s*")([^"]+)(")/g;
    const newContent = content.replace(refRegex, (match, before, refValue, after) => {
      const base = path.basename(refValue);
      const rootName = base.split('.')[0].toLowerCase();
      if (param.keys.includes(rootName)) {
        const newRef = this.namespaceBuilder(`${param.filePath}/${base}`);
        return `${before}${newRef}${after}`;
      }
      return match;
    });

    /* Add $id based on filePath */
    let schema = JSON.parse(newContent);
    const newId = this.namespaceBuilder(`${param.filePath}/${param.fileName}`);
    if (schema.hasOwnProperty('$id')) {
      schema.$id = newId;
    } else {
      schema = { $id: newId, ...schema };
    }

    return JSON.stringify(schema, null, 2);
  }
}
