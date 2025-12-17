import React from 'react';
import { Settings, RefreshCw, Palette } from 'lucide-react';

interface ControlsProps {
  sides: number;
  setSides: (v: number) => void;
  color: string;
  setColor: (v: string) => void;
  rotationX: number;
  setRotationX: (v: number) => void;
}

export const Controls: React.FC<ControlsProps> = ({
  sides,
  setSides,
  color,
  setColor,
  rotationX,
  setRotationX,
}) => {
  const colors = ['#00ffff', '#ff00ff', '#ffff00', '#ff3333', '#33ff33', '#ffffff'];

  return (
    <div className="absolute bottom-0 left-0 w-full p-6 text-white pointer-events-none flex flex-col items-center justify-end bg-gradient-to-t from-black/90 to-transparent">
      <div className="pointer-events-auto max-w-2xl w-full space-y-6 backdrop-blur-md bg-white/10 p-6 rounded-2xl border border-white/10 shadow-2xl">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/20 pb-4">
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-blue-400" />
            <h2 className="text-lg font-semibold tracking-wide">Shape Controller</h2>
          </div>
          <div className="text-xs text-white/50 bg-white/10 px-2 py-1 rounded">
            Uses MediaPipe & WebGL
          </div>
        </div>

        {/* Shape Sides */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-300">Sides per Face</span>
            <span className="font-mono text-blue-400">{sides}</span>
          </div>
          <input
            type="range"
            min="3"
            max="16"
            step="1"
            value={sides}
            onChange={(e) => setSides(Number(e.target.value))}
            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer hover:bg-gray-600 transition-colors [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-blue-500"
          />
        </div>

        {/* X Rotation Scroll */}
        <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-gray-300">
                <RefreshCw className="w-4 h-4" />
                <span>Rotation X-Axis</span>
            </div>
            <div className="relative w-full h-10 bg-gray-800/50 rounded-lg overflow-hidden border border-white/5">
                 <input
                    type="range"
                    min="0"
                    max="360"
                    step="1"
                    value={rotationX}
                    onChange={(e) => setRotationX(Number(e.target.value))}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize z-10"
                />
                <div 
                    className="absolute top-0 bottom-0 bg-blue-500/30 transition-all duration-75 ease-out border-r border-blue-400"
                    style={{ width: `${(rotationX / 360) * 100}%` }}
                />
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <span className="text-xs font-mono">{rotationX}°</span>
                </div>
            </div>
        </div>

        {/* Color Picker */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-gray-300">
            <Palette className="w-4 h-4" />
            <span>Particle Color</span>
          </div>
          <div className="flex gap-3 overflow-x-auto py-2">
            {colors.map((c) => (
              <button
                key={c}
                onClick={() => setColor(c)}
                className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 focus:outline-none ${
                  color === c ? 'border-white scale-110 shadow-[0_0_10px_currentColor]' : 'border-transparent opacity-70 hover:opacity-100'
                }`}
                style={{ backgroundColor: c, color: c }}
                aria-label={`Select color ${c}`}
              />
            ))}
          </div>
        </div>

        <div className="text-xs text-center text-white/30 pt-2">
            Bring hands into view to interact with particles
        </div>
      </div>
    </div>
  );
};