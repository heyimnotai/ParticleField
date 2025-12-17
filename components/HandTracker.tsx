import React, { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { MediaPipeService } from '../services/mediapipeService';
import { HandResults } from '../types';

interface HandTrackerProps {
  onHandsDetected: (landmarks: HandResults['multiHandLandmarks']) => void;
  onCameraReady?: () => void;
}

export const HandTracker = forwardRef<HTMLVideoElement, HandTrackerProps>(
  ({ onHandsDetected, onCameraReady }, ref) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const serviceRef = useRef<MediaPipeService | null>(null);

    // Forward the video ref for external usage if needed
    useImperativeHandle(ref, () => videoRef.current as HTMLVideoElement);

    useEffect(() => {
      const videoElement = videoRef.current;
      if (!videoElement) return;

      serviceRef.current = new MediaPipeService((results) => {
        if (results.multiHandLandmarks) {
          onHandsDetected(results.multiHandLandmarks);
        }
      });

      const initCamera = async () => {
        try {
            await serviceRef.current?.initialize(videoElement);
            if (onCameraReady) onCameraReady();
        } catch (err) {
            console.error("Failed to initialize camera or mediapipe", err);
        }
      };

      initCamera();

      return () => {
        serviceRef.current?.cleanup();
      };
    }, [onHandsDetected, onCameraReady]);

    return (
      <video
        ref={videoRef}
        className="absolute top-0 left-0 w-full h-full object-cover opacity-20 pointer-events-none transform -scale-x-100"
        playsInline
      />
    );
  }
);