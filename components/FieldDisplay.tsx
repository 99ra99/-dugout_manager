import React from 'react';
import { LineupSlot, Player, PositionCode } from '../types';

interface Props {
  lineup: LineupSlot[];
  players: Player[];
}

const FieldDisplay: React.FC<Props> = ({ lineup, players }) => {
  
  const getPlayerAtPos = (pos: PositionCode) => {
    const slot = lineup.find(s => s.position === pos);
    if (!slot || !slot.playerId) return null;
    return players.find(p => p.id === slot.playerId);
  };

  // Coordinates for Player Markers (CSS percentages relative to container 400x533)
  const posCoordinates: Record<PositionCode, { top: string; left: string }> = {
    'P':  { top: '67%', left: '51.8%' },   // Pitcher (Center of diamond, approx y=358)
    'C':  { top: '94%', left: '51.8%' },   // Catcher (Behind Home, y=500+)
    '1B': { top: '64%', left: '83%' },     // 1st Base (Near bag at x=345, y=343)
    '2B': { top: '40%', left: '68%' },     // 2nd Base (Defensive depth right)
    '3B': { top: '64%', left: '20%' },     // 3rd Base (Near bag at x=70, y=343)
    'SS': { top: '40%', left: '36%' },     // Shortstop (Defensive depth left)
    'LF': { top: '25%', left: '18%' },     // Left Field
    'CF': { top: '18%', left: '51.8%' },   // Center Field
    'RF': { top: '25%', left: '85%' },     // Right Field
    'DH': { top: '88%', left: '90%' },     // Dugout area
  };

  return (
    <div className="relative w-full max-w-[500px] mx-auto rounded-xl shadow-xl overflow-hidden border-4 border-[#5fa550] aspect-[3/4] bg-[#75AA47]">
      
      {/* SVG Field Layer - Using provided geometry */}
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 400 533" fill="none" preserveAspectRatio="xMidYMid meet">
        <g clipPath="url(#clip0_9_5512)">
          <rect width="400" height="533" fill="#75AA47"/>
          {/* Infield Dirt Main Shape */}
          <path d="M162.108 224.892C187.101 199.899 227.624 199.899 252.617 224.892L377.544 349.819L207.362 520L37.1812 349.819L162.108 224.892Z" fill="#E3AA76"/>
          
          {/* Infield Grass Square */}
          <rect x="207" y="240" width="164.818" height="164.305" rx="29" transform="rotate(45 207 240)" fill="#75AA47"/>
          
          {/* Mound/Top Detail */}
          <rect x="207.362" y="196" width="60.5549" height="60.9665" rx="26" transform="rotate(45 207.362 196)" fill="#E3AA76"/>
          
          {/* Foul Lines and Outfield Arc (Large Rotated Rect) */}
          <rect x="206.921" y="-362.293" width="607" height="607" transform="rotate(45 206.921 -362.293)" stroke="white" strokeWidth="2"/>
          
          {/* Home Plate */}
          <path d="M217.142 487.142L217.142 507.142L207.142 517L197.142 507.142L197.142 487.142L217.142 487.142Z" fill="white"/>
          
          {/* 2nd Base */}
          <rect x="207.142" y="228" width="20" height="20" transform="rotate(45 207.142 228)" fill="white"/>
          
          {/* 1st Base */}
          <rect x="345.142" y="343" width="20" height="20" transform="rotate(45 345.142 343)" fill="white"/>
          
          {/* 3rd Base */}
          <rect x="70.1422" y="343" width="20" height="20" transform="rotate(45 70.1422 343)" fill="white"/>
        </g>
        <defs>
          <clipPath id="clip0_9_5512">
            <rect width="400" height="533" fill="white"/>
          </clipPath>
        </defs>
      </svg>

      {/* Player Markers */}
      {Object.entries(posCoordinates).map(([posCode, coords]) => {
        const player = getPlayerAtPos(posCode as PositionCode);
        const isDH = posCode === 'DH';
        
        return (
          <div 
            key={posCode}
            className="absolute flex flex-col items-center justify-center w-24 -translate-x-1/2 -translate-y-1/2 transition-all z-10"
            style={{ top: coords.top, left: coords.left }}
          >
            <div className={`
              relative flex items-center justify-center w-10 h-10 rounded-full border-2 shadow-lg font-bold transition-transform hover:scale-110
              ${player ? 'bg-white border-indigo-600 text-indigo-900' : 'bg-[#3e6b34] border-white/40 text-white/60'}
            `}>
              <span className="text-xs">{posCode}</span>
              {player && (
                <span className="absolute -top-2 -right-2 w-5 h-5 flex items-center justify-center bg-indigo-600 text-white text-[10px] rounded-full border border-white shadow-sm">
                  {player.number}
                </span>
              )}
            </div>
            
            {player ? (
              <div className="mt-1 px-2 py-0.5 bg-white/90 text-slate-900 text-xs font-semibold rounded shadow-sm whitespace-nowrap border border-slate-200">
                {player.name}
              </div>
            ) : (
              !isDH && <div className="mt-1 text-[10px] text-white/60 bg-black/10 px-1 rounded">비어있음</div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default FieldDisplay;