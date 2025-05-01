import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import type { Language } from '@/types/json';
import { go } from '@codemirror/lang-go';
import { javascript } from '@codemirror/lang-javascript';
import { python } from '@codemirror/lang-python';
import { rust } from '@codemirror/lang-rust';
import { EditorState } from '@codemirror/state';
import { oneDark } from '@codemirror/theme-one-dark';
import { EditorView, basicSetup } from 'codemirror';
import { AlertCircle } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { useTheme } from './ThemeProvider';

interface TypeOutputProps {
  content: string;
  language: Language;
  isLoading?: boolean;
  error?: string;
}

export function TypeOutput({
  content,
  language,
  isLoading,
  error,
}: TypeOutputProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const { theme } = useTheme();

  useEffect(() => {
    if (!editorRef.current) return;

    // Get language extension based on selected language
    const getLangExtension = () => {
      switch (language) {
        case 'typescript':
        case 'zod':
          return javascript({ typescript: true });
        case 'python':
        case 'python-dict':
          return python();
        case 'go':
          return go();
        case 'json':
          return javascript({ typescript: true });
        case 'rust':
          return rust();
        // Fallback to JavaScript for languages without specific extensions
        // return javascript();
        default:
          return javascript({ typescript: true });
      }
    };

    const extensions = [
      basicSetup,
      getLangExtension(),
      EditorView.lineWrapping,
      EditorView.editable.of(false),
      theme === 'dark' ? oneDark : [],
    ];

    const state = EditorState.create({
      doc: content,
      extensions,
    });

    const view = new EditorView({
      state,
      parent: editorRef.current,
    });

    viewRef.current = view;

    return () => {
      view.destroy();
      viewRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [theme, language]);

  // Update editor content when content prop changes
  useEffect(() => {
    const view = viewRef.current;
    if (view && view.state.doc.toString() !== content) {
      view.dispatch({
        changes: { from: 0, to: view.state.doc.length, insert: content },
      });
    }
  }, [content]);

  if (isLoading) {
    return (
      <div className="h-full space-y-3 p-4">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-4 w-2/3" />
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {error && (
        <Alert variant="destructive" className="mx-2 mt-2 mb-2">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      <div
        ref={editorRef}
        className="flex-1 overflow-auto p-2 font-mono text-sm"
      />
    </div>
  );
}
