export interface DassQuestion {
  id: number;
  text: string;
  dimension: 'S' | 'A' | 'D'; // S = Stress, A = Anxiety, D = Depression
}

export const DASS21_QUESTIONS: DassQuestion[] = [
  { id: 1, text: 'ฉันไม่สามารถปลอบใจตนเองได้เลย / รู้สึกผ่อนคลายไม่ได้', dimension: 'S' },
  { id: 2, text: 'ฉันรู้สึกว่าปากแห้ง', dimension: 'A' },
  { id: 3, text: 'ฉันไม่สามารถรู้สึกในแง่บวกได้เลย', dimension: 'D' },
  { id: 4, text: 'ฉันมีความยากลำบากในการหายใจ (เช่น หายใจเร็วผิดปกติ รู้สึกหายใจไม่ทั่วท้อง)', dimension: 'A' },
  { id: 5, text: 'ฉันรู้สึกขาดความกระตือรือร้นที่จะทำสิ่งต่างๆ', dimension: 'D' },
  { id: 6, text: 'ฉันมักมีปฏิกิริยาตอบสนองต่อสถานการณ์ต่างๆ มากเกินไป', dimension: 'S' },
  { id: 7, text: 'ฉันรู้สึกมือสั่นหรือตัวสั่น', dimension: 'A' },
  { id: 8, text: 'ฉันรู้สึกว่าตนเองใช้พลังงานทางประสาทมากเกินไป', dimension: 'S' },
  { id: 9, text: 'ฉันกังวลเกี่ยวกับสถานการณ์ที่ฉันอาจตื่นตระหนก และทำตัวน่าอาย', dimension: 'A' },
  { id: 10, text: 'ฉันรู้สึกว่าไม่มีสิ่งใดน่าตื่นเต้น / ไม่มีสิ่งใดให้ตั้งหน้าตั้งตารอคอย', dimension: 'D' },
  { id: 11, text: 'ฉันรู้สึกหงุดหงิดง่าย', dimension: 'S' },
  { id: 12, text: 'ฉันรู้สึกว่าต้องใช้ความพยายามมากในการทำสิ่งต่างๆ', dimension: 'S' },
  { id: 13, text: 'ฉันรู้สึกเศร้าหรือหดหู่', dimension: 'D' },
  { id: 14, text: 'ฉันรู้สึกอดทนต่อสิ่งกีดขวางไม่ได้ เมื่อต้องการทำบางสิ่ง', dimension: 'S' },
  { id: 15, text: 'ฉันรู้สึกใกล้จะตื่นตระหนก', dimension: 'A' },
  { id: 16, text: 'ฉันไม่สามารถรู้สึกกระตือรือร้นกับสิ่งใดเลย', dimension: 'D' },
  { id: 17, text: 'ฉันรู้สึกว่าตนเองไม่มีคุณค่า / ไม่มีความสามารถ', dimension: 'D' },
  { id: 18, text: 'ฉันรู้สึกว่าตนเองอ่อนไหวง่าย', dimension: 'S' },
  { id: 19, text: 'ฉันรู้สึกถึงการเต้นของหัวใจของตนเองโดยไม่ได้ออกกำลัง (ใจสั่น)', dimension: 'A' },
  { id: 20, text: 'ฉันรู้สึกกลัวโดยไม่มีสาเหตุ', dimension: 'A' },
  { id: 21, text: 'ฉันรู้สึกว่าชีวิตไม่มีความหมาย', dimension: 'D' }
];

export interface CNSSymptomQuestion {
  id: number;
  text: string;
  options: string[];
}

