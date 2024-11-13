export type VersionMap = Map<string, Map<string, string>>;
export type VersionData = {
  versionMap: VersionMap;
};

export enum DependencyResolutionMode {
  IMPLICIT = 'IMPLICIT',
  EXPLICIT = 'EXPLICIT',
}
