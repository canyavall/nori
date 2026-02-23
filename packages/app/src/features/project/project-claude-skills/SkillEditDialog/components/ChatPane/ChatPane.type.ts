export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  streaming?: boolean;
}

export interface ChatPaneProps {
  skillName: string;
  allSkillsJson: string;
  projectPath: string;
  editorContent: () => string;
  onApplyContent: (content: string) => void;
}
