import { Participant, BloodTestEligibility, VILLAGES } from '../types';
import { CHEMICAL_SUBSTANCES } from '../data/questionnaireData';

// Helper to calculate blood test eligibility metrics
export function calculateBloodTestEligibility(p: Participant): BloodTestEligibility {
  // Q16 neuro score calculation (count of 'Yes' responses in q16Symptoms)
  const neuroScore = Object.values(p.q16Symptoms || {}).filter(val => val === true).length;
  const neuroScoreHigh = neuroScore > 6;

  // pesticideExperienceHigh: workYears >= 1 (Works with pesticides > 1 year)
  // (We assume durian workers handle pesticide. As requested: "เป็นบุคคลที่ทำงานกับสารเคมีจำจัดศัตรูพืชมากกว่า1ปีขึ้นไป")
  const pesticideExperienceHigh = p.workYears >= 1 || (p.workYears === 0 && p.workMonths >= 12);

  // ageOver 20: p.age > 20
  const ageOver20 = p.age > 20;

  // pesticideFrequencyHigh: chemicalFrequency > 3
  const pesticideFrequencyHigh = p.chemicalFrequency > 3;

  // noAlcoholPastMonth: alcohol === 'ไม่ดื่ม'
  const noAlcoholPastMonth = p.alcohol === 'ไม่ดื่ม';

  // noSmokingPastMonth: smoking === 'ไม่สูบ'
  const noSmokingPastMonth = p.smoking === 'ไม่สูบ';

  // restTimeSufficient: restDuration >= 1
  const restTimeSufficient = p.restDuration >= 1;

  // workChemicalHoursHigh: chemicalDurationPerTime > 4
  const workChemicalHoursHigh = p.chemicalDurationPerTime > 4;

  // Candidate is eligible if they meet any or a subset of rules. 
  // Let's mark them as a candidate if they meet the core research eligibility profile (or if they pass at least 5 of these criteria).
  // Actually, the user says "ช่วยเพิ่มเกณฑ์ที่ผู้เข้าร่วมบางคนที่เข้าข่ายจะต้องเจาะเลือด คือ ..."
  // Usually this means if they satisfy these criteria they should be flagged. Let's make it so that if they meet ALL of these criteria, or if we show a progress/match count.
  // Let's define the overall "eligible" as: they meet ALL these clinical screening conditions.
  // Wait! Let's display the checklist of which items are met, and flag them if they meet ALL of the conditions, or let's say "เข้าข่าย" if they match the primary ones.
  // Let's design it so they are marked as "eligible" if they match the specified conditions. Since the user listed these exact 8 conditions as the criteria,
  // let's evaluate them as: eligible if they match the criteria!
  const conditionsMetCount = [
    neuroScoreHigh,
    pesticideExperienceHigh,
    ageOver20,
    pesticideFrequencyHigh,
    noAlcoholPastMonth,
    noSmokingPastMonth,
    restTimeSufficient,
    workChemicalHoursHigh
  ].filter(Boolean).length;

  // Let's say if they meet ALL 8 criteria, they are "Fully Eligible" (100% Match). Or we can flag them as a Candidate if they meet a significant subset (e.g. >= 5 criteria) or if they meet the criteria specified.
  // Let's set 'eligible' to true if they meet all 8 rules, but display the match count (e.g., "7/8 เกณฑ์") for granular monitoring!
  const eligible = conditionsMetCount === 8;

  return {
    neuroScoreHigh,
    pesticideExperienceHigh,
    ageOver20,
    pesticideFrequencyHigh,
    noAlcoholPastMonth,
    noSmokingPastMonth,
    restTimeSufficient,
    workChemicalHoursHigh,
    eligible
  };
}

// Map village ID to standard sheet tab name
export function getSheetTabName(villageId: string | number): string {
  const village = VILLAGES.find(v => v.id.toString() === villageId.toString());
  return village ? `${village.moo} ${village.name}` : `หมู่ที่ ${villageId}`;
}

