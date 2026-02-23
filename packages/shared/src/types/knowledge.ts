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
  optional_knowledge?: string[];
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
  optional_knowledge?: string[];
  content: string;
}
