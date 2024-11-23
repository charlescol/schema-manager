import * as path from 'path';
import { ProtobufTransformerConfig, TransformParameters } from './transformer.types';
import AbstractTransformer from './abstract-transformer';

export default class ProtobufTransformer extends AbstractTransformer {
  private namespaceBuilder: (filepath: string) => string;
  constructor(config: ProtobufTransformerConfig) {
    super(config);
    this.namespaceBuilder = config.namespaceBuilder || ((filepath: string) => filepath.replace(/\//g, '.'));
  }
  async transform(content: string, param: TransformParameters): Promise<string> {
    /* Update import statements to use paths relative to `filePath` */
    const importRegex = /import\s+"([^"]+)";/g;
    let transformedContent = content.replace(importRegex, (match, importPath) => {
      const importedFileName = path.basename(importPath);
      if (param.keys.includes(importedFileName.toLowerCase())) {
        const newImportPath = path.posix.join(param.filePath, `${importedFileName}`);
        return `import "${newImportPath}";`;
      }
      return match;
    });

    /* Update or insert the package statement based on `filePath` */
    const packageName = this.namespaceBuilder(param.filePath);
    const packageRegex = /^\s*package\s+[\w\.]+;/m;
    if (packageRegex.test(transformedContent)) {
      transformedContent = transformedContent.replace(packageRegex, `package ${packageName};`);
    } else {
      transformedContent = `package ${packageName};\n${transformedContent}`;
    }

    /* Remove package prefix from field type declarations */
    const fieldTypeRegex = /^(\s*(?:repeated|optional|required)?\s*)([\w\.]+)(\s+\w+\s*=\s*\d+;)/gm;
    transformedContent = transformedContent.replace(fieldTypeRegex, (match, p1, p2, p3) => {
      const typeName = p2.split('.').pop();
      if (param.keys.includes(typeName.toLowerCase())) {
        return `${p1}${typeName}${p3}`;
      }
      return match;
    });

    return transformedContent;
  }
}
