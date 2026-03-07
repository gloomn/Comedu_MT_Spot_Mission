import { MissionType, Spot } from './types';

export const SPOT_CHARACTERS = ["2026", "", "컴, 리 ", " 육, 퓨", "이, 은?", "MT", "우, 교", "팀, 름", "터", "과"];
export const ADMIN_PASSWORD = "2026comedumt!";
export const MISSION_RADIUS_METERS = 50; // Distance to allow opening

// Sample coordinates (Grid pattern for demonstration)
const BASE_LAT = 37.5547;
const BASE_LNG = 126.9707;

export const INITIAL_SPOTS: Spot[] = [
  { id: 1, character: SPOT_CHARACTERS[0], missionType: MissionType.REELS, missionTitle: "미션 1: 릴스 찍기", missionDescription: "지정된 장소에서 팀원들과 함께 즐거운 릴스 영상을 촬영하고 업로드하세요!", isCompleted: false, lat: BASE_LAT + 0.0001, lng: BASE_LNG + 0.0001 },
  { id: 2, character: SPOT_CHARACTERS[1], missionType: MissionType.NONE, isCompleted: false, lat: BASE_LAT + 0.0002, lng: BASE_LNG - 0.0001 },
  { id: 3, character: SPOT_CHARACTERS[2], missionType: MissionType.GROUP_SHOT, missionTitle: "미션 2: 팀 단체샷", missionDescription: "팀원 전원이 나오도록 단체 사진을 찍어주세요!", isCompleted: false, lat: BASE_LAT - 0.0001, lng: BASE_LNG + 0.0002 },
  { id: 4, character: SPOT_CHARACTERS[3], missionType: MissionType.NONE, isCompleted: false, lat: BASE_LAT + 0.0003, lng: BASE_LNG + 0.0001 },
  { id: 5, character: SPOT_CHARACTERS[4], missionType: MissionType.CALL, missionTitle: "미션 3: 전화 미션", missionDescription: "운영본부(010-XXXX-XXXX)로 전화하여 오늘 미션의 핵심 단어를 알아내세요!", isCompleted: false, lat: BASE_LAT - 0.0002, lng: BASE_LNG - 0.0002 },
  { id: 6, character: SPOT_CHARACTERS[5], missionType: MissionType.NONE, isCompleted: false, lat: BASE_LAT + 0.0001, lng: BASE_LNG - 0.0003 },
  { id: 7, character: SPOT_CHARACTERS[6], missionType: MissionType.TEAM_NAMES, missionTitle: "미션 4: 팀원 명단 작성", missionDescription: "모든 팀원의 이름을 정확하게 작성해주세요.", isCompleted: false, lat: BASE_LAT + 0.0004, lng: BASE_LNG + 0.0002 },
  { id: 8, character: SPOT_CHARACTERS[7], missionType: MissionType.NONE, isCompleted: false, lat: BASE_LAT - 0.0003, lng: BASE_LNG + 0.0001 },
  { id: 9, character: SPOT_CHARACTERS[8], missionType: MissionType.NONE, isCompleted: false, lat: BASE_LAT + 0.0002, lng: BASE_LNG + 0.0004 },
  { id: 10, character: SPOT_CHARACTERS[9], missionType: MissionType.NONE, isCompleted: false, lat: BASE_LAT - 0.0004, lng: BASE_LNG - 0.0001 },
];

export const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371e3; // metres
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) *
    Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};