export interface SSEEventMap {
  // ─── Generic flow/step events ─────────────────────────────────
  'flow:started': { flow: string };
  'flow:completed': { flow: string };
  'flow:error': { flow: string; error: string };
  'step:started': { step: string };
  'step:completed': { step: string; data?: Record<string, unknown> };
  'step:error': { step: string; error: string };

  // ─── Vault: Registration ──────────────────────────────────────
  'vault:registration:started': { vault_name: string };
  'vault:registration:validating-url': { url: string };
  'vault:registration:testing-access': { url: string };
  'vault:registration:cloning': { url: string };
  'vault:registration:writing-config': { vault_name: string };
  'vault:registration:building-index': { vault_name: string };
  'vault:registration:completed': { vault_id: string; vault_name: string; knowledge_count: number };
  'vault:registration:error': { error: string; step: string };

  // ─── Vault: Link Project ──────────────────────────────────────
  'vault:link-project:started': { vault_id: string; project_path: string };
  'vault:link-project:validating-vault': { vault_id: string };
  'vault:link-project:validating-project': { project_path: string };
  'vault:link-project:writing-link': { vault_id: string };
  'vault:link-project:completed': { vault_id: string; vault_name: string; project_path: string };

  // ─── Vault: Pull ──────────────────────────────────────────────
  'vault:pull:started': { vault_id: string };
  'vault:pull:validating-config': { vault_id: string };
  'vault:pull:checking-local-changes': { vault_id: string };
  'vault:pull:local-changes-detected': { vault_id: string; changed_files: string[]; change_count: number };
  'vault:pull:fetching': { vault_id: string; url: string };
  'vault:pull:detecting-conflicts': { vault_id: string };
  'vault:pull:conflicts-detected': { vault_id: string; conflict_count: number; local_head: string; remote_head: string };
  'vault:pull:merging': { vault_id: string };
  'vault:pull:merge-warning': { vault_id: string; error: string };
  'vault:pull:updating-index': { vault_id: string };
  'vault:pull:index-warning': { vault_id: string; error: string };
  'vault:pull:logging-event': { vault_id: string };
  'vault:pull:log-warning': { vault_id: string; error: string };
  'vault:pull:completed': { vault_id: string; vault_name: string; files_changed: number; has_conflicts: boolean };

  // ─── Vault: Push ──────────────────────────────────────────────
  'vault:push:started': { vault_id: string };
  'vault:push:validating-config': { vault_id: string };
  'vault:push:checking-changes': { vault_id: string };
  'vault:push:no-changes': { vault_id: string; vault_name: string };
  'vault:push:changes-detected': { vault_id: string; changed_files: string[]; change_count: number };
  'vault:push:staging': { vault_id: string };
  'vault:push:committing': { vault_id: string };
  'vault:push:committed': { vault_id: string; commit_hash: string; commit_message: string };
  'vault:push:pushing': { vault_id: string; url: string };
  'vault:push:completed': { vault_id: string; vault_name: string; commit_hash: string; files_pushed: number };

  // ─── Vault: Audit ─────────────────────────────────────────────
  'vault:audit:started': { vault_id: string };
  'vault:audit:loading-entries': { vault_id: string };
  'vault:audit:validating-frontmatter': { entry_count: number };
  'vault:audit:validating-content': { entry_count: number };
  'vault:audit:checking-consistency': { vault_id: string };
  'vault:audit:generating-report': { vault_id: string };
  'vault:audit:completed': { vault_id: string; status: string };

  // ─── Vault: Reconciliation ────────────────────────────────────
  'vault:reconciliation:started': { vault_id: string };
  'vault:reconciliation:loading-local': { vault_path: string };
  'vault:reconciliation:loading-remote': { vault_id: string };
  'vault:reconciliation:loading-cache': { vault_path: string };
  'vault:reconciliation:comparing': { vault_id: string };
  'vault:reconciliation:generating-report': { vault_id: string };
  'vault:reconciliation:saving-cache': { vault_path: string };
  'vault:reconciliation:completed': { vault_id: string; has_changes: boolean; has_conflicts: boolean };