export const SURVEY_HEADERS = [
  'เลขที่แบบสอบถาม',
  'วันที่ทำแบบสอบถาม',
  'รหัสหรือชื่อผู้เข้าร่วม',
  'หมู่บ้าน',
  'อายุ (ปี)',
  'เพศ',
  'การศึกษา',
  'สถานภาพสมรส',
  'น้ำหนัก (กก.)',
  'ส่วนสูง (ม.)',
  'BMI',
  'การสูบบุหรี่',
  'จำนวนมวนต่อวัน',
  'การดื่มแอลกอฮอล์',
  'ปริมาณต่อครั้ง',
  'ดื่มเครื่องดื่มชูกำลัง',
  'จำนวนขวดต่อวัน',
  'โรคประจำตัว',
  'ยาประจำตัว',
  'ยารับประทานประจำอื่นๆ',
  'การออกกำลังกาย',
  'การพักผ่อนนอนหลับ',
  'จำนวนชั่วโมงนอนต่อคืน',
  'อายุงานสวนทุเรียน (ปี)',
  'อายุงานสวนทุเรียน (เดือน)',
  'ชั่วโมงทำงานต่อวัน',
  'งานอื่นๆ',
  'ทำงานตามฤดูกาล',
  'รายได้ขึ้นกับฤดูกาล',
  'ช่วงงานสารเคมีหนักที่สุด',
  'ระยะเวลาพักในการทำงาน (ชั่วโมง)',
  'ความถี่ในการพักต่อวัน',
  'บทบาทงานสารเคมี',
  'ความถี่ทำงานสารเคมี (ครั้ง/สัปดาห์)',
  'ระยะทำงานสารเคมี (ชั่วโมง/ครั้ง)',
  'อุปกรณ์ PPE',
  'ความเครียด DASS (S)',
  'ความวิตกกังวล DASS (A)',
  'ซึมเศร้า DASS (D)',
  'คะแนนอาการระบบประสาท Q16',
  'เกณฑ์ตรวจเลือดผ่าน (จำนวน/8)',
  'ผลคัดกรองตรวจเจาะเลือด',
  'สารเคมีที่ใช้ทั้งหมด',
  'อาการปวดร่างกาย (NMQ)'
];

