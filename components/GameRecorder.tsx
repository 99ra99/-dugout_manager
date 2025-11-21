
import React, { useState, useEffect, useMemo } from 'react';
import { GameRecord, LineupSlot, Player, PlayOutcome, ActiveLineup, ScheduleEvent, PositionCode } from '../types';
import { OUTCOMES, INNINGS_COUNT, POSITIONS } from '../constants';
import { ChevronDown, UserCog, CheckSquare, Square, MapPin, Calendar, Flag, PauseCircle, Tv, ClipboardList, Edit } from 'lucide-react';

interface Props {
  players: Player[];
  initialLineup: LineupSlot[];
  records: GameRecord[];
  setRecords: (r: GameRecord[]) => void;
  currentGame?: ScheduleEvent;
  onFinishGame?: (scheduleId: string, homeScore: number, awayScore: number) => void;
  onSuspendGame?: (scheduleId: string) => void;
  onUpdateGame?: (game: ScheduleEvent) => void;
}

const GameRecorder: React.FC<Props> = ({ players, initialLineup, records, setRecords, currentGame, onFinishGame, onSuspendGame, onUpdateGame }) => {
  // We need to track WHO is currently in each batting order slot.
  const [currentBatters, setCurrentBatters] = useState<ActiveLineup>({});
  
  // Modal State
  const [selectedCell, setSelectedCell] = useState<{inning: number, order: number} | null>(null);
  const [subModalOrder, setSubModalOrder] = useState<number | null>(null);
  const [showEndGameModal, setShowEndGameModal] = useState(false);
  const [awayScoreInput, setAwayScoreInput] = useState<number>(0);
  
  // Lineup Editor Modal State
  const [showLineupEditor, setShowLineupEditor] = useState(false);
  const [editingLineup, setEditingLineup] = useState<LineupSlot[]>([]);

  // Outcome Modifiers State
  const [popupRbi, setPopupRbi] = useState<number>(0);
  const [popupIsRun, setPopupIsRun] = useState<boolean>(false);

  // Initialize active lineup from prop (initial or match specific)
  // This effect runs when the component mounts or when the game context changes.
  useEffect(() => {
    let targetLineup = initialLineup;
    
    // If current game has a specific lineup, use that instead of the master initialLineup
    if (currentGame?.lineup && currentGame.lineup.length > 0) {
      targetLineup = currentGame.lineup;
    }

    const init: ActiveLineup = {};
    targetLineup.forEach(slot => {
      if (slot.playerId) init[slot.order] = slot.playerId;
    });
    setCurrentBatters(init);
    setEditingLineup(JSON.parse(JSON.stringify(targetLineup))); // Initialize editor state too

  }, [currentGame, initialLineup]);

  // Calculate Our Runs Per Inning
  const homeInningRuns = useMemo(() => {
    const inningScores = Array(INNINGS_COUNT).fill(0);
    const relevantRecords = currentGame 
      ? records.filter(r => r.scheduleId === currentGame.id) 
      : records.filter(r => !r.scheduleId);
    
    relevantRecords.forEach(r => {
      if (r.isRun) {
        // r.inning is 1-based, array is 0-based
        if (r.inning > 0 && r.inning <= INNINGS_COUNT) {
          inningScores[r.inning - 1]++;
        }
      }
    });
    return inningScores;
  }, [records, currentGame]);

  // Calculate Our Score (Home Score) Total
  const currentHomeScore = homeInningRuns.reduce((a, b) => a + b, 0);

  // Calculate Our Hits (for Scoreboard)
  const currentHomeHits = useMemo(() => {
     const relevantRecords = currentGame 
        ? records.filter(r => r.scheduleId === currentGame.id) 
        : records.filter(r => !r.scheduleId);
     return relevantRecords.filter(r => ['H', '2B', '3B', 'HR'].includes(r.outcome || '')).length;
  }, [records, currentGame]);

  // Away Inning Scores (from ScheduleEvent or empty)
  const awayInningRuns = useMemo(() => {
    const scores = Array(INNINGS_COUNT).fill(0);
    if (currentGame?.awayInningScores) {
      currentGame.awayInningScores.forEach((score, idx) => {
        if (idx < INNINGS_COUNT) scores[idx] = score;
      });
    }
    return scores;
  }, [currentGame]);

  const currentAwayScore = awayInningRuns.reduce((a, b) => a + b, 0);

  // Helper to find record
  const getRecord = (inning: number, order: number) => {
    // If we are in a linked game, only find records for that game.
    // If free mode, find records with no scheduleId.
    return records.find(r => 
      r.inning === inning && 
      r.battingOrder === order && 
      (currentGame ? r.scheduleId === currentGame.id : !r.scheduleId)
    );
  };

  // Helper to open modal and init state
  const openOutcomeModal = (inning: number, order: number) => {
    const record = getRecord(inning, order);
    setPopupRbi(record?.rbi || 0);
    setPopupIsRun(record?.isRun || false);
    setSelectedCell({ inning, order });
  };

  const handleRecord = (outcome: PlayOutcome) => {
    if (!selectedCell) return;
    
    const { inning, order } = selectedCell;
    const currentPlayerId = currentBatters[order];
    
    if (!currentPlayerId) {
      alert("해당 타순에 선수가 배치되지 않았습니다.");
      return;
    }

    // Find existing using same logic as getRecord
    const existingIndex = records.findIndex(r => 
      r.inning === inning && 
      r.battingOrder === order &&
      (currentGame ? r.scheduleId === currentGame.id : !r.scheduleId)
    );
    
    const newRecord: GameRecord = {
      scheduleId: currentGame?.id, // Link record to this game
      inning,
      battingOrder: order,
      playerId: currentPlayerId, // Store who did it
      outcome,
      rbi: popupRbi,
      isRun: popupIsRun
    };

    let newRecords = [...records];
    if (existingIndex >= 0) {
      if (outcome === null) {
         newRecords.splice(existingIndex, 1); // Remove
      } else {
         newRecords[existingIndex] = newRecord; // Update
      }
    } else {
      if (outcome !== null) newRecords.push(newRecord); // Add
    }

    setRecords(newRecords);
    setSelectedCell(null);
  };

  // Temporary Substitution (Quick Sub)
  const handleSub = (order: number, newPlayerId: string) => {
    setCurrentBatters(prev => ({
      ...prev,
      [order]: newPlayerId
    }));
    setSubModalOrder(null);
  };

  // Lineup Editor Handlers
  const openLineupEditor = () => {
     // Refresh editing lineup from current game or initial
     let sourceLineup = currentGame?.lineup && currentGame.lineup.length > 0 
        ? currentGame.lineup 
        : initialLineup;
     
     setEditingLineup(JSON.parse(JSON.stringify(sourceLineup)));
     setShowLineupEditor(true);
  };

  const updateEditingSlot = (order: number, field: keyof LineupSlot, value: any) => {
    setEditingLineup(prev => prev.map(slot => slot.order === order ? { ...slot, [field]: value } : slot));
  };

  const saveLineupChanges = () => {
    if (!currentGame || !onUpdateGame) {
      alert("자유 기록 모드에서는 라인업 영구 저장이 지원되지 않습니다.");
      setShowLineupEditor(false);
      return;
    }

    // 1. Update the ScheduleEvent
    onUpdateGame({
      ...currentGame,
      lineup: editingLineup
    });

    // 2. Update the active batters state for scoring
    const newActiveLineup: ActiveLineup = {};
    editingLineup.forEach(slot => {
      if (slot.playerId) newActiveLineup[slot.order] = slot.playerId;
    });
    setCurrentBatters(newActiveLineup);

    setShowLineupEditor(false);
  };


  const handleFinishClick = () => {
    // Use calculated total for final check
    setAwayScoreInput(currentAwayScore);
    setShowEndGameModal(true);
  };

  const confirmFinishGame = () => {
    if (currentGame && onFinishGame) {
      // Use currentAwayScore (sum of innings) unless user overrides in modal
      onFinishGame(currentGame.id, currentHomeScore, awayScoreInput);
      setShowEndGameModal(false);
    }
  };

  const updateAwayInningScore = (inningIndex: number, score: number) => {
    if (!currentGame || !onUpdateGame) return;
    
    const newScores = [...(currentGame.awayInningScores || [])];
    // Ensure array is big enough
    while(newScores.length <= inningIndex) newScores.push(0);
    
    newScores[inningIndex] = score;
    
    onUpdateGame({
      ...currentGame,
      awayInningScores: newScores,
      awayScore: newScores.reduce((a, b) => a + b, 0) // Update total away score immediately
    });
  };

  // Statistics Calculation Logic
  const calculateStats = (filterFn: (r: GameRecord) => boolean) => {
    // Filter global records by current game context first
    const contextRecords = records.filter(r => currentGame ? r.scheduleId === currentGame.id : !r.scheduleId);
    const targetRecords = contextRecords.filter(filterFn);
    
    let ab = 0; // At Bats
    let h = 0;  // Hits
    let r = 0;  // Runs
    let rbi = 0; // RBIs

    targetRecords.forEach(rec => {
      if (!rec.outcome) return;

      // AB: Outcome is NOT BB, IBB, HBP, SF
      const nonAB = ['BB', 'IBB', 'HBP', 'SF'];
      if (!nonAB.includes(rec.outcome)) {
        ab++;
      }

      // Hits
      if (['H', '2B', '3B', 'HR'].includes(rec.outcome)) {
        h++;
      }

      // Runs & RBIs
      if (rec.isRun) r++;
      if (rec.rbi) rbi += rec.rbi;
    });

    return { ab, h, r, rbi };
  };

  // Stats by Batting Order Slot (Row)
  const getSlotStats = (order: number) => {
    return calculateStats(rec => rec.battingOrder === order);
  };

  // Stats by Player (Summary Table)
  const playerStats = useMemo(() => {
    const statsMap: Record<string, { name: string, number: string, ab: number, h: number, r: number, rbi: number }> = {};

    // Contextual filtering
    const contextRecords = records.filter(r => currentGame ? r.scheduleId === currentGame.id : !r.scheduleId);

    contextRecords.forEach(rec => {
      if (!rec.playerId) return;
      
      if (!statsMap[rec.playerId]) {
        const p = players.find(p => p.id === rec.playerId);
        statsMap[rec.playerId] = {
          name: p?.name || 'Unknown',
          number: p?.number || '?',
          ab: 0, h: 0, r: 0, rbi: 0
        };
      }

      // Update stats
      const s = statsMap[rec.playerId];
      if (!rec.outcome) return;
      
      // AB
      if (!['BB', 'IBB', 'HBP', 'SF'].includes(rec.outcome)) {
        s.ab++;
      }
      // Hits
      if (['H', '2B', '3B', 'HR'].includes(rec.outcome)) {
        s.h++;
      }
      // Run/RBI
      if (rec.isRun) s.r++;
      if (rec.rbi) s.rbi += rec.rbi;
    });

    return Object.values(statsMap).sort((a, b) => b.ab - a.ab); // Sort by AB descending
  }, [records, players, currentGame]);

  // Get players not in current active lineup for sub modal
  const activePlayerIds = Object.values(currentBatters);
  const benchPlayers = players.filter(p => !activePlayerIds.includes(p.id));
  
  // For Editor: Players available to pick
  const editorAssignedIds = editingLineup.map(s => s.playerId).filter(Boolean);
  const editorBenchPlayers = players.filter(p => !editorAssignedIds.includes(p.id));

  return (
    <div className="h-full flex flex-col bg-white">
      
      {/* Match Info & Scoreboard */}
      {currentGame && (
        <div className="bg-slate-900 text-white p-3 border-b border-slate-700 shrink-0">
           <div className="flex justify-between items-start mb-3">
             <div className="flex flex-col">
               <div className="flex items-center gap-2">
                 <Tv className="text-red-500 animate-pulse" size={18}/>
                 <h2 className="text-xl font-black text-white tracking-tight">
                    {currentGame.opponent} <span className="text-slate-400 text-sm font-normal">VS</span> 우리 팀
                 </h2>
               </div>
               <div className="flex items-center gap-3 text-xs text-slate-400 mt-1 ml-6">
                   <span className="flex items-center gap-1"><Calendar size={12}/> {currentGame.date}</span>
                   <span className="flex items-center gap-1"><MapPin size={12}/> {currentGame.location}</span>
               </div>
             </div>
             <div className="flex items-center gap-2">
                {/* Lineup Edit Button */}
                <button 
                  onClick={openLineupEditor}
                  className="px-3 py-1.5 bg-indigo-800 hover:bg-indigo-700 text-indigo-100 rounded text-xs font-bold transition-colors border border-indigo-700 flex items-center gap-1"
                >
                  <ClipboardList size={14} />
                  라인업 수정
                </button>

                <button 
                  onClick={() => onSuspendGame && onSuspendGame(currentGame.id)}
                  className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded text-xs font-bold transition-colors border border-slate-600"
                >
                  기록 중단
                </button>
                <button 
                  onClick={handleFinishClick}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-xs font-bold transition-colors border border-indigo-500 shadow-lg shadow-indigo-900/20"
                >
                  경기 종료
                </button>
             </div>
           </div>

           {/* Scoreboard Table */}
           <div className="w-full overflow-x-auto">
             <table className="w-full border-collapse text-sm font-mono">
               <thead>
                 <tr className="text-slate-400 border-b border-slate-700">
                   <th className="py-1 px-2 text-left w-24">TEAM</th>
                   {Array.from({length: INNINGS_COUNT}).map((_, i) => (
                     <th key={i} className="py-1 px-1 text-center w-10">{i+1}</th>
                   ))}
                   <th className="py-1 px-2 text-center text-white font-bold w-12 bg-slate-800">R</th>
                   <th className="py-1 px-2 text-center w-12">H</th>
                   <th className="py-1 px-2 text-center w-12">B</th>
                 </tr>
               </thead>
               <tbody>
                 {/* Away Row */}
                 <tr className="border-b border-slate-800">
                   <td className="py-2 px-2 font-bold text-slate-200 truncate">{currentGame.opponent}</td>
                   {Array.from({length: INNINGS_COUNT}).map((_, i) => (
                     <td key={i} className="p-0.5">
                       <input 
                          type="number" 
                          min="0"
                          className="w-full h-7 bg-slate-800 text-center text-yellow-400 font-bold rounded border border-slate-700 focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 outline-none"
                          value={awayInningRuns[i] === 0 ? '' : awayInningRuns[i]} 
                          placeholder="0"
                          onChange={(e) => updateAwayInningScore(i, Number(e.target.value))}
                       />
                     </td>
                   ))}
                   <td className="py-2 px-2 text-center font-black text-2xl text-yellow-400 bg-slate-800/50">{currentAwayScore}</td>
                   <td className="py-2 px-2 text-center text-slate-400">-</td>
                   <td className="py-2 px-2 text-center text-slate-400">-</td>
                 </tr>
                 {/* Home Row */}
                 <tr>
                   <td className="py-2 px-2 font-bold text-white">우리 팀</td>
                   {homeInningRuns.map((score, i) => (
                     <td key={i} className="py-2 px-1 text-center text-white font-bold">
                       {score === 0 ? <span className="text-slate-600">0</span> : score}
                     </td>
                   ))}
                   <td className="py-2 px-2 text-center font-black text-2xl text-white bg-slate-800/50">{currentHomeScore}</td>
                   <td className="py-2 px-2 text-center text-white font-bold">{currentHomeHits}</td>
                   <td className="py-2 px-2 text-center text-white">-</td>
                 </tr>
               </tbody>
             </table>
           </div>
        </div>
      )}

      {!currentGame && (
        <div className="bg-slate-50 p-3 border-b flex justify-between items-center">
          <div className="flex items-center gap-2">
             <span className="bg-slate-500 text-white text-xs font-bold px-2 py-1 rounded">FREE</span>
             <h2 className="font-bold text-slate-700">자유 기록 모드</h2>
          </div>
          <div className="text-xs text-slate-400">
            * 일정 관리에서 경기를 생성하면 스코어보드가 활성화됩니다.
          </div>
        </div>
      )}

      {/* Main Scorecard Container */}
      <div className="flex-1 overflow-auto">
        <div className="w-full min-w-[1000px]">
          <table className="border-collapse w-full table-fixed">
            <thead className="bg-slate-800 text-white sticky top-0 z-20">
              <tr>
                <th className="p-2 border-r border-slate-600 w-[4%] text-center">순</th>
                <th className="p-2 border-r border-slate-600 w-[20%] text-left">타자 정보</th>
                {Array.from({ length: INNINGS_COUNT }, (_, i) => (
                  <th key={i} className="p-2 border-r border-slate-600 w-[6%] text-center text-sm">{i + 1}회</th>
                ))}
                {/* Summary Columns Headers */}
                <th className="p-2 border-r border-slate-600 w-[5.5%] text-center bg-slate-700">타수</th>
                <th className="p-2 border-r border-slate-600 w-[5.5%] text-center bg-slate-700">안타</th>
                <th className="p-2 border-r border-slate-600 w-[5.5%] text-center bg-slate-700">득점</th>
                <th className="p-2 border-slate-600 w-[5.5%] text-center bg-slate-700">타점</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {/* We iterate through currentBatters keys (Order 1-9+) */}
              {/* But we need a stable list of orders. Use editingLineup or initialLineup to get max order */}
              {(currentGame?.lineup || initialLineup).map((slot) => {
                const currentPlayerId = currentBatters[slot.order];
                const currentPlayer = players.find(p => p.id === currentPlayerId);
                const slotStats = getSlotStats(slot.order);
                
                return (
                  <tr key={slot.order} className="hover:bg-slate-50">
                    <td className="p-2 text-center font-bold bg-slate-100 border-r">{slot.order}</td>
                    
                    {/* Player Info Cell */}
                    <td className="p-2 border-r cursor-pointer hover:bg-indigo-50 transition-colors group relative overflow-hidden"
                        onClick={() => setSubModalOrder(slot.order)}
                    >
                      <div className="flex justify-between items-center">
                        <div className="truncate">
                          {currentPlayer ? (
                            <>
                              <span className="font-bold text-slate-800 truncate">{currentPlayer.name}</span>
                              <span className="text-xs text-slate-500 ml-2">#{currentPlayer.number}</span>
                            </>
                          ) : (
                            <span className="text-slate-400 italic">공석</span>
                          )}
                        </div>
                        <UserCog size={14} className="opacity-0 group-hover:opacity-100 text-indigo-600 shrink-0"/>
                      </div>
                      {currentPlayer && (
                        <div className="text-xs text-slate-500 truncate">
                          {currentPlayer.batHand}타 {currentPlayer.throwHand}투 | {slot.position}
                        </div>
                      )}
                    </td>

                    {/* Inning Cells */}
                    {Array.from({ length: INNINGS_COUNT }, (_, i) => {
                      const inning = i + 1;
                      const record = getRecord(inning, slot.order);
                      const outcomeDef = record ? OUTCOMES.find(o => o.code === record.outcome) : null;

                      return (
                        <td 
                          key={inning} 
                          className="p-1 border-r text-center relative h-14"
                        >
                          <button
                            onClick={() => openOutcomeModal(inning, slot.order)}
                            className={`w-full h-full rounded flex flex-col items-center justify-center text-sm font-bold transition-all ${outcomeDef ? outcomeDef.color + ' border' : 'hover:bg-slate-100'}`}
                          >
                             {outcomeDef ? (
                               <>
                                 <span>{outcomeDef.label}</span>
                                 <div className="flex gap-0.5 mt-0.5 justify-center">
                                  {record?.isRun && <div className="w-1.5 h-1.5 rounded-full bg-blue-500" title="득점"></div>}
                                  {record?.rbi ? <span className="text-[9px] leading-none text-slate-700 font-normal">+{record.rbi}</span> : null}
                                 </div>
                               </>
                             ) : ''}
                          </button>
                        </td>
                      );
                    })}

                    {/* Row Stats */}
                    <td className="p-2 border-r text-center font-mono bg-slate-50 text-slate-700">{slotStats.ab}</td>
                    <td className="p-2 border-r text-center font-mono bg-slate-50 font-bold text-indigo-700">{slotStats.h}</td>
                    <td className="p-2 border-r text-center font-mono bg-slate-50 text-slate-700">{slotStats.r}</td>
                    <td className="p-2 text-center font-mono bg-slate-50 text-slate-700">{slotStats.rbi}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Player Performance Summary Section */}
      <div className="h-48 bg-slate-50 border-t border-slate-300 flex flex-col shrink-0">
        <div className="px-4 py-2 bg-slate-200 font-bold text-slate-700 text-sm flex items-center gap-2">
          <CheckSquare size={16}/> 선수별 경기 기록 요약
        </div>
        <div className="flex-1 overflow-auto p-4">
           {playerStats.length === 0 ? (
             <div className="text-center text-slate-400 text-sm py-4">기록된 데이터가 없습니다.</div>
           ) : (
             <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
                {playerStats.map(stat => (
                  <div key={stat.name + stat.number} className="bg-white p-2 rounded border shadow-sm text-sm flex flex-col">
                    <div className="font-bold text-slate-800 border-b pb-1 mb-1 flex justify-between">
                      <span>{stat.name}</span>
                      <span className="text-slate-400">#{stat.number}</span>
                    </div>
                    <div className="grid grid-cols-4 gap-1 text-center text-xs text-slate-600">
                      <div>
                        <div className="text-slate-400">타수</div>
                        <div className="font-bold">{stat.ab}</div>
                      </div>
                      <div>
                        <div className="text-slate-400">안타</div>
                        <div className="font-bold text-red-600">{stat.h}</div>
                      </div>
                      <div>
                        <div className="text-slate-400">득점</div>
                        <div className="font-bold">{stat.r}</div>
                      </div>
                      <div>
                        <div className="text-slate-400">타점</div>
                        <div className="font-bold">{stat.rbi}</div>
                      </div>
                    </div>
                  </div>
                ))}
             </div>
           )}
        </div>
      </div>

      {/* Outcome Popup Modal */}
      {selectedCell && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setSelectedCell(null)}>
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in duration-200" onClick={e => e.stopPropagation()}>
            <div className="bg-slate-800 text-white p-4 flex justify-between items-center">
              <h3 className="font-bold text-lg">
                {selectedCell.inning}회 {selectedCell.order}번 타자 결과
              </h3>
              <button onClick={() => setSelectedCell(null)} className="text-slate-400 hover:text-white">닫기</button>
            </div>
            
            <div className="p-4 space-y-4">
              {/* Extra Stats Controls */}
              <div className="flex items-center gap-6 p-3 bg-slate-50 rounded-lg border">
                 <label className="flex items-center gap-2 cursor-pointer select-none">
                    <div 
                      className={`w-5 h-5 border rounded flex items-center justify-center ${popupIsRun ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-slate-300'}`}
                      onClick={() => setPopupIsRun(!popupIsRun)}
                    >
                      {popupIsRun && <CheckSquare size={14}/>}
                    </div>
                    <span className="font-bold text-slate-700">득점 (Run)</span>
                 </label>

                 <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-700">타점 (RBI):</span>
                    <div className="flex border rounded overflow-hidden">
                      {[0, 1, 2, 3, 4].map(val => (
                        <button
                          key={val}
                          onClick={() => setPopupRbi(val)}
                          className={`px-3 py-1 text-sm font-medium hover:bg-indigo-50 ${popupRbi === val ? 'bg-indigo-600 text-white' : 'bg-white text-slate-600 border-l first:border-l-0'}`}
                        >
                          {val}
                        </button>
                      ))}
                    </div>
                 </div>
              </div>

              {/* Outcome Buttons */}
              <div className="grid grid-cols-4 gap-3">
                {OUTCOMES.map(outcome => (
                  <button
                    key={outcome.code}
                    onClick={() => handleRecord(outcome.code)}
                    className={`p-3 rounded-lg border text-sm font-bold transition-transform active:scale-95 shadow-sm ${outcome.color} hover:brightness-95`}
                  >
                    {outcome.label}
                  </button>
                ))}
              </div>

              <button 
                onClick={() => handleRecord(null)}
                className="w-full p-2 text-slate-400 hover:text-red-500 text-sm border border-dashed border-slate-300 rounded hover:bg-red-50 transition-colors"
              >
                기록 삭제
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Substitution Modal (Quick Sub) */}
      {subModalOrder !== null && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setSubModalOrder(null)}>
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="bg-indigo-900 text-white p-4">
              <h3 className="font-bold">선수 교체 ({subModalOrder}번 타순)</h3>
            </div>
            <div className="p-4 max-h-[60vh] overflow-y-auto">
              {benchPlayers.length === 0 ? (
                <p className="text-center text-slate-500 py-4">교체 가능한 대기 선수가 없습니다.</p>
              ) : (
                <div className="space-y-2">
                   {benchPlayers.map(player => (
                     <button
                        key={player.id}
                        onClick={() => handleSub(subModalOrder, player.id)}
                        className="w-full text-left p-3 rounded border hover:bg-indigo-50 hover:border-indigo-300 flex justify-between items-center transition-colors"
                     >
                       <span className="font-bold">{player.name}</span>
                       <span className="text-sm text-slate-500">#{player.number} ({player.mainPosition})</span>
                     </button>
                   ))}
                </div>
              )}
            </div>
            <div className="p-3 border-t bg-slate-50 text-right">
              <button onClick={() => setSubModalOrder(null)} className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded transition-colors">취소</button>
            </div>
          </div>
        </div>
      )}

      {/* Simplified Lineup Editor Modal */}
      {showLineupEditor && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowLineupEditor(false)}>
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full flex flex-col max-h-[85vh]" onClick={e => e.stopPropagation()}>
             <div className="p-4 bg-indigo-900 text-white flex justify-between items-center shrink-0">
               <h3 className="font-bold text-lg flex items-center gap-2">
                 <ClipboardList size={20}/> 라인업 수정 (현재 경기 전용)
               </h3>
               <button onClick={() => setShowLineupEditor(false)} className="text-indigo-200 hover:text-white">닫기</button>
             </div>
             
             <div className="flex-1 overflow-y-auto p-4">
               <div className="space-y-2">
                 {editingLineup.map(slot => (
                   <div key={slot.order} className="flex items-center gap-2 p-2 border rounded bg-slate-50">
                      <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-600 text-sm shrink-0">
                        {slot.order}
                      </div>
                      
                      {/* Position */}
                      <select 
                        value={slot.position || ''} 
                        onChange={e => updateEditingSlot(slot.order, 'position', e.target.value as PositionCode || null)}
                        className="w-24 p-2 border rounded text-sm"
                      >
                         <option value="">Pos</option>
                         {POSITIONS.map(p => <option key={p.code} value={p.code}>{p.code}</option>)}
                      </select>
                      
                      {/* Player */}
                      <select
                        value={slot.playerId || ''}
                        onChange={e => updateEditingSlot(slot.order, 'playerId', e.target.value || null)}
                        className="flex-1 p-2 border rounded text-sm font-bold text-slate-800"
                      >
                        <option value="">선수 선택</option>
                        <optgroup label="현재 선택됨">
                           {slot.playerId && (
                             <option value={slot.playerId}>
                               {players.find(p => p.id === slot.playerId)?.name} (#{players.find(p => p.id === slot.playerId)?.number})
                             </option>
                           )}
                        </optgroup>
                        <optgroup label="대기 명단">
                           {editorBenchPlayers.map(p => (
                             <option key={p.id} value={p.id}>
                               {p.name} (#{p.number}) - {p.mainPosition}
                             </option>
                           ))}
                        </optgroup>
                      </select>
                   </div>
                 ))}
               </div>
             </div>

             <div className="p-4 border-t bg-slate-50 flex justify-end gap-2 shrink-0">
                <button onClick={() => setShowLineupEditor(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded">취소</button>
                <button onClick={saveLineupChanges} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded font-bold shadow-sm">
                   저장 및 적용
                </button>
             </div>
          </div>
        </div>
      )}

      {/* End Game Confirmation Modal */}
      {showEndGameModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowEndGameModal(false)}>
          <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full p-6" onClick={e => e.stopPropagation()}>
            <h3 className="text-xl font-bold text-slate-900 mb-4">경기 종료</h3>
            <p className="text-slate-600 mb-4">
              경기를 종료하고 현재 기록을 저장하시겠습니까?
            </p>
            
            <div className="bg-slate-100 p-4 rounded-lg mb-4">
               <div className="flex justify-between items-center mb-2">
                  <span className="font-bold text-indigo-700">우리 팀 (득점)</span>
                  <span className="font-bold text-2xl text-indigo-900">{currentHomeScore}</span>
               </div>
               <div className="flex justify-between items-center">
                  <span className="font-bold text-slate-700">상대 팀 (실점)</span>
                  <input 
                    type="number" 
                    className="w-16 p-1 text-right font-bold text-xl border rounded" 
                    value={awayScoreInput}
                    onChange={e => setAwayScoreInput(Number(e.target.value))}
                    min="0"
                  />
               </div>
            </div>

            <div className="flex gap-2 justify-end">
               <button 
                 onClick={() => setShowEndGameModal(false)}
                 className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded transition-colors"
               >
                 취소
               </button>
               <button 
                 onClick={confirmFinishGame}
                 className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded font-bold transition-colors"
               >
                 종료 및 저장
               </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GameRecorder;
