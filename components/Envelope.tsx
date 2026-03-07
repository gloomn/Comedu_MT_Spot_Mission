import React from 'react';
import { MailOpen, Mail, Lock } from 'lucide-react';

interface EnvelopeProps {
  isOpen: boolean;
  isNearby: boolean;
  onClick: () => void;
  spotId: number;
  distance?: number;
}

const Envelope: React.FC<EnvelopeProps> = ({ isOpen, isNearby, onClick, spotId, distance }) => {
  return (
    <button
      onClick={onClick}
      className={`relative group w-full aspect-square flex flex-col items-center justify-center transition-all duration-300 transform active:scale-95 ${
        isOpen 
          ? 'bg-indigo-50 border-2 border-indigo-200 shadow-inner' 
          : isNearby 
            ? 'bg-white shadow-xl border-2 border-indigo-400 animate-pulse' 
            : 'bg-slate-100 shadow-sm border border-slate-200 opacity-80'
      } rounded-2xl`}
    >
      <div className="absolute top-2 left-3 text-[10px] font-black text-slate-400">SPOT {spotId}</div>
      {!isNearby && !isOpen && (
        <div className="absolute top-2 right-2 bg-slate-200 text-slate-500 rounded-full p-1">
          <Lock className="w-3 h-3" />
        </div>
      )}
      
      <div className={`transition-all duration-500 ${isOpen ? 'scale-110' : 'scale-100'}`}>
        {isOpen ? (
          <MailOpen className="w-10 h-10 text-indigo-600" />
        ) : isNearby ? (
          <Mail className="w-10 h-10 text-indigo-500" />
        ) : (
          <Mail className="w-10 h-10 text-slate-300" />
        )}
      </div>

      <p className={`mt-2 text-[10px] font-bold ${isOpen ? 'text-indigo-600' : isNearby ? 'text-indigo-500' : 'text-slate-400'}`}>
        {isOpen ? '봉투 열림' : isNearby ? '열기 가능' : '접근 필요'}
      </p>
      
      {distance !== undefined && !isOpen && (
        <p className="absolute bottom-2 text-[9px] font-medium text-slate-400">
          약 {Math.round(distance)}m
        </p>
      )}
    </button>
  );
};

export default Envelope;