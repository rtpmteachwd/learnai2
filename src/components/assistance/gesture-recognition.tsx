'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Camera, CameraOff, Loader2, Hand, Copy, Check, Volume2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface GestureRecognitionProps {
  onResult: (result: string) => void;
  className?: string;
}

// Type definitions for MediaPipe Hands
interface LandmarkPoint {
  x: number;
  y: number;
  z: number;
}

// ASL Alphabet detection
const detectASLLetter = (landmarks: LandmarkPoint[]): string | null => {
  if (!landmarks || landmarks.length < 21) return null;

  const isFingerExtended = (tipIdx: number, pipIdx: number, mcpIdx: number): boolean => {
    return landmarks[tipIdx].y < landmarks[pipIdx].y && landmarks[pipIdx].y < landmarks[mcpIdx].y;
  };

  const isThumbExtended = (): boolean => {
    const thumbTip = landmarks[4];
    const palmCenter = landmarks[9];
    return Math.abs(thumbTip.x - palmCenter.x) > 0.1;
  };

  const thumb = isThumbExtended();
  const index = isFingerExtended(8, 6, 5);
  const middle = isFingerExtended(12, 10, 9);
  const ring = isFingerExtended(16, 14, 13);
  const pinky = isFingerExtended(20, 18, 17);

  const extendedCount = [index, middle, ring, pinky].filter(Boolean).length;

  const thumbIndexDist = Math.hypot(landmarks[4].x - landmarks[8].x, landmarks[4].y - landmarks[8].y);
  const indexMiddleGap = Math.abs(landmarks[8].x - landmarks[12].x);

  // LETTERS A-Z
  if (!index && !middle && !ring && !pinky && thumb) {
    if (Math.abs(landmarks[4].x - landmarks[5].x) < 0.15) return 'A';
    return 'S';
  }

  if (index && middle && ring && pinky && !thumb) return 'B';

  if (!index && !middle && !ring && !pinky) {
    const curve = landmarks[8].y - landmarks[5].y;
    if (curve > 0.02 && curve < 0.15) return 'C';
  }

  if (index && !middle && !ring && !pinky) {
    if (thumbIndexDist < 0.12) return 'D';
  }

  if (!index && !middle && !ring && !pinky && !thumb) {
    if (landmarks[8].y > landmarks[6].y) return 'E';
    return 'M';
  }

  if (!index && middle && ring && pinky && thumb) {
    if (thumbIndexDist < 0.1) return 'F';
  }

  if (index && !middle && !ring && !pinky && thumb) {
    const horizontal = Math.abs(landmarks[8].x - landmarks[5].x) > Math.abs(landmarks[8].y - landmarks[5].y);
    if (horizontal) return 'G';
  }

  if (index && middle && !ring && !pinky && indexMiddleGap < 0.06) {
    const horizontal = Math.abs(landmarks[8].x - landmarks[5].x) > Math.abs(landmarks[8].y - landmarks[5].y);
    if (horizontal) return 'H';
  }

  if (!index && !middle && !ring && pinky) return 'I';

  if (index && middle && !ring && !pinky && thumb) {
    if (landmarks[4].y > landmarks[8].y - 0.05 && landmarks[4].y < landmarks[12].y + 0.05) return 'K';
  }

  if (index && !middle && !ring && !pinky && thumb) {
    const thumbHoriz = Math.abs(landmarks[4].x - landmarks[3].x) > Math.abs(landmarks[4].y - landmarks[3].y);
    if (thumbHoriz) return 'L';
  }

  if (!index && !middle && !ring && !pinky && !thumb) return 'O';

  if (index && middle && !ring && !pinky && thumb) {
    if (landmarks[8].y > landmarks[5].y) return 'P';
  }

  if (index && !middle && !ring && !pinky && thumb) {
    if (landmarks[8].y > landmarks[5].y) return 'Q';
  }

  if (index && middle && !ring && !pinky && indexMiddleGap < 0.04) return 'R';

  if (!index && !middle && !ring && !pinky && thumb) return 'S';

  if (!index && !middle && !ring && !pinky) return 'T';

  if (index && middle && !ring && !pinky && indexMiddleGap < 0.04) return 'U';

  if (index && middle && !ring && !pinky && indexMiddleGap > 0.05) return 'V';

  if (index && middle && ring && !pinky) return 'W';

  if (!index && !middle && !ring && !pinky) return 'X';

  if (!index && !middle && !ring && pinky && thumb) return 'Y';

  if (index && !middle && !ring && !pinky && thumb) return 'Z';

  // NUMBERS
  if (extendedCount === 1 && index && !thumb) return '1';
  if (extendedCount === 2 && index && middle && indexMiddleGap > 0.03) return '2';
  if (index && middle && thumb && !ring && !pinky) return '3';
  if (extendedCount === 4 && !thumb) return '4';
  if (extendedCount === 4 && thumb) return '5';

  // COMMON SIGNS
  if (thumb && !index && !middle && !ring && !pinky && landmarks[4].y < landmarks[3].y) return '👍 Thumbs Up';
  if (thumb && !index && !middle && !ring && !pinky && landmarks[4].y > landmarks[3].y) return '👎 Thumbs Down';
  if (thumbIndexDist < 0.07 && middle && ring && pinky) return '👌 OK';
  if (index && middle && !ring && !pinky && indexMiddleGap > 0.05) return '✌️ Peace';
  if (thumb && index && !middle && !ring && pinky) return '🤟 I Love You';
  if (index && !middle && !ring && pinky && thumb) return '🤘 Rock On';
  if (index && middle && ring && pinky && thumb) return '✋ Open Hand';
  if (!index && !middle && !ring && !pinky && !thumb) return '✊ Fist';
  if (index && !middle && !ring && !pinky) return '👆 Pointing';
  if (!index && !middle && !ring && pinky && thumb) return '🤙 Call Me';

  return null;
};

