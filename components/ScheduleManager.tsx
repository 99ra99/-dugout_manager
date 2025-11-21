
import React, { useState } from 'react';
import { Calendar, MapPin, Clock, Trash2, Plus, Sword, Edit2, Save, X, ArrowRightCircle, Loader2, Database, Upload, Download, CheckCircle, PlayCircle, FileText } from 'lucide-react';
import { ScheduleEvent, GoogleSyncProps } from '../types';

interface Props {
  schedules: ScheduleEvent[];
  onAdd: (event: ScheduleEvent) => void;
  onUpdate: (event: ScheduleEvent) => void;
  onDelete: (id: string) => void;
  onEnterGame: (id: string) => void;
  googleAuth?: GoogleSyncProps;
}

const ScheduleManager: React.FC<Props> = ({ schedules, onAdd, onUpdate, onDelete, onEnterGame, googleAuth }) => {
  const [isEditing, setIsEditing] = useState<string | null>(null);

  // Form State
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [type, setType] = useState<'match' | 'training'>('match');
  const [opponent, setOpponent] = useState('');
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!date || !location) return;

    // Generate a unique ID using timestamp and random string
    const newEvent: ScheduleEvent = {
      id: Date.now().toString() + Math.random().toString(36).slice(2, 7),
      date,
      time,
      type,
      opponent: type === 'match' ? opponent : undefined,
      location,
      notes,
      status: 'scheduled' // Default status
    };

    onAdd(newEvent);
    // Reset
    setDate('');
    setTime('');
    setOpponent('');
    setLocation('');
    setNotes('');
  };

  // Sort schedules by date desc
  const sortedSchedules = [...schedules].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="p-6 h-full overflow-y-auto flex flex-col lg:flex-row gap-6">
      {/* Form Section */}
      <div className="w-full lg:w-1/3 bg-white p-6 rounded-lg shadow-md h-fit border border-slate-200 shrink-0">
        <h2 className="text-lg font-bold mb-4 flex items-center gap-2 border-b pb-2">
          <Plus className="w-5 h-5 text-indigo-600" />
          새 일정 등록
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">날짜 *</label>
              <input 
                type="date" 
                value={date}
                onChange={e => setDate(e.target.value)}
                className="w-full p-2 border rounded focus:ring-2 focus:ring-indigo-500 outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">시간</label>
              <input 
                type="time" 
                value={time}
                onChange={e => setTime(e.target.value)}
                className="w-full p-2 border rounded focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">유형</label>
            <div className="flex gap-2">
              <button type="button" onClick={() => setType('match')} className={`flex-1 py-2 rounded border text-sm ${type === 'match' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white'}`}>시합</button>
              <button type="button" onClick={() => setType('training')} className={`flex-1 py-2 rounded border text-sm ${type === 'training' ? 'bg-green-600 text-white border-green-600' : 'bg-white'}`}>훈련</button>
            </div>
          </div>

          {type === 'match' && (
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">상대팀</label>
              <input 
                type="text" 
                value={opponent}
                onChange={e => setOpponent(e.target.value)}
                className="w-full p-2 border rounded focus:ring-2 focus:ring-indigo-500 outline-none"
                placeholder="상대팀 이름"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">장소 *</label>
            <input 
              type="text" 
              value={location}
              onChange={e => setLocation(e.target.value)}
              className="w-full p-2 border rounded focus:ring-2 focus:ring-indigo-500 outline-none"
              placeholder="구장명 또는 주소"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">메모</label>
            <textarea 
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="w-full p-2 border rounded focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
              rows={3}
            />
          </div>

          <button 
            type="submit"
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded transition-colors"
          >
            일정 등록
          </button>
        </form>
      </div>

      {/* List Section */}
      <div className="flex-1 bg-white rounded-lg shadow-md border border-slate-200 flex flex-col overflow-hidden">
         <div className="p-4 border-b bg-slate-50 flex justify-between items-center flex-wrap gap-3">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <Calendar className="text-indigo-600"/> 팀 일정 목록 ({schedules.length})
            </h2>

            {/* Google Sync Toolbar */}
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
                    <span className="text-xs text-green-600 font-bold flex items-center">
                       <div className="w-2 h-2 bg-green-500 rounded-full mr-1"></div>
                       연동됨
                    </span>
                  </>
                )}
              </div>
            )}
         </div>
         <div className="flex-1 overflow-auto p-4 space-y-3">
            {schedules.length === 0 && (
              <div className="text-center text-slate-400 py-8">등록된 일정이 없습니다.</div>
            )}
            {sortedSchedules.map(item => (
              <ScheduleItem 
                key={item.id} 
                event={item} 
                onDelete={onDelete}
                onEnterGame={() => onEnterGame(item.id)}
              />
            ))}
         </div>
      </div>
    </div>
  );
};

