'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, Square, Loader2 } from 'lucide-react';
import { useAccessibilityStore } from '@/lib/store';
import { toast } from 'sonner';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

// Type definitions for Web Speech API
interface SpeechRecognitionEvent {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionResultList {
  length: number;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  isFinal: boolean;
  length: number;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognitionErrorEvent {
  error: string;
  message: string;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}

interface SpeechRecognitionConstructor {
  new (): SpeechRecognition;
}

interface ASRButtonProps {
  onTranscription: (text: string) => void;
  className?: string;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

// Get the SpeechRecognition constructor
function getSpeechRecognition(): SpeechRecognitionConstructor | null {
  if (typeof window === 'undefined') return null;
  return (window as unknown as { SpeechRecognition?: SpeechRecognitionConstructor; webkitSpeechRecognition?: SpeechRecognitionConstructor }).SpeechRecognition 
    || (window as unknown as { webkitSpeechRecognition?: SpeechRecognitionConstructor }).webkitSpeechRecognition 
    || null;
}

export function ASRButton({ 
  onTranscription, 
  className, 
  variant = 'outline', 
  size = 'icon',
}: ASRButtonProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string>('');
  
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const isListeningRef = useRef(false);
  const onTranscriptionRef = useRef(onTranscription);
  
  const { asrEnabled } = useAccessibilityStore();
  
  // Keep callback ref updated
  useEffect(() => {
    onTranscriptionRef.current = onTranscription;
  }, [onTranscription]);

  // Stop recognition
  const stopRecognition = useCallback(() => {
    isListeningRef.current = false;
    
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
      recognitionRef.current = null;
    }
    
    setIsRecording(false);
    setIsProcessing(false);
    setStatusMessage('');
  }, []);

  // Start recognition
  const startRecognition = useCallback(() => {
    const SpeechRecognition = getSpeechRecognition();
    if (!SpeechRecognition) {
      toast.error('Speech recognition not supported. Use Chrome or Edge.');
      return;
    }

    // Create new recognition instance
    const recognition = new SpeechRecognition();
    
    // Configure for reliability
    recognition.continuous = true; // Keep listening
    recognition.interimResults = true; // Show partial results
    recognition.lang = 'en-US';
    recognition.maxAlternatives = 1;

    let lastProcessedIndex = -1;
    let accumulatedTranscript = '';

    recognition.onstart = () => {
      setIsRecording(true);
      setStatusMessage('🎤 Listening...');
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      // Process new results
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const transcript = result[0].transcript;
        
        if (result.isFinal && i > lastProcessedIndex) {
          // This is a final result we haven't processed
          lastProcessedIndex = i;
          accumulatedTranscript += ' ' + transcript.trim();
          
          // Send to parent
          const textToSend = transcript.trim();
          if (textToSend) {
            console.log('🎤 ASR captured:', textToSend);
            
            // Call the callback
            try {
              onTranscriptionRef.current(textToSend);
              toast.success(`Captured: "${textToSend.substring(0, 30)}${textToSend.length > 30 ? '...' : ''}"`);
            } catch (e) {
              console.error('Error in onTranscription callback:', e);
            }
          }
        } else if (!result.isFinal) {
          // Show interim result
          setStatusMessage(`🎤 Hearing: "${transcript}"`);
        }
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error('ASR error:', event.error);
      
      if (event.error === 'no-speech') {
        // No speech detected, restart if still listening
        return;
      }
      
      if (event.error === 'aborted') {
        // User or system aborted
        return;
      }
      
      if (event.error === 'not-allowed') {
        toast.error('Microphone access denied. Please allow microphone access.');
        stopRecognition();
        return;
      }
      
      toast.error(`Speech error: ${event.error}`);
    };

    recognition.onend = () => {
      // If still supposed to be listening, restart
      if (isListeningRef.current) {
        setStatusMessage('🎤 Reconnecting...');
        setTimeout(() => {
          if (isListeningRef.current) {
            try {
              recognition.start();
            } catch (e) {
              console.error('Failed to restart:', e);
              setIsRecording(false);
              setIsProcessing(false);
            }
          }
        }, 200);
      } else {
        setIsRecording(false);
        setIsProcessing(false);
        setStatusMessage('');
      }
    };

    recognitionRef.current = recognition;
    
    try {
      recognition.start();
    } catch (e) {
      console.error('Failed to start:', e);
      toast.error('Failed to start speech recognition');
    }
  }, [stopRecognition]);

  // Toggle recording
  const toggleRecording = useCallback(async () => {
    // If recording, stop
    if (isListeningRef.current) {
      stopRecognition();
      toast.info('Stopped listening');
      return;
    }

    // Check if supported
    const SpeechRecognition = getSpeechRecognition();
    if (!SpeechRecognition) {
      toast.error('Speech-to-Text not supported. Use Chrome or Edge.');
      return;
    }

    // Request microphone permission
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop()); // Release immediately
      
      // Start listening
      isListeningRef.current = true;
      startRecognition();
      
    } catch (error: unknown) {
      if (error instanceof Error && error.name === 'NotAllowedError') {
        toast.error('Microphone access denied. Please allow it in your browser settings.');
      } else {
        toast.error('Could not access microphone');
      }
    }
  }, [startRecognition, stopRecognition]);

  // Cleanup
  useEffect(() => {
    return () => {
      isListeningRef.current = false;
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {}
      }
    };
  }, []);

  // Check support
  const SpeechRecognition = typeof window !== 'undefined' ? getSpeechRecognition() : null;
  const isSupported = !!SpeechRecognition;

  if (!isSupported) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <span>
              <Button
                variant={variant}
                size={size}
                className={className}
                disabled
              >
                <Mic className="h-4 w-4 opacity-50" />
              </Button>
            </span>
          </TooltipTrigger>
          <TooltipContent>
            <p>Speech-to-Text not supported</p>
            <p className="text-xs text-muted-foreground">Use Chrome or Edge</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  const button = (
    <Button
      variant={variant}
      size={size}
      className={`${className} ${isRecording ? 'ring-2 ring-red-500 ring-offset-2 animate-pulse' : ''}`}
      onClick={toggleRecording}
      disabled={!asrEnabled}
      aria-label={isRecording ? 'Stop recording' : 'Start recording'}
    >
      {isProcessing ? (
        <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
      ) : isRecording ? (
        <Square className="h-4 w-4 text-red-500" />
      ) : (
        <Mic className={`h-4 w-4 ${!asrEnabled ? 'opacity-50' : ''}`} />
      )}
    </Button>
  );

  if (!asrEnabled) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <span>{button}</span>
          </TooltipTrigger>
          <TooltipContent>
            <p>Speech-to-Text disabled</p>
            <p className="text-xs text-muted-foreground">Enable in Settings (⚙️)</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>{button}</TooltipTrigger>
        <TooltipContent>
          {statusMessage ? (
            <p className="text-xs">{statusMessage}</p>
          ) : (
            <p>{isRecording ? 'Click to stop' : 'Click to speak'}</p>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export default ASRButton;