// Helper to convert participant state to spreadsheet row values
export function participantToRow(p: Participant): any[] {
  const bmi = p.height > 0 ? (p.weight / (p.height * p.height)).toFixed(2) : '0.00';
  
  // Calculate Q16 Score
  const neuroScore = Object.values(p.q16Symptoms || {}).filter(val => val === true).length;
  
  // Calculate DASS scores
  let stressSum = 0;
  let anxietySum = 0;
  let depressionSum = 0;

  // DASS-21 dimensions
  const stressIndices = [1, 6, 8, 11, 12, 14, 18];
  const anxietyIndices = [2, 4, 7, 9, 15, 19, 20];
  const depressionIndices = [3, 5, 10, 13, 16, 17, 21];

  stressIndices.forEach(idx => stressSum += (p.dassScores[idx] || 0));
  anxietyIndices.forEach(idx => anxietySum += (p.dassScores[idx] || 0));
  depressionIndices.forEach(idx => depressionSum += (p.dassScores[idx] || 0));

  // multiply by 2 for standard DASS-42 conversion
  const finalStress = stressSum * 2;
  const finalAnxiety = anxietySum * 2;
  const finalDepression = depressionSum * 2;

  // Blood test criteria calculations
  const eligibility = calculateBloodTestEligibility(p);
  const conditionsMetCount = [
    eligibility.neuroScoreHigh,
    eligibility.pesticideExperienceHigh,
    eligibility.ageOver20,
    eligibility.pesticideFrequencyHigh,
    eligibility.noAlcoholPastMonth,
    eligibility.noSmokingPastMonth,
    eligibility.restTimeSufficient,
    eligibility.workChemicalHoursHigh
  ].filter(Boolean).length;

  const bloodTestStatus = conditionsMetCount === 8 
    ? 'ผ่านเกณฑ์ทั้งหมด (เข้าข่ายต้องเจาะเลือด)' 
    : `ไม่ผ่านครบทุกเกณฑ์ (${conditionsMetCount}/8)`;

  // Chemicals representation (e.g. Chlorpyrifos: 5L, Paraquat: 10L)
  const chemStrings: string[] = [];
  CHEMICAL_SUBSTANCES.forEach(c => {
    const usage = p.chemicals[c.commonName];
    if (usage && usage.used) {
      chemStrings.push(`${c.commonName} (${c.tradeName}): ${usage.amount || 'ไม่ระบุปริมาณ'}`);
    }
  });
  const chemicalsText = chemStrings.join(', ');

  // NMQ symptoms overview
  const nmqTextParts: string[] = [];
  Object.entries(p.nmqSymptoms || {}).forEach(([part, data]) => {
    if (data.past12m || data.past28d || data.past7d) {
      const states = [];
      if (data.past7d) states.push('7วัน');
      if (data.past28d) states.push('28วัน');
      if (data.past12m) states.push('12เดือน');
      if (data.interrupted12m) states.push('หยุดงาน');
      
      const pain = p.nrsPain[part];
      const painText = pain ? ` (NRS 7วัน: ${pain.nrs7d}, 28วัน: ${pain.nrs28d}, 12ด: ${pain.nrs12m})` : '';
      nmqTextParts.push(`${part}: [${states.join('/')}]${painText}`);
    }
  });
  const nmqText = nmqTextParts.join(' | ');

  // Diseases and medications formatting
  const diseasesText = [
    ...p.diseases,
    p.diseasesOther ? `อื่นๆ: ${p.diseasesOther}` : ''
  ].filter(Boolean).join(', ');

  const medsText = [
    ...p.medications,
    p.medicationsOther ? `อื่นๆ: ${p.medicationsOther}` : ''
  ].filter(Boolean).join(', ');

  return [
    p.docNo || '',
    p.date || '',
    p.participantCode || '',
    getSheetTabName(p.village),
    p.age || 0,
    p.gender || '',
    p.education === 'อื่นๆ' ? `อื่นๆ: ${p.educationOther || ''}` : p.education || '',
    p.maritalStatus || '',
    p.weight || 0,
    p.height || 0,
    bmi,
    p.smoking === 'สูบ' ? `สูบ (${p.smokingAmount || 0} มวน/วัน)` : 'ไม่สูบ',
    p.smokingAmount || 0,
    p.alcohol === 'ดื่ม' ? `ดื่ม (${p.alcoholAmount || ''})` : 'ไม่ดื่ม',
    p.alcoholAmount || '',
    p.energyDrink === 'ดื่ม' ? `ดื่ม (${p.energyDrinkAmount || 0} ขวด/วัน)` : 'ไม่ดื่ม',
    p.energyDrinkAmount || 0,
    diseasesText,
    medsText,
    p.regularMedicationDetail || '',
    p.exercise === 'อื่นๆ' ? `อื่นๆ: ${p.exerciseOther || ''}` : p.exercise || '',
    p.sleepAdequate === 'เพียงพอ' ? `เพียงพอ (${p.sleepHours || 0} ชม./วัน)` : 'ไม่เพียงพอ',
    p.sleepHours || 0,
    p.workYears || 0,
    p.workMonths || 0,
    p.workHoursPerDay || 0,
    p.otherJobs || '',
    p.seasonalWork || '',
    p.seasonalIncome || '',
    p.peakChemicalPeriod || '',
    p.restDuration || 0,
    p.restFrequency || '',
    [...p.chemicalRoles, p.chemicalRolesOther ? `อื่นๆ: ${p.chemicalRolesOther}` : ''].filter(Boolean).join(', '),
    p.chemicalFrequency || 0,
    p.chemicalDurationPerTime || 0,
    p.ppeUsed || '',
    finalStress,
    finalAnxiety,
    finalDepression,
    neuroScore,
    conditionsMetCount,
    bloodTestStatus,
    chemicalsText,
    nmqText
  ];
}