const ScheduleItem: React.FC<{ event: ScheduleEvent; onDelete: (id: string) => void; onEnterGame: () => void }> = ({ event, onDelete, onEnterGame }) => {
  const isMatch = event.type === 'match';
  const isCompleted = event.status === 'completed';
  const isInProgress = event.status === 'in-progress';

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('정말 이 일정을 삭제하시겠습니까?')) {
      onDelete(event.id);
    }
  };

  return (
    <div className={`p-4 rounded-lg border shadow-sm flex flex-col md:flex-row gap-4 justify-between items-start md:items-center transition-all ${isMatch ? 'bg-white border-indigo-100 hover:border-indigo-300' : 'bg-green-50 border-green-100 hover:border-green-300'}`}>
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <span className={`px-2 py-0.5 text-xs font-bold rounded ${isMatch ? 'bg-indigo-100 text-indigo-700' : 'bg-green-200 text-green-800'}`}>
            {isMatch ? '시합' : '훈련'}
          </span>
          <span className="font-mono font-bold text-slate-700">{event.date}</span>
          {event.time && <span className="text-slate-500 text-sm flex items-center gap-1"><Clock size={12}/> {event.time}</span>}
          
          {/* Status Badge */}
          {isMatch && isCompleted && <span className="text-xs bg-slate-800 text-white px-2 py-0.5 rounded">종료</span>}
          {isMatch && isInProgress && <span className="text-xs bg-rose-500 text-white px-2 py-0.5 rounded animate-pulse">진행중</span>}
        </div>
        
        <div className="text-lg font-bold text-slate-800 mb-1 flex items-center gap-2">
          {isMatch ? `VS ${event.opponent || '미정'}` : '팀 훈련'}
          
          {/* Score Display for Completed Games */}
          {isCompleted && event.homeScore !== undefined && (
             <span className="text-sm bg-slate-100 px-2 py-0.5 rounded border text-slate-600">
               {event.homeScore} : {event.awayScore || 0}
             </span>
          )}
        </div>
        
        <div className="flex items-center gap-4 text-sm text-slate-600">
          <span className="flex items-center gap-1"><MapPin size={14}/> {event.location}</span>
          {event.notes && <span className="text-slate-400 max-w-md truncate border-l pl-2 border-slate-300">{event.notes}</span>}
        </div>
      </div>

      <div className="flex items-center gap-2 self-end md:self-center">
        {isMatch && !isCompleted && (
          <button 
            onClick={onEnterGame}
            className={`flex items-center gap-1 px-4 py-2 rounded-lg font-bold text-sm shadow-sm transition-colors ${isInProgress ? 'bg-rose-500 hover:bg-rose-600 text-white' : 'bg-indigo-600 hover:bg-indigo-700 text-white'}`}
          >
            {isInProgress ? <PlayCircle size={16}/> : <Sword size={16} />}
            {isInProgress ? '기록 재개' : '기록실 입장'}
          </button>
        )}
        {/* View Record Button for Completed Games */}
        {isMatch && isCompleted && (
           <button 
            onClick={onEnterGame}
            className="flex items-center gap-1 px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg font-bold text-sm transition-colors"
           >
             <FileText size={16} />
             기록 보기
           </button>
        )}

        <button 
          onClick={handleDelete}
          className="p-2 text-slate-400 hover:bg-slate-100 hover:text-red-500 rounded transition-colors"
          title="삭제"
        >
          <Trash2 size={18} />
        </button>
      </div>
    </div>
  );
};

export default ScheduleManager;
