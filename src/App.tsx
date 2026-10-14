import React, { useState, useEffect } from 'react';
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut,
  User 
} from 'firebase/auth';
import { 
  collection, 
  doc, 
  getDocFromServer, 
  getDocs, 
  query, 
  where,
  setDoc,
  onSnapshot
} from 'firebase/firestore';
import { db, auth } from './firebase';
import { CustomQuestion, SurveyResponse } from './types';
import Navbar from './components/Navbar';
import HeroSection from './components/HeroSection';
import StudentSurvey from './components/StudentSurvey';
import AdminDashboard from './components/AdminDashboard';
import { Sparkles, ShieldX, KeyRound, CheckSquare, Loader2, Award, FileSpreadsheet } from 'lucide-react';

export default function App() {
  // Navigation States
  const [currentView, setCurrentView] = useState<'home' | 'survey' | 'admin'>('home');
  const [isAdminMode, setIsAdminMode] = useState(false);

  // Authentication & Admin States
  const [user, setUser] = useState<User | null>(null);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [isAdminAuthLoading, setIsAdminAuthLoading] = useState(true);

  // DB Metadata States
  const [firestoreConnected, setFirestoreConnected] = useState(false);
  const [surveyCount, setSurveyCount] = useState(0);
  const [customQuestions, setCustomQuestions] = useState<CustomQuestion[]>([]);
  const [isMobileSim, setIsMobileSim] = useState(false);
  const [language, setLanguage] = useState<'th' | 'en'>('th');

  // 1. Connection Validation to Firestore on Boot (Strict directive from skill)
  useEffect(() => {
    async function testConnection() {
      try {
        // Fetch to test connection
        await getDocFromServer(doc(db, 'test', 'connection'));
        setFirestoreConnected(true);
      } catch (error) {
        if (error instanceof Error && error.message.includes('the client is offline')) {
          console.error("Please check your Firebase configuration.");
          setFirestoreConnected(false);
        } else {
          // Any other error means client is still connected to firestore backend endpoints
          setFirestoreConnected(true);
        }
      }
    }
    testConnection();
  }, []);

  // 2. Real-time synchronization of survey responses count & custom questions
  useEffect(() => {
    // Real-time listener for Survey Responses count
    const unsubscribeResponses = onSnapshot(
      collection(db, 'survey_responses'),
      (snapshot) => {
        setSurveyCount(snapshot.size);
      },
      (countErr) => {
        console.warn('survey_responses real-time sync notice:', countErr);
      }
    );

    // Real-time listener for custom questions
    const unsubscribeQuestions = onSnapshot(
      collection(db, 'questions'),
      (qSnap) => {
        const qList = qSnap.docs.map(doc => {
          const data = doc.data();
          return {
            id: data.id || doc.id,
            title: data.title || '',
            type: data.type || 'text',
            options: data.options || [],
            section: data.section || 'general',
            required: data.required || false
          } as CustomQuestion;
        });
        const uniqueQs = qList.filter((value, idx, self) =>
          self.findIndex(v => v.id === value.id) === idx
        );
        setCustomQuestions(uniqueQs);
      },
      (err) => {
        console.warn('questions real-time sync notice:', err);
      }
    );

    return () => {
      unsubscribeResponses();
      unsubscribeQuestions();
    };
  }, []);

  const fetchAppMetadata = async () => {
    // Kept for backward compatibility when child components trigger onSurveySubmitted
    try {
      const sSnap = await getDocs(collection(db, 'survey_responses'));
      setSurveyCount(sSnap.size);
    } catch (e) {
      // Ignored since real-time listener is already managing the count
    }
  };

  // 3. Track Firebase Authentication State
  useEffect(() => {
    setIsAdminAuthLoading(true);
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        // Enforce user email privilege verification:
        // A. Is hardcoded bootstrapped admin?
        const isBootstrappedAdmin = currentUser.email?.trim().toLowerCase() === 'jeraporn.k@bu.ac.th';
        
        if (isBootstrappedAdmin) {
          // Explicitly register / update the admins doc in firestore for the UID
          setDoc(doc(db, 'admins', currentUser.uid), {
            email: currentUser.email?.trim().toLowerCase(),
            role: 'admin'
          }, { merge: true }).catch((err) => {
            console.error('Failed to register bootstrapped admin document in Firestore:', err);
          });
          
          setIsSuperAdmin(true);
          setIsAdminMode(true);
          setCurrentView('admin');
        } else {
          // B. Check admins collection in Firestore
          try {
            const adminDoc = await getDocs(query(collection(db, 'admins'), where('email', '==', currentUser.email)));
            if (!adminDoc.empty) {
              setIsSuperAdmin(true);
              setIsAdminMode(true);
              setCurrentView('admin');
            } else {
              setIsSuperAdmin(false);
              setIsAdminMode(false);
            }
          } catch (err) {
            console.error('Admin privilege check failed', err);
            setIsSuperAdmin(false);
            setIsAdminMode(false);
          }
        }
      } else {
        setIsSuperAdmin(false);
        setIsAdminMode(false);
        if (currentView === 'admin') {
          setCurrentView('home');
        }
      }
      setIsAdminAuthLoading(false);
    });

    return () => unsubscribe();
  }, [currentView]);

  // Try to authenticate Admin using standard secure Google Popup Sign-in
  const handleAdminLogin = async () => {
    try {
      const provider = new GoogleAuthProvider();
      // Required by skill: Prefer using signInWithPopup in this sandboxed iframe environment
      await signInWithPopup(auth, provider);
    } catch (err) {
      console.error('Login failed', err);
      alert('การยืนยันตัวตนล้มเหลว ตรวจสอบสิทธิเครือข่ายอินเทอร์เน็ตของท่าน');
    }
  };

  // Logout Admin
  const handleAdminLogout = async () => {
    try {
      await signOut(auth);
      setUser(null);
      setIsSuperAdmin(false);
      setIsAdminMode(false);
      setCurrentView('home');
    } catch (err) {
      console.error('Logout failed', err);
    }
  };

  const handleToggleAdminMode = () => {
    if (isAdminMode) {
      // Toggle back to graduate view
      setIsAdminMode(false);
      setCurrentView('home');
    } else {
      // Move to admin page
      setIsAdminMode(true);
      setCurrentView('admin');
    }
  };

  const handleStartSurvey = () => {
    setCurrentView('survey');
  };

  const renderProductiveViews = () => {
    const mainSurveyContent = (
      <div className={`h-full ${isMobileSim ? 'px-1 py-2' : ''}`}>
        {currentView === 'home' && (
          <HeroSection 
            onStartSurvey={handleStartSurvey} 
            surveyCount={surveyCount} 
            isMobileSim={isMobileSim}
            language={language}
            onLanguageChange={setLanguage}
          />
        )}

        {currentView === 'survey' && (
          <StudentSurvey 
            customQuestions={customQuestions} 
            onSurveySubmitted={() => {
              fetchAppMetadata();
              setCurrentView('home');
            }} 
            isMobileSim={isMobileSim}
            language={language}
            onLanguageChange={setLanguage}
          />
        )}
      </div>
    );

    if (isMobileSim && currentView !== 'admin') {
      return (
        <div className="flex flex-col items-center justify-center py-6 px-4 bg-gradient-to-br from-[#120B24] via-[#1E1135] to-[#2E1854] min-h-[85vh] relative overflow-hidden">
          {/* Neon background decorations */}
          <div className="absolute top-1/4 -left-12 w-64 h-64 rounded-full bg-[#4C2D81]/20 blur-3xl"></div>
          <div className="absolute bottom-1/4 -right-12 w-64 h-64 rounded-full bg-[#F15A22]/15 blur-3xl"></div>

          {/* Controls description */}
          <div className="text-center mb-6 max-w-sm z-10 animate-fade-in">
            <span className="inline-flex items-center space-x-1 px-3 py-1 bg-gradient-to-r from-[#4C2D81] to-[#F15A22] text-white rounded-full text-[9px] font-black uppercase tracking-wider shadow-sm">
              <Sparkles className="w-2.5 h-2.5" />
              <span>BU CREATIVE APP HUB</span>
            </span>
            <h2 className="text-white font-sans font-black text-sm mt-2 tracking-tight">
              📱 แผงแสดงผลจำลองบนสมาร์ทโฟน
            </h2>
            <p className="text-neutral-300 text-[11px] mt-1 font-sans font-medium leading-relaxed">
              จำลองประสบการณ์แบบมัลติทัชที่ออกแบบมาสัญชาติไทยระดับพรีเมียม เพื่อนักศึกษามหาวิทยาลัยกรุงเทพโดยเฉพาะ
            </p>
          </div>

          {/* Smartphone structure frame */}
          <div className="relative mx-auto border-[10px] border-neutral-900 rounded-[3rem] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8)] bg-[#F8FAFC] w-full max-w-[380px] h-[780px] flex flex-col overflow-hidden ring-4 ring-neutral-800 ring-offset-1 ring-offset-neutral-950 z-10">
            {/* Dynamic Island / Speaker */}
            <div className="absolute top-0 inset-x-0 h-8 flex items-center justify-center z-50 pointer-events-none">
              <div className="w-24 h-4 bg-neutral-950 rounded-full mt-2 flex items-center justify-between px-3 shadow-inner">
                <span className="w-1 h-1 rounded-full bg-blue-500/80"></span>
                <span className="w-8 h-1.5 bg-neutral-900 rounded-full"></span>
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-900/60"></span>
              </div>
            </div>

            {/* Simulated Mobile Status bar */}
            <div className="h-9 bg-white border-b border-neutral-100 flex justify-between items-center px-6 pt-3 select-none text-[10px] font-sans font-black text-neutral-800 z-40">
              <span>09:41</span>
              <div className="flex items-center space-x-1.5">
                <span className="text-[9px] font-black tracking-tighter">5G</span>
                <span>📶</span>
                <span>🔋 100%</span>
              </div>
            </div>

            {/* Smartphone screen contents */}
            <div className="flex-1 overflow-y-auto bg-[#F8FAFC] pb-10">
              {mainSurveyContent}
            </div>

            {/* iOS Home bottom indicator bar */}
            <div className="absolute bottom-1 inset-x-0 h-4 flex items-center justify-center pointer-events-none z-50">
              <div className="w-28 h-1 bg-neutral-900 rounded-full opacity-80"></div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="max-w-4xl mx-auto mt-2">
        {mainSurveyContent}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans" id="application-container">
      {/* Dynamic Global Top Navbar */}
      <Navbar
        isAdminMode={currentView === 'admin'}
        user={user}
        onAdminLogin={handleAdminLogin}
        onAdminLogout={handleAdminLogout}
        onToggleAdminMode={handleToggleAdminMode}
        firestoreConnected={firestoreConnected}
        isMobileSim={isMobileSim}
        onToggleMobileSim={() => setIsMobileSim(!isMobileSim)}
        language={language}
        onLanguageChange={setLanguage}
      />

      {/* Main Views Container Router */}
      <main className="flex-1 pb-16">
        {currentView !== 'admin' ? (
          renderProductiveViews()
        ) : (
          <div className="max-w-7xl mx-auto">
            {isAdminAuthLoading ? (
              <div className="flex flex-col items-center justify-center py-20 text-neutral-500">
                <Loader2 className="w-10 h-10 animate-spin text-[#4C2D81] mb-4" />
                <p className="font-sans text-xs">กำลังตรวจสอบสิทธิ์การเป็นผู้ดูแลระบบ...</p>
              </div>
            ) : user && isSuperAdmin ? (
              <AdminDashboard 
                customQuestions={customQuestions} 
                onQuestionsUpdated={fetchAppMetadata} 
              />
            ) : (
              /* High privacy warning message if a standard user tries to click Admin */
              <div className="max-w-md mx-auto py-16 px-4 text-center">
                <div className="bg-white rounded-3xl p-8 shadow-xl border border-neutral-100 flex flex-col items-center">
                  <div className="w-16 h-16 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mb-5 shadow-inner">
                    <ShieldX className="w-9 h-9" />
                  </div>
                  <h2 className="font-sans font-extrabold text-lg text-neutral-800 mb-2">
                    ปฏิเสธสิทธิ์การเข้าถึงข้อมูล
                  </h2>
                  <p className="text-neutral-400 font-sans text-xs mb-6 leading-relaxed">
                    ข้อมูลผู้สำเร็จการศึกษานี้ สงวนสิทธิ์เฉพาะผู้ใช้กลุ่มผู้ดูแลระบบอย่างเป็นทางการเท่านั้น อีเมลของคุณ <span className="font-mono font-bold text-neutral-600">({user?.email})</span> ไม่ได้รับอนุญาตให้ข้ามมาตรฐานการรักษาความปลอดภัยของระบบ
                  </p>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setCurrentView('home')}
                      className="px-5 py-2 rounded-xl bg-neutral-105 border border-neutral-200 text-neutral-600 font-bold font-sans text-xs hover:bg-neutral-200"
                    >
                      กลับสู่หน้าหลัก
                    </button>
                    <button
                      onClick={handleAdminLogout}
                      className="px-5 py-2 rounded-xl bg-red-600 text-white font-bold font-sans text-xs hover:bg-red-700"
                    >
                      เข้าสู่ระบบบัญชีอื่น
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Premium Footer details */}
      <footer className="mt-auto border-t border-neutral-100 bg-white py-6 text-center text-neutral-400" id="survey-footer">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row justify-between items-center text-[10px] font-sans">
          <p>© 2026 แผนกมาตรฐานวิชาการและตำแหน่งวิชาการ สำนักมาตรฐานคุณภาพการศึกษา มหาวิทยาลัยกรุงเทพ</p>
          <div className="flex space-x-3 mt-2 sm:mt-0 font-semibold text-neutral-400">
            <span>Enterprise Edition (BU Creative Spark)</span>
            <span>•</span>
            <span>ความลับข้อมูล 10 ปีตามมาตรฐาน PDPA</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
