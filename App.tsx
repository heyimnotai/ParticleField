import React, { useState, useRef, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment } from '@react-three/drei';
import { HandTracker } from './components/HandTracker';
import { ParticleShape } from './components/ParticleShape';
import { Controls } from './components/Controls';
import { HandLandmark } from './types';

export default function App() {
  const [sides, setSides] = useState<number>(6);
  const [color, setColor] = useState<string>('#00ffff');
  const [rotationX, setRotationX] = useState<number>(45);
  const [isReady, setIsReady] = useState(false);

  // We use a ref for hand positions to avoid re-rendering the entire canvas 
  // on every frame update from the webcam, maintaining 60fps physics.
  const handsRef = useRef<HandLandmark[][]>([]);

  const handleHandsDetected = (landmarks: HandLandmark[][]) => {
    handsRef.current = landmarks;
  };

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden select-none">
      {/* Background Camera Feed */}
      <HandTracker 
        onHandsDetected={handleHandsDetected} 
        onCameraReady={() => setIsReady(true)}
      />

      {/* 3D Scene */}
      <div className="absolute inset-0 z-10">
        <Canvas camera={{ position: [0, 0, 8], fov: 45 }}>
          <Suspense fallback={null}>
            <ambientLight intensity={0.5} />
            <pointLight position={[10, 10, 10]} intensity={1} />
            <ParticleShape
              sides={sides}
              color={color}
              rotationX={rotationX}
              handsRef={handsRef}
            />
            {/* Orbit controls allowed but mostly static to focus on hand interaction */}
            <OrbitControls enableZoom={false} enablePan={false} dampingFactor={0.05} />
            <Environment preset="city" />
          </Suspense>
        </Canvas>
      </div>

      {/* Loading State */}
      {!isReady && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black text-white">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
          <p className="animate-pulse tracking-wider">INITIALIZING VISION...</p>
        </div>
      )}

      {/* UI Overlay */}
      <div className="absolute inset-0 z-20 pointer-events-none">
        <Controls
          sides={sides}
          setSides={setSides}
          color={color}
          setColor={setColor}
          rotationX={rotationX}
          setRotationX={setRotationX}
        />
      </div>
    </div>
  );
}