export const CNS_QUESTIONS: CNSSymptomQuestion[] = [
  { id: 1, text: 'ท่านใช้เวลานานแค่ไหนกว่าจะหลับได้', options: ['≤15 นาที', '16–30 นาที', '31–60 นาที', '>60 นาที'] },
  { id: 2, text: 'ท่านนอนหลับกี่ชั่วโมงต่อคืน (เฉลี่ย)', options: ['≥7 ชม.', '6–6.9 ชม.', '5–5.9 ชม.', '<5 ชม.'] },
  { id: 3, text: 'ท่านตื่นกลางดึกหรือตี 3–ตี 4 บ่อยแค่ไหน', options: ['ไม่มี', '<1 ครั้ง/สัปดาห์', '1–2 ครั้ง/สัปดาห์', '≥3 ครั้ง/สัปดาห์'] },
  { id: 4, text: 'ตื่นมาแล้วรู้สึกสดชื่นเพียงพอสำหรับการทำงานหรือไม่', options: ['ดีมาก', 'ดี', 'ปานกลาง', 'แย่'] },
  { id: 5, text: 'มีปัญหาการนอนหลับรบกวนการทำงานกลางวันหรือไม่', options: ['ไม่มี', 'เล็กน้อย', 'ปานกลาง', 'มาก'] },
  { id: 6, text: 'ลืมว่าวางของไว้ที่ไหน เช่น กรรไกร สายยาง เครื่องมือ', options: ['ไม่เคย', 'นาน ๆ ครั้ง', 'บางครั้ง', 'บ่อยครั้ง', 'บ่อยมาก'] },
  { id: 7, text: 'ลืมว่าต้องทำอะไร แม้พึ่งนึกได้ไม่นาน', options: ['ไม่เคย', 'นาน ๆ ครั้ง', 'บางครั้ง', 'บ่อยครั้ง', 'บ่อยมาก'] },
  { id: 8, text: 'อ่านอะไรแล้วต้องอ่านซ้ำเพราะไม่เข้าใจ', options: ['ไม่เคย', 'นาน ๆ ครั้ง', 'บางครั้ง', 'บ่อยครั้ง', 'บ่อยมาก'] },
  { id: 9, text: 'ทำงานซ้ำโดยไม่ตั้งใจ เช่น ฉีดยาต้นไม้ไปแล้วหรือยัง', options: ['ไม่เคย', 'นาน ๆ ครั้ง', 'บางครั้ง', 'บ่อยครั้ง', 'บ่อยมาก'] },
  { id: 10, text: 'สับสนว่าต้องทำขั้นตอนต่อไปว่าอะไร', options: ['ไม่เคย', 'นาน ๆ ครั้ง', 'บางครั้ง', 'บ่อยครั้ง', 'บ่อยมาก'] },
  { id: 11, text: 'หยิบผิดสิ่งของหรือใช้สิ่งของผิดประเภท', options: ['ไม่เคย', 'นาน ๆ ครั้ง', 'บางครั้ง', 'บ่อยครั้ง', 'บ่อยมาก'] },
  { id: 12, text: 'ฟังคนอื่นพูดแล้วต้องให้พูดซ้ำบ่อย', options: ['ไม่เคย', 'นาน ๆ ครั้ง', 'บางครั้ง', 'บ่อยครั้ง', 'บ่อยมาก'] },
  { id: 13, text: 'ทำอะไรโดยไม่ได้ตั้งใจ เช่น เดินไปทิศผิด', options: ['ไม่เคย', 'นาน ๆ ครั้ง', 'บางครั้ง', 'บ่อยครั้ง', 'บ่อยมาก'] },
  { id: 14, text: 'มีปัญหาในการจดจ่อกับงานที่ทำอยู่', options: ['ไม่เคย', 'นาน ๆ ครั้ง', 'บางครั้ง', 'บ่อยครั้ง', 'บ่อยมาก'] },
  { id: 15, text: 'ลืมชื่อคนหรือสัตว์ที่รู้จักดี', options: ['ไม่เคย', 'นาน ๆ ครั้ง', 'บางครั้ง', 'บ่อยครั้ง', 'บ่อยมาก'] },
  { id: 16, text: 'หงุดหงิดง่าย โมโหเร็วกว่าปกติ', options: ['ไม่เคย', 'บางครั้ง (≤2 วัน/สัปดาห์)', 'บ่อย (3–4 วัน/สัปดาห์)', 'เกือบทุกวัน'] },
  { id: 17, text: 'ตกใจง่ายเมื่อได้ยินเสียงดัง', options: ['ไม่เคย', 'บางครั้ง (≤2 วัน/สัปดาห์)', 'บ่อย (3–4 วัน/สัปดาห์)', 'เกือบทุกวัน'] },
  { id: 18, text: 'มือสั่น หรือกล้ามเนื้อกระตุกโดยไม่ตั้งใจ', options: ['ไม่เคย', 'บางครั้ง (≤2 วัน/สัปดาห์)', 'บ่อย (3–4 วัน/สัปดาห์)', 'เกือบทุกวัน'] },
  { id: 19, text: 'เหงื่อออกมากโดยไม่ได้ออกแรงหรืออากาศร้อน', options: ['ไม่เคย', 'บางครั้ง (≤2 วัน/สัปดาห์)', 'บ่อย (3–4 วัน/สัปดาห์)', 'เกือบทุกวัน'] },
  { id: 20, text: 'ปวดหัวตุบ ๆ โดยไม่ทราบสาเหตุ', options: ['ไม่เคย', 'บางครั้ง (≤2 วัน/สัปดาห์)', 'บ่อย (3–4 วัน/สัปดาห์)', 'เกือบทุกวัน'] },
  { id: 21, text: 'ใจสั่น หัวใจเต้นแรงโดยไม่ได้ออกแรง', options: ['ไม่เคย', 'บางครั้ง (≤2 วัน/สัปดาห์)', 'บ่อย (3–4 วัน/สัปดาห์)', 'เกือบทุกวัน'] },
  { id: 22, text: 'รู้สึกมึนหัว เวียนหัว โดยไม่ได้เปลี่ยนท่าทาง', options: ['ไม่ตรงเลย', 'ตรงเล็กน้อย', 'ตรงบางส่วน', 'ค่อนข้างตรง', 'ตรงมาก'] },
  { id: 23, text: 'รู้สึกเหนื่อยล้าโดยรวม แม้หลังพักผ่อนแล้ว', options: ['ไม่ตรงเลย', 'ตรงเล็กน้อย', 'ตรงบางส่วน', 'ค่อนข้างตรง', 'ตรงมาก'] },
  { id: 24, text: 'รู้สึกไม่อยากทำอะไร ขาดแรงจูงใจ', options: ['ไม่ตรงเลย', 'ตรงเล็กน้อย', 'ตรงบางส่วน', 'ค่อนข้างตรง', 'ตรงมาก'] },
  { id: 25, text: 'ต้องใช้ความพยายามมากขึ้นในการทำงานเดิม', options: ['ไม่ตรงเลย', 'ตรงเล็กน้อย', 'ตรงบางส่วน', 'ค่อนข้างตรง', 'ตรงมาก'] },
  { id: 26, text: 'รู้สึกว่าสมองล้า คิดอะไรได้ช้าลง', options: ['ไม่ตรงเลย', 'ตรงเล็กน้อย', 'ตรงบางส่วน', 'ค่อนข้างตรง', 'ตรงมาก'] },
  { id: 27, text: 'รู้สึกว่าร่างกายไม่มีแรง ทำอะไรก็เหนื่อย', options: ['ไม่ตรงเลย', 'ตรงเล็กน้อย', 'ตรงบางส่วน', 'ค่อนข้างตรง', 'ตรงมาก'] }
];

