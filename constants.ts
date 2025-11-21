import { PositionCode, PlayOutcome } from "./types";

export const POSITIONS: { code: PositionCode; label: string }[] = [
  { code: 'P', label: '투수' },
  { code: 'C', label: '포수' },
  { code: '1B', label: '1루수' },
  { code: '2B', label: '2루수' },
  { code: '3B', label: '3루수' },
  { code: 'SS', label: '유격수' },
  { code: 'LF', label: '좌익수' },
  { code: 'CF', label: '중견수' },
  { code: 'RF', label: '우익수' },
  { code: 'DH', label: '지명타자' },
];

export const OUTCOMES: { code: PlayOutcome; label: string; color: string }[] = [
  { code: 'H', label: '안타', color: 'bg-red-100 text-red-800 border-red-200' },
  { code: '2B', label: '2루타', color: 'bg-red-200 text-red-900 border-red-300' },
  { code: '3B', label: '3루타', color: 'bg-red-300 text-red-950 border-red-400' },
  { code: 'HR', label: '홈런', color: 'bg-purple-100 text-purple-800 border-purple-200' },
  { code: 'BB', label: '볼넷', color: 'bg-green-100 text-green-800 border-green-200' },
  { code: 'IBB', label: '고의4구', color: 'bg-green-100 text-green-800 border-green-200' },
  { code: 'HBP', label: '사구(몸)', color: 'bg-green-200 text-green-900 border-green-300' },
  { code: 'E', label: '실책', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
  { code: 'GO', label: '땅볼/야선', color: 'bg-slate-100 text-slate-600 border-slate-200' },
  { code: 'SO', label: '삼진', color: 'bg-slate-200 text-slate-700 border-slate-300' },
  { code: 'SOK', label: '낫아웃', color: 'bg-slate-200 text-slate-700 border-slate-300' },
  { code: 'FO', label: '플라이', color: 'bg-slate-100 text-slate-600 border-slate-200' },
  { code: 'LO', label: '직선타', color: 'bg-slate-100 text-slate-600 border-slate-200' },
  { code: 'SF', label: '희생플라이', color: 'bg-blue-100 text-blue-800 border-blue-200' },
  { code: 'TO', label: '태그아웃', color: 'bg-slate-100 text-slate-600 border-slate-200' },
];

export const DEFAULT_LINEUP_SIZE = 9;
export const MAX_LINEUP_SIZE = 10;
export const INNINGS_COUNT = 9;