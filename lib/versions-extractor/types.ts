export type VersionMap = Map<string, Map<string, string>>;
export type FileMap = Map<string, Array<{ version: string; full: string }>>;
export type VersionData = {
  fileMap: FileMap;
  versionMap: VersionMap;
};

export enum DependencyResolutionMode {
  IMPLICIT = 'IMPLICIT',
  EXPLICIT = 'EXPLICIT',
}
