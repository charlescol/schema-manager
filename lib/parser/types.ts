export type NamespaceMap = Map<string, string>;
export type DependenciesMap = Map<string, string[]>;
export type DependenciesPartionnedMap = Map<string, Map<string, string[]>>;
export type FilesDependencies = {
  namespaceMap: NamespaceMap;
  dependenciesMap: DependenciesMap;
  dependenciesPartionnedMap: DependenciesPartionnedMap;
};
