/**
 * The `RegistryConfig` type defines the configuration options for interacting with a
 * schema registry, including URL, headers, body parameters, and query parameters.
 */
export type RegistryConfig = {
  /**
   * The URL of the schema registry
   */
  schemaRegistryUrl: string;
  /**
   * Additional headers to include in requests
   */
  headers?: Record<string, unknown>;
  /**
   * Additional body parameters to include in requests
   */
  body?: Record<string, unknown>;
  /**
   * Additional query parameters to include in requests
   */
  queryParams?: Record<string, unknown>;
};

export type ConfluentRegistryReference = {
  name: string;
  subject: string;
  version: number;
};