export interface ErgonomicFactorQuestion {
  id: number;
  text: string;
}

export const ERGONOMIC_QUESTIONS: ErgonomicFactorQuestion[] = [
  { id: 1, text: 'เคลื่อนไหวซ้ำเดิม' },
  { id: 2, text: 'ท่าทางผิดปกติ' },
  { id: 3, text: 'การออกแรงในการทำงานมากกว่าปกติ' },
  { id: 4, text: 'ภาระงานหนัก ความต้องการของตลาดโลกสูง' },
  { id: 5, text: 'การทำงานยืนหรือเดินติดต่อกันเป็นเวลานาน 8 ชั่วโมง' },
  { id: 6, text: 'ได้รับแรงตึงของกล้ามเนื้อจากร่างกายโดยตรง เช่น การทำงานจนรู้สึกว่าร่างกายเริ่มเมื่อยล้ากล้ามเนื้อจากการทำงานขณะทำงาน' },
  { id: 7, text: 'ยกของหนัก' },
  { id: 8, text: 'นั่งคุกเข่า' },
  { id: 9, text: 'นั่งยอง' }
];

export interface NMQBodyPart {
  key: string;
  name: string;
}

export const NMQ_BODY_PARTS: NMQBodyPart[] = [
  { key: 'neck', name: 'คอ' },
  { key: 'shoulder', name: 'ไหล่' },
  { key: 'upper_back', name: 'หลังส่วนบน' },
  { key: 'elbow', name: 'ข้อศอก' },
  { key: 'wrist_hand', name: 'ข้อมือ/มือ' },
  { key: 'lower_back', name: 'หลังส่วนล่าง' },
  { key: 'hip_thigh_butt', name: 'สะโพก/ต้นขา/ก้น' },
  { key: 'knee', name: 'เข่า' },
  { key: 'ankle_foot', name: 'ข้อเท้า/เท้า' }
];

export interface Q16Question {
  id: number;
  text: string;
}

