import React, { useState, useEffect } from 'react';
import { Participant, VILLAGES } from '../types';
import {
  DASS21_QUESTIONS,
  CNS_QUESTIONS,
  ERGONOMIC_QUESTIONS,
  NMQ_BODY_PARTS,
  Q16_QUESTIONS,
  CHEMICAL_SUBSTANCES,
  INITIAL_FORM_STATE
} from '../data/questionnaireData';
import { calculateBloodTestEligibility } from '../lib/googleSheets';
import {
  ChevronLeft,
  ChevronRight,
  Save,
  CheckCircle,
  AlertCircle,
  Loader2,
  Trash2,
  FileSpreadsheet,
  Info
} from 'lucide-react';

interface QuestionnaireFormProps {
  initialState?: Participant | null;
  onSubmit: (participant: Participant) => Promise<boolean>;
  onCancel: () => void;
}

export default function QuestionnaireForm({
  initialState,
  onSubmit,
  onCancel
}: QuestionnaireFormProps) {
  const [formData, setFormData] = useState<Participant>(() => {
    if (initialState) return { ...initialState };
    return JSON.parse(JSON.stringify(INITIAL_FORM_STATE)) as Participant;
  });

  const [activeStep, setActiveStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error' | null>(null);

  // Autosave when form values change
  useEffect(() => {
    setSaveStatus('saving');
    const timer = setTimeout(() => {
      try {
        const draftKey = `durian_survey_draft_${formData.participantCode || 'unnamed'}_${formData.docNo || 'empty'}`;
        
        // Clean old drafts with same code to prevent proliferation
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith('durian_survey_draft_') && key !== draftKey) {
            // If participant code matches or draft is empty
            const rawDraft = localStorage.getItem(key);
            if (rawDraft) {
              const parsed = JSON.parse(rawDraft);
              if (parsed.state.participantCode === formData.participantCode && parsed.state.docNo === formData.docNo) {
                localStorage.removeItem(key);
              }
            }
          }
        }

        localStorage.setItem(
          draftKey,
          JSON.stringify({
            savedAt: new Date().toISOString(),
            state: formData
          })
        );
        setSaveStatus('saved');
      } catch (err) {
        console.error('Autosave error:', err);
        setSaveStatus('error');
      }
    }, 1500);

    return () => clearTimeout(timer);
  }, [formData]);

  const updateField = (field: keyof Participant, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleCheckboxListChange = (field: keyof Participant, item: string, checked: boolean) => {
    const list = [...(formData[field] as string[] || [])];
    if (checked) {
      if (!list.includes(item)) list.push(item);
    } else {
      const index = list.indexOf(item);
      if (index > -1) list.splice(index, 1);
    }
    updateField(field, list);
  };

  const handleChemicalChange = (chemName: string, field: 'used' | 'amount', value: any) => {
    setFormData((prev) => {
      const updatedChems = { ...prev.chemicals };
      if (!updatedChems[chemName]) {
        updatedChems[chemName] = { used: false, amount: '' };
      }
      updatedChems[chemName] = {
        ...updatedChems[chemName],
        [field]: value
      };
      return { ...prev, chemicals: updatedChems };
    });
  };

  const handleDassScoreChange = (qId: number, score: number) => {
    setFormData((prev) => ({
      ...prev,
      dassScores: { ...prev.dassScores, [qId]: score }
    }));
  };

  const handleCnsSymptomChange = (qId: number, value: string) => {
    setFormData((prev) => ({
      ...prev,
      cnsSymptoms: { ...prev.cnsSymptoms, [qId]: value }
    }));
  };

  const handleErgonomicChange = (qId: number, value: boolean) => {
    setFormData((prev) => ({
      ...prev,
      ergonomicFactors: { ...prev.ergonomicFactors, [qId]: value }
    }));
  };

  const handleNmqChange = (partKey: string, flagKey: 'past12m' | 'interrupted12m' | 'past28d' | 'past7d', value: boolean) => {
    setFormData((prev) => {
      const updatedNmq = { ...prev.nmqSymptoms };
      updatedNmq[partKey] = {
        ...updatedNmq[partKey],
        [flagKey]: value
      };
      return { ...prev, nmqSymptoms: updatedNmq };
    });
  };

  const handleNrsPainChange = (partKey: string, painKey: 'nrs7d' | 'nrs28d' | 'nrs12m', value: number) => {
    setFormData((prev) => {
      const updatedPain = { ...prev.nrsPain };
      updatedPain[partKey] = {
        ...updatedPain[partKey],
        [painKey]: value
      };
      return { ...prev, nrsPain: updatedPain };
    });
  };

  const handleQ16Change = (qId: number, value: boolean) => {
    setFormData((prev) => ({
      ...prev,
      q16Symptoms: { ...prev.q16Symptoms, [qId]: value }
    }));
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.participantCode) {
      alert('กรุณากรอกรหัสหรือชื่อของผู้เข้าร่วมก่อนส่งข้อมูล');
      setActiveStep(1);
      return;
    }

    if (window.confirm('คุณต้องการส่งข้อมูลแบบสอบถามเข้าสู่ฐานข้อมูลใช่หรือไม่? ระบบจะทำการอัปโหลดเข้าสู่ Google Sheet')) {
      setIsSubmitting(true);
      const success = await onSubmit(formData);
      setIsSubmitting(false);
      
      if (success) {
        // Clear active draft after successful submission
        const draftKey = `durian_survey_draft_${formData.participantCode || 'unnamed'}_${formData.docNo || 'empty'}`;
        localStorage.removeItem(draftKey);
      }
    }
  };

  // Real-time blood test criteria checklist calculations
  const eligibility = calculateBloodTestEligibility(formData);
  const eligibilityScores = Object.values(formData.q16Symptoms || {}).filter(val => val === true).length;
  
  const rulesMet = [
    { label: 'คะแนนระดับอาการประสาท Q16 > 6', met: eligibility.neuroScoreHigh, desc: `คะแนนปัจจุบัน: ${eligibilityScores}/16` },
    { label: 'ทำงานกับสารเคมีกำจัดศัตรูพืช >= 1 ปีขึ้นไป', met: eligibility.pesticideExperienceHigh, desc: `อายุงาน: ${formData.workYears || 0} ปี ${formData.workMonths || 0} เดือน` },
    { label: 'มีอายุมากกว่า 20 ปีขึ้นไป', met: eligibility.ageOver20, desc: `อายุปัจจุบัน: ${formData.age || 0} ปี` },
    { label: 'ทำงานกับสารเคมีมากกว่า 3 ครั้งต่อสัปดาห์', met: eligibility.pesticideFrequencyHigh, desc: `ความถี่: ${formData.chemicalFrequency || 0} ครั้ง/สัปดาห์` },
    { label: 'ไม่มีประวัติดื่มแอลกอฮอล์ในช่วง 1 เดือนที่ผ่านมา', met: eligibility.noAlcoholPastMonth, desc: `สถานะ: ${formData.alcohol}` },
    { label: 'ไม่มีประวัติสูบบุหรี่ในช่วง 1 เดือนที่ผ่านมา', met: eligibility.noSmokingPastMonth, desc: `สถานะ: ${formData.smoking}` },
    { label: 'เวลาพักไม่น้อยกว่า 1 ชั่วโมงต่อวันขณะทำงาน', met: eligibility.restTimeSufficient, desc: `เวลาพัก: ${formData.restDuration || 0} ชม./วัน` },
    { label: 'ความถี่ทำงานเกี่ยวกับสารเคมีนานกว่า 4 ชั่วโมงต่อวัน', met: eligibility.workChemicalHoursHigh, desc: `เวลาฉีดพ่น: ${formData.chemicalDurationPerTime || 0} ชม./ครั้ง` }
  ];

  const metCount = rulesMet.filter(r => r.met).length;

  return (
    <form onSubmit={handleFormSubmit} className="mx-auto max-w-5xl px-4 py-8">
      
      {/* Top Banner with Autosave Feedback */}
      <div className="mb-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-gray-100 pb-5">
        <div>
          <h2 className="font-sans font-bold text-gray-900 text-xl flex items-center gap-2">
            บันทึกแบบสอบถามงานวิจัย
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            กรอกข้อมูลวิจัยสุขภาพของเกษตรกรแบบทีละส่วนอย่างเป็นระบบและปลอดภัย
          </p>
        </div>

        {/* Autosave Status Badge */}
        <div className="flex items-center gap-2 rounded-xl bg-gray-50 border border-gray-100 px-3.5 py-1.5 self-stretch sm:self-auto justify-center md:justify-start">
          {saveStatus === 'saving' && (
            <>
              <Loader2 className="h-4 w-4 animate-spin text-amber-500" />
              <span className="font-mono text-xs text-gray-500">กำลังบันทึกแบบร่างอัตโนมัติ...</span>
            </>
          )}
          {saveStatus === 'saved' && (
            <>
              <CheckCircle className="h-4 w-4 text-emerald-500" />
              <span className="font-mono text-xs text-emerald-700 font-semibold">บันทึกแบบร่างเรียบร้อย</span>
            </>
          )}
          {saveStatus === 'error' && (
            <>
              <AlertCircle className="h-4 w-4 text-red-500" />
              <span className="font-mono text-xs text-red-600 font-semibold">ล้มเหลวในการเซฟร่าง</span>
            </>
          )}
        </div>
      </div>

      {/* 5-Step Progress Indicators */}
      <div className="mb-8 flex flex-col md:flex-row gap-2 justify-between border-b border-gray-100 pb-4">
        {[
          { step: 1, title: '1. ข้อมูลทั่วไป' },
          { step: 2, title: '2. การทำงาน & สารเคมี' },
          { step: 3, title: '3. DASS-21 & CNS' },
          { step: 4, title: '4. การยศาสตร์ & กล้ามเนื้อ' },
          { step: 5, title: '5. แบบประเมิน Q16' }
        ].map((item) => (
          <button
            type="button"
            key={item.step}
            onClick={() => setActiveStep(item.step)}
            className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border transition-all duration-200 text-left ${
              activeStep === item.step
                ? 'bg-emerald-600 border-emerald-600 text-white font-bold shadow-md shadow-emerald-100'
                : 'bg-white border-gray-100 text-gray-600 hover:border-emerald-300'
            }`}
          >
            <span className={`flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-bold ${
              activeStep === item.step ? 'bg-white text-emerald-700' : 'bg-gray-100 text-gray-600'
            }`}>
              {item.step}
            </span>
            <span className="text-xs truncate">{item.title}</span>
          </button>
        ))}
      </div>

      {/* ==================== STEP 1: ข้อมูลส่วนบุคคล ==================== */}
      {activeStep === 1 && (
        <div className="space-y-6 animate-fadeIn">
          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-xs">
            <h3 className="font-sans font-bold text-gray-900 text-base mb-5 border-b border-gray-50 pb-2">
              ส่วนที่ 1.1: ข้อมูลควบคุมเอกสารและสังกัดหมู่บ้าน
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">เลขที่แบบสอบถาม</label>
                <input
                  type="text"
                  placeholder="เช่น A001"
                  value={formData.docNo}
                  onChange={(e) => updateField('docNo', e.target.value)}
                  className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-emerald-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">วันที่ทำแบบสอบถาม</label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => updateField('date', e.target.value)}
                  className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-emerald-500 focus:outline-hidden"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-red-600 mb-1.5">ชื่อหรือโค้ดรหัสผู้เข้าร่วม * (จำเป็น)</label>
                <input
                  type="text"
                  required
                  placeholder="กรอกชื่อจริง หรือรหัส เช่น นายสมชาย หรือ DN-01"
                  value={formData.participantCode}
                  onChange={(e) => updateField('participantCode', e.target.value)}
                  className="w-full rounded-lg border border-red-200 bg-white px-3 py-2 text-sm font-semibold focus:border-emerald-500 focus:outline-hidden text-emerald-900"
                />
              </div>

              <div className="md:col-span-4">
                <label className="block text-xs font-bold text-gray-700 mb-1.5">เลือกสังกัดหมู่บ้าน (จะแยกเก็บลงคนละชีทใน Google Sheets)</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
                  {VILLAGES.map((v) => (
                    <button
                      type="button"
                      key={v.id}
                      onClick={() => updateField('village', v.id.toString())}
                      className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all ${
                        formData.village === v.id.toString()
                          ? 'border-emerald-600 bg-emerald-50 text-emerald-800 font-bold shadow-2xs'
                          : 'border-gray-100 bg-white text-gray-700 hover:border-emerald-300'
                      }`}
                    >
                      <span className="font-mono text-[9px] text-emerald-600 font-bold leading-none">{v.moo}</span>
                      <span className="font-sans text-xs mt-1">{v.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-xs">
            <h3 className="font-sans font-bold text-gray-900 text-base mb-5 border-b border-gray-50 pb-2">
              ส่วนที่ 1.2: ปัจจัยข้อมูลส่วนบุคคลทั่วไป
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">อายุ (ปี)</label>
                <input
                  type="number"
                  min="0"
                  value={formData.age || ''}
                  onChange={(e) => updateField('age', Number(e.target.value))}
                  className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-emerald-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">เพศ</label>
                <div className="flex gap-2">
                  {['ชาย', 'หญิง'].map((g) => (
                    <button
                      type="button"
                      key={g}
                      onClick={() => updateField('gender', g)}
                      className={`flex-1 py-2 rounded-lg border text-sm font-semibold transition ${
                        formData.gender === g
                          ? 'bg-emerald-600 border-emerald-600 text-white'
                          : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">สถานภาพสมรส</label>
                <select
                  value={formData.maritalStatus}
                  onChange={(e) => updateField('maritalStatus', e.target.value)}
                  className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-emerald-500 focus:outline-hidden"
                >
                  <option value="">-- เลือกสถานภาพ --</option>
                  <option value="โสด">โสด</option>
                  <option value="สมรส">สมรส</option>
                  <option value="หม้าย">หม้าย</option>
                  <option value="หย่า/แยกกันอยู่">หย่า / แยกกันอยู่</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">น้ำหนัก (กิโลกรัม)</label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.weight || ''}
                  onChange={(e) => updateField('weight', Number(e.target.value))}
                  className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-emerald-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">ส่วนสูง (เมตร) เช่น 1.70</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="เช่น 1.65"
                  value={formData.height || ''}
                  onChange={(e) => updateField('height', Number(e.target.value))}
                  className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-emerald-500 focus:outline-hidden"
                />
              </div>

              <div className="flex items-end">
                <div className="w-full rounded-lg bg-emerald-50/50 border border-emerald-100 p-2.5 text-center">
                  <span className="text-[10px] text-emerald-800 font-bold block uppercase leading-none">ดัชนีมวลกาย (BMI)</span>
                  <span className="text-lg font-bold text-emerald-900 mt-1 block">
                    {formData.height > 0 ? (formData.weight / (formData.height * formData.height)).toFixed(2) : '0.00'}
                  </span>
                </div>
              </div>

              <div className="md:col-span-3">
                <label className="block text-xs font-bold text-gray-700 mb-1.5">ระดับการศึกษา</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {[
                    'ไม่ได้เรียนหนังสือ',
                    'ประถมศึกษา ป.1-ป.6',
                    'มัธยมศึกษาตอนต้น (ม.3)',
                    'มัธยมศึกษาตอนปลาย (ม.6/ปวช.)',
                    'อนุปริญญา/ปวส./หรือเทียบเท่า',
                    'ปริญญาตรี',
                    'อื่นๆ'
                  ].map((edu) => (
                    <button
                      type="button"
                      key={edu}
                      onClick={() => updateField('education', edu)}
                      className={`p-2.5 rounded-lg border text-left text-xs transition ${
                        formData.education === edu
                          ? 'border-emerald-500 bg-emerald-50/40 text-emerald-900 font-semibold'
                          : 'border-gray-100 bg-white text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      {edu}
                    </button>
                  ))}
                </div>
                {formData.education === 'อื่นๆ' && (
                  <input
                    type="text"
                    placeholder="ระบุระดับการศึกษาเพิ่มเติม..."
                    value={formData.educationOther || ''}
                    onChange={(e) => updateField('educationOther', e.target.value)}
                    className="mt-2 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-emerald-500 focus:outline-hidden"
                  />
                )}
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-xs">
            <h3 className="font-sans font-bold text-gray-900 text-base mb-5 border-b border-gray-50 pb-2">
              ส่วนที่ 1.3: พฤติกรรมสุขภาพและพฤติกรรมการนอน
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Smoking */}
              <div className="rounded-xl border border-gray-50 p-4 bg-gray-50/20">
                <label className="block text-xs font-bold text-gray-700 mb-2">การสูบบุหรี่ (ใน 1 เดือนที่ผ่านมา)</label>
                <div className="flex gap-2">
                  {[
                    { label: 'ไม่สูบ', val: 'ไม่สูบ' },
                    { label: 'สูบ', val: 'สูบ' }
                  ].map((item) => (
                    <button
                      type="button"
                      key={item.val}
                      onClick={() => updateField('smoking', item.val)}
                      className={`flex-1 py-2 rounded-lg border text-xs font-semibold transition ${
                        formData.smoking === item.val
                          ? 'bg-emerald-600 border-emerald-600 text-white'
                          : 'bg-white border-gray-200 text-gray-700'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
                {formData.smoking === 'สูบ' && (
                  <div className="mt-3">
                    <label className="block text-[10px] font-bold text-gray-600 mb-1">ปริมาณเฉลี่ย (มวนต่อวัน)</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.smokingAmount || ''}
                      onChange={(e) => updateField('smokingAmount', Number(e.target.value))}
                      className="w-full rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs focus:border-emerald-500 focus:outline-hidden"
                    />
                  </div>
                )}
              </div>

              {/* Alcohol */}
              <div className="rounded-xl border border-gray-50 p-4 bg-gray-50/20">
                <label className="block text-xs font-bold text-gray-700 mb-2">การดื่มแอลกอฮอล์ (ใน 1 เดือนที่ผ่านมา)</label>
                <div className="flex gap-2">
                  {[
                    { label: 'ไม่ดื่ม', val: 'ไม่ดื่ม' },
                    { label: 'ดื่ม', val: 'ดื่ม' }
                  ].map((item) => (
                    <button
                      type="button"
                      key={item.val}
                      onClick={() => updateField('alcohol', item.val)}
                      className={`flex-1 py-2 rounded-lg border text-xs font-semibold transition ${
                        formData.alcohol === item.val
                          ? 'bg-emerald-600 border-emerald-600 text-white'
                          : 'bg-white border-gray-200 text-gray-700'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
                {formData.alcohol === 'ดื่ม' && (
                  <div className="mt-3">
                    <label className="block text-[10px] font-bold text-gray-600 mb-1">ปริมาณเฉลี่ย (แก้ว/ขวดต่อครั้ง)</label>
                    <input
                      type="text"
                      placeholder="เช่น 2 แก้ว หรือ 1 ขวด"
                      value={formData.alcoholAmount || ''}
                      onChange={(e) => updateField('alcoholAmount', e.target.value)}
                      className="w-full rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs focus:border-emerald-500 focus:outline-hidden"
                    />
                  </div>
                )}
              </div>

              {/* Energy Drink */}
              <div className="rounded-xl border border-gray-50 p-4 bg-gray-50/20">
                <label className="block text-xs font-bold text-gray-700 mb-2">ดื่มเครื่องดื่มชูกำลัง</label>
                <div className="flex gap-2">
                  {[
                    { label: 'ไม่ดื่ม', val: 'ไม่ดื่ม' },
                    { label: 'ดื่ม', val: 'ดื่ม' }
                  ].map((item) => (
                    <button
                      type="button"
                      key={item.val}
                      onClick={() => updateField('energyDrink', item.val)}
                      className={`flex-1 py-2 rounded-lg border text-xs font-semibold transition ${
                        formData.energyDrink === item.val
                          ? 'bg-emerald-600 border-emerald-600 text-white'
                          : 'bg-white border-gray-200 text-gray-700'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
                {formData.energyDrink === 'ดื่ม' && (
                  <div className="mt-3">
                    <label className="block text-[10px] font-bold text-gray-600 mb-1">ปริมาณเฉลี่ย (ขวดต่อวัน)</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.energyDrinkAmount || ''}
                      onChange={(e) => updateField('energyDrinkAmount', Number(e.target.value))}
                      className="w-full rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs focus:border-emerald-500 focus:outline-hidden"
                    />
                  </div>
                )}
              </div>

              {/* Exercise */}
              <div className="md:col-span-3">
                <label className="block text-xs font-bold text-gray-700 mb-1.5">การออกกำลังกายที่ไม่เกี่ยวกับการทำงาน</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {[
                    'ไม่ได้ออกกำลังกายเลย',
                    'ออกกำลังกายอย่างน้อยสัปดาห์ละ 3 ครั้ง ละ 30-60 นาที (เดิน/วิ่ง/ปั่นจักรยาน)',
                    'ยืดเหยียดร่างกายอย่างน้อยสัปดาห์ละ 3 ครั้ง ละ 30-60 นาที',
                    'มีกิจกรรมเคลื่อนไหวขณะอยู่บ้าน (รดน้ำต้นไม้/กวาดบ้าน/งานบ้าน)',
                    'อื่นๆ'
                  ].map((ex) => (
                    <button
                      type="button"
                      key={ex}
                      onClick={() => updateField('exercise', ex)}
                      className={`p-2.5 rounded-lg border text-left text-xs transition ${
                        formData.exercise === ex
                          ? 'border-emerald-500 bg-emerald-50/40 text-emerald-900 font-semibold'
                          : 'border-gray-100 bg-white text-gray-700'
                      }`}
                    >
                      {ex}
                    </button>
                  ))}
                </div>
                {formData.exercise === 'อื่นๆ' && (
                  <input
                    type="text"
                    placeholder="ระบุกิจกรรมการออกกำลังกายเพิ่มเติม..."
                    value={formData.exerciseOther || ''}
                    onChange={(e) => updateField('exerciseOther', e.target.value)}
                    className="mt-2 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-emerald-500 focus:outline-hidden"
                  />
                )}
              </div>

              {/* Sleep adequacy */}
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-gray-700 mb-1.5">การพักผ่อนนอนหลับนอกเวลางาน (เฉลี่ยใน 1 วัน)</label>
                <div className="flex gap-2">
                  {[
                    { label: 'ไม่เพียงพอ', val: 'ไม่เพียงพอ' },
                    { label: 'เพียงพอ', val: 'เพียงพอ' }
                  ].map((item) => (
                    <button
                      type="button"
                      key={item.val}
                      onClick={() => updateField('sleepAdequate', item.val)}
                      className={`flex-1 py-2 rounded-lg border text-sm font-semibold transition ${
                        formData.sleepAdequate === item.val
                          ? 'bg-emerald-600 border-emerald-600 text-white'
                          : 'bg-white border-gray-200 text-gray-700'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">จำนวนชั่วโมงนอนต่อคืน (เฉลี่ย)</label>
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  value={formData.sleepHours || ''}
                  onChange={(e) => updateField('sleepHours', Number(e.target.value))}
                  className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-emerald-500 focus:outline-hidden"
                />
              </div>
            </div>
          </div>

          {/* Chronic diseases & medications */}
          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-xs">
            <h3 className="font-sans font-bold text-gray-900 text-base mb-5 border-b border-gray-50 pb-2">
              ส่วนที่ 1.4: ประวัติโรคประจำตัวและการใช้ยาประจำตัว
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-3">โรคประจำตัว (ติ๊กเลือกได้มากกว่า 1 ข้อ)</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    'เบาหวาน',
                    'ความดันโลหิตสูง',
                    'ไขมันในเลือดสูง',
                    'โรคหัวใจและหลอดเลือด',
                    'หอบหืด',
                    'ภูมิแพ้',
                    'โรคทางเดินหายใจ',
                    'โรคไต'
                  ].map((disease) => {
                    const isChecked = formData.diseases?.includes(disease);
                    return (
                      <label
                        key={disease}
                        className={`flex items-center gap-2 p-2.5 rounded-lg border text-xs cursor-pointer select-none transition ${
                          isChecked ? 'border-emerald-500 bg-emerald-50/20 text-emerald-900 font-semibold' : 'border-gray-100 hover:bg-gray-50'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => handleCheckboxListChange('diseases', disease, e.target.checked)}
                          className="rounded-sm border-gray-300 text-emerald-600 focus:ring-emerald-500 h-4 w-4"
                        />
                        {disease}
                      </label>
                    );
                  })}
                </div>
                <div className="mt-2">
                  <input
                    type="text"
                    placeholder="โรคประจำตัวอื่นๆ (ถ้ามี)..."
                    value={formData.diseasesOther || ''}
                    onChange={(e) => updateField('diseasesOther', e.target.value)}
                    className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-3">ยาประจำตัวที่ต้องรับประทาน (ติ๊กเลือกได้มากกว่า 1 ข้อ)</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    'ยาเบาหวาน',
                    'ยาความดันโลหิตสูง',
                    'ยาไขมันในเลือดสูง',
                    'ยาโรคหัวใจและหลอดเลือด',
                    'ยาแก้หอบหืด',
                    'ยาแก้แพ้/ภูมิแพ้',
                    'ยารักษาโรคทางเดินหายใจ',
                    'ยารักษาโรคไต'
                  ].map((med) => {
                    const isChecked = formData.medications?.includes(med);
                    return (
                      <label
                        key={med}
                        className={`flex items-center gap-2 p-2.5 rounded-lg border text-xs cursor-pointer select-none transition ${
                          isChecked ? 'border-emerald-500 bg-emerald-50/20 text-emerald-900 font-semibold' : 'border-gray-100 hover:bg-gray-50'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => handleCheckboxListChange('medications', med, e.target.checked)}
                          className="rounded-sm border-gray-300 text-emerald-600 focus:ring-emerald-500 h-4 w-4"
                        />
                        {med}
                      </label>
                    );
                  })}
                </div>
                <div className="mt-2 space-y-2">
                  <input
                    type="text"
                    placeholder="ยาประจำตัวอื่นๆ (ถ้ามี)..."
                    value={formData.medicationsOther || ''}
                    onChange={(e) => updateField('medicationsOther', e.target.value)}
                    className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-emerald-500"
                  />
                  <input
                    type="text"
                    placeholder="รายละเอียดการกินยาเป็นประจำอื่นๆ..."
                    value={formData.regularMedicationDetail || ''}
                    onChange={(e) => updateField('regularMedicationDetail', e.target.value)}
                    className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-emerald-500"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================== STEP 2: ปัจจัยด้านการทำงาน & สารเคมี ==================== */}
      {activeStep === 2 && (
        <div className="space-y-6 animate-fadeIn">
          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-xs">
            <h3 className="font-sans font-bold text-gray-900 text-base mb-5 border-b border-gray-50 pb-2">
              ส่วนที่ 2.1: ประวัติและลักษณะการทำงานในสวนทุเรียน
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">อายุงานการทำสวนทุเรียน (ปี)</label>
                <input
                  type="number"
                  min="0"
                  value={formData.workYears || ''}
                  onChange={(e) => updateField('workYears', Number(e.target.value))}
                  className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">อายุงานการทำสวนทุเรียน (เศษเดือน)</label>
                <input
                  type="number"
                  min="0"
                  max="11"
                  value={formData.workMonths || ''}
                  onChange={(e) => updateField('workMonths', Number(e.target.value))}
                  className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">ชั่วโมงการทำงานดูแลสวนทุเรียนต่อวัน</label>
                <input
                  type="number"
                  min="0"
                  value={formData.workHoursPerDay || ''}
                  onChange={(e) => updateField('workHoursPerDay', Number(e.target.value))}
                  className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">ทำงานตามฤดูกาลหรือไม่</label>
                <div className="flex gap-2">
                  {['ใช่', 'ไม่ใช่'].map((item) => (
                    <button
                      type="button"
                      key={item}
                      onClick={() => updateField('seasonalWork', item)}
                      className={`flex-1 py-2 rounded-lg border text-sm font-semibold transition ${
                        formData.seasonalWork === item
                          ? 'bg-emerald-600 border-emerald-600 text-white'
                          : 'bg-white border-gray-200 text-gray-700'
                      }`}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">รายได้ขึ้นอยู่กับฤดูกาลหรือไม่</label>
                <div className="flex gap-2">
                  {['ใช่', 'ไม่ใช่'].map((item) => (
                    <button
                      type="button"
                      key={item}
                      onClick={() => updateField('seasonalIncome', item)}
                      className={`flex-1 py-2 rounded-lg border text-sm font-semibold transition ${
                        formData.seasonalIncome === item
                          ? 'bg-emerald-600 border-emerald-600 text-white'
                          : 'bg-white border-gray-200 text-gray-700'
                      }`}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">ระยะเวลาพักในการทำงานต่อวัน (ชั่วโมง)</label>
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  value={formData.restDuration || ''}
                  onChange={(e) => updateField('restDuration', Number(e.target.value))}
                  className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-emerald-500"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-gray-700 mb-1.5">งานอื่นๆ นอกเหนือจากการจัดการสวนทุเรียน</label>
                <input
                  type="text"
                  placeholder="เช่น ทำสวนยางพารา, รับจ้างทั่วไป"
                  value={formData.otherJobs || ''}
                  onChange={(e) => updateField('otherJobs', e.target.value)}
                  className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">ความถี่ในการพักระหว่างวันทำงาน</label>
                <input
                  type="text"
                  placeholder="เช่น พักทุกๆ 2 ชั่วโมง"
                  value={formData.restFrequency || ''}
                  onChange={(e) => updateField('restFrequency', e.target.value)}
                  className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-emerald-500"
                />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-xs">
            <h3 className="font-sans font-bold text-gray-900 text-base mb-5 border-b border-gray-50 pb-2">
              ส่วนที่ 2.2: พฤติกรรมการทำงานเกี่ยวกับสารเคมีจำจัดศัตรูพืช
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-3">บทบาทและหน้าที่เกี่ยวกับสารเคมี (เลือกได้มากกว่า 1 ข้อ)</label>
                <div className="grid grid-cols-2 gap-2">
                  {['ผสม', 'ฉีดพ่น', 'ล้างอุปกรณ์', 'เก็บสารเคมี'].map((role) => {
                    const isChecked = formData.chemicalRoles?.includes(role);
                    return (
                      <label
                        key={role}
                        className={`flex items-center gap-2 p-2.5 rounded-lg border text-xs cursor-pointer select-none transition ${
                          isChecked ? 'border-emerald-500 bg-emerald-50/20 text-emerald-900 font-semibold' : 'border-gray-100 hover:bg-gray-50'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => handleCheckboxListChange('chemicalRoles', role, e.target.checked)}
                          className="rounded-sm border-gray-300 text-emerald-600 focus:ring-emerald-500 h-4 w-4"
                        />
                        {role}
                      </label>
                    );
                  })}
                </div>
                <input
                  type="text"
                  placeholder="บทบาทหน้าที่เกี่ยวกับเคมีอื่นๆ (ถ้ามี)..."
                  value={formData.chemicalRolesOther || ''}
                  onChange={(e) => updateField('chemicalRolesOther', e.target.value)}
                  className="mt-2 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-emerald-500"
                />
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1.5">ความถี่ใช้สารเคมี (ครั้ง/สัปดาห์)</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.chemicalFrequency || ''}
                      onChange={(e) => updateField('chemicalFrequency', Number(e.target.value))}
                      className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1.5">เวลาที่ฉีดพ่นเคมี (ชั่วโมง/ครั้ง)</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.chemicalDurationPerTime || ''}
                      onChange={(e) => updateField('chemicalDurationPerTime', Number(e.target.value))}
                      className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">ช่วงเวลาที่สารเคมีหนักที่สุดในรอบปี</label>
                  <input
                    type="text"
                    placeholder="เช่น เดือน มีนาคม - พฤษภาคม"
                    value={formData.peakChemicalPeriod || ''}
                    onChange={(e) => updateField('peakChemicalPeriod', e.target.value)}
                    className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">อุปกรณ์ป้องกันร่างกาย (PPE) ที่ใช้อยู่เสมอขณะพ่น</label>
                  <input
                    type="text"
                    placeholder="เช่น หน้ากากคาร์บอน, ถุงมือยาง, ชุดคลุมแขนยาว"
                    value={formData.ppeUsed || ''}
                    onChange={(e) => updateField('ppeUsed', e.target.value)}
                    className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-emerald-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* CHECKLIST OF 36 CHEMICAL SUBSTANCES */}
          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-xs">
            <div className="flex items-center gap-2 mb-4 border-b border-gray-50 pb-2">
              <h3 className="font-sans font-bold text-gray-900 text-base">
                ส่วนที่ 2.3: ชนิดสารเคมีจำจัดศัตรูพืชและปริมาณที่ใช้เป็นประจำ (36 รายการ)
              </h3>
              <div className="group relative">
                <Info className="h-4 w-4 text-gray-400 cursor-pointer" />
                <span className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-64 rounded-lg bg-gray-900 p-2 text-[10px] text-white hidden group-hover:block leading-relaxed z-30 shadow-md">
                  ติ๊กชื่อสารที่เกษตรกรเคยใช้หรือคุ้นเคย และระบุปริมาณที่ใช้งาน เช่น 5 ลิตร/ฤดูกาล
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3 max-h-[480px] overflow-y-auto pr-2 custom-scrollbar">
              {CHEMICAL_SUBSTANCES.map((sub) => {
                const chemState = formData.chemicals[sub.commonName] || { used: false, amount: '' };
                return (
                  <div
                    key={sub.id}
                    className={`flex items-center justify-between p-2 rounded-lg border transition ${
                      chemState.used ? 'border-emerald-400 bg-emerald-50/10' : 'border-gray-50 hover:bg-gray-50/50'
                    }`}
                  >
                    <label className="flex items-center gap-2.5 cursor-pointer select-none shrink-0 max-w-[200px] sm:max-w-[260px]">
                      <input
                        type="checkbox"
                        checked={chemState.used}
                        onChange={(e) => handleChemicalChange(sub.commonName, 'used', e.target.checked)}
                        className="rounded-sm border-gray-300 text-emerald-600 focus:ring-emerald-500 h-4 w-4"
                      />
                      <div className="text-left leading-tight">
                        <span className="block text-xs font-bold text-gray-800">{sub.tradeName}</span>
                        <span className="block text-[10px] text-gray-500 font-mono italic">{sub.commonName}</span>
                      </div>
                    </label>

                    {chemState.used && (
                      <input
                        type="text"
                        placeholder="ปริมาณที่ใช้ (ลิตร/กิโล)"
                        value={chemState.amount || ''}
                        onChange={(e) => handleChemicalChange(sub.commonName, 'amount', e.target.value)}
                        className="w-32 rounded-md border border-gray-200 bg-white px-2 py-1 text-xs focus:border-emerald-500 focus:outline-hidden"
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ==================== STEP 3: DASS-21 & ระบบประสาทส่วนกลาง ==================== */}
      {activeStep === 3 && (
        <div className="space-y-6 animate-fadeIn">
          {/* DASS-21 Stress and Anxiety assessment */}
          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-xs">
            <h3 className="font-sans font-bold text-gray-900 text-base mb-1">
              ส่วนที่ 3.1: แบบประเมินทางจิตวิทยา DASS-21
            </h3>
            <p className="text-xs text-gray-500 mb-5 leading-relaxed">
              กรุณาตอบคำถามแต่ละข้อโดยประเมินระดับความรู้สึกในช่วง <strong>1 สัปดาห์ที่ผ่านมา</strong>
            </p>

            {/* Scale legend */}
            <div className="mb-6 grid grid-cols-2 md:grid-cols-4 gap-2 bg-emerald-50/20 rounded-xl p-3 border border-emerald-100/50">
              <span className="text-[11px] text-gray-700 font-medium">0 = ไม่ตรงกับตัวเลย</span>
              <span className="text-[11px] text-gray-700 font-medium">1 = ตรงอยู่บ้าง/เกิดบางครั้ง</span>
              <span className="text-[11px] text-gray-700 font-medium">2 = ตรงบ่อยครั้ง/เกือบตลอดเวลา</span>
              <span className="text-[11px] text-gray-700 font-medium">3 = ตรงเกือบทุกข้อ/บ่อยที่สุด</span>
            </div>

            <div className="space-y-4 max-h-[440px] overflow-y-auto pr-2 custom-scrollbar">
              {DASS21_QUESTIONS.map((q) => {
                const selectedScore = formData.dassScores[q.id];
                return (
                  <div
                    key={q.id}
                    className="flex flex-col md:flex-row md:items-center justify-between p-3.5 rounded-lg border border-gray-50 bg-gray-50/20 hover:bg-emerald-50/5 gap-3"
                  >
                    <div className="text-left max-w-xl">
                      <span className="inline-block text-xs font-mono font-bold text-emerald-700 bg-emerald-100/60 px-1.5 py-0.5 rounded-sm mr-2">
                        ข้อ {q.id}
                      </span>
                      <span className="text-xs font-semibold text-gray-800 leading-relaxed">{q.text}</span>
                    </div>

                    <div className="flex gap-2 self-end md:self-center">
                      {[0, 1, 2, 3].map((score) => (
                        <button
                          type="button"
                          key={score}
                          onClick={() => handleDassScoreChange(q.id, score)}
                          className={`h-8 w-10 text-xs font-bold rounded-lg transition-all ${
                            selectedScore === score
                              ? 'bg-emerald-600 text-white shadow-xs'
                              : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          {score}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* CNS Cognitive decline questions (27 items) */}
          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-xs">
            <h3 className="font-sans font-bold text-gray-900 text-base mb-1">
              ส่วนที่ 3.2: แบบประเมินการเปลี่ยนแปลงของระบบประสาทส่วนกลางจากความเครียด
            </h3>
            <p className="text-xs text-gray-500 mb-5 leading-relaxed">
              โปรดตอบคำถามที่ตรงกับตัวของเกษตรกรมากที่สุดโดยคำนึงถึงอาการในช่วง <strong>28 วันที่ผ่านมา</strong>
            </p>

            <div className="space-y-4 max-h-[460px] overflow-y-auto pr-2 custom-scrollbar">
              {CNS_QUESTIONS.map((q) => {
                const selectedVal = formData.cnsSymptoms[q.id] || '';
                return (
                  <div
                    key={q.id}
                    className="p-4 rounded-xl border border-gray-50/80 bg-white shadow-3xs"
                  >
                    <p className="text-xs font-bold text-gray-800 text-left mb-3 leading-relaxed">
                      {q.id}. {q.text}
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                      {q.options.map((opt) => (
                        <button
                          type="button"
                          key={opt}
                          onClick={() => handleCnsSymptomChange(q.id, opt)}
                          className={`p-2 rounded-lg border text-[11px] font-semibold text-center transition truncate ${
                            selectedVal === opt
                              ? 'border-emerald-600 bg-emerald-50 text-emerald-800'
                              : 'border-gray-100 bg-gray-50/30 text-gray-600 hover:border-emerald-200'
                          }`}
                          title={opt}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ==================== STEP 4: การยศาสตร์ & สารเคมี ==================== */}
      {activeStep === 4 && (
        <div className="space-y-6 animate-fadeIn">
          {/* Ergonomic risks */}
          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-xs">
            <h3 className="font-sans font-bold text-gray-900 text-base mb-1">
              ส่วนที่ 4.1: การเคลื่อนไหว หรือท่าทางในการทำงาน (การยศาสตร์)
            </h3>
            <p className="text-xs text-gray-500 mb-5 leading-relaxed">
              ติ๊กเลือกเพื่อรายงานพฤติกรรมท่าทางในการทำงานสวนทุเรียนในช่วง <strong>28 วันที่ผ่านมา</strong>
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {ERGONOMIC_QUESTIONS.map((q) => {
                const isTrue = formData.ergonomicFactors[q.id] === true;
                return (
                  <div
                    key={q.id}
                    className={`flex items-center justify-between p-3.5 rounded-xl border transition ${
                      isTrue ? 'border-emerald-500 bg-emerald-50/10' : 'border-gray-50 hover:bg-gray-50'
                    }`}
                  >
                    <span className="text-xs font-semibold text-gray-800 leading-relaxed text-left pr-2">
                      {q.id}. {q.text}
                    </span>
                    <div className="flex gap-1.5 shrink-0">
                      {[
                        { label: 'ไม่ใช่', val: false },
                        { label: 'ใช่', val: true }
                      ].map((btn) => (
                        <button
                          type="button"
                          key={btn.label}
                          onClick={() => handleErgonomicChange(q.id, btn.val)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                            isTrue === btn.val
                              ? 'bg-emerald-600 text-white'
                              : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                          }`}
                        >
                          {btn.label}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Nordic Musculoskeletal Questionnaire (NMQ) with pain NRS */}
          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-xs">
            <h3 className="font-sans font-bold text-gray-900 text-base mb-1">
              ส่วนที่ 4.2: อาการปวดเมื่อยผิดปกติของกล้ามเนื้อและโครงกระดูก (NMQ)
            </h3>
            <p className="text-xs text-gray-500 mb-6 leading-relaxed">
              ระบุอาการผิดปกติ (ปวด เมื่อย ชา ตึง) ของร่างกายใน 9 ตำแหน่งหลักจากการทำงาน และกรอก <strong>ระดับความเจ็บปวด NRS (0-10)</strong>
            </p>

            <div className="space-y-4">
              {NMQ_BODY_PARTS.map((p) => {
                const nmqState = formData.nmqSymptoms[p.key] || { past12m: false, interrupted12m: false, past28d: false, past7d: false };
                const painState = formData.nrsPain[p.key] || { nrs7d: 0, nrs28d: 0, nrs12m: 0 };
                
                // Show pain NRS slider only if they had pain in any of these periods
                const hasAnyPain = nmqState.past7d || nmqState.past28d || nmqState.past12m;

                return (
                  <div
                    key={p.key}
                    className={`p-4 rounded-xl border transition shadow-3xs ${
                      hasAnyPain ? 'border-emerald-400 bg-emerald-50/10' : 'border-gray-50 hover:bg-gray-50/50'
                    }`}
                  >
                    <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-3 border-b border-gray-50 pb-2">
                      <span className="font-sans font-bold text-gray-900 text-sm">
                        📍 อาการตำแหน่ง: <strong className="text-emerald-900 text-base">{p.name}</strong>
                      </span>
                      
                      {/* Checkboxes of periods */}
                      <div className="flex flex-wrap gap-2">
                        {[
                          { label: 'มีใน 12 เดือน', key: 'past12m' },
                          { label: 'หยุดงาน 12 ด.', key: 'interrupted12m' },
                          { label: 'มีใน 28 วัน', key: 'past28d' },
                          { label: 'มีใน 7 วัน', key: 'past7d' }
                        ].map((chk) => (
                          <label
                            key={chk.key}
                            className={`flex items-center gap-1 px-2.5 py-1 rounded-md border text-[11px] cursor-pointer transition select-none ${
                              nmqState[chk.key as keyof typeof nmqState]
                                ? 'bg-emerald-600 border-emerald-600 text-white font-bold'
                                : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={nmqState[chk.key as keyof typeof nmqState]}
                              onChange={(e) => handleNmqChange(p.key, chk.key as any, e.target.checked)}
                              className="hidden"
                            />
                            {chk.label}
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Conditional NRS pain sliders */}
                    {hasAnyPain && (
                      <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 bg-white/70 rounded-lg p-3 border border-emerald-100/50 animate-fadeIn">
                        {[
                          { label: 'ความเจ็บปวด 7 วัน (NRS)', key: 'nrs7d', val: painState.nrs7d },
                          { label: 'ปวดสูงสุด 28 วัน (NRS)', key: 'nrs28d', val: painState.nrs28d },
                          { label: 'ปวดสูงสุด 12 เดือน (NRS)', key: 'nrs12m', val: painState.nrs12m }
                        ].map((painItem) => (
                          <div key={painItem.key}>
                            <div className="flex justify-between items-center text-xs text-gray-600 mb-1.5 font-semibold">
                              <span>{painItem.label}</span>
                              <span className="rounded-md bg-emerald-100 px-2 py-0.5 font-bold text-emerald-800 text-[10px]">
                                {painItem.val} / 10
                              </span>
                            </div>
                            <input
                              type="range"
                              min="0"
                              max="10"
                              value={painItem.val}
                              onChange={(e) => handleNrsPainChange(p.key, painItem.key as any, Number(e.target.value))}
                              className="w-full accent-emerald-600 h-1.5 bg-gray-100 rounded-lg appearance-none cursor-pointer"
                            />
                            <div className="flex justify-between text-[8px] text-gray-400 mt-0.5 leading-none">
                              <span>ไม่ปวดเลย</span>
                              <span>ปวดปานกลาง</span>
                              <span>ปวดรุนแรงที่สุด</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ==================== STEP 5: แบบประเมินระดับประสาท Q16 & สรุปตรวจเจาะเลือด ==================== */}
      {activeStep === 5 && (
        <div className="space-y-6 animate-fadeIn">
          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-xs">
            <h3 className="font-sans font-bold text-gray-900 text-base mb-1">
              ส่วนที่ 5.1: แบบประเมินระดับอาการทางระบบประสาท Q16 (Neurotoxic Symptoms)
            </h3>
            <p className="text-xs text-gray-500 mb-5 leading-relaxed">
              ติ๊กเลือกเป็น <strong>"ใช่"</strong> หรือ <strong>"ไม่ใช่"</strong> หากเกษตรกรมีอาการเหล่านี้ในชีวิตประจำวัน
            </p>

            <div className="space-y-3 max-h-[440px] overflow-y-auto pr-2 custom-scrollbar">
              {Q16_QUESTIONS.map((q) => {
                const isTrue = formData.q16Symptoms[q.id] === true;
                return (
                  <div
                    key={q.id}
                    className={`flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-xl border transition gap-3 ${
                      isTrue ? 'border-emerald-500 bg-emerald-50/15' : 'border-gray-50 hover:bg-gray-50'
                    }`}
                  >
                    <span className="text-xs font-semibold text-gray-800 text-left leading-relaxed">
                      {q.id}. {q.text}
                    </span>

                    <div className="flex gap-1.5 self-end sm:self-center shrink-0">
                      {[
                        { label: 'ไม่ใช่', val: false },
                        { label: 'ใช่ (มีอาการ)', val: true }
                      ].map((btn) => (
                        <button
                          type="button"
                          key={btn.label}
                          onClick={() => handleQ16Change(q.id, btn.val)}
                          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${
                            isTrue === btn.val
                              ? 'bg-emerald-600 text-white shadow-3xs'
                              : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                          }`}
                        >
                          {btn.label}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* REAL-TIME BLOOD TEST SCREENING PROFILE EVALUATOR */}
          <div className="rounded-2xl border border-emerald-100 bg-gradient-to-tr from-emerald-50/30 to-teal-50/20 p-6 shadow-xs">
            <h3 className="font-sans font-bold text-gray-900 text-base mb-1 flex items-center gap-2">
              📊 เครื่องคัดกรองประเมินเกณฑ์ตรวจเจาะเลือดเชิงรุกเรียลไทม์
            </h3>
            <p className="text-xs text-gray-600 mb-4 leading-relaxed">
              วิเคราะห์ความเสี่ยงและคัดแยกเกษตรกรที่มีโอกาสเสี่ยงทางสารเคมีสูงเพื่อส่งตรวจเจาะเลือด 
              (เข้าเกณฑ์คัดกรองทั้งหมดครบ 8 ข้อ)
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-5">
              {rulesMet.map((rule, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-3 p-3 rounded-xl border border-white bg-white/70 shadow-3xs"
                >
                  <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                    rule.met ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-400'
                  }`}>
                    {rule.met ? '✓' : '✗'}
                  </span>
                  <div className="text-left leading-tight">
                    <span className={`block text-xs font-semibold ${rule.met ? 'text-gray-900' : 'text-gray-400'}`}>
                      {rule.label}
                    </span>
                    <span className="text-[10px] text-gray-500 font-mono italic">
                      ({rule.desc})
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Verdict summary card */}
            <div className={`p-4 rounded-xl border flex flex-col sm:flex-row items-center justify-between gap-4 ${
              metCount === 8
                ? 'bg-red-50 border-red-100 text-red-900'
                : 'bg-emerald-50/50 border-emerald-100 text-emerald-900'
            }`}>
              <div className="text-left">
                <span className="text-[10px] font-bold block uppercase leading-none">ผลลัพธ์การคัดกรองภาคสนาม</span>
                <span className="text-lg font-bold block mt-1">
                  {metCount === 8 ? '🚨 เข้าข่ายต้องเจาะเลือดตรวจเคมีพิเศษ' : `ผ่านเกณฑ์ ${metCount} จาก 8 ข้อ (ไม่เข้าข่าย)`}
                </span>
                <span className="text-xs text-gray-500 block mt-0.5 leading-relaxed">
                  {metCount === 8 
                    ? 'ผู้สมัครเข้าคุณลักษณะสุขภาพตรงตามเกณฑ์คัดกรองพิเศษทั้งหมด แนะนำส่งตัวเจาะเลือดวิเคราะห์แล็บเชิงลึก'
                    : 'ผู้เข้าร่วมวิจัยยังผ่านเกณฑ์ไม่ครบถ้วนทั้งหมดที่จะถูกระบุให้ส่งตรวจเจาะเลือดพิเศษ'}
                </span>
              </div>
              <div className="shrink-0 text-center font-sans font-black text-2xl tracking-tight leading-none">
                {metCount} / 8
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Button controls (Next, Prev, Cancel, Submit) */}
      <div className="mt-8 flex justify-between items-center border-t border-gray-100 pt-5">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition"
        >
          ยกเลิกและย้อนกลับ
        </button>

        <div className="flex gap-2">
          {activeStep > 1 && (
            <button
              type="button"
              onClick={() => setActiveStep((prev) => prev - 1)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition"
            >
              <ChevronLeft className="h-4.5 w-4.5" />
              ย้อนกลับ
            </button>
          )}

          {activeStep < 5 ? (
            <button
              type="button"
              onClick={() => setActiveStep((prev) => prev + 1)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 text-sm font-semibold shadow-xs transition"
            >
              ส่วนถัดไป
              <ChevronRight className="h-4.5 w-4.5" />
            </button>
          ) : (
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white px-6 py-2.5 text-sm font-bold shadow-md shadow-emerald-100 disabled:opacity-50 transition"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  กำลังส่งข้อมูลลงชีท...
                </>
              ) : (
                <>
                  <FileSpreadsheet className="h-4.5 w-4.5" />
                  ส่งแบบสอบถามเข้า Sheet
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </form>
  );
}