// Convert row values back into a Participant object (for Dashboard rendering)
export function rowToParticipant(row: any[], villageId: number): Participant {
  // Map row values back to Participant structure
  const p: Partial<Participant> = {
    village: villageId.toString(),
    docNo: row[0] || '',
    date: row[1] || '',
    participantCode: row[2] || '',
    age: Number(row[4]) || 0,
    gender: row[5] === 'ชาย' || row[5] === 'หญิง' ? row[5] as 'ชาย' | 'หญิง' : '',
    education: row[6] || '',
    maritalStatus: row[7] || '',
    weight: Number(row[8]) || 0,
    height: Number(row[9]) || 0,
    smoking: (row[11] || '').includes('สูบ') && !(row[11] || '').includes('ไม่สูบ') ? 'สูบ' : 'ไม่สูบ',
    smokingAmount: Number(row[12]) || 0,
    alcohol: (row[13] || '').includes('ดื่ม') && !(row[13] || '').includes('ไม่ดื่ม') ? 'ดื่ม' : 'ไม่ดื่ม',
    alcoholAmount: row[14] || '',
    energyDrink: (row[15] || '').includes('ดื่ม') && !(row[15] || '').includes('ไม่ดื่ม') ? 'ดื่ม' : 'ไม่ดื่ม',
    energyDrinkAmount: Number(row[16]) || 0,
    diseases: row[17] ? row[17].split(', ') : [],
    medications: row[18] ? row[18].split(', ') : [],
    regularMedicationDetail: row[19] || '',
    exercise: row[20] || '',
    sleepAdequate: (row[21] || '').includes('เพียงพอ') && !(row[21] || '').includes('ไม่เพียงพอ') ? 'เพียงพอ' : 'ไม่เพียงพอ',
    sleepHours: Number(row[22]) || 0,
    workYears: Number(row[23]) || 0,
    workMonths: Number(row[24]) || 0,
    workHoursPerDay: Number(row[25]) || 0,
    otherJobs: row[26] || '',
    seasonalWork: row[27] as any || '',
    seasonalIncome: row[28] as any || '',
    peakChemicalPeriod: row[29] || '',
    restDuration: Number(row[30]) || 0,
    restFrequency: row[31] || '',
    chemicalRoles: row[32] ? row[32].split(', ') : [],
    chemicalFrequency: Number(row[33]) || 0,
    chemicalDurationPerTime: Number(row[34]) || 0,
    ppeUsed: row[35] || '',
    
    // We can store aggregated metrics for easy retrieval
    dassScores: {
      1: Math.round(Number(row[36]) / 14) || 0 // approximate back if needed, but we can store total stress
    },
    q16Symptoms: {}
  };

  // Populate synthetic Q16 score based on the saved column
  const savedNeuroScore = Number(row[39]) || 0;
  p.q16Symptoms = {};
  for (let i = 1; i <= 16; i++) {
    // Fill up to savedNeuroScore with true, rest with false
    p.q16Symptoms[i] = i <= savedNeuroScore;
  }

  // Parse chemicals text
  p.chemicals = {};
  const chemText = row[42] || '';
  CHEMICAL_SUBSTANCES.forEach(c => {
    if (chemText.includes(c.commonName)) {
      // Find amount match in chemText
      const regex = new RegExp(`${c.commonName}[^:]*:\\s*([^,\\s]+)`);
      const match = chemText.match(regex);
      p.chemicals![c.commonName] = {
        used: true,
        amount: match ? match[1] : 'ไม่ระบุ'
      };
    } else {
      p.chemicals![c.commonName] = { used: false };
    }
  });

  // Parse NMQ pain parts
  p.nmqSymptoms = {};
  p.nrsPain = {};
  const nmqText = row[43] || '';
  const bodyPartKeys = ['neck', 'shoulder', 'upper_back', 'elbow', 'wrist_hand', 'lower_back', 'hip_thigh_butt', 'knee', 'ankle_foot'];
  bodyPartKeys.forEach(part => {
    p.nmqSymptoms![part] = { past12m: false, interrupted12m: false, past28d: false, past7d: false };
    p.nrsPain![part] = { nrs7d: 0, nrs28d: 0, nrs12m: 0 };
    
    if (nmqText.includes(part)) {
      const partRegex = new RegExp(`${part}:\\s*\\[([^\\]]+)\\](?:\\s*\\(NRS 7วัน:\\s*(\\d+),\\s*28วัน:\\s*(\\d+),\\s*12ด:\\s*(\\d+)\\))?`);
      const match = nmqText.match(partRegex);
      if (match) {
        const states = match[1] || '';
        p.nmqSymptoms![part].past7d = states.includes('7วัน');
        p.nmqSymptoms![part].past28d = states.includes('28วัน');
        p.nmqSymptoms![part].past12m = states.includes('12เดือน');
        p.nmqSymptoms![part].interrupted12m = states.includes('หยุดงาน');
        
        if (match[2]) {
          p.nrsPain![part].nrs7d = Number(match[2]);
          p.nrsPain![part].nrs28d = Number(match[3]);
          p.nrsPain![part].nrs12m = Number(match[4]);
        }
      }
    }
  });

  // Add parsed synthetic DASS scores so they can be shown in Dashboard lists
  p.dassScores = {
    stress: Number(row[36]) || 0,
    anxiety: Number(row[37]) || 0,
    depression: Number(row[38]) || 0,
    q16: savedNeuroScore
  } as any;

  return p as Participant;
}

