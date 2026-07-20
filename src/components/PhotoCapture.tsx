"use client";
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Camera, Upload, X, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface PhotoCaptureProps {
  onPhotoSelect: (base64: string) => void;
  initialPhoto?: string;
}

export function PhotoCapture({ onPhotoSelect, initialPhoto }: PhotoCaptureProps) {
  const [mode, setMode] = useState<'idle' | 'camera' | 'preview'>('idle');
  const [photo, setPhoto] = useState<string | null>(initialPhoto || null);
  const [error, setError] = useState<string>('');
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Passport size aspect ratio (approx 35mm x 45mm, so 3.5 / 4.5 = 0.777)
  const TARGET_WIDTH = 350;
  const TARGET_HEIGHT = 450;

  const startCamera = async () => {
    setError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'user' } 
      });
      streamRef.current = stream;
      streamRef.current = stream;
      setMode('camera');
    } catch (err) {
      console.error('Camera error:', err);
      setError('Unable to access camera. Please check permissions or use the upload option.');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  useEffect(() => {
    if (mode === 'camera' && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
    }
  }, [mode]);

  const processAndSetImage = (img: HTMLImageElement) => {
    const canvas = document.createElement('canvas');
    canvas.width = TARGET_WIDTH;
    canvas.height = TARGET_HEIGHT;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Calculate crop to maintain aspect ratio
    const imgRatio = img.width / img.height;
    const targetRatio = TARGET_WIDTH / TARGET_HEIGHT;
    
    let sourceX = 0, sourceY = 0, sourceWidth = img.width, sourceHeight = img.height;

    if (imgRatio > targetRatio) {
      // Image is wider than target ratio
      sourceWidth = img.height * targetRatio;
      sourceX = (img.width - sourceWidth) / 2;
    } else {
      // Image is taller than target ratio
      sourceHeight = img.width / targetRatio;
      sourceY = (img.height - sourceHeight) / 2;
    }

    ctx.drawImage(img, sourceX, sourceY, sourceWidth, sourceHeight, 0, 0, TARGET_WIDTH, TARGET_HEIGHT);
    const base64 = canvas.toDataURL('image/jpeg', 0.9);
    setPhoto(base64);
    onPhotoSelect(base64);
    setMode('preview');
  };

  const capturePhoto = useCallback(() => {
    if (!videoRef.current) return;
    
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const img = new Image();
    img.onload = () => {
      processAndSetImage(img);
      stopCamera();
    };
    img.src = canvas.toDataURL('image/jpeg');
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError('');
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size (2MB)
    if (file.size > 2 * 1024 * 1024) {
      setError('File size exceeds 2MB limit.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => processAndSetImage(img);
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const cancel = () => {
    stopCamera();
    setPhoto(null);
    onPhotoSelect('');
    setMode('idle');
    setError('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="w-full max-w-xl mx-auto p-6 bg-white rounded-2xl shadow-sm border border-[#f0eded] border-t-8 border-t-[#3b8a53]">
      <h3 className="font-headline text-lg font-bold text-[#18281e] mb-2 flex items-center gap-2">
        <ImageIcon className="w-5 h-5" />
        Student Photo
      </h3>
      <p className="text-sm text-[#737873] mb-6">
        Upload a passport size photo (Max 2MB) or take a live picture using your camera. This photo will be printed on your final application form.
      </p>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">
          {error}
        </div>
      )}

      {!photo && mode === 'idle' && (
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-center py-8">
          <Button 
            type="button" 
            onClick={startCamera}
            className="w-full sm:w-auto flex items-center justify-center gap-2"
            style={{ backgroundColor: '#1f2937', color: 'white' }}
          >
            <Camera className="w-4 h-4" /> Take Live Photo
          </Button>
          
          <div className="relative w-full sm:w-auto">
            <input 
              type="file" 
              accept="image/jpeg, image/png, image/webp" 
              onChange={handleFileUpload}
              ref={fileInputRef}
              className="hidden"
              id="photo-upload"
            />
            <Button 
              type="button" 
              variant="outline"
              onClick={() => document.getElementById('photo-upload')?.click()}
              className="w-full sm:w-auto flex items-center gap-2"
            >
              <Upload className="w-4 h-4" /> Upload Photo (Max 2MB)
            </Button>
          </div>
        </div>
      )}

      {mode === 'camera' && (
        <div className="flex flex-col items-center gap-4">
          <div className="relative w-64 h-80 rounded-xl overflow-hidden bg-black flex items-center justify-center">
            {/* Outline to guide the user for a passport photo */}
            <div className="absolute inset-0 z-10 border-4 border-dashed border-white/50 m-4 rounded-lg pointer-events-none" />
            <video 
              ref={videoRef} 
              className="w-full h-full object-cover" 
              autoPlay
              playsInline 
              muted 
            />
          </div>
          <div className="flex gap-4">
            <Button type="button" onClick={capturePhoto} className="flex items-center" style={{ backgroundColor: '#10b981', color: 'white' }}>
              <Camera className="w-4 h-4 mr-2" /> Capture
            </Button>
            <Button type="button" variant="outline" onClick={() => { stopCamera(); setMode('idle'); }}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      {(mode === 'preview' || (photo && mode === 'idle')) && photo && (
        <div className="flex flex-col items-center gap-4">
          <div className="w-48 h-64 border border-[#e5e2e1] rounded-xl overflow-hidden shadow-sm">
            <img src={photo} alt="Student preview" className="w-full h-full object-cover" />
          </div>
          <div className="flex gap-4">
            <Button type="button" variant="outline" onClick={cancel} className="text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300">
              <X className="w-4 h-4 mr-2" /> Retake / Remove
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
