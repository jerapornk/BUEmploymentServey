import { Award, ShieldAlert, LogOut, LayoutDashboard, Home, Database, Smartphone, Laptop, Sparkles, Diamond } from 'lucide-react';
import { User } from 'firebase/auth';

interface NavbarProps {
  isAdminMode: boolean;
  user: User | null;
  onAdminLogin: () => void;
  onAdminLogout: () => void;
  onToggleAdminMode: () => void;
  firestoreConnected: boolean;
  isMobileSim: boolean;
  onToggleMobileSim: () => void;
  language: 'th' | 'en';
  onLanguageChange: (lang: 'th' | 'en') => void;
}

export default function Navbar({
  isAdminMode,
  user,
  onAdminLogin,
  onAdminLogout,
  onToggleAdminMode,
  firestoreConnected,
  isMobileSim,
  onToggleMobileSim,
  language,
  onLanguageChange,
}: NavbarProps) {
  return (
    <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-neutral-100 shadow-sm" id="nav-container">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          
          {/* Logo Brand Section */}
          <div className="flex items-center space-x-2.5 cursor-pointer" onClick={() => { if (isAdminMode) onToggleAdminMode(); }}>
            <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-[#4C2D81] via-[#63299c] to-[#F15A22] text-white shadow-md hover:scale-105 transition-all">
              <svg viewBox="0 0 100 100" className="w-5.5 h-5.5 text-white filter drop-shadow-sm select-none" fill="none" xmlns="http://www.w3.org/2000/svg">
                {/* Glow behind the sparkle */}
                <defs>
                  <radialGradient id="sparkle-glow" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="white" stopOpacity="0.95" />
                    <stop offset="100%" stopColor="white" stopOpacity="0" />
                  </radialGradient>
                </defs>
                
                {/* Diamond Facets */}
                <g stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.95">
                  {/* Pavilion Facets (Bottom half, pointing to (50, 88)) */}
                  <polygon points="12,48 31,48 50,88" fill="white" fillOpacity="0.3" />
                  <polygon points="31,48 50,48 50,88" fill="white" fillOpacity="0.45" />
                  <polygon points="50,48 69,48 50,88" fill="white" fillOpacity="0.2" />
                  <polygon points="69,48 88,48 50,88" fill="white" fillOpacity="0.35" />

                  {/* Crown Facets (Top half) */}
                  <polygon points="31,24 12,48 31,48" fill="white" fillOpacity="0.25" />
                  <polygon points="31,24 31,48 50,48" fill="white" fillOpacity="0.55" />
                  <polygon points="50,24 50,48 69,48" fill="white" fillOpacity="0.15" />
                  <polygon points="69,24 69,48 88,48" fill="white" fillOpacity="0.4" />
                  <polygon points="69,24 88,48 69,48" fill="white" fillOpacity="0.15" />
                  
                  {/* Crown Table Connectors */}
                  <polygon points="31,24 50,24 50,48" fill="white" fillOpacity="0.35" />
                  <polygon points="50,24 69,24 50,48" fill="white" fillOpacity="0.25" />
                  
                  {/* Flat top table line */}
                  <line x1="31" y1="24" x2="69" y2="24" stroke="white" strokeWidth="2.2" />
                </g>

                {/* Soft Radial Sparkle Halo */}
                <circle cx="26" cy="40" r="14" fill="url(#sparkle-glow)" opacity="0.75" />

                {/* Starburst Sparkle Rays (from user's attachment) */}
                <g opacity="0.95">
                  {/* Vertical spike */}
                  <path d="M 26,12 Q 26,38 26,38 Q 26,38 26,64 Q 26,38 26,12 Z" fill="white" />
                  {/* Horizontal spike */}
                  <path d="M 2,40 Q 26,40 26,40 Q 26,40 50,40 Q 26,40 2,40 Z" fill="white" />
                  {/* Thin diagonal ordinal lines for sparkling depth */}
                  <line x1="14" y1="28" x2="38" y2="52" stroke="white" strokeWidth="1.2" strokeLinecap="round" />
                  <line x1="14" y1="52" x2="38" y2="28" stroke="white" strokeWidth="1.2" strokeLinecap="round" />
                  
                  {/* Star center glow */}
                  <circle cx="26" cy="40" r="2" fill="white" />
                </g>
              </svg>
            </div>
            <div>
              <span className="block font-sans font-black text-sm tracking-tight text-[#1E293B] leading-none mb-0.5 whitespace-nowrap">
                BU <span className="text-[#4C2D81]">Graduate Employment Survey</span>
              </span>
              <span className="block font-sans text-[8.5px] text-[#F15A22] font-extrabold uppercase tracking-[0.24em] whitespace-nowrap">
                Bangkok University
              </span>
            </div>
          </div>

          {/* Controls Section */}
          <div className="flex items-center space-x-2.5">
            {/* Live Status Badge */}
            <div className="hidden md:flex items-center space-x-1.5 px-3 py-1 rounded-full bg-neutral-50 border border-neutral-200">
              <span className={`w-2 h-2 rounded-full ${firestoreConnected ? 'bg-emerald-500 animate-ping' : 'bg-red-500'}`}></span>
              <span className="font-mono text-[10px] text-neutral-500 font-medium">
                {firestoreConnected ? 'DB SECURE' : 'CONNECTING'}
              </span>
            </div>

            {/* Language Selector (Bilingual: TH & EN) */}
            <div className="flex items-center space-x-1 bg-neutral-50 p-1 rounded-xl border border-neutral-200 font-sans">
               <button
                onClick={() => onLanguageChange('th')}
                className={`flex items-center justify-center px-3 py-1 rounded-lg text-xs font-black transition-all cursor-pointer ${
                  language === 'th'
                    ? 'bg-gradient-to-r from-[#4C2D81] to-[#63299c] text-white shadow-sm'
                    : 'text-neutral-500 hover:text-neutral-800'
                }`}
                title="ภาษาไทย"
              >
                <span>TH</span>
              </button>
              <button
                onClick={() => onLanguageChange('en')}
                className={`flex items-center justify-center px-3 py-1 rounded-lg text-xs font-black transition-all cursor-pointer ${
                  language === 'en'
                    ? 'bg-gradient-to-r from-[#4C2D81] to-[#63299c] text-white shadow-sm'
                    : 'text-neutral-500 hover:text-neutral-800'
                }`}
                title="English"
              >
                <span>EN</span>
              </button>
            </div>

            {/* Simulated Mobile View Toggle (Visible only on desktop screens sm and up) */}
            {!isAdminMode && (
              <button
                onClick={onToggleMobileSim}
                className={`hidden sm:flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all duration-300 ${
                  isMobileSim
                    ? 'bg-gradient-to-r from-[#4C2D81]/10 to-[#F15A22]/10 text-[#4C2D81] border border-[#4C2D81]/25 ring-1 ring-[#4C2D81]/10'
                    : 'bg-neutral-50 text-neutral-600 border border-neutral-250 hover:bg-neutral-100 hover:text-neutral-800'
                }`}
                title="สลับมุมมองมือถือจำลอง"
              >
                {isMobileSim ? (
                  <>
                    <Laptop className="w-3.5 h-3.5 text-[#F15A22]" />
                    <span>มุมมองจอปกติ (Full Web)</span>
                  </>
                ) : (
                  <>
                    <Smartphone className="w-3.5 h-3.5 text-[#4C2D81] animate-bounce" />
                    <span>มุมมองจำลองมือถือ BU</span>
                  </>
                )}
              </button>
            )}

            {user ? (
              <div className="flex items-center space-x-2">
                <button
                  id="btn-toggle-mode"
                  onClick={onToggleAdminMode}
                  className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold tracking-wide transition-all duration-300 ${
                    isAdminMode
                      ? 'bg-white text-[#1E293B] border border-[#E2E8F0] hover:bg-[#F8FAFC] shadow-sm'
                      : 'bg-[#4C2D81] text-white hover:bg-[#3b2264] shadow-sm'
                  }`}
                >
                  {isAdminMode ? (
                    <>
                      <Home className="w-3.5 h-3.5" />
                      <span>ทำแบบสำรวจ Layout</span>
                    </>
                  ) : (
                    <>
                      <LayoutDashboard className="w-3.5 h-3.5" />
                      <span>แผงควบคุม</span>
                    </>
                  )}
                </button>

                <div className="relative group flex items-center">
                  <div className="w-8 h-8 rounded-full overflow-hidden border border-indigo-100 shadow-sm">
                    {user.photoURL ? (
                      <img src={user.photoURL} alt={user.displayName || 'Admin'} referrerPolicy="no-referrer" />
                    ) : (
                      <div className="w-full h-full bg-[#4C2D81] flex items-center justify-center text-white text-xs font-bold font-sans">
                        {user.displayName?.charAt(0) || 'A'}
                      </div>
                    )}
                  </div>
                  <button
                    id="btn-logout"
                    onClick={onAdminLogout}
                    className="ml-1.5 flex items-center justify-center p-2 rounded-xl text-neutral-400 hover:text-red-500 hover:bg-red-50 transition-all duration-200"
                    title="ออกจากระบบ"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <button
                id="btn-login"
                onClick={onAdminLogin}
                className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl text-xs font-extrabold tracking-wide text-neutral-700 bg-white border border-[#E2E8F0] hover:bg-[#F8FAFC] transition-all duration-300 active:scale-95 shadow-sm"
              >
                <ShieldAlert className="w-3.5 h-3.5 text-[#4C2D81]" />
                <span>สำหรับเจ้าหน้าที่</span>
              </button>
            )}
          </div>

        </div>
      </div>
    </nav>
  );
}
