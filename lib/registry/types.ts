export type RegistryConfig = {
  schemaRegistryUrl: string;
  headers?: Record<string, unknown>;
  body?: Record<string, unknown>;
  queryParams?: Record<string, unknown>;
};

export type ConfluentRegistryReference = {
  name: string;
  subject: string;
  version: number;
};
