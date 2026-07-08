import { useState, useMemo, useEffect } from 'react';
import { Participant, VILLAGES } from '../types';
import { calculateBloodTestEligibility, getSheetTabName } from '../lib/googleSheets';
import { CHEMICAL_SUBSTANCES, NMQ_BODY_PARTS, Q16_QUESTIONS } from '../data/questionnaireData';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import {
  Users,
  HeartPulse,
  Activity,
  AlertTriangle,
  Search,
  ChevronDown,
  ChevronUp,
  FileSpreadsheet,
  Info,
  SlidersHorizontal,
  FolderOpen,
  RefreshCw,
  Database
} from 'lucide-react';
import { User } from 'firebase/auth';

interface DashboardViewProps {
  participants: Participant[];
  onEditParticipant: (participant: Participant) => void;
  user: User | null;
  spreadsheetId: string | null;
  onSyncToSheets?: () => void;
  isSyncingSheets?: boolean;
  onUpdateSpreadsheetId?: (id: string) => Promise<void>;
}

const COLORS = ['#059669', '#10b981', '#34d399', '#6ee7b7', '#a7f3d0', '#cbd5e1', '#94a3b8', '#64748b', '#475569'];

export default function DashboardView({
  participants,
  onEditParticipant,
  user,
  spreadsheetId,
  onSyncToSheets,
  isSyncingSheets,
  onUpdateSpreadsheetId
}: DashboardViewProps) {
  const [selectedVillageFilter, setSelectedVillageFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  
  const [sheetUrlInput, setSheetUrlInput] = useState(
    spreadsheetId ? `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit` : ''
  );
  const [isUpdatingId, setIsUpdatingId] = useState(false);

  useEffect(() => {
    if (spreadsheetId) {
      setSheetUrlInput(`https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`);
    } else {
      setSheetUrlInput('');
    }
  }, [spreadsheetId]);

  // 1. Calculate Summary Stats
  const stats = useMemo(() => {
    const total = participants.length;
    let bloodTestCandidates = 0;
    let sumAge = 0;
    let validAgeCount = 0;
    let sumBmi = 0;
    let validBmiCount = 0;
    let highStress = 0;

    participants.forEach((p) => {
      const eligibility = calculateBloodTestEligibility(p);
      if (eligibility.eligible) {
        bloodTestCandidates++;
      }

      if (p.age > 0) {
        sumAge += p.age;
        validAgeCount++;
      }

      if (p.weight > 0 && p.height > 0) {
        const bmi = p.weight / (p.height * p.height);
        sumBmi += bmi;
        validBmiCount++;
      }

      // Check DASS stress (scores are parsed into dassScores.stress on row reload)
      const stressVal = (p.dassScores as any)?.stress || 0;
      if (stressVal >= 15) { // Severe or extremely severe stress
        highStress++;
      }
    });

    return {
      total,
      bloodTestCandidates,
      averageAge: validAgeCount > 0 ? (sumAge / validAgeCount).toFixed(1) : '0',
      averageBmi: validBmiCount > 0 ? (sumBmi / validBmiCount).toFixed(1) : '0',
      highStress
    };
  }, [participants]);

  // 2. Chart Data: Submissions per Village
  const villageChartData = useMemo(() => {
    return VILLAGES.map((v) => {
      const count = participants.filter((p) => p.village === v.id.toString()).length;
      return {
        name: v.name,
        count
      };
    });
  }, [participants]);

  // 3. Chart Data: Pain Frequency by body part
  const painChartData = useMemo(() => {
    return NMQ_BODY_PARTS.map((part) => {
      const count = participants.filter((p) => {
        const state = p.nmqSymptoms?.[part.key];
        return state && (state.past7d || state.past28d || state.past12m);
      }).length;
      return {
        name: part.name,
        count
      };
    }).sort((a, b) => b.count - a.count);
  }, [participants]);

  // 4. Chart Data: Top 5 pesticide chemicals
  const chemicalChartData = useMemo(() => {
    const counts: { [key: string]: number } = {};
    CHEMICAL_SUBSTANCES.forEach((c) => {
      counts[c.commonName] = 0;
    });

    participants.forEach((p) => {
      Object.entries(p.chemicals || {}).forEach(([name, val]) => {
        if (val && val.used) {
          counts[name] = (counts[name] || 0) + 1;
        }
      });
    });

    return Object.entries(counts)
      .map(([name, count]) => {
        const matchingChem = CHEMICAL_SUBSTANCES.find(c => c.commonName === name);
        return {
          name: matchingChem ? matchingChem.tradeName : name,
          count
        };
      })
      .filter((item) => item.count > 0)
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);
  }, [participants]);

  // 5. Gender representation Pie chart
  const genderChartData = useMemo(() => {
    const male = participants.filter((p) => p.gender === 'ชาย').length;
    const female = participants.filter((p) => p.gender === 'หญิง').length;
    const other = participants.length - male - female;
    
    return [
      { name: 'ชาย', value: male },
      { name: 'หญิง', value: female },
      ...(other > 0 ? [{ name: 'ไม่ระบุ', value: other }] : [])
    ];
  }, [participants]);

  // 6. Filter & Search participants list
  const filteredParticipants = useMemo(() => {
    return participants.filter((p) => {
      const matchesVillage = selectedVillageFilter === 'all' || p.village === selectedVillageFilter;
      const cleanSearch = searchTerm.trim().toLowerCase();
      const matchesSearch =
        !cleanSearch ||
        (p.participantCode || '').toLowerCase().includes(cleanSearch) ||
        (p.docNo || '').toLowerCase().includes(cleanSearch);
      return matchesVillage && matchesSearch;
    });
  }, [participants, selectedVillageFilter, searchTerm]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      
      {/* Firebase Cloud Firestore / Sync Status Banner */}
      <div className="mb-6 rounded-2xl border border-emerald-100 bg-gradient-to-r from-emerald-50/50 to-teal-50/30 p-5 shadow-3xs flex flex-col gap-4 text-left">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-600/10 text-emerald-700 shrink-0 mt-0.5">
              <Database className="h-5.5 w-5.5" />
            </div>
            <div>
              <h2 className="font-sans font-bold text-gray-900 text-sm leading-none flex flex-wrap items-center gap-2 pb-1">
                ฐานข้อมูลวิจัย Cloud Firebase Firestore
                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold ${
                  user ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'
                }`}>
                  {user ? '● เชื่อมต่อ Cloud Firestore เรียลไทม์แล้ว' : '● ออฟไลน์ (รอเชื่อมต่อ)'}
                </span>
              </h2>
              <p className="text-xs text-gray-500 mt-2 max-w-2xl leading-relaxed">
                {user 
                  ? `ระบบรวบรวมข้อมูลแบบสอบถามถูกปรับปรุงให้จัดเก็บและสำรองข้อมูลลงสู่ Cloud Firebase Firestore โดยตรงอย่างปลอดภัย ป้องกันปัญหาข้อมูลสูญหายและแชร์ข้อมูลเรียลไทม์ร่วมกันกับเกษตรกรและผู้ใช้ทุกคนทันที`
                  : `แอปพลิเคชันทำงานในโหมดจัดเก็บข้อมูลแบบจำกัด กรุณาเข้าสู่ระบบผ่านบัญชี Google เพื่อใช้งาน Cloud Firebase Firestore เต็มรูปแบบร่วมกับสมาชิกท่านอื่น`
                }
              </p>
            </div>
          </div>
          
          <div className="flex gap-2.5 shrink-0 self-end md:self-center">
            <button
              onClick={onSyncToSheets}
              disabled={isSyncingSheets}
              className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white px-5 py-2.5 text-xs font-extrabold shadow-sm cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${isSyncingSheets ? 'animate-spin' : ''}`} />
              {isSyncingSheets ? 'กำลังดึงคลาวด์...' : 'ดึงข้อมูลล่าสุดจากคลาวด์'}
            </button>
          </div>
        </div>
      </div>
      
      {/* SECTION 1: Summary Statistics Grid */}
      <div className="mb-8 grid grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Total records */}
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-3xs flex items-center gap-4 text-left">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 text-emerald-800 shrink-0">
            <Users className="h-6 w-6" />
          </div>
          <div>
            <span className="text-[10px] text-gray-500 font-bold uppercase leading-none block">จำนวนผู้กรอกทั้งหมด</span>
            <span className="text-2xl font-black text-gray-900 mt-1 block tracking-tight">{stats.total} ราย</span>
          </div>
        </div>

        {/* Blood test candidates */}
        <div className="rounded-2xl border border-red-100 bg-red-50/20 p-5 shadow-3xs flex items-center gap-4 text-left">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-100 text-red-800 shrink-0 animate-pulse">
            <HeartPulse className="h-6 w-6" />
          </div>
          <div>
            <span className="text-[10px] text-red-600 font-bold uppercase leading-none block">เข้าข่ายต้องเจาะเลือด</span>
            <span className="text-2xl font-black text-red-900 mt-1 block tracking-tight">{stats.bloodTestCandidates} ราย</span>
          </div>
        </div>

        {/* High risk neuro / stress */}
        <div className="rounded-2xl border border-amber-100 bg-amber-50/20 p-5 shadow-3xs flex items-center gap-4 text-left">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100 text-amber-800 shrink-0">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <div>
            <span className="text-[10px] text-amber-700 font-bold uppercase leading-none block">เครียดสะสมสูง (DASS)</span>
            <span className="text-2xl font-black text-amber-900 mt-1 block tracking-tight">{stats.highStress} ราย</span>
          </div>
        </div>

        {/* Average Age */}
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-3xs flex items-center gap-4 text-left">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-blue-800 shrink-0">
            <Activity className="h-6 w-6" />
          </div>
          <div>
            <span className="text-[10px] text-gray-500 font-bold uppercase leading-none block">อายุเฉลี่ยเกษตรกร</span>
            <span className="text-2xl font-black text-gray-900 mt-1 block tracking-tight">{stats.averageAge} ปี</span>
          </div>
        </div>

        {/* Average BMI */}
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-3xs col-span-2 lg:col-span-1 flex items-center gap-4 text-left">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-teal-100 text-teal-800 shrink-0">
            <SlidersHorizontal className="h-6 w-6" />
          </div>
          <div>
            <span className="text-[10px] text-gray-500 font-bold uppercase leading-none block">ดัชนีมวลกายเฉลี่ย</span>
            <span className="text-2xl font-black text-gray-900 mt-1 block tracking-tight">{stats.averageBmi} BMI</span>
          </div>
        </div>
      </div>

      {/* SECTION 2: Analytics Visualizations Grid */}
      <div className="mb-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Chart A: Submissions by village */}
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-xs lg:col-span-2 text-left">
          <h4 className="font-sans font-bold text-gray-800 text-sm mb-4">
            📊 จำนวนประชากรวิจัยแยกตามหมู่บ้าน (ทั้ง 9 หมู่บ้าน)
          </h4>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={villageChartData} margin={{ top: 10, right: 10, left: -25, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" stroke="#64748b" fontSize={10} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={10} tickLine={false} />
                <Tooltip cursor={{ fill: '#f8fafc' }} />
                <Bar dataKey="count" fill="#059669" radius={[4, 4, 0, 0]} barSize={36} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart B: Gender representation */}
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-xs text-left">
          <h4 className="font-sans font-bold text-gray-800 text-sm mb-4">
            🥧 สัดส่วนเพศของผู้ทำแบบสอบถาม
          </h4>
          <div className="h-72 w-full flex flex-col items-center justify-center">
            {participants.length === 0 ? (
              <span className="text-xs text-gray-400">ไม่มีข้อมูล</span>
            ) : (
              <ResponsiveContainer width="100%" height="90%">
                <PieChart>
                  <Pie
                    data={genderChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {genderChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Chart C: Pain frequency by body part */}
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-xs lg:col-span-2 text-left">
          <h4 className="font-sans font-bold text-gray-800 text-sm mb-4">
            💪 ตำแหน่งกล้ามเนื้อที่รายงานปวดเมื่อยสูงสุด (NMQ อาการสะสม)
          </h4>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={painChartData} layout="vertical" margin={{ top: 5, right: 10, left: 15, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" stroke="#64748b" fontSize={10} tickLine={false} />
                <YAxis dataKey="name" type="category" stroke="#64748b" fontSize={10} tickLine={false} />
                <Tooltip cursor={{ fill: '#f8fafc' }} />
                <Bar dataKey="count" fill="#10b981" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart D: Chemical substances used */}
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-xs text-left">
          <h4 className="font-sans font-bold text-gray-800 text-sm mb-4">
            🧪 5 สารเคมีที่สวนทุเรียนใช้บ่อยที่สุด
          </h4>
          <div className="h-72 w-full">
            {chemicalChartData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-gray-400">ยังไม่มีข้อมูลใช้ยาเคมี</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chemicalChartData} margin={{ top: 10, right: 10, left: -25, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" stroke="#64748b" fontSize={9} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={10} tickLine={false} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#34d399" radius={[4, 4, 0, 0]} barSize={24} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* SECTION 3: Filterable Participants Data Table */}
      <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-xs text-left">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-gray-50 pb-4 mb-6">
          <div>
            <h3 className="font-sans font-bold text-gray-900 text-base">
              📋 รายการข้อมูลและประวัติผู้เข้าร่วมโครงการวิจัยสุขภาพ
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              รวมทุกหมู่บ้าน ค้นหา ดึง และประเมินเกณฑ์ตรวจเลือดเพื่อเข้าศึกษาแล็บเชิงลึก
            </p>
          </div>

          {/* Filtering controls */}
          <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
            {/* Village selector */}
            <div className="relative shrink-0 w-full sm:w-44">
              <select
                value={selectedVillageFilter}
                onChange={(e) => setSelectedVillageFilter(e.target.value)}
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-semibold focus:outline-hidden focus:border-emerald-500 appearance-none"
              >
                <option value="all">กรอง: ทุกหมู่บ้าน</option>
                {VILLAGES.map((v) => (
                  <option key={v.id} value={v.id.toString()}>
                    {v.moo} {v.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-56">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-gray-400" />
              <input
                type="text"
                placeholder="ค้นชื่อ/รหัส/เลขแบบสอบถาม..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-lg border border-gray-200 bg-white pl-8 pr-3 py-2 text-xs focus:outline-hidden focus:border-emerald-500"
              />
            </div>
          </div>
        </div>

        {/* Data Table */}
        {filteredParticipants.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="rounded-full bg-gray-50 p-3.5 text-gray-400 mb-3">
              <FolderOpen className="h-6 w-6" />
            </div>
            <p className="text-sm font-semibold text-gray-500">ไม่พบข้อมูลประวัติผู้สมัครรับคัดเลือก</p>
            <p className="text-xs text-gray-400 mt-1 max-w-sm">กรุณากรอกแบบสอบถามรายใหม่ หรือเชื่อมต่อกู้ข้อมูลจาก Google Sheets</p>
          </div>
        ) : (
          <div className="overflow-x-auto border border-gray-100 rounded-xl">
            <table className="min-w-full divide-y divide-gray-100 text-left">
              <thead className="bg-gray-50/70 font-sans font-bold text-gray-700 text-xs">
                <tr>
                  <th className="px-4 py-3.5">เลขที่แบบสอบถาม</th>
                  <th className="px-4 py-3.5">รหัส/ชื่อผู้เข้าร่วม</th>
                  <th className="px-4 py-3.5">สังกัดหมู่บ้าน</th>
                  <th className="px-4 py-3.5">อายุ</th>
                  <th className="px-4 py-3.5 text-center">คะแนนประสาท Q16</th>
                  <th className="px-4 py-3.5">ผ่านเกณฑ์เจาะเลือด</th>
                  <th className="px-4 py-3.5 text-center">ดูรายละเอียด</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs">
                {filteredParticipants.map((p, idx) => {
                  const uniqueId = p.docNo + '-' + (p.participantCode || idx.toString());
                  const isExpanded = expandedRow === uniqueId;
                  const eligibility = calculateBloodTestEligibility(p);
                  
                  // Score counts
                  const neuroScore = Object.values(p.q16Symptoms || {}).filter(val => val === true).length;
                  const criteriaMetCount = [
                    eligibility.neuroScoreHigh,
                    eligibility.pesticideExperienceHigh,
                    eligibility.ageOver20,
                    eligibility.pesticideFrequencyHigh,
                    eligibility.noAlcoholPastMonth,
                    eligibility.noSmokingPastMonth,
                    eligibility.restTimeSufficient,
                    eligibility.workChemicalHoursHigh
                  ].filter(Boolean).length;

                  const rulesMet = [
                    { label: 'คะแนนระดับอาการประสาท Q16 > 6', met: eligibility.neuroScoreHigh },
                    { label: 'ทำงานกับสารเคมีกำจัดศัตรูพืช >= 1 ปีขึ้นไป', met: eligibility.pesticideExperienceHigh },
                    { label: 'มีอายุมากกว่า 20 ปีขึ้นไป', met: eligibility.ageOver20 },
                    { label: 'ทำงานกับสารเคมีมากกว่า 3 ครั้งต่อสัปดาห์', met: eligibility.pesticideFrequencyHigh },
                    { label: 'ไม่มีประวัติดื่มแอลกอฮอล์ในช่วง 1 เดือนที่ผ่านมา', met: eligibility.noAlcoholPastMonth },
                    { label: 'ไม่มีประวัติสูบบุหรี่ในช่วง 1 เดือนที่ผ่านมา', met: eligibility.noSmokingPastMonth },
                    { label: 'เวลาพักไม่น้อยกว่า 1 ชั่วโมงต่อวันขณะทำงาน', met: eligibility.restTimeSufficient },
                    { label: 'ความถี่ทำงานเกี่ยวกับสารเคมีนานกว่า 4 ชั่วโมงต่อวัน', met: eligibility.workChemicalHoursHigh }
                  ];

                  return (
                    <>
                      <tr key={uniqueId} className="hover:bg-emerald-50/5">
                        <td className="px-4 py-3.5 font-mono font-bold text-emerald-800">
                          {p.docNo || '-'}
                        </td>
                        <td className="px-4 py-3.5 font-sans font-bold text-gray-900">
                          {p.participantCode}
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="rounded-md bg-emerald-100/60 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800">
                            {getSheetTabName(p.village)}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-gray-700 font-semibold">{p.age} ปี</td>
                        <td className="px-4 py-3.5 text-center font-bold text-gray-800">{neuroScore} / 16</td>
                        <td className="px-4 py-3.5">
                          <span className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[10px] font-bold ${
                            criteriaMetCount === 8
                              ? 'bg-red-100 text-red-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}>
                            <span className={`h-1.5 w-1.5 rounded-full ${criteriaMetCount === 8 ? 'bg-red-600' : 'bg-emerald-600'}`} />
                            {criteriaMetCount === 8 ? 'เข้าข่ายเจาะเลือด' : `ผ่าน ${criteriaMetCount}/8 ข้อ`}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => setExpandedRow(isExpanded ? null : uniqueId)}
                              className="rounded-lg p-1 text-gray-500 hover:bg-emerald-50 hover:text-emerald-800 transition"
                              title="เปิดขยายรายละเอียด"
                            >
                              {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                            </button>
                            <button
                              onClick={() => onEditParticipant(p)}
                              className="rounded-lg px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-[10px] transition"
                              title="แก้ไขผู้เข้าร่วม"
                            >
                              แก้ไข
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* EXPANDED SURVEY DETAILS ROW */}
                      {isExpanded && (
                        <tr className="bg-emerald-50/10">
                          <td colSpan={7} className="p-5 border-t border-emerald-100/50">
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-left text-xs text-gray-600 leading-relaxed">
                              
                              {/* Left box: General factors */}
                              <div className="bg-white rounded-xl p-4 border border-emerald-100/40 shadow-3xs">
                                <h5 className="font-sans font-bold text-gray-900 mb-2 border-b border-gray-50 pb-1">
                                  👤 ข้อมูลปัจจัยส่วนบุคคล
                                </h5>
                                <ul className="space-y-1.5 font-medium">
                                  <li>เพศ: <strong>{p.gender || 'ไม่ระบุ'}</strong></li>
                                  <li>การศึกษา: <strong>{p.education}</strong></li>
                                  <li>สถานภาพ: <strong>{p.maritalStatus || 'ไม่ระบุ'}</strong></li>
                                  <li>น้ำหนัก/ส่วนสูง: <strong>{p.weight} กก. / {p.height} ม.</strong></li>
                                  <li>บุหรี่: <strong>{p.smoking === 'สูบ' ? `สูบ (${p.smokingAmount} มวน/วัน)` : 'ไม่สูบ'}</strong></li>
                                  <li>แอลกอฮอล์: <strong>{p.alcohol === 'ดื่ม' ? `ดื่ม (${p.alcoholAmount})` : 'ไม่ดื่ม'}</strong></li>
                                  <li>เครื่องดื่มชูกำลัง: <strong>{p.energyDrink === 'ดื่ม' ? `ดื่ม (${p.energyDrinkAmount} ขวด/วัน)` : 'ไม่ดื่ม'}</strong></li>
                                  <li>ออกกำลังกาย: <strong>{p.exercise || 'ไม่ระบุ'}</strong></li>
                                  <li>การนอนหลับ: <strong>{p.sleepAdequate} ({p.sleepHours} ชม./คืน)</strong></li>
                                </ul>
                              </div>

                              {/* Middle-Left box: Work factors */}
                              <div className="bg-white rounded-xl p-4 border border-emerald-100/40 shadow-3xs">
                                <h5 className="font-sans font-bold text-gray-900 mb-2 border-b border-gray-50 pb-1">
                                  🚜 ปัจจัยการทำงาน
                                </h5>
                                <ul className="space-y-1.5 font-medium">
                                  <li>อายุงานสวนทุเรียน: <strong>{p.workYears} ปี {p.workMonths} เดือน</strong></li>
                                  <li>ชั่วโมงทำงาน/วัน: <strong>{p.workHoursPerDay} ชั่วโมง</strong></li>
                                  <li>งานนอกสวนทุเรียน: <strong>{p.otherJobs || 'ไม่มี'}</strong></li>
                                  <li>พักระหว่างวัน: <strong>{p.restDuration} ชม. ({p.restFrequency || 'ไม่ระบุ'})</strong></li>
                                  <li>ทำฤดูกาล / รายได้ตามฤดูกาล: <strong>{p.seasonalWork} / {p.seasonalIncome}</strong></li>
                                </ul>

                                <h5 className="font-sans font-bold text-gray-900 mt-4 mb-2 border-b border-gray-50 pb-1">
                                  🧪 การใช้สารเคมีและสารกำจัดศัตรูพืช
                                </h5>
                                <ul className="space-y-1.5 font-medium">
                                  <li>หน้าที่: <strong>{p.chemicalRoles?.join(', ') || 'ไม่มีหน้าที่โดยตรง'}</strong></li>
                                  <li>ความถี่เคมี: <strong>{p.chemicalFrequency} ครั้ง/สัปดาห์</strong></li>
                                  <li>ชั่วโมงฉีดพ่น: <strong>{p.chemicalDurationPerTime} ชม./ครั้ง</strong></li>
                                  <li>ช่วงเคมีหนักสุด: <strong>{p.peakChemicalPeriod || 'ไม่ระบุ'}</strong></li>
                                  <li>อุปกรณ์ PPE: <strong>{p.ppeUsed || 'ไม่สวมใส่'}</strong></li>
                                </ul>
                              </div>

                              {/* Middle-Right box: DASS & Q16 */}
                              <div className="bg-white rounded-xl p-4 border border-emerald-100/40 shadow-3xs">
                                <h5 className="font-sans font-bold text-gray-900 mb-2 border-b border-gray-50 pb-1">
                                  🧠 ผลประเมินสุขภาพจิต & ประสาท
                                </h5>
                                <ul className="space-y-2 font-medium">
                                  <li>
                                    <span className="font-semibold block text-gray-500 text-[10px]">ระดับ DASS-21:</span>
                                    <div className="flex gap-1.5 mt-1">
                                      <span className="rounded-md bg-emerald-50 px-2 py-0.5 font-bold text-emerald-800 text-[10px]" title="Stress">
                                        เครียด: {(p.dassScores as any)?.stress ?? '-'}
                                      </span>
                                      <span className="rounded-md bg-emerald-50 px-2 py-0.5 font-bold text-emerald-800 text-[10px]" title="Anxiety">
                                        กังวล: {(p.dassScores as any)?.anxiety ?? '-'}
                                      </span>
                                      <span className="rounded-md bg-emerald-50 px-2 py-0.5 font-bold text-emerald-800 text-[10px]" title="Depression">
                                        ซึมเศร้า: {(p.dassScores as any)?.depression ?? '-'}
                                      </span>
                                    </div>
                                  </li>
                                  <li>
                                    <span className="font-semibold block text-gray-500 text-[10px]">ระบบประสาท Q16 (ใช่ {neuroScore} ข้อ):</span>
                                    <div className="max-h-28 overflow-y-auto mt-1 pr-1 border border-gray-50 rounded-md p-1 bg-gray-50/20 text-[10px] space-y-1">
                                      {Object.entries(p.q16Symptoms || {}).map(([num, val]) => {
                                        if (val) {
                                          const qText = Q16_QUESTIONS.find(q => q.id.toString() === num.toString())?.text;
                                          return <span key={num} className="block text-red-600 font-medium">✓ ข้อ {num}: {qText}</span>;
                                        }
                                        return null;
                                      })}
                                      {neuroScore === 0 && <span className="block text-emerald-600">ไม่มีอาการผิดปกติ</span>}
                                    </div>
                                  </li>
                                </ul>
                              </div>

                              {/* Right box: Chemicals details */}
                              <div className="bg-white rounded-xl p-4 border border-emerald-100/40 shadow-3xs">
                                <h5 className="font-sans font-bold text-gray-900 mb-2 border-b border-gray-50 pb-1">
                                  🧪 ยาและเคมีพ่นที่สัมผัส
                                </h5>
                                <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1 font-semibold text-[10px]">
                                  {Object.entries(p.chemicals || {})
                                    .filter(([_, value]) => value && (value as any).used)
                                    .map(([name, value]) => {
                                      const full = CHEMICAL_SUBSTANCES.find(c => c.commonName === name);
                                      return (
                                        <div key={name} className="flex justify-between items-center bg-gray-50 p-1.5 rounded-md border border-gray-100">
                                          <div className="text-left">
                                            <span className="block font-bold text-gray-800">{full ? full.tradeName : name}</span>
                                            <span className="block text-[8px] text-gray-400 font-mono">{name}</span>
                                          </div>
                                          <span className="bg-emerald-100 text-emerald-900 px-1.5 py-0.5 rounded-sm font-bold">
                                            {(value as any).amount || 'ไม่ระบุ'}
                                          </span>
                                        </div>
                                      );
                                    })}
                                  {Object.values(p.chemicals || {}).filter(c => c && (c as any).used).length === 0 && (
                                    <span className="text-xs text-gray-400 block py-4 text-center">ไม่มีเคมีที่ระบุ</span>
                                  )}
                                </div>

                                <h5 className="font-sans font-bold text-gray-900 mt-4 mb-2 border-b border-gray-50 pb-1">
                                  🩺 เกณฑ์คัดกรองตรวจเลือดผ่าน
                                </h5>
                                <div className="grid grid-cols-4 gap-1">
                                  {rulesMet.map((rule, idx) => (
                                    <div
                                      key={idx}
                                      className={`h-5 flex items-center justify-center rounded-md font-bold text-[9px] ${
                                        rule.met ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-400'
                                      }`}
                                      title={rule.label}
                                    >
                                      ข้อ {idx + 1}
                                    </div>
                                  ))}
                                </div>
                              </div>

                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