  // ─── Vault: Regenerate DB ─────────────────────────────────────
  'vault:regenerate-db:started': { vault_id: string };
  'vault:regenerate-db:scanning': { vault_path: string };
  'vault:regenerate-db:parsing': { file_count: number };
  'vault:regenerate-db:validating': { parsed_count: number };
  'vault:regenerate-db:building': { valid_count: number };
  'vault:regenerate-db:writing': { entry_count: number };
  'vault:regenerate-db:completed': { entry_count: number; skipped_count?: number; build_duration_ms?: number };

  // ─── Vault: Vector Embedding ──────────────────────────────────
  'vault:embedding:started': { vault_id: string };
  'vault:embedding:loading-entries': { vault_id: string };
  'vault:embedding:generating': { entry_count: number };
  'vault:embedding:storing': { embedded_count: number };
  'vault:embedding:validating': { vault_id: string };
  'vault:embedding:completed': { vault_id: string; embedded_count: number };

  // ─── Knowledge: Create ────────────────────────────────────────
  'knowledge:create:started': { vault_id: string; title: string };
  'knowledge:create:validating-frontmatter': { title: string };
  'knowledge:create:validating-content': { content_length: number };
  'knowledge:create:writing-file': { vault_path: string; title: string };
  'knowledge:create:auditing': { entry_id: string; file_path: string };
  'knowledge:create:audit-warning': { entry_id: string; message: string };
  'knowledge:create:regenerating-index': { vault_id: string };
  'knowledge:create:index-warning': { entry_id: string; message: string };
  'knowledge:create:completed': { entry_id: string; file_path: string; title: string };

  // ─── Knowledge: Edit ──────────────────────────────────────────
  'knowledge:edit:started': { vault_id: string; file_path: string };
  'knowledge:edit:loading': { file_path: string };
  'knowledge:edit:validating-changes': { file_path: string };
  'knowledge:edit:writing-changes': { file_path: string };
  'knowledge:edit:auditing': { entry_id: string; file_path: string };
  'knowledge:edit:audit-warning': { entry_id: string; message: string };
  'knowledge:edit:regenerating-index': { vault_id: string };
  'knowledge:edit:index-warning': { entry_id: string; message: string };
  'knowledge:edit:completed': { entry_id: string; file_path: string; title: string };

  // ─── Knowledge: Delete ────────────────────────────────────────
  'knowledge:delete:started': { vault_id: string; file_path: string };
  'knowledge:delete:validating-exists': { file_path: string };
  'knowledge:delete:checking-dependencies': { file_path: string };
  'knowledge:delete:deleting-file': { file_path: string };
  'knowledge:delete:regenerating-index': { vault_id: string };
  'knowledge:delete:index-warning': { file_path: string; message: string };
  'knowledge:delete:completed': { deleted_file_path: string };

  // ─── Knowledge: Search ────────────────────────────────────────
  'knowledge:search:started': { query: string };
  'knowledge:search:loading-index': { vault_id: string | undefined };
  'knowledge:search:index-loaded': { entry_count: number };
  'knowledge:search:parsing-query': { query: string };
  'knowledge:search:query-parsed': { filter_count: number; text: string };
  'knowledge:search:matching': { total_count: number };
  'knowledge:search:matched': { matched_count: number; total_count: number };
  'knowledge:search:scoring': { matched_count: number };
  'knowledge:search:scored': { scored_count: number; top_score: number };
  'knowledge:search:semantic-searching': { query: string };
  'knowledge:search:semantic-complete': { result_count: number };
  'knowledge:search:merging': { keyword_count: number; semantic_count: number };
  'knowledge:search:merged': { merged_count: number; duplicates_removed: number };
  'knowledge:search:formatting': { merged_count: number };
  'knowledge:search:completed': { result_count: number; total_count: number };

