export type NamespaceMap = Map<string, string>;
export type DependenciesMap = Map<string, string[]>;
export type FilesDependencies = {
  namespaceMap: NamespaceMap;
  dependenciesMap: DependenciesMap;
};
