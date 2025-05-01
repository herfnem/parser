import { Button } from '@/components/ui/button';
import { Copy, RotateCcw, Download } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import type { Language, LanguageOption } from '@/types/json';

interface ToolbarProps {
  selectedLanguage: Language;
  onCopy: () => void;
  onReset: () => void;
  onDownload: () => void;
  hasContent: boolean;
  hasOutput: boolean;
  languageOptions: LanguageOption[];
}

export function Toolbar({
  selectedLanguage,
  onCopy,
  onReset,
  onDownload,
  hasContent,
  hasOutput,
  languageOptions,
}: ToolbarProps) {
  const selectedOption =
    languageOptions.find((opt) => opt.value === selectedLanguage) ||
    languageOptions[0];

  return (
    // <div className="mt-6 flex flex-wrap items-center gap-2 border-t pt-4">
    <div className="flex flex-wrap items-center gap-2 pt-4">
      <Button
        variant="outline"
        size="sm"
        onClick={onReset}
        disabled={!hasContent}
      >
        <RotateCcw className="mr-2 h-4 w-4" />
        Reset
      </Button>

      <Separator orientation="vertical" className="h-8" />

      <Button
        variant="outline"
        size="sm"
        onClick={onCopy}
        disabled={!hasOutput}
      >
        <Copy className="mr-2 h-4 w-4" />
        Copy {selectedOption.label}
      </Button>

      <Button
        variant="outline"
        size="sm"
        onClick={onDownload}
        disabled={!hasOutput}
      >
        <Download className="mr-2 h-4 w-4" />
        {selectedOption.icon}
        Download {selectedOption.label}
      </Button>

      {/* <Separator orientation="vertical" className="h-8" /> */}

      {/* <div className="ml-auto flex items-center">
        <a
          href="https://github.com/yourusername/json-parser"
          target="_blank"
          rel="noopener noreferrer"
          className="text-muted-foreground hover:text-foreground text-sm transition-colors"
        >
          GitHub
        </a>
      </div> */}
    </div>
  );
}
