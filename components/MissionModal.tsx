import React, { useState } from 'react';
import { MissionType, Spot, Submission } from '../types';
import { X, Camera, Video, Type as FontType, Phone, CheckCircle2 } from 'lucide-react';

interface MissionModalProps {
  spot: Spot;
  teamName: string;
  onClose: () => void;
  onComplete: (spotId: number, submission?: Partial<Submission>) => void;
}

const MissionModal: React.FC<MissionModalProps> = ({ spot, teamName, onClose, onComplete }) => {
  const [teamNames, setTeamNames] = useState('');
  const [mediaUrl, setMediaUrl] = useState<string | undefined>(undefined);
  const [isUploading, setIsUploading] = useState(false);

  let canSubmit = true;
  if (spot.isCompleted) {
    canSubmit = false; 
  } else if (spot.missionType === MissionType.REELS || spot.missionType === MissionType.GROUP_SHOT) {
    canSubmit = !!mediaUrl && !isUploading; 
  } else if (spot.missionType === MissionType.TEAM_NAMES) {
    canSubmit = teamNames.trim().length > 0; 
  }

  const handleComplete = () => {
    if (!canSubmit) return; 

    const submission: Partial<Submission> = {
      teamName,
      spotId: spot.id,
      missionType: spot.missionType,
      timestamp: Date.now(),
      content: spot.missionType === MissionType.TEAM_NAMES ? teamNames : undefined,
      mediaUrl: mediaUrl
    };
    onComplete(spot.id, submission);
    onClose();
  };

  // 🟢 파일 업로드 방식을 서버 전송 방식으로만 변경 (0초 동영상 오류 해결)
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setIsUploading(true);
      const file = e.target.files[0];
      
      const formData = new FormData();
      formData.append('media', file);

      try {
        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });
        if (!response.ok) throw new Error('업로드 실패');
        
        const data = await response.json();
        setMediaUrl(data.url);
      } catch (err) {
        console.error(err);
      } finally {
        setIsUploading(false);
      }
    }
  };

  const renderMissionContent = () => {
    switch (spot.missionType) {
      case MissionType.REELS:
        return (
          <div className="space-y-4">
            <div className="bg-indigo-50 p-4 rounded-xl flex items-center gap-3">
              <Video className="text-indigo-600" />
              <p className="text-sm font-medium text-indigo-900">영상을 촬영하여 업로드하세요</p>
            </div>
            {mediaUrl ? (
              <video src={mediaUrl} controls className="w-full rounded-xl bg-black aspect-video" />
            ) : (
              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-slate-300 rounded-xl bg-slate-50 cursor-pointer hover:bg-slate-100 transition-colors">
                <Video className="w-8 h-8 text-slate-400 mb-2" />
                <span className="text-xs text-slate-500">동영상 선택하기</span>
                <input type="file" accept="video/*" className="hidden" onChange={handleFileUpload} />
              </label>
            )}
            {isUploading && <p className="text-center text-xs text-indigo-600 animate-pulse">처리 중...</p>}
          </div>
        );

      case MissionType.GROUP_SHOT:
        return (
          <div className="space-y-4">
            <div className="bg-emerald-50 p-4 rounded-xl flex items-center gap-3">
              <Camera className="text-emerald-600" />
              <p className="text-sm font-medium text-emerald-900">단체 사진을 업로드하세요</p>
            </div>
            {mediaUrl ? (
              <img src={mediaUrl} className="w-full h-40 object-cover rounded-xl" />
            ) : (
              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-slate-300 rounded-xl bg-slate-50 cursor-pointer hover:bg-slate-100 transition-colors">
                <Camera className="w-8 h-8 text-slate-400 mb-2" />
                <span className="text-xs text-slate-500">이미지 선택하기</span>
                <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
              </label>
            )}
            {isUploading && <p className="text-center text-xs text-emerald-600 animate-pulse">처리 중...</p>}
          </div>
        );

      case MissionType.CALL:
        return (
          <div className="space-y-4">
            <div className="bg-orange-50 p-4 rounded-xl flex items-center gap-3">
              <Phone className="text-orange-600" />
              <p className="text-sm font-medium text-orange-900">전화 후 단어를 확인하세요</p>
            </div>
            <p className="text-center py-6 text-xl font-bold text-slate-700">핵심 단어를 알아내셨나요?</p>
          </div>
        );

      case MissionType.TEAM_NAMES:
        return (
          <div className="space-y-4">
            <div className="bg-blue-50 p-4 rounded-xl flex items-center gap-3">
              <FontType className="text-blue-600" />
              <p className="text-sm font-medium text-blue-900">팀원들의 이름을 모두 작성하세요</p>
            </div>
            <textarea
              className="w-full h-24 p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm"
              placeholder="예: 홍길동, 김철수, 이영희..."
              value={teamNames}
              onChange={(e) => setTeamNames(e.target.value)}
            />
          </div>
        );

      default: {
        const chars = spot.character.split(',').map(c => c.trim()).filter(Boolean);

        return (
          <div className="text-center py-10 space-y-6">
            <div className="flex justify-center gap-3 flex-wrap">
              {chars.length > 0 ? (
                chars.map((char, idx) => (
                  <div key={idx} className="w-20 h-20 bg-indigo-600 rounded-full flex items-center justify-center text-white text-3xl font-black shadow-lg transform transition-transform hover:scale-110">
                    {char}
                  </div>
                ))
              ) : (
                <div className="w-20 h-20 bg-slate-200 rounded-full flex items-center justify-center text-slate-400 text-3xl font-black shadow-inner">
                  ?
                </div>
              )}
            </div>
            <p className="text-slate-600 font-medium">스팟의 글자를 획득했습니다!</p>
          </div>
        );
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl animate-in slide-in-from-bottom-4 duration-300 flex flex-col max-h-[90vh]">
        <div className="relative p-6 border-b border-slate-100 flex items-center justify-between shrink-0">
          <h2 className="text-lg font-bold text-slate-800">
            {spot.missionType !== MissionType.NONE ? spot.missionTitle : `글자 발견!`}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto no-scrollbar flex-1">
          {spot.missionType !== MissionType.NONE && (
            <p className="text-sm text-slate-500 mb-6 leading-relaxed">{spot.missionDescription}</p>
          )}
          {renderMissionContent()}
        </div>

        <div className="p-6 bg-slate-50 shrink-0">
          <button
            onClick={handleComplete}
            disabled={!canSubmit} 
            className={`w-full py-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all
              ${!canSubmit 
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed' 
                : 'bg-indigo-600 text-white hover:bg-indigo-700 active:scale-95 shadow-lg' 
              }`}
          >
            <CheckCircle2 className="w-5 h-5" />
            {spot.isCompleted 
              ? '이미 완료된 미션입니다' 
              : spot.missionType !== MissionType.NONE 
                ? '미션 완료' 
                : '확인'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default MissionModal;