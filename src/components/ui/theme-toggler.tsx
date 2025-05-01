import { Moon, Sun, Laptop } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useTheme } from '@/components/ThemeProvider';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';

export function ThemeModeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Ensure hydration mismatch doesn't occur
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="hover:border-primary hover:bg-primary/10 focus:ring-primary/20 relative overflow-hidden rounded-full border-2 transition-all duration-300 focus:ring-2"
        >
          <Sun
            className={cn(
              'h-[1.3rem] w-[1.3rem] transition-all duration-500',
              theme !== 'dark' ? 'scale-100 rotate-0' : 'scale-0 -rotate-90',
            )}
          />
          <Moon
            className={cn(
              'absolute h-[1.3rem] w-[1.3rem] transition-all duration-500',
              theme === 'dark' ? 'scale-100 rotate-0' : 'scale-0 rotate-90',
            )}
          />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="bg-background/90 animate-in slide-in-from-top-5 fade-in-50 rounded-xl border-2 shadow-lg backdrop-blur-md duration-300"
      >
        <DropdownMenuItem
          onClick={() => setTheme('light')}
          className={cn(
            'flex cursor-pointer items-center gap-2 transition-colors',
            theme === 'light' ? 'bg-primary/10 font-medium' : '',
          )}
        >
          <Sun className="h-4 w-4" /> Light
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setTheme('dark')}
          className={cn(
            'flex cursor-pointer items-center gap-2 transition-colors',
            theme === 'dark' ? 'bg-primary/10 font-medium' : '',
          )}
        >
          <Moon className="h-4 w-4" /> Dark
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setTheme('system')}
          className={cn(
            'flex cursor-pointer items-center gap-2 transition-colors',
            theme === 'system' ? 'bg-primary/10 font-medium' : '',
          )}
        >
          <Laptop className="h-4 w-4" /> System
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
