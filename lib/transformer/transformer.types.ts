export type TransformerConfig = {};

export type TransformParameters = {
  /**
   * The file path of the schema file being transformed (without filename).
   */
  filePath: string;
  /**
   * The filename of the schema file being transformed (without extension).
   */
  fileName: string;
  /**
   * An array of file names of the dependencies of the schema file being transformed (without extension).
   */
  keys: string[];
};

export type ProtobufTransformerConfig = TransformerConfig & {
  namespaceBuilder?: (filepath: string) => string;
};

export type AvroTransformerConfig = TransformerConfig & {
  namespaceBuilder?: (filepath: string) => string;
};

export type JsonTransformerConfig = TransformerConfig & {
  namespaceBuilder?: (filepath: string) => string;
};
