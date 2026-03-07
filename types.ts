
export enum MissionType {
  REELS = 'REELS',
  GROUP_SHOT = 'GROUP_SHOT',
  CALL = 'CALL',
  TEAM_NAMES = 'TEAM_NAMES',
  NONE = 'NONE'
}

export interface Spot {
  id: number;
  character: string;
  missionType: MissionType;
  missionTitle?: string;
  missionDescription?: string;
  isCompleted: boolean;
  lat: number;
  lng: number;
}

export interface Submission {
  teamName: string;
  spotId: number;
  missionType: MissionType;
  content?: string; // For team names or text info
  mediaUrl?: string; // Data URI for photos/videos
  timestamp: number;
}

export interface AppState {
  spots: Spot[];
  memo: string;
  teamName: string;
  role: 'GUEST' | 'PARTICIPANT' | 'ADMIN';
}

export type ViewType = 'LANDING' | 'DASHBOARD' | 'ADMIN_PANEL';
export type TabType = 'HOME' | 'MISSION' | 'MEMO';
