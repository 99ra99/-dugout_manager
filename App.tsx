
import React, { useState, useEffect } from 'react';
import { Users, ClipboardList, FileText, Trophy, Settings, Database, Save, Download, AlertCircle, X, CheckCircle, Calendar } from 'lucide-react';
import RosterManager from './components/RosterManager';
import LineupBuilder from './components/LineupBuilder';
import GameRecorder from './components/GameRecorder';
import ScheduleManager from './components/ScheduleManager';
import { Player, LineupSlot, GameRecord, GoogleConfig, ScheduleEvent } from './types';
import { SERVICE_ACCOUNT_CONFIG } from './constants';

type Tab = 'roster' | 'lineup' | 'game' | 'schedule';

// Extend window for Google APIs & jsrsasign
declare global {
  interface Window {
    gapi: any;
    google: any;
    KJUR: any; // jsrsasign
  }
}

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('roster');
  const [showSettings, setShowSettings] = useState(false);
  
  // -- Global State --
  const [players, setPlayers] = useState<Player[]>(() => {
    const saved = localStorage.getItem('baseball_players');
    return saved ? JSON.parse(saved) : [];
  });

  const [lineup, setLineup] = useState<LineupSlot[]>(() => {
    const saved = localStorage.getItem('baseball_lineup');
    if (saved) return JSON.parse(saved);
    return Array.from({ length: 9 }, (_, i) => ({
      order: i + 1,
      playerId: null,
      position: null
    }));
  });

  const [records, setRecords] = useState<GameRecord[]>(() => {
    const saved = localStorage.getItem('baseball_records');
    return saved ? JSON.parse(saved) : [];
  });

  const [schedules, setSchedules] = useState<ScheduleEvent[]>(() => {
    const saved = localStorage.getItem('baseball_schedules');
    return saved ? JSON.parse(saved) : [];
  });

  // Context for Game Recorder (which game are we playing?)
  const [currentMatchId, setCurrentMatchId] = useState<string | null>(null);

  // -- Google Sheets Config State --
  const [googleConfig, setGoogleConfig] = useState<GoogleConfig>(() => {
    const saved = localStorage.getItem('baseball_google_config');
    return saved ? JSON.parse(saved) : {
      apiKey: '',
      clientId: '',
      spreadsheetId: '1HnHbrsqzq29YgzfotMM1xKPG1Jp08o4qkx8V_T0fGJo' // Default from prompt
    };
  });

  const [isGapiLoaded, setIsGapiLoaded] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authMode, setAuthMode] = useState<'service_account' | 'oauth'>('service_account');
  const [syncStatus, setSyncStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

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

  useEffect(() => {
    localStorage.setItem('baseball_schedules', JSON.stringify(schedules));
  }, [schedules]);

  useEffect(() => {
    localStorage.setItem('baseball_google_config', JSON.stringify(googleConfig));
  }, [googleConfig]);

  // -- Google API Init --
  useEffect(() => {
    const script1 = document.createElement('script');
    script1.src = "https://apis.google.com/js/api.js";
    script1.onload = () => setIsGapiLoaded(true);
    document.body.appendChild(script1);
  }, []);

  useEffect(() => {
    if (isGapiLoaded) {
      initializeGoogleClient();
    }
  }, [isGapiLoaded]);

  const initializeGoogleClient = async () => {
    try {
      await new Promise<void>((resolve) => {
        window.gapi.load('client', resolve);
      });
      
      await window.gapi.client.init({
        discoveryDocs: ['https://sheets.googleapis.com/$discovery/rest?version=v4'],
      });

      // Try Service Account Auth immediately
      authenticateServiceAccount();

    } catch (error) {
      console.error("Error initializing Google Client", error);
    }
  };

  // Service Account Authentication Flow (JWT)
  const authenticateServiceAccount = async () => {
    try {
      if (!window.KJUR) {
        console.error("jsrsasign library not loaded yet. Waiting...");
        // Just return, user can try clicking button again.
        return;
      }

      const header = { alg: "RS256", typ: "JWT" };
      const now = Math.floor(Date.now() / 1000);
      const claim = {
        iss: SERVICE_ACCOUNT_CONFIG.client_email,
        scope: "https://www.googleapis.com/auth/spreadsheets",
        aud: "https://oauth2.googleapis.com/token",
        exp: now + 3600,
        iat: now,
      };

      const sHeader = JSON.stringify(header);
      const sClaim = JSON.stringify(claim);
      
      // Sign JWT
      const sJWS = window.KJUR.jws.JWS.sign("RS256", sHeader, sClaim, SERVICE_ACCOUNT_CONFIG.private_key);

      // Exchange for Access Token
      const response = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${sJWS}`,
      });

      const data = await response.json();
      if (data.access_token) {
        // Set token for GAPI client
        window.gapi.client.setToken({ access_token: data.access_token });
        setIsAuthenticated(true);
        setAuthMode('service_account');
        console.log("Authenticated via Service Account");
      } else {
        console.error("Failed to get access token", data);
        alert("인증 실패: " + JSON.stringify(data));
      }

    } catch (error) {
      console.error("Service Account Auth Error:", error);
    }
  };

  // Fallback: manual re-auth
  const handleConnect = () => {
    authenticateServiceAccount();
  };

  // -- Helper for Errors --
  const getErrorMessage = (error: any) => {
    if (error?.result?.error?.message) return error.result.error.message;
    if (error?.message) return error.message;
    return JSON.stringify(error);
  };

  // -- Player Sheet Operations --
  const mapPlayerToRow = (p: Player) => [
    p.id,
    p.name,
    p.number,
    p.batHand,
    p.throwHand,
    p.mainPosition,
    p.subPosition1 || '',
    p.subPosition2 || '',
    p.tags?.join(',') || '',
    p.height || '',
    p.birthYear || '',
    p.uniformSize || '',
    p.waistSize || '',
    p.uniformInitial || '' // Column 13 (N)
  ];

  const mapRowToPlayer = (row: any[]): Player => {
    return {
      id: row[0],
      name: row[1],
      number: row[2],
      batHand: row[3] as any,
      throwHand: row[4] as any,
      mainPosition: row[5] as any,
      subPosition1: row[6] || null,
      subPosition2: row[7] || null,
      // Safe split for tags
      tags: row[8] ? String(row[8]).split(',') : [],
      height: row[9] ? Number(row[9]) : undefined,
      birthYear: row[10] ? Number(row[10]) : undefined,
      uniformSize: row[11] || undefined,
      waistSize: row[12] ? Number(row[12]) : undefined,
      uniformInitial: row[13] || undefined,
    };
  };

  const saveToSheet = async () => {
    if (!isAuthenticated) {
      await authenticateServiceAccount();
    }
    setSyncStatus('loading');
    try {
      const header = ['ID', '이름', '등번호', '타격', '투구', '주포지션', '부포지션1', '부포지션2', '태그', '신장', '출생년도', '유니폼', '허리', '이니셜'];
      const rows = [header, ...players.map(mapPlayerToRow)];

      // 1. Clear Sheet (Use generic range to default to first sheet)
      await window.gapi.client.sheets.spreadsheets.values.clear({
        spreadsheetId: googleConfig.spreadsheetId,
        range: 'A1:Z1000' 
      });

      // 2. Write Data
      await window.gapi.client.sheets.spreadsheets.values.update({
        spreadsheetId: googleConfig.spreadsheetId,
        range: 'A1',
        valueInputOption: 'RAW',
        resource: { values: rows }
      });
      
      setSyncStatus('success');
      alert('구글 시트에 성공적으로 저장되었습니다.');
    } catch (error) {
      console.error(error);
      setSyncStatus('error');
      alert(`저장 중 오류가 발생했습니다:\n${getErrorMessage(error)}`);
    } finally {
      setTimeout(() => setSyncStatus('idle'), 2000);
    }
  };

  const loadFromSheet = async () => {
    if (!isAuthenticated) {
      await authenticateServiceAccount();
    }
    setSyncStatus('loading');
    try {
      // Use generic range 'A2:N1000' to target the first active sheet automatically
      const response = await window.gapi.client.sheets.spreadsheets.values.get({
        spreadsheetId: googleConfig.spreadsheetId,
        range: 'A2:N1000', // Skip Header
      });

      const rows = response.result.values;
      if (rows && rows.length > 0) {
        const newPlayers = rows.map(mapRowToPlayer);
        setPlayers(newPlayers);
        alert(`${newPlayers.length}명의 선수 정보를 불러왔습니다.`);
        setSyncStatus('success');
      } else {
        alert('시트에 데이터가 없습니다.');
      }
    } catch (error) {
      console.error(error);
      setSyncStatus('error');
      alert(`불러오기 중 오류가 발생했습니다:\n${getErrorMessage(error)}`);
    } finally {
      setTimeout(() => setSyncStatus('idle'), 2000);
    }
  };

  // -- Schedule Sheet Operations --
  const mapScheduleToRow = (s: ScheduleEvent) => [
    s.id,
    s.date,
    s.time,
    s.type,
    s.opponent || '',
    s.location,
    s.notes || '',
    s.status || 'scheduled',
    s.homeScore !== undefined ? s.homeScore : '',
    s.awayScore !== undefined ? s.awayScore : '',
    // Column K (Index 10): Inning Scores
    s.awayInningScores ? JSON.stringify(s.awayInningScores) : '',
    // Column L (Index 11): Match Specific Lineup
    s.lineup ? JSON.stringify(s.lineup) : ''
  ];

  const mapRowToSchedule = (row: any[]): ScheduleEvent => {
    return {
      id: row[0],
      date: row[1],
      time: row[2],
      type: row[3] as any,
      opponent: row[4] || undefined,
      location: row[5],
      notes: row[6] || undefined,
      status: row[7] as any || 'scheduled',
      homeScore: row[8] ? Number(row[8]) : undefined,
      awayScore: row[9] ? Number(row[9]) : undefined,
      awayInningScores: row[10] ? JSON.parse(row[10]) : undefined,
      lineup: row[11] ? JSON.parse(row[11]) : undefined
    };
  };

  const saveSchedulesToSheet = async () => {
    if (!isAuthenticated) await authenticateServiceAccount();
    setSyncStatus('loading');
    let rangeName = 'Schedules'; // Target a sheet named 'Schedules'
    
    try {
      const header = ['ID', '날짜', '시간', '유형', '상대팀', '장소', '메모', '상태', '우리팀점수', '상대팀점수', '이닝별실점', '라인업데이터'];
      const rows = [header, ...schedules.map(mapScheduleToRow)];
      
      // Check if we can write to 'Schedules!A1'
      await window.gapi.client.sheets.spreadsheets.values.update({
        spreadsheetId: googleConfig.spreadsheetId,
        range: `${rangeName}!A1`,
        valueInputOption: 'RAW',
        resource: { values: rows }
      });
      
      setSyncStatus('success');
      alert('일정이 구글 시트(Schedules 탭)에 저장되었습니다.');
    } catch (error: any) {
      console.error(error);
      setSyncStatus('error');
      const msg = getErrorMessage(error);
      if (msg.includes('Unable to parse range') || msg.includes('range')) {
         alert(`저장 실패: 스프레드시트에 '${rangeName}'라는 이름의 시트(탭)가 있는지 확인해주세요.\n\n오류 상세: ${msg}`);
      } else {
         alert(`저장 중 오류가 발생했습니다:\n${msg}`);
      }
    } finally {
      setTimeout(() => setSyncStatus('idle'), 2000);
    }
  };

  const loadSchedulesFromSheet = async () => {
    if (!isAuthenticated) await authenticateServiceAccount();
    setSyncStatus('loading');
    try {
      const rangeName = 'Schedules';
      const response = await window.gapi.client.sheets.spreadsheets.values.get({
        spreadsheetId: googleConfig.spreadsheetId,
        range: `${rangeName}!A2:L1000`, // Skip Header, Read up to Column L
      });

      const rows = response.result.values;
      if (rows && rows.length > 0) {
        const newSchedules = rows.map(mapRowToSchedule);
        setSchedules(newSchedules);
        alert(`${newSchedules.length}개의 일정을 불러왔습니다.`);
        setSyncStatus('success');
      } else {
        alert("'Schedules' 시트에 데이터가 없거나 읽을 수 없습니다.");
      }
    } catch (error) {
      console.error(error);
      setSyncStatus('error');
      alert(`불러오기 중 오류가 발생했습니다. 'Schedules' 시트가 존재하는지 확인해주세요.\n\n${getErrorMessage(error)}`);
    } finally {
      setTimeout(() => setSyncStatus('idle'), 2000);
    }
  };


  // -- Handlers --
  const addPlayer = (player: Player) => {
    setPlayers(prev => [...prev, player]);
  };

  const updatePlayer = (updated: Player) => {
    setPlayers(prev => prev.map(p => p.id === updated.id ? updated : p));
  };

  const deletePlayer = (id: string) => {
    setPlayers(prev => prev.filter(p => p.id !== id));
    setLineup(prev => prev.map(slot => slot.playerId === id ? { ...slot, playerId: null, position: null } : slot));
  };

  // Schedule Handlers
  const addSchedule = (event: ScheduleEvent) => {
    setSchedules(prev => [...prev, event]);
  };
  const updateSchedule = (event: ScheduleEvent) => {
    setSchedules(prev => prev.map(s => s.id === event.id ? event : s));
  };
  const deleteSchedule = (id: string) => {
    // Robust deletion: compare as strings to handle legacy number IDs
    const strId = String(id);
    setSchedules(prev => prev.filter(s => String(s.id) !== strId));
    
    // Also delete associated Game Records
    setRecords(prev => prev.filter(r => String(r.scheduleId) !== strId));

    // If we deleted the active match, clear the active match ID
    if (currentMatchId && String(currentMatchId) === strId) {
      setCurrentMatchId(null);
    }
  };

  // Linkage Handler (Enhanced for Match-Specific Lineup)
  const handleEnterGame = (scheduleId: string) => {
    // Find the schedule
    const targetSchedule = schedules.find(s => s.id === scheduleId);
    
    if (targetSchedule) {
      // 1. Check if it has a lineup. If NOT, copy the Master Lineup.
      if (!targetSchedule.lineup || targetSchedule.lineup.length === 0) {
        const lineupCopy = JSON.parse(JSON.stringify(lineup)); // Deep copy
        const updatedSchedule = { ...targetSchedule, lineup: lineupCopy };
        
        // Update local state immediately so GameRecorder gets the new lineup
        setSchedules(prev => prev.map(s => s.id === scheduleId ? updatedSchedule : s));
        
        // If it was scheduled, mark as in-progress
        if (updatedSchedule.status === 'scheduled') {
           updatedSchedule.status = 'in-progress';
        }
      } else {
        // Just update status if needed
        if (targetSchedule.status === 'scheduled') {
          setSchedules(prev => prev.map(s => s.id === scheduleId ? { ...s, status: 'in-progress' } : s));
        }
      }
    }

    setCurrentMatchId(scheduleId);
    setActiveTab('game');
  };

  // Game End & Suspend Handlers
  const handleGameFinish = (scheduleId: string, homeScore: number, awayScore: number) => {
    setSchedules(prev => prev.map(s => 
      s.id === scheduleId 
      ? { ...s, status: 'completed', homeScore, awayScore } 
      : s
    ));
    setCurrentMatchId(null); // Switch to free mode
    alert('경기가 종료되었습니다. 결과가 일정에 반영되었습니다.');
  };

  const handleGameSuspend = (scheduleId: string) => {
    setSchedules(prev => prev.map(s => 
      s.id === scheduleId 
      ? { ...s, status: 'in-progress' } // Ensure it's marked in progress
      : s
    ));
    setCurrentMatchId(null); // Switch to free mode
    alert('기록이 중단되었습니다. 자유 기록 모드로 전환됩니다.\n(일정 관리에서 언제든지 재개할 수 있습니다.)');
  };

  return (
    <div className="flex flex-col h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-indigo-900 text-white p-4 shadow-md flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <Trophy className="w-6 h-6 text-yellow-400" />
          <h1 className="text-xl font-bold hidden md:block">야구 기록 및 라인업 관리</h1>
          <h1 className="text-xl font-bold md:hidden">Baseball Commander</h1>
        </div>
        <div className="flex items-center gap-2">
          <nav className="flex space-x-1 bg-indigo-800/50 p-1 rounded-lg mr-2">
            <button 
              onClick={() => setActiveTab('roster')}
              className={`px-3 py-1.5 rounded-md flex items-center gap-2 text-sm transition-colors ${activeTab === 'roster' ? 'bg-white text-indigo-900 font-bold shadow-sm' : 'text-indigo-200 hover:bg-indigo-800'}`}
            >
              <Users size={16} />
              <span className="hidden sm:inline">선수 관리</span>
            </button>
            <button 
              onClick={() => setActiveTab('schedule')}
              className={`px-3 py-1.5 rounded-md flex items-center gap-2 text-sm transition-colors ${activeTab === 'schedule' ? 'bg-white text-indigo-900 font-bold shadow-sm' : 'text-indigo-200 hover:bg-indigo-800'}`}
            >
              <Calendar size={16} />
              <span className="hidden sm:inline">일정 관리</span>
            </button>
            <button 
              onClick={() => setActiveTab('lineup')}
              className={`px-3 py-1.5 rounded-md flex items-center gap-2 text-sm transition-colors ${activeTab === 'lineup' ? 'bg-white text-indigo-900 font-bold shadow-sm' : 'text-indigo-200 hover:bg-indigo-800'}`}
            >
              <ClipboardList size={16} />
              <span className="hidden sm:inline">라인업</span>
            </button>
            <button 
              onClick={() => setActiveTab('game')}
              className={`px-3 py-1.5 rounded-md flex items-center gap-2 text-sm transition-colors ${activeTab === 'game' ? 'bg-white text-indigo-900 font-bold shadow-sm' : 'text-indigo-200 hover:bg-indigo-800'}`}
            >
              <FileText size={16} />
              <span className="hidden sm:inline">기록실</span>
            </button>
          </nav>
          <button 
            onClick={() => setShowSettings(true)}
            className={`p-2 rounded-full transition-colors ${isAuthenticated ? 'bg-green-600 hover:bg-green-700 text-white' : 'hover:bg-indigo-800'}`}
            title="설정 (구글 시트 연동)"
          >
            <Settings size={20} />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden relative">
        {activeTab === 'roster' && (
          <RosterManager 
            players={players} 
            onAdd={addPlayer} 
            onUpdate={updatePlayer} 
            onDelete={deletePlayer}
            googleAuth={{
              isAuthenticated,
              onConnect: handleConnect,
              onLoad: loadFromSheet,
              onSave: saveToSheet,
              status: syncStatus
            }}
          />
        )}
        {activeTab === 'schedule' && (
          <ScheduleManager 
            schedules={schedules}
            onAdd={addSchedule}
            onUpdate={updateSchedule}
            onDelete={deleteSchedule}
            onEnterGame={handleEnterGame}
            googleAuth={{
              isAuthenticated,
              onConnect: handleConnect,
              onLoad: loadSchedulesFromSheet,
              onSave: saveSchedulesToSheet,
              status: syncStatus
            }}
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
            currentGame={schedules.find(s => s.id === currentMatchId)}
            onFinishGame={handleGameFinish}
            onSuspendGame={handleGameSuspend}
            onUpdateGame={updateSchedule}
          />
        )}
      </main>

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowSettings(false)}>
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4 border-b pb-2">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <Settings className="w-5 h-5 text-slate-600" />
                설정
              </h2>
              <button onClick={() => setShowSettings(false)} className="text-slate-400 hover:text-slate-600"><X size={20}/></button>
            </div>
            
            <div className="space-y-4">
              <div className="bg-blue-50 p-3 rounded text-sm text-blue-800">
                 <p className="font-bold mb-1 flex items-center gap-1">
                   <Database size={14}/> 구글 시트 데이터베이스
                 </p>
                 <p>제공된 서비스 계정을 사용하여 자동으로 연결됩니다.</p>
              </div>

              {isAuthenticated ? (
                <div className="flex items-center gap-2 text-green-600 bg-green-50 p-2 rounded border border-green-200">
                  <CheckCircle size={18} />
                  <span className="font-bold text-sm">서비스 계정 연결됨</span>
                </div>
              ) : (
                <div className="text-red-500 text-sm">연결되지 않음. 페이지를 새로고침 하거나 재시도하세요.</div>
              )}

              <div className="text-xs text-slate-500">
                <p className="mb-1 font-bold">서비스 계정 이메일 (공유 필요):</p>
                <code className="block bg-slate-100 p-2 rounded break-all">
                  {SERVICE_ACCOUNT_CONFIG.client_email}
                </code>
                <p className="mt-1">※ 위 이메일을 스프레드시트의 '편집자'로 초대해야 저장 기능이 작동합니다.</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Spreadsheet ID</label>
                <input 
                  type="text" 
                  value={googleConfig.spreadsheetId}
                  onChange={(e) => setGoogleConfig({...googleConfig, spreadsheetId: e.target.value})}
                  className="w-full p-2 border rounded text-sm font-mono bg-slate-50"
                  placeholder="구글 시트 URL의 ID 부분"
                />
                <p className="text-xs text-slate-500 mt-1">https://docs.google.com/spreadsheets/d/<b>ID_HERE</b>/edit</p>
              </div>

              <div className="pt-4 flex justify-end">
                <button 
                  onClick={() => setShowSettings(false)}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded font-bold transition-colors"
                >
                  닫기
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
