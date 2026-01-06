import {
  VStack,
  HStack,
  Box,
  Button,
  Heading,
  Divider,
  useToast,
  Alert,
  AlertIcon,
} from '@chakra-ui/react';
import { useState, useEffect, useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { FrontmatterForm } from './FrontmatterForm';
import { CodeMirrorEditor } from './CodeMirrorEditor';
import type { Package } from '../../types/knowledge';

interface KnowledgeEditorProps {
  package: Package | null;
  categories: string[];
  vaultPath?: string;
  onSaved: () => void;
  onCancel: () => void;
}

export function KnowledgeEditor({ package: pkg, categories, vaultPath, onSaved, onCancel }: KnowledgeEditorProps) {
  const [frontmatter, setFrontmatter] = useState({
    name: pkg?.name || '',
    category: pkg?.category || '',
    description: pkg?.description || '',
    tags: pkg?.tags || [],
    used_by_agents: pkg?.used_by_agents || [],
    required_knowledge: pkg?.required_knowledge || [],
  });

  const [markdownContent, setMarkdownContent] = useState(pkg?.content || '');
  const [hasChanges, setHasChanges] = useState(false);
  const [saving, setSaving] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const toast = useToast();

  // Track changes
  useEffect(() => {
    const changed =
      frontmatter.name !== (pkg?.name || '') ||
      frontmatter.category !== (pkg?.category || '') ||
      frontmatter.description !== (pkg?.description || '') ||
      JSON.stringify(frontmatter.tags) !== JSON.stringify(pkg?.tags || []) ||
      markdownContent !== (pkg?.content || '');

    setHasChanges(changed);
  }, [frontmatter, markdownContent, pkg]);

  // Warn on unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasChanges]);

  // Build full package content
  const buildPackageContent = useCallback(() => {
    const yaml = `---
name: ${frontmatter.name}
category: ${frontmatter.category}
description: ${frontmatter.description}
tags: [${frontmatter.tags.join(', ')}]
used_by_agents: [${frontmatter.used_by_agents.join(', ')}]
required_knowledge: [${frontmatter.required_knowledge.join(', ')}]
---

${markdownContent}`;

    return yaml;
  }, [frontmatter, markdownContent]);

  // Save package
  const handleSave = async () => {
    try {
      setSaving(true);
      setValidationError(null);

      const content = buildPackageContent();

      // Validate
      const isValid = await invoke<boolean>('validate_package', { content });

      if (!isValid) {
        throw new Error('Validation failed');
      }

      // Save
      await invoke('save_package', { name: frontmatter.name, content, vaultPath: vaultPath || null });

      toast({
        title: 'Package saved',
        description: `${frontmatter.name} has been saved successfully`,
        status: 'success',
        duration: 3000,
      });

      setHasChanges(false);
      onSaved();
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      setValidationError(errorMsg);
      toast({
        title: 'Save failed',
        description: errorMsg,
        status: 'error',
        duration: 5000,
      });
    } finally {
      setSaving(false);
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + S to save
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        if (hasChanges && !saving) {
          handleSave();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [hasChanges, saving, handleSave]);

  return (
    <VStack h="100%" align="stretch" spacing={4} p={4}>
      <HStack justify="space-between">
        <Heading size="md">
          {pkg ? `Edit: ${pkg.name}` : 'New Knowledge Package'}
        </Heading>
        <HStack>
          <Button size="sm" variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            size="sm"
            colorScheme="blue"
            onClick={handleSave}
            isLoading={saving}
            isDisabled={!hasChanges}
          >
            Save (Cmd+S)
          </Button>
        </HStack>
      </HStack>

      {validationError && (
        <Alert status="error">
          <AlertIcon />
          {validationError}
        </Alert>
      )}

      <Divider />

      <Box overflowY="auto" flex="1">
        <VStack align="stretch" spacing={6}>
          <Box>
            <Heading size="sm" mb={4}>
              Metadata
            </Heading>
            <FrontmatterForm
              frontmatter={frontmatter}
              onChange={setFrontmatter}
              categories={categories}
            />
          </Box>

          <Divider />

          <Box flex="1">
            <Heading size="sm" mb={4}>
              Content (Markdown)
            </Heading>
            <CodeMirrorEditor value={markdownContent} onChange={setMarkdownContent} />
          </Box>
        </VStack>
      </Box>
    </VStack>
  );
}