// Drive & Sheets API Operations

// Helper to proxy requests through our server backend to avoid CORS and "Failed to fetch" issues inside iframes
async function fetchGoogle(url: string, options: any = {}): Promise<Response> {
  const proxyUrl = `/api/google-proxy?url=${encodeURIComponent(url)}`;
  return fetch(proxyUrl, options);
}

// Helper to share a spreadsheet with anyone who has the link (role: writer) to allow other accounts to log in and use it
export async function shareSpreadsheetWithAnyone(accessToken: string, spreadsheetId: string): Promise<boolean> {
  const url = `https://www.googleapis.com/drive/v3/files/${spreadsheetId}/permissions`;
  try {
    const res = await fetchGoogle(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        role: 'writer',
        type: 'anyone'
      })
    });
    if (!res.ok) {
      const errText = await res.text();
      console.error('Failed to share spreadsheet with anyone:', errText);
      return false;
    }
    return true;
  } catch (error) {
    console.error('shareSpreadsheetWithAnyone error:', error);
    return false;
  }
}

// Helper to check if the current user has access to a spreadsheet
export async function checkSpreadsheetAccess(accessToken: string, spreadsheetId: string): Promise<boolean> {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?fields=spreadsheetId`;
  try {
    const res = await fetchGoogle(url, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    return res.ok;
  } catch (error) {
    console.error('checkSpreadsheetAccess error:', error);
    return false;
  }
}

// 1. Search for existing spreadsheet titled "แบบสอบถามวิจัยสุขภาพแรงงานสวนทุเรียน"
export async function findSpreadsheet(accessToken: string): Promise<string | null> {
  const query = encodeURIComponent("name = 'แบบสอบถามวิจัยสุขภาพแรงงานสวนทุเรียน' and mimeType = 'application/vnd.google-apps.spreadsheet' and trashed = false");
  const url = `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name)`;
  
  try {
    const res = await fetchGoogle(url, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    if (!res.ok) {
      console.warn('Search spreadsheet request returned status:', res.status);
      return null;
    }
    const data = await res.json();
    if (data.files && data.files.length > 0) {
      return data.files[0].id;
    }
    return null;
  } catch (error) {
    console.warn('findSpreadsheet warning (Google API may be offline or token is invalid):', error);
    return null;
  }
}

// 2. Create spreadsheet and initialize 9 village tabs
export async function createResearchSpreadsheet(accessToken: string): Promise<string | null> {
  const createUrl = 'https://www.googleapis.com/drive/v3/files';
  
  try {
    // A. Create the base spreadsheet in Drive
    const createRes = await fetchGoogle(createUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: 'แบบสอบถามวิจัยสุขภาพแรงงานสวนทุเรียน',
        mimeType: 'application/vnd.google-apps.spreadsheet'
      })
    });
    
    if (!createRes.ok) {
      console.warn('Create file in Google Drive returned status:', createRes.status);
      return null;
    }
    
    const file = await createRes.json();
    const spreadsheetId = file.id;

    // B. Rename the default sheet and add the remaining village tabs
    const batchUpdateUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`;
    
    // First, let's read the spreadsheet metadata to get the default Sheet ID (usually Sheet1)
    const metaRes = await fetchGoogle(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?fields=sheets(properties)`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    if (!metaRes.ok) {
      console.warn('Failed to fetch spreadsheet metadata, status:', metaRes.status);
      return spreadsheetId;
    }
    const metaData = await metaRes.json();
    if (!metaData || !metaData.sheets || metaData.sheets.length === 0) {
      return spreadsheetId;
    }
    const defaultSheetId = metaData.sheets[0].properties.sheetId;

    // We will build a batch of sheet additions
    const requests: any[] = [];
    
    // Rename default sheet to Moo 1
    const firstVillageName = getSheetTabName(1);
    requests.push({
      updateSheetProperties: {
        properties: {
          sheetId: defaultSheetId,
          title: firstVillageName
        },
        fields: 'title'
      }
    });

    // Add remaining 8 villages
    for (let i = 2; i <= 9; i++) {
      requests.push({
        addSheet: {
          properties: {
            title: getSheetTabName(i)
          }
        }
      });
    }

    const batchRes = await fetchGoogle(batchUpdateUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ requests })
    });

    if (!batchRes.ok) {
      console.warn('Failed to create village sheet tabs, status:', batchRes.status);
      return spreadsheetId;
    }

    // C. Initialize headers for each of the 9 tabs
    for (let i = 1; i <= 9; i++) {
      const tabName = getSheetTabName(i);
      const quotedRange = `'${tabName}'!A1`;
      const appendHeadersUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(quotedRange)}:append?valueInputOption=USER_ENTERED`;
      
      const res = await fetchGoogle(appendHeadersUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          values: [SURVEY_HEADERS]
        })
      });
      
      if (!res.ok) {
        const errText = await res.text();
        console.warn(`Failed to initialize headers for ${tabName}:`, errText);
      }
    }

    // Share the spreadsheet with anyone so other logged-in users can write to it
    await shareSpreadsheetWithAnyone(accessToken, spreadsheetId);

    return spreadsheetId;
  } catch (error) {
    console.warn('createResearchSpreadsheet error (handled gracefully):', error);
    return null;
  }
}

