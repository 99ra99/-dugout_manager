import React, { useState } from 'react';
import { Plus, Trash2, Edit2, Save, X } from 'lucide-react';
import { Player, Hand, PositionCode } from '../types';
import { POSITIONS } from '../constants';

interface Props {
  players: Player[];
  onAdd: (p: Player) => void;
  onUpdate: (p: Player) => void;
  onDelete: (id: string) => void;
}

const RosterManager: React.FC<Props> = ({ players, onAdd, onUpdate, onDelete }) => {
  const [isEditing, setIsEditing] = useState<string | null>(null);
  
  // Form State
  const [newName, setNewName] = useState('');
  const [newNumber, setNewNumber] = useState('');
  const [newBat, setNewBat] = useState<Hand>('우');
  const [newThrow, setNewThrow] = useState<Hand>('우');
  const [newPos, setNewPos] = useState<PositionCode>('P');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newNumber) return;

    const newPlayer: Player = {
      id: Date.now().toString(),
      name: newName,
      number: newNumber,
      batHand: newBat,
      throwHand: newThrow,
      mainPosition: newPos,
    };

    onAdd(newPlayer);
    // Reset
    setNewName('');
    setNewNumber('');
    setNewPos('P');
  };

  return (
    <div className="p-6 h-full overflow-y-auto flex flex-col md:flex-row gap-6">
      {/* Registration Form */}
      <div className="w-full md:w-1/3 bg-white p-6 rounded-lg shadow-md h-fit border border-slate-200">
        <h2 className="text-lg font-bold mb-4 flex items-center gap-2 border-b pb-2">
          <Plus className="w-5 h-5 text-indigo-600" />
          선수 등록
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">이름</label>
            <input 
              type="text" 
              value={newName}
              onChange={e => setNewName(e.target.value)}
              className="w-full p-2 border rounded focus:ring-2 focus:ring-indigo-500 outline-none"
              placeholder="홍길동"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">등번호</label>
            <input 
              type="number" 
              value={newNumber}
              onChange={e => setNewNumber(e.target.value)}
              className="w-full p-2 border rounded focus:ring-2 focus:ring-indigo-500 outline-none"
              placeholder="10"
              required
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">투구</label>
              <div className="flex gap-2">
                {(['우', '좌'] as Hand[]).map(h => (
                  <button
                    key={`throw-${h}`}
                    type="button"
                    onClick={() => setNewThrow(h)}
                    className={`flex-1 py-1 text-sm rounded border ${newThrow === h ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-600 border-slate-300'}`}
                  >
                    {h}투
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">타격</label>
              <div className="flex gap-2">
                {(['우', '좌'] as Hand[]).map(h => (
                  <button
                    key={`bat-${h}`}
                    type="button"
                    onClick={() => setNewBat(h)}
                    className={`flex-1 py-1 text-sm rounded border ${newBat === h ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-600 border-slate-300'}`}
                  >
                    {h}타
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">주 포지션</label>
            <select 
              value={newPos} 
              onChange={e => setNewPos(e.target.value as PositionCode)}
              className="w-full p-2 border rounded focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
            >
              {POSITIONS.map(p => (
                <option key={p.code} value={p.code}>{p.label} ({p.code})</option>
              ))}
            </select>
          </div>

          <button 
            type="submit"
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded transition-colors mt-4"
          >
            등록하기
          </button>
        </form>
      </div>

      {/* Player List */}
      <div className="flex-1 bg-white rounded-lg shadow-md border border-slate-200 flex flex-col">
        <div className="p-4 border-b bg-slate-50 flex justify-between items-center">
          <h2 className="text-lg font-bold">등록된 선수 목록 ({players.length}명)</h2>
        </div>
        <div className="flex-1 overflow-auto p-0">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-100 text-slate-600 sticky top-0">
              <tr>
                <th className="p-3 font-semibold w-16">No.</th>
                <th className="p-3 font-semibold">이름</th>
                <th className="p-3 font-semibold">포지션</th>
                <th className="p-3 font-semibold">투/타</th>
                <th className="p-3 font-semibold text-right">관리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {players.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-400">등록된 선수가 없습니다.</td>
                </tr>
              )}
              {players.map(player => (
                <PlayerRow 
                  key={player.id} 
                  player={player} 
                  isEditing={isEditing === player.id}
                  onEditStart={() => setIsEditing(player.id)}
                  onEditCancel={() => setIsEditing(null)}
                  onUpdate={(updated) => { onUpdate(updated); setIsEditing(null); }}
                  onDelete={() => onDelete(player.id)}
                />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

interface PlayerRowProps {
  player: Player;
  isEditing: boolean;
  onEditStart: () => void;
  onEditCancel: () => void;
  onUpdate: (p: Player) => void;
  onDelete: () => void;
}

const PlayerRow: React.FC<PlayerRowProps> = ({ player, isEditing, onEditStart, onEditCancel, onUpdate, onDelete }) => {
  const [localData, setLocalData] = useState(player);

  if (isEditing) {
    return (
      <tr className="bg-indigo-50">
        <td className="p-2"><input className="w-12 p-1 border rounded" value={localData.number} onChange={e => setLocalData({...localData, number: e.target.value})} /></td>
        <td className="p-2"><input className="w-24 p-1 border rounded" value={localData.name} onChange={e => setLocalData({...localData, name: e.target.value})} /></td>
        <td className="p-2">
          <select className="p-1 border rounded" value={localData.mainPosition} onChange={e => setLocalData({...localData, mainPosition: e.target.value as PositionCode})}>
            {POSITIONS.map(p => <option key={p.code} value={p.code}>{p.code}</option>)}
          </select>
        </td>
        <td className="p-2 text-xs text-slate-500">
           {/* Simplification for inline edit: just showing text, but ideally selectable */}
           {localData.throwHand}투 {localData.batHand}타
        </td>
        <td className="p-2 text-right space-x-2">
          <button onClick={() => onUpdate(localData)} className="p-1 text-green-600 hover:bg-green-100 rounded"><Save size={16}/></button>
          <button onClick={onEditCancel} className="p-1 text-red-600 hover:bg-red-100 rounded"><X size={16}/></button>
        </td>
      </tr>
    );
  }

  return (
    <tr className="hover:bg-slate-50">
      <td className="p-3 font-mono text-slate-500">#{player.number}</td>
      <td className="p-3 font-medium text-slate-900">{player.name}</td>
      <td className="p-3"><span className="inline-block px-2 py-0.5 rounded bg-slate-100 border text-xs font-bold text-slate-600">{player.mainPosition}</span></td>
      <td className="p-3 text-slate-500">{player.throwHand}투 {player.batHand}타</td>
      <td className="p-3 text-right space-x-2">
        <button onClick={onEditStart} className="p-1 text-blue-600 hover:bg-blue-50 rounded" title="수정"><Edit2 size={16}/></button>
        <button onClick={() => { if(confirm('삭제하시겠습니까?')) onDelete() }} className="p-1 text-red-600 hover:bg-red-50 rounded" title="삭제"><Trash2 size={16}/></button>
      </td>
    </tr>
  );
};

export default RosterManager;