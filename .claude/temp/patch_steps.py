import json
import os
from collections import OrderedDict

BASE = "C:/Users/canya/Documents/projects/nori/packages/app/src/features"

# Tuples: (relative_path, success_handling_dict, error_handling_list_or_None)
# error_handling_list is only set for the 5 files that are missing it
patches = [
    # ── knowledge-create ─────────────────────────────────────────────────────
    ("knowledge/knowledge-create/steps/01-show-frontmatter-form.json",
     {"criteria": "All required frontmatter fields are filled and pass schema validation",
      "transition": "02-show-content-editor"}, None),

    ("knowledge/knowledge-create/steps/02-show-content-editor.json",
     {"criteria": "User saves content and it is non-empty",
      "transition": "03-preview-knowledge"}, None),

    ("knowledge/knowledge-create/steps/03-preview-knowledge.json",
     {"criteria": "User reviews the rendered preview and confirms creation",
      "transition": "04-call-backend"}, None),

    ("knowledge/knowledge-create/steps/04-call-backend.json",
     {"criteria": "Backend confirms the entry is written, audited, and indexed — SSE completed event received",
      "transition": "05-show-audit-results"}, None),

    ("knowledge/knowledge-create/steps/05-show-audit-results.json",
     {"criteria": "User acknowledges the audit report and continues",
      "transition": "navigate:/knowledge/{entry_id}"}, None),

    # ── knowledge-delete ─────────────────────────────────────────────────────
    ("knowledge/knowledge-delete/steps/01-show-confirmation.json",
     {"criteria": "User explicitly confirms the deletion",
      "transition": "02-call-backend"}, None),

    ("knowledge/knowledge-delete/steps/02-call-backend.json",
     {"criteria": "Backend confirms the entry file is removed and the index is updated — SSE completed event received",
      "transition": "03-show-result"}, None),

    ("knowledge/knowledge-delete/steps/03-show-result.json",
     {"criteria": "User dismisses the success screen",
      "transition": "navigate:/knowledge"}, None),

    # ── knowledge-edit ───────────────────────────────────────────────────────
    ("knowledge/knowledge-edit/steps/01-load-entry.json",
     {"criteria": "Backend returns the full entry data including frontmatter and content",
      "transition": "02-show-edit-form"}, None),

    ("knowledge/knowledge-edit/steps/02-show-edit-form.json",
     {"criteria": "User submits edits and the form passes client-side validation",
      "transition": "03-call-backend"}, None),

    ("knowledge/knowledge-edit/steps/03-call-backend.json",
     {"criteria": "Backend confirms the changes are written, audited, and indexed — SSE completed event received",
      "transition": "04-show-audit-results"}, None),

    ("knowledge/knowledge-edit/steps/04-show-audit-results.json",
     {"criteria": "User acknowledges the audit report and continues",
      "transition": "navigate:/knowledge/{entry_id}"}, None),

    # ── knowledge-search ─────────────────────────────────────────────────────
    ("knowledge/knowledge-search/steps/01-show-search-form.json",
     {"criteria": "User enters a query and submits the search form",
      "transition": "02-call-backend"}, None),

    ("knowledge/knowledge-search/steps/02-call-backend.json",
     {"criteria": "Backend returns a ranked list of matching knowledge entries",
      "transition": "03-show-results"}, None),

    ("knowledge/knowledge-search/steps/03-show-results.json",
     {"criteria": "User selects an entry from the results list",
      "transition": "navigate:/knowledge/{entry_id}"}, None),

    # ── navigation/app-auth-status ───────────────────────────────────────────
    ("navigation/app-auth-status/steps/01-poll-auth-status.json",
     {"criteria": "Auth status response is received from the backend",
      "transition": "02-show-auth-indicator"}, None),

    ("navigation/app-auth-status/steps/02-show-auth-indicator.json",
     {"criteria": "Auth status indicator is rendered in the navigation bar",
      "transition": "navigate:/settings (on user click)"}, None),

    # ── navigation/project-select ────────────────────────────────────────────
    ("navigation/project-select/steps/01-show-project-card.json",
     {"criteria": "User clicks a project card to select it",
      "transition": "02-set-active-project"}, None),

    ("navigation/project-select/steps/02-set-active-project.json",
     {"criteria": "Selected project is stored as the active project in the navigation store",
      "transition": "active project reflected in sidebar context"}, None),

    ("navigation/project-select/steps/03-clear-project-context.json",
     {"criteria": "Active project is cleared from the navigation store",
      "transition": "navigate:/projects"}, None),

    # ── navigation/vault-select ──────────────────────────────────────────────
    ("navigation/vault-select/steps/01-show-vault-card.json",
     {"criteria": "User clicks a vault card to select it",
      "transition": "02-set-active-vault"}, None),

    ("navigation/vault-select/steps/02-set-active-vault.json",
     {"criteria": "Selected vault is stored as the active vault and knowledge tree begins loading",
      "transition": "vault-knowledge-tree/01-load-knowledge"}, None),

    ("navigation/vault-select/steps/03-clear-vault-context.json",
     {"criteria": "Active vault is cleared from the navigation store",
      "transition": "navigate:/vaults"}, None),

    # ── project/project-register ─────────────────────────────────────────────
    ("project/project-register/steps/01-show-register-form.json",
     {"criteria": "User fills in the project name and path fields",
      "transition": "03-submit-registration (or 02-pick-folder for directory browse)"}, None),

    ("project/project-register/steps/02-pick-folder.json",
     {"criteria": "User selects a folder via the native directory picker",
      "transition": "01-show-register-form (path pre-filled)"}, None),

    ("project/project-register/steps/03-submit-registration.json",
     {"criteria": "Backend confirms the project is registered",
      "transition": "close_dialog"}, None),

    # ── session/session-browser ──────────────────────────────────────────────
    ("session/session-browser/steps/01-show-session-list.json",
     {"criteria": "User selects an existing session or requests a new one",
      "transition": "02-show-session-detail (select) or 03-call-create-session (new)"}, None),

    ("session/session-browser/steps/02-show-session-detail.json",
     {"criteria": "User chooses to resume the displayed session",
      "transition": "04-call-resume-session"}, None),

    ("session/session-browser/steps/03-call-create-session.json",
     {"criteria": "Backend creates a new session and returns its ID",
      "transition": "navigate:/chat/{session_id}"}, None),

    ("session/session-browser/steps/04-call-resume-session.json",
     {"criteria": "Backend restores the session context and returns the session ID",
      "transition": "navigate:/chat/{session_id}"}, None),

    # ── settings/settings-theme ──────────────────────────────────────────────
    ("settings/settings-theme/steps/01-show-theme-switcher.json",
     {"criteria": "User selects a theme option",
      "transition": "02-apply-theme"}, None),

    ("settings/settings-theme/steps/02-apply-theme.json",
     {"criteria": "Selected theme is applied to the CSS custom properties and persisted to localStorage",
      "transition": "theme updated in UI (no navigation)"}, None),

    # ── vault/vault-knowledge-export ─────────────────────────────────────────
    ("vault/vault-knowledge-export/steps/01-pick-destination.json",
     {"criteria": "User selects a valid writable destination folder",
      "transition": "02-call-backend"},
     [
         {"type": "picker_cancelled", "display": "none",
          "description": "User dismissed the folder dialog without selecting — stay on current step"},
         {"type": "invalid_destination", "display": "toast_error",
          "description": "Selected path is not writable or no longer exists on the filesystem"},
     ]),

    ("vault/vault-knowledge-export/steps/02-call-backend.json",
     {"criteria": "Backend exports all entries and the SSE completed event is received with total exported count",
      "transition": "show done state with exported count and destination path"},
     [
         {"type": "export_failed", "display": "toast_error",
          "description": "Backend failed to write one or more files — show error count and allow retry"},
         {"type": "network_error", "display": "toast_error",
          "description": "Backend is unreachable — show generic network error with retry option"},
     ]),

    # ── vault/vault-knowledge-import ─────────────────────────────────────────
    ("vault/vault-knowledge-import/steps/01-pick-files.json",
     {"criteria": "User selects at least one .md file or a folder containing Markdown files",
      "transition": "02-call-backend"},
     [
         {"type": "picker_cancelled", "display": "none",
          "description": "User dismissed the file picker without selecting — stay on current step"},
         {"type": "no_files_selected", "display": "toast_error",
          "description": "User confirmed the picker but no files matched the .md filter"},
     ]),

    ("vault/vault-knowledge-import/steps/02-call-backend.json",
     {"criteria": "Backend processes all selected files and the SSE completed event is received with imported and skipped counts",
      "transition": "show done state with imported and skipped counts"},
     [
         {"type": "import_failed", "display": "toast_error",
          "description": "Backend encountered errors processing files — show failed count and allow retry"},
         {"type": "network_error", "display": "toast_error",
          "description": "Backend is unreachable — show generic network error with retry option"},
     ]),

    # ── vault/vault-knowledge-tree ───────────────────────────────────────────
    ("vault/vault-knowledge-tree/steps/01-load-knowledge.json",
     {"criteria": "Backend returns the full list of knowledge entries for the active vault",
      "transition": "02-show-tree"}, None),

    ("vault/vault-knowledge-tree/steps/02-show-tree.json",
     {"criteria": "Knowledge tree is rendered with entries grouped by category",
      "transition": "03-edit-entry (on entry click) or 01-load-knowledge (on refresh)"}, None),

    ("vault/vault-knowledge-tree/steps/03-edit-entry.json",
     {"criteria": "User saves changes to the entry",
      "transition": "02-show-tree"}, None),

    # ── vault/vault-link-project ─────────────────────────────────────────────
    ("vault/vault-link-project/steps/01-show-vault-picker.json",
     {"criteria": "User selects a vault from the list",
      "transition": "02-show-project-picker"}, None),

    ("vault/vault-link-project/steps/02-show-project-picker.json",
     {"criteria": "User selects a project to link to the chosen vault",
      "transition": "03-call-backend"}, None),

    ("vault/vault-link-project/steps/03-call-backend.json",
     {"criteria": "Backend confirms the vault–project link is written",
      "transition": "04-show-confirmation"}, None),

    ("vault/vault-link-project/steps/04-show-confirmation.json",
     {"criteria": "User dismisses the confirmation screen",
      "transition": "close_dialog"}, None),

    # ── vault/vault-registration ─────────────────────────────────────────────
    ("vault/vault-registration/steps/00-choose-type.json",
     {"criteria": "User selects a vault type (git or local)",
      "transition": "01-show-form"},
     []),  # no error conditions for a simple type selection

    ("vault/vault-registration/steps/01-show-form.json",
     {"criteria": "User fills in all required fields for the selected vault type",
      "transition": "02-validate-input"}, None),

    ("vault/vault-registration/steps/02-validate-input.json",
     {"criteria": "All fields pass the Zod schema for the chosen vault type (git or local)",
      "transition": "03-call-backend"}, None),

    ("vault/vault-registration/steps/03-call-backend.json",
     {"criteria": "Backend confirms the vault is registered and the index is built — SSE completed event received",
      "transition": "04-show-result"}, None),

    ("vault/vault-registration/steps/04-show-result.json",
     {"criteria": "User acknowledges the registration success screen",
      "transition": "navigate:/vaults/{vault_id}"}, None),

    # ── vault/vault-sync-panel ───────────────────────────────────────────────
    ("vault/vault-sync-panel/steps/01-show-sync-status.json",
     {"criteria": "Sync status is rendered and user triggers a pull",
      "transition": "02-trigger-pull"}, None),

    ("vault/vault-sync-panel/steps/02-trigger-pull.json",
     {"criteria": "Backend completes the pull without conflicts — SSE completed event received",
      "transition": "03-show-pull-results"}, None),

    ("vault/vault-sync-panel/steps/03-show-pull-results.json",
     {"criteria": "Pull results are displayed; no conflicts requiring resolution",
      "transition": "panel returns to 01-show-sync-status"}, None),

    ("vault/vault-sync-panel/steps/04-show-conflict-resolver.json",
     {"criteria": "All conflicts are resolved and the user confirms",
      "transition": "03-show-pull-results"}, None),
]


