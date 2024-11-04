export type DependencyMap = Map<string, string[]>; // For the dependencies

export interface VersionMap {
  [key: string]: { [key: string]: string };
}

export type VersionDependenciesMap = Map<string, string>;

export type SchemaRegistryConfig = {
  schemaRegistryUrl: string;
};
