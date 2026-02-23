// Types
export type { FlowEmitter, StepResult, FlowError, FlowResult } from './types/flow.js';
export type { Vault, VaultLink, VaultSyncStatus } from './types/vault.js';
export type { KnowledgeEntry, KnowledgeFrontmatter, KnowledgeProposal } from './types/knowledge.js';
export type { Session, Message } from './types/session.js';
export type { Project, ProjectSettings, ProjectSource, DiscoveredProject } from './types/project.js';
export type {
  ClaudeSkill,
  ClaudeRuleType,
  ClaudeRule,
  ClaudeHookEvent,
  ClaudeHookEntry,
  ClaudeHookConfig,
  ClaudeMcpServer,
} from './types/claude-config.js';
export type { SSEEventMap, SSEEventName } from './types/events.js';
export type { ApiError, ApiResponse } from './types/api.js';

// Schemas — Vault
export {
  vaultRegistrationSchema,
  type VaultRegistrationInput,
  vaultLocalRegistrationSchema,
  type VaultLocalRegistrationInput,
  vaultLinkProjectSchema,
  type VaultLinkProjectInput,
  vaultKnowledgeImportSchema,
  type VaultKnowledgeImportInput,
  vaultKnowledgeExportSchema,
  type VaultKnowledgeExportInput,
} from './schemas/vault.schema.js';

// Schemas — Knowledge
export {
  knowledgeFrontmatterSchema,
  type KnowledgeFrontmatterInput,
  knowledgeCreateSchema,
  type KnowledgeCreateInput,
  knowledgeEditSchema,
  type KnowledgeEditInput,
  knowledgeSearchSchema,
  type KnowledgeSearchInput,
} from './schemas/knowledge.schema.js';

// Schemas — Session
export {
  sessionCreateSchema,
  type SessionCreateInput,
  sessionResumeSchema,
  type SessionResumeInput,
  sessionArchiveSchema,
  type SessionArchiveInput,
} from './schemas/session.schema.js';

// Contracts — Vault
export {
  type VaultRegistrationResponse,
  type VaultRegistrationEvents,
  type VaultLocalRegistrationEvents,
  type VaultLinkProjectResponse,
  type VaultLinkProjectEvents,
  type VaultListLinksResponse,
  type VaultUnlinkProjectResponse,
  type VaultUnlinkProjectEvents,
  type VaultKnowledgeImportResponse,
  type VaultKnowledgeImportEvents,
  type VaultKnowledgeExportResponse,
  type VaultKnowledgeExportEvents,
  type VaultPullResponse,
  type VaultPullEvents,
  type VaultPushResponse,
  type VaultPushEvents,
  type VaultAuditEvents,
  type VaultReconciliationEvents,
  type VaultRegenerateDbEvents,
  type VaultEmbeddingEvents,
  VAULT_REGISTRATION_API,
  VAULT_LOCAL_REGISTRATION_API,
  VAULT_LIST_API,
  VAULT_LINK_PROJECT_API,
  VAULT_LIST_LINKS_API,
  VAULT_UNLINK_PROJECT_API,
  VAULT_KNOWLEDGE_IMPORT_API,
  VAULT_KNOWLEDGE_EXPORT_API,
  VAULT_PULL_API,
  VAULT_PUSH_API,
  VAULT_RECONCILIATION_API,
  VAULT_REGENERATE_DB_API,
  VAULT_VECTOR_EMBEDDING_API,
  VAULT_AUDIT_API,
} from './contracts/vault.contract.js';

