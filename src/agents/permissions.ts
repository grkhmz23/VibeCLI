export type RolePermission = {
  canReadRepo: boolean;
  canWriteSource: boolean;
  canWriteRunArtifacts: boolean;
  canRunShell: boolean;
  shellScope:
    | "none"
    | "safe-readonly"
    | "scanner"
    | "test"
    | "git-release"
    | "future-implementation";
};
