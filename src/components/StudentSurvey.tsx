import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  addDoc, 
  serverTimestamp 
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { 
  WORK_TYPES, 
  UNEMPLOYED_REASONS, 
  NOT_SEEKING_REASONS, 
  GET_JOB_TIMELINE, 
  MONTHS, 
  ACADEMIC_YEARS,
  DEGREE_LEVELS,
  FACULTIES,
  normalizeFacultyName
} from '../data';
import { SurveyResponse, Graduate, CustomQuestion } from '../types';
import { TRANSLATIONS } from '../translations';
import { 
  CheckCircle2, 
  ChevronRight, 
  ChevronLeft, 
  Search, 
  Loader2, 
  AlertCircle, 
  FileSpreadsheet, 
  Lock, 
  GraduationCap, 
  BookOpen, 
  Award,
  Edit3,
  Check,
  RotateCcw
} from 'lucide-react';

interface StudentSurveyProps {
  customQuestions: CustomQuestion[];
  onSurveySubmitted: () => void;
  isMobileSim?: boolean;
  language?: 'th' | 'en';
  onLanguageChange?: (lang: 'th' | 'en') => void;
}

export const ENTREPRENEUR_QUESTIONS = [
  {
    id: 1,
    th: "ดำเนินธุรกิจบนพื้นฐานของคุณธรรมจริยธรรม พร้อมตระหนักถึงความรับผิดชอบต่อสังคม",
    en: "Conducts business based on ethical principles and moral integrity, with a clear awareness of social responsibility."
  },
  {
    id: 2,
    th: "มีความรู้ความเชี่ยวชาญในสาขาวิชาและสามารถนำไปประยุกต์ใช้ได้",
    en: "Possesses knowledge and expertise in the field of study and can apply this knowledge effectively."
  },
  {
    id: 3,
    th: "มีกระบวนการคิด/ตัดสินใจ และแก้ไขปัญหาที่ซับซ้อนได้อย่างเป็นระบบ",
    en: "Demonstrates systematic thinking, decision-making, and the ability to solve complex problems effectively."
  },
  {
    id: 4,
    th: "มีมนุษยสัมพันธ์ที่ดีและสามารถทำงานร่วมกับผู้อื่นได้",
    en: "Exhibits good interpersonal skills and is able to work effectively with others."
  },
  {
    id: 5,
    th: "การใช้เครื่องมือทางคณิตศาสตร์/สถิติในการวิเคราะห์ข้อมูล และใช้เทคโนโลยีสารสนเทศในการนำเสนอผลงานได้อย่างเหมาะสม",
    en: "Uses mathematical and statistical tools to analyze data and employs information technology appropriately for presenting work."
  },
  {
    id: 6,
    th: "การสร้างสรรค์นวัตกรรมใหม่ๆ เพื่อใช้ในการปรับปรุงประสิทธิภาพการทำงาน",
    en: "Creates new innovations to improve work efficiency."
  },
  {
    id: 7,
    th: "มีจิตวิญญาณความเป็นผู้ประกอบการ",
    en: "Demonstrates an entrepreneurial mindset."
  },
  {
    id: 8,
    th: "การใช้ภาษาต่างประเทศในการปฏิบัติงาน เช่น การสื่อสาร การประสานงาน",
    en: "Utilizes foreign languages in work-related tasks, such as communication and coordination."
  },
  {
    id: 9,
    th: "การรู้จัดการตั้งคำถามเพื่อค้นหาข้อเท็จจริงและโอกาสทางธุรกิจใหม่ๆ",
    en: "Knows how to ask questions to identify facts and explore new business opportunities."
  },
  {
    id: 10,
    th: "มีความใฝ่เรียนรู้และปรับตัวอย่างต่อเนื่อง เพื่อให้ทันต่อการเปลี่ยนแปลงในโลกดิจิทัล",
    en: "Demonstrates continuous learning and adaptability to keep pace with changes in the digital world."
  }
];

