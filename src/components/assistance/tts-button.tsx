'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Volume2, VolumeX, Loader2 } from 'lucide-react';
import { useAccessibilityStore } from '@/lib/store';
import { toast } from 'sonner';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface TTSButtonProps {
  text: string;
  className?: string;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  onPointerEnterCapture?: () => void;
  onPointerLeaveCapture?: () => void;
  onTTSComplete?: () => void;
}

// Utility to get available voices
const getVoices = (): Promise<SpeechSynthesisVoice[]> => {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      resolve([]);
      return;
    }

    const voices = window.speechSynthesis.getVoices();
    if (voices.length > 0) {
      resolve(voices);
    } else {
      // Voices might load asynchronously
      const handleVoicesChanged = () => {
        const loadedVoices = window.speechSynthesis.getVoices();
        resolve(loadedVoices);
        window.speechSynthesis.removeEventListener('voiceschanged', handleVoicesChanged);
      };
      window.speechSynthesis.addEventListener('voiceschanged', handleVoicesChanged);
      
      // Fallback timeout
      setTimeout(() => {
        resolve(window.speechSynthesis.getVoices());
      }, 1000);
    }
  });
};

// Find the best available voice for English
const findBestVoice = (voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null => {
  // Priority: English voices with good quality
  const englishVoices = voices.filter(v => v.lang.startsWith('en'));
  
  // Try to find a high-quality English voice
  const preferred = englishVoices.find(v => 
    v.name.toLowerCase().includes('google') || 
    v.name.toLowerCase().includes('microsoft') ||
    v.name.toLowerCase().includes('samantha') ||
    v.name.toLowerCase().includes('daniel') ||
    v.name.toLowerCase().includes('natural')
  );
  
  if (preferred) return preferred;
  
  // Fall back to any English voice
  if (englishVoices.length > 0) {
    // Prefer local voices over network voices
    const localEnglish = englishVoices.find(v => v.localService);
    return localEnglish || englishVoices[0];
  }
  
  // Fall back to any available voice
  return voices[0] || null;
};

// Check if TTS is supported
const checkTTSSupport = (): boolean => {
  if (typeof window === 'undefined') return true; // Assume supported during SSR
  return 'speechSynthesis' in window;
};

// Errors that are expected and should not show a toast
const EXPECTED_ERRORS = ['canceled', 'interrupted'];

export function TTSButton({ 
  text, 
  className, 
  variant = 'outline', 
  size = 'icon',
  onPointerEnterCapture,
  onPointerLeaveCapture,
  onTTSComplete
}: TTSButtonProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSupported] = useState(checkTTSSupport);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const isCancelledRef = useRef(false);
  const { ttsEnabled } = useAccessibilityStore();

  // Load voices on mount
  useEffect(() => {
    if (!isSupported) return;

    getVoices().then(loadedVoices => {
      setVoices(loadedVoices);
    });

    // Cleanup on unmount
    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, [isSupported]);

  // Handle TTS using browser's speechSynthesis API
  const handleTTS = useCallback(async () => {
    if (!ttsEnabled) {
      toast.info('Text-to-Speech is disabled. Enable it in Accessibility Settings (⚙️)');
      return;
    }

    if (!isSupported) {
      toast.error('Text-to-Speech is not supported in your browser');
      return;
    }

    // If currently playing or loading, stop
    if (isPlaying || isLoading) {
      isCancelledRef.current = true;
      window.speechSynthesis.cancel();
      setIsPlaying(false);
      setIsLoading(false);
      utteranceRef.current = null;
      return;
    }

    if (!text) {
      toast.error('No text to read');
      return;
    }

    setIsLoading(true);
    isCancelledRef.current = false;

    try {
      // Ensure voices are loaded
      let availableVoices = voices;
      if (availableVoices.length === 0) {
        availableVoices = await getVoices();
        setVoices(availableVoices);
      }

      // Cancel any ongoing speech before starting new one
      window.speechSynthesis.cancel();

      // Create utterance
      const utterance = new SpeechSynthesisUtterance(text);
      utteranceRef.current = utterance;
      
      // Set the best available voice
      const voice = findBestVoice(availableVoices);
      if (voice) {
        utterance.voice = voice;
        utterance.lang = voice.lang;
      } else {
        utterance.lang = 'en-US';
      }

      // Set speech properties
      utterance.rate = 0.9; // Slightly slower for accessibility
      utterance.pitch = 1.0;
      utterance.volume = 1.0;

      // Event handlers
      utterance.onstart = () => {
        setIsPlaying(true);
        setIsLoading(false);
      };

      utterance.onend = () => {
        setIsPlaying(false);
        setIsLoading(false);
        utteranceRef.current = null;
        if (!isCancelledRef.current) {
          onTTSComplete?.();
        }
      };

      utterance.onerror = (event) => {
        // Don't log or show errors for expected cancellations
        if (EXPECTED_ERRORS.includes(event.error)) {
          // This is expected when user clicks to stop or starts new speech
          setIsPlaying(false);
          setIsLoading(false);
          utteranceRef.current = null;
          return;
        }

        // Log unexpected errors
        console.error('TTS Error:', event.error);
        setIsPlaying(false);
        setIsLoading(false);
        utteranceRef.current = null;
        toast.error('Speech synthesis failed: ' + event.error);
      };

      // Speak
      window.speechSynthesis.speak(utterance);

    } catch (error) {
      console.error('TTS error:', error);
      setIsLoading(false);
      toast.error('Failed to generate speech');
    }
  }, [ttsEnabled, isSupported, isPlaying, isLoading, text, voices, onTTSComplete]);

  // Stop speech on unmount
  useEffect(() => {
    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  if (!isSupported) {
    return null;
  }

  const button = (
    <Button
      variant={variant}
      size={size}
      className={className}
      onClick={handleTTS}
      disabled={!text}
      aria-label={isPlaying ? 'Stop reading' : 'Read aloud'}
      onPointerEnter={onPointerEnterCapture}
      onPointerLeave={onPointerLeaveCapture}
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : isPlaying ? (
        <VolumeX className="h-4 w-4" />
      ) : (
        <Volume2 className={`h-4 w-4 ${!ttsEnabled ? 'opacity-50' : ''}`} />
      )}
    </Button>
  );

  if (!ttsEnabled) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <span>{button}</span>
          </TooltipTrigger>
          <TooltipContent>
            <p>TTS is disabled. Enable in Settings (⚙️)</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return button;
}

// Hook for programmatic TTS usage
export function useTTS() {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [isSupported] = useState(checkTTSSupport);
  const isCancelledRef = useRef(false);

  useEffect(() => {
    if (!isSupported) return;

    getVoices().then(loadedVoices => {
      setVoices(loadedVoices);
    });

    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, [isSupported]);

  const speak = useCallback(async (text: string, options?: {
    rate?: number;
    pitch?: number;
    onEnd?: () => void;
  }) => {
    if (!isSupported || !text) return;

    // Ensure voices are loaded
    let availableVoices = voices;
    if (availableVoices.length === 0) {
      availableVoices = await getVoices();
    }

    // Cancel any ongoing speech
    isCancelledRef.current = false;
    window.speechSynthesis.cancel();

    // Create and configure utterance
    const utterance = new SpeechSynthesisUtterance(text);
    const voice = findBestVoice(availableVoices);
    
    if (voice) {
      utterance.voice = voice;
      utterance.lang = voice.lang;
    } else {
      utterance.lang = 'en-US';
    }
    
    utterance.rate = options?.rate || 0.9;
    utterance.pitch = options?.pitch || 1.0;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => {
      setIsSpeaking(false);
      if (!isCancelledRef.current) {
        options?.onEnd?.();
      }
    };
    utterance.onerror = (event) => {
      if (!EXPECTED_ERRORS.includes(event.error)) {
        setIsSpeaking(false);
      }
    };

    window.speechSynthesis.speak(utterance);
  }, [isSupported, voices]);

  const stop = useCallback(() => {
    isCancelledRef.current = true;
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
  }, []);

  return { speak, stop, isSpeaking, isSupported };
}

export default TTSButton;
