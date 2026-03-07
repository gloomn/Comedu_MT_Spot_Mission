import React, { useState, useEffect } from 'react';
import { Submission, Spot } from '../types';
import { Users, ClipboardList, CheckCircle, Clock, ArrowLeft, MapPin, Save, Crosshair } from 'lucide-react';

interface AdminDashboardProps {
  spots: Spot[];
  submissions: Submission[];
  activeTeams?: string[];
  onUpdateSpots: (newSpots: Spot[]) => void;
  userPos: {lat: number, lng: number} | null;
  onLogout: () => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ spots, submissions, activeTeams = [], onUpdateSpots, userPos, onLogout }) => {
  const [activeAdminTab, setActiveAdminTab] = useState<'STATUS' | 'SETTINGS'>('STATUS');
  const [localSpots, setLocalSpots] = useState<Spot[]>(spots);

  // 위치 실시간 동기화
  useEffect(() => {
    setLocalSpots(spots);
  }, [spots]);

  // 접속한 팀과 제출한 팀 병합
  const submittedTeams = submissions.map(s => s.teamName);
  const teams = Array.from(new Set([...activeTeams, ...submittedTeams]));

  const handleUpdateSpotLocation = (spotId: number) => {
    if (!userPos) {
      alert('GPS 신호를 가져오는 중입니다. 위치 권한을 허용했는지 확인해주세요.');
      return;
    }
    const updated = localSpots.map(s => 
      s.id === spotId ? { ...s, lat: userPos.lat, lng: userPos.lng } : s
    );
    setLocalSpots(updated);
    // 🟢 수정: 위치 갱신 시 안내 팝업 추가
    alert(`📍 ${spotId}번 스팟이 현재 내 위치로 변경되었습니다.\n\n(상단의 '전체 동기화' 버튼을 눌러야 최종 반영됩니다!)`);
  };

  const handleSaveAllSpots = () => {
    onUpdateSpots(localSpots);
    // 🟢 수정: 동기화 성공 시 안내 팝업 추가
    alert('✅ 모든 스팟의 위치가 참가자들의 앱에 실시간으로 동기화되었습니다!');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col pb-10">
      <header className="bg-slate-900 px-6 pt-12 pb-8 text-white rounded-b-3xl shadow-lg">
        <div className="flex justify-between items-start mb-4">
          <h1 className="text-2xl font-black">관리자 모드</h1>
          <button 
            onClick={onLogout} 
            className="flex items-center gap-1.5 text-xs font-bold bg-white/10 px-4 py-2 rounded-full hover:bg-white/20 transition-all border border-white/5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            처음으로
          </button>
        </div>
        
        <div className="flex bg-white/5 p-1 rounded-2xl mb-6">
          <button 
            onClick={() => setActiveAdminTab('STATUS')}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${activeAdminTab === 'STATUS' ? 'bg-white text-slate-900' : 'text-white/60'}`}
          >
            미션 현황
          </button>
          <button 
            onClick={() => setActiveAdminTab('SETTINGS')}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${activeAdminTab === 'SETTINGS' ? 'bg-white text-slate-900' : 'text-white/60'}`}
          >
            스팟 설정
          </button>
        </div>

        {activeAdminTab === 'STATUS' && (
          <div className="grid grid-cols-2 gap-4 animate-in fade-in duration-300">
            <div className="bg-white/10 p-4 rounded-2xl border border-white/10">
              <Users className="w-5 h-5 mb-1 text-indigo-400" />
              <p className="text-xs opacity-60">총 참여 팀</p>
              <p className="text-xl font-bold">{teams.length}</p>
            </div>
            <div className="bg-white/10 p-4 rounded-2xl border border-white/10">
              <CheckCircle className="w-5 h-5 mb-1 text-emerald-400" />
              <p className="text-xs opacity-60">총 미션 완료</p>
              <p className="text-xl font-bold">{submissions.length}</p>
            </div>
          </div>
        )}

        {activeAdminTab === 'SETTINGS' && (
          <div className="bg-indigo-500/20 border border-white/10 p-4 rounded-2xl animate-in fade-in duration-300">
            <div className="flex items-center gap-2 mb-1">
              <MapPin className="w-4 h-4 text-indigo-300" />
              <p className="text-xs font-bold">현재 내 위치 (GPS)</p>
            </div>
            {userPos ? (
              <p className="text-sm font-mono opacity-80">{userPos.lat.toFixed(6)}, {userPos.lng.toFixed(6)}</p>
            ) : (
              <p className="text-sm opacity-60 animate-pulse">위치 정보를 불러오는 중...</p>
            )}
          </div>
        )}
      </header>

      <main className="px-6 mt-8 space-y-6">
        {activeAdminTab === 'STATUS' ? (
          <>
            <h2 className="text-lg font-bold flex items-center gap-2"><ClipboardList className="w-5 h-5" /> 팀별 미션 현황</h2>
            {teams.length === 0 ? (
              <div className="bg-white p-10 rounded-3xl text-center text-slate-400 border border-slate-200 border-dashed">
                아직 제출된 미션이 없습니다.
              </div>
            ) : (
              teams.map(team => {
                const teamSubs = submissions.filter(s => s.teamName === team);
                return (
                  <div key={team} className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100">
                    <div className="flex items-center justify-between mb-4 border-b border-slate-50 pb-3">
                      <h3 className="font-bold text-slate-800 text-lg">{team} 팀</h3>
                      <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">
                        {teamSubs.length} / 10 완료
                      </span>
                    </div>
                    <div className="space-y-4">
                      {teamSubs.length === 0 ? (
                        <p className="text-xs text-slate-400 text-center py-4">아직 제출된 미션이 없습니다.</p>
                      ) : (
                        teamSubs.map((sub, idx) => (
                          <div key={idx} className="flex gap-4 items-start bg-slate-50 p-3 rounded-2xl">
                            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-xs font-black shadow-sm flex-shrink-0">
                              S{sub.spotId}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex justify-between items-center mb-1">
                                <p className="text-xs font-bold text-slate-700 truncate">{sub.missionType}</p>
                                <div className="flex items-center gap-1 text-[9px] text-slate-400">
                                  <Clock className="w-3 h-3" />
                                  {new Date(sub.timestamp).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
                                </div>
                              </div>
                              {sub.mediaUrl ? (
                                <div className="mt-2">
                                  {sub.mediaUrl.match(/\.(mp4|webm|mov|ogg|m4v)$/i) || sub.mediaUrl.startsWith('data:video') ? (
                                    <video src={sub.mediaUrl} controls className="w-full rounded-xl max-h-40 bg-black" />
                                  ) : (
                                    <img src={sub.mediaUrl} className="w-full h-32 object-cover rounded-xl shadow-sm" />
                                  )}
                                </div>
                              ) : sub.content ? (
                                <p className="text-xs text-slate-500 bg-white p-2 rounded-lg border border-slate-100 italic">"{sub.content}"</p>
                              ) : (
                                <p className="text-xs text-emerald-600 font-bold">글자 획득 완료</p>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </>
        ) : (
          <>
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-bold flex items-center gap-2"><MapPin className="w-5 h-5" /> 스팟 위치 관리</h2>
              <button 
                onClick={handleSaveAllSpots}
                className="flex items-center gap-1.5 bg-indigo-600 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-lg shadow-indigo-200"
              >
                <Save className="w-3.5 h-3.5" />
                전체 동기화
              </button>
            </div>
            
            <p className="text-xs text-slate-500 bg-slate-100 p-3 rounded-xl border border-slate-200 leading-relaxed">
              각 미션 장소(스팟)로 직접 이동한 뒤, <strong>'과녁'</strong> 버튼을 눌러 GPS를 찍으세요. 마지막으로 <strong>'전체 동기화'</strong>를 누르면 모든 참가자의 앱에 즉시 적용됩니다.
            </p>

            <div className="space-y-3">
              {localSpots.map((spot) => (
                <div key={spot.id} className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center font-black text-xs">
                      {spot.id}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-800">SPOT {spot.id} ({spot.character})</p>
                      <p className="text-[10px] font-mono text-slate-400 leading-none mt-1">
                        {spot.lat.toFixed(5)}, {spot.lng.toFixed(5)}
                      </p>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleUpdateSpotLocation(spot.id)}
                    className="p-3 bg-slate-50 text-slate-600 rounded-xl hover:bg-indigo-50 hover:text-indigo-600 transition-colors border border-slate-100"
                  >
                    <Crosshair className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default AdminDashboard;