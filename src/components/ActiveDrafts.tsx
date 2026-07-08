import { useEffect, useState } from 'react';
import { Participant, VILLAGES } from '../types';
import { getSheetTabName } from '../lib/googleSheets';
import { Trash2, FileEdit, Plus, Sparkles, HelpCircle } from 'lucide-react';

interface ActiveDraftsProps {
  onLoadDraft: (draft: Participant) => void;
  onNewSurvey: (selectedVillageId?: string) => void;
}

interface SavedDraft {
  key: string;
  timestamp: string;
  participant: Participant;
}

export default function ActiveDrafts({ onLoadDraft, onNewSurvey }: ActiveDraftsProps) {
  const [drafts, setDrafts] = useState<SavedDraft[]>([]);

  const loadDraftsFromStorage = () => {
    const list: SavedDraft[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('durian_survey_draft_')) {
        try {
          const raw = localStorage.getItem(key);
          if (raw) {
            const parsed = JSON.parse(raw);
            list.push({
              key,
              timestamp: parsed.savedAt || new Date().toISOString(),
              participant: parsed.state
            });
          }
        } catch (e) {
          console.error('Error loading draft', key, e);
        }
      }
    }
    // Sort by timestamp descending
    list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    setDrafts(list);
  };

  useEffect(() => {
    loadDraftsFromStorage();
  }, []);

  const handleDeleteDraft = (key: string) => {
    if (window.confirm('คุณต้องการลบแบบร่างนี้ใช่หรือไม่? ข้อมูลจะถูกลบออกถาวร')) {
      localStorage.removeItem(key);
      loadDraftsFromStorage();
    }
  };

  const handleClearAllDrafts = () => {
    if (window.confirm('คุณต้องการลบแบบร่างทั้งหมดในเบราว์เซอร์นี้ใช่หรือไม่?')) {
      drafts.forEach(d => localStorage.removeItem(d.key));
      loadDraftsFromStorage();
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      {/* Informative Header card */}
      <div className="mb-8 rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50/50 to-teal-50/20 p-6 shadow-xs">
        <div className="flex gap-4 items-start">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 text-emerald-800 shrink-0">
            <Sparkles className="h-6 w-6" />
          </div>
          <div>
            <h2 className="font-sans font-bold text-gray-900 text-lg">ระบบบันทึกฉบับร่างอัตโนมัติ (Autosave & Multi-Draft Engine)</h2>
            <p className="mt-1.5 text-sm text-gray-600 leading-relaxed">
              เราทราบดีว่าการเก็บข้อมูลภาคสนามร่วมกับชาวบ้านอาจใช้เวลานานและมีโอกาสสัญญาณขาดหายหรือหลุดจากระบบ 
              <strong> เว็บแอปนี้จะบันทึกข้อมูลทุกอย่างที่คุณพิมพ์โดยอัตโนมัติลงในเบราว์เซอร์ </strong> 
              คุณสามารถกรอกสลับไปมาระหว่างผู้เข้าร่วมได้หลายคน และเปิดปิดแท็บหรือเข้าสู่ระบบใหม่ได้โดยที่ข้อมูลจะไม่สูญหาย
            </p>
            <div className="mt-4 flex flex-wrap gap-2.5">
              <button
                id="drafts-start-new-btn"
                onClick={() => onNewSurvey()}
                className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-emerald-700 transition"
              >
                <Plus className="h-4.5 w-4.5" />
                เริ่มกรอกข้อมูลใหม่
              </button>
              {drafts.length > 0 && (
                <button
                  id="drafts-clear-all-btn"
                  onClick={handleClearAllDrafts}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-white px-4 py-2 text-xs font-semibold text-red-700 hover:bg-red-50 transition"
                >
                  <Trash2 className="h-4.5 w-4.5" />
                  ลบแบบร่างทั้งหมด
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Village Quick-Start buttons */}
      <div className="mb-8">
        <h3 className="font-sans font-semibold text-gray-800 text-sm mb-3">ทางลัด: เริ่มแบบสอบถามใหม่แยกตามหมู่บ้าน</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
          {VILLAGES.map(v => (
            <button
              key={v.id}
              onClick={() => onNewSurvey(v.id.toString())}
              className="flex flex-col items-center justify-center p-3 rounded-xl border border-gray-100 bg-white hover:border-emerald-500 hover:bg-emerald-50/30 transition text-left group shadow-2xs"
            >
              <span className="font-mono text-[10px] text-emerald-600 font-bold">{v.moo}</span>
              <span className="font-sans font-semibold text-gray-800 text-xs mt-0.5 group-hover:text-emerald-800">{v.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Active drafts listing */}
      <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-xs">
        <h3 className="font-sans font-bold text-gray-900 text-base mb-4 flex items-center gap-2">
          แบบร่างที่บันทึกไว้ในระบบ ({drafts.length} รายการ)
        </h3>

        {drafts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="rounded-full bg-gray-50 p-3 text-gray-400 mb-3">
              <HelpCircle className="h-6 w-6" />
            </div>
            <p className="text-sm text-gray-500 font-medium">ยังไม่มีแบบร่างแบบสอบถามที่บันทึกไว้</p>
            <p className="text-xs text-gray-400 mt-1 max-w-sm">ข้อมูลที่ยังกรอกไม่เสร็จจะแสดงขึ้นที่นี่โดยอัตโนมัติเมื่อคุณเริ่มกรอกแบบสอบถาม</p>
          </div>
        ) : (
          <div className="space-y-3">
            {drafts.map((d) => {
              const p = d.participant;
              const formattedDate = new Date(d.timestamp).toLocaleString('th-TH', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              });

              return (
                <div
                  key={d.key}
                  className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded-xl border border-gray-100 bg-gray-50/50 hover:bg-emerald-50/10 transition gap-4 shadow-3xs"
                >
                  <div className="text-left">
                    <div className="flex items-center gap-2">
                      <span className="rounded-md bg-emerald-100 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800">
                        {getSheetTabName(p.village)}
                      </span>
                      {p.participantCode ? (
                        <span className="font-sans font-bold text-gray-900 text-sm">
                          {p.participantCode}
                        </span>
                      ) : (
                        <span className="font-sans italic text-gray-400 text-sm">
                          (ไม่มีรหัสผู้เข้าร่วม)
                        </span>
                      )}
                    </div>
                    
                    <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
                      <span>เลขที่แบบสอบถาม: <strong className="text-gray-700">{p.docNo || 'ไม่ระบุ'}</strong></span>
                      <span>•</span>
                      <span>อายุ: <strong className="text-gray-700">{p.age || 'ไม่ระบุ'} ปี</strong></span>
                      <span>•</span>
                      <span>วันที่บันทึกร่าง: <strong className="text-gray-600">{formattedDate}</strong></span>
                    </div>
                  </div>

                  <div className="flex gap-2 w-full sm:w-auto self-stretch sm:self-center justify-end">
                    <button
                      onClick={() => onLoadDraft(p)}
                      className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 px-3.5 py-1.5 text-xs font-bold transition flex-1 sm:flex-none justify-center"
                    >
                      <FileEdit className="h-3.5 w-3.5" />
                      กู้คืนและเขียนต่อ
                    </button>
                    <button
                      onClick={() => handleDeleteDraft(d.key)}
                      className="rounded-lg border border-red-100 text-red-500 hover:bg-red-50 p-2 transition"
                      title="ลบฉบับร่าง"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
