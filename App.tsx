import React, { useState, useEffect } from 'react';
import { Users, ClipboardList, FileText, Trophy } from 'lucide-react';
import RosterManager from './components/RosterManager';
import LineupBuilder from './components/LineupBuilder';
import GameRecorder from './components/GameRecorder';
import { Player, LineupSlot, GameRecord } from './types';

type Tab = 'roster' | 'lineup' | 'game';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('roster');
  
  // -- Global State --
  const [players, setPlayers] = useState<Player[]>(() => {
    const saved = localStorage.getItem('baseball_players');
    return saved ? JSON.parse(saved) : [];
  });

  const [lineup, setLineup] = useState<LineupSlot[]>(() => {
    const saved = localStorage.getItem('baseball_lineup');
    if (saved) return JSON.parse(saved);
    // Initialize empty lineup 1-9
    return Array.from({ length: 9 }, (_, i) => ({
      order: i + 1,
      playerId: null,
      position: null
    }));
  });

  // Records: simple array of events
  const [records, setRecords] = useState<GameRecord[]>(() => {
    const saved = localStorage.getItem('baseball_records');
    return saved ? JSON.parse(saved) : [];
  });

  // -- Persistence --
  useEffect(() => {
    localStorage.setItem('baseball_players', JSON.stringify(players));
  }, [players]);

  useEffect(() => {
    localStorage.setItem('baseball_lineup', JSON.stringify(lineup));
  }, [lineup]);

  useEffect(() => {
    localStorage.setItem('baseball_records', JSON.stringify(records));
  }, [records]);

  // -- Handlers --
  const addPlayer = (player: Player) => {
    setPlayers([...players, player]);
  };

  const updatePlayer = (updated: Player) => {
    setPlayers(players.map(p => p.id === updated.id ? updated : p));
  };

  const deletePlayer = (id: string) => {
    setPlayers(players.filter(p => p.id !== id));
    // Remove from lineup if present
    setLineup(lineup.map(slot => slot.playerId === id ? { ...slot, playerId: null, position: null } : slot));
  };

  return (
    <div className="flex flex-col h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-indigo-900 text-white p-4 shadow-md flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <Trophy className="w-6 h-6 text-yellow-400" />
          <h1 className="text-xl font-bold">야구 기록 및 라인업 관리</h1>
        </div>
        <nav className="flex space-x-2">
          <button 
            onClick={() => setActiveTab('roster')}
            className={`px-4 py-2 rounded-md flex items-center gap-2 transition-colors ${activeTab === 'roster' ? 'bg-indigo-700 text-white' : 'text-indigo-200 hover:bg-indigo-800'}`}
          >
            <Users size={18} />
            <span>선수 관리</span>
          </button>
          <button 
            onClick={() => setActiveTab('lineup')}
            className={`px-4 py-2 rounded-md flex items-center gap-2 transition-colors ${activeTab === 'lineup' ? 'bg-indigo-700 text-white' : 'text-indigo-200 hover:bg-indigo-800'}`}
          >
            <ClipboardList size={18} />
            <span>라인업 작성</span>
          </button>
          <button 
            onClick={() => setActiveTab('game')}
            className={`px-4 py-2 rounded-md flex items-center gap-2 transition-colors ${activeTab === 'game' ? 'bg-indigo-700 text-white' : 'text-indigo-200 hover:bg-indigo-800'}`}
          >
            <FileText size={18} />
            <span>경기 기록</span>
          </button>
        </nav>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden relative">
        {activeTab === 'roster' && (
          <RosterManager 
            players={players} 
            onAdd={addPlayer} 
            onUpdate={updatePlayer} 
            onDelete={deletePlayer} 
          />
        )}
        {activeTab === 'lineup' && (
          <LineupBuilder 
            players={players} 
            lineup={lineup} 
            setLineup={setLineup} 
          />
        )}
        {activeTab === 'game' && (
          <GameRecorder 
            players={players} 
            initialLineup={lineup}
            records={records}
            setRecords={setRecords}
          />
        )}
      </main>
    </div>
  );
};

export default App;