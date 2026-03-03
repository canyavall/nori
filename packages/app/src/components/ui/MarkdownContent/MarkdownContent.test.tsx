import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, cleanup } from '@solidjs/testing-library';

vi.mock('marked', () => ({
  marked: {
    parse: (_src: string, _opts?: unknown) => '<h1>Hello World</h1><p>Some paragraph.</p>',
  },
}));

import { MarkdownContent } from './MarkdownContent';

describe('MarkdownContent', () => {
  beforeEach(() => {
    cleanup();
  });

  it('renders raw text in a pre element when viewMode is text', () => {
    render(() => <MarkdownContent content="# Hello World" viewMode="text" />);
    const pre = document.querySelector('pre');
    expect(pre).not.toBeNull();
    expect(pre?.textContent).toContain('# Hello World');
  });

  it('does not show a pre element when viewMode is markdown', () => {
    render(() => <MarkdownContent content="# Hello World" viewMode="markdown" />);
    expect(document.querySelector('pre')).toBeNull();
  });

  it('renders markdown as HTML when viewMode is markdown', () => {
    render(() => <MarkdownContent content="# Hello World" viewMode="markdown" />);
    expect(document.querySelector('h1')).not.toBeNull();
    expect(document.querySelector('h1')?.textContent).toBe('Hello World');
  });

  it('preserves raw markdown symbols in text mode', () => {
    render(() => <MarkdownContent content="**bold** and _italic_" viewMode="text" />);
    const pre = document.querySelector('pre');
    expect(pre?.textContent).toContain('**bold** and _italic_');
  });

  it('applies md-content class in markdown mode', () => {
    render(() => <MarkdownContent content="hello" viewMode="markdown" />);
    const div = document.querySelector('.md-content');
    expect(div).not.toBeNull();
  });

  it('renders empty content without errors in markdown mode', () => {
    render(() => <MarkdownContent content="" viewMode="markdown" />);
    const div = document.querySelector('.md-content');
    expect(div).not.toBeNull();
  });

  it('renders empty content without errors in text mode', () => {
    render(() => <MarkdownContent content="" viewMode="text" />);
    const pre = document.querySelector('pre');
    expect(pre).not.toBeNull();
  });
});