  // ─── Knowledge: Audit ─────────────────────────────────────────
  'knowledge:audit:started': { file_path: string };
  'knowledge:audit:loading-entry': { file_path: string };
  'knowledge:audit:validating-frontmatter': { file_path: string };
  'knowledge:audit:validating-content': { file_path: string };
  'knowledge:audit:checking-originality': { file_path: string };
  'knowledge:audit:generating-result': { file_path: string };
  'knowledge:audit:completed': { file_path: string; status: string };

  // ─── Knowledge: Index Build ───────────────────────────────────
  'knowledge:index-build:started': { vault_id: string };
  'knowledge:index-build:checking-fast-path': { vault_id: string };
  'knowledge:index-build:skipped': { vault_id: string; reason: string };
  'knowledge:index-build:scanning': { vault_path: string };
  'knowledge:index-build:parsing': { file_count: number };
  'knowledge:index-build:validating': { parsed_count: number };
  'knowledge:index-build:building': { valid_count: number };
  'knowledge:index-build:writing': { entry_count: number };
  'knowledge:index-build:completed': {
    entry_count: number;
    category_count?: number;
    tag_count?: number;
    build_duration_ms?: number;
    skipped_count?: number;
    fast_path_used?: boolean;
  };

  // ─── Session: Create ────────────────────────────────────────────
  'session:create:started': { vault_id: string };
  'session:create:checking-active': { vault_id: string };
  'session:create:archiving-previous': { previous_session_id: string };
  'session:create:creating-state': { session_id: string };
  'session:create:completed': { session_id: string; title: string };

  // ─── Session: Resume ────────────────────────────────────────────
  'session:resume:started': { session_id: string };
  'session:resume:validating': { session_id: string };
  'session:resume:restoring': { session_id: string };
  'session:resume:completed': { session_id: string; title: string };

  // ─── Session: Archive ───────────────────────────────────────────
  'session:archive:started': { session_id: string };
  'session:archive:checking-active': { session_id: string };
  'session:archive:archiving': { session_id: string };
  'session:archive:completed': { session_id: string };

  // ─── App: Integrity Check ──────────────────────────────────────
  'app:integrity-check:started': Record<string, unknown>;
  'app:integrity-check:validating-folders': Record<string, unknown>;
  'app:integrity-check:validating-files': Record<string, unknown>;
  'app:integrity-check:self-healing': { missing_dirs: number; missing_files: number };
  'app:integrity-check:completed': { folders_ok: number; files_ok: number; issues_fixed: number; issues_remaining: number };

  // ─── App: Authentication Check ─────────────────────────────────
  'app:authentication-check:started': Record<string, unknown>;
  'app:authentication-check:checking-claude-code-access': Record<string, unknown>;
  'app:authentication-check:checking-git-credentials': Record<string, unknown>;
  'app:authentication-check:self-healing': { cli_installed: boolean; has_ssh_key: boolean; has_credential_helper: boolean };
  'app:authentication-check:completed': { cli_installed: boolean; has_ssh_key: boolean; has_credential_helper: boolean; issues_count: number };

  // ─── App: Autoupdate ───────────────────────────────────────────
  'app:autoupdate:started': Record<string, unknown>;
  'app:autoupdate:checking-current-version': Record<string, unknown>;
  'app:autoupdate:fetching-latest-version': Record<string, unknown>;
  'app:autoupdate:skipped': { reason: string };
  'app:autoupdate:comparing-versions': { current_version: string; latest_version: string };
  'app:autoupdate:up-to-date': { current_version: string };
  'app:autoupdate:applying-update': { new_version: string };
  'app:autoupdate:completed': { current_version: string; new_version: string; applied: boolean };
}

export type SSEEventName = keyof SSEEventMap;
