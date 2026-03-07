
import React from 'react';
import { Save, ClipboardList } from 'lucide-react';

interface NotepadProps {
  memo: string;
  onMemoChange: (val: string) => void;
  onSave: () => void;
}

const Notepad: React.FC<NotepadProps> = ({ memo, onMemoChange, onSave }) => {
  return (
    <div className="bg-amber-50 rounded-2xl p-6 shadow-sm border border-amber-100">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 text-amber-800">
          <ClipboardList className="w-5 h-5" />
          <h3 className="font-bold">단어 조합 메모장</h3>
        </div>
        <button
          onClick={onSave}
          className="flex items-center gap-1 text-xs font-bold text-amber-700 bg-amber-200/50 px-3 py-1.5 rounded-full hover:bg-amber-200 transition-colors"
        >
          <Save className="w-3.5 h-3.5" />
          저장하기
        </button>
      </div>
      <textarea
        className="w-full h-24 bg-transparent border-none focus:ring-0 text-amber-900 placeholder-amber-400 text-sm resize-none"
        placeholder="스팟에서 찾은 글자들을 이곳에 적어보세요..."
        value={memo}
        onChange={(e) => onMemoChange(e.target.value)}
      />
      <div className="mt-2 text-[10px] text-amber-500 font-medium">
        * 작성 후 저장 버튼을 누르면 브라우저에 보관됩니다.
      </div>
    </div>
  );
};

export default Notepad;
