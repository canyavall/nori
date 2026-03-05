export interface KnowledgeEntry {
  id: string;
  vault_id: string;
  file_path: string;
  title: string;
  category: string;
  tags: string[];
  description: string;
  required_knowledge: string[];
  rules: string[];
  content_hash: string;
  created_at: string;
  updated_at: string;
}

export interface KnowledgeFrontmatter {
  title: string;
  category: string;
  tags: string[];
  description: string;
  required_knowledge: string[];
  rules: string[];
  created?: string;
  updated?: string;
}

export interface KnowledgeProposal {
  title: string;
  category: string;
  tags: string[];
  description: string;
  required_knowledge: string[];
  rules: string[];
  content: string;
}

export interface KnowledgeLlmFinding {
  status: 'pass' | 'warn' | 'fail';
  message: string;
}

export interface KnowledgeLlmAuditResult {
  token_estimate: number;
  token_status: 'ok' | 'warn' | 'fail';
  overall_status: 'pass' | 'warn' | 'fail';
  overall_score: number;
  summary: string;
  findings: {
    llm_friendly: KnowledgeLlmFinding;
    has_real_knowledge: KnowledgeLlmFinding;
    conciseness: KnowledgeLlmFinding;
    tags: KnowledgeLlmFinding;
    description: KnowledgeLlmFinding;
    rules: KnowledgeLlmFinding;
    required_knowledge: KnowledgeLlmFinding;
    category: KnowledgeLlmFinding;
    format: KnowledgeLlmFinding;
    uniqueness: KnowledgeLlmFinding;
  };
  suggestions: {
    tags: string[];
    description: string;
    rules: string[];
    required_knowledge: string[];
    category: string;
    split_recommended: boolean;
    split_rationale?: string;
    similar_entries: Array<{ title: string; reason: string }>;
  };
}
