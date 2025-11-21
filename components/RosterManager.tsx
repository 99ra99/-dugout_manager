

import React, { useState, useMemo } from 'react';
import { Plus, Trash2, Edit2, Save, X, Check, Ruler, Shirt, Database, Upload, Download, Loader2, Search, LayoutGrid, List, Filter, ArrowUpDown, User, CaseSensitive } from 'lucide-react';
import { Player, Hand, PositionCode, GoogleSyncProps } from '../types';
import { POSITIONS, TEAM_TAGS } from '../constants';

interface Props {
  players: Player[];
  onAdd: (p: Player) => void;
  onUpdate: (p: Player) => void;
  onDelete: (id: string) => void;
  googleAuth?: GoogleSyncProps;
}

const RosterManager: React.FC<Props> = ({ players, onAdd, onUpdate, onDelete, googleAuth }) => {
  const [isEditing, setIsEditing] = useState<string | null>(null);
  
  // View & Filter State
  const [viewMode, setViewMode] = useState<'list' | 'card'>('list');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTeam, setFilterTeam] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'number' | 'name' | 'height' | 'birthYear'>('number');

  // Form State
  const [newName, setNewName] = useState('');
  const [newNumber, setNewNumber] = useState('');
  const [newBat, setNewBat] = useState<Hand>('우');
  const [newThrow, setNewThrow] = useState<Hand>('우');
  
  // Physical & Size State
  const [newHeight, setNewHeight] = useState('');
  const [newBirthYear, setNewBirthYear] = useState('');
  const [newUniformSize, setNewUniformSize] = useState('');
  const [newWaistSize, setNewWaistSize] = useState('');
  const [newUniformInitial, setNewUniformInitial] = useState('');

  // Positions State
  const [newMainPos, setNewMainPos] = useState<PositionCode>('P');
  const [newSubPos1, setNewSubPos1] = useState<PositionCode | ''>('');
  const [newSubPos2, setNewSubPos2] = useState<PositionCode | ''>('');

  // Tags State
  const [newTags, setNewTags] = useState<string[]>([]);

  const toggleNewTag = (tag: string) => {
    setNewTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
  };

  // Processed Players (Filter & Sort)
  const processedPlayers = useMemo(() => {
    let result = [...players];

    // 1. Filter by Tag
    if (filterTeam !== 'all') {
      result = result.filter(p => p.tags?.includes(filterTeam));
    }

    // 2. Filter by Search Term
    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      result = result.filter(p => 
        p.name.toLowerCase().includes(lower) || 
        p.number.includes(lower)
      );
    }

    // 3. Sort
    result.sort((a, b) => {
      switch (sortBy) {
        case 'name': return a.name.localeCompare(b.name);
        case 'height': return (b.height || 0) - (a.height || 0); // Descending
        case 'birthYear': return (a.birthYear || 9999) - (b.birthYear || 9999); // Ascending (Older first)
        case 'number': default: 
          return Number(a.number) - Number(b.number);
      }
    });

    return result;
  }, [players, filterTeam, searchTerm, sortBy]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newNumber) return;

    const newPlayer: Player = {
      id: Date.now().toString(),
      name: newName,
      number: newNumber,
      batHand: newBat,
      throwHand: newThrow,
      mainPosition: newMainPos,
      subPosition1: newSubPos1 || null,
      subPosition2: newSubPos2 || null,
      tags: newTags,
      height: newHeight ? Number(newHeight) : undefined,
      birthYear: newBirthYear ? Number(newBirthYear) : undefined,
      uniformSize: newUniformSize || undefined,
      waistSize: newWaistSize ? Number(newWaistSize) : undefined,
      uniformInitial: newUniformInitial || undefined,
    };

    onAdd(newPlayer);
    // Reset
    setNewName('');
    setNewNumber('');
    setNewMainPos('P');
    setNewSubPos1('');
    setNewSubPos2('');
    setNewTags([]);
    setNewHeight('');
    setNewBirthYear('');
    setNewUniformSize('');
    setNewWaistSize('');
    setNewUniformInitial('');
  };

  const handleEditFromCard = (id: string) => {
    setViewMode('list');
    setIsEditing(id);
  };

  return (
    <div className="p-6 h-full overflow-y-auto flex flex-col lg:flex-row gap-6">
      {/* Registration Form */}
      <div className="w-full lg:w-1/3 bg-white p-6 rounded-lg shadow-md h-fit border border-slate-200 shrink-0">
        <h2 className="text-lg font-bold mb-4 flex items-center gap-2 border-b pb-2">
          <Plus className="w-5 h-5 text-indigo-600" />
          선수 상세 등록
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">이름 *</label>
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
              <label className="block text-xs font-medium text-slate-700 mb-1">등번호 *</label>
              <input 
                type="number" 
                value={newNumber}
                onChange={e => setNewNumber(e.target.value)}
                className="w-full p-2 border rounded focus:ring-2 focus:ring-indigo-500 outline-none"
                placeholder="10"
                required
              />
            </div>
          </div>
          
          {/* Hands */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">투구</label>
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
              <label className="block text-xs font-medium text-slate-700 mb-1">타격</label>
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

          {/* Detailed Stats (Height, Age, Sizes) */}
          <div className="bg-slate-50 p-3 rounded border border-slate-200">
            <h3 className="text-xs font-bold text-slate-500 mb-2 flex items-center gap-1">
               <Ruler size={12}/> 신체 및 유니폼 정보
            </h3>
            <div className="grid grid-cols-2 gap-2 mb-2">
               <div>
                  <label className="block text-[10px] font-medium text-slate-500 mb-1">신장 (cm)</label>
                  <input type="number" value={newHeight} onChange={e => setNewHeight(e.target.value)} className="w-full p-1.5 text-sm border rounded" placeholder="180" />
               </div>
               <div>
                  <label className="block text-[10px] font-medium text-slate-500 mb-1">출생년도</label>
                  <input type="number" value={newBirthYear} onChange={e => setNewBirthYear(e.target.value)} className="w-full p-1.5 text-sm border rounded" placeholder="1990" />
               </div>
            </div>
            <div className="grid grid-cols-2 gap-2 mb-2">
               <div>
                  <label className="block text-[10px] font-medium text-slate-500 mb-1">유니폼 (호)</label>
                  <input type="text" value={newUniformSize} onChange={e => setNewUniformSize(e.target.value)} className="w-full p-1.5 text-sm border rounded" placeholder="105" />
               </div>
               <div>
                  <label className="block text-[10px] font-medium text-slate-500 mb-1">허리 (인치)</label>
                  <input type="number" value={newWaistSize} onChange={e => setNewWaistSize(e.target.value)} className="w-full p-1.5 text-sm border rounded" placeholder="32" />
               </div>
            </div>
            <div>
              <label className="block text-[10px] font-medium text-slate-500 mb-1">이니셜 (마킹)</label>
              <input 
                type="text" 
                value={newUniformInitial} 
                onChange={e => setNewUniformInitial(e.target.value)} 
                className="w-full p-1.5 text-sm border rounded uppercase placeholder:normal-case" 
                placeholder="예: K.H.KIM" 
              />
            </div>
          </div>

          {/* Positions */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">주 포지션 (필수)</label>
            <select 
              value={newMainPos} 
              onChange={e => setNewMainPos(e.target.value as PositionCode)}
              className="w-full p-2 border rounded focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
            >
              {POSITIONS.map(p => (
                <option key={p.code} value={p.code}>{p.label} ({p.code})</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">보조 1</label>
              <select 
                value={newSubPos1} 
                onChange={e => setNewSubPos1(e.target.value as PositionCode | '')}
                className="w-full p-2 border rounded focus:ring-2 focus:ring-indigo-500 outline-none bg-white text-sm"
              >
                <option value="">없음</option>
                {POSITIONS.map(p => (
                  <option key={p.code} value={p.code}>{p.code}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">보조 2</label>
              <select 
                value={newSubPos2} 
                onChange={e => setNewSubPos2(e.target.value as PositionCode | '')}
                className="w-full p-2 border rounded focus:ring-2 focus:ring-indigo-500 outline-none bg-white text-sm"
              >
                <option value="">없음</option>
                {POSITIONS.map(p => (
                  <option key={p.code} value={p.code}>{p.code}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Tags */}
          <div>
             <label className="block text-xs font-medium text-slate-700 mb-2">소속 팀 태그</label>
             <div className="flex gap-2">
               {TEAM_TAGS.map(tag => {
                 const isSelected = newTags.includes(tag);
                 return (
                   <button
                    key={tag}
                    type="button"
                    onClick={() => toggleNewTag(tag)}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-sm border transition-colors ${isSelected ? 'bg-indigo-100 text-indigo-800 border-indigo-300' : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100'}`}
                   >
                     {isSelected && <Check size={14} />}
                     {tag}
                   </button>
                 )
               })}
             </div>
          </div>

          <button 
            type="submit"
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded transition-colors mt-4"
          >
            등록하기
          </button>
        </form>
      </div>

      {/* Player List / Card View */}
      <div className="flex-1 bg-white rounded-lg shadow-md border border-slate-200 flex flex-col w-full overflow-hidden">
        
        {/* Header & Toolbar */}
        <div className="p-4 border-b bg-slate-50 space-y-3">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold">선수 명단 ({players.length}명)</h2>
            
            {/* Google Sheets Toolbar */}
            {googleAuth && (
              <div className="flex items-center gap-2">
                {googleAuth.status === 'loading' && <Loader2 className="animate-spin text-indigo-600" size={18}/>}
                
                {!googleAuth.isAuthenticated ? (
                  <button 
                    onClick={googleAuth.onConnect}
                    className="flex items-center gap-1 px-3 py-1.5 bg-white border border-slate-300 text-slate-700 rounded text-sm hover:bg-slate-50"
                  >
                    <Database size={14} />
                    <span className="hidden sm:inline">Google 연동</span>
                  </button>
                ) : (
                  <>
                    <button 
                      onClick={googleAuth.onLoad}
                      className="flex items-center gap-1 px-3 py-1.5 bg-green-50 border border-green-200 text-green-700 rounded text-sm hover:bg-green-100"
                      title="구글 시트에서 불러오기"
                    >
                      <Download size={14} />
                      <span className="hidden xl:inline">시트 불러오기</span>
                    </button>
                    <button 
                      onClick={googleAuth.onSave}
                      className="flex items-center gap-1 px-3 py-1.5 bg-blue-50 border border-blue-200 text-blue-700 rounded text-sm hover:bg-blue-100"
                      title="구글 시트에 저장하기"
                    >
                      <Upload size={14} />
                      <span className="hidden xl:inline">시트 저장</span>
                    </button>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Smart Toolbar */}
          <div className="flex flex-wrap gap-3 items-center justify-between bg-white p-2 rounded border border-slate-200">
            
            {/* Left: Search & Team Filter */}
            <div className="flex items-center gap-3 flex-wrap">
               <div className="relative">
                 <Search className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" size={16}/>
                 <input 
                    type="text" 
                    placeholder="이름, 등번호 검색" 
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="pl-8 pr-2 py-1.5 text-sm border rounded w-48 focus:ring-2 focus:ring-indigo-500 outline-none"
                 />
               </div>

               <div className="flex rounded overflow-hidden border border-slate-300">
                 <button onClick={() => setFilterTeam('all')} className={`px-3 py-1.5 text-xs font-medium ${filterTeam === 'all' ? 'bg-slate-700 text-white' : 'bg-white text-slate-600 hover:bg-slate-50'}`}>전체</button>
                 <button onClick={() => setFilterTeam('A팀')} className={`px-3 py-1.5 text-xs font-medium border-l ${filterTeam === 'A팀' ? 'bg-blue-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-50'}`}>A팀</button>
                 <button onClick={() => setFilterTeam('B팀')} className={`px-3 py-1.5 text-xs font-medium border-l ${filterTeam === 'B팀' ? 'bg-green-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-50'}`}>B팀</button>
               </div>
            </div>

            {/* Right: Sort & View Toggle */}
            <div className="flex items-center gap-3">
               <div className="flex items-center gap-1">
                 <ArrowUpDown size={14} className="text-slate-400"/>
                 <select 
                    value={sortBy} 
                    onChange={e => setSortBy(e.target.value as any)}
                    className="text-sm border-none bg-transparent focus:ring-0 cursor-pointer text-slate-600 font-medium"
                 >
                   <option value="number">등번호순</option>
                   <option value="name">이름순</option>
                   <option value="birthYear">나이순 (연장자)</option>
                   <option value="height">신장순</option>
                 </select>
               </div>

               <div className="w-px h-4 bg-slate-300 mx-1"></div>

               <div className="flex gap-1 bg-slate-100 p-0.5 rounded">
                  <button onClick={() => setViewMode('list')} className={`p-1.5 rounded ${viewMode === 'list' ? 'bg-white shadow text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`} title="리스트 보기">
                    <List size={18}/>
                  </button>
                  <button onClick={() => setViewMode('card')} className={`p-1.5 rounded ${viewMode === 'card' ? 'bg-white shadow text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`} title="카드 보기">
                    <LayoutGrid size={18}/>
                  </button>
               </div>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-auto bg-slate-50 p-4">
          {processedPlayers.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400">
               <Search size={48} className="mb-4 opacity-20"/>
               <p>조건에 맞는 선수가 없습니다.</p>
            </div>
          ) : (
             viewMode === 'list' ? (
               <div className="bg-white rounded border shadow-sm overflow-hidden">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-100 text-slate-600">
                      <tr>
                        <th className="p-3 font-semibold whitespace-nowrap w-12">No.</th>
                        <th className="p-3 font-semibold whitespace-nowrap">이름/팀</th>
                        <th className="p-3 font-semibold whitespace-nowrap">포지션 상세 (Main/Sub)</th>
                        <th className="p-3 font-semibold whitespace-nowrap">신체정보 (키/출생)</th>
                        <th className="p-3 font-semibold whitespace-nowrap">사이즈/이니셜</th>
                        <th className="p-3 font-semibold whitespace-nowrap text-right">관리</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {processedPlayers.map(player => (
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
             ) : (
               <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
                  {processedPlayers.map(player => (
                    <PlayerCard 
                      key={player.id}
                      player={player}
                      onEdit={() => handleEditFromCard(player.id)}
                      onDelete={() => { if(confirm('삭제하시겠습니까?')) onDelete(player.id) }}
                    />
                  ))}
               </div>
             )
          )}
        </div>
      </div>
    </div>
  );
};

// --- Sub Components ---

const PlayerCard: React.FC<{ player: Player; onEdit: () => void; onDelete: () => void }> = ({ player, onEdit, onDelete }) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-shadow group relative">
       {/* Card Header */}
       <div className="bg-slate-800 p-3 flex justify-between items-center text-white relative overflow-hidden min-h-[90px]">
          <div className="absolute right-0 top-0 opacity-10 pointer-events-none">
             <User size={80} />
          </div>
          <div className="flex items-center gap-3 z-10">
             <div className="w-12 h-12 bg-white text-slate-900 rounded-full flex items-center justify-center font-black text-xl shadow-lg border-2 border-slate-200 shrink-0">
                {player.number}
             </div>
             <div>
                <div className="font-bold text-lg leading-none">{player.name}</div>
                {player.uniformInitial && (
                  <div className="font-mono text-sm text-yellow-400 mt-0.5 tracking-wider font-bold">{player.uniformInitial}</div>
                )}
                <div className="text-[10px] text-slate-300 mt-0.5">
                   {player.birthYear ? `${player.birthYear}년생` : ''} {player.height ? `| ${player.height}cm` : ''}
                </div>
             </div>
          </div>
          <div className="z-10 flex gap-1 self-start">
             {player.tags?.map(tag => (
               <span key={tag} className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${tag === 'A팀' ? 'bg-blue-500 text-white' : tag === 'B팀' ? 'bg-green-500 text-white' : 'bg-slate-600'}`}>
                 {tag}
               </span>
             ))}
          </div>
       </div>
       
       {/* Card Body */}
       <div className="p-4">
          <div className="flex justify-between items-start mb-3">
             <div className="flex flex-col">
                <span className="text-xs text-slate-400 font-bold">POSITION</span>
                <span className="text-2xl font-black text-indigo-900">{player.mainPosition}</span>
                <div className="flex gap-1 mt-1">
                   {player.subPosition1 && <span className="text-[10px] px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded border">{player.subPosition1}</span>}
                   {player.subPosition2 && <span className="text-[10px] px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded border">{player.subPosition2}</span>}
                </div>
             </div>
             <div className="text-right">
                <div className="text-xs font-bold text-slate-500 border rounded px-2 py-1 mb-1 bg-slate-50">
                   {player.throwHand}투 {player.batHand}타
                </div>
             </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-2 rounded border border-slate-100">
             <div className="flex justify-between">
               <span className="text-slate-400">유니폼</span>
               <span className="font-bold text-slate-700">{player.uniformSize || '-'}</span>
             </div>
             <div className="flex justify-between">
               <span className="text-slate-400">허리</span>
               <span className="font-bold text-slate-700">{player.waistSize ? player.waistSize + '"' : '-'}</span>
             </div>
          </div>
       </div>

       {/* Overlay Actions (Visible on Hover) */}
       <div className="absolute inset-0 bg-black/60 flex items-center justify-center gap-4 opacity-0 group-hover:opacity-100 transition-opacity z-20">
          <button onClick={onEdit} className="bg-white text-indigo-600 p-2 rounded-full hover:bg-indigo-50 shadow-lg transform hover:scale-110 transition-all">
             <Edit2 size={20}/>
          </button>
          <button onClick={onDelete} className="bg-white text-red-600 p-2 rounded-full hover:bg-red-50 shadow-lg transform hover:scale-110 transition-all">
             <Trash2 size={20}/>
          </button>
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

  const toggleLocalTag = (tag: string) => {
    const currentTags = localData.tags || [];
    const newTags = currentTags.includes(tag) 
      ? currentTags.filter(t => t !== tag) 
      : [...currentTags, tag];
    setLocalData({...localData, tags: newTags});
  }

  if (isEditing) {
    return (
      <tr className="bg-indigo-50">
        <td className="p-2 align-top"><input className="w-10 p-1 border rounded text-center" value={localData.number} onChange={e => setLocalData({...localData, number: e.target.value})} /></td>
        <td className="p-2 align-top">
           <input className="w-20 p-1 border rounded mb-1 block" value={localData.name} onChange={e => setLocalData({...localData, name: e.target.value})} />
           <div className="flex flex-wrap gap-1">
             {TEAM_TAGS.map(tag => (
               <button 
                 key={tag}
                 type="button"
                 onClick={() => toggleLocalTag(tag)}
                 className={`text-[10px] px-1.5 py-0.5 rounded border ${localData.tags?.includes(tag) ? 'bg-indigo-200 border-indigo-400 text-indigo-900' : 'bg-white border-slate-300'}`}
               >
                 {tag}
               </button>
             ))}
           </div>
        </td>
        <td className="p-2 align-top">
          <div className="space-y-1.5">
            <div className="flex items-center gap-1">
               <span className="text-[10px] w-8 text-slate-500 font-bold">Main</span>
               <select className="w-16 p-1 border rounded text-xs" value={localData.mainPosition} onChange={e => setLocalData({...localData, mainPosition: e.target.value as PositionCode})}>
                {POSITIONS.map(p => <option key={p.code} value={p.code}>{p.code}</option>)}
              </select>
            </div>
            <div className="flex items-center gap-1">
               <span className="text-[10px] w-8 text-slate-500">Sub1</span>
               <select className="w-16 p-1 border rounded text-xs" value={localData.subPosition1 || ''} onChange={e => setLocalData({...localData, subPosition1: e.target.value as PositionCode || null})}>
                <option value="">-</option>
                {POSITIONS.map(p => <option key={p.code} value={p.code}>{p.code}</option>)}
              </select>
            </div>
            <div className="flex items-center gap-1">
               <span className="text-[10px] w-8 text-slate-500">Sub2</span>
               <select className="w-16 p-1 border rounded text-xs" value={localData.subPosition2 || ''} onChange={e => setLocalData({...localData, subPosition2: e.target.value as PositionCode || null})}>
                <option value="">-</option>
                {POSITIONS.map(p => <option key={p.code} value={p.code}>{p.code}</option>)}
              </select>
            </div>
          </div>
          <div className="mt-1 text-[10px] text-slate-500 text-center">{localData.throwHand}투 {localData.batHand}타</div>
        </td>
        <td className="p-2 align-top">
           <div className="flex items-center gap-1 mb-1">
             <span className="text-[10px] w-4">키</span>
             <input type="number" className="w-12 p-1 border rounded text-xs" value={localData.height || ''} onChange={e => setLocalData({...localData, height: Number(e.target.value)})} />
           </div>
           <div className="flex items-center gap-1">
             <span className="text-[10px] w-4">출생</span>
             <input type="number" className="w-12 p-1 border rounded text-xs" value={localData.birthYear || ''} onChange={e => setLocalData({...localData, birthYear: Number(e.target.value)})} />
           </div>
        </td>
        <td className="p-2 align-top">
           <div className="flex items-center gap-1 mb-1">
             <span className="text-[10px] w-6 text-slate-500">옷</span>
             <input type="text" className="w-14 p-1 border rounded text-xs" value={localData.uniformSize || ''} onChange={e => setLocalData({...localData, uniformSize: e.target.value})} />
           </div>
           <div className="flex items-center gap-1 mb-1">
             <span className="text-[10px] w-6 text-slate-500">허리</span>
             <input type="number" className="w-14 p-1 border rounded text-xs" value={localData.waistSize || ''} onChange={e => setLocalData({...localData, waistSize: Number(e.target.value)})} />
           </div>
           <div className="flex items-center gap-1">
             <span className="text-[10px] w-6 text-slate-500">이니셜</span>
             <input type="text" className="w-14 p-1 border rounded text-xs uppercase" placeholder="K.H.KIM" value={localData.uniformInitial || ''} onChange={e => setLocalData({...localData, uniformInitial: e.target.value})} />
           </div>
        </td>
        <td className="p-2 align-top text-right space-x-2 whitespace-nowrap">
          <button onClick={() => onUpdate(localData)} className="p-1 text-green-600 hover:bg-green-100 rounded"><Save size={16}/></button>
          <button onClick={onEditCancel} className="p-1 text-red-600 hover:bg-red-100 rounded"><X size={16}/></button>
        </td>
      </tr>
    );
  }

  return (
    <tr className="hover:bg-slate-50 border-b border-slate-50 last:border-b-0">
      <td className="p-3 font-mono text-slate-500 align-middle">#{player.number}</td>
      <td className="p-3 align-middle">
        <div className="font-medium text-slate-900">{player.name}</div>
        {player.uniformInitial && <div className="text-[10px] text-slate-400 font-mono">{player.uniformInitial}</div>}
        <div className="flex gap-1 flex-wrap mt-1.5">
          {player.tags && player.tags.length > 0 ? player.tags.map(tag => (
            <span key={tag} className={`px-1.5 py-0.5 text-[10px] rounded-full border ${tag === 'A팀' ? 'bg-blue-50 text-blue-700 border-blue-200' : tag === 'B팀' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-indigo-50 text-indigo-700 border-indigo-200'}`}>
              {tag}
            </span>
          )) : null}
        </div>
      </td>
      <td className="p-3 align-middle">
        <div className="flex flex-col gap-1.5">
           <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-slate-400 w-8">MAIN</span>
              <span className="inline-block px-2 py-0.5 rounded bg-indigo-50 border border-indigo-100 text-xs font-bold text-indigo-700 shadow-sm">
                {player.mainPosition}
              </span>
           </div>
           {(player.subPosition1 || player.subPosition2) && (
             <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-slate-400 w-8">SUB</span>
                <div className="flex gap-1">
                  {player.subPosition1 && (
                    <span className="inline-block px-1.5 py-0.5 rounded bg-slate-50 border border-slate-200 text-[10px] text-slate-600">
                      {player.subPosition1}
                    </span>
                  )}
                  {player.subPosition2 && (
                    <span className="inline-block px-1.5 py-0.5 rounded bg-slate-50 border border-slate-200 text-[10px] text-slate-600">
                      {player.subPosition2}
                    </span>
                  )}
                </div>
             </div>
           )}
        </div>
        <div className="mt-1.5 text-[10px] text-slate-400">{player.throwHand}투 {player.batHand}타</div>
      </td>
      <td className="p-3 text-slate-700 text-xs align-middle">
         <div>{player.height ? `${player.height}cm` : '-'}</div>
         <div className="text-slate-500">{player.birthYear ? `${player.birthYear}년` : '-'}</div>
      </td>
      <td className="p-3 text-slate-700 text-xs align-middle">
         <div className="flex items-center gap-1"><Shirt size={10}/> {player.uniformSize || '-'}</div>
         <div className="flex items-center gap-1 text-slate-500"><Ruler size={10}/> {player.waistSize ? `${player.waistSize}"` : '-'}</div>
         {player.uniformInitial && <div className="flex items-center gap-1 text-indigo-500 font-mono text-[10px]"><CaseSensitive size={10}/> {player.uniformInitial}</div>}
      </td>
      <td className="p-3 text-right space-x-2 align-middle whitespace-nowrap">
        <button onClick={onEditStart} className="p-1 text-blue-600 hover:bg-blue-50 rounded" title="수정"><Edit2 size={16}/></button>
        <button onClick={() => { if(confirm('삭제하시겠습니까?')) onDelete() }} className="p-1 text-red-600 hover:bg-red-50 rounded" title="삭제"><Trash2 size={16}/></button>
      </td>
    </tr>
  );
};

export default RosterManager;