import { useState } from "react";
import { Textarea } from "./ui/textarea";
import { Button } from "./ui/button";
import { 
  Bold, 
  Italic, 
  Heading1, 
  Heading2, 
  Heading3,
  List, 
  ListOrdered, 
  Code, 
  Quote,
  Link as LinkIcon,
  Image as ImageIcon,
  Minus
} from "lucide-react";

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export default function MarkdownEditor({ value, onChange, placeholder }: MarkdownEditorProps) {
  const [textarea, setTextarea] = useState<HTMLTextAreaElement | null>(null);

  const insertMarkdown = (before: string, after: string = "", placeholder: string = "") => {
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);
    const text = selectedText || placeholder;
    
    const newValue = 
      value.substring(0, start) + 
      before + text + after + 
      value.substring(end);
    
    onChange(newValue);

    // Set cursor position after insertion
    setTimeout(() => {
      textarea.focus();
      const newCursorPos = start + before.length + text.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  const insertAtLine = (prefix: string) => {
    if (!textarea) return;

    const start = textarea.selectionStart;
    const lineStart = value.lastIndexOf('\n', start - 1) + 1;
    
    const newValue = 
      value.substring(0, lineStart) + 
      prefix + 
      value.substring(lineStart);
    
    onChange(newValue);

    setTimeout(() => {
      textarea.focus();
      const newCursorPos = start + prefix.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  return (
    <div className="border rounded-md overflow-hidden bg-white">
      {/* Toolbar */}
      <div className="border-b bg-gray-50 px-2 py-2 flex items-center gap-1 flex-wrap">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={() => insertMarkdown("**", "**", "bold text")}
          title="Bold"
        >
          <Bold className="w-4 h-4" />
        </Button>
        
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={() => insertMarkdown("*", "*", "italic text")}
          title="Italic"
        >
          <Italic className="w-4 h-4" />
        </Button>

        <div className="w-px h-6 bg-gray-300 mx-1" />

        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={() => insertAtLine("# ")}
          title="Heading 1"
        >
          <Heading1 className="w-4 h-4" />
        </Button>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={() => insertAtLine("## ")}
          title="Heading 2"
        >
          <Heading2 className="w-4 h-4" />
        </Button>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={() => insertAtLine("### ")}
          title="Heading 3"
        >
          <Heading3 className="w-4 h-4" />
        </Button>

        <div className="w-px h-6 bg-gray-300 mx-1" />

        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={() => insertAtLine("- ")}
          title="Bullet List"
        >
          <List className="w-4 h-4" />
        </Button>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={() => insertAtLine("1. ")}
          title="Numbered List"
        >
          <ListOrdered className="w-4 h-4" />
        </Button>

        <div className="w-px h-6 bg-gray-300 mx-1" />

        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={() => insertMarkdown("`", "`", "code")}
          title="Inline Code"
        >
          <Code className="w-4 h-4" />
        </Button>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={() => insertMarkdown("```\n", "\n```", "code block")}
          title="Code Block"
        >
          <Code className="w-4 h-4" />
        </Button>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={() => insertAtLine("> ")}
          title="Quote"
        >
          <Quote className="w-4 h-4" />
        </Button>

        <div className="w-px h-6 bg-gray-300 mx-1" />

        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={() => insertMarkdown("[", "](url)", "link text")}
          title="Link"
        >
          <LinkIcon className="w-4 h-4" />
        </Button>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={() => insertMarkdown("![", "](url)", "alt text")}
          title="Image"
        >
          <ImageIcon className="w-4 h-4" />
        </Button>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={() => insertAtLine("---\n")}
          title="Horizontal Rule"
        >
          <Minus className="w-4 h-4" />
        </Button>
      </div>

      {/* Editor */}
      <Textarea
        ref={setTextarea}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={20}
        className="font-mono text-sm border-0 focus-visible:ring-0 rounded-none resize-none"
      />
    </div>
  );
}