// 3. Append single participant data
export async function appendParticipantData(
  accessToken: string,
  spreadsheetId: string,
  p: Participant
): Promise<boolean> {
  const tabName = getSheetTabName(p.village);
  const quotedRange = `'${tabName}'!A1`;
  const appendUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(quotedRange)}:append?valueInputOption=USER_ENTERED`;
  
  try {
    const rowValues = participantToRow(p);
    const res = await fetchGoogle(appendUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        values: [rowValues]
      })
    });
    
    if (!res.ok) {
      const errText = await res.text();
      console.warn('appendParticipantData failed response:', errText);
    }
    return res.ok;
  } catch (error) {
    console.warn('appendParticipantData error:', error);
    return false;
  }
}

// 4. Fetch all participants from all tabs
export async function fetchAllParticipants(
  accessToken: string,
  spreadsheetId: string
): Promise<Participant[]> {
  const allParticipants: Participant[] = [];
  
  try {
    // Generate ranges for all 9 villages with single-quoted sheet names
    const ranges = VILLAGES.map(v => `'${getSheetTabName(v.id)}'!A2:ZZ1000`);
    const rangesQuery = ranges.map(r => `ranges=${encodeURIComponent(r)}`).join('&');
    
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchGet?${rangesQuery}`;
    
    const res = await fetchGoogle(url, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    
    if (!res.ok) {
      const errText = await res.text();
      console.warn('Failed to batch fetch spreadsheet values response:', errText);
      throw new Error(`Failed to batch fetch spreadsheet values: ${errText}`);
    }
    
    const data = await res.json();
    const valueRanges = data.valueRanges || [];
    
    VILLAGES.forEach((v, idx) => {
      const valRange = valueRanges[idx];
      if (valRange && valRange.values) {
        valRange.values.forEach((row: any[]) => {
          if (row && row[2]) { // If participant code/name is present
            const participantObj = rowToParticipant(row, v.id);
            allParticipants.push(participantObj);
          }
        });
      }
    });
    
    return allParticipants;
  } catch (error) {
    console.warn('fetchAllParticipants warning:', error);
    return [];
  }
}

