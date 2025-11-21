
export type Hand = '우' | '좌';

export type PositionCode = 'P' | 'C' | '1B' | '2B' | '3B' | 'SS' | 'LF' | 'CF' | 'RF' | 'DH';

export interface Player {
  id: string;
  name: string;
  number: string;
  batHand: Hand;
  throwHand: Hand;
  mainPosition: PositionCode;
  subPosition1?: PositionCode | null;
  subPosition2?: PositionCode | null;
  tags?: string[]; // 'A팀', 'B팀'
  
  // Detailed Management Info
  height?: number;      // cm
  birthYear?: number;   // YYYY (Changed from age)
  uniformSize?: string; // e.g. 100, 105, XL
  waistSize?: number;   // inches
  uniformInitial?: string; // e.g. K.H.KIM
}

export interface LineupSlot {
  order: number; // 1-10
  playerId: string | null;
  position: PositionCode | null;
}

// Outcome codes
export type PlayOutcome = 
  | 'H'   // 안타
  | '2B'  // 2루타
  | '3B'  // 3루타
  | 'HR'  // 홈런
  | 'BB'  // 볼넷
  | 'IBB' // 고의4구
  | 'HBP' // 사구
  | 'SO'  // 삼진
  | 'SOK' // 낫아웃
  | 'GO'  // 땅볼/야수선택
  | 'FO'  // 플라이
  | 'LO'  // 직선타
  | 'SF'  // 희생플라이
  | 'E'   // 실책
  | 'TO'  // 태그아웃
  | null;

export interface GameRecord {
  scheduleId?: string; // Link to a specific schedule/game
  inning: number;
  battingOrder: number;
  playerId: string;
  outcome: PlayOutcome;
  rbi?: number;    // Run Batted In
  isRun?: boolean; // Scored a run
}

// For tracking who is currently in which batting slot (handling substitutions)
export interface ActiveLineup {
  [order: number]: string; // order -> playerId
}

export interface GoogleConfig {
  apiKey: string;
  clientId: string;
  spreadsheetId: string;
}

export interface ScheduleEvent {
  id: string;
  date: string;        // YYYY-MM-DD
  time: string;        // HH:MM
  type: 'match' | 'training';
  opponent?: string;   // For matches
  location: string;
  notes?: string;
  
  // Game Status & Result
  status?: 'scheduled' | 'in-progress' | 'completed';
  homeScore?: number; // Our team score
  awayScore?: number; // Opponent score
  
  // Inning-by-inning score for opponent (Away)
  // Index 0 = 1st inning, Index 1 = 2nd inning...
  awayInningScores?: number[]; 

  // Match-Specific Lineup (Snapshot)
  lineup?: LineupSlot[];
}

export interface GoogleSyncProps {
  isAuthenticated: boolean;
  onConnect: () => void;
  onLoad: () => void;
  onSave: () => void;
  status: 'idle' | 'loading' | 'success' | 'error';
}
