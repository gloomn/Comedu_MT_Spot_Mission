import React, { useState, useEffect, useRef } from 'react';
import { Save, Edit3 } from 'lucide-react';

interface NotepadProps {
  memo: string;
  onMemoChange: (val: string) => void;
  onSave: () => void;
}

const Notepad: React.FC<NotepadProps> = ({ memo, onMemoChange, onSave }) => {
  const [localMemo, setLocalMemo] = useState(memo);
  const [isFocused, setIsFocused] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 🟢 핵심 해결책 1: 내가 입력 중(포커스 상태)이 아닐 때만 서버의 데이터를 받아옵니다.
  // 이렇게 하면 타이핑 중에 글자가 두 번 찍히거나 커서가 튀는 현상이 완벽히 사라집니다.
  useEffect(() => {
    if (!isFocused) {
      setLocalMemo(memo);
    }
  }, [memo, isFocused]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setLocalMemo(newValue);
    
    // 🟢 핵심 해결책 2: 한 글자 칠 때마다 서버로 보내지 않고, 0.5초 동안 입력이 없을 때 모아서 보냅니다. (디바운스)
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      onMemoChange(newValue);
    }, 500);
  };

  const handleSave = () => {
    onMemoChange(localMemo); // 현재 값 강제 동기화
    setTimeout(() => {
      onSave();
      alert('✅ 메모가 안전하게 저장되고 팀원들에게 동기화되었습니다!');
    }, 100);
  };

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-[60vh] animate-in fade-in duration-300">
      {/* 메모장 헤더 */}
      <div className="bg-amber-100 p-4 border-b border-amber-200 flex justify-between items-center shrink-0">
        <h2 className="text-amber-800 font-bold flex items-center gap-2">
          <Edit3 className="w-5 h-5" />
          팀 메모장
        </h2>
        <button
          onClick={handleSave}
          className="bg-amber-500 hover:bg-amber-600 active:scale-95 text-white px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1 shadow-sm"
        >
          <Save className="w-4 h-4" />
          저장 및 동기화
        </button>
      </div>
      
      {/* 메모 입력 영역 */}
      <div className="p-4 flex-1 flex flex-col bg-[#fdfbf7]">
        <textarea
          className="w-full h-full bg-transparent resize-none outline-none text-slate-700 leading-relaxed placeholder-slate-400"
          placeholder="획득한 단어들을 조합해 최종 정답을 추리해보세요!&#13;&#10;(여기에 작성한 내용은 팀원들과 공유됩니다)"
          value={localMemo}
          onChange={handleChange}
          onFocus={() => setIsFocused(true)}  // 입력 시작
          onBlur={() => {
            setIsFocused(false);              // 입력 종료
            onMemoChange(localMemo);          // 창에서 빠져나올 때 확실하게 서버로 최종 동기화
          }}
        />
      </div>
      
      {/* 하단 안내 문구 */}
      <div className="bg-slate-50 p-3 text-center border-t border-slate-100 shrink-0">
        <p className="text-[10px] text-slate-400">
          * 한글 입력 오류(두 번 써짐) 방지를 위해, 메모 작성 중에는 다른 팀원의 글이 보이지 않으며 키보드를 내리면 즉시 동기화됩니다.
        </p>
      </div>
    </div>
  );
};

export default Notepad;