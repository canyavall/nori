export interface Package {
  name: string;
  category: string;
  description: string;
  tags: string[];
  used_by_agents: string[];
  required_knowledge: string[];
  knowledge_path: string;
  content: string;
}

export interface SearchQuery {
  tags?: string[];
  text?: string;
  category?: string;
  max_results?: number;
}

export interface SearchResult {
  package: Package;
  relevance_score: number;
}

export interface KnowledgeIndex {
  packages: Record<string, Package>;
  total_count: number;
}
