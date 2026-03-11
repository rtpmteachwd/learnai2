'use client';

import { useAccessibilityStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Settings2, Volume2, Mic, Eye, Keyboard, Contrast, Type, Moon, Sun, Hand } from 'lucide-react';

export function AccessibilityToolbar() {
  const {
    fontSize,
    setFontSize,
    highContrast,
    toggleHighContrast,
    screenReaderMode,
    toggleScreenReaderMode,
    keyboardNavOnly,
    toggleKeyboardNavOnly,
    ttsEnabled,
    toggleTTSEnabled,
    asrEnabled,
    toggleASREnabled,
    reducedMotion,
    toggleReducedMotion,
    signLanguageEnabled,
    toggleSignLanguageEnabled,
    darkMode,
    toggleDarkMode,
    resetSettings,
  } = useAccessibilityStore();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Accessibility settings">
          <Settings2 className="h-5 w-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72">
        <DropdownMenuLabel className="flex items-center gap-2">
          <Eye className="h-4 w-4" />
          Accessibility Settings
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        {/* Font Size */}
        <div className="px-2 py-3">
          <div className="flex items-center gap-2 mb-2">
            <Type className="h-4 w-4" />
            <span className="text-sm font-medium">Text Size: {fontSize}px</span>
          </div>
          <Slider
            value={[fontSize]}
            onValueChange={(value) => setFontSize(value[0])}
            min={12}
            max={24}
            step={2}
            className="w-full"
          />
        </div>

        <DropdownMenuSeparator />

        {/* Dark Mode */}
        <DropdownMenuItem className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {darkMode ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
            <span>{darkMode ? 'Dark Mode' : 'Light Mode'}</span>
          </div>
          <Switch checked={darkMode} onCheckedChange={toggleDarkMode} />
        </DropdownMenuItem>

        {/* High Contrast */}
        <DropdownMenuItem className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Contrast className="h-4 w-4" />
            <span>High Contrast</span>
          </div>
          <Switch checked={highContrast} onCheckedChange={toggleHighContrast} />
        </DropdownMenuItem>

        {/* Screen Reader Mode */}
        <DropdownMenuItem className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            <span>Screen Reader Mode</span>
          </div>
          <Switch checked={screenReaderMode} onCheckedChange={toggleScreenReaderMode} />
        </DropdownMenuItem>

        {/* Keyboard Navigation */}
        <DropdownMenuItem className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Keyboard className="h-4 w-4" />
            <span>Keyboard Only Nav</span>
          </div>
          <Switch checked={keyboardNavOnly} onCheckedChange={toggleKeyboardNavOnly} />
        </DropdownMenuItem>

        {/* Reduced Motion */}
        <DropdownMenuItem className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="h-4 w-4">🎭</span>
            <span>Reduced Motion</span>
          </div>
          <Switch checked={reducedMotion} onCheckedChange={toggleReducedMotion} />
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        {/* AI Features */}
        <DropdownMenuLabel className="flex items-center gap-2 text-xs text-muted-foreground">
          AI Assistive Features
        </DropdownMenuLabel>

        {/* TTS */}
        <DropdownMenuItem className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Volume2 className="h-4 w-4" />
            <span>Text-to-Speech</span>
          </div>
          <Switch checked={ttsEnabled} onCheckedChange={toggleTTSEnabled} />
        </DropdownMenuItem>

        {/* ASR */}
        <DropdownMenuItem className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Mic className="h-4 w-4" />
            <span>Speech-to-Text</span>
          </div>
          <Switch checked={asrEnabled} onCheckedChange={toggleASREnabled} />
        </DropdownMenuItem>

        {/* Sign Language */}
        <DropdownMenuItem className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Hand className="h-4 w-4" />
            <span>Sign Language Mode</span>
          </div>
          <Switch checked={signLanguageEnabled} onCheckedChange={toggleSignLanguageEnabled} />
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem 
          onClick={resetSettings}
          className="text-destructive focus:text-destructive"
        >
          Reset to Defaults
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
