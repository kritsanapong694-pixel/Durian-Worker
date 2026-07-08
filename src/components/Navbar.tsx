import { User } from 'firebase/auth';
import {
  Activity,
  FileSpreadsheet,
  FileText,
  LogOut,
  FolderLock,
  RefreshCw,
  Database,
  Grid
} from 'lucide-react';

interface NavbarProps {
  user: User | null;
  spreadsheetId: string | null;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onLogout: () => void;
  onLogin: () => void; // Added onLogin action
  isLoading: boolean;
  onSync: () => void;
  totalRecords: number;
}

export default function Navbar({
  user,
  spreadsheetId,
  activeTab,
  setActiveTab,
  onLogout,
  onLogin,
  isLoading,
  onSync,
  totalRecords
}: NavbarProps) {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-emerald-100 bg-white/95 backdrop-blur-md shadow-xs">
      <div className="mx-auto flex max-w-7xl h-16 items-center justify-between px-4 sm:px-6">
        
        {/* Logo and App Brand */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 shadow-md shadow-emerald-200">
            <Activity className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="font-sans font-bold text-gray-900 leading-none tracking-tight text-sm sm:text-base">
              Durian Orchard Health Research
            </h1>
            <p className="font-mono text-[10px] text-emerald-600 font-medium">
              แบบสอบถามและแดชบอร์ดสุขภาพแรงงานสวนทุเรียน 9 หมู่บ้าน
            </p>
          </div>
        </div>

        {/* Tab Selection Navigation */}
        <nav className="hidden md:flex items-center gap-1 bg-emerald-50/50 p-1 rounded-xl border border-emerald-100/50">
          <button
            id="nav-tab-dashboard"
            onClick={() => setActiveTab('dashboard')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              activeTab === 'dashboard'
                ? 'bg-white text-emerald-800 shadow-xs border-b-2 border-emerald-600'
                : 'text-gray-600 hover:bg-white/50 hover:text-gray-900'
            }`}
          >
            <Grid className="h-4 w-4" />
            แดชบอร์ดเรียลไทม์
          </button>
          <button
            id="nav-tab-survey"
            onClick={() => setActiveTab('survey')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              activeTab === 'survey'
                ? 'bg-white text-emerald-800 shadow-xs border-b-2 border-emerald-600'
                : 'text-gray-600 hover:bg-white/50 hover:text-gray-900'
            }`}
          >
            <FileText className="h-4 w-4" />
            กรอกแบบสอบถาม
          </button>
          <button
            id="nav-tab-drafts"
            onClick={() => setActiveTab('drafts')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              activeTab === 'drafts'
                ? 'bg-white text-emerald-800 shadow-xs border-b-2 border-emerald-600'
                : 'text-gray-600 hover:bg-white/50 hover:text-gray-900'
            }`}
          >
            <FolderLock className="h-4 w-4" />
            จัดการฉบับร่าง
          </button>
        </nav>

        {/* Action Controls & Account Details */}
        <div className="flex items-center gap-3">
          {/* Always show local records count badge */}
          <div className="flex items-center gap-2 rounded-lg border border-emerald-100 bg-emerald-50/30 px-3 py-1.5">
            <Database className="h-3.5 w-3.5 text-emerald-600" />
            <span className="font-mono text-xs font-semibold text-emerald-800">
              {totalRecords} เรคคอร์ด
            </span>
            <button
              id="nav-sync-btn"
              onClick={onSync}
              disabled={isLoading}
              title="รีเฟรชข้อมูลในระบบ"
              className="rounded-md p-1 text-emerald-600 hover:bg-emerald-100/50 disabled:opacity-50"
            >
              <RefreshCw className={`h-3 w-3 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {user ? (
            <>
              {/* User Avatar Card */}
              <div className="flex items-center gap-2 border-l border-emerald-100 pl-3">
                {user.photoURL ? (
                  <img
                    referrerPolicy="no-referrer"
                    src={user.photoURL}
                    alt={user.displayName || 'User'}
                    className="h-8 w-8 rounded-full border border-emerald-200 shadow-2xs"
                  />
                ) : (
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-600 font-bold text-white text-xs">
                    {user.email?.charAt(0).toUpperCase() || 'U'}
                  </div>
                )}
                
                <div className="hidden xl:flex flex-col text-left">
                  <span className="text-xs font-bold text-gray-800 leading-tight">
                    {user.displayName || 'ผู้วิจัย'}
                  </span>
                  <span className="text-[10px] text-gray-500 max-w-[120px] truncate leading-none">
                    {user.email}
                  </span>
                </div>

                <button
                  id="nav-logout-btn"
                  onClick={onLogout}
                  className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600 transition"
                  title="ออกจากระบบ"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            </>
          ) : (
            <button
              onClick={onLogin}
              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-1.5 text-xs font-bold transition shadow-xs cursor-pointer"
            >
              <Database className="h-3.5 w-3.5" />
              เข้าสู่ระบบคลาวด์
            </button>
          )}
        </div>
      </div>

      {/* Mobile navigation tab buttons */}
      <div className="flex md:hidden border-t border-emerald-100 bg-emerald-50/20 py-2 justify-around px-4">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg text-xs font-medium transition ${
            activeTab === 'dashboard' ? 'text-emerald-700 font-bold' : 'text-gray-500'
          }`}
        >
          <Grid className="h-4 w-4" />
          แดชบอร์ด
        </button>
        <button
          onClick={() => setActiveTab('survey')}
          className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg text-xs font-medium transition ${
            activeTab === 'survey' ? 'text-emerald-700 font-bold' : 'text-gray-500'
          }`}
        >
          <FileText className="h-4 w-4" />
          ทำแบบสอบถาม
        </button>
        <button
          onClick={() => setActiveTab('drafts')}
          className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg text-xs font-medium transition ${
            activeTab === 'drafts' ? 'text-emerald-700 font-bold' : 'text-gray-500'
          }`}
        >
          <FolderLock className="h-4 w-4" />
          แบบร่าง
        </button>
      </div>
    </header>
  );
}
