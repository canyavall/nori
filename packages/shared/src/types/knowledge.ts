export interface KnowledgeEntry {
  id: string;
  vault_id: string;
  file_path: string;
  title: string;
  category: string;
  tags: string[];
  content_hash: string;
  created_at: string;
  updated_at: string;
}

export interface KnowledgeFrontmatter {
  title: string;
  category: string;
  tags?: string[];
  created?: string;
  updated?: string;
}
