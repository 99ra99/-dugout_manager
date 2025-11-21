import React from 'react';
import { LineupSlot, Player, PositionCode } from '../types';
import { POSITIONS, DEFAULT_LINEUP_SIZE, MAX_LINEUP_SIZE } from '../constants';
import FieldDisplay from './FieldDisplay';
import { Plus, Minus, User } from 'lucide-react';

interface Props {
  players: Player[];
  lineup: LineupSlot[];
  setLineup: (l: LineupSlot[]) => void;
}

const LineupBuilder: React.FC<Props> = ({ players, lineup, setLineup }) => {
  
  // Update a specific slot
  const updateSlot = (order: number, field: keyof LineupSlot, value: any) => {
    setLineup(lineup.map(slot => {
      if (slot.order === order) {
        return { ...slot, [field]: value };
      }
      // If setting position, ensure unique positions on field (except DH/P might overlap player, but logically position should be unique in standard play)
      // For simplicity, we allow duplicates but warn visually? No, let's just set it.
      return slot;
    }));
  };

  const addSlot = () => {
    if (lineup.length >= MAX_LINEUP_SIZE) return;
    setLineup([...lineup, { order: lineup.length + 1, playerId: null, position: null }]);
  };

  const removeSlot = () => {
    if (lineup.length <= DEFAULT_LINEUP_SIZE) return;
    setLineup(lineup.slice(0, -1));
  };

  // Find players not yet in lineup
  const assignedPlayerIds = lineup.map(l => l.playerId).filter(Boolean);
  const benchPlayers = players.filter(p => !assignedPlayerIds.includes(p.id));

  return (
    <div className="h-full flex flex-col md:flex-row overflow-hidden">
      {/* Left: Lineup Editor */}
      <div className="w-full md:w-1/2 p-4 bg-white border-r border-slate-200 overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold text-slate-800">타순 및 수비 위치</h2>
          <div className="flex gap-2">
            <button 
              onClick={removeSlot} 
              disabled={lineup.length <= 9}
              className="p-1 rounded border hover:bg-slate-100 disabled:opacity-30"
            >
              <Minus size={16} />
            </button>
            <button 
              onClick={addSlot} 
              disabled={lineup.length >= 10}
              className="p-1 rounded border hover:bg-slate-100 disabled:opacity-30"
            >
              <Plus size={16} />
            </button>
          </div>
        </div>

        <div className="space-y-2">
          {lineup.map((slot) => (
            <div key={slot.order} className="flex items-center gap-2 p-2 border rounded-lg bg-slate-50 hover:border-indigo-300 transition-colors">
              <div className="w-8 h-8 flex items-center justify-center bg-indigo-100 text-indigo-800 font-bold rounded-full text-sm shrink-0">
                {slot.order}
              </div>
              
              {/* Position Select */}
              <select 
                value={slot.position || ''} 
                onChange={(e) => updateSlot(slot.order, 'position', e.target.value || null)}
                className="w-24 p-2 text-sm border rounded bg-white focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">포지션</option>
                {POSITIONS.map(p => (
                  <option key={p.code} value={p.code}>{p.label}</option>
                ))}
              </select>

              {/* Player Select */}
              <select
                value={slot.playerId || ''}
                onChange={(e) => updateSlot(slot.order, 'playerId', e.target.value || null)}
                className="flex-1 p-2 text-sm border rounded bg-white focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">선수 선택</option>
                {/* Show currently selected player at top even if handled below */}
                {slot.playerId && (
                  <option value={slot.playerId}>
                    {players.find(p => p.id === slot.playerId)?.name} (#{players.find(p => p.id === slot.playerId)?.number})
                  </option>
                )}
                <optgroup label="대기 선수">
                  {benchPlayers.map(p => (
                    <option key={p.id} value={p.id}>
                       {p.name} (#{p.number}) - {p.mainPosition}
                    </option>
                  ))}
                </optgroup>
              </select>
            </div>
          ))}
        </div>

        {/* Bench List Display */}
        <div className="mt-8">
          <h3 className="text-md font-bold text-slate-700 mb-2 flex items-center gap-2">
             <User size={18}/> 대기 선수 ({benchPlayers.length})
          </h3>
          <div className="grid grid-cols-2 gap-2">
            {benchPlayers.map(p => (
              <div key={p.id} className="text-sm p-2 bg-slate-50 rounded border text-slate-600">
                <span className="font-bold mr-1">#{p.number}</span>
                {p.name} ({p.mainPosition})
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right: Field View */}
      <div className="w-full md:w-1/2 p-4 bg-slate-100 overflow-y-auto flex items-center justify-center">
        <FieldDisplay lineup={lineup} players={players} />
      </div>
    </div>
  );
};

export default LineupBuilder;