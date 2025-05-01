import { ExampleSelector } from '@/components/ExampleSelector';
import { JsonEditor } from '@/components/JsonEditor';
import { LanguageSelector } from '@/components/LanguageSelector';
import { TypeOutput } from '@/components/TypeOutput';
import { Card } from '@/components/ui/card';
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/ui/resizable';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import { useJsonParser } from '@/hooks/use-json-parser';
import { parseJson } from '@/lib/json-utils';
import type { Language, LanguageOption } from '@/types/json';
import {
  Braces,
  Code,
  Copy,
  Cpu,
  FileCode,
  Pyramid,
  Scroll,
} from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Header } from './Header';
import { Toolbar } from './Toolbar';
import { Button } from './ui/button';

export function JsonParserApp() {
  const [jsonInput, setJsonInput] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState<Language>('json');

  const { isError, errorMessage, outputs, isProcessing } = useJsonParser(
    jsonInput,
    'JsonRoot',
  );

  const handleCopy = useCallback(
    (language: Language) => {
      const content = outputs[language];
      if (content) {
        navigator.clipboard.writeText(content);
        toast(`${getLanguageLabel(language)} code copied to clipboard`);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [outputs],
  );

  const handleInputCopy = useCallback(() => {
    if (jsonInput) {
      navigator.clipboard.writeText(jsonInput);
      toast('JSON input copied to clipboard');
    }
  }, [jsonInput]);

  const handleReset = useCallback(() => {
    setJsonInput('');
    toast('Editor has been reset');
  }, []);

  const handleDownload = useCallback(
    (language: Language) => {
      const content = outputs[language];
      const fileExtension = getFileExtension(language);
      const fileName = `converted-type.${fileExtension}`;

      if (content) {
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        toast(`${fileName} has been downloaded`);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [outputs],
  );

  const getFileExtension = (language: Language): string => {
    const option = languageOptions.find((opt) => opt.value === language);
    return option ? option.fileExtension : 'txt';
  };

  const getLanguageLabel = (language: Language): string => {
    const option = languageOptions.find((opt) => opt.value === language);
    return option ? option.label : 'Code';
  };

  const languageOptions = useMemo<LanguageOption[]>(() => {
    return [
      {
        value: 'json',
        label: 'JSON',
        icon: <Braces size={16} />,
        fileExtension: 'json',
      },
      {
        value: 'typescript',
        label: 'TypeScript',
        icon: <Code size={16} />,
        fileExtension: 'ts',
      },
      {
        value: 'zod',
        label: 'Zod Schema',
        icon: <Pyramid size={16} />,
        fileExtension: 'zod.ts',
      },
      {
        value: 'python',
        label: 'Python',
        icon: <FileCode size={16} />,
        fileExtension: 'py',
      },
      {
        value: 'python-dict',
        label: 'Python Dict',
        icon: <FileCode size={16} />,
        fileExtension: 'py',
      },
      {
        value: 'go',
        label: 'Go',
        icon: <Scroll size={16} />,
        fileExtension: 'go',
      },
      {
        value: 'rust',
        label: 'Rust',
        icon: <Cpu size={16} />,
        fileExtension: 'rs',
      },
    ];
  }, []);

  const handleExampleSelect = useCallback((example: string) => {
    setJsonInput(example);
    toast('JSON example has been loaded into the editor');
  }, []);

  const fixJsonInput = useCallback(() => {
    const { fixed, parsed } = parseJson(jsonInput);
    if (!fixed) {
      toast.error('Failed to fix JSON input');
      return;
    }
    setJsonInput(JSON.stringify(parsed, null, 2));
    toast('JSON input has been fixed');
  }, [jsonInput]);

  return (
    <div className="container mx-auto max-w-7xl px-4 py-6">
      <Header />
      <Toolbar
        selectedLanguage={selectedLanguage}
        onCopy={() => handleCopy(selectedLanguage)}
        onReset={handleReset}
        onDownload={() => handleDownload(selectedLanguage)}
        hasContent={!!jsonInput}
        hasOutput={!!outputs[selectedLanguage]}
        languageOptions={languageOptions}
      />
      <div className="mt-6">
        <Card className="p-1">
          <ResizablePanelGroup
            direction="horizontal"
            className="min-h-[calc(100vh-200px)]"
          >
            <ResizablePanel defaultSize={50} minSize={30}>
              <div className="flex h-full flex-col">
                <div className="flex items-center justify-between px-3 py-2">
                  <div className="flex items-center gap-1">
                    <h2 className="text-lg font-semibold">JSON Input</h2>
                    {jsonInput.length > 0 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleInputCopy}
                        className="ml-2"
                        disabled={isError}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {isError && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => fixJsonInput()}
                          className="mr-2"
                        >
                          Fix Json
                        </Button>
                      </>
                    )}
                    <ExampleSelector onSelect={handleExampleSelect} />
                  </div>
                </div>
                <div className="flex-1 overflow-hidden border-t">
                  <JsonEditor
                    value={jsonInput}
                    onChange={setJsonInput}
                    error={isError ? errorMessage : undefined}
                  />
                </div>
              </div>
            </ResizablePanel>

            <ResizableHandle withHandle />

            <ResizablePanel defaultSize={50} minSize={30}>
              <div className="flex h-full flex-col">
                <div className="flex items-center justify-between px-3 py-2">
                  <h2 className="text-lg font-semibold">Generated Output</h2>
                  <LanguageSelector
                    selectedLanguage={selectedLanguage}
                    onLanguageChange={setSelectedLanguage}
                    languageOptions={languageOptions}
                  />
                </div>
                <Tabs
                  value={selectedLanguage}
                  onValueChange={(value) =>
                    setSelectedLanguage(value as Language)
                  }
                  className="flex flex-1 flex-col border-t"
                >
                  {/* <TabsList className="flex h-auto flex-wrap px-3 pt-2">
                    {languageOptions.map((option) => (
                      <TabsTrigger
                        key={option.value}
                        value={option.value}
                        className="flex items-center gap-1"
                      >
                        {option.icon}
                        {option.label}
                      </TabsTrigger>
                    ))}
                  </TabsList> */}

                  {languageOptions.map((option) => (
                    <TabsContent
                      key={option.value}
                      value={option.value}
                      className="mt-0 flex-1 overflow-hidden"
                    >
                      <TypeOutput
                        content={outputs[option.value] || ''}
                        language={option.value}
                        isLoading={isProcessing}
                        error={isError ? errorMessage : undefined}
                      />
                    </TabsContent>
                  ))}
                </Tabs>
              </div>
            </ResizablePanel>
          </ResizablePanelGroup>
        </Card>
      </div>
    </div>
  );
}
