
export type Hand = '우' | '좌';

export type PositionCode = 'P' | 'C' | '1B' | '2B' | '3B' | 'SS' | 'LF' | 'CF' | 'RF' | 'DH';

export interface Player {
  id: string;
  name: string;
  number: string;
  batHand: Hand;
  throwHand: Hand;
  mainPosition: PositionCode;
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
