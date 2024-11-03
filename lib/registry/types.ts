export type RegistryConfig = {
  schemaRegistryUrl: string; // The URL of the schema registry
  headers?: Record<string, unknown>; // Additional headers to include in requests
  body?: Record<string, unknown>; // Additional body parameters to include in requests
  queryParams?: Record<string, unknown>; // Additional query parameters to include in requests
};

export type ConfluentRegistryReference = {
  name: string;
  subject: string;
  version: number;
};
