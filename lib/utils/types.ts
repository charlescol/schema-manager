export type DependencyMap = Map<string, string[]>; // For the dependencies
export type NamespaceMap = Map<string, string>; // For the package name and first message

export interface VersionMap {
  [key: string]: { [key: string]: string };
}

export type VersionDependenciesMap = Map<string, string>;

export type Reference = {
  name: string;
  subject: string;
  version: number;
};

export type VersionData = {
  fileMap: Map<string, Array<{ version: string; full: string }>>;
  versionMap: Map<string, Map<string, string>>;
};

export type SchemaRegistryConfig = {
  schemaRegistryUrl: string;
};

export type FilesDependencies = {
  namespaceMap: Map<string, string>;
  dependenciesMap: Map<string, string[]>;
};
