export interface ConflictResolverProps {
  conflictFiles: string[];
  vaultPath: string;
  onDone: () => void;
}
