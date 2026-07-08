import { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { Participant } from './types';
import {
  initAuth,
  googleSignIn,
  logout,
  getAccessToken,
  registerTokenListener,
  getGlobalSpreadsheetId,
  setGlobalSpreadsheetId,
  getParticipantsFromFirestore,
  saveParticipantToFirestore,
  deleteParticipantFromFirestore
} from './lib/firebase';
import {
  findSpreadsheet,
  createResearchSpreadsheet,
  appendParticipantData,
  fetchAllParticipants,
  ensureSpreadsheetTabsExist,
  shareSpreadsheetWithAnyone,
  checkSpreadsheetAccess
} from './lib/googleSheets';
import Navbar from './components/Navbar';
import DashboardView from './components/DashboardView';
import QuestionnaireForm from './components/QuestionnaireForm';
import ActiveDrafts from './components/ActiveDrafts';
import {
  Activity,
  FileSpreadsheet,
  FileText,
  Lock,
  ArrowRight,
  Loader2,
  AlertCircle,
  Database,
  Sparkles,
  HelpCircle,
  FolderLock
} from 'lucide-react';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [needsAuth, setNeedsAuth] = useState(true); // บังคับให้ login Google ก่อนใช้งานเสมอ
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isSyncingSheets, setIsSyncingSheets] = useState(false);
  const [isLoadingSpreadsheet, setIsLoadingSpreadsheet] = useState(false);
  const [spreadsheetId, setSpreadsheetId] = useState<string | null>(() => {
    return localStorage.getItem('durian_survey_spreadsheet_id');
  });

  // Navigation tab: 'dashboard' | 'survey' | 'drafts'
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [editingParticipant, setEditingParticipant] = useState<Participant | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Load participants directly from Cloud Firestore, with local auto-migration
  const fetchParticipants = async (currentUser?: User | null) => {
    const activeUser = currentUser !== undefined ? currentUser : user;
    try {
      let list: Participant[] = [];
      if (activeUser) {
        list = await getParticipantsFromFirestore();
        
        // Auto-migrate any legacy local records that are not in Firestore yet (e.g. they exist in server-backed JSON)
        try {
          const res = await fetch('/api/participants');
          if (res.ok) {
            const localList: Participant[] = await res.json();
            
            // Deduplicate: find local items that do not exist in Firestore (checked by ID or code + docNo)
            const docKeys = new Set(list.map(p => `${p.participantCode || ''}_${p.docNo || ''}`));
            const docIds = new Set(list.map(p => p.id));
            
            const unsaved = localList.filter(p => 
              !docIds.has(p.id) && 
              !docKeys.has(`${p.participantCode || ''}_${p.docNo || ''}`)
            );
            
            if (unsaved.length > 0) {
              console.log(`Auto-migrating ${unsaved.length} unsaved local records to Firebase Firestore...`);
              for (const p of unsaved) {
                await saveParticipantToFirestore(p);
              }
              // Refresh complete list from Firestore after migration
              list = await getParticipantsFromFirestore();
            }
          }
        } catch (migErr) {
          console.warn('Legacy local data migration skipped:', migErr);
        }
      } else {
        // Fallback to local server database if not logged in
        const res = await fetch('/api/participants');
        if (res.ok) {
          list = await res.json();
        }
      }
      
      setParticipants(list);
    } catch (e) {
      console.error('Error fetching participants from Firestore:', e);
      // Fallback
      try {
        const res = await fetch('/api/participants');
        if (res.ok) {
          const list = await res.json();
          setParticipants(list);
        }
      } catch (innerErr) {
        console.error('Local fallback also failed:', innerErr);
      }
    }
  };

  // 1. Initialize Firebase Auth and Session Caching
  useEffect(() => {
    const unsubscribeAuth = initAuth(
      (currentUser, cachedToken) => {
        setUser(currentUser);
        setToken(cachedToken);
        setNeedsAuth(false);
        fetchParticipants(currentUser);
      },
      () => {
        setUser(null);
        setToken(null);
        setNeedsAuth(true); // ไม่มี token ที่ใช้งานได้ → บังคับ login ใหม่
        setParticipants([]);
      }
    );

    const unsubscribeToken = registerTokenListener((newToken) => {
      setToken(newToken);
    });

    return () => {
      unsubscribeAuth();
      unsubscribeToken();
    };
  }, []);

  // 3. User Authentication Trigger
  const handleLogin = async () => {
    setIsLoggingIn(true);
    setErrorMsg(null);
    try {
      const result = await googleSignIn();
      if (result) {
        setUser(result.user);
        setToken(result.accessToken);
        setNeedsAuth(false);
      }
    } catch (err: any) {
      console.error('Login action error:', err);
      setErrorMsg('ไม่สามารถเข้าสู่ระบบผ่าน Google ได้ กรุณาลองใหม่อีกครั้ง');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    setUser(null);
    setToken(null);
    setSpreadsheetId(null);
    setNeedsAuth(true); // ไม่มี token ที่ใช้งานได้ → บังคับ login ใหม่
    sessionStorage.removeItem('g_access_token');
    await fetchParticipants(null);
  };

  // 4. Force Reload Data from Cloud Firestore
  const handleForceSync = async () => {
    setIsLoadingSpreadsheet(true);
    setErrorMsg(null);
    try {
      await fetchParticipants(user);
    } catch (err: any) {
      console.error('Sync error:', err);
      setErrorMsg('การดึงข้อมูลจาก Firebase Cloud ล้มเหลว กำลังแสดงข้อมูลในระบบ');
    } finally {
      setIsLoadingSpreadsheet(false);
    }
  };

  // 5. Submit survey form (Save to Firestore directly)
  const handleSurveySubmit = async (p: Participant): Promise<boolean> => {
    try {
      setIsLoadingSpreadsheet(true);
      
      // 1. Save directly to Cloud Firestore (Durable Persistent Cloud storage)
      const savedParticipant = await saveParticipantToFirestore(p);

      // 2. Also back up to local server-backed file storage as a secondary fallback
      try {
        await fetch('/api/participants', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(savedParticipant)
        });
      } catch (backupErr) {
        console.warn('Backup to local server storage failed:', backupErr);
      }

      await fetchParticipants(user);
      setEditingParticipant(null);
      setActiveTab('dashboard');

      alert('บันทึกแบบสอบถามเรียบร้อยแล้ว และสำรองเข้าฐานข้อมูล Cloud Firebase เรียบร้อยแล้ว! ☁️🎉');
      return true;
    } catch (err: any) {
      console.error('Submission failure:', err);
      alert('บันทึกข้อมูลไม่สำเร็จ: ' + (err.message || 'โปรดตรวจสอบความครบถ้วนของข้อมูลและสิทธิ์การใช้งาน'));
      return false;
    } finally {
      setIsLoadingSpreadsheet(false);
    }
  };

  // 6. Manual Bulk Sync from Server DB to Firebase Firestore
  const handleSyncToSheets = async () => {
    setIsSyncingSheets(true);
    setErrorMsg(null);
    try {
      // Pull and update Firestore with any missing records
      await fetchParticipants(user);
      alert('เชื่อมโยงและซิงค์ข้อมูลกับ Firebase Cloud สำเร็จแล้ว! ข้อมูลล่าสุดถูกอัปเดตเรียบร้อย 🎉');
    } catch (err: any) {
      console.error('Firestore sync failure:', err);
      alert('ซิงค์ข้อมูลล้มเหลว: ' + (err.message || 'โปรดตรวจสอบการเชื่อมต่ออินเทอร์เน็ต'));
    } finally {
      setIsSyncingSheets(false);
    }
  };

  // 6.5 Update spreadsheet ID is no longer needed but kept for props compatibility
  const handleUpdateSpreadsheetId = async (idOrUrl: string) => {
    alert('ระบบเปลี่ยนมาใช้ Firebase Cloud Database เต็มรูปแบบแล้ว ไม่จำเป็นต้องตั้งค่า Google Sheet เพิ่มเติม');
  };

  // Shortcut triggers
  const handleLoadDraft = (draft: Participant) => {
    setEditingParticipant(draft);
    setActiveTab('survey');
  };

  const handleNewSurvey = (selectedVillageId?: string) => {
    setEditingParticipant(
      selectedVillageId
        ? ({ village: selectedVillageId, date: new Date().toISOString().split('T')[0], diseases: [], medications: [], chemicalRoles: [], chemicals: {}, dassScores: {}, cnsSymptoms: {}, ergonomicFactors: {}, q16Symptoms: {} } as any)
        : null
    );
    setActiveTab('survey');
  };

  const handleEditParticipant = (p: Participant) => {
    // Populate form with existing participant so they can revise or write a duplicate
    setEditingParticipant(p);
    setActiveTab('survey');
  };

  // Render Login Portal if required
  if (needsAuth) {
    return (
      <div className="flex min-h-screen flex-col bg-slate-50 items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-3xl border border-slate-100 shadow-xl p-8 text-center animate-fadeIn">
          
          {/* Logo icon */}
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 shadow-lg shadow-emerald-100 mb-6">
            <Activity className="h-7 w-7 text-white animate-pulse" />
          </div>

          <h1 className="font-sans font-black text-gray-900 text-2xl tracking-tight leading-none mb-2">
            Durian Health Research Portal
          </h1>
          <p className="font-sans text-xs text-emerald-600 font-bold mb-6">
            ระบบแบบสอบถามคัดกรองและวิเคราะห์สุขภาพเกษตรกรสวนทุเรียน 9 หมู่บ้าน
          </p>

          <p className="text-xs text-gray-500 text-center leading-relaxed mb-8 max-w-sm mx-auto">
            เข้าสู่ระบบเพื่อความปลอดภัยและเชื่อมต่อฐานข้อมูล Firebase Cloud Database เพื่อเก็บรักษาข้อมูลวิจัยของกลุ่มคุณอย่างถาวร ป้องกันข้อมูลสูญหาย และอัปเดตแบบเรียลไทม์ร่วมกัน
          </p>

          {/* Action buttons */}
          <div className="space-y-3">
            <button
              id="google-signin-btn"
              onClick={handleLogin}
              disabled={isLoggingIn}
              className="gsi-material-button w-full flex items-center justify-center gap-3 py-3 rounded-xl border border-gray-200 bg-white hover:bg-slate-50 transition font-bold text-gray-700 text-sm cursor-pointer disabled:opacity-50"
            >
              {isLoggingIn ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin text-emerald-600" />
                  กำลังยืนยันตัวตน Google...
                </>
              ) : (
                <>
                  <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="h-5 w-5 shrink-0">
                    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                  </svg>
                  <span>เชื่อมต่อสิทธิ์บัญชี Google</span>
                </>
              )}
            </button>
          </div>

          <div className="mt-8 flex items-center justify-center gap-1.5 text-[10px] font-bold text-gray-400">
            <Lock className="h-3.5 w-3.5" />
            เชื่อมต่อ Cloud Database ถาวร ปลอดภัย ผ่านสิทธิ์ระบุตัวตนเกษตรกร
          </div>
        </div>
      </div>
    );
  }

  // Render Loader if Cloud database configuration is active
  if (isLoadingSpreadsheet && participants.length === 0) {
    return (
      <div className="flex min-h-screen flex-col bg-slate-50 items-center justify-center p-4">
        <div className="w-full max-w-sm bg-white rounded-3xl border border-slate-100 shadow-xl p-8 text-center">
          <Loader2 className="mx-auto h-10 w-10 animate-spin text-emerald-600 mb-4" />
          <h2 className="font-sans font-bold text-gray-800 text-sm">กำลังเชื่อมต่อฐานข้อมูลคลาวด์ Firebase...</h2>
          <p className="text-xs text-gray-500 mt-2">
            กำลังดึงฐานข้อมูลรหัสและประวัติงานวิจัยเรียลไทม์จากระบบ Cloud Firestore...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-gray-700">
      
      {/* Sleek navigation bar */}
      <Navbar
        user={user}
        spreadsheetId={spreadsheetId}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onLogout={handleLogout}
        onLogin={handleLogin}
        isLoading={isLoadingSpreadsheet}
        onSync={handleForceSync}
        totalRecords={participants.length}
      />

      {/* Main Content Area */}
      <main className="flex-1">
        {errorMsg && (
          <div className="mx-auto max-w-7xl px-4 sm:px-6 mt-4">
            <div className="rounded-xl border border-red-100 bg-red-50 p-4 text-xs font-semibold text-red-800 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-red-500" />
              <span>{errorMsg}</span>
              <button
                onClick={handleForceSync}
                className="ml-auto underline hover:text-red-950"
              >
                ลองใหม่อีกครั้ง
              </button>
            </div>
          </div>
        )}

        {activeTab === 'dashboard' && (
          <DashboardView
            participants={participants}
            onEditParticipant={handleEditParticipant}
            user={user}
            spreadsheetId={spreadsheetId}
            onSyncToSheets={handleSyncToSheets}
            isSyncingSheets={isSyncingSheets}
            onUpdateSpreadsheetId={handleUpdateSpreadsheetId}
          />
        )}

        {activeTab === 'survey' && (
          <QuestionnaireForm
            initialState={editingParticipant}
            onSubmit={handleSurveySubmit}
            onCancel={() => {
              setEditingParticipant(null);
              setActiveTab('dashboard');
            }}
          />
        )}

        {activeTab === 'drafts' && (
          <ActiveDrafts
            onLoadDraft={handleLoadDraft}
            onNewSurvey={handleNewSurvey}
          />
        )}
      </main>

      {/* Subtle system footer */}
      <footer className="py-6 border-t border-emerald-50 bg-white">
        <div className="mx-auto max-w-7xl px-4 text-center text-[10px] font-mono text-gray-400">
          <span>DURIAN FARM AGRICULTURAL WORKERS HEALTH RESEARCH ENGINE v1.2</span>
          <span className="mx-2">•</span>
          <span>POWERED BY GOOGLE FIREBASE CLOUD FIRESTORE</span>
        </div>
      </footer>
    </div>
  );
}
