export interface SearchResultItem {
  entry_id: string;
  title: string;
  file_path: string;
  category: string;
  tags: string[];
  score: number;
}

export interface SearchResultsProps {
  results: SearchResultItem[];
  totalCount: number;
  query: string;
}
