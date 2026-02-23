import { createSignal, createMemo, onMount } from 'solid-js';
import type { Accessor } from 'solid-js';
import type { DiscoveredProject, ClaudeSkill, ClaudeRule, ClaudeMcpServer, ClaudeHookConfig, ClaudeMdFile } from '@nori/shared';
import { apiGet } from '../../../../lib/api';

export type HooksData = {
  shared: ClaudeHookConfig | null;
  local: ClaudeHookConfig | null;
  sharedRaw: string;
  localRaw: string;
};

export const useProjectDashboardSection = (project: Accessor<DiscoveredProject>) => {
  const [skills, setSkills] = createSignal<ClaudeSkill[]>([]);
  const [rules, setRules] = createSignal<ClaudeRule[]>([]);
  const [hooksData, setHooksData] = createSignal<HooksData>({
    shared: null,
    local: null,
    sharedRaw: '',
    localRaw: '',
  });
  const [mcpServers, setMcpServers] = createSignal<ClaudeMcpServer[]>([]);
  const [mcpRaw, setMcpRaw] = createSignal('');
  const [claudeMds, setClaudeMds] = createSignal<ClaudeMdFile[]>([]);
  const [loading, setLoading] = createSignal(true);

  const projectPath = createMemo(() => btoa(project().path));

  onMount(async () => {
    const pp = projectPath();
    const [skillsRes, rulesRes, hooksRes, mcpsRes, claudeMdsRes] = await Promise.allSettled([
      apiGet<{ data: ClaudeSkill[] }>(`/api/project/claude/skills?projectPath=${pp}`),
      apiGet<{ data: ClaudeRule[] }>(`/api/project/claude/rules?projectPath=${pp}`),
      apiGet<{ data: HooksData }>(`/api/project/claude/hooks?projectPath=${pp}`),
      apiGet<{ data: { servers: ClaudeMcpServer[]; raw: string } }>(
        `/api/project/claude/mcps?projectPath=${pp}`,
      ),
      apiGet<{ data: ClaudeMdFile[] }>(`/api/project/claude/claude-mds?projectPath=${pp}`),
    ]);

    if (skillsRes.status === 'fulfilled') setSkills(skillsRes.value.data);
    if (rulesRes.status === 'fulfilled') setRules(rulesRes.value.data);
    if (hooksRes.status === 'fulfilled') setHooksData(hooksRes.value.data);
    if (mcpsRes.status === 'fulfilled') {
      setMcpServers(mcpsRes.value.data.servers);
      setMcpRaw(mcpsRes.value.data.raw);
    }
    if (claudeMdsRes.status === 'fulfilled') setClaudeMds(claudeMdsRes.value.data);

    setLoading(false);
  });

  return {
    skills,
    rules,
    hooksData,
    mcpServers,
    mcpRaw,
    claudeMds,
    loading,
    projectPath,
  };
};
