import { GraduationCap, Sparkles, ShieldCheck } from 'lucide-react';
import { motion } from 'motion/react';
import { TRANSLATIONS } from '../translations';

interface HeroSectionProps {
  onStartSurvey: () => void;
  surveyCount: number;
  isMobileSim?: boolean;
  language: 'th' | 'en';
  onLanguageChange: (lang: 'th' | 'en') => void;
}

export default function HeroSection({
  onStartSurvey,
  surveyCount,
  isMobileSim,
  language,
  onLanguageChange,
}: HeroSectionProps) {
  const t = TRANSLATIONS[language];

  return (
    <div className={`max-w-4xl mx-auto px-4 ${isMobileSim ? 'py-4' : 'py-10'}`} id="hero-section">
      
      {/* Visual Header Image Banner (Bangkok University Creative Diamond Theme) */}
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-[#4C2D81] via-[#5c249a] to-[#F15A22] text-white shadow-xl border border-white/10"
      >
        {/* Abstract decorative layout balanced elements */}
        <div className="absolute top-0 right-0 w-80 h-80 rounded-full bg-white/5 -mr-16 -mt-16 blur-2xl font-sans"></div>
        <div className="absolute bottom-0 left-0 w-60 h-60 rounded-full bg-[#F15A22]/10 -ml-12 -mb-12 blur-xl font-sans"></div>
        
        {/* BU Landmark: The Creative Diamond Building (ตึกเพชร มหาวิทยาลัยกรุงเทพ) SVG overlay */}
        <div className="absolute right-4 bottom-4 md:right-8 md:bottom-6 w-32 h-32 md:w-48 md:h-48 opacity-15 pointer-events-none select-none z-0">
          <svg viewBox="0 0 100 100" className="w-full h-full fill-white stroke-white stroke-[1.5] animate-pulse">
            <polygon points="50,10 90,40 50,90 10,40" />
            <polygon points="50,10 50,90" />
            <polygon points="10,40 90,40" />
            <line x1="10" y1="40" x2="50" y2="10" />
            <line x1="90" y1="40" x2="50" y2="10" />
            <line x1="50" y1="10" x2="50" y2="40" />
            <line x1="10" y1="40" x2="50" y2="40" />
            <line x1="90" y1="40" x2="50" y2="40" />
            <line x1="50" y1="40" x2="50" y2="90" />
          </svg>
        </div>

        <div className={`relative ${isMobileSim ? 'p-6' : 'p-8 sm:p-12'} md:max-w-2xl z-10`}>
          
          <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
            <div className="flex items-center space-x-2 font-sans">
              <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-white backdrop-blur shadow-inner">
                <GraduationCap className="w-4.5 h-4.5 text-orange-300" />
              </div>
              <span className="text-[10px] font-black tracking-widest text-[#E0E7FF] uppercase">
                BANGKOK UNIVERSITY
              </span>
            </div>

            {/* In-Banner Prominent Language Selector with TH/EN text labels */}
            <div className="flex items-center space-x-1.5 bg-black/25 backdrop-blur p-1 rounded-2xl border border-white/10 text-xs shadow-inner font-sans">
               <button
                type="button"
                onClick={() => onLanguageChange('th')}
                className={`flex items-center justify-center px-4 py-1.5 rounded-xl transition-all duration-300 cursor-pointer text-[10px] sm:text-xs font-black ${
                  language === 'th'
                    ? 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white shadow-md'
                    : 'text-[#E0E7FF] hover:text-white hover:bg-white/5'
                }`}
              >
                <span>TH</span>
              </button>
              <button
                type="button"
                onClick={() => onLanguageChange('en')}
                className={`flex items-center justify-center px-4 py-1.5 rounded-xl transition-all duration-300 cursor-pointer text-[10px] sm:text-xs font-black ${
                  language === 'en'
                    ? 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white shadow-md'
                    : 'text-[#E0E7FF] hover:text-white hover:bg-white/5'
                }`}
              >
                <span>EN</span>
              </button>
            </div>
          </div>

          <h1 className={`font-sans font-black ${isMobileSim ? 'text-xl mb-6' : 'text-2xl sm:text-3xl lg:text-4xl mb-8'} tracking-tight leading-snug`}>
            {language === 'th' ? (
              <>
                แบบสำรวจภาวะการมีงานทำของบัณฑิต มหาบัณฑิตและดุษฎีบัณฑิต <br className="hidden sm:block" />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-orange-400">ประจำปี 2568</span>
              </>
            ) : (
              <>
                Employment Survey of Bachelor's, Master's, and Doctoral Graduates <br className="hidden sm:block" />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-orange-400">Year 2025</span>
              </>
            )}
          </h1>

          <div className="flex flex-wrap items-center gap-3">
            <button
              id="cta-start-survey"
              onClick={onStartSurvey}
              className="flex items-center justify-center space-x-2 px-7 py-3.5 bg-gradient-to-r from-yellow-400 to-orange-500 text-white rounded-2xl font-black font-sans text-xs hover:from-yellow-300 hover:to-orange-400 transition-all duration-300 shadow-md active:scale-97 cursor-pointer"
            >
              <span>{t.startSurveyBtn}</span>
              <Sparkles className="w-4 h-4 text-white animate-bounce" />
            </button>

            {/* Real-time Response Count Live Indicator */}
            <div className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-2xl bg-black/30 backdrop-blur-md border border-white/15 text-white text-xs font-bold font-sans">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-white/80">
                {language === 'th' ? 'ผู้ตอบแบบสำรวจแล้ว:' : 'Live Responses:'}
              </span>
              <span className="font-mono font-black text-amber-300 text-sm tracking-wide">
                {surveyCount}
              </span>
              <span className="text-white/80">
                {language === 'th' ? 'คน' : 'people'}
              </span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* PDPA Privacy Policy Banner */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="mt-6 p-4 rounded-3xl bg-white border border-neutral-100 shadow-sm flex items-start space-x-3.5 hover:shadow-md hover:border-neutral-200/80 transition-all font-sans"
      >
        <div className="p-2 sm:p-2.5 rounded-2xl bg-orange-50 text-[#F15A22] flex-shrink-0">
          <ShieldCheck className="w-4.5 h-4.5 sm:w-5 sm:h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-[11px] sm:text-xs font-black text-[#1E293B] mb-0.5 uppercase tracking-wide">
            {language === 'th' ? 'นโยบายความเป็นส่วนตัว (PDPA Security)' : 'Privacy Policy (PDPA Security)'}
          </h4>
          <p className="text-[10px] sm:text-[11px] text-[#64748B] leading-relaxed font-semibold">
            {t.p2PdpaDesc}
          </p>
        </div>
      </motion.div>

    </div>
  );
}