// 5. Ensure all 9 expected village tabs exist in the spreadsheet
export async function ensureSpreadsheetTabsExist(
  accessToken: string,
  spreadsheetId: string
): Promise<void> {
  try {
    const metaRes = await fetchGoogle(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?fields=sheets(properties)`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    if (!metaRes.ok) {
      throw new Error('Failed to fetch spreadsheet metadata to verify tabs');
    }
    const metaData = await metaRes.json();
    const existingTabs: string[] = (metaData.sheets || []).map((s: any) => s.properties.title);
    
    const requests: any[] = [];
    const missingVillages: number[] = [];
    
    for (let i = 1; i <= 9; i++) {
      const tabName = getSheetTabName(i);
      if (!existingTabs.includes(tabName)) {
        missingVillages.push(i);
      }
    }
    
    if (missingVillages.length === 0) {
      return; // All tabs exist!
    }
    
    // If the spreadsheet only has default "Sheet1" (or "ชีต1") and village 1 is missing, rename it
    const defaultSheet = (metaData.sheets || []).find((s: any) => s.properties.title === 'Sheet1' || s.properties.title === 'ชีต1');
    if (defaultSheet && missingVillages.includes(1)) {
      requests.push({
        updateSheetProperties: {
          properties: {
            sheetId: defaultSheet.properties.sheetId,
            title: getSheetTabName(1)
          },
          fields: 'title'
        }
      });
      // Remove 1 from missing villages since we renamed the default sheet to it
      const idx = missingVillages.indexOf(1);
      if (idx !== -1) missingVillages.splice(idx, 1);
    }
    
    // Add any remaining missing village sheets
    for (const vId of missingVillages) {
      requests.push({
        addSheet: {
          properties: {
            title: getSheetTabName(vId)
          }
        }
      });
    }
    
    if (requests.length > 0) {
      const batchUpdateUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`;
      const batchRes = await fetchGoogle(batchUpdateUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ requests })
      });
      
      if (!batchRes.ok) {
        const errText = await batchRes.text();
        console.warn('Failed to create missing sheet tabs:', errText);
        throw new Error(`Failed to create missing sheet tabs: ${errText}`);
      }
    }
    
    // Make sure all 9 village tabs have the correct SURVEY_HEADERS in A1
    for (let i = 1; i <= 9; i++) {
      const tabName = getSheetTabName(i);
      const quotedRange = `'${tabName}'!A1`;
      const updateHeadersUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(quotedRange)}?valueInputOption=USER_ENTERED`;
      
      const res = await fetchGoogle(updateHeadersUrl, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          range: quotedRange,
          majorDimension: 'ROWS',
          values: [SURVEY_HEADERS]
        })
      });
      
      if (!res.ok) {
        const errText = await res.text();
        console.warn(`Failed to initialize headers for ${tabName}:`, errText);
      }
    }
  } catch (error) {
    console.warn('ensureSpreadsheetTabsExist warning:', error);
  }
}
