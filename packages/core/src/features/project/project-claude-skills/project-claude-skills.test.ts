import { describe, it, expect, afterEach } from 'vitest';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { runListClaudeSkills, runReadClaudeSkill, runWriteClaudeSkill } from './project-claude-skills.js';

let tempDirs: string[] = [];

afterEach(() => {
  for (const dir of tempDirs) {
    rmSync(dir, { recursive: true, force: true });
  }
  tempDirs = [];
});

function makeTempDir(): string {
  const dir = mkdtempSync(join(tmpdir(), 'nori-skills-test-'));
  tempDirs.push(dir);
  return dir;
}

function makeSkill(projectDir: string, name: string, content: string): void {
  const skillDir = join(projectDir, '.claude', 'skills', name);
  mkdirSync(skillDir, { recursive: true });
  writeFileSync(join(skillDir, 'SKILL.md'), content, 'utf-8');
}

describe('runListClaudeSkills', () => {
  it('returns empty array when .claude/skills/ does not exist', async () => {
    const dir = makeTempDir();
    const result = await runListClaudeSkills({ projectPath: dir });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.skills).toHaveLength(0);
    }
  });

  it('returns empty array when .claude/skills/ is empty', async () => {
    const dir = makeTempDir();
    mkdirSync(join(dir, '.claude', 'skills'), { recursive: true });
    const result = await runListClaudeSkills({ projectPath: dir });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.skills).toHaveLength(0);
    }
  });

  it('lists skills with parsed frontmatter', async () => {
    const dir = makeTempDir();
    makeSkill(dir, 'my-skill', `---
description: A test skill
globs:
  - "*.ts"
alwaysApply: true
---
This is the skill body.
`);

    const result = await runListClaudeSkills({ projectPath: dir });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.skills).toHaveLength(1);
      const skill = result.data.skills[0];
      expect(skill.name).toBe('my-skill');
      expect(skill.description).toBe('A test skill');
      expect(skill.globs).toEqual(['*.ts']);
      expect(skill.alwaysApply).toBe(true);
      expect(skill.content).toBe('This is the skill body.');
      expect(skill.path).toBe('.claude/skills/my-skill/SKILL.md');
    }
  });

  it('handles multiple skills', async () => {
    const dir = makeTempDir();
    makeSkill(dir, 'skill-a', '---\ndescription: Skill A\n---\nBody A');
    makeSkill(dir, 'skill-b', '---\ndescription: Skill B\n---\nBody B');

    const result = await runListClaudeSkills({ projectPath: dir });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.skills).toHaveLength(2);
      const names = result.data.skills.map((s: { name: string }) => s.name).sort();
      expect(names).toEqual(['skill-a', 'skill-b']);
    }
  });

  it('skips directories without SKILL.md', async () => {
    const dir = makeTempDir();
    mkdirSync(join(dir, '.claude', 'skills', 'empty-dir'), { recursive: true });
    makeSkill(dir, 'valid-skill', '---\ndescription: Valid\n---\nBody');

    const result = await runListClaudeSkills({ projectPath: dir });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.skills).toHaveLength(1);
      expect(result.data.skills[0].name).toBe('valid-skill');
    }
  });
});

describe('runReadClaudeSkill', () => {
  it('reads a skill file', async () => {
    const dir = makeTempDir();
    const content = '---\ndescription: Test\n---\nBody content';
    makeSkill(dir, 'test-skill', content);

    const result = await runReadClaudeSkill({ projectPath: dir, name: 'test-skill' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe('test-skill');
      expect(result.data.content).toBe(content);
      expect(result.data.path).toBe('.claude/skills/test-skill/SKILL.md');
    }
  });

  it('returns error for non-existent skill', async () => {
    const dir = makeTempDir();
    const result = await runReadClaudeSkill({ projectPath: dir, name: 'missing' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe('SKILL_NOT_FOUND');
    }
  });
});

describe('runWriteClaudeSkill', () => {
  it('writes content to a skill file', async () => {
    const dir = makeTempDir();
    makeSkill(dir, 'test-skill', '---\ndescription: Old\n---\nOld body');

    const newContent = '---\ndescription: Updated\nalwaysApply: true\n---\nNew body';
    const result = await runWriteClaudeSkill({
      projectPath: dir,
      name: 'test-skill',
      content: newContent,
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.skill.description).toBe('Updated');
      expect(result.data.skill.alwaysApply).toBe(true);
    }
  });

  it('returns error when skill directory does not exist', async () => {
    const dir = makeTempDir();
    const result = await runWriteClaudeSkill({
      projectPath: dir,
      name: 'missing',
      content: 'anything',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe('SKILL_NOT_FOUND');
    }
  });
});
