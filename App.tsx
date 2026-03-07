import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import { INITIAL_SPOTS, ADMIN_PASSWORD, MISSION_RADIUS_METERS, getDistance } from './constants';
import { Spot, AppState, ViewType, TabType, Submission, MissionType } from './types';
import Envelope from './components/Envelope';
import MissionModal from './components/MissionModal';
import Notepad from './components/Notepad';
import AdminDashboard from './components/AdminDashboard';
import { Trophy, MapPin, Stars, User, ShieldCheck, LayoutGrid, StickyNote, Home, Info, LogOut, Users } from 'lucide-react';

// 🟢 이렇게 수정해야 외부 접속 시에도 현재 도메인을 따라가고, Proxy를 통해 3567 포트 백엔드와 연결됩니다.
const socket = io('/', { autoConnect: false });

const App: React.FC = () => {
  const [view, setView] = useState<ViewType>('LANDING');
  const [tab, setTab] = useState<TabType>('HOME');
  const [role, setRole] = useState<'PARTICIPANT' | 'ADMIN' | 'GUEST'>('GUEST');
  const [teamName, setTeamName] = useState('');
  const [adminPass, setAdminPass] = useState('');
  
  const [spots, setSpots] = useState<Spot[]>(INITIAL_SPOTS);
  const [submissions, setSubmissions] = useState<Submission[]>([]); 
  const [activeTeams, setActiveTeams] = useState<string[]>([]);
  const [memo, setMemo] = useState<string>('');
  
  const [selectedSpot, setSelectedSpot] = useState<Spot | null>(null);
  const [userPos, setUserPos] = useState<{lat: number, lng: number} | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('spotMissionState');
    if (saved) {
      try {
        const parsed: AppState = JSON.parse(saved);
        if (parsed.role !== 'GUEST') {
          setRole(parsed.role);
          setTeamName(parsed.teamName);
          setMemo(parsed.memo);
          setView(parsed.role === 'ADMIN' ? 'ADMIN_PANEL' : 'DASHBOARD');
          
          if (parsed.role === 'PARTICIPANT') {
            socket.emit('join_team', parsed.teamName);
          }
        }
      } catch (e) {
        console.error("Failed to parse saved state", e);
      }
    }

    socket.on('init', (data) => {
      if (data.spots && data.spots.length > 0) {
        setSpots(data.spots);
      } else {
        socket.emit('update_spots', INITIAL_SPOTS);
      }
      setSubmissions(data.submissions || []);
      setActiveTeams(data.teams || []);
    });

    socket.on('teams_updated', (teams: string[]) => setActiveTeams(teams));
    socket.on('spots_updated', (newSpots: Spot[]) => setSpots(newSpots));
    socket.on('submissions_updated', (newSubs: Submission[]) => {
      setSubmissions(newSubs);
      // 모달이 열려있을 때 즉각 상태 반영
      setSelectedSpot(prev => {
        if (!prev) return null;
        const isNowCompleted = newSubs.some(sub => sub.teamName === teamName && sub.spotId === prev.id);
        return { ...prev, isCompleted: isNowCompleted };
      });
    });

    if (navigator.geolocation) {
      const watcher = navigator.geolocation.watchPosition(
        (pos) => setUserPos({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        (err) => console.warn(err),
        { enableHighAccuracy: true }
      );
      return () => {
        navigator.geolocation.clearWatch(watcher);
        socket.off('init');
        socket.off('teams_updated');
        socket.off('spots_updated');
        socket.off('submissions_updated');
      };
    }
  }, [teamName]);

  const saveToLocal = (updatedMemo: string, currentRole: any, currentTeam: string) => {
    const state: AppState = { spots: [], memo: updatedMemo, role: currentRole, teamName: currentTeam };
    localStorage.setItem('spotMissionState', JSON.stringify(state));
  };

  const handleLogout = () => {
    localStorage.removeItem('spotMissionState');
    setRole('GUEST');
    setView('LANDING');
    setTeamName('');
    setAdminPass('');
  };

  const handleJoinParticipant = () => {
    if (!teamName.trim()) return alert('팀 이름을 입력해주세요.');
    setRole('PARTICIPANT');
    setView('DASHBOARD');
    saveToLocal(memo, 'PARTICIPANT', teamName);
    socket.emit('join_team', teamName);
  };

  const handleJoinAdmin = () => {
    if (adminPass === ADMIN_PASSWORD) {
      setRole('ADMIN');
      setView('ADMIN_PANEL');
      saveToLocal(memo, 'ADMIN', 'ADMIN');
    } else {
      alert('비밀번호가 틀렸습니다.');
    }
  };

  const handleMissionComplete = (spotId: number, submission?: Partial<Submission>) => {
    if (submission) {
      socket.emit('add_submission', submission);
    } else {
      socket.emit('add_submission', {
        teamName,
        spotId,
        missionType: 'NONE',
        timestamp: Date.now()
      });
    }
  };

  const handleUpdateSpots = (newSpots: Spot[]) => {
    socket.emit('update_spots', newSpots); 
  };

  const isNearby = (spot: Spot) => {
    if (!userPos) return false;
    const dist = getDistance(userPos.lat, userPos.lng, spot.lat, spot.lng);
    return dist <= MISSION_RADIUS_METERS;
  };

  const getSpotDistance = (spot: Spot) => {
    if (!userPos) return undefined;
    return getDistance(userPos.lat, userPos.lng, spot.lat, spot.lng);
  };

  const checkIsCompleted = (spotId: number) => {
    return submissions.some(sub => sub.teamName === teamName && sub.spotId === spotId);
  };

  const myTeamSubmissionsCount = submissions.filter(sub => sub.teamName === teamName).length;

  // 🟢 실시간 미션 현황 (리더보드) 데이터
  const leaderboard = Array.from(new Set([...activeTeams, ...submissions.map(s => s.teamName)]))
    .map(team => ({
      team,
      completed: submissions.filter(s => s.teamName === team).length
    }))
    .sort((a, b) => b.completed - a.completed);

  if (view === 'LANDING') {
    return (
      <div className="min-h-screen max-w-md mx-auto bg-indigo-600 flex flex-col items-center justify-center p-8 text-white relative overflow-hidden">
        <Stars className="absolute -right-10 -top-10 w-64 h-64 text-white opacity-10 animate-pulse" />
        <div className="relative z-10 w-full space-y-12">
          <div className="text-center flex flex-col items-center">
            <Trophy className="w-16 h-16 text-amber-300 mb-4" />
            <span className="text-sm font-bold opacity-80 uppercase tracking-widest mb-1">2026 COMEDU MT</span>
            <h1 className="text-5xl font-black tracking-tighter uppercase">SPOT-MISSION</h1>
          </div>

          <div className="space-y-4">
            <div className="bg-white/10 backdrop-blur-lg p-6 rounded-3xl border border-white/20 space-y-4">
              <h2 className="flex items-center gap-2 font-bold text-lg"><User className="w-5 h-5" /> 참여자 입장</h2>
              <input 
                placeholder="팀 이름을 입력하세요"
                className="w-full bg-white/20 border-none rounded-2xl p-4 text-white placeholder-indigo-200 outline-none focus:ring-2 focus:ring-white/30"
                value={teamName}
                onChange={e => setTeamName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleJoinParticipant()}
              />
              <button onClick={handleJoinParticipant} className="w-full bg-white text-indigo-600 py-4 rounded-2xl font-black text-lg shadow-xl hover:bg-indigo-50 transition-colors">
                시작하기
              </button>
            </div>

            <div className="bg-white/5 backdrop-blur-lg p-6 rounded-3xl border border-white/10 space-y-4">
              <h2 className="flex items-center gap-2 font-bold opacity-80"><ShieldCheck className="w-5 h-5" /> 관리자 로그인</h2>
              <input 
                type="password"
                placeholder="관리자 패스워드"
                className="w-full bg-white/10 border-none rounded-2xl p-4 text-white placeholder-indigo-300 outline-none focus:ring-2 focus:ring-white/20"
                value={adminPass}
                onChange={e => setAdminPass(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleJoinAdmin()}
              />
              <button onClick={handleJoinAdmin} className="w-full bg-indigo-900/40 text-white/80 py-4 rounded-2xl font-bold border border-white/10">
                관리자 입장
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (view === 'ADMIN_PANEL') {
    return <AdminDashboard 
      spots={spots} 
      submissions={submissions}
      activeTeams={Array.from(new Set([...activeTeams, ...submissions.map(s => s.teamName)]))} 
      onUpdateSpots={handleUpdateSpots} 
      userPos={userPos} 
      onLogout={handleLogout} 
    />;
  }

  return (
    <div className="min-h-screen max-w-md mx-auto bg-slate-50 flex flex-col pb-24">
      <header className="bg-indigo-600 px-6 pt-12 pb-8 rounded-b-[2.5rem] shadow-xl text-white relative overflow-hidden">
        <Stars className="absolute -right-4 -top-4 w-32 h-32 text-indigo-500 opacity-30" />
        <div className="relative z-10">
          <div className="flex justify-between items-center mb-4">
             <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-amber-300" />
                <span className="text-indigo-200 text-[10px] font-black uppercase tracking-widest">{teamName} TEAM</span>
             </div>
             <div className="flex items-center gap-3">
               {!userPos && <span className="text-[10px] bg-red-500/30 px-2 py-1 rounded-full animate-pulse">GPS 대기중</span>}
               <button onClick={handleLogout} className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors">
                 <LogOut className="w-4 h-4 text-white" />
               </button>
             </div>
          </div>
          <h1 className="text-2xl font-black">
            {tab === 'HOME' ? '미션 현황' : tab === 'MISSION' ? '스팟 리스트' : '메모장'}
          </h1>
        </div>
      </header>

      <main className="flex-1 px-6 mt-6">
        {tab === 'HOME' && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-400 mb-1">우리 팀 진행률</p>
                <h2 className="text-4xl font-black text-slate-800">{myTeamSubmissionsCount * 10}%</h2>
              </div>
              <div className="relative w-24 h-24">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="42" stroke="currentColor" strokeWidth="10" fill="transparent" className="text-slate-100" />
                  <circle 
                    cx="50" cy="50" r="42" stroke="currentColor" strokeWidth="10" fill="transparent" 
                    strokeDasharray="263.89" 
                    strokeDashoffset={263.89 - (263.89 * (myTeamSubmissionsCount / 10))} 
                    className="text-indigo-500 transition-all duration-1000"
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-slate-600">
                  {myTeamSubmissionsCount}/10
                </div>
              </div>
            </div>

            {/* 🟢 실시간 팀 미션 현황 추가 */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
               <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
                 <Users className="w-4 h-4 text-indigo-500" /> 실시간 팀 현황
               </h3>
               {leaderboard.length === 0 ? (
                 <p className="text-xs text-slate-400 text-center">아직 접속한 팀이 없습니다.</p>
               ) : (
                 <div className="space-y-3">
                   {leaderboard.map((item, index) => (
                     <div key={item.team} className="flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-100">
                       <div className="flex items-center gap-3">
                         <span className={`text-xs font-black w-5 h-5 flex items-center justify-center rounded-full ${index === 0 ? 'bg-amber-100 text-amber-600' : index === 1 ? 'bg-slate-200 text-slate-600' : index === 2 ? 'bg-orange-100 text-orange-600' : 'text-slate-400'}`}>
                           {index + 1}
                         </span>
                         <span className={`text-sm font-bold ${item.team === teamName ? 'text-indigo-600' : 'text-slate-700'}`}>
                           {item.team} {item.team === teamName && '(우리 팀)'}
                         </span>
                       </div>
                       <div className="flex items-center gap-2">
                         <div className="w-16 h-2 bg-slate-200 rounded-full overflow-hidden">
                           <div className="h-full bg-indigo-500 transition-all duration-500" style={{ width: `${item.completed * 10}%` }}></div>
                         </div>
                         <span className="text-xs font-bold text-slate-500 w-6 text-right">{item.completed}/10</span>
                       </div>
                     </div>
                   ))}
                 </div>
               )}
            </div>
            
            <div className="bg-white border border-slate-200 rounded-3xl p-6">
               <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2"><Info className="w-4 h-4 text-indigo-500" /> 알아두세요</h3>
               <p className="text-xs text-slate-500 leading-relaxed">
                 지도상의 스팟에 50m 이내로 접근해야 봉투를 열 수 있습니다. <br/><br/>
                 미션을 완료할 때마다 스팟에 숨겨진 <strong>'글자'</strong>를 획득하게 됩니다. 10개 스팟에 숨겨진 글자들을 모두 모아 팀 메모장에 기록하고 최종 정답을 완성하세요!
               </p>
            </div>
          </div>
        )}

        {tab === 'MISSION' && (
          <div className="grid grid-cols-2 gap-4 animate-in fade-in duration-500">
            {spots.map((spot) => {
              const completed = checkIsCompleted(spot.id);
              return (
                <Envelope
                  key={spot.id}
                  spotId={spot.id}
                  isOpen={completed}
                  isNearby={isNearby(spot)}
                  distance={getSpotDistance(spot)}
                  onClick={() => {
                    // 🟢 짜증나는 alert 모두 제거. 모달창만 띄움.
                    if (completed) {
                      setSelectedSpot({ ...spot, isCompleted: true });
                    } else if (isNearby(spot)) {
                      if (spot.missionType === MissionType.NONE) {
                        handleMissionComplete(spot.id, {
                          teamName,
                          spotId: spot.id,
                          missionType: MissionType.NONE,
                          timestamp: Date.now()
                        });
                        setSelectedSpot({ ...spot, isCompleted: true }); // 완료 즉시 글자 팝업용 모달 오픈
                      } else {
                        setSelectedSpot({ ...spot, isCompleted: false });
                      }
                    } else {
                      // 위치가 멀 때 아무것도 안 하거나 조용히 처리 (alert X)
                    }
                  }}
                />
              );
            })}
          </div>
        )}

        {tab === 'MEMO' && (
          <Notepad 
            memo={memo} 
            onMemoChange={(val) => {
              setMemo(val);
              saveToLocal(val, role, teamName);
            }} 
            onSave={() => {}} // 🟢 메모장 저장 시 뜨던 alert도 제거
          />
        )}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-xl border-t border-slate-200 px-8 py-4 flex justify-between items-center z-40 max-w-md mx-auto rounded-t-3xl shadow-2xl">
        <button onClick={() => setTab('HOME')} className={`flex flex-col items-center gap-1 transition-colors ${tab === 'HOME' ? 'text-indigo-600' : 'text-slate-400 hover:text-indigo-400'}`}>
          <Home className="w-6 h-6" />
          <span className="text-[10px] font-bold">홈</span>
        </button>
        <button onClick={() => setTab('MISSION')} className={`flex flex-col items-center gap-1 transition-colors ${tab === 'MISSION' ? 'text-indigo-600' : 'text-slate-400 hover:text-indigo-400'}`}>
          <LayoutGrid className="w-6 h-6" />
          <span className="text-[10px] font-bold">미션</span>
        </button>
        <button onClick={() => setTab('MEMO')} className={`flex flex-col items-center gap-1 transition-colors ${tab === 'MEMO' ? 'text-indigo-600' : 'text-slate-400 hover:text-indigo-400'}`}>
          <StickyNote className="w-6 h-6" />
          <span className="text-[10px] font-bold">메모</span>
        </button>
      </nav>

      {selectedSpot && (
        <MissionModal
          spot={selectedSpot}
          teamName={teamName}
          onClose={() => setSelectedSpot(null)}
          onComplete={handleMissionComplete}
        />
      )}
    </div>
  );
};

export default App;