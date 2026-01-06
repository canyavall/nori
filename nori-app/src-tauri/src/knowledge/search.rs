use super::{KnowledgeIndex, SearchQuery, SearchResult};

impl KnowledgeIndex {
    /// Search packages by tags, text, and category
    pub fn search(&self, query: &SearchQuery) -> Vec<SearchResult> {
        let mut results: Vec<SearchResult> = Vec::new();

        for package in self.packages.values() {
            let mut score = 0.0f32;
            let mut matches = true;

            // Category filter (exact match, required)
            if let Some(ref category) = query.category {
                if !package.category.to_lowercase().contains(&category.to_lowercase()) {
                    matches = false;
                    continue;
                }
                score += 0.3;
            }

            // Tags filter (OR logic - any tag match)
            if let Some(ref tags) = query.tags {
                if !tags.is_empty() {
                    let mut tag_match = false;
                    for query_tag in tags {
                        let query_tag_lower = query_tag.to_lowercase();
                        for package_tag in &package.tags {
                            if package_tag.to_lowercase().contains(&query_tag_lower) {
                                tag_match = true;
                                score += 0.2;
                                break;
                            }
                        }
                        if tag_match {
                            break;
                        }
                    }
                    if !tag_match {
                        matches = false;
                        continue;
                    }
                }
            }

            // Text search (searches in name and description)
            if let Some(ref text) = query.text {
                let text_lower = text.to_lowercase();
                let mut text_match = false;

                if package.name.to_lowercase().contains(&text_lower) {
                    text_match = true;
                    score += 0.5; // Higher score for name match
                }

                if package.description.to_lowercase().contains(&text_lower) {
                    text_match = true;
                    score += 0.3;
                }

                if !text_match {
                    matches = false;
                    continue;
                }
            }

            if matches {
                results.push(SearchResult {
                    package: package.clone(),
                    relevance_score: score,
                });
            }
        }

        // Sort by relevance score (highest first)
        results.sort_by(|a, b| {
            b.relevance_score
                .partial_cmp(&a.relevance_score)
                .unwrap_or(std::cmp::Ordering::Equal)
        });

        // Apply max results limit
        if let Some(max) = query.max_results {
            results.truncate(max);
        }

        results
    }

    /// Get all unique categories
    pub fn get_categories(&self) -> Vec<String> {
        let mut categories: Vec<String> = self
            .packages
            .values()
            .map(|p| p.category.clone())
            .collect::<std::collections::HashSet<_>>()
            .into_iter()
            .collect();

        categories.sort();
        categories
    }

    /// Get all unique tags
    pub fn get_tags(&self) -> Vec<String> {
        let mut tags: Vec<String> = self
            .packages
            .values()
            .flat_map(|p| p.tags.clone())
            .collect::<std::collections::HashSet<_>>()
            .into_iter()
            .collect();

        tags.sort();
        tags
    }
}
