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
      if (param.keys.includes(importedFileName.split('.')[0].toLowerCase())) {
        const newImportPath = path.posix.join(param.filePath, `${importedFileName}`);
        return `import "${newImportPath}";`;
      }
      return match;
    });

    /* Ensure the `syntax` statement exists and find its position */
    const syntaxRegex = /^\s*syntax\s*=\s*["'][^"']+["'];/m;
    const syntaxMatch = transformedContent.match(syntaxRegex);
    if (!syntaxMatch) {
      throw new Error(`ProtobufTransformer: Syntax statement not found in the Protobuf content at ${param.filePath}`);
    }
    const syntaxStatement = syntaxMatch[0];
    const syntaxPosition = transformedContent.indexOf(syntaxStatement);
    /* Update or insert the package statement immediately after `syntax` */
    const packageName = this.namespaceBuilder(param.filePath);
    const packageRegex = /^\s*package\s+[\w\.]+;/m;
    if (packageRegex.test(transformedContent)) {
      /* If a package statement exists, replace it */
      transformedContent = transformedContent.replace(packageRegex, `package ${packageName};`);
    } else {
      /* Insert the package statement after the syntax field */
      const beforeSyntax = transformedContent.slice(0, syntaxPosition + syntaxStatement.length);
      const afterSyntax = transformedContent.slice(syntaxPosition + syntaxStatement.length);
      transformedContent = `${beforeSyntax}\npackage ${packageName};${afterSyntax}`;
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