// Contracts — Knowledge
export {
  type KnowledgeCreateRequest,
  type KnowledgeEditRequest,
  type KnowledgeSearchRequest,
  type KnowledgeCreateResponse,
  type KnowledgeEditResponse,
  type KnowledgeDeleteResponse,
  type KnowledgeSearchResponse,
  type KnowledgeSearchResult,
  type KnowledgeAuditResponse,
  type KnowledgeContentResponse,
  type KnowledgeCreateEvents,
  type KnowledgeEditEvents,
  type KnowledgeDeleteEvents,
  type KnowledgeSearchEvents,
  type KnowledgeAuditEvents,
  type KnowledgeIndexBuildEvents,
  KNOWLEDGE_CREATE_API,
  KNOWLEDGE_LIST_API,
  KNOWLEDGE_GET_API,
  KNOWLEDGE_CONTENT_API,
  KNOWLEDGE_SEARCH_API,
  KNOWLEDGE_EDIT_API,
  KNOWLEDGE_DELETE_API,
  KNOWLEDGE_AUDIT_API,
  KNOWLEDGE_AI_GENERATE_API,
  type KnowledgeAiGenerateRequest,
  type KnowledgeAiGenerateResponse,
} from './contracts/knowledge.contract.js';

// Contracts — Session
export {
  type SessionCreateResponse,
  type SessionResumeResponse,
  type SessionArchiveResponse,
  type SessionCreateEvents,
  type SessionResumeEvents,
  type SessionArchiveEvents,
  SESSION_CREATE_API,
  SESSION_LIST_API,
  SESSION_GET_API,
  SESSION_RESUME_API,
  SESSION_ARCHIVE_API,
} from './contracts/session.contract.js';

// Contracts — App
export {
  type HealthCheckResponse,
  type IntegrityCheckResponse,
  type AuthenticationCheckResponse,
  type AnthropicAccessType,
  type AutoUpdateResponse,
  type IntegrityCheckEvents,
  type AuthenticationCheckEvents,
  type AutoUpdateEvents,
  HEALTH_CHECK_API,
  APP_INTEGRITY_CHECK_API,
  APP_AUTHENTICATION_CHECK_API,
  APP_AUTOUPDATE_API,
  APP_INFO_API,
  type AppInfoResponse,
} from './contracts/app.contract.js';

// Schemas — Project
export {
  projectRegisterSchema,
  type ProjectRegisterInput,
} from './schemas/project.schema.js';

// Contracts — Project
export {
  type ProjectRegisterResponse,
  type ProjectListResponse,
  type ProjectDiscoverResponse,
  PROJECT_LIST_API,
  PROJECT_REGISTER_API,
  PROJECT_DISCOVER_API,
} from './contracts/project.contract.js';

// Contracts — Claude Config
export {
  type ClaudeSkillListResponse,
  type ClaudeSkillReadResponse,
  type ClaudeSkillWriteResponse,
  type ClaudeRuleListResponse,
  type ClaudeRuleReadResponse,
  type ClaudeRuleWriteResponse,
  type ClaudeHooksResponse,
  type ClaudeHooksWriteResponse,
  type ClaudeMcpListResponse,
  type ClaudeMcpWriteResponse,
  CLAUDE_SKILLS_LIST_API,
  CLAUDE_SKILLS_READ_API,
  CLAUDE_SKILLS_WRITE_API,
  CLAUDE_RULES_LIST_API,
  CLAUDE_RULES_READ_API,
  CLAUDE_RULES_WRITE_API,
  CLAUDE_HOOKS_READ_API,
  CLAUDE_HOOKS_WRITE_API,
  CLAUDE_MCPS_READ_API,
  CLAUDE_MCPS_WRITE_API,
} from './contracts/claude-config.contract.js';

// Contracts — Repo Knowledge Extract
export {
  repoKnowledgeExtractStartSchema,
  type RepoKnowledgeExtractStartInput,
  repoKnowledgeExtractReplySchema,
  type RepoKnowledgeExtractReplyInput,
  type RepoKnowledgeExtractStartResponse,
  type RepoKnowledgeExtractReplyResponse,
  type RepoKnowledgeExtractEvents,
  REPO_KNOWLEDGE_EXTRACT_START_API,
  REPO_KNOWLEDGE_EXTRACT_REPLY_API,
} from './contracts/repo-knowledge-extract.contract.js';

// Constants
export {
  NORI_DATA_DIR_NAME,
  NORI_DB_FILENAME,
  NORI_VAULTS_DIR,
  NORI_SERVER_PORT,
  NORI_APP_DEV_PORT,
} from './constants.js';
