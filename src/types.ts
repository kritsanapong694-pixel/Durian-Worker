export interface Participant {
  id?: string;
  docNo: string; // เลขที่แบบสอบถาม
  date: string; // วันที่ทำแบบสอบถาม
  participantCode: string; // รหัส/ชื่อผู้เข้าร่วม
  village: string; // หมู่บ้าน 1-9
  
  // ส่วนที่ 1: ข้อมูลทั่วไป
  age: number;
  gender: 'ชาย' | 'หญิง' | '';
  education: string;
  educationOther?: string;
  maritalStatus: string;
  weight: number;
  height: number;
  smoking: 'ไม่สูบ' | 'สูบ';
  smokingAmount?: number; // มวนต่อวัน
  alcohol: 'ไม่ดื่ม' | 'ดื่ม';
  alcoholAmount?: string; // แก้ว/ขวด/กระป๋องต่อครั้ง
  energyDrink: 'ไม่ดื่ม' | 'ดื่ม';
  energyDrinkAmount?: number; // ขวด/กระป๋องต่อวัน
  diseases: string[]; // โรคประจำตัว
  diseasesOther?: string;
  medications: string[]; // ยาประจำตัว
  medicationsOther?: string;
  regularMedicationDetail?: string; // ยาที่รับประทานประจำอื่นๆ
  exercise: string;
  exerciseOther?: string;
  sleepAdequate: 'เพียงพอ' | 'ไม่เพียงพอ' | '';
  sleepHours?: number; // ชั่วโมงต่อวัน

  // ส่วนที่ 2: ปัจจัยด้านการทำงาน
  workYears: number; // อายุงาน ปี
  workMonths: number; // อายุงาน เดือน
  workHoursPerDay: number; // ชั่วโมงการทำงานต่อวัน
  otherJobs?: string; // งานอื่นๆ
  seasonalWork: 'ใช่' | 'ไม่ใช่' | '';
  seasonalIncome: 'ใช่' | 'ไม่ใช่' | '';
  peakChemicalPeriod?: string; // ช่วงที่งานใช้สารเคมีหนักที่สุด
  restDuration: number; // ระยะเวลาพักในการทำงาน 1 วัน (ชั่วโมง)
  restFrequency?: string; // ความถี่ในการพักต่อวัน
  chemicalRoles: string[]; // ผสม, ฉีดพ่น, ล้าง, เก็บ, อื่นๆ
  chemicalRolesOther?: string;
  chemicalFrequency: number; // ครั้งต่อสัปดาห์
  chemicalDurationPerTime: number; // ชั่วโมงต่อครั้ง
  ppeUsed?: string; // อุปกรณ์ป้องกัน
  chemicals: { [key: string]: { used: boolean; amount?: string } }; // key is chemical name/ID

  // ส่วนที่ 3: DASS-21 & ระบบประสาทส่วนกลาง
  dassScores: { [key: number]: number }; // question number (1-21) -> rating (0-3)
  cnsSymptoms: { [key: number]: string }; // CNS question (1-27) -> selected value

  // ส่วนที่ 4: การยศาสตร์ & กล้ามเนื้อ
  ergonomicFactors: { [key: number]: boolean }; // Q1-Q9 (ไม่ใช่ / ใช่)
  nmqSymptoms: {
    [key: string]: { // body part key (e.g., 'neck')
      past12m: boolean;
      interrupted12m: boolean;
      past28d: boolean;
      past7d: boolean;
    }
  };
  nrsPain: {
    [key: string]: { // body part key
      nrs7d: number;
      nrs28d: number;
      nrs12m: number;
    }
  };

  // ส่วนที่ 5: Q16 แบบประเมินระดับอาการทางระบบประสาท
  q16Symptoms: { [key: number]: boolean }; // Q1-Q16 (ใช่ / ไม่ใช่)
}

export interface VillageConfig {
  id: number;
  name: string;
  moo: string;
}

export const VILLAGES: VillageConfig[] = [
  { id: 1, name: 'โรงเหล็ก', moo: 'หมู่ที่ 1' },
  { id: 2, name: 'เขาเหล็ก', moo: 'หมู่ที่ 2' },
  { id: 3, name: 'สวนกลาง', moo: 'หมู่ที่ 3' },
  { id: 4, name: 'พังหรัน', moo: 'หมู่ที่ 4' },
  { id: 5, name: 'ทองผักกูด', moo: 'หมู่ที่ 5' },
  { id: 6, name: 'ในทอน', moo: 'หมู่ที่ 6' },
  { id: 7, name: 'ถ้ำโคก', moo: 'หมู่ที่ 7' },
  { id: 8, name: 'พัฒนา', moo: 'หมู่ที่ 8' },
  { id: 9, name: 'เขาโพธิ์', moo: 'หมู่ที่ 9' }
];

export interface BloodTestEligibility {
  neuroScoreHigh: boolean; // คะแนน Q16 > 6
  pesticideExperienceHigh: boolean; // ทำงานเคมี >= 1 ปี (workYears >= 1)
  ageOver20: boolean; // อายุ > 20
  pesticideFrequencyHigh: boolean; // ทำเคมี > 3 ครั้ง/สัปดาห์
  noAlcoholPastMonth: boolean; // ไม่ดื่มแอลกอฮอล์ใน 1 เดือน
  noSmokingPastMonth: boolean; // ไม่สูบบุหรี่ใน 1 เดือน
  restTimeSufficient: boolean; // เวลาพัก >= 1 ชั่วโมงต่อวัน
  workChemicalHoursHigh: boolean; // เวลาทำงานสารเคมี > 4 ชั่วโมงต่อวัน
  eligible: boolean; // meets all or specific criteria? We can display which ones are met
}
