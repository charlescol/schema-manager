export type TransformerConfig = {};

export type ProtobufTransformerConfig = TransformerConfig & {
  namespaceBuilder?: (filepath: string) => string;
};

export type AvroTransformerConfig = TransformerConfig & {
  namespaceBuilder?: (filepath: string) => string;
};