def insert_before_key(d, before_key, new_key, new_value):
    result = OrderedDict()
    for k, v in d.items():
        if k == before_key:
            result[new_key] = new_value
        result[k] = v
    if new_key not in result:
        result[new_key] = new_value
    return result


def process(rel_path, success_handling, error_handling_add):
    path = os.path.join(BASE, rel_path).replace("\\", "/")
    with open(path, "r", encoding="utf-8") as f:
        data = json.load(f, object_pairs_hook=OrderedDict)

    # Insert success_handling before error_handling (or before decisions if missing)
    if "success_handling" not in data:
        if "error_handling" in data:
            data = insert_before_key(data, "error_handling", "success_handling", success_handling)
        elif "decisions" in data:
            data = insert_before_key(data, "decisions", "success_handling", success_handling)
        else:
            data["success_handling"] = success_handling

    # Insert error_handling before decisions if it was absent
    if error_handling_add is not None and "error_handling" not in data:
        if "decisions" in data:
            data = insert_before_key(data, "decisions", "error_handling", error_handling_add)
        else:
            data["error_handling"] = error_handling_add

    with open(path, "w", encoding="utf-8", newline="\n") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
        f.write("\n")

    print(f"OK  {rel_path}")


for rel_path, success, error_add in patches:
    process(rel_path, success, error_add)

print(f"\nDone — patched {len(patches)} files.")
