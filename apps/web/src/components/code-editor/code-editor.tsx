'use client';

import React from 'react';
import Editor, { OnMount } from '@monaco-editor/react';
import type { editor } from 'monaco-editor';

interface Issue {
  id: string;
  severity: string;
  line: number;
  message: string;
}

interface CodeEditorProps {
  code: string;
  language?: string;
  issues?: Issue[];
  readOnly?: boolean;
  height?: string;
}

const LANGUAGE_MAP: Record<string, string> = {
  typescript: 'typescript',
  javascript: 'javascript',
  python: 'python',
  java: 'java',
  go: 'go',
  rust: 'rust',
  php: 'php',
  ruby: 'ruby',
  ts: 'typescript',
  tsx: 'typescript',
  js: 'javascript',
  jsx: 'javascript',
  py: 'python',
};

const SEVERITY_DECORATIONS: Record<string, {
  severity: number;
  className: string;
}> = {
  ERROR: { severity: 8, className: 'line-error' },
  WARNING: { severity: 2, className: 'line-warning' },
  INFO: { severity: 1, className: 'line-info' },
  SUGGESTION: { severity: 1, className: 'line-suggestion' },
};

export function CodeEditor({
  code,
  language = 'typescript',
  issues = [],
  readOnly = true,
  height = '400px',
}: CodeEditorProps) {
  const editorRef = React.useRef<editor.IStandaloneCodeEditor | null>(null);
  const decorationsRef = React.useRef<editor.IEditorDecorationsCollection | null>(null);

  const mappedLanguage = LANGUAGE_MAP[language] || language;

  const handleEditorMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;

    // Define custom themes
    monaco.editor.defineTheme('acr-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'comment', foreground: '6a737d', fontStyle: 'italic' },
        { token: 'keyword', foreground: 'cbb7fb' },
        { token: 'string', foreground: 'a5d6a7' },
        { token: 'number', foreground: 'f48fb1' },
      ],
      colors: {
        'editor.background': '#1a1a2e',
        'editor.foreground': '#e0e0e0',
        'editor.lineHighlightBackground': '#1a1a2e',
        'editorLineNumber.foreground': '#6a737d',
        'editor.selectionBackground': '#7c3aed33',
      },
    });

    monaco.editor.setTheme('acr-dark');

    // Apply issue decorations
    if (issues.length > 0) {
      applyDecorations(editor, issues);
    }
  };

  const applyDecorations = (editor: editor.IStandaloneCodeEditor, issueList: Issue[]) => {
    const newDecorations: editor.IModelDeltaDecoration[] = issueList.map((issue) => {
      const config = SEVERITY_DECORATIONS[issue.severity] || SEVERITY_DECORATIONS.INFO;

      return {
        range: {
          startLineNumber: issue.line,
          startColumn: 1,
          endLineNumber: issue.line,
          endColumn: Number.MAX_VALUE,
        },
        options: {
          isWholeLine: true,
          className: config.className,
          glyphMarginClassName: `glyph-${issue.severity.toLowerCase()}`,
          overviewRuler: {
            color: config.severity === 8 ? '#ef4444' : config.severity === 2 ? '#f59e0b' : '#3b82f6',
            position: 2, // Right
          },
          minimap: {
            color: config.severity === 8 ? '#ef4444' : config.severity === 2 ? '#f59e0b' : '#3b82f6',
            position: 1, // Inline
          },
          hoverMessage: { value: `**${issue.severity}:** ${issue.message}` },
        },
      };
    });

    decorationsRef.current = editor.createDecorationsCollection(newDecorations);
  };

  React.useEffect(() => {
    if (editorRef.current && issues.length > 0) {
      applyDecorations(editorRef.current, issues);
    }
  }, [issues]);

  return (
    <div className="rounded-card overflow-hidden border border-parchment">
      <style jsx global>{`
        .line-error {
          background-color: rgba(239, 68, 68, 0.15) !important;
          border-left: 3px solid #ef4444;
        }
        .line-warning {
          background-color: rgba(245, 158, 11, 0.15) !important;
          border-left: 3px solid #f59e0b;
        }
        .line-info {
          background-color: rgba(59, 130, 246, 0.15) !important;
          border-left: 3px solid #3b82f6;
        }
        .line-suggestion {
          background-color: rgba(139, 92, 246, 0.15) !important;
          border-left: 3px solid #8b5cf6;
        }
        .glyph-error::before {
          content: '●';
          color: #ef4444;
        }
        .glyph-warning::before {
          content: '●';
          color: #f59e0b;
        }
        .glyph-info::before {
          content: '●';
          color: #3b82f6;
        }
        .glyph-suggestion::before {
          content: '●';
          color: #8b5cf6;
        }
      `}</style>
      <Editor
        height={height}
        language={mappedLanguage}
        value={code}
        theme="acr-dark"
        options={{
          readOnly,
          minimap: { enabled: true },
          fontSize: 14,
          fontFamily: "'Fira Code', 'Cascadia Code', monospace",
          lineNumbers: 'on',
          scrollBeyondLastLine: false,
          renderLineHighlight: 'all',
          padding: { top: 16, bottom: 16 },
          bracketPairColorization: { enabled: true },
          guides: { bracketPairs: true },
        }}
        onMount={handleEditorMount}
      />
    </div>
  );
}
