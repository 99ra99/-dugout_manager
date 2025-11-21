
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

export const TEAM_TAGS = ['A팀', 'B팀'];

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

// Service Account Credentials (for Local/Demo use)
export const SERVICE_ACCOUNT_CONFIG = {
  client_email: "baseball-commander@baseball-commander.iam.gserviceaccount.com",
  private_key: "-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQDRk5mFujOtViiQ\n/du4oi3Z+xmFTh3ZCoSE3bzhx+7/4mr9VAaCXyeaUQuk1xOFAVjNgwuqdfIL498g\nFfAJkcLtRMwNLg98wxx9+dkudHyRfszs8NEIDCvREdXiYm8BDtIHqSgjSasL1nok\nP5zsPYMkRORzWM6YEOrVJRPue7H30JoskPmKwVCkyPub6VOt0C+8Oh33/GwNgTyw\n7Td4meviZQH0mblg8KuSqoHbDhDSxxGbB8LFh0TWE48a+WeKXwMUqeugH8KelO0H\nX3FALScdauSHat//+7PLr/csoQxgxEYxr4k3ThIW3gC0PRwYbZ1jKE3k3R5oVKo7\n4GdmeDP/AgMBAAECggEAJB1gx8wiCp09yVqNqf/8kcM1DyU6fIPU+UZyvZ+j/mFo\nmXYI1x+JpgyQSpwrh3CHeoa6FGpVxxnCAff10NhW9Gc2GJFW5uOCfez3sYsuSi5F\nJxGKm+3pARKnPmdDBLYmmF5chdQ0jworKyLxKj6hYjci/QOROmAz733/tMmJDhCL\nJBgeaTYxeU4pvLX5peCkzRBijuqAMSdyAI/3etYG3wm175dHMXezIboG3BS4bgFS\nkiI/rkh05qDNxSBFsDlQloQlR7sZOMXPa4KOY34lMoNCowfXlh4KGhoUFfKQBPo6\n6XiqlPMky7MabFU2eDI5VT6MEfq/XIKyyI9iltAqRQKBgQDocxPjMxRZQouGCD+d\nA+7qzRX/KD0Wpio5a7Mvgls/FUahrqrVUsYFAcNSfR/eT9QcGPEr3Ydrj5UOV+7r\nWO5T4uJX5T6zJybAPguVxruF3O0RapQ4ZWNaej7oi+wCWXHODh2g6E0Kee8B0ZeN\nuTgD5Z+QtnJrj+mZoDxC3kbqSwKBgQDmz0cmHKJ9VBSzkKeWAKJ/b2/uLpmT6Ct5\nu5OXTo8P4ZX+xYxy8sCQBkM2+xufoTR6l6ks+nh7sGH0fpU6bwGSDwY/QsanQ9wz\nWlWvM+6VGSzLenIzAEfOCxZzAxI6SaSNYrLDbOANv4y9I3ZmaROtJ86Mi/XFE2vi\ntgAI9p0MnQKBgQCVOQsTV79Abg/Tw4fS7Kt74Jy2aMaOu61vn0wwu6aIIMhvEwpo\nV/L3U+JoGhtTRDwOrZRlbJl623n880ZVn4mgII7djjVqHUArOamGRUYs8V7fR2RP\nsAbQFpo7/1dLStBcT4OFwJt0lkJxEHQSb00ec1K0O+vIUWLNVKha5QbxcQKBgQCD\nm2NNZvx8DAp1zSDR1nDRyz/+hxHJFZRcqEli+Ed43b+CczA/hw2n0fpXil1Y6zma\nQYoUfIlgtdVU7Sy4Ef3KQ8jjH3dYfsg7e+HpsenzmFRDfgFJ9Xn8EbRuRi0JkV5D\nxCh8aENlc3iTjHoBsR6oGE+dMl0kT4uvzOk+MyifvQKBgFHFwDpXppyAF9E0mOR9\n9ZmEgYPO8Kbl5Hu8CoCpx7S3nc2uBpKXhQExp3jmGepmqNRp2CGr8k8hc1eLvOpz\nSSEhVP2oir63q4CmTwgGi+1B6A9Y35jNrmmoJB7M8AtdFXw+CX4O1UUeiH7yCwtS\n9YiFVbrXQzLInZ0xYzJd5/K+\n-----END PRIVATE KEY-----\n",
};