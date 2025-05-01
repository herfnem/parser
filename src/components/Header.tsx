import { FileJson } from 'lucide-react';
import { ThemeModeToggle } from './ui/theme-toggler';

// interface HeaderProps {
//   rootTypeName: string;
//   onRootTypeNameChange: (name: string) => void;
// }

export function Header() {
  return (
    <header className="flex flex-col items-start justify-between gap-4 border-b pb-4 sm:flex-row sm:items-center">
      <div className="flex items-center gap-2">
        <FileJson className="text-primary h-6 w-6" />
        <div>
          <h1 className="text-2xl font-bold">JSON to Code Converter</h1>
          <p className="text-muted-foreground text-sm">
            Convert JSON to multiple programming languages
          </p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* <div className="flex flex-col gap-1">
          <Label htmlFor="root-type-name">Root Type Name</Label>
          <Input
            id="root-type-name"
            value={rootTypeName}
            onChange={(e) => onRootTypeNameChange(e.target.value)}
            className="w-40"
          />
        </div> */}
        <ThemeModeToggle />
      </div>
    </header>
  );
}
