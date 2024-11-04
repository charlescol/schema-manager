export type DependenciesNameMap = Map<string, string>;
export type DependenciesMap = Map<string, string[]>;
export type DependenciesPartionnedMap = Map<string, Map<string, string[]>>;
export type FilesDependencies = {
  dependenciesNameMap: DependenciesNameMap;
  dependenciesMap: DependenciesMap;
  dependenciesPartionnedMap: DependenciesPartionnedMap;
};
