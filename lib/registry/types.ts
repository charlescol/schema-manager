export type RegistryConfig = {
  schemaRegistryUrl: string;
};

export type ConfluentRegistryReference = {
  name: string;
  subject: string;
  version: number;
};
