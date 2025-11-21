
import React, { useState, useEffect, useMemo } from 'react';
import { GameRecord, LineupSlot, Player, PlayOutcome, ActiveLineup } from '../types';
import { OUTCOMES, INNINGS_COUNT } from '../constants';
import { ChevronDown, UserCog, CheckSquare, Square } from 'lucide-react';

interface Props {
  players: Player[];
  initialLineup: LineupSlot[];
  records: GameRecord[];
  setRecords: (r: GameRecord[]) => void;
}

const GameRecorder: React.FC<Props> = ({ players, initialLineup, records, setRecords }) => {
  // We need to track WHO is currently in each batting order slot.
  const [currentBatters, setCurrentBatters] = useState<ActiveLineup>({});
  
  // Modal State
  const [selectedCell, setSelectedCell] = useState<{inning: number, order: number} | null>(null);
  const [subModalOrder, setSubModalOrder] = useState<number | null>(null);

  // Outcome Modifiers State
  const [popupRbi, setPopupRbi] = useState<number>(0);
  const [popupIsRun, setPopupIsRun] = useState<boolean>(false);

  // Initialize active lineup from initial lineup prop if empty
  useEffect(() => {
    if (Object.keys(currentBatters).length === 0 && initialLineup.length > 0) {
      const init: ActiveLineup = {};
      initialLineup.forEach(slot => {
        if (slot.playerId) init[slot.order] = slot.playerId;
      });
      setCurrentBatters(init);
    }
  }, [initialLineup]);

  // Helper to find record
  const getRecord = (inning: number, order: number) => {
    return records.find(r => r.inning === inning && r.battingOrder === order);
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

    const existingIndex = records.findIndex(r => r.inning === inning && r.battingOrder === order);
    
    const newRecord: GameRecord = {
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

  const handleSub = (order: number, newPlayerId: string) => {
    setCurrentBatters(prev => ({
      ...prev,
      [order]: newPlayerId
    }));
    setSubModalOrder(null);
  };

  // Statistics Calculation Logic
  const calculateStats = (filterFn: (r: GameRecord) => boolean) => {
    const targetRecords = records.filter(filterFn);
    
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

    records.forEach(rec => {
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
  }, [records, players]);

  // Get players not in current active lineup for sub modal
  const activePlayerIds = Object.values(currentBatters);
  const benchPlayers = players.filter(p => !activePlayerIds.includes(p.id));

  return (
    <div className="h-full flex flex-col bg-white">
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
                {/* Summary Columns Headers - Approx 22% total */}
                <th className="p-2 border-r border-slate-600 w-[5.5%] text-center bg-slate-700">타수</th>
                <th className="p-2 border-r border-slate-600 w-[5.5%] text-center bg-slate-700">안타</th>
                <th className="p-2 border-r border-slate-600 w-[5.5%] text-center bg-slate-700">득점</th>
                <th className="p-2 border-slate-600 w-[5.5%] text-center bg-slate-700">타점</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {initialLineup.map((slot) => {
                const currentPlayerId = currentBatters[slot.order];
                const currentPlayer = players.find(p => p.id === currentPlayerId);
                const slotStats = getSlotStats(slot.order);
                
                return (
                  <tr key={slot.order} className="hover:bg-slate-50">
                    <td className="p-2 text-center font-bold bg-slate-100 border-r">{slot.order}</td>
                    
                    {/* Player Info Cell - Click to Substitute */}
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
                                 {/* Mini indicators for Run/RBI */}
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

      {/* Substitution Modal */}
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
    </div>
  );
};

export default GameRecorder;