export default function StudentSurvey({ 
  customQuestions, 
  onSurveySubmitted, 
  isMobileSim,
  language = 'th',
  onLanguageChange
}: StudentSurveyProps) {
  const t = TRANSLATIONS[language];
  // Navigation State
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1); // 1: ID check, 2: Profile & General, 3: Employment status, 4: Detailed Questions, 5: Review & Submit
  
  // ID Verification State
  const [userInputId, setUserInputId] = useState('');
  const [isVerifyingId, setIsVerifyingId] = useState(false);
  const [verificationError, setVerificationError] = useState('');
  const [matchedGraduate, setMatchedGraduate] = useState<Graduate | null>(null);

  // Field Validation Errors
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Profile Confirmation & Custom Edit Mode State
  const [isCustomEditMode, setIsCustomEditMode] = useState(false);
  const [isProfileConfirmed, setIsProfileConfirmed] = useState(false);

  // Core Survey State
  const [studentId, setStudentId] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [faculty, setFaculty] = useState('');
  const [major, setMajor] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [academicYear, setAcademicYear] = useState('2568');
  const [degreeLevel, setDegreeLevel] = useState<string>('ระดับปริญญาตรี');
  const [surveyMonth, setSurveyMonth] = useState('06');
  const [status, setStatus] = useState<'employed' | 'unemployed' | 'not_seeking'>('employed');

  // Part 2: Employed Details
  const [employedDetails, setEmployedDetails] = useState({
    workType: '3', // Default to Private company
    workTypeOther: '',
    jobTitle: '',
    companyName: '',
    companyDept: '',
    companyAddress: {
      no: '',
      moo: '',
      building: '',
      floor: '',
      soi: '',
      road: '',
      subdistrict: '',
      district: '',
      province: 'กรุงเทพมหานคร',
      zipcode: ''
    },
    salary: 15000,
    hasOtherIncome: false,
    otherIncomeDetails: '',
    otherIncomeAmount: 0,
    isRelatedToStudy: true,
    unrelatedReason: '',
    timeToGetJob: '1',
    entrepreneurRatings: {} as Record<string, number>
  });

  // Part 3: Unemployed Details
  const [unemployedDetails, setUnemployedDetails] = useState({
    reason: '4', // Default to looking for work
    reasonOther: ''
  });

  // Part 3: Not Seeking Details
  const [notSeekingDetails, setNotSeekingDetails] = useState({
    reason: '1', // Default to studying further
    reasonOther: ''
  });

  // Part 4: Suggestions for University Improvement
  const [suggestions, setSuggestions] = useState({
    impressions: '',
    improvements: '',
    skillsToCultivate: ''
  });

  // Custom Answers from Admin-configured Questions
  const [customAnswers, setCustomAnswers] = useState<Record<string, string>>({});

  // Final submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [dbError, setDbError] = useState('');

  // Handle student ID verification lookup
  const handleVerifyId = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanId = userInputId.trim();
    if (!cleanId) {
      setVerificationError(t.idRequired);
      return;
    }
    // Check if it is numeric and exactly 10 characters long
    if (!/^\d{10}$/.test(cleanId)) {
      setVerificationError(language === 'th' ? 'กรุณากรอกรหัสประจำตัวนักศึกษาเป็นตัวเลข 10 หลักเท่านั้น' : 'Please enter a 10-digit student ID number consisting of numbers only');
      return;
    }
    setVerificationError('');
    setIsVerifyingId(true);

    try {
      // Check query against Firestore graduates roster
      const gradRef = collection(db, 'graduates');
      const q = query(gradRef, where('studentId', '==', userInputId.trim()));
      const snap = await getDocs(q);

      if (!snap.empty) {
        const docData = snap.docs[0].data() as Graduate;
        setMatchedGraduate(docData);
        setStudentId(docData.studentId);
        // Split names if possible on any whitespace, else just set full name inside firstName
        const names = (docData.fullName || '').trim().split(/\s+/);
        setFirstName(names[0] || '');
        setLastName(names.slice(1).join(' ') || '');
        
        // Normalize potential character or space padding issues
        const rawFaculty = (docData.faculty || '').trim().replace(/เเ/g, 'แ');
        const normalizedMajor = (docData.major || '').trim().replace(/เเ/g, 'แ');
        const normalizedFaculty = normalizeFacultyName(rawFaculty, normalizedMajor, docData.studentId);
        
        setFaculty(normalizedFaculty);
        setMajor(normalizedMajor);
        setAcademicYear(docData.academicYear);
        if (docData.degreeLevel) {
          setDegreeLevel(docData.degreeLevel);
        } else {
          setDegreeLevel('ระดับปริญญาตรี');
        }
        
        setIsCustomEditMode(false);
        setIsProfileConfirmed(false);
        // Go directly to survey form
        setStep(2);
      } else {
        // No graduate found in roster
        setMatchedGraduate(null);
        setStudentId(userInputId.trim());
        setVerificationError(t.idNotFoundAlert);
        setIsCustomEditMode(true);
        setIsProfileConfirmed(false);
        // Let them proceed to manually enter information
        setStep(2);
      }
    } catch (err) {
      console.error('ID verification failed', err);
      // Give fallback manually in case database is empty or connection fails
      setStudentId(userInputId.trim());
      setIsCustomEditMode(true);
      setIsProfileConfirmed(false);
      setStep(2);
    } finally {
      setIsVerifyingId(false);
    }
  };

  // Step-by-Step validation before transitioning to next
  const validateCurrentStep = () => {
    const errors: Record<string, string> = {};

    if (step === 2) {
      const cleanId = studentId.trim();
      if (!cleanId) {
        errors.studentId = t.idRequired;
      } else if (!/^\d{10}$/.test(cleanId)) {
        errors.studentId = language === 'th' ? 'กรุณากรอกรหัสประจำตัวนักศึกษาเป็นตัวเลข 10 หลักเท่านั้น' : 'Please enter a 10-digit student ID number consisting of numbers only';
      }
      if (!firstName.trim()) errors.firstName = t.errFirstName;
      if (!lastName.trim()) errors.lastName = t.errLastName;
      if (!faculty.trim()) errors.faculty = t.errFaculty;
      if (!major.trim()) errors.major = t.errMajor;

      if (!isProfileConfirmed) {
        errors.profileConfirmation = language === 'th' 
          ? 'กรุณากดยืนยันว่าข้อมูลที่ปรากฏถูกต้อง (หรือกดแก้ไขข้อมูลแล้วพิมพ์เอง) ก่อนดำเนินการต่อ' 
          : 'Please confirm that the displayed information is correct or edit it before proceeding';
      }
    }

    if (step === 4) {
      if (status === 'employed') {
        if (!employedDetails.jobTitle.trim()) errors.jobTitle = t.errJobTitle;
        if (!employedDetails.companyName.trim()) errors.companyName = t.errCompanyName;
        if (employedDetails.salary <= 0) errors.salary = t.errSalary;
        if (!employedDetails.companyAddress.subdistrict.trim()) errors.subdistrict = t.addressSubdistrict;
        if (!employedDetails.companyAddress.district.trim()) errors.district = t.addressDistrict;
        if (!employedDetails.companyAddress.zipcode.trim()) errors.zipcode = t.addressZipcode;
        
        if (['6', '7', '8'].includes(employedDetails.workType)) {
          if (!employedDetails.workTypeOther?.trim()) {
            errors.workTypeOther = language === 'th' ? 'กรุณาระบุลักษณะของงาน / สินค้าที่ขาย' : 'Please specify type of work / products sold';
          }
        }

        if (employedDetails.workType === '6') {
          ENTREPRENEUR_QUESTIONS.forEach(q => {
            const score = employedDetails.entrepreneurRatings?.[String(q.id)];
            if (!score || score < 1 || score > 10) {
              errors[`entrepreneur_${q.id}`] = language === 'th' ? 'กรุณาให้คะแนนประเมินตนเอง (1-10)' : 'Please rate this self-evaluation (1-10)';
            }
          });
        }
      }
      // Check required custom questions
      customQuestions.forEach(q => {
        if (q.required && !customAnswers[q.id]?.trim()) {
          errors[`custom_${q.id}`] = language === 'th' ? 'กรุณาตอบคำถามส่วนนี้' : 'Please answer this section';
        }
      });
    }

    if (step === 5) {
      if (!suggestions.impressions.trim()) {
        errors.impressions = language === 'th' ? 'กรุณากรอกข้อมูลสิ่งที่ประทับใจต่อมหาวิทยาลัย' : 'Please specify what impressed you about the university';
      }
      if (!suggestions.improvements.trim()) {
        errors.improvements = language === 'th' ? 'กรุณากรอกข้อมูลสิ่งที่ควรปรับปรุงหรือพัฒนาหลักสูตร' : 'Please specify what the university should improve or develop';
      }
      if (!suggestions.skillsToCultivate.trim()) {
        errors.skillsToCultivate = language === 'th' ? 'กรุณากรอกข้อมูลสิ่งที่ควรปลูกฝังเพื่อเพิ่มทักษะความรู้' : 'Please specify what skills the university should cultivate';
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNextStep = () => {
    if (validateCurrentStep()) {
      if (step === 4 && status === 'employed') {
        setStep(6);
      } else {
        setStep((prev) => (prev + 1) as any);
      }
    }
  };

  const handlePrevStep = () => {
    if (step === 6 && status === 'employed') {
      setStep(4);
    } else {
      setStep((prev) => (prev - 1) as any);
    }
  };

  // Submit survey responses to Firestore
  const handleSubmitSurvey = async () => {
    setIsSubmitting(true);
    setDbError('');

    try {
      const responsePath = 'survey_responses';

      // Duplicate Check: Check if this student already submitted a survey for this academic year
      const responsesRef = collection(db, responsePath);
      const dupQuery = query(
        responsesRef, 
        where('studentId', '==', studentId.trim()), 
        where('academicYear', '==', academicYear)
      );
      const dupSnap = await getDocs(dupQuery);

      if (!dupSnap.empty) {
        setDbError('ท่านได้ทำแบบสำรวจประจำปีการศึกษานี้เรียบร้อยแล้วในระบบ ไม่สามารถส่งซ้ำซ้อนได้');
        setIsSubmitting(false);
        return;
      }

      // Build payload matching strict Firestore constraints
      const payload: SurveyResponse = {
        studentId: studentId.trim(),
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        faculty,
        major,
        phone: phone.trim(),
        email: email.trim(),
        academicYear,
        degreeLevel: degreeLevel || 'ระดับปริญญาตรี',
        surveyMonth,
        status,
        createdAt: serverTimestamp()
      };

      if (status === 'employed') {
        payload.employedDetails = { ...employedDetails };
      } else if (status === 'unemployed') {
        payload.unemployedDetails = { ...unemployedDetails };
      } else if (status === 'not_seeking') {
        payload.notSeekingDetails = { ...notSeekingDetails };
      }

      // Add university suggestions
      payload.suggestions = { ...suggestions };

      if (Object.keys(customAnswers).length > 0) {
        payload.customAnswers = customAnswers;
      }

      // Write document using transactional addDoc
      await addDoc(collection(db, responsePath), payload);
      
      setSubmitSuccess(true);
      onSurveySubmitted();
    } catch (err: any) {
      console.error('Submission failed', err);
      try {
        handleFirestoreError(err, OperationType.CREATE, 'survey_responses');
      } catch (e: any) {
        setDbError(`ระบบปฏิเสธการบันทึกข้อมูล: ${e.message}`);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitSuccess) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4 text-center">
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="bg-white rounded-3xl p-8 shadow-xl border border-neutral-100"
        >
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 shadow-md">
              <CheckCircle2 className="w-10 h-10" />
            </div>
          </div>
          <h2 className="font-sans font-extrabold text-2xl text-neutral-800 mb-3">
            {t.successTitle}
          </h2>
          <p className="text-neutral-500 mb-6 font-sans text-xs sm:text-sm leading-relaxed">
            {t.successDesc}
          </p>
          <button
            onClick={() => {
              // Reset all states
              setStep(1);
              setUserInputId('');
              setMatchedGraduate(null);
              setSubmitSuccess(false);
              setPhone('');
              setEmail('');
              setDegreeLevel('ระดับปริญญาตรี');
            }}
            className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-[#4C2D81] to-[#F15A22] text-white font-black text-xs hover:opacity-95 transition-all duration-200 shadow-md cursor-pointer"
          >
            {t.additionalResponseBtn}
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className={`w-full mx-auto ${isMobileSim ? 'py-1 px-2' : 'py-8 px-4'}`} id="survey-root">
      
      {/* Upper header section - elegant and compact for mobile */}
      <div className={`text-center ${isMobileSim ? 'mb-4' : 'mb-8'}`}>
        <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-[10px] font-black bg-gradient-to-r from-violet-100 to-orange-100 text-[#4C2D81] border border-orange-200 mb-2.5 animate-pulse font-sans">
          <FileSpreadsheet className="w-3.5 h-3.5 text-[#F15A22]" />
          <span>{t.qualityStandard}</span>
        </span>
        <h1 className={`font-sans font-black text-[#1E293B] tracking-tight leading-tight ${isMobileSim ? 'text-lg' : 'text-2xl sm:text-3xl'}`}>
          {t.surveyTitle}
        </h1>
        <p className="text-[11px] text-neutral-500 font-sans tracking-wide mt-1 font-semibold">
          {t.surveySubtitle}
        </p>
      </div>

      {step > 1 && (
        <div className={`max-w-xl mx-auto ${isMobileSim ? 'mb-5' : 'mb-8'}`}>
          {/* Progress Indicators with BU Theme colors (Violet & Orange) */}
          <div className="flex items-center justify-between">
            {(status === 'employed'
              ? [
                  { label: t.stepGeneral, val: 2 },
                  { label: t.stepEmployment, val: 3 },
                  { label: t.stepStatistics, val: 4 },
                  { label: t.stepReview, val: 6 }
                ]
              : [
                  { label: t.stepGeneral, val: 2 },
                  { label: t.stepEmployment, val: 3 },
                  { label: t.stepStatistics, val: 4 },
                  { label: t.stepSuggestions, val: 5 },
                  { label: t.stepReview, val: 6 }
                ]
            ).map((item, idx, arr) => (
              <React.Fragment key={idx}>
                <div className="flex flex-col items-center flex-1">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center font-black text-xs transition-all duration-300 ${
                    step > item.val 
                      ? 'bg-[#4C2D81] text-white shadow-sm' 
                      : step === item.val 
                      ? 'bg-gradient-to-br from-[#4C2D81] to-[#63299c] border-2 border-[#F15A22] text-white font-black scale-110 shadow-md ring-2 ring-violet-200' 
                      : 'bg-neutral-100 text-neutral-400 border border-neutral-200'
                  }`}>
                    {idx + 1}
                  </div>
                  <span className={`text-[9px] font-sans font-black mt-1 ${step === item.val ? 'text-[#4C2D81]' : 'text-neutral-400'}`}>
                    {item.label}
                  </span>
                </div>
                {idx < arr.length - 1 && (
                  <div className={`flex-1 h-0.5 transition-all duration-500 ${
                    step > item.val ? 'bg-gradient-to-r from-[#4C2D81] to-[#F15A22]' : 'bg-neutral-100'
                  }`}></div>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      )}

      {/* Main card box with Framer-motion */}
      <AnimatePresence mode="wait">
        
        {/* Step 1: ID CHECK SCREEN */}
        {step === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`bg-white rounded-[2rem] border border-neutral-100 max-w-lg mx-auto ${isMobileSim ? 'p-5 shadow-md' : 'p-6 sm:p-10 shadow-xl'}`}
          >
            <div className="flex flex-col items-center text-center">
              <div className="w-14 h-14 bg-violet-50 text-[#4C2D81] rounded-2xl flex items-center justify-center mb-4 shadow-sm">
                <Search className="w-7 h-7 text-[#F15A22]" />
              </div>
              <h2 className="font-sans font-black text-base text-neutral-800 mb-1">
                {t.enterStudentIdTitle}
              </h2>
              <p className="text-[11px] text-neutral-500 font-sans leading-relaxed mb-5 font-medium">
                {t.enterStudentIdDesc}
              </p>
            </div>

            <form onSubmit={handleVerifyId} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-neutral-600 uppercase tracking-widest mb-1.5 font-sans">
                  {language === 'th' ? 'รหัสประจำตัวนักศึกษา' : 'Student ID Number'}
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    maxLength={10}
                    placeholder={t.studentIdPlaceholder}
                    value={userInputId}
                    onChange={(e) => setUserInputId(e.target.value.replace(/[^0-9]/g, ''))}
                    className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-2xl text-sm font-semibold text-neutral-800 focus:outline-none focus:ring-2 focus:ring-[#4C2D81] focus:bg-white transition-all duration-200"
                  />
                  <div className="absolute right-4 top-3.5 flex items-center text-neutral-400">
                    <Lock className="w-4 h-4" />
                  </div>
                </div>
                {verificationError && (
                  <div className="mt-3 flex items-start space-x-1.5 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-[11px] font-sans">
                    <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                    <span>{verificationError}</span>
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={isVerifyingId}
                className="w-full flex items-center justify-center space-x-2 py-3.5 bg-gradient-to-r from-[#4C2D81] to-[#F15A22] text-white rounded-2xl font-black text-sm hover:opacity-90 transition-all duration-200 active:scale-98 shadow-md disabled:opacity-50 cursor-pointer"
              >
                {isVerifyingId ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>{t.verifyingId}</span>
                  </>
                ) : (
                  <>
                    <span>{t.identityCheckBtn}</span>
                    <ChevronRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* Structured Guidelines Instruction Block */}
            <div className="mt-6 pt-6 border-t border-neutral-100 font-sans">
              <div className="bg-[#4C2D81]/5 rounded-2xl p-4 sm:p-5 border border-[#4C2D81]/10">
                <h4 className="text-xs font-black text-[#4C2D81] mb-2.5 uppercase tracking-wide flex items-center space-x-1.5">
                  <span className="w-1.5 h-3 bg-[#4C2D81] rounded-full inline-block"></span>
                  <span>{t.instructionTitle}</span>
                </h4>
                <p className="text-[10px] sm:text-[11px] text-neutral-500 leading-relaxed font-normal whitespace-pre-line">
                  {t.instructionText}
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Step 2: GENERAL PROFILE FORM */}
        {step === 2 && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 15 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -15 }}
            className={`bg-white rounded-[2rem] shadow-xl border border-neutral-100 ${isMobileSim ? 'p-4 shadow-md' : 'p-6 sm:p-8'}`}
          >
            <div className="flex items-center space-x-3 mb-6 bg-violet-50/50 p-4 rounded-2xl border border-violet-100/50">
              <span className="text-[#4C2D81] font-sans font-black text-sm border-r border-violet-200 pr-3 uppercase">
                {language === 'th' ? 'ส่วนที่ 1' : 'Part 1'}
              </span>
              <span className="text-neutral-700 font-sans font-bold text-sm">
                {language === 'th' ? 'ข้อมูลทั่วไป' : 'General Information'}
              </span>
            </div>

            {matchedGraduate !== null && (
              <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-violet-50/60 border border-violet-150 text-neutral-700 text-xs font-sans shadow-2xs">
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 rounded-full bg-[#4C2D81] text-white flex items-center justify-center flex-shrink-0 mt-0.5 shadow-2xs">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-[#4C2D81] text-xs sm:text-sm font-sans">
                      {language === 'th' ? 'พบข้อมูลผู้สำเร็จการศึกษาในระบบ' : 'Graduate Record Found in Registry'}
                    </h4>
                    <p className="text-neutral-500 text-[11px] leading-relaxed mt-0.5">
                      {language === 'th' 
                        ? 'ข้อมูลด้านล่างดึงมาจากฐานข้อมูลมหาวิทยาลัยโดยอัตโนมัติ กรุณาตรวจสอบความถูกต้อง' 
                        : 'Information below is retrieved from the university database. Please verify accuracy.'}
                    </p>
                  </div>
                </div>

                {!isCustomEditMode ? (
                  <button
                    type="button"
                    onClick={() => {
                      setIsCustomEditMode(true);
                      setIsProfileConfirmed(false);
                    }}
                    className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs font-bold transition-all self-start sm:self-center cursor-pointer shadow-2xs active:scale-98"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-amber-700" />
                    <span>{language === 'th' ? 'ข้อมูลไม่ถูกต้อง? กดแก้ไข' : 'Edit Manually'}</span>
                  </button>
                ) : (
                  <span className="inline-flex items-center space-x-1 px-3 py-1 rounded-xl bg-amber-100 text-amber-900 text-xs font-bold self-start sm:self-center border border-amber-200">
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>{language === 'th' ? 'โหมดแก้ไขเปิดอยู่ (พิมพ์เองได้)' : 'Edit Mode Active'}</span>
                  </span>
                )}
              </div>
            )}

            {matchedGraduate === null && (
              <div className="mb-6 flex items-start space-x-2.5 p-4 rounded-2xl bg-amber-50/70 border border-amber-200 text-amber-900 text-xs font-sans">
                <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="font-extrabold text-amber-950 font-sans">
                    {language === 'th' ? 'ไม่พบข้อมูลรหัสนักศึกษาในระบบ' : 'Student Record Not Found'}
                  </h4>
                  <p className="text-amber-900 font-medium leading-relaxed font-sans">
                    {language === 'th' 
                      ? 'โปรดกรอกข้อมูลต่อไปนี้ด้วยตนเองเพื่อดำเนินการทำแบบสำรวจ:' 
                      : 'Please enter your profile details manually below to proceed with the survey:'}
                  </p>
                  <ul className="list-disc pl-4 space-y-0.5 font-bold text-amber-950 font-sans">
                    <li>{language === 'th' ? 'ชื่อ-นามสกุล' : 'First Name / Surname'}</li>
                    <li>{language === 'th' ? 'คณะที่จบการศึกษา' : 'School Faculty'}</li>
                    <li>{language === 'th' ? 'สาขาวิชา' : 'Studying Major Program'}</li>
                  </ul>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 gap-5">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-neutral-600 uppercase tracking-wider font-sans">
                    {language === 'th' ? 'รหัสประจำตัวนักศึกษา (Student ID)' : 'Student ID Code'}
                  </label>
                  {isCustomEditMode && (
                    <span className="text-[10px] text-amber-700 font-semibold">
                      {language === 'th' ? 'พิมพ์แก้ไขรหัสได้' : 'Editable ID'}
                    </span>
                  )}
                </div>
                <input
                  type="text"
                  maxLength={10}
                  disabled={matchedGraduate !== null && !isCustomEditMode}
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value.replace(/[^0-9]/g, ''))}
                  className={`w-full px-4 py-2.5 rounded-xl text-xs font-semibold text-neutral-800 focus:ring-2 focus:ring-indigo-500 transition-all ${
                    matchedGraduate !== null && !isCustomEditMode
                      ? 'bg-neutral-100/70 border border-neutral-200 opacity-75 cursor-not-allowed'
                      : 'bg-white border border-amber-300 focus:border-amber-500 shadow-2xs'
                  }`}
                />
              </div>

              {/* Degree Level Selection */}
              <div>
                <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-2 font-sans flex items-center justify-between">
                  <span className="flex items-center space-x-1.5">
                    <GraduationCap className="w-4 h-4 text-[#4C2D81]" />
                    <span>{language === 'th' ? 'ระดับการศึกษา' : 'Degree / Education Level'}</span>
                  </span>
                  <span className="text-[11px] font-bold text-[#4C2D81] bg-[#4C2D81]/10 px-2.5 py-0.5 rounded-full">
                    {degreeLevel}
                  </span>
                </label>
                <div className="grid grid-cols-3 gap-2 sm:gap-3">
                  {[
                    { value: 'ระดับปริญญาตรี', labelTh: 'ระดับปริญญาตรี', labelEn: "Bachelor's", descTh: 'ป.ตรี', icon: GraduationCap },
                    { value: 'ระดับปริญญาโท', labelTh: 'ระดับปริญญาโท', labelEn: "Master's", descTh: 'ป.โท', icon: BookOpen },
                    { value: 'ระดับปริญญาเอก', labelTh: 'ระดับปริญญาเอก', labelEn: "Doctoral", descTh: 'ป.เอก', icon: Award }
                  ].map((deg) => {
                    const isSelected = degreeLevel === deg.value;
                    const Icon = deg.icon;
                    return (
                      <button
                        key={deg.value}
                        type="button"
                        onClick={() => setDegreeLevel(deg.value)}
                        className={`flex flex-col items-center justify-center py-3 px-2 sm:px-3 rounded-2xl border-2 transition-all duration-200 cursor-pointer text-center ${
                          isSelected
                            ? 'border-[#4C2D81] bg-[#4C2D81]/5 text-[#4C2D81] font-extrabold shadow-xs ring-1 ring-[#4C2D81]'
                            : 'border-neutral-200 bg-neutral-50/70 hover:bg-white hover:border-neutral-300 text-neutral-600 font-medium'
                        }`}
                      >
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-1.5 transition-colors ${
                          isSelected ? 'bg-[#4C2D81] text-white shadow-xs' : 'bg-neutral-200/70 text-neutral-500'
                        }`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <span className="text-xs font-sans font-bold leading-tight line-clamp-1">
                          {language === 'th' ? deg.labelTh : deg.labelEn}
                        </span>
                        <span className={`text-[10px] font-sans mt-0.5 ${isSelected ? 'text-[#4C2D81]/80 font-bold' : 'text-neutral-400'}`}>
                          {deg.descTh}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-neutral-600 uppercase tracking-wider font-sans">
                      {language === 'th' ? 'ชื่อ (NAME)' : 'Name (NAME)'}
                    </label>
                    {isCustomEditMode && (
                      <span className="text-[10px] text-amber-700 font-semibold">
                        {language === 'th' ? 'พิมพ์แก้ไขได้' : 'Editable'}
                      </span>
                    )}
                  </div>
                  <input
                    type="text"
                    disabled={matchedGraduate !== null && !isCustomEditMode}
                    placeholder={language === 'th' ? "กรุณากรอกชื่อจริง" : "First Name"}
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className={`w-full px-4 py-2.5 rounded-xl text-xs font-semibold text-neutral-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all ${
                      formErrors.firstName 
                        ? 'border-red-400 bg-red-50/50' 
                        : matchedGraduate !== null && !isCustomEditMode
                          ? 'bg-neutral-100/70 border border-neutral-200 opacity-75 cursor-not-allowed'
                          : 'bg-white border border-amber-300 focus:border-amber-500 shadow-2xs'
                    }`}
                  />
                  {formErrors.firstName && <span className="text-[10px] text-red-500 font-sans">{formErrors.firstName}</span>}
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-neutral-600 uppercase tracking-wider font-sans">
                      {language === 'th' ? 'นามสกุล (SURNAME)' : 'Surname (SURNAME)'}
                    </label>
                    {isCustomEditMode && (
                      <span className="text-[10px] text-amber-700 font-semibold">
                        {language === 'th' ? 'พิมพ์แก้ไขได้' : 'Editable'}
                      </span>
                    )}
                  </div>
                  <input
                    type="text"
                    disabled={matchedGraduate !== null && !isCustomEditMode}
                    placeholder={language === 'th' ? "กรุณากรอกนามสกุล" : "Last Name / Surname"}
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className={`w-full px-4 py-2.5 rounded-xl text-xs font-semibold text-neutral-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all ${
                      formErrors.lastName 
                        ? 'border-red-400 bg-red-50/50' 
                        : matchedGraduate !== null && !isCustomEditMode
                          ? 'bg-neutral-100/70 border border-neutral-200 opacity-75 cursor-not-allowed'
                          : 'bg-white border border-amber-300 focus:border-amber-500 shadow-2xs'
                    }`}
                  />
                  {formErrors.lastName && <span className="text-[10px] text-red-500 font-sans">{formErrors.lastName}</span>}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-neutral-600 uppercase tracking-wider font-sans">
                      {language === 'th' ? 'คณะที่จบการศึกษา (Faculty)' : 'School of Faculty'}
                    </label>
                    {isCustomEditMode && (
                      <span className="text-[10px] text-amber-700 font-semibold">
                        {language === 'th' ? 'พิมพ์แก้ไขได้' : 'Editable'}
                      </span>
                    )}
                  </div>
                  <input
                    type="text"
                    list="faculties-datalist"
                    disabled={matchedGraduate !== null && !isCustomEditMode}
                    placeholder={language === 'th' ? "กรุณากรอกหรือเลือกคณะที่จบการศึกษา" : "E.g. Engineering"}
                    value={faculty}
                    onChange={(e) => setFaculty(e.target.value)}
                    className={`w-full px-4 py-2.5 rounded-xl text-xs font-semibold text-neutral-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all ${
                      formErrors.faculty 
                        ? 'border-red-400 bg-red-50/50' 
                        : matchedGraduate !== null && !isCustomEditMode
                          ? 'bg-neutral-100/70 border border-neutral-200 opacity-75 cursor-not-allowed'
                          : 'bg-white border border-amber-300 focus:border-amber-500 shadow-2xs'
                    }`}
                  />
                  <datalist id="faculties-datalist">
                    {FACULTIES.map((fac) => (
                      <option key={fac} value={fac} />
                    ))}
                  </datalist>
                  {formErrors.faculty && <span className="text-[10px] text-red-500 font-sans">{formErrors.faculty}</span>}
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-neutral-600 uppercase tracking-wider font-sans">
                      {language === 'th' ? 'สาขาวิชา (Major)' : 'Major Program'}
                    </label>
                    {isCustomEditMode && (
                      <span className="text-[10px] text-amber-700 font-semibold">
                        {language === 'th' ? 'พิมพ์แก้ไขได้' : 'Editable'}
                      </span>
                    )}
                  </div>
                  <input
                    type="text"
                    disabled={matchedGraduate !== null && !isCustomEditMode}
                    placeholder={language === 'th' ? "กรุณากรอกสาขาวิชา" : "E.g. Computer Science"}
                    value={major}
                    onChange={(e) => setMajor(e.target.value)}
                    className={`w-full px-4 py-2.5 rounded-xl text-xs font-semibold text-neutral-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all ${
                      formErrors.major 
                        ? 'border-red-400 bg-red-50/50' 
                        : matchedGraduate !== null && !isCustomEditMode
                          ? 'bg-neutral-100/70 border border-neutral-200 opacity-75 cursor-not-allowed'
                          : 'bg-white border border-amber-300 focus:border-amber-500 shadow-2xs'
                    }`}
                  />
                  {formErrors.major && <span className="text-[10px] text-red-500 font-sans">{formErrors.major}</span>}
                </div>
              </div>

              {/* Confirmation and Edit Control Box */}
              <div
                id="profile-confirmation-box"
                className={`mt-3 p-4 sm:p-5 rounded-2xl border-2 transition-all duration-200 ${
                  formErrors.profileConfirmation
                    ? 'bg-red-50/70 border-red-300 ring-4 ring-red-100'
                    : isProfileConfirmed
                      ? 'bg-emerald-50/70 border-emerald-300 ring-2 ring-emerald-100'
                      : 'bg-violet-50/50 border-violet-200'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <label className="flex items-start space-x-3 cursor-pointer select-none flex-1">
                    <input
                      type="checkbox"
                      id="confirm-profile-checkbox"
                      checked={isProfileConfirmed}
                      onChange={(e) => {
                        setIsProfileConfirmed(e.target.checked);
                        if (formErrors.profileConfirmation) {
                          setFormErrors(prev => {
                            const copy = { ...prev };
                            delete copy.profileConfirmation;
                            return copy;
                          });
                        }
                      }}
                      className="mt-1 w-5 h-5 rounded text-[#4C2D81] focus:ring-[#4C2D81] border-neutral-300 cursor-pointer accent-[#4C2D81]"
                    />
                    <div>
                      <div className="flex items-center space-x-2 flex-wrap gap-1">
                        <span className="text-xs sm:text-sm font-black text-neutral-800 font-sans">
                          {language === 'th' ? 'ข้าพเจ้ายืนยันว่าข้อมูลที่ปรากฏถูกต้อง' : 'I confirm that the displayed information is correct'}
                        </span>
                        {isProfileConfirmed && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                            <Check className="w-3 h-3 mr-0.5" />
                            {language === 'th' ? 'ยืนยันเรียบร้อย' : 'Confirmed'}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-neutral-500 mt-0.5 font-medium font-sans">
                        {isCustomEditMode 
                          ? (language === 'th' ? 'ตรวจสอบข้อมูลที่ท่านพิมพ์แก้ไขเอง แล้วกดทำเครื่องหมายยืนยันเพื่อดำเนินการต่อ' : 'Review your edited information and check the box to proceed')
                          : (language === 'th' ? 'ตรวจสอบชื่อ-นามสกุล, คณะ, สาขาวิชา และระดับการศึกษาให้ตรงกับความเป็นจริง' : 'Verify your name, faculty, major, and degree level match official records')}
                      </p>
                    </div>
                  </label>

                  {/* Edit or Reset Button */}
                  <div className="flex items-center space-x-2 self-start sm:self-center pl-8 sm:pl-0 flex-shrink-0">
                    {!isCustomEditMode ? (
                      <button
                        type="button"
                        id="btn-edit-profile-manual"
                        onClick={() => {
                          setIsCustomEditMode(true);
                          setIsProfileConfirmed(false);
                        }}
                        className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs font-bold transition-all shadow-2xs cursor-pointer active:scale-98"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-amber-700" />
                        <span>{language === 'th' ? 'ข้อมูลไม่ถูกต้อง? กดแก้ไขแล้วพิมพ์เอง' : 'Incorrect? Click to edit'}</span>
                      </button>
                    ) : (
                      <div className="flex items-center space-x-2">
                        <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-amber-100 text-amber-900 text-[11px] font-bold">
                          <Edit3 className="w-3 h-3" />
                          <span>{language === 'th' ? 'โหมดแก้ไข (พิมพ์เองได้)' : 'Edit Mode'}</span>
                        </span>
                        {matchedGraduate && (
                          <button
                            type="button"
                            id="btn-restore-profile-original"
                            onClick={() => {
                              const names = (matchedGraduate.fullName || '').trim().split(/\s+/);
                              setFirstName(names[0] || '');
                              setLastName(names.slice(1).join(' ') || '');
                              setFaculty(matchedGraduate.faculty || '');
                              setMajor(matchedGraduate.major || '');
                              if (matchedGraduate.degreeLevel) {
                                setDegreeLevel(matchedGraduate.degreeLevel);
                              }
                              setIsCustomEditMode(false);
                              setIsProfileConfirmed(false);
                            }}
                            className="inline-flex items-center space-x-1 text-[11px] font-semibold text-neutral-500 hover:text-neutral-800 hover:underline cursor-pointer"
                          >
                            <RotateCcw className="w-3 h-3" />
                            <span>{language === 'th' ? 'คืนค่าเดิมจากระบบ' : 'Reset original'}</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {formErrors.profileConfirmation && (
                  <div className="mt-3 flex items-center space-x-1.5 text-xs text-red-600 font-bold bg-white/90 p-2.5 rounded-xl border border-red-200">
                    <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-600" />
                    <span>{formErrors.profileConfirmation}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-between mt-8 pt-5 border-t border-neutral-100">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="flex items-center space-x-1 px-4 py-2.5 rounded-xl border border-neutral-200 text-neutral-500 text-xs font-semibold hover:bg-neutral-50 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>{t.prevBtn}</span>
              </button>
              <button
                type="button"
                onClick={handleNextStep}
                className="flex items-center space-x-1 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#4C2D81] to-[#F15A22] text-white text-xs font-bold hover:opacity-95 transition-all duration-200 shadow-sm cursor-pointer"
              >
                <span>{t.nextBtn}</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}

        {/* Step 3: CHOOSE EMPLOYMENT STATUS */}
        {step === 3 && (
          <motion.div
            key="step3"
            initial={{ opacity: 0, x: 15 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -15 }}
            className="bg-white rounded-[2rem] p-6 sm:p-8 shadow-xl border border-neutral-100"
          >
            <div className="flex items-center space-x-3 mb-6 bg-indigo-50/50 p-4 rounded-2xl">
              <span className="text-indigo-600 font-sans font-black text-sm border-r border-indigo-200 pr-3 uppercase">
                {language === 'th' ? 'ส่วนที่ 2' : 'Part 2'}
              </span>
              <span className="text-neutral-700 font-sans font-bold text-sm">
                {t.statusChooseTitle}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              
              {/* Option: Employed */}
              <div 
                onClick={() => setStatus('employed')}
                className={`cursor-pointer group flex flex-col p-6 rounded-2xl border-2 transition-all duration-300 ${
                  status === 'employed' 
                    ? 'border-[#4C2D81] bg-violet-50/25 ring-1 ring-[#4C2D81] shadow-md' 
                    : 'border-neutral-200 bg-white hover:border-neutral-300'
                }`}
              >
                <div className={`w-8 h-8 rounded-full mb-3 flex items-center justify-center font-bold text-xs ${
                  status === 'employed' ? 'bg-[#4C2D81] text-white' : 'bg-neutral-100 text-neutral-500'
                }`}>
                  ✓
                </div>
                <h3 className="font-sans font-extrabold text-sm text-neutral-800 mb-1">
                  {t.statusEmployed}
                </h3>
                <p className="font-sans text-[11px] text-neutral-400 leading-relaxed">
                  {t.statusEmployedDesc}
                </p>
              </div>

              {/* Option: Unemployed */}
              <div 
                onClick={() => setStatus('unemployed')}
                className={`cursor-pointer group flex flex-col p-6 rounded-2xl border-2 transition-all duration-300 ${
                  status === 'unemployed' 
                    ? 'border-[#4C2D81] bg-violet-50/25 ring-1 ring-[#4C2D81] shadow-md' 
                    : 'border-neutral-200 bg-white hover:border-neutral-300'
                }`}
              >
                <div className={`w-8 h-8 rounded-full mb-3 flex items-center justify-center font-bold text-xs ${
                  status === 'unemployed' ? 'bg-[#4C2D81] text-white' : 'bg-neutral-100 text-neutral-500'
                }`}>
                  ✓
                </div>
                <h3 className="font-sans font-extrabold text-sm text-neutral-800 mb-1">
                  {t.statusUnemployed}
                </h3>
                <p className="font-sans text-[11px] text-neutral-400 leading-relaxed">
                  {t.statusUnemployedDesc}
                </p>
              </div>

              {/* Option: Not seeking */}
              <div 
                onClick={() => setStatus('not_seeking')}
                className={`cursor-pointer group flex flex-col p-6 rounded-2xl border-2 transition-all duration-300 ${
                  status === 'not_seeking' 
                    ? 'border-[#4C2D81] bg-violet-50/25 ring-1 ring-[#4C2D81] shadow-md' 
                    : 'border-neutral-200 bg-white hover:border-neutral-300'
                }`}
              >
                <div className={`w-8 h-8 rounded-full mb-3 flex items-center justify-center font-bold text-xs ${
                  status === 'not_seeking' ? 'bg-[#4C2D81] text-white' : 'bg-neutral-100 text-neutral-500'
                }`}>
                  ✓
                </div>
                <h3 className="font-sans font-extrabold text-sm text-neutral-800 mb-1">
                  {t.statusNotSeeking}
                </h3>
                <p className="font-sans text-[11px] text-neutral-400 leading-relaxed">
                  {t.statusNotSeekingDesc}
                </p>
              </div>

            </div>

            <div className="flex justify-between mt-8 pt-5 border-t border-neutral-100">
              <button
                type="button"
                onClick={handlePrevStep}
                className="flex items-center space-x-1 px-4 py-2.5 rounded-xl border border-neutral-200 text-neutral-500 text-xs font-semibold hover:bg-neutral-50 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>{t.prevBtn}</span>
              </button>
              <button
                type="button"
                onClick={handleNextStep}
                className="flex items-center space-x-1 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#4C2D81] to-[#F15A22] text-white text-xs font-bold hover:opacity-95 transition-all duration-200 shadow-sm cursor-pointer"
              >
                <span>{t.nextBtn}</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}

        {/* Step 4: DETAILED SURVEY QUESTIONS */}
        {step === 4 && (
          <motion.div
            key="step4"
            initial={{ opacity: 0, x: 15 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -15 }}
            className="bg-white rounded-[2rem] p-6 sm:p-8 shadow-xl border border-neutral-100"
          >
            <div className="flex items-center space-x-3 mb-6 bg-indigo-50/50 p-4 rounded-2xl">
              <span className="text-indigo-600 font-sans font-black text-sm border-r border-[#4C2D81]/10 pr-3 uppercase">
                {language === 'th' ? 'ส่วนที่ 3' : 'Part 3'}
              </span>
              <span className="text-neutral-700 font-sans font-bold text-sm">
                {language === 'th' ? (
                  status === 'employed' ? 'สำหรับผู้มีงานทำแล้ว' : 'สำหรับผู้ยังไม่มีงานทำ'
                ) : (
                  status === 'employed' ? 'Current employment status' : 'Current unemployment status'
                )}
              </span>
            </div>

            {/* A. EMBEDDED FORM FOR EMPLOYED STATUS */}
            {status === 'employed' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-bold text-neutral-600 uppercase tracking-wider mb-1 font-sans">
                      {language === 'th' ? '1. ประเภทงานที่ทำ' : '1. Job Category / Type of Work'}
                    </label>
                    <select
                      value={employedDetails.workType}
                      onChange={(e) => setEmployedDetails({ ...employedDetails, workType: e.target.value })}
                      className="w-full px-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-semibold text-neutral-800 focus:outline-none"
                    >
                      {WORK_TYPES.map(wt => <option key={wt.value} value={wt.value}>{t.professionsList[wt.value] || wt.label}</option>)}
                    </select>
                  </div>

                  {['6', '7', '8'].includes(employedDetails.workType) && (
                    <div>
                      <label className="block text-xs font-bold text-neutral-600 uppercase tracking-wider mb-1 font-sans">
                        {['6', '7'].includes(employedDetails.workType) ? (
                          language === 'th' 
                            ? 'ลักษณะงานของเจ้าของกิจการ (โปรดระบุสินค้าที่ขาย หรือธุรกิจที่ทำ เช่น เสื้อผ้า เบเกอรี่ เครื่องสำอาง ฯลฯ) *' 
                            : 'Business nature of ownership (Please specify products sold or business type, e.g., clothing, bakery, cosmetics, etc.) *'
                        ) : (
                          language === 'th' ? 'โปรดระบุลักษณะงานเพิ่มเติม/ระบุอื่น ๆ *' : 'Please specify / Describe work details *'
                        )}
                      </label>
                      <input
                        type="text"
                        placeholder={language === 'th' ? "เช่น เบเกอรี่, เสื้อผ้าแฟชั่น, เครื่องสำอาง" : "E.g. bakery, clothing, cosmetics"}
                        value={employedDetails.workTypeOther}
                        onChange={(e) => setEmployedDetails({ ...employedDetails, workTypeOther: e.target.value })}
                        className={`w-full px-4 py-2.5 bg-neutral-50 border ${formErrors.workTypeOther ? 'border-red-400' : 'border-neutral-200'} rounded-xl text-xs font-semibold text-neutral-800 focus:outline-none`}
                      />
                      {formErrors.workTypeOther && (
                        <span className="text-[10px] text-red-500 font-sans mt-0.5 block">{formErrors.workTypeOther}</span>
                      )}
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-bold text-neutral-600 uppercase tracking-wider mb-1 font-sans">
                      {language === 'th' ? '2. ชื่อตำแหน่งงานของท่าน' : '2. Your Job Title'}
                    </label>
                    <input
                      type="text"
                      placeholder={language === 'th' ? "เช่น Senior Web Programmer" : "E.g. Software Engineer"}
                      value={employedDetails.jobTitle}
                      onChange={(e) => setEmployedDetails({ ...employedDetails, jobTitle: e.target.value })}
                      className={`w-full px-4 py-2.5 bg-neutral-50 border ${formErrors.jobTitle ? 'border-red-400' : 'border-neutral-200'} rounded-xl text-xs font-semibold text-neutral-800 focus:outline-none`}
                    />
                    {formErrors.jobTitle && <span className="text-[10px] text-red-500 font-sans">{formErrors.jobTitle}</span>}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-neutral-600 uppercase tracking-wider mb-1 font-sans">
                      {language === 'th' ? '3. ชื่อองค์กร/บริษัทที่ท่านทำงาน' : '3. Organization / Company Name'}
                    </label>
                    <input
                      type="text"
                      placeholder={language === 'th' ? "เช่น บริษัท บางกอก กรุ๊ป จำกัด" : "E.g. Bangkok Technology Co., Ltd."}
                      value={employedDetails.companyName}
                      onChange={(e) => setEmployedDetails({ ...employedDetails, companyName: e.target.value })}
                      className={`w-full px-4 py-2.5 bg-neutral-50 border ${formErrors.companyName ? 'border-red-400' : 'border-neutral-200'} rounded-xl text-xs font-semibold text-neutral-800 focus:outline-none`}
                    />
                    {formErrors.companyName && <span className="text-[10px] text-red-500 font-sans">{formErrors.companyName}</span>}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-neutral-600 uppercase tracking-wider mb-1 font-sans">
                      {language === 'th' ? '4. ฝ่าย/แผนกที่ทำงาน' : '4. Department / Division'}
                    </label>
                    <input
                      type="text"
                      placeholder={language === 'th' ? "เช่น แผนกเทคโนโลยีสารสนเทศ" : "E.g. Information Technology Dept."}
                      value={employedDetails.companyDept}
                      onChange={(e) => setEmployedDetails({ ...employedDetails, companyDept: e.target.value })}
                      className="w-full px-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-semibold text-neutral-800"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-neutral-600 uppercase tracking-wider mb-1 font-sans">
                      {language === 'th' ? '5. เงินเดือนหรือรายได้เฉลี่ยต่อเดือน (บาท)' : '5. Monthly Salary / Average Income (THB)'}
                    </label>
                    <input
                      type="number"
                      value={employedDetails.salary}
                      onChange={(e) => setEmployedDetails({ ...employedDetails, salary: parseInt(e.target.value) || 0 })}
                      className={`w-full px-4 py-2.5 bg-neutral-50 border ${formErrors.salary ? 'border-red-400' : 'border-neutral-200'} rounded-xl text-xs font-semibold text-neutral-800 focus:outline-none`}
                    />
                    {formErrors.salary && <span className="text-[10px] text-red-500 font-sans">{formErrors.salary}</span>}
                  </div>
                </div>

                {/* Company Address Block */}
                <div className="bg-neutral-50 p-5 rounded-2xl border border-neutral-100">
                  <h4 className="text-xs font-bold text-indigo-700 uppercase tracking-wider mb-3 font-sans">
                    {language === 'th' ? 'สถานที่ตั้งที่ทำงานปัจจุบัน' : 'Current Office / Workspace Address'}
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
                    <div>
                      <label className="block text-[10px] font-bold text-neutral-400 mb-0.5">{language === 'th' ? 'เลขที่' : 'No.'}</label>
                      <input
                        type="text"
                        value={employedDetails.companyAddress.no}
                        onChange={(e) => setEmployedDetails({
                          ...employedDetails,
                          companyAddress: { ...employedDetails.companyAddress, no: e.target.value }
                        })}
                        className="w-full px-3 py-1.5 border border-neutral-200 bg-white rounded-lg text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-neutral-400 mb-0.5">{language === 'th' ? 'หมู่ที่' : 'Moo'}</label>
                      <input
                        type="text"
                        value={employedDetails.companyAddress.moo}
                        onChange={(e) => setEmployedDetails({
                          ...employedDetails,
                          companyAddress: { ...employedDetails.companyAddress, moo: e.target.value }
                        })}
                        className="w-full px-3 py-1.5 border border-neutral-200 bg-white rounded-lg text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-neutral-400 mb-0.5">{language === 'th' ? 'อาคาร/ตึก' : 'Building'}</label>
                      <input
                        type="text"
                        value={employedDetails.companyAddress.building}
                        onChange={(e) => setEmployedDetails({
                          ...employedDetails,
                          companyAddress: { ...employedDetails.companyAddress, building: e.target.value }
                        })}
                        className="w-full px-3 py-1.5 border border-neutral-200 bg-white rounded-lg text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-neutral-400 mb-0.5">{language === 'th' ? 'ชั้น' : 'Floor'}</label>
                      <input
                        type="text"
                        value={employedDetails.companyAddress.floor}
                        onChange={(e) => setEmployedDetails({
                          ...employedDetails,
                          companyAddress: { ...employedDetails.companyAddress, floor: e.target.value }
                        })}
                        className="w-full px-3 py-1.5 border border-neutral-200 bg-white rounded-lg text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-neutral-400 mb-0.5">{language === 'th' ? 'ตรอก/ซอย' : 'Soi / Alley'}</label>
                      <input
                        type="text"
                        value={employedDetails.companyAddress.soi}
                        onChange={(e) => setEmployedDetails({
                          ...employedDetails,
                          companyAddress: { ...employedDetails.companyAddress, soi: e.target.value }
                        })}
                        className="w-full px-3 py-1.5 border border-neutral-200 bg-white rounded-lg text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-neutral-400 mb-0.5">{language === 'th' ? 'ถนน' : 'Road'}</label>
                      <input
                        type="text"
                        value={employedDetails.companyAddress.road}
                        onChange={(e) => setEmployedDetails({
                          ...employedDetails,
                          companyAddress: { ...employedDetails.companyAddress, road: e.target.value }
                        })}
                        className="w-full px-3 py-1.5 border border-neutral-200 bg-white rounded-lg text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-neutral-400 mb-0.5">{language === 'th' ? 'ตำบล/แขวง *' : 'Subdistrict *'}</label>
                      <input
                        type="text"
                        value={employedDetails.companyAddress.subdistrict}
                        onChange={(e) => setEmployedDetails({
                          ...employedDetails,
                          companyAddress: { ...employedDetails.companyAddress, subdistrict: e.target.value }
                        })}
                        className={`w-full px-3 py-1.5 border ${formErrors.subdistrict ? 'border-red-400' : 'border-neutral-200'} bg-white rounded-lg text-xs`}
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-neutral-400 mb-0.5">{language === 'th' ? 'อำเภอ/เขต *' : 'District *'}</label>
                      <input
                        type="text"
                        value={employedDetails.companyAddress.district}
                        onChange={(e) => setEmployedDetails({
                          ...employedDetails,
                          companyAddress: { ...employedDetails.companyAddress, district: e.target.value }
                        })}
                        className={`w-full px-3 py-1.5 border ${formErrors.district ? 'border-red-400' : 'border-neutral-200'} bg-white rounded-lg text-xs`}
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-[10px] font-bold text-neutral-400 mb-0.5">{language === 'th' ? 'จังหวัด *' : 'Province *'}</label>
                      <input
                        type="text"
                        value={employedDetails.companyAddress.province}
                        onChange={(e) => setEmployedDetails({
                          ...employedDetails,
                          companyAddress: { ...employedDetails.companyAddress, province: e.target.value }
                        })}
                        className="w-full px-3 py-1.5 border border-neutral-200 bg-white rounded-lg text-xs"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-[10px] font-bold text-neutral-400 mb-0.5">{language === 'th' ? 'รหัสไปรษณีย์ *' : 'Zipcode *'}</label>
                      <input
                        type="text"
                        value={employedDetails.companyAddress.zipcode}
                        onChange={(e) => setEmployedDetails({
                          ...employedDetails,
                          companyAddress: { ...employedDetails.companyAddress, zipcode: e.target.value }
                        })}
                        className={`w-full px-3 py-1.5 border ${formErrors.zipcode ? 'border-red-400' : 'border-neutral-200'} bg-white rounded-lg text-xs`}
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-3">
                  {/* Other compensation */}
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-neutral-600 uppercase tracking-wider mb-1 font-sans">
                      {language === 'th' ? 'มีรายได้เสริม/ตอบแทนอื่น ๆ อีกหรือไม่' : 'Do you have additional income / benefits?'}
                    </label>
                    <div className="flex space-x-4">
                      <label className="inline-flex items-center text-xs">
                        <input
                          type="radio"
                          checked={employedDetails.hasOtherIncome === true}
                          onChange={() => setEmployedDetails({ ...employedDetails, hasOtherIncome: true })}
                          className="mr-2 outline-none accent-indigo-600"
                        />
                        {language === 'th' ? 'มีรายได้อื่น ๆ' : 'Yes (additional income)'}
                      </label>
                      <label className="inline-flex items-center text-xs">
                        <input
                          type="radio"
                          checked={employedDetails.hasOtherIncome === false}
                          onChange={() => setEmployedDetails({ ...employedDetails, hasOtherIncome: false, otherIncomeDetails: '', otherIncomeAmount: 0 })}
                          className="mr-2 outline-none accent-indigo-600"
                        />
                        {language === 'th' ? 'ไม่มี' : 'No, none'}
                      </label>
                    </div>
                  </div>

                  {employedDetails.hasOtherIncome && (
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] font-bold text-neutral-400">
                          {language === 'th' ? 'ระบุรายได้อื่น ๆ (เช่นค่าน้ำมัน)' : 'Specify income type (E.g. bonus)'}
                        </label>
                        <input
                          type="text"
                          value={employedDetails.otherIncomeDetails}
                          onChange={(e) => setEmployedDetails({ ...employedDetails, otherIncomeDetails: e.target.value })}
                          className="w-full px-3 py-1.5 border border-neutral-200 bg-neutral-50 rounded-xl text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-neutral-400">
                          {language === 'th' ? 'ระบุจำนวนเงิน (บาท)' : 'Amount (THB)'}
                        </label>
                        <input
                          type="number"
                          value={employedDetails.otherIncomeAmount}
                          onChange={(e) => setEmployedDetails({ ...employedDetails, otherIncomeAmount: parseInt(e.target.value) || 0 })}
                          className="w-full px-3 py-1.5 border border-neutral-200 bg-neutral-50 rounded-xl text-xs"
                        />
                      </div>
                    </div>
                  )}

                  {/* Related to Major */}
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-neutral-600 uppercase tracking-wider mb-1 font-sans">
                      {language === 'th' ? 'ลักษณะงานตรงกับสาขาวิชาที่สำเร็จการศึกษาหรือไม่' : 'Is your current career related to your study major?'}
                    </label>
                    <div className="flex space-x-4">
                      <label className="inline-flex items-center text-xs">
                        <input
                          type="radio"
                          checked={employedDetails.isRelatedToStudy === true}
                          onChange={() => setEmployedDetails({ ...employedDetails, isRelatedToStudy: true, unrelatedReason: '' })}
                          className="mr-2 accent-indigo-600"
                        />
                        {language === 'th' ? '1. ตรงหรือสอดคล้อง' : '1. Yes, directly related'}
                      </label>
                      <label className="inline-flex items-center text-xs">
                        <input
                          type="radio"
                          checked={employedDetails.isRelatedToStudy === false}
                          onChange={() => setEmployedDetails({ ...employedDetails, isRelatedToStudy: false })}
                          className="mr-2 accent-indigo-600"
                        />
                        {language === 'th' ? '2. ไม่ตรง' : '2. No, unrelated'}
                      </label>
                    </div>
                  </div>

                  {!employedDetails.isRelatedToStudy && (
                    <div>
                      <label className="block text-[10px] font-bold text-neutral-400">
                        {language === 'th' ? 'ระบุเหตุผลที่ไม่ตรงกับสาขาที่เรียน' : 'Specify reasons why unrelated'}
                      </label>
                      <input
                        type="text"
                        placeholder={language === 'th' ? "เช่น อยากลองทำงานสายอื่น/หางานตรงสายไม่ได้" : "E.g. trying creative areas, no positions matching"}
                        value={employedDetails.unrelatedReason}
                        onChange={(e) => setEmployedDetails({ ...employedDetails, unrelatedReason: e.target.value })}
                        className="w-full px-3 py-1.5 border border-neutral-200 bg-neutral-50 rounded-xl text-xs"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-bold text-neutral-600 uppercase tracking-wider mb-1 font-sans">
                      {language === 'th' ? 'หลังสำเร็จการศึกษา ท่านใช้เวลาหางานทำนานเท่าไหร่?' : 'Time spent in job seeking after graduation'}
                    </label>
                    <select
                      value={employedDetails.timeToGetJob}
                      onChange={(e) => setEmployedDetails({ ...employedDetails, timeToGetJob: e.target.value })}
                      className="w-full px-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-semibold text-neutral-800"
                    >
                      {GET_JOB_TIMELINE.map(tl => <option key={tl.value} value={tl.value}>{t.getJobTimelineList[tl.value] || tl.label}</option>)}
                    </select>
                  </div>
                </div>

                {/* Entrepreneur self-evaluation questions if workType is '6' */}
                {employedDetails.workType === '6' && (
                  <div className="mt-8 pt-6 border-t border-neutral-150 space-y-6">
                    <div className="bg-indigo-50/50 p-4 sm:p-5 rounded-2xl border border-indigo-100/50">
                      <h3 className="font-sans font-black text-sm text-[#4C2D81]">
                        {language === 'th' ? 'โปรดประเมินตนเองในฐานะผู้ประกอบการ' : 'Please evaluate yourself as an entrepreneur'}
                      </h3>
                      <p className="font-sans text-[11px] text-neutral-500 mt-1 leading-relaxed">
                        {language === 'th' 
                          ? '* กรุณาตอบแบบสอบถามให้ครบทั้ง 10 ข้อ (1 = น้อยที่สุด, 10 = มากที่สุด)' 
                          : '* Please complete all 10 questions (1 = Lowest, 10 = Highest)'}
                      </p>
                    </div>

                    <div className="space-y-5">
                      {ENTREPRENEUR_QUESTIONS.map((q) => {
                        const currentVal = employedDetails.entrepreneurRatings?.[String(q.id)] || 0;
                        const errorMsg = formErrors[`entrepreneur_${q.id}`];

                        return (
                          <div 
                            key={q.id} 
                            className={`p-5 rounded-2xl border transition-all duration-200 ${
                              errorMsg 
                                ? 'border-red-200 bg-red-50/30' 
                                : currentVal > 0 
                                ? 'border-indigo-100 bg-indigo-50/10' 
                                : 'border-neutral-100 bg-neutral-50/20'
                            }`}
                          >
                            <div className="mb-4">
                              <span className="font-sans font-black text-xs text-indigo-900 mr-1.5 bg-indigo-50 px-2.5 py-0.5 rounded-lg border border-indigo-100">
                                {q.id}
                              </span>
                              <span className="font-sans font-bold text-xs text-neutral-700 leading-relaxed inline">
                                {language === 'th' ? q.th : q.en}
                              </span>
                            </div>

                            {/* Radio Scale 1-10 */}
                            <div className="max-w-xl">
                              <div className="flex items-center justify-between px-2 text-[10px] font-bold text-neutral-400 font-sans mb-1.5">
                                <span>{language === 'th' ? 'น้อยที่สุด (1)' : 'Lowest (1)'}</span>
                                <span>{language === 'th' ? 'มากที่สุด (10)' : 'Highest (10)'}</span>
                              </div>
                              <div className="grid grid-cols-5 sm:grid-cols-10 bg-white rounded-xl p-2 border border-neutral-150 shadow-sm gap-1.5">
                                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((val) => (
                                  <button
                                    type="button"
                                    key={val}
                                    onClick={() => {
                                      const updatedRatings = {
                                        ...(employedDetails.entrepreneurRatings || {}),
                                        [String(q.id)]: val
                                      };
                                      setEmployedDetails({
                                        ...employedDetails,
                                        entrepreneurRatings: updatedRatings
                                      });
                                      // Clear error if there was any
                                      if (formErrors[`entrepreneur_${q.id}`]) {
                                        const updatedErrors = { ...formErrors };
                                        delete updatedErrors[`entrepreneur_${q.id}`];
                                        setFormErrors(updatedErrors);
                                      }
                                    }}
                                    className={`flex flex-col items-center justify-center py-2 rounded-lg transition-all duration-200 border cursor-pointer ${
                                      currentVal === val
                                        ? 'bg-[#4C2D81] border-[#4C2D81] text-white font-black shadow-md scale-105'
                                        : 'bg-neutral-50 hover:bg-neutral-100 border-neutral-200 text-neutral-600 hover:text-neutral-900'
                                    }`}
                                  >
                                    <span className="text-xs">{val}</span>
                                  </button>
                                ))}
                              </div>
                            </div>
                            {errorMsg && (
                              <p className="text-[10px] text-red-500 font-sans mt-2 flex items-center gap-1">
                                <AlertCircle className="w-3.5 h-3.5 text-red-500 shrink-0" />
                                {errorMsg}
                              </p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* B. EMBEDDED FORM FOR UNEMPLOYED STATUS */}
            {status === 'unemployed' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-neutral-600 uppercase tracking-wider mb-1.5 font-sans">
                    {language === 'th' ? 'สาเหตุที่ยังไม่มีงานทำ (เลือกสาเหตุเพียง 1 ข้อ)' : 'Reason for unemployment (Select only 1 option)'}
                  </label>
                  <div className="space-y-2">
                    {UNEMPLOYED_REASONS.map(ur => (
                      <label key={ur.value} className="flex items-center p-3 rounded-xl border border-neutral-100 hover:bg-neutral-50 transition-all duration-200 cursor-pointer text-xs">
                        <input
                          type="radio"
                          name="unemployedReason"
                          checked={unemployedDetails.reason === ur.value}
                          onChange={() => setUnemployedDetails({ ...unemployedDetails, reason: ur.value })}
                          className="mr-3 accent-indigo-600 outline-none"
                        />
                        <span>{t.unemployedReasonsList[ur.value] || ur.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {unemployedDetails.reason === '5' && (
                  <div>
                    <label className="block text-xs font-bold text-neutral-500 mb-1">
                      {language === 'th' ? 'ระบุสาเหตุอื่นที่ยังไม่มีงานทำ' : 'Specify other reasons'}
                    </label>
                    <input
                      type="text"
                      placeholder={language === 'th' ? "ระบุสาเหตุเพิ่มเติม..." : "Please specify details..."}
                      value={unemployedDetails.reasonOther}
                      onChange={(e) => setUnemployedDetails({ ...unemployedDetails, reasonOther: e.target.value })}
                      className="w-full px-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs"
                    />
                  </div>
                )}
              </div>
            )}

            {/* C. EMBEDDED FORM FOR NOT SEEKING WORK STATUS */}
            {status === 'not_seeking' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-neutral-600 uppercase tracking-wider mb-1.5 font-sans">
                    {language === 'th' ? 'สาเหตุหรือรายละเอียดสำหรับเหตุผลอื่นๆ (เลือกเพียง 1 ข้อ)' : 'Details or reasons for other choices (Choose one)'}
                  </label>
                  <div className="space-y-2">
                    {NOT_SEEKING_REASONS.map(ns => (
                      <label key={ns.value} className="flex items-center p-3 rounded-xl border border-neutral-100 hover:bg-neutral-50 transition-all duration-200 cursor-pointer text-xs">
                        <input
                          type="radio"
                          name="notSeekingReason"
                          checked={notSeekingDetails.reason === ns.value}
                          onChange={() => setNotSeekingDetails({ ...notSeekingDetails, reason: ns.value })}
                          className="mr-3 accent-[#4C2D81] outline-none"
                        />
                        <span>{t.notSeekingReasonsList[ns.value] || ns.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {notSeekingDetails.reason === '9' && (
                  <div>
                    <label className="block text-xs font-bold text-neutral-500 mb-1">
                      {language === 'th' ? 'ระบุสาเหตุเพิ่มเติมอื่น ๆ' : 'Specify other reasons'}
                    </label>
                    <input
                      type="text"
                      placeholder={language === 'th' ? "ระบุสาเหตุเพิ่มเติม..." : "Please specify details..."}
                      value={notSeekingDetails.reasonOther}
                      onChange={(e) => setNotSeekingDetails({ ...notSeekingDetails, reasonOther: e.target.value })}
                      className="w-full px-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs"
                    />
                  </div>
                )}
              </div>
            )}

            {/* D. DYNAMIC CUSTOM QUESTIONS SETUP BY ADMIN */}
            {customQuestions.length > 0 && (
              <div className="mt-8 pt-6 border-t border-neutral-100 space-y-5">
                <h4 className="text-xs font-bold text-neutral-700 uppercase tracking-widest font-sans flex items-center space-x-1.5 bg-violet-50 text-violet-700 w-fit px-3 py-1 rounded-full">
                  <span>{language === 'th' ? 'ข้อมูลคำถามเพิ่มเติมพิเศษโดยผู้ดูแลระบบ' : 'Additional Survey Questions from Administrator'}</span>
                </h4>
                
                {customQuestions.map((q) => (
                  <div key={q.id} className="space-y-2">
                    <label className="block text-xs font-semibold text-neutral-700 font-sans">
                      {q.title} {q.required && <span className="text-red-500">*</span>}
                    </label>
                    
                    {q.type === 'text' ? (
                      <input
                        type="text"
                        placeholder={language === 'th' ? "กรุณากรอกคำตอบรายละเอียด..." : "Please fill in answer..."}
                        value={customAnswers[q.id] || ''}
                        onChange={(e) => setCustomAnswers({ ...customAnswers, [q.id]: e.target.value })}
                        className={`w-full px-4 py-2.5 border ${formErrors[`custom_${q.id}`] ? 'border-red-400' : 'border-neutral-200'} bg-neutral-50 text-xs rounded-xl focus:outline-none`}
                      />
                    ) : (
                      <select
                        value={customAnswers[q.id] || ''}
                        onChange={(e) => setCustomAnswers({ ...customAnswers, [q.id]: e.target.value })}
                        className={`w-full px-4 py-2.5 border ${formErrors[`custom_${q.id}`] ? 'border-red-400' : 'border-neutral-200'} bg-neutral-50 text-xs rounded-xl focus:outline-none`}
                      >
                        <option value="">{language === 'th' ? '-- เลือกคำตอบ --' : '-- Select Answer --'}</option>
                        {q.options?.map((opt, oIdx) => (
                          <option key={oIdx} value={opt}>{opt}</option>
                        ))}
                      </select>
                    )}
                    {formErrors[`custom_${q.id}`] && <p className="text-[10px] text-red-500 font-sans">{formErrors[`custom_${q.id}`]}</p>}
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-between mt-8 pt-5 border-t border-neutral-100">
              <button
                type="button"
                onClick={handlePrevStep}
                className="flex items-center space-x-1 px-4 py-2.5 rounded-xl border border-neutral-200 text-neutral-500 text-xs font-semibold hover:bg-neutral-50 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>{t.prevBtn}</span>
              </button>
              <button
                type="button"
                onClick={handleNextStep}
                className="flex items-center space-x-1 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#4C2D81] to-[#F15A22] text-white text-xs font-bold hover:opacity-95 transition-all duration-200 shadow-sm cursor-pointer"
              >
                <span>{t.nextBtn}</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}

        {/* Step 5: SUGGESTIONS & FEEDBACK (Part 4) */}
        {step === 5 && (
          <motion.div
            key="step5"
            initial={{ opacity: 0, x: 15 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -15 }}
            className="bg-white rounded-[2rem] p-6 sm:p-8 shadow-xl border border-neutral-100"
          >
            <div className="flex items-center space-x-3 mb-6 bg-[#4C2D81]/5 p-4 rounded-2xl border border-[#4C2D81]/10">
              <span className="text-[#4C2D81] font-sans font-black text-sm border-r border-[#4C2D81]/15 pr-3 uppercase">
                {language === 'th' ? 'ส่วนที่ 4' : 'Part 4'}
              </span>
              <span className="text-neutral-700 font-sans font-bold text-sm">
                {language === 'th' ? 'ข้อเสนอแนะเพื่อการพัฒนามหาวิทยาลัยกรุงเทพ' : 'Is there anything you would like to share about your satisfaction, opinions, and suggestions regarding the quality of the program/curriculum?'}
              </span>
            </div>

            <p className="text-xs text-neutral-500 mb-6 font-sans">
              * {language === 'th' ? 'โปรดตอบให้ครบทั้ง 3 ข้อเพื่อช่วยในการปรับปรุงและพัฒนาหลักสูตร' : 'Please answer all 3 questions to help improve and develop our curriculum.'}
            </p>

            <div className="space-y-6">
              {/* Question 1 */}
              <div>
                <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wide mb-2 font-sans leading-relaxed">
                  1. {language === 'th' ? 'สิ่งที่ประทับใจต่อมหาวิทยาลัยขณะที่กำลังศึกษาอยู่' : 'What did you like the most about the University while you were studying?'} <span className="text-[#F15A22]">*</span>
                </label>
                <textarea
                  rows={4}
                  placeholder={language === 'th' ? "โปรดระบุสิ่งที่ประทับใจ..." : "Please specify..."}
                  value={suggestions.impressions}
                  onChange={(e) => setSuggestions({ ...suggestions, impressions: e.target.value })}
                  className={`w-full px-4 py-3 bg-neutral-50 border ${formErrors.impressions ? 'border-red-400 focus:ring-red-100' : 'border-neutral-200 focus:ring-violet-100'} rounded-2xl text-xs font-semibold text-neutral-800 focus:outline-none focus:ring-4 focus:border-[#4C2D81] transition-all`}
                />
                {formErrors.impressions && <span className="text-[10px] text-red-500 font-sans mt-1 block">{formErrors.impressions}</span>}
              </div>

              {/* Question 2 */}
              <div>
                <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wide mb-2 font-sans leading-relaxed">
                  2. {language === 'th' ? 'สิ่งที่มหาวิทยาลัยควรปรับปรุงหรือพัฒนาหลักสูตร' : 'What improvements would you make to the University or program/curriculum?'} <span className="text-[#F15A22]">*</span>
                </label>
                <textarea
                  rows={4}
                  placeholder={language === 'th' ? "โปรดระบุสิ่งที่ควรปรับปรุง..." : "Please specify..."}
                  value={suggestions.improvements}
                  onChange={(e) => setSuggestions({ ...suggestions, improvements: e.target.value })}
                  className={`w-full px-4 py-3 bg-neutral-50 border ${formErrors.improvements ? 'border-red-400 focus:ring-red-100' : 'border-neutral-200 focus:ring-violet-100'} rounded-2xl text-xs font-semibold text-neutral-800 focus:outline-none focus:ring-4 focus:border-[#4C2D81] transition-all`}
                />
                {formErrors.improvements && <span className="text-[10px] text-red-500 font-sans mt-1 block">{formErrors.improvements}</span>}
              </div>

              {/* Question 3 */}
              <div>
                <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wide mb-2 font-sans leading-relaxed">
                  3. {language === 'th' ? 'สิ่งที่มหาวิทยาลัยควรปลูกฝังเพื่อเพิ่มทักษะความรู้ให้แก่ตัวบัณฑิต' : 'What the University should cultivate to increase knowledge and skills for graduates?'} <span className="text-[#F15A22]">*</span>
                </label>
                <textarea
                  rows={4}
                  placeholder={language === 'th' ? "โปรดระบุทักษะหรือความรู้..." : "Please specify..."}
                  value={suggestions.skillsToCultivate}
                  onChange={(e) => setSuggestions({ ...suggestions, skillsToCultivate: e.target.value })}
                  className={`w-full px-4 py-3 bg-neutral-50 border ${formErrors.skillsToCultivate ? 'border-red-400 focus:ring-red-100' : 'border-neutral-200 focus:ring-violet-100'} rounded-2xl text-xs font-semibold text-neutral-800 focus:outline-none focus:ring-4 focus:border-[#4C2D81] transition-all`}
                />
                {formErrors.skillsToCultivate && <span className="text-[10px] text-red-500 font-sans mt-1 block">{formErrors.skillsToCultivate}</span>}
              </div>
            </div>

            <div className="flex justify-between mt-8 pt-5 border-t border-neutral-100">
              <button
                type="button"
                onClick={handlePrevStep}
                className="flex items-center space-x-1 px-4 py-2.5 rounded-xl border border-neutral-200 text-neutral-500 text-xs font-semibold hover:bg-neutral-50 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>{t.prevBtn}</span>
              </button>
              <button
                type="button"
                onClick={handleNextStep}
                className="flex items-center space-x-1 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#4C2D81] to-[#F15A22] text-white text-xs font-bold hover:opacity-95 transition-all duration-200 shadow-sm cursor-pointer"
              >
                <span>{t.nextBtn}</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}

        {/* Step 6: SUMMARY & CONFIRM SUBMIT */}
        {step === 6 && (
          <motion.div
            key="step5"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="bg-white rounded-[2rem] p-6 sm:p-8 shadow-xl border border-neutral-100"
          >
            <div className="flex items-center space-x-3 mb-6 bg-emerald-50 p-4 rounded-2xl border border-emerald-100">
              <span className="text-emerald-700 font-sans font-black text-sm border-r border-emerald-200 pr-3 uppercase">
                {language === 'th' ? 'สรุปเนื้อหา' : 'Summary'}
              </span>
              <span className="text-neutral-700 font-sans font-bold text-sm">
                {language === 'th' ? 'โปรดตรวจสอบความถูกต้องของข้อมูลทั้งหมดก่อนส่งข้อมูล' : 'Please check and verify all info before submission'}
              </span>
            </div>

            <div className="space-y-6">
              
              {/* Profile Card Summary */}
              <div className="p-4 bg-neutral-50 rounded-2xl border border-neutral-100 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="col-span-2 pb-2 border-b border-neutral-200/50">
                  <h3 className="font-sans font-extrabold text-xs text-indigo-800 tracking-wider uppercase">
                    {language === 'th' ? '1. ข้อมูลบัณฑิตผู้สำเร็จการศึกษา' : '1. Graduate Profile Summary'}
                  </h3>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-neutral-400 block">{language === 'th' ? 'รหัสนักศึกษา / ปีการศึกษา' : 'Student ID / Academic Year'}</span>
                  <span className="text-xs text-neutral-700 font-sans">{studentId} ({academicYear})</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-neutral-400 block">{language === 'th' ? 'ระดับการศึกษา' : 'Degree Level'}</span>
                  <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-lg bg-[#4C2D81]/10 text-[#4C2D81] font-bold text-xs mt-0.5">
                    <GraduationCap className="w-3 h-3 text-[#4C2D81]" />
                    <span>{degreeLevel}</span>
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-neutral-400 block">{language === 'th' ? 'ชื่อ - นามสกุล' : 'Full Name'}</span>
                  <span className="text-xs text-neutral-700 font-sans">{firstName} {lastName}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-neutral-400 block">{language === 'th' ? 'คณะ / สาขาวิชา' : 'Faculty / Major'}</span>
                  <span className="text-xs text-neutral-700 font-sans">{faculty} - {major}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-neutral-400 block">{language === 'th' ? 'ช่องทางการติดต่อ (โทร / อีเมล)' : 'Contact Channels (Phone / Email)'}</span>
                  <span className="text-xs text-neutral-700 font-sans">{phone} / {email}</span>
                </div>
              </div>

              {/* Status Specific Details Summary */}
              <div className="p-4 bg-neutral-50 rounded-2xl border border-neutral-100">
                <div className="pb-2 border-b border-neutral-200/50 mb-3">
                  <h3 className="font-sans font-extrabold text-xs text-indigo-800 tracking-wider uppercase">
                    {language === 'th' ? '2. สถานภาพและการทำงาน' : '2. Employment & Occupation Status'}
                  </h3>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-neutral-400 block">{language === 'th' ? 'สถานภาพปัจจุบัน' : 'Current Status'}</span>
                  <span className="inline-block py-1 px-3 rounded-full text-xs font-semibold font-sans mt-1 bg-violet-100 text-violet-700">
                    {status === 'employed' && (language === 'th' ? 'ทำงานแล้วทุกประเภท' : 'Currently Employed')}
                    {status === 'unemployed' && (language === 'th' ? 'ยังไม่มีงานทำ' : 'Unemployed')}
                    {status === 'not_seeking' && (language === 'th' ? 'เหตุผลอื่นๆ' : 'Other Reasons')}
                  </span>
                </div>

                {status === 'employed' && (
                  <div className="grid grid-cols-2 gap-4 mt-4 bg-white p-3 rounded-xl border border-neutral-150">
                    <div>
                      <span className="text-[10px] font-bold text-neutral-400">{language === 'th' ? 'ตำแหน่งงาน / องค์กร' : 'Job Title / Organization'}</span>
                      <p className="text-xs text-neutral-700 font-sans font-medium">{employedDetails.jobTitle} - {employedDetails.companyName}</p>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-neutral-400">{language === 'th' ? 'เงินเดือนเฉลี่ยหลัก' : 'Average Salary'}</span>
                      <p className="text-xs text-neutral-700 font-mono font-bold text-[#F15A22]">{employedDetails.salary.toLocaleString()} {language === 'th' ? 'บาท' : 'THB'}</p>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-neutral-400">{language === 'th' ? 'ลักษณะความตรงของวิทยฐานะ' : 'Relevance to Study Major'}</span>
                      <p className="text-xs text-neutral-700 font-sans">
                        {employedDetails.isRelatedToStudy 
                          ? (language === 'th' ? 'ตรงกับวิชาที่เรียนมา' : 'Yes, related to major') 
                          : `${language === 'th' ? 'ไม่ตรง' : 'No, unrelated'}: ${employedDetails.unrelatedReason || '-'}`}
                      </p>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-neutral-400">{language === 'th' ? 'ที่ทำงาน' : 'Office Location'}</span>
                      <p className="text-[11px] text-neutral-600 leading-normal font-sans">
                        {language === 'th' 
                          ? `แขวง/ตำบล${employedDetails.companyAddress.subdistrict} เขต/อำเภอ${employedDetails.companyAddress.district} จังหวัด${employedDetails.companyAddress.province} ${employedDetails.companyAddress.zipcode}`
                          : `${employedDetails.companyAddress.subdistrict}, ${employedDetails.companyAddress.district}, ${employedDetails.companyAddress.province} ${employedDetails.companyAddress.zipcode}`}
                      </p>
                    </div>
                  </div>
                )}

                {status === 'employed' && employedDetails.workType === '6' && (
                  <div className="mt-4 p-4 bg-indigo-50/30 rounded-xl border border-indigo-100/60 shadow-sm">
                    <span className="text-[10px] font-bold text-indigo-700 block mb-2 uppercase tracking-wide">
                      {language === 'th' ? 'ผลประเมินตนเองในฐานะผู้ประกอบการ (1-10)' : 'Self-evaluation as entrepreneur (1-10)'}
                    </span>
                    <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
                      {ENTREPRENEUR_QUESTIONS.map(q => {
                        const score = employedDetails.entrepreneurRatings?.[String(q.id)] || 0;
                        return (
                          <div key={q.id} className="flex items-start justify-between text-[11px] py-1 border-b border-indigo-100/40 last:border-0 gap-3">
                            <span className="text-neutral-600 font-sans leading-relaxed">
                              {q.id}. {language === 'th' ? q.th : q.en}
                            </span>
                            <span className="font-bold text-[#4C2D81] bg-white px-2 py-0.5 rounded-md border border-indigo-100 font-mono text-xs">{score || '-'}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {status === 'unemployed' && (
                  <div className="mt-4 bg-white p-3 rounded-xl border border-neutral-150">
                    <span className="text-[10px] font-bold text-neutral-400">{language === 'th' ? 'เหตุผลที่ยังไม่มีงานทำ' : 'Reason for Unemployed'}</span>
                    <p className="text-xs text-neutral-700 font-sans">{getUnemployedLabel(unemployedDetails.reason, language)} {unemployedDetails.reason === '5' && `: ${unemployedDetails.reasonOther}`}</p>
                  </div>
                )}

                {status === 'not_seeking' && (
                  <div className="mt-4 bg-white p-3 rounded-xl border border-neutral-150">
                    <span className="text-[10px] font-bold text-neutral-400">{language === 'th' ? 'เหตุผลและรายละเอียดเพิ่มเติม' : 'Other Reasons and Details'}</span>
                    <p className="text-xs text-neutral-700 font-sans">{getNotSeekingLabel(notSeekingDetails.reason, language)} {notSeekingDetails.reason === '9' && `: ${notSeekingDetails.reasonOther}`}</p>
                  </div>
                )}
              </div>

              {/* Custom Answers Summary */}
              {customQuestions.length > 0 && Object.keys(customAnswers).length > 0 && (
                <div className="p-4 bg-neutral-50 rounded-2xl border border-neutral-100">
                  <div className="pb-2 border-b border-neutral-200/50 mb-3">
                    <h3 className="font-sans font-extrabold text-xs text-indigo-800 tracking-wider uppercase">
                      {language === 'th' ? '3. ข้อมูลคำตอบเพิ่มเติมพิเศษ' : '3. Additional Survey Answers'}
                    </h3>
                  </div>
                  <div className="space-y-2 bg-white p-3 rounded-xl border border-neutral-150">
                    {customQuestions.map(q => (
                      <div key={q.id}>
                        <span className="text-[10px] font-bold text-neutral-400 block">{q.title}</span>
                        <span className="text-xs text-neutral-700 font-sans">{customAnswers[q.id] || (language === 'th' ? '(ยังไม่ได้ตอบคำถามนี้)' : '(No answer given)')}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Part 4 Suggestions Card Summary */}
              {status !== 'employed' && (
                <div className="p-4 bg-neutral-50 rounded-2xl border border-neutral-100">
                  <div className="pb-2 border-b border-neutral-200/50 mb-3">
                    <h3 className="font-sans font-extrabold text-xs text-indigo-800 tracking-wider uppercase font-sans">
                      {language === 'th' ? '4. ข้อเสนอแนะเพื่อการพัฒนามหาวิทยาลัยกรุงเทพ' : '4. University Development Suggestions'}
                    </h3>
                  </div>
                  <div className="space-y-4 bg-white p-3 rounded-xl border border-neutral-150">
                    <div>
                      <span className="text-[10px] font-bold text-neutral-400 block leading-relaxed">
                        1. {language === 'th' ? 'สิ่งที่ประทับใจต่อมหาวิทยาลัยขณะที่กำลังศึกษาอยู่' : 'What did you like the most about the University while you were studying?'}
                      </span>
                      <p className="text-xs text-neutral-700 font-sans whitespace-pre-line mt-1 bg-neutral-50 p-2.5 rounded-lg border border-neutral-100 italic">"{suggestions.impressions}"</p>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-neutral-400 block leading-relaxed">
                        2. {language === 'th' ? 'สิ่งที่มหาวิทยาลัยควรปรับปรุงหรือพัฒนาหลักสูตร' : 'What improvements would you make to the University or program/curriculum?'}
                      </span>
                      <p className="text-xs text-neutral-700 font-sans whitespace-pre-line mt-1 bg-neutral-50 p-2.5 rounded-lg border border-neutral-100 italic">"{suggestions.improvements}"</p>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-neutral-400 block leading-relaxed">
                        3. {language === 'th' ? 'สิ่งที่มหาวิทยาลัยควรปลูกฝังเพื่อเพิ่มทักษะความรู้ให้แก่ตัวบัณฑิต' : 'What the University should cultivate to increase knowledge and skills for graduates?'}
                      </span>
                      <p className="text-xs text-neutral-700 font-sans whitespace-pre-line mt-1 bg-neutral-50 p-2.5 rounded-lg border border-neutral-100 italic">"{suggestions.skillsToCultivate}"</p>
                    </div>
                  </div>
                </div>
              )}

              {dbError && (
                <div className="flex items-center space-x-2 p-4 bg-red-50 rounded-xl border border-red-200/80 text-red-800 text-xs font-sans">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                  <span>{dbError}</span>
                </div>
              )}

            </div>

            <div className="flex justify-between mt-8 pt-5 border-t border-neutral-100 font-sans">
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handlePrevStep}
                className="flex items-center space-x-1 px-4 py-2.5 rounded-xl border border-neutral-200 text-neutral-500 text-xs font-semibold hover:bg-neutral-50 cursor-pointer disabled:bg-neutral-100"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>{language === 'th' ? 'กลับไปแก้ไข' : 'Go Back & Edit'}</span>
              </button>
              
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleSubmitSurvey}
                className="flex items-center space-x-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#4C2D81] to-[#F15A22] text-white font-sans font-bold text-xs shadow-md hover:opacity-95 cursor-pointer disabled:bg-neutral-300"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>{language === 'th' ? 'กำลังบันทึกข้อมูลเข้าระบบ...' : 'Submitting survey...'}</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{language === 'th' ? 'ยืนยันและส่งข้อมูลแบบสำรวจ' : 'Confirm & Submit Survey'}</span>
                  </>
                )}
              </button>
            </div>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}

const getUnemployedLabel = (val: string, language: 'th' | 'en') => {
  const t = TRANSLATIONS[language];
  return t.unemployedReasonsList[val] || val;
};

const getNotSeekingLabel = (val: string, language: 'th' | 'en') => {
  const t = TRANSLATIONS[language];
  return t.notSeekingReasonsList[val] || val;
};