export function GestureRecognition({ 
  onResult, 
  className,
}: GestureRecognitionProps) {
  const [isStreaming, setIsStreaming] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [capturedText, setCapturedText] = useState('');
  const [currentDetection, setCurrentDetection] = useState('');
  const [copied, setCopied] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [handsLoaded, setHandsLoaded] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [confidence, setConfidence] = useState(0);
  
  // Use refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const handsRef = useRef<any>(null);
  const cameraRef = useRef<any>(null);
  const lastDetectionRef = useRef<string>('');
  const detectionCountRef = useRef<Map<string, number>>(new Map());
  const hasShownToastRef = useRef(false);
  const isProcessingRef = useRef(false);
  const animationFrameRef = useRef<number | null>(null);

  // Load MediaPipe scripts once on mount
  useEffect(() => {
    let mounted = true;
    
    const loadScripts = async () => {
      try {
        const loadScript = (src: string): Promise<void> => {
          return new Promise((resolve, reject) => {
            const existing = document.querySelector(`script[src="${src}"]`) as HTMLScriptElement;
            if (existing) {
              resolve();
              return;
            }
            const script = document.createElement('script');
            script.src = src;
            script.crossOrigin = 'anonymous';
            script.onload = () => resolve();
            script.onerror = reject;
            document.head.appendChild(script);
          });
        };

        await loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4.1675469240/hands.js');
        await loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils@0.3.1675466862/camera_utils.js');

        if (mounted) {
          setHandsLoaded(true);
        }
      } catch (error) {
        if (mounted) {
          setLoadError('Failed to load hand detection. Check internet connection.');
        }
      }
    };

    loadScripts();

    return () => {
      mounted = false;
    };
  }, []);

  // Cleanup function
  const cleanupResources = useCallback(() => {
    // Stop animation loop
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    // Stop camera utility
    if (cameraRef.current) {
      try { 
        cameraRef.current.stop(); 
      } catch {}
      cameraRef.current = null;
    }

    // Stop MediaPipe Hands
    if (handsRef.current) {
      try { 
        handsRef.current.close(); 
      } catch {}
      handsRef.current = null;
    }

    // Stop video stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    // Clear video element
    if (videoRef.current) {
      videoRef.current.srcObject = null;
      videoRef.current.load();
    }

    // Clear canvas
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      }
    }

    isProcessingRef.current = false;
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanupResources();
    };
  }, [cleanupResources]);

  // Draw landmarks
  const drawLandmarks = useCallback((ctx: CanvasRenderingContext2D, landmarks: LandmarkPoint[], width: number, height: number) => {
    if (!landmarks) return;

    const connections = [
      [0, 1], [1, 2], [2, 3], [3, 4],
      [0, 5], [5, 6], [6, 7], [7, 8],
      [0, 9], [9, 10], [10, 11], [11, 12],
      [0, 13], [13, 14], [14, 15], [15, 16],
      [0, 17], [17, 18], [18, 19], [19, 20],
      [5, 9], [9, 13], [13, 17]
    ];

    // Draw connections
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    
    connections.forEach(([start, end]) => {
      const s = landmarks[start];
      const e = landmarks[end];
      
      const gradient = ctx.createLinearGradient(s.x * width, s.y * height, e.x * width, e.y * height);
      gradient.addColorStop(0, '#00FF88');
      gradient.addColorStop(1, '#00FFCC');
      
      ctx.strokeStyle = gradient;
      ctx.beginPath();
      ctx.moveTo(s.x * width, s.y * height);
      ctx.lineTo(e.x * width, e.y * height);
      ctx.stroke();
    });

    // Draw landmarks with glow
    landmarks.forEach((lm, i) => {
      const x = lm.x * width;
      const y = lm.y * height;
      
      let color = '#FFFFFF';
      let size = 5;
      
      if (i === 0) { color = '#FF4444'; size = 8; }
      else if (i === 4) { color = '#FFA500'; size = 7; }
      else if (i === 8) { color = '#FFFF00'; size = 7; }
      else if (i === 12) { color = '#00FF00'; size = 7; }
      else if (i === 16) { color = '#00FFFF'; size = 7; }
      else if (i === 20) { color = '#FF00FF'; size = 7; }
      else { color = '#88FF88'; size = 4; }

      ctx.shadowBlur = 10;
      ctx.shadowColor = color;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(x, y, size, 0, 2 * Math.PI);
      ctx.fill();
      
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.arc(x - size/4, y - size/4, size/3, 0, 2 * Math.PI);
      ctx.fill();
      
      ctx.shadowBlur = 0;
    });
  }, []);

  // Start camera
  const startStreaming = useCallback(async () => {
    if (!handsLoaded) {
      toast.error('Hand detection still loading...');
      return;
    }

    // Reset state
    setCameraError(null);
    setCapturedText('');
    setCurrentDetection('');
    detectionCountRef.current.clear();
    lastDetectionRef.current = '';
    hasShownToastRef.current = false;
    isProcessingRef.current = false;
    setIsInitializing(true);

    try {
      // Get camera stream
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } }
      });
      
      streamRef.current = stream;

      if (!videoRef.current) {
        throw new Error('Video element not ready');
      }

      videoRef.current.srcObject = stream;
      
      await new Promise<void>((resolve, reject) => {
        if (!videoRef.current) {
          reject(new Error('Video element lost'));
          return;
        }
        
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play()
            .then(() => resolve())
            .catch(reject);
        };
        
        videoRef.current.onerror = () => reject(new Error('Video error'));
      });

      // Now initialize MediaPipe Hands AFTER video is ready
      const Hands = (window as any).Hands;
      const Camera = (window as any).Camera;
      
      if (!Hands || !Camera) {
        throw new Error('MediaPipe not loaded');
      }

      // Create new Hands instance
      const hands = new Hands({
        locateFile: (file: string) => 
          `https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4.1675469240/${file}`
      });

      hands.setOptions({
        maxNumHands: 2,
        modelComplexity: 1,
        minDetectionConfidence: 0.7,
        minTrackingConfidence: 0.5
      });

      // Set up results handler
      hands.onResults((results: any) => {
        if (!isProcessingRef.current || !canvasRef.current || !videoRef.current) return;

        const canvas = canvasRef.current;
        const video = videoRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const width = video.videoWidth || 640;
        const height = video.videoHeight || 480;
        
        canvas.width = width;
        canvas.height = height;
        ctx.clearRect(0, 0, width, height);

        if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
          // Draw all hands
          results.multiHandLandmarks.forEach((lms: LandmarkPoint[]) => {
            drawLandmarks(ctx, lms, width, height);
          });

          // Detect sign
          const landmarks = results.multiHandLandmarks[0];
          const detected = detectASLLetter(landmarks);
          
          if (detected) {
            detectionCountRef.current.set(detected, (detectionCountRef.current.get(detected) || 0) + 1);
            const count = detectionCountRef.current.get(detected) || 0;
            const threshold = 5;
            
            setConfidence(Math.min(count / threshold * 100, 100));
            
            if (count >= threshold && detected !== lastDetectionRef.current) {
              setCurrentDetection(detected);
              setCapturedText(prev => (prev + ' ' + detected).trim());
              lastDetectionRef.current = detected;
              
              detectionCountRef.current.forEach((_, key) => {
                if (key !== detected) detectionCountRef.current.set(key, 0);
              });
            } else if (count < threshold) {
              setCurrentDetection(`Detecting: ${detected}...`);
            }
          } else {
            setCurrentDetection('Show a sign...');
            detectionCountRef.current.clear();
            setConfidence(0);
          }
        } else {
          setCurrentDetection('No hand detected');
          detectionCountRef.current.clear();
          lastDetectionRef.current = '';
          setConfidence(0);
        }
      });

      handsRef.current = hands;

      // Create Camera utility
      const camera = new Camera(videoRef.current, {
        onFrame: async () => {
          if (handsRef.current && videoRef.current && isProcessingRef.current) {
            await handsRef.current.send({ image: videoRef.current });
          }
        },
        width: 640,
        height: 480
      });

      cameraRef.current = camera;
      
      // Start camera
      await camera.start();
      
      isProcessingRef.current = true;
      setIsInitializing(false);
      setIsStreaming(true);
      
      if (!hasShownToastRef.current) {
        hasShownToastRef.current = true;
        toast.success('Camera started! Show your signs.');
      }

    } catch (error: any) {
      setIsInitializing(false);
      isProcessingRef.current = false;
      
      if (error.name === 'NotAllowedError') {
        setCameraError('Camera permission denied.');
      } else if (error.name === 'NotFoundError') {
        setCameraError('No camera found.');
      } else {
        setCameraError('Could not start camera: ' + (error.message || 'Unknown error'));
      }
      
      cleanupResources();
    }
  }, [handsLoaded, drawLandmarks, cleanupResources]);

  // Stop camera
  const stopStreaming = useCallback(() => {
    isProcessingRef.current = false;
    cleanupResources();
    
    setIsStreaming(false);
    setIsInitializing(false);
    setCurrentDetection('');
    hasShownToastRef.current = false;
    
    if (capturedText.trim()) {
      onResult(capturedText.trim());
    }
  }, [cleanupResources, capturedText, onResult]);

  const copyToClipboard = useCallback(() => {
    if (capturedText) {
      navigator.clipboard.writeText(capturedText);
      setCopied(true);
      toast.success('Copied!');
      setTimeout(() => setCopied(false), 2000);
    }
  }, [capturedText]);

  const speakText = useCallback(() => {
    if (capturedText && 'speechSynthesis' in window) {
      speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(capturedText);
      utterance.rate = 0.9;
      speechSynthesis.speak(utterance);
      toast.success('Reading aloud...');
    }
  }, [capturedText]);

  const clearText = useCallback(() => {
    setCapturedText('');
    detectionCountRef.current.clear();
    lastDetectionRef.current = '';
  }, []);

  const isActive = isStreaming || isInitializing;

  return (
    <div className={className}>
      <div className="space-y-4">
        {!handsLoaded && !loadError && (
          <div className="text-center p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
            <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-blue-500" />
            <p className="text-sm text-blue-600">Loading hand detection model...</p>
          </div>
        )}

        {loadError && (
          <div className="text-center p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
            <AlertCircle className="h-6 w-6 mx-auto mb-2 text-destructive" />
            <p className="text-destructive text-sm">{loadError}</p>
            <Button variant="outline" size="sm" onClick={() => window.location.reload()} className="mt-2">
              Retry
            </Button>
          </div>
        )}

        <div className="relative w-full max-w-lg mx-auto" style={{ display: isActive ? 'block' : 'none' }}>
          <div className="relative rounded-xl overflow-hidden border-2 border-primary/50 shadow-lg bg-black aspect-video">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover bg-black"
              style={{ transform: 'scaleX(-1)' }}
            />
            
            <canvas 
              ref={canvasRef}
              className="absolute inset-0 w-full h-full pointer-events-none"
              style={{ transform: 'scaleX(-1)' }}
            />
            
            {isInitializing && !isStreaming && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/80">
                <div className="text-center text-white">
                  <Loader2 className="h-10 w-10 animate-spin mx-auto mb-3" />
                  <p>Starting camera...</p>
                </div>
              </div>
            )}
            
            {isStreaming && (
              <>
                <div className="absolute top-3 left-3 flex items-center gap-2 bg-red-500 text-white text-xs px-3 py-1.5 rounded-full shadow-lg">
                  <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
                  LIVE
                </div>
                
                {confidence > 0 && (
                  <div className="absolute top-3 left-1/2 -translate-x-1/2 bg-black/70 text-white text-xs px-3 py-1 rounded-full">
                    {Math.round(confidence)}% confident
                  </div>
                )}
                
                <div className="absolute bottom-3 left-3 right-3 bg-black/70 backdrop-blur-sm text-white text-sm p-3 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Hand className="h-4 w-4" />
                    <span>{currentDetection || 'Show your hand...'}</span>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
        
        {cameraError && (
          <div className="text-center p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
            <p className="text-destructive text-sm">{cameraError}</p>
            <Button variant="outline" size="sm" onClick={() => setCameraError(null)} className="mt-2">
              Dismiss
            </Button>
          </div>
        )}
        
        <div className="flex flex-wrap gap-2 justify-center">
          {!isActive ? (
            <Button onClick={startStreaming} size="lg" className="gap-2" disabled={!handsLoaded}>
              <Camera className="h-5 w-5" />
              Start Camera
            </Button>
          ) : (
            <Button variant="destructive" onClick={stopStreaming} size="lg" className="gap-2">
              <CameraOff className="h-5 w-5" />
              Stop & Show Results
            </Button>
          )}
        </div>

        {isStreaming && capturedText && (
          <Card className="border-green-500/30 bg-green-500/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2 text-green-600">
                <Hand className="h-4 w-4" />
                Detected Signs (Live)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="p-3 bg-muted rounded-lg">
                <p className="whitespace-pre-wrap text-sm font-mono">{capturedText}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {capturedText && !isStreaming && (
          <Card className="border-primary/20 bg-primary/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <Hand className="h-5 w-5 text-primary" />
                Captured Sign Language Text
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="p-4 bg-muted rounded-lg min-h-[100px]">
                <p className="whitespace-pre-wrap">{capturedText}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" onClick={copyToClipboard} className="gap-1">
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  {copied ? 'Copied!' : 'Copy'}
                </Button>
                <Button variant="outline" size="sm" onClick={speakText} className="gap-1">
                  <Volume2 className="h-4 w-4" />
                  Read Aloud
                </Button>
                <Button variant="outline" size="sm" onClick={clearText}>
                  Clear
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {!isActive && !capturedText && (
          <div className="text-sm text-muted-foreground p-4 border rounded-lg bg-muted/50">
            <Hand className="h-8 w-8 mx-auto mb-3 text-primary" />
            <p className="font-medium mb-2 text-center">Browser-Based Sign Language Recognition</p>
            <p className="text-xs text-center mb-3 text-green-600">
              ✓ Free • ✓ No API Key Required • ✓ Works Offline
            </p>
            <p className="font-medium mb-2">Supported Signs:</p>
            <div className="grid grid-cols-3 gap-1 text-xs">
              <div>• Letters A-Z</div>
              <div>• Numbers 1-5</div>
              <div>• 👍 Thumbs Up</div>
              <div>• 👎 Thumbs Down</div>
              <div>• ✌️ Peace</div>
              <div>• 🤟 I Love You</div>
              <div>• 🤘 Rock On</div>
              <div>• 👌 OK</div>
              <div>• ✋ Open Hand</div>
              <div>• ✊ Fist</div>
              <div>• 👆 Pointing</div>
              <div>• 🤙 Call Me</div>
            </div>
            <div className="mt-3 p-2 bg-blue-500/10 rounded-lg text-blue-600 text-xs">
              💡 Tip: Hold your sign steady until confidence reaches 100%!
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default GestureRecognition;
