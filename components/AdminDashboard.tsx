import React, { useState, useEffect } from 'react';
import { Submission, Spot } from '../types';
// 🟢 수정: StickyNote 아이콘 추가
import { Users, ClipboardList, CheckCircle, Clock, ArrowLeft, MapPin, Save, Crosshair, Map, Trash2, StickyNote } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface AdminDashboardProps {
  spots: Spot[];
  submissions: Submission[];
  activeTeams?: string[];
  onUpdateSpots: (newSpots: Spot[]) => void;
  userPos: {lat: number, lng: number} | null;
  onLogout: () => void;
  onDeleteTeam: (teamName: string) => void;
  memos: Record<string, string>; // 🟢 추가: 모든 팀의 메모 데이터
}

const createSpotIcon = (id: number) => L.divIcon({
  className: 'custom-spot-icon',
  html: `<div style="background-color: #4f46e5; width: 26px; height: 26px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 13px;">${id}</div>`,
  iconSize: [26, 26],
  iconAnchor: [13, 13]
});

const userIcon = L.divIcon({
  className: 'custom-user-icon',
  html: `<div style="background-color: #ef4444; width: 14px; height: 14px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
  iconSize: [14, 14],
  iconAnchor: [7, 7]
});

const AdminDashboard: React.FC<AdminDashboardProps> = ({ spots, submissions, activeTeams = [], onUpdateSpots, userPos, onLogout, onDeleteTeam, memos }) => {
  const [activeAdminTab, setActiveAdminTab] = useState<'STATUS' | 'SETTINGS'>('STATUS');
  const [localSpots, setLocalSpots] = useState<Spot[]>(spots);

  useEffect(() => {
    setLocalSpots(spots);
  }, [spots]);

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
    alert(`📍 ${spotId}번 스팟이 현재 내 위치로 변경되었습니다.\n\n(상단의 '전체 동기화' 버튼을 눌러야 최종 반영됩니다!)`);
  };

  const handleSaveAllSpots = () => {
    onUpdateSpots(localSpots);
    alert('✅ 스팟의 이름과 위치가 영구 저장되었으며, 참가자들에게 동기화되었습니다!');
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
            <h2 className="text-lg font-bold flex items-center gap-2"><ClipboardList className="w-5 h-5" /> 팀별 현황</h2>
            {teams.length === 0 ? (
              <div className="bg-white p-10 rounded-3xl text-center text-slate-400 border border-slate-200 border-dashed">
                아직 접속한 팀이 없습니다.
              </div>
            ) : (
              teams.map(team => {
                const teamSubs = submissions.filter(s => s.teamName === team);
                return (
                  <div key={team} className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100">
                    <div className="flex items-center justify-between mb-4 border-b border-slate-50 pb-3">
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-slate-800 text-lg">{team} 팀</h3>
                        <button 
                          onClick={() => onDeleteTeam(team)}
                          className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="팀 삭제"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">
                        미션 {teamSubs.length}/10
                      </span>
                    </div>

                    {/* 🟢 추가: 관리자가 팀들의 메모를 실시간으로 볼 수 있는 뷰어 */}
                    <div className="mb-4 bg-amber-50 rounded-2xl p-4 border border-amber-100/50 relative overflow-hidden">
                      <div className="flex items-center gap-2 mb-2 text-amber-800">
                        <StickyNote className="w-4 h-4" />
                        <h4 className="text-xs font-bold">실시간 팀 메모장</h4>
                      </div>
                      <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed font-medium">
                        {memos[team] ? memos[team] : <span className="text-slate-400 italic">아직 작성된 메모가 없습니다.</span>}
                      </p>
                    </div>

                    <div className="space-y-4">
                      {teamSubs.length === 0 ? (
                        <p className="text-xs text-slate-400 text-center py-4">아직 제출된 미션이 없습니다.</p>
                      ) : (
                        teamSubs.map((sub, idx) => (
                          <div key={idx} className="flex gap-4 items-start bg-slate-50 p-3 rounded-2xl border border-slate-100">
                            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-xs font-black shadow-sm flex-shrink-0 text-slate-700">
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
                                    <img src={sub.mediaUrl} className="w-full h-32 object-cover rounded-xl shadow-sm border border-slate-200" />
                                  )}
                                </div>
                              ) : sub.content ? (
                                <p className="text-xs text-slate-600 bg-white p-2.5 rounded-lg border border-slate-100 font-medium">"{sub.content}"</p>
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
              <h2 className="text-lg font-bold flex items-center gap-2"><MapPin className="w-5 h-5" /> 스팟 관리</h2>
              <button 
                onClick={handleSaveAllSpots}
                className="flex items-center gap-1.5 bg-indigo-600 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-lg shadow-indigo-200 hover:bg-indigo-700 active:scale-95"
              >
                <Save className="w-3.5 h-3.5" />
                전체 동기화
              </button>
            </div>
            
            <p className="text-xs text-slate-500 bg-slate-100 p-3 rounded-xl border border-slate-200 leading-relaxed">
              이름을 수정하거나 <strong>'과녁'</strong>을 눌러 GPS를 찍으세요. 변경 후 상단의 <strong>'전체 동기화'</strong>를 눌러야 저장됩니다.
            </p>

            <div className="space-y-3 max-h-64 overflow-y-auto no-scrollbar pb-2">
              {localSpots.map((spot) => (
                <div key={spot.id} className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center font-black text-xs shrink-0">
                      {spot.id}
                    </div>
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <input 
                          type="text"
                          placeholder={`SPOT ${spot.id}`}
                          className="text-sm font-bold text-indigo-700 bg-indigo-50/50 border border-slate-200 rounded px-2 py-0.5 outline-none focus:border-indigo-400 focus:bg-white w-28"
                          value={spot.customName || ''}
                          onChange={(e) => {
                            const updated = localSpots.map(s => 
                              s.id === spot.id ? { ...s, customName: e.target.value } : s
                            );
                            setLocalSpots(updated);
                          }}
                        />
                        <span className="text-xs font-normal text-slate-500">({spot.character})</span>
                      </div>
                      <p className="text-[10px] font-mono text-slate-400 leading-none">
                        {spot.lat.toFixed(5)}, {spot.lng.toFixed(5)}
                      </p>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleUpdateSpotLocation(spot.id)}
                    className="p-3 bg-slate-50 text-slate-600 rounded-xl hover:bg-indigo-50 hover:text-indigo-600 transition-colors border border-slate-100 shrink-0"
                  >
                    <Crosshair className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200 relative z-0 mt-4">
              <h3 className="font-bold text-slate-800 text-sm mb-3 flex items-center gap-2">
                <Map className="w-4 h-4 text-indigo-500" />
                스팟 배치도 (미리보기)
              </h3>
              <div className="h-64 rounded-xl overflow-hidden border border-slate-200">
                <MapContainer 
                  center={userPos ? [userPos.lat, userPos.lng] : [37.5547, 126.9707]} 
                  zoom={16} 
                  style={{ width: '100%', height: '100%' }}
                >
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; OpenStreetMap contributors'
                  />
                  
                  {userPos && (
                    <>
                      <Marker position={[userPos.lat, userPos.lng]} icon={userIcon}>
                        <Popup>현재 내 위치 (관리자)</Popup>
                      </Marker>
                      <Circle center={[userPos.lat, userPos.lng]} radius={50} pathOptions={{ color: '#ef4444', fillColor: '#ef4444', fillOpacity: 0.1, weight: 1 }} />
                    </>
                  )}

                  {localSpots.map(spot => (
                    <Marker key={spot.id} position={[spot.lat, spot.lng]} icon={createSpotIcon(spot.id)}>
                      <Popup>
                        <strong>{spot.customName || `SPOT ${spot.id}`}</strong><br/>
                        획득 글자: {spot.character}
                      </Popup>
                    </Marker>
                  ))}
                </MapContainer>
              </div>
              <p className="text-[10px] text-slate-400 mt-3 text-center">
                * 지도 안의 붉은 원은 내 위치 반경 50m(미션 가능 구역)를 나타냅니다.
              </p>
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default AdminDashboard;