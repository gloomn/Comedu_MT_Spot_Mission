import { Spot, MissionType } from './types';

// 관리자 로그인 비밀번호 (필요시 변경)
export const ADMIN_PASSWORD = 'admin';

// 미션 성공으로 인정되는 반경 (미터)
export const MISSION_RADIUS_METERS = 50;

// 두 GPS 좌표 간의 거리를 미터(m) 단위로 계산하는 함수 (Haversine 공식)
export const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371e3; // 지구의 반지름 (미터)
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

// 미션 내용 및 글자 배치 (2번: 퓨, 4번: 육)
export const INITIAL_SPOTS: Spot[] = [
  { 
    id: 1, 
    lat: 37.8845, 
    lng: 127.7301, 
    character: '컴', 
    missionType: MissionType.REELS, 
    missionTitle: '미션 1: 릴스 찍기',
    missionDescription: 'MT의 꽃! 팀원 모두가 등장하여 15초 이내의 짧고 재미있는 릴스(숏폼) 영상을 찍어 올려주세요.',
    isCompleted: false
  },
  { 
    id: 2, 
    lat: 37.8842, 
    lng: 127.7315, 
    character: '퓨', 
    missionType: MissionType.TEAM_NAMES, 
    missionTitle: '미션 2: 보물 찾기',
    missionDescription: '이 장소 주변에서 가장 오래된 것 같은 물건을 찾고, 그 물건의 이름을 적어주세요.',
    isCompleted: false
  },
  { 
    id: 3, 
    lat: 37.8850, 
    lng: 127.7290, 
    character: '터', 
    missionType: MissionType.GROUP_SHOT, 
    missionTitle: '미션 3: 단체 사진',
    missionDescription: '팀원 모두가 공중에 떠 있는(점프하는) 순간을 포착하여 단체 사진을 찍어주세요!',
    isCompleted: false
  },
  { 
    id: 4, 
    lat: 37.8835, 
    lng: 127.7320, 
    character: '육', 
    missionType: MissionType.GROUP_SHOT, 
    missionTitle: '미션 4: 글자 만들기',
    missionDescription: '주변의 자연물(돌, 나뭇가지, 잎 등)을 이용해 우리 팀 이름을 바닥에 만들고 사진을 찍어주세요.',
    isCompleted: false
  },
  { 
    id: 5, 
    lat: 37.8860, 
    lng: 127.7285, 
    character: '과', 
    missionType: MissionType.TEAM_NAMES, 
    missionTitle: '미션 5: TMI 방출',
    missionDescription: '팀원 중 한 명의 TMI(Too Much Information)를 알아내어 한 문장으로 적어주세요.',
    isCompleted: false
  },
  { 
    id: 6, 
    lat: 37.8855, 
    lng: 127.7330, 
    character: '엠', 
    missionType: MissionType.REELS, 
    missionTitle: '미션 6: 에너지 발산',
    missionDescription: '팀원 모두가 손을 맞잡고 둥글게 돌아가며 신나게 MT를 외치는 영상을 5초간 찍어주세요.',
    isCompleted: false
  },
  { 
    id: 7, 
    lat: 37.8840, 
    lng: 127.7295, 
    character: '티', 
    missionType: MissionType.GROUP_SHOT, 
    missionTitle: '미션 7: 별 만들기',
    missionDescription: '팀원 모두의 신발이 한가운데로 모이도록 별 모양을 만들어서 사진을 찍어주세요.',
    isCompleted: false
  },
  { 
    id: 8, 
    lat: 37.8830, 
    lng: 127.7305, 
    character: '최', 
    missionType: MissionType.TEAM_NAMES, 
    missionTitle: '미션 8: 저녁 메뉴',
    missionDescription: '이번 MT에서 가장 기대되는 저녁 메뉴 3가지를 팀원들과 합의하여 적어주세요.',
    isCompleted: false
  },
  { 
    id: 9, 
    lat: 37.8865, 
    lng: 127.7310, 
    character: '고', 
    missionType: MissionType.GROUP_SHOT, 
    missionTitle: '미션 9: 키 차이 샷',
    missionDescription: '팀에서 가장 키가 큰 사람과 작은 사람이 서로 등을 맞대고 재미있는 포즈로 사진을 찍어주세요.',
    isCompleted: false
  },
  { 
    id: 10, 
    lat: 37.8852, 
    lng: 127.7325, 
    character: '!', 
    missionType: MissionType.TEAM_NAMES, 
    missionTitle: '미션 10: 최종 정답',
    missionDescription: '지금까지 모은 모든 글자를 조합해 최종 정답을 완성하여 적어주세요!',
    isCompleted: false
  }
];