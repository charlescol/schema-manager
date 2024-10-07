export type DependencyMap = Map<string, string[]>; // For the dependencies
export type NamespaceMap = Map<string, string>; // For the package name and first message

export interface VersionMap {
  [key: string]: { [key: string]: string };
}

export type VersionDependenciesMap = Map<string, string>;

export type SchemaRegistryConfig = {
  schemaRegistryUrl: string;
};
