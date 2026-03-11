import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import { INITIAL_SPOTS, ADMIN_PASSWORD, MISSION_RADIUS_METERS, getDistance } from './constants';
import { Spot, AppState, ViewType, TabType, Submission, MissionType } from './types';
import Envelope from './components/Envelope';
import MissionModal from './components/MissionModal';
import Notepad from './components/Notepad';
import AdminDashboard from './components/AdminDashboard';
import { Trophy, MapPin, Stars, User, ShieldCheck, LayoutGrid, StickyNote, Home, Info, LogOut, Users } from 'lucide-react';

const socket = io('/', { autoConnect: true });

const App: React.FC = () => {
  const [view, setView] = useState<ViewType>('LANDING');
  const [tab, setTab] = useState<TabType>('HOME');
  const [role, setRole] = useState<'PARTICIPANT' | 'ADMIN' | 'GUEST'>('GUEST');
  
  const [teamName, setTeamName] = useState('');
  const [teamPass, setTeamPass] = useState(''); 
  const [adminPass, setAdminPass] = useState('');
  
  const [spots, setSpots] = useState<Spot[]>(INITIAL_SPOTS);
  const [submissions, setSubmissions] = useState<Submission[]>([]); 
  const [activeTeams, setActiveTeams] = useState<string[]>([]);
  const [memo, setMemo] = useState<string>('');
  const [allMemos, setAllMemos] = useState<Record<string, string>>({});
  const [selectedSpot, setSelectedSpot] = useState<Spot | null>(null);
  const [userPos, setUserPos] = useState<{lat: number, lng: number} | null>(null);
  
  const [gpsErrorMsg, setGpsErrorMsg] = useState<string>('GPS 대기중...');
  const [showLocationModal, setShowLocationModal] = useState<boolean>(false);

  const saveToLocal = (updatedMemo: string, currentRole: any, currentTeam: string, currentPass: string) => {
    const state = { memo: updatedMemo, role: currentRole, teamName: currentTeam, teamPass: currentPass };
    localStorage.setItem('spotMissionState', JSON.stringify(state));
  };

  const handleLogout = () => {
    localStorage.removeItem('spotMissionState');
    setRole('GUEST');
    setView('LANDING');
    setTeamName('');
    setTeamPass('');
    setAdminPass('');
  };

  useEffect(() => {
    if (!localStorage.getItem('locationModalSeen')) {
      setShowLocationModal(true);
    }

    const saved = localStorage.getItem('spotMissionState');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.role !== 'GUEST') {
          setRole(parsed.role);
          setTeamName(parsed.teamName || '');
          setTeamPass(parsed.teamPass || '');
          setMemo(parsed.memo || '');
          setView(parsed.role === 'ADMIN' ? 'ADMIN_PANEL' : 'DASHBOARD');
          
          if (parsed.role === 'PARTICIPANT') {
            socket.emit('join_team', { teamName: parsed.teamName, password: parsed.teamPass }, (res: any) => {
              if (res && !res.success) {
                alert('세션이 만료되었거나 비밀번호가 변경되었습니다. 다시 로그인해주세요.');
                handleLogout();
              }
            });
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
      
      if (data.memos) {
        setAllMemos(data.memos);
        if (teamName && data.memos[teamName] !== undefined) {
          setMemo(data.memos[teamName]);
          saveToLocal(data.memos[teamName], role, teamName, teamPass);
        }
      }
      
    });

    socket.on('teams_updated', (teams: string[]) => setActiveTeams(teams));
    socket.on('spots_updated', (newSpots: Spot[]) => setSpots(newSpots));
    socket.on('submissions_updated', (newSubs: Submission[]) => {
      setSubmissions(newSubs);
      setSelectedSpot(prev => {
        if (!prev) return null;
        const isNowCompleted = newSubs.some(sub => sub.teamName === teamName && sub.spotId === prev.id);
        return { ...prev, isCompleted: isNowCompleted };
      });
    });

    socket.on('memo_updated', (data: { teamName: string, memo: string }) => {
      setAllMemos(prev => ({ ...prev, [data.teamName]: data.memo }));
      if (data.teamName === teamName) {
        setMemo(data.memo);
        saveToLocal(data.memo, role, teamName, teamPass);
      }
    });

    // 🟢 추가: 강제 로그아웃 신호를 받았을 때
    socket.on('force_logout', (message: string) => {
      alert(message);
      handleLogout(); // 현재 기기 정보 초기화 및 랜딩 화면으로 쫓아냄
    });

    let watcherId: number | null = null;
    if (navigator.geolocation) {
      watcherId = navigator.geolocation.watchPosition(
        (pos) => {
          setUserPos({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          setGpsErrorMsg(''); 
        },
        (err) => {
          console.warn("GPS Error:", err);
          if (err.code === 1) setGpsErrorMsg('위치 권한 차단됨');
          else if (err.code === 2) setGpsErrorMsg('GPS 신호 없음(실내)');
          else if (err.code === 3) setGpsErrorMsg('GPS 시간 초과');
          else setGpsErrorMsg('GPS 오류 발생');
        },
        { 
          enableHighAccuracy: true, 
          maximumAge: 5000,     
          timeout: 15000        
        }
      );
    } else {
      setGpsErrorMsg('GPS 지원 안하는 기기');
    }

    return () => {
      if (watcherId !== null) navigator.geolocation.clearWatch(watcherId);
      socket.off('init');
      socket.off('teams_updated');
      socket.off('spots_updated');
      socket.off('submissions_updated');
      socket.off('memo_updated');
      socket.off('force_logout'); // 이벤트 정리
    };
  }, [teamName, role, teamPass]);

  const handleAcceptLocation = () => {
    localStorage.setItem('locationModalSeen', 'true');
    setShowLocationModal(false);
    
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        () => {}, 
        () => {}, 
        { enableHighAccuracy: true }
      );
    }
  };

  const handleDeleteTeam = (teamNameToDelete: string) => {
    if (window.confirm(`정말 '${teamNameToDelete}' 팀을 삭제하시겠습니까?\n해당 팀의 미션 제출 기록과 메모가 모두 영구 삭제됩니다.`)) {
      socket.emit('delete_team', teamNameToDelete);
    }
  };

  const handleJoinParticipant = () => {
    const trimmedTeamName = teamName.trim();
    if (!trimmedTeamName) return alert('팀 이름을 입력해주세요.');
    if (!teamPass) return alert('팀 비밀번호를 입력해주세요.');

    socket.emit('join_team', { teamName: trimmedTeamName, password: teamPass }, (res: any) => {
      if (res && res.success) {
        setTeamName(trimmedTeamName);
        setRole('PARTICIPANT');
        setView('DASHBOARD');
        saveToLocal(memo, 'PARTICIPANT', trimmedTeamName, teamPass);
      } else {
        alert(res ? res.message : '서버 오류가 발생했습니다.');
      }
    });
  };

  const handleJoinAdmin = () => {
    if (adminPass === ADMIN_PASSWORD) {
      setRole('ADMIN');
      setView('ADMIN_PANEL');
      saveToLocal(memo, 'ADMIN', 'ADMIN', '');
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

  const leaderboard = Array.from(new Set([...activeTeams, ...submissions.map(s => s.teamName)]))
    .map(team => ({
      team,
      completed: submissions.filter(s => s.teamName === team).length
    }))
    .sort((a, b) => b.completed - a.completed);

  return (
    <>
      {showLocationModal && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-6 bg-slate-900/80 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl animate-in zoom-in duration-300">
            <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
              <MapPin className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-black text-center text-slate-800 mb-4">위치 권한 허용 안내</h2>
            <div className="text-sm text-center text-slate-600 mb-8 leading-relaxed space-y-2">
              <p>스팟 미션을 진행하려면 <strong>현재 위치(GPS)</strong> 정보가 반드시 필요합니다.</p>
              <p className="text-xs bg-slate-50 p-3 rounded-xl text-slate-500">
                다음 화면에서 브라우저가 위치 권한을 요청하면 <br/>
                반드시 <strong className="text-indigo-600">"허용"</strong>을 선택해 주세요!
              </p>
            </div>
            <button 
              onClick={handleAcceptLocation}
              className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black text-lg shadow-xl shadow-indigo-200 hover:bg-indigo-700 active:scale-95 transition-all"
            >
              확인 및 권한 허용하기
            </button>
          </div>
        </div>
      )}

      {view === 'LANDING' && (
        <div className="min-h-screen max-w-md mx-auto bg-indigo-600 flex flex-col items-center justify-center p-8 text-white relative overflow-hidden">
          <img 
  src="logo.png" 
  alt="background effect" 
  className="absolute -right-10 -top-10 w-64 h-64 opacity-10 animate-pulse object-contain pointer-events-none" 
/>
          <div className="relative z-10 w-full space-y-12">
            <div className="text-center flex flex-col items-center">
              {/* 🟢 추가된 서브타이틀 */}
              <p className="text-xs font-bold text-indigo-200 mb-1.5 tracking-widest">연결의 중심에서 .COM</p>
              <span className="text-sm font-bold opacity-80 uppercase tracking-widest mb-1">2026 COMEDU MT</span>
              <h1 className="text-5xl font-black tracking-tighter uppercase">SPOT-MISSION</h1>
            </div>

            <div className="space-y-4">
              <div className="bg-white/10 backdrop-blur-lg p-6 rounded-3xl border border-white/20 space-y-4">
                <div className="flex justify-between items-center">
                  <h2 className="flex items-center gap-2 font-bold text-lg"><User className="w-5 h-5" /> 참여자 입장</h2>
                </div>
                
                <div>
                  <input 
                    placeholder="팀 이름을 자유롭게 입력하세요"
                    className="w-full bg-white/20 border border-white/10 rounded-2xl p-4 text-white placeholder-indigo-200 outline-none focus:ring-2 focus:ring-white/30 font-bold"
                    value={teamName}
                    onChange={e => setTeamName(e.target.value)}
                  />
                  
                  <input 
                    type="password"
                    placeholder="새로운 비밀번호(숫자 4자리)"
                    className="w-full bg-white/20 border border-white/10 rounded-2xl p-4 text-white placeholder-indigo-200 outline-none focus:ring-2 focus:ring-white/30 font-bold mt-3"
                    value={teamPass}
                    onChange={e => setTeamPass(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleJoinParticipant()}
                  />
                  <p className="text-[10px] text-indigo-200 ml-1 mt-1">* 처음 등록 시 입력한 번호가 해당 팀의 비밀번호가 됩니다.</p>
                  
                  {activeTeams.length > 0 && (
                    <div className="mt-4">
                      <p className="text-[10px] text-indigo-200 mb-1.5 ml-1">👇 현재 활동 중인 팀 (터치하여 선택)</p>
                      <div className="flex flex-wrap gap-2">
                        {activeTeams.map(team => (
                          <button
                            key={team}
                            onClick={() => {
                              setTeamName(team);
                              setTeamPass(''); 
                            }}
                            className={`text-[11px] font-bold px-3 py-1.5 rounded-full text-white transition-colors border active:scale-95 ${
                              teamName === team ? 'bg-indigo-500 border-indigo-400' : 'bg-white/10 hover:bg-white/20 border-white/20'
                            }`}
                          >
                            {team}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <button onClick={handleJoinParticipant} className="w-full bg-white text-indigo-600 py-4 rounded-2xl font-black text-lg shadow-xl hover:bg-indigo-50 transition-colors mt-2">
                  입장하기
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
          {/* 🟢 추가된 개발자 크레딧 (푸터) */}
          <div className="relative z-10 mt-8 mb-4 text-center text-[10px] text-indigo-200/60 font-medium tracking-widest space-y-1">
            <p>Designed by Park Jun Hye</p>
            <p>Built by Lee Ki Joon</p>
          </div>
        </div>
      )}

      {view === 'ADMIN_PANEL' && (
        <AdminDashboard 
          spots={spots} 
          submissions={submissions}
          activeTeams={Array.from(new Set([...activeTeams, ...submissions.map(s => s.teamName)]))} 
          onUpdateSpots={handleUpdateSpots} 
          userPos={userPos} 
          onLogout={handleLogout}
          onDeleteTeam={handleDeleteTeam}
          memos={allMemos}
        />
      )}

      {view === 'DASHBOARD' && (
        <div className="min-h-screen max-w-md mx-auto bg-slate-50 flex flex-col pb-24">
          <header className="bg-indigo-600 px-6 pt-12 pb-8 rounded-b-[2.5rem] shadow-xl text-white relative overflow-hidden">
            <img 
  src="logo.png" 
  alt="background effect" 
  className="absolute -right-4 -top-4 w-40 h-40 text-indigo-500 opacity-30"
/>
            <div className="relative z-10">
              <div className="flex justify-between items-center mb-4">
                 <div className="flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-amber-300" />
                    <span className="text-indigo-200 text-[10px] font-black uppercase tracking-widest">{teamName} TEAM</span>
                 </div>
                 <div className="flex items-center gap-3">
                   {!userPos && <span className="text-[10px] bg-red-500/30 px-2 py-1 rounded-full animate-pulse">{gpsErrorMsg}</span>}
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
                      spotName={spot.customName}
                      isOpen={completed}
                      isNearby={isNearby(spot)}
                      distance={getSpotDistance(spot)}
                      onClick={() => {
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
                            setSelectedSpot({ ...spot, isCompleted: true }); 
                          } else {
                            setSelectedSpot({ ...spot, isCompleted: false });
                          }
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
                  saveToLocal(val, role, teamName, teamPass);
                  socket.emit('update_memo', { teamName, memo: val });
                }} 
                onSave={() => {
                  socket.emit('update_memo', { teamName, memo });
                }} 
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
      )}
    </>
  );
};

export default App;