export const Q16_QUESTIONS: Q16Question[] = [
  { id: 1, text: 'ท่านรู้สึกเหนื่อยล้าผิดปกติกว่าคนอื่น ๆ หรือไม่' },
  { id: 2, text: 'ท่านมีอาการใจสั่นโดยไม่ได้ออกแรงหรือไม่' },
  { id: 3, text: 'ท่านมีอาการปวดแสบ/ชาบ่อย ๆ ตามส่วนต่าง ๆ ของร่างกายหรือไม่' },
  { id: 4, text: 'ท่านรู้สึกหงุดหงิดรำคาญใจบ่อย ๆ โดยไม่มีสาเหตุชัดเจนหรือไม่' },
  { id: 5, text: 'ท่านรู้สึกหดหู่ใจหรือซึมเศร้าบ่อย ๆ โดยไม่มีสาเหตุชัดเจนหรือไม่' },
  { id: 6, text: 'ท่านมีปัญหาในการจดจ่อหรือสมาธิสั้นหรือไม่' },
  { id: 7, text: 'ท่านมีความจำสั้น ลืมสิ่งต่าง ๆ ได้ง่ายหรือไม่' },
  { id: 8, text: 'ท่านมีเหงื่อออกโดยไม่มีสาเหตุหรือไม่' },
  { id: 9, text: 'ท่านมีปัญหาในการติดกระดุมหรือถอดกระดุมเสื้อหรือไม่' },
  { id: 10, text: 'ท่านมีความยากลำบากในการอ่านหนังสือพิมพ์หรือหนังสือทั่วไปเพื่อจับใจความหรือไม่' },
  { id: 11, text: 'ญาติหรือคนในครอบครัวบอกว่าท่านมีความจำสั้นหรือไม่' },
  { id: 12, text: 'ท่านรู้สึกแน่นหน้าอกเป็นบางครั้งหรือไม่' },
  { id: 13, text: 'ท่านต้องจดบันทึกสิ่งที่ต้องทำบ่อย ๆ เพราะกลัวลืมหรือไม่' },
  { id: 14, text: 'ท่านต้องย้อนกลับไปตรวจสอบสิ่งที่ทำแล้ว เช่น ล็อคประตูแล้วหรือยัง หรือไม่' },
  { id: 15, text: 'ท่านมีอาการปวดหัวอย่างน้อยสัปดาห์ละครั้งหรือไม่' },
  { id: 16, text: 'ท่านรู้สึกสนใจกิจกรรมทางเพศน้อยกว่าที่คิดว่าปกติหรือไม่' }
];

export interface ChemicalSubstance {
  id: number;
  tradeName: string;
  commonName: string;
}

export const CHEMICAL_SUBSTANCES: ChemicalSubstance[] = [
  { id: 1, tradeName: 'ลอร์สแบน, Dursban', commonName: 'Chlorpyrifos' },
  { id: 2, tradeName: 'Bi-58, โรกอร์', commonName: 'Dimethoate' },
  { id: 3, tradeName: 'คิวราครอน', commonName: 'Profenofos' },
  { id: 4, tradeName: 'Basudin', commonName: 'Diazinon' },
  { id: 5, tradeName: 'นูวาน, DDVP', commonName: 'Dichlorvos (DDVP)' },
  { id: 6, tradeName: 'มาลาไทออน', commonName: 'Malathion' },
  { id: 7, tradeName: 'Actellic', commonName: 'Pirimiphos-methyl' },
  { id: 8, tradeName: 'โอเมโทเอต', commonName: 'Omethoate' },
  { id: 9, tradeName: 'ฟีโนบูคาร์บ, Baycarb', commonName: 'Fenobucarb (BPMC)' },
  { id: 10, tradeName: 'ฟูราดาน', commonName: 'Carbofuran' },
  { id: 11, tradeName: 'มาร์แชล', commonName: 'Carbosulfan' },
  { id: 13, tradeName: 'คาราเต้, มาตาดอร์', commonName: 'Lambda-cyhalothrin' },
  { id: 14, tradeName: 'ริปคอร์ด', commonName: 'Cypermethrin' },
  { id: 15, tradeName: 'เดซิส', commonName: 'Deltamethrin' },
  { id: 16, tradeName: 'Confidor, โคนฟิดอร์', commonName: 'Imidacloprid' },
  { id: 17, tradeName: 'อาคทาร่า', commonName: 'Thiamethoxam' },
  { id: 18, tradeName: 'มอสพิแลน', commonName: 'Acetamiprid' },
  { id: 19, tradeName: 'สตาร์เกิล', commonName: 'Dinotefuran' },
  { id: 20, tradeName: 'Phenylpyrazole', commonName: 'Fipronil (ฟิโพรนิล)' },
  { id: 21, tradeName: 'Avermectin', commonName: 'Abamectin' },
  { id: 22, tradeName: 'โปรคราม', commonName: 'Emamectin benzoate' },
  { id: 23, tradeName: 'สแควร์', commonName: 'Spinosad/Spinetoram' },
  { id: 24, tradeName: 'อาโปลโล', commonName: 'Buprofezin' },
  { id: 25, tradeName: 'ริดอมิล', commonName: 'Metalaxyl' },
  { id: 26, tradeName: 'Derosal, MBC', commonName: 'Carbendazim' },
  { id: 27, tradeName: 'ไดเทน M-45', commonName: 'Mancozeb' },
  { id: 28, tradeName: 'Aliette, อีราฟอสทิล', commonName: 'Fosetyl-Al' },
  { id: 29, tradeName: 'Score', commonName: 'Difenoconazole' },
  { id: 30, tradeName: 'Amistar', commonName: 'Azoxystrobin' },
  { id: 31, tradeName: 'คอปเปอร์ออกซีคลอไรด์', commonName: 'Copper sulfate' },
  { id: 32, tradeName: 'วาลิดาซิน', commonName: 'Validamycin' },
  { id: 33, tradeName: 'ไทแรม', commonName: 'Thiram' },
  { id: 34, tradeName: 'ราวด์อัพ', commonName: 'Glyphosate' },
  { id: 35, tradeName: 'กรัมมอกโซน', commonName: 'Paraquat' }
];

export const INITIAL_FORM_STATE = {
  docNo: '',
  date: new Date().toISOString().split('T')[0],
  participantCode: '',
  village: '1', // default to หมู่ที่ 1
  age: 0,
  gender: '',
  education: '',
  educationOther: '',
  maritalStatus: '',
  weight: 0,
  height: 0,
  smoking: 'ไม่สูบ',
  smokingAmount: 0,
  alcohol: 'ไม่ดื่ม',
  alcoholAmount: '',
  energyDrink: 'ไม่ดื่ม',
  energyDrinkAmount: 0,
  diseases: [],
  diseasesOther: '',
  medications: [],
  medicationsOther: '',
  regularMedicationDetail: '',
  exercise: '',
  exerciseOther: '',
  sleepAdequate: '',
  sleepHours: 0,
  workYears: 0,
  workMonths: 0,
  workHoursPerDay: 0,
  otherJobs: '',
  seasonalWork: '',
  seasonalIncome: '',
  peakChemicalPeriod: '',
  restDuration: 0,
  restFrequency: '',
  chemicalRoles: [],
  chemicalRolesOther: '',
  chemicalFrequency: 0,
  chemicalDurationPerTime: 0,
  ppeUsed: '',
  chemicals: {},
  dassScores: {},
  cnsSymptoms: {},
  ergonomicFactors: {},
  nmqSymptoms: {
    neck: { past12m: false, interrupted12m: false, past28d: false, past7d: false },
    shoulder: { past12m: false, interrupted12m: false, past28d: false, past7d: false },
    upper_back: { past12m: false, interrupted12m: false, past28d: false, past7d: false },
    elbow: { past12m: false, interrupted12m: false, past28d: false, past7d: false },
    wrist_hand: { past12m: false, interrupted12m: false, past28d: false, past7d: false },
    lower_back: { past12m: false, interrupted12m: false, past28d: false, past7d: false },
    hip_thigh_butt: { past12m: false, interrupted12m: false, past28d: false, past7d: false },
    knee: { past12m: false, interrupted12m: false, past28d: false, past7d: false },
    ankle_foot: { past12m: false, interrupted12m: false, past28d: false, past7d: false }
  },
  nrsPain: {
    neck: { nrs7d: 0, nrs28d: 0, nrs12m: 0 },
    shoulder: { nrs7d: 0, nrs28d: 0, nrs12m: 0 },
    upper_back: { nrs7d: 0, nrs28d: 0, nrs12m: 0 },
    elbow: { nrs7d: 0, nrs28d: 0, nrs12m: 0 },
    wrist_hand: { nrs7d: 0, nrs28d: 0, nrs12m: 0 },
    lower_back: { nrs7d: 0, nrs28d: 0, nrs12m: 0 },
    hip_thigh_butt: { nrs7d: 0, nrs28d: 0, nrs12m: 0 },
    knee: { nrs7d: 0, nrs28d: 0, nrs12m: 0 },
    ankle_foot: { nrs7d: 0, nrs28d: 0, nrs12m: 0 }
  },
  q16Symptoms: {}
};
