import React from 'react';
import { RotateCcw, Frown, Smile, Trophy } from 'lucide-react';

interface SRSControlsProps {
  onRate: (status: 'Again' | 'Hard' | 'Good' | 'Easy') => void;
}

export function SRSControls({ onRate }: SRSControlsProps) {
  return (
    <div className="w-full max-w-2xl mx-auto mt-6">
      <div className="grid grid-cols-4 gap-3">
        <button
          onClick={() => onRate('Again')}
          className="flex flex-col items-center justify-center py-4 bg-error-container text-on-error-container rounded-xl hover:bg-error hover:text-error-container transition-all group"
        >
          <RotateCcw className="w-6 h-6 mb-1 group-hover:scale-110 transition-transform" />
          <span className="font-bold">Again</span>
          <span className="text-xs opacity-70 mt-1">Forgot</span>
        </button>
        
        <button
          onClick={() => onRate('Hard')}
          className="flex flex-col items-center justify-center py-4 bg-surface-container-high text-on-surface rounded-xl hover:bg-outline-variant/50 transition-all group border border-outline-variant"
        >
          <Frown className="w-6 h-6 mb-1 text-orange-500 group-hover:scale-110 transition-transform" />
          <span className="font-bold">Hard</span>
          <span className="text-xs opacity-70 mt-1">Struggled</span>
        </button>
        
        <button
          onClick={() => onRate('Good')}
          className="flex flex-col items-center justify-center py-4 bg-primary-container text-on-primary-container rounded-xl hover:bg-primary transition-all group"
        >
          <Smile className="w-6 h-6 mb-1 group-hover:scale-110 transition-transform" />
          <span className="font-bold">Good</span>
          <span className="text-xs opacity-70 mt-1">Remembered</span>
        </button>
        
        <button
          onClick={() => onRate('Easy')}
          className="flex flex-col items-center justify-center py-4 bg-[#c4eed0] dark:bg-[#0f5223] text-[#072711] dark:text-[#c4eed0] rounded-xl hover:opacity-90 transition-all group"
        >
          <Trophy className="w-6 h-6 mb-1 group-hover:scale-110 transition-transform" />
          <span className="font-bold">Easy</span>
          <span className="text-xs opacity-70 mt-1">Perfect</span>
        </button>
      </div>
    </div>
  );
}
