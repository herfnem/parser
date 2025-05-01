import { Check, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { Language, LanguageOption } from '@/types/json';

interface LanguageSelectorProps {
  selectedLanguage: Language;
  onLanguageChange: (language: Language) => void;
  languageOptions: LanguageOption[];
}

export function LanguageSelector({
  selectedLanguage,
  onLanguageChange,
  languageOptions,
}: LanguageSelectorProps) {
  const selectedOption =
    languageOptions.find((lang) => lang.value === selectedLanguage) ||
    languageOptions[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="flex items-center gap-1">
          {selectedOption.icon}
          {selectedOption.label}
          <ChevronDown className="ml-1 h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuGroup>
          {languageOptions.map((option) => (
            <DropdownMenuItem
              key={option.value}
              onClick={() => onLanguageChange(option.value)}
              className="flex items-center justify-between"
            >
              <span className="flex items-center gap-2">
                {option.icon}
                {option.label}
              </span>
              {selectedLanguage === option.value && (
                <Check className="h-4 w-4" />
              )}
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
