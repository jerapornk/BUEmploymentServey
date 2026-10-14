import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  collection, 
  query, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  onSnapshot,
  where,
  setDoc
} from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../firebase';
import { 
  FACULTIES, 
  FACULTY_ABBR_MAP,
  normalizeFacultyName,
  normalizeWorkStatus,
  normalizeDegreeLevel,
  MAJORS, 
  WORK_TYPES, 
  UNEMPLOYED_REASONS, 
  NOT_SEEKING_REASONS, 
  MONTHS,
  GET_JOB_TIMELINE,
  DEGREE_LEVELS,
  ACADEMIC_YEARS
} from '../data';
import { Graduate, SurveyResponse, CustomQuestion } from '../types';
import { ENTREPRENEUR_QUESTIONS } from './StudentSurvey';
import FacultyEmploymentRateChart from './FacultyEmploymentRateChart';
import { 
  PieChart, 
  Pie, 
  Cell, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  CartesianGrid,
  ReferenceLine,
  LabelList
} from 'recharts';
import { 
  Plus, 
  Trash2, 
  Edit3, 
  Download, 
  Upload, 
  RefreshCw, 
  SlidersHorizontal, 
  Database, 
  BarChart3, 
  Layers, 
  FileCheck, 
  HelpCircle, 
  UserPlus, 
  AlertCircle, 
  Search, 
  Check, 
  X,
  FileSpreadsheet,
  ChevronDown,
  Shield,
  Briefcase,
  GraduationCap,
  Phone,
  Mail,
  Calendar,
  MapPin,
  DollarSign,
  Award,
  Heart,
  TrendingUp,
  Building2,
  Clock,
  ThumbsUp,
  Sparkles,
  Filter,
  CheckCircle2,
  XCircle,
  Info,
  MessageSquare,
  ChevronRight,
  ArrowUpRight,
  Target,
  Users,
  BookOpen,
  Compass,
  ExternalLink,
  Activity,
  ChevronLeft,
  LayoutGrid,
  List,
  Copy,
  Tag,
  CornerDownRight
} from 'lucide-react';

const FEEDBACK_TAGS = [
  { id: 'faculty_teachers', label: 'อาจารย์ & ผู้สอน', icon: '👨‍🏫', keywords: ['อาจารย์', 'ผู้สอน', 'สอน', 'ครู', 'ที่ปรึกษา', 'เอาใจใส่', 'อบอุ่น', 'อาจารย์ประจำ'] },
  { id: 'curriculum', label: 'หลักสูตร & วิชาการ', icon: '📚', keywords: ['หลักสูตร', 'วิชา', 'เนื้อหา', 'ทฤษฎี', 'อัปเดต', 'ทันสมัย', 'หน่วยกิต', 'แน่น'] },
  { id: 'hands_on', label: 'ปฏิบัติจริง & สหกิจ/ฝึกงาน', icon: '💼', keywords: ['ปฏิบัติ', 'ฝึกงาน', 'สหกิจ', 'workshop', 'โปรเจกต์', 'ทำจริง', 'ประสบการณ์', 'ลงมือ'] },
  { id: 'facilities', label: 'อุปกรณ์ & ห้องแล็บ & ซอฟต์แวร์', icon: '💻', keywords: ['อุปกรณ์', 'แล็บ', 'lab', 'คอมพิวเตอร์', 'ซอฟต์แวร์', 'โปรแกรม', 'mac', 'กล้อง', 'wifi', 'เน็ต', 'ห้องเรียน'] },
  { id: 'languages', label: 'ภาษาต่างประเทศ / ภาษาอังกฤษ', icon: '🌐', keywords: ['ภาษา', 'อังกฤษ', 'toeic', 'english', 'ต่างประเทศ', 'inter'] },
  { id: 'tech_ai', label: 'เทคโนโลยี & AI & Data', icon: '🤖', keywords: ['ai', 'เทคโนโลยี', 'data', 'ดิจิทัล', 'digital', 'โค้ด', 'code', 'ระบบ'] },
  { id: 'soft_skills', label: 'Soft Skills & การสื่อสาร', icon: '🤝', keywords: ['soft skill', 'สื่อสาร', 'นำเสนอ', 'พรีเซนต์', 'มั่นใจ', 'มนุษยสัมพันธ์', 'ทำงานร่วมกัน', 'ทีม'] },
  { id: 'vibe_campus', label: 'มิตรภาพ & บรรยากาศ & กิจกรรม', icon: '✨', keywords: ['เพื่อน', 'สังคม', 'บรรยากาศ', 'กิจกรรม', 'มิตรภาพ', 'สิ่งแวดล้อม', 'พื้นที่', 'อาคาร'] },
];

interface AdminDashboardProps {
  customQuestions: CustomQuestion[];
  onQuestionsUpdated: () => void;
}

export default function AdminDashboard({ customQuestions, onQuestionsUpdated }: AdminDashboardProps) {
  // Navigation Tabs inside Dashboard
  const [activeTab, setActiveTab] = useState<'analytics' | 'graduates' | 'responses' | 'custom_questions' | 'admins'>('analytics');
  
  // Analytics Sub-Tabs State
  const [analyticsSubTab, setAnalyticsSubTab] = useState<'overview' | 'faculties' | 'timeline' | 'feedback'>('overview');
  const [salaryChartMode, setSalaryChartMode] = useState<'ranges' | 'average'>('average');
  const [empRateChartMode, setEmpRateChartMode] = useState<'base' | 'total'>('base');
  const [feedbackSearch, setFeedbackSearch] = useState<string>('');
  const [feedbackFacultyFilter, setFeedbackFacultyFilter] = useState<string>('all');
  const [feedbackCategoryFilter, setFeedbackCategoryFilter] = useState<'all' | 'impressions' | 'improvements' | 'skills'>('all');
  const [feedbackEmploymentFilter, setFeedbackEmploymentFilter] = useState<string>('all');
  const [feedbackTagFilter, setFeedbackTagFilter] = useState<string>('all');
  const [feedbackViewMode, setFeedbackViewMode] = useState<'card' | 'table'>('card');
  const [feedbackPage, setFeedbackPage] = useState<number>(1);
  const [feedbackPageSize, setFeedbackPageSize] = useState<number>(24);
  const [feedbackSort, setFeedbackSort] = useState<'latest' | 'studentId' | 'faculty' | 'length'>('latest');
  const [copiedFeedbackId, setCopiedFeedbackId] = useState<string | null>(null);

  // Firestore Data States
  const [graduates, setGraduates] = useState<Graduate[]>([]);
  const [responses, setResponses] = useState<SurveyResponse[]>([]);
  const [adminsList, setAdminsList] = useState<{ id: string; email: string; role: string; createdAt?: any }[]>([]);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [adminFormEmail, setAdminFormEmail] = useState('');
  const [isEditingAdmin, setIsEditingAdmin] = useState(false);
  const [editingAdminId, setEditingAdminId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  // Search & Filtering States
  const [filterAcademicYear, setFilterAcademicYear] = useState<string>('all');
  const [filterResponseStatus, setFilterResponseStatus] = useState<string>('all');
  const [filterFaculty, setFilterFaculty] = useState<string>('all');
  const [filterDegreeLevel, setFilterDegreeLevel] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [facultyTab, setFacultyTab] = useState<'overview' | 'timeline'>('overview');

  // Pagination States
  const [graduatesPage, setGraduatesPage] = useState(1);
  const [responsesPage, setResponsesPage] = useState(1);
  const itemsPerPage = 50;

  useEffect(() => {
    setGraduatesPage(1);
    setResponsesPage(1);
  }, [filterAcademicYear, filterResponseStatus, filterFaculty, filterDegreeLevel, searchQuery]);

  useEffect(() => {
    setFeedbackPage(1);
  }, [feedbackSearch, feedbackFacultyFilter, feedbackCategoryFilter, feedbackEmploymentFilter, feedbackTagFilter, feedbackSort, feedbackPageSize]);

  // Selected Response for Details Drawer
  const [selectedResponse, setSelectedResponse] = useState<SurveyResponse | null>(null);

  // Manual Graduate Form State
  const [gradForm, setGradForm] = useState<Partial<Graduate>>({
    studentId: '',
    fullName: '',
    degreeLevel: 'ระดับปริญญาตรี',
    faculty: FACULTIES[0],
    major: MAJORS[FACULTIES[0]][0],
    academicYear: '2568'
  });
  const [isEditingGrad, setIsEditingGrad] = useState(false);
  const [editingGradId, setEditingGradId] = useState<string | null>(null);
  const [showGradModal, setShowGradModal] = useState(false);

  // Custom Question Form State
  const [questionFormData, setQuestionFormData] = useState({
    title: '',
    type: 'text' as 'text' | 'choice',
    optionsInput: '', // comma separated choice options
    section: 'general' as 'general' | 'employed' | 'unemployed' | 'not_seeking',
    required: false
  });
  const [showQuestionModal, setShowQuestionModal] = useState(false);

  // CSV Roster Upload State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingCSV, setIsUploadingCSV] = useState(false);
  const [csvResult, setCsvResult] = useState('');

  // Bulk Delete States
  const [deleteYearSelected, setDeleteYearSelected] = useState<string>('');
  const [deleteGradsOption, setDeleteGradsOption] = useState<boolean>(true);
  const [deleteResOption, setDeleteResOption] = useState<boolean>(true);
  const [isDeletingBulk, setIsDeletingBulk] = useState<boolean>(false);

  // Custom Confirmation Modal State
  const [confirmModal, setConfirmModal] = useState<{
    title: string;
    message: string;
    onConfirm: () => void | Promise<void>;
    confirmText?: string;
    cancelText?: string;
  } | null>(null);

  const triggerConfirm = (
    title: string,
    message: string,
    onConfirm: () => void | Promise<void>,
    confirmText = 'ยืนยัน',
    cancelText = 'ยกเลิก'
  ) => {
    setConfirmModal({
      title,
      message,
      onConfirm: async () => {
        try {
          await onConfirm();
        } catch (err) {
          console.error(err);
        } finally {
          setConfirmModal(null);
        }
      },
      confirmText,
      cancelText
    });
  };

  // Google Sheets Sync States
  const [googleToken, setGoogleToken] = useState<string | null>(null);
  const [spreadsheetId, setSpreadsheetId] = useState<string>('');
  const [isSyncingSheets, setIsSyncingSheets] = useState<boolean>(false);
  const [sheetsSyncError, setSheetsSyncError] = useState<string>('');
  const [lastSyncedTime, setLastSyncedTime] = useState<string>('');
  const [isAutoSyncEnabled, setIsAutoSyncEnabled] = useState<boolean>(true);

  // Set up Real-time listener for Google Sheets config
  useEffect(() => {
    const sheetsUnsubscribe = onSnapshot(doc(db, 'settings', 'google_sheets_config'), (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        if (data.spreadsheetId) setSpreadsheetId(data.spreadsheetId);
        if (data.lastSyncedTime) setLastSyncedTime(data.lastSyncedTime);
        if (data.isAutoSyncEnabled !== undefined) setIsAutoSyncEnabled(data.isAutoSyncEnabled);
      }
    }, (err) => {
      console.error('Error loading Google Sheets settings:', err);
    });
    return () => sheetsUnsubscribe();
  }, []);

  const handleSyncToGoogleSheets = async (forceReconnect = false) => {
    try {
      setIsSyncingSheets(true);
      setSheetsSyncError('');

      let currentToken = googleToken;

      // 1. If we don't have a token or force reconnect is clicked, trigger OAuth pop-up
      if (!currentToken || forceReconnect) {
        const { GoogleAuthProvider, signInWithPopup } = await import('firebase/auth');
        const provider = new GoogleAuthProvider();
        provider.addScope('https://www.googleapis.com/auth/spreadsheets');
        provider.addScope('https://www.googleapis.com/auth/drive.file');
        const result = await signInWithPopup(auth, provider);
        const credential = GoogleAuthProvider.credentialFromResult(result);
        currentToken = credential?.accessToken || null;
        if (!currentToken) {
          throw new Error('ไม่สามารถรับสิทธิเข้าถึงบัญชี Google Sheets ได้ กรุณายอมรับสิทธิ์');
        }
        setGoogleToken(currentToken);
      }

      // 2. If we don't have a spreadsheet ID, create one
      let currentSpreadsheetId = spreadsheetId;
      if (!currentSpreadsheetId) {
        const response = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${currentToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            properties: {
              title: 'รายงานข้อมูลภาวะการทำงานของบัณฑิต มหาวิทยาลัยกรุงเทพ (Real-time)'
            }
          })
        });

        if (!response.ok) {
          const errData = await response.json();
          throw new Error(errData.error?.message || 'ไม่สามารถสร้างแผ่นงาน Google Sheets ได้');
        }

        const data = await response.json();
        currentSpreadsheetId = data.spreadsheetId;
        setSpreadsheetId(currentSpreadsheetId);

        await setDoc(doc(db, 'settings', 'google_sheets_config'), {
          spreadsheetId: currentSpreadsheetId,
          lastSyncedTime: formatResponseDate(new Date())
        }, { merge: true });
      }

      // 3. Retrieve dynamic sheet title to support non-English accounts (e.g., Thai locale which uses "แผ่นงาน1")
      let firstSheetTitle = 'Sheet1';
      try {
        const metaResponse = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${currentSpreadsheetId}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${currentToken}`
          }
        });
        if (metaResponse.ok) {
          const metaData = await metaResponse.json();
          if (metaData.sheets && metaData.sheets.length > 0) {
            firstSheetTitle = metaData.sheets[0].properties?.title || 'Sheet1';
          }
        }
      } catch (metaErr) {
        console.error('Error fetching spreadsheet metadata, defaulting to Sheet1:', metaErr);
      }

      // 4. Format rows
      const headers = [
        'รหัสนักศึกษา', 'ชื่อ', 'นามสกุล', 'คณะ', 'สาขาวิชา', 'ปีการศึกษา', 'เบอร์โทรศัพท์', 'อีเมล', 
        'วันที่ตอบแบบสอบถาม', 'สถานะ', 'ตำแหน่งงาน', 'บริษัท', 'ฝ่าย', 'เงินเดือน', 'สอดคล้องกับสาขา', 
        'ระยะเวลาได้งาน', 'สิ่งที่ประทับใจต่อมหาวิทยาลัยขณะที่กำลังศึกษาอยู่', 
        'สิ่งที่มหาวิทยาลัยควรปรับปรุงหรือพัฒนาหลักสูตร', 'สิ่งที่มหาวิทยาลัยควรปลูกฝังเพื่อเพิ่มทักษะความรู้ให้แก่ตัวบัณฑิต',
        'ผู้ประกอบการ_ข้อ1_ดำเนินธุรกิจคุณธรรม', 'ผู้ประกอบการ_ข้อ2_ความรู้เชี่ยวชาญ', 'ผู้ประกอบการ_ข้อ3_คิดแก้ปัญหาซับซ้อน', 
        'ผู้ประกอบการ_ข้อ4_มีมนุษยสัมพันธ์', 'ผู้ประกอบการ_ข้อ5_ใช้คณิตศาสตร์สถิติและไอที', 'ผู้ประกอบการ_ข้อ6_สร้างสรรค์นวัตกรรม', 
        'ผู้ประกอบการ_ข้อ7_จิตวิญญาณผู้ประกอบการ', 'ผู้ประกอบการ_ข้อ8_ใช้ภาษาต่างประเทศ', 'ผู้ประกอบการ_ข้อ9_ตั้งคำถามเพื่อโอกาสธุรกิจ', 
        'ผู้ประกอบการ_ข้อ10_ใฝ่เรียนรู้ในโลกดิจิทัล'
      ];

      const rows = responses.map(r => {
        const statusLabel = r.workStatus === 'employed' || r.status === 'employed' ? 'ทำงานแล้ว' :
                            r.workStatus === 'unemployed' || r.status === 'unemployed' ? 'ยังไม่มีงานทำ' : 'เหตุผลอื่นๆ';
        const jobTitle = r.employedDetails?.jobTitle || '';
        const company = r.employedDetails?.companyName || '';
        const dept = r.employedDetails?.department || '';
        const salary = r.employedDetails?.salary || 0;
        const related = r.employedDetails ? (r.employedDetails.isRelatedToStudy ? 'ตรงสาย' : 'ไม่ตรงสาย') : '';
        const timeline = r.employedDetails?.timeToGetJob || '';
        const responseDate = formatResponseDate(r.createdAt);
        const impressionsStr = r.suggestions?.impressions || '';
        const improvementsStr = r.suggestions?.improvements || '';
        const skillsToCultivateStr = r.suggestions?.skillsToCultivate || '';

        const ratingCols = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => {
          const score = r.employerEvaluation?.[`q${num}`];
          return score !== undefined ? score : '';
        });

        // Use single quote prefix to prevent Excel/Sheets from eating leading zeros in studentId
        const formattedStudentId = r.studentId ? `'${r.studentId}` : '';

        return [
          formattedStudentId,
          r.firstName || '',
          r.lastName || '',
          r.faculty || '',
          r.major || '',
          r.academicYear || '',
          r.phone || '',
          r.email || '',
          responseDate,
          statusLabel,
          jobTitle,
          company,
          dept,
          salary,
          related,
          timeline,
          impressionsStr,
          improvementsStr,
          skillsToCultivateStr,
          ...ratingCols
        ];
      });

      const values = [headers, ...rows];

      // Clear existing values in the sheet
      await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${currentSpreadsheetId}/values/${encodeURIComponent(firstSheetTitle)}!A1:Z5000:clear`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${currentToken}`,
          'Content-Type': 'application/json'
        }
      });

      // Put latest rows
      const updateRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${currentSpreadsheetId}/values/${encodeURIComponent(firstSheetTitle)}!A1?valueInputOption=USER_ENTERED`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${currentToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          range: `${firstSheetTitle}!A1`,
          majorDimension: 'ROWS',
          values: values
        })
      });

      if (!updateRes.ok) {
        const errData = await updateRes.json().catch(() => ({}));
        throw new Error(errData.error?.message || 'ไม่สามารถอัปเดตแผ่นงาน Google Sheets ได้');
      }

      const nowStr = formatResponseDate(new Date());
      setLastSyncedTime(nowStr);

      await setDoc(doc(db, 'settings', 'google_sheets_config'), {
        spreadsheetId: currentSpreadsheetId,
        lastSyncedTime: nowStr
      }, { merge: true });

    } catch (err: any) {
      console.error('Error syncing Google Sheets:', err);
      setSheetsSyncError(err.message || 'การเชื่อมต่อล้มเหลว');
    } finally {
      setIsSyncingSheets(false);
    }
  };

  // Auto-sync Google Sheets when database updates and admin is already connected
  useEffect(() => {
    if (googleToken && spreadsheetId && isAutoSyncEnabled && responses.length > 0) {
      const delayDebounceFn = setTimeout(() => {
        handleSyncToGoogleSheets();
      }, 2000);
      return () => clearTimeout(delayDebounceFn);
    }
  }, [responses.length, googleToken, spreadsheetId, isAutoSyncEnabled]);

  // Fetch responses and graduates list from Firestore
  useEffect(() => {
    setIsLoading(true);
    setErrorMsg('');

    // Set up Real-time listener for Survey Responses
    const responsesUnsubscribe = onSnapshot(collection(db, 'survey_responses'), async (snapshot) => {
      const fetchedResponses: SurveyResponse[] = [];
      const staleResponseIds: string[] = [];

      snapshot.docs.forEach(docSnap => {
        const data = docSnap.data();
        if (data.academicYear === '2569') {
          staleResponseIds.push(docSnap.id);
          return;
        }
        const rawFaculty = data.faculty || '';
        const faculty = normalizeFacultyName(rawFaculty, data.major, data.studentId);
        const status = normalizeWorkStatus(data as any);
        const degreeLevel = normalizeDegreeLevel(data.degreeLevel);
        const academicYear = String(data.academicYear || '2568').trim();
        fetchedResponses.push({
          id: docSnap.id,
          ...data,
          status,
          faculty,
          degreeLevel,
          academicYear
        } as SurveyResponse);
      });

      // Auto-purge any stale 2569 responses from Firestore
      if (staleResponseIds.length > 0) {
        for (const id of staleResponseIds) {
          try {
            await deleteDoc(doc(db, 'survey_responses', id));
          } catch (e) {
            console.warn('Auto purge 2569 response', e);
          }
        }
      }

      setResponses(fetchedResponses);
    }, (err) => {
      console.error(err);
      try {
        handleFirestoreError(err, OperationType.LIST, 'survey_responses');
      } catch (e: any) {
        setErrorMsg(`เกิดข้อผิดพลาดในการดึงข้อมูลแบบสำรวจ: ${e.message}`);
      }
    });

    // Set up Real-time listener for Graduates List
    const graduatesUnsubscribe = onSnapshot(collection(db, 'graduates'), async (snapshot) => {
      const fetchedGrads: Graduate[] = [];
      const staleGradIds: string[] = [];

      snapshot.docs.forEach(docSnap => {
        const data = docSnap.data();
        if (data.academicYear === '2569') {
          staleGradIds.push(docSnap.id);
          return;
        }
        const rawFaculty = data.faculty || '';
        const faculty = normalizeFacultyName(rawFaculty, data.major, data.studentId);
        const degreeLevel = normalizeDegreeLevel(data.degreeLevel);
        const academicYear = String(data.academicYear || '2568').trim();
        fetchedGrads.push({
          id: docSnap.id,
          ...data,
          faculty,
          degreeLevel,
          academicYear
        } as Graduate);
      });

      // Auto-purge any stale 2569 graduates from Firestore
      if (staleGradIds.length > 0) {
        for (const id of staleGradIds) {
          try {
            await deleteDoc(doc(db, 'graduates', id));
          } catch (e) {
            console.warn('Auto purge 2569 graduate', e);
          }
        }
      }

      setGraduesWithMockFallback(fetchedGrads);
      setIsLoading(false);
    }, (err) => {
      console.error(err);
      try {
        handleFirestoreError(err, OperationType.LIST, 'graduates');
      } catch (e: any) {
        setErrorMsg(`เกิดข้อผิดพลาดในการดึงข้อมูลทำเนียบบัณฑิต: ${e.message}`);
      }
      setIsLoading(false);
    });

    // Set up Real-time listener for Admins List
    const adminsUnsubscribe = onSnapshot(collection(db, 'admins'), (snapshot) => {
      const fetchedAdmins = snapshot.docs.map(doc => ({
        id: doc.id,
        email: doc.data().email || '',
        role: doc.data().role || 'admin',
        createdAt: doc.data().createdAt || null
      }));
      setAdminsList(fetchedAdmins);
    }, (err) => {
      console.error(err);
      try {
        handleFirestoreError(err, OperationType.LIST, 'admins');
      } catch (e: any) {
        setErrorMsg(`เกิดข้อผิดพลาดในการดึงข้อมูลผู้ดูแลระบบ: ${e.message}`);
      }
    });

    return () => {
      responsesUnsubscribe();
      graduatesUnsubscribe();
      adminsUnsubscribe();
    };
  }, []);

  // Set initial default majors if faculty selection changes in graduate manual form
  useEffect(() => {
    if (gradForm.faculty) {
      const departmentChoices = MAJORS[gradForm.faculty] || [];
      if (departmentChoices.length > 0) {
        setGradForm(prev => ({ ...prev, major: departmentChoices[0] }));
      }
    }
  }, [gradForm.faculty]);

  // Fallback helper to populate with mock data if workspace is completely newly initialized
  const setGraduesWithMockFallback = (data: Graduate[]) => {
    setGraduates(data);
  };

  // Seed standard mock graduates if database is fresh (Optional utility for immediate demo)
  const seedMockGraduates = async () => {
    try {
      const pathForWrite = 'graduates';
      const sampleGraduates: Graduate[] = [
        { studentId: "1640901234", fullName: "สรวิศ วงศ์อนุรักษ์", faculty: "คณะเทคโนโลยีสารสนเทศและนวัตกรรม", major: "วิทยาการคอมพิวเตอร์", academicYear: "2568" },
        { studentId: "1640904567", fullName: "แพรวา ณ เชียงใหม่", faculty: "คณะนิเทศศาสตร์", major: "สื่อสารตราสินค้าดิจิทัล", academicYear: "2568" },
        { studentId: "1640908888", fullName: "ธนภูมิ บุญญานนท์", faculty: "คณะวิศวกรรมศาสตร์", major: "วิศวกรรมคอมพิวเตอร์", academicYear: "2568" },
        { studentId: "1650901111", fullName: "ชลลดา เกียรติทวี", faculty: "คณะบริหารธุรกิจ", major: "การตลาด", academicYear: "2568" }
      ];

      for (const grad of sampleGraduates) {
        await addDoc(collection(db, pathForWrite), grad);
      }
    } catch (err) {
      console.error('Seeding mocks failed', err);
    }
  };

  const [isSeedingResponses, setIsSeedingResponses] = useState(false);

  // Seed sample survey responses across all 13 faculties so charts show data immediately
  const seedSampleSurveyResponses = async () => {
    try {
      setIsSeedingResponses(true);
      const sampleResponses: any[] = [];
      const statuses: ('employed' | 'unemployed' | 'not_seeking')[] = ['employed', 'employed', 'employed', 'employed', 'unemployed', 'not_seeking'];
      
      FACULTIES.forEach((fac, idx) => {
        // Create 3 responses per faculty
        for (let i = 0; i < 3; i++) {
          const status = statuses[(idx + i) % statuses.length];
          const salBase = 18000 + ((idx * 2700 + i * 4500) % 32000);
          const degreeLevel = i === 0 ? 'ระดับปริญญาตรี' : i === 1 ? 'ระดับปริญญาโท' : 'ระดับปริญญาเอก';
          sampleResponses.push({
            studentId: `164090${String(idx * 3 + i + 100).padStart(4, '0')}`,
            firstName: 'บัณฑิตตัวอย่าง',
            lastName: `${fac.substring(0, 6)} ${i + 1}`,
            faculty: fac,
            major: MAJORS[fac]?.[0] || 'สาขาหลัก',
            phone: '0812345678',
            email: `sample_${idx}_${i}@bu.ac.th`,
            academicYear: '2568',
            degreeLevel,
            surveyMonth: 'มีนาคม 2568',
            submittedAt: formatResponseDate(new Date(Date.now() - (idx * 86400000 * 2))),
            createdAt: new Date(),
            status,
            employedDetails: status === 'employed' ? {
              workType: '1',
              jobTitle: 'เจ้าหน้าที่วิชาชีพ / นักวิเคราะห์',
              companyName: 'บริษัทนวัตกรรม จำกัด',
              companyDept: 'แผนกพัฒนาระบบ',
              companyAddress: {
                no: '123',
                moo: '1',
                building: 'อาคารเอ',
                floor: '5',
                soi: 'สุขุมวิท 21',
                road: 'สุขุมวิท',
                subdistrict: 'คลองเตยเหนือ',
                district: 'วัฒนา',
                province: 'กรุงเทพมหานคร',
                zipcode: '10110'
              },
              salary: salBase,
              hasOtherIncome: false,
              isRelatedToStudy: true,
              timeToGetJob: '1'
            } : undefined,
            unemployedDetails: status === 'unemployed' ? {
              reason: '1'
            } : undefined,
            notSeekingDetails: status === 'not_seeking' ? {
              reason: '1'
            } : undefined
          });
        }
      });

      for (const resData of sampleResponses) {
        await addDoc(collection(db, 'survey_responses'), resData);
      }
      alert('สร้างข้อมูลตัวอย่างตอบแบบสำรวจสำเร็จ! กราฟแท่งได้รับการอัปเดตเรียบร้อย');
    } catch (err: any) {
      console.error('Error seeding sample survey responses:', err);
      alert('ไม่สามารถสร้างข้อมูลตัวอย่างได้: ' + err.message);
    } finally {
      setIsSeedingResponses(false);
    }
  };

  // Create or Update graduate manually in Firestore
  const handleSaveGraduate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gradForm.studentId || !gradForm.fullName || !gradForm.faculty || !gradForm.major || !gradForm.academicYear) {
      alert('กรุณากรอกข้อมูลหลักให้ครบถ้วน');
      return;
    }
    if (!/^\d{10}$/.test((gradForm.studentId || '').trim())) {
      alert('กรุณากรอกรหัสประจำตัวนักศึกษาเป็นตัวเลข 10 หลักเท่านั้น');
      return;
    }

    try {
      const gradData = {
        ...gradForm,
        degreeLevel: gradForm.degreeLevel || 'ระดับปริญญาตรี'
      };

      if (isEditingGrad && editingGradId) {
        const docRef = doc(db, 'graduates', editingGradId);
        await updateDoc(docRef, gradData as any);
      } else {
        await addDoc(collection(db, 'graduates'), gradData as any);
      }

      setGradForm({
        studentId: '',
        fullName: '',
        degreeLevel: 'ระดับปริญญาตรี',
        faculty: FACULTIES[0],
        major: MAJORS[FACULTIES[0]][0],
        academicYear: '2568'
      });
      setIsEditingGrad(false);
      setEditingGradId(null);
      setShowGradModal(false);
    } catch (err: any) {
      alert(`ไม่สามารถบันทึกข้อมูลได้: ${err.message}`);
    }
  };

  // Create, Update, or Delete admin manually in Firestore
  const handleSaveAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminFormEmail.trim()) {
      alert('กรุณากรอกอีเมลผู้ดูแลระบบ');
      return;
    }
    
    const emailToSave = adminFormEmail.trim().toLowerCase();
    
    try {
      if (isEditingAdmin && editingAdminId) {
        // Edit existing admin
        const adminDocRef = doc(db, 'admins', editingAdminId);
        await updateDoc(adminDocRef, {
          email: emailToSave,
          role: 'admin'
        });
      } else {
        // Check for duplicates
        const emailExists = adminsList.some(adm => adm.email.toLowerCase() === emailToSave);
        if (emailExists) {
          alert('มีบัญชีผู้ดูแลระบบอีเมลนี้อยู่แล้วในระบบ');
          return;
        }

        // Add new admin
        await setDoc(doc(db, 'admins', emailToSave), {
          email: emailToSave,
          role: 'admin'
        });
      }
      
      setAdminFormEmail('');
      setIsEditingAdmin(false);
      setEditingAdminId(null);
      setShowAdminModal(false);
    } catch (err: any) {
      console.error(err);
      try {
        handleFirestoreError(err, isEditingAdmin ? OperationType.UPDATE : OperationType.CREATE, `admins/${editingAdminId || 'new'}`);
      } catch (e: any) {
        alert(`ผิดพลาดในการบันทึกข้อมูลผู้ดูแลระบบ: ${e.message}`);
      }
    }
  };

  const handleDeleteAdmin = async (id: string, email: string) => {
    const bootstrappedAdminEmail = 'jeraporn.k@bu.ac.th';
    if (email.toLowerCase() === bootstrappedAdminEmail) {
      alert('ไม่สามารถลบบัญชีผู้ดูแลระบบหลักของระบบได้');
      return;
    }

    if (auth.currentUser && auth.currentUser.email?.toLowerCase() === email.toLowerCase()) {
      alert('ไม่สามารถลบบัญชีผู้ดูแลระบบที่คุณกำลังใช้งานอยู่ได้');
      return;
    }

    triggerConfirm(
      'ยืนยันการลบผู้ดูแลระบบ',
      `คุณแน่ใจหรือไม่ว่าต้องการลบผู้ดูแลระบบ: ${email}?`,
      async () => {
        try {
          await deleteDoc(doc(db, 'admins', id));
        } catch (err: any) {
          console.error(err);
          try {
            handleFirestoreError(err, OperationType.DELETE, `admins/${id}`);
          } catch (e: any) {
            alert(`ลบผู้ดูแลระบบล้มเหลว: ${e.message}`);
          }
        }
      }
    );
  };

  // Set graduate form for editing
  const startEditGraduate = (grad: Graduate) => {
    setGradForm({
      ...grad,
      degreeLevel: grad.degreeLevel || 'ระดับปริญญาตรี'
    });
    setIsEditingGrad(true);
    setEditingGradId(grad.id || null);
    setShowGradModal(true);
  };

  // Delete graduate record
  const handleDeleteGraduate = async (id: string) => {
    triggerConfirm(
      'ยืนยันการลบข้อมูล',
      'ยืนยันที่จะลบข้อมูลผู้สำเร็จการศึกษานี้ใช่หรือไม่?',
      async () => {
        try {
          await deleteDoc(doc(db, 'graduates', id));
        } catch (err: any) {
          alert(`ลบข้อมูลล้มเหลว: ${err.message}`);
        }
      }
    );
  };

  // Bulk Delete Data by Selected Academic Year
  const handleBulkDeleteByYear = async () => {
    if (!deleteYearSelected) {
      alert('กรุณาเลือกปีการศึกษาที่ต้องการลบข้อมูล');
      return;
    }

    if (!deleteGradsOption && !deleteResOption) {
      alert('กรุณาเลือกประเภทข้อมูลที่ต้องการลบ (รายชื่อบัณฑิต หรือ การตอบแบบสำรวจ)');
      return;
    }

    let targetTasksMsg = [];
    if (deleteGradsOption) targetTasksMsg.push('ทำเนียบรายชื่อบัณฑิต');
    if (deleteResOption) targetTasksMsg.push('ข้อมูลการตอบแบบสำรวจ');
    const displayTasks = targetTasksMsg.join(' และ ');

    const confirmMsg = `คุณยืนยันที่จะทำการลบ [${displayTasks}] ประจำปีการศึกษา "${deleteYearSelected}" ทั้งหมดใช่หรือไม่?\n\nการดำเนินการนี้จะลบข้อมูลออกถาวรโดยไม่มีการสำรองข้อมูล และไม่สามารถเรียกกลับมาได้อีก!`;

    triggerConfirm(
      '⚠️ คำเตือนลบข้อมูลถาวร',
      confirmMsg,
      async () => {
        setIsDeletingBulk(true);
        let deletedGradsCount = 0;
        let deletedResCount = 0;

        try {
          // 1. Delete Graduates
          if (deleteGradsOption) {
            const q = query(collection(db, 'graduates'), where('academicYear', '==', deleteYearSelected));
            const snapshot = await getDocs(q);
            for (const docSnap of snapshot.docs) {
              await deleteDoc(docSnap.ref);
              deletedGradsCount++;
            }
          }

          // 2. Delete survey_responses
          if (deleteResOption) {
            const q = query(collection(db, 'survey_responses'), where('academicYear', '==', deleteYearSelected));
            const snapshot = await getDocs(q);
            for (const docSnap of snapshot.docs) {
              await deleteDoc(docSnap.ref);
              deletedResCount++;
            }
          }

          alert(`ลบข้อมูลทั้งหมดเรียบร้อยแล้ว!\n- ลบรายชื่อทำเนียบบัณฑิต: ${deletedGradsCount} รายการ\n- ลบผลแบบสำรวจ: ${deletedResCount} รายการ`);
          setDeleteYearSelected('');
        } catch (err: any) {
          console.error(err);
          try {
            handleFirestoreError(err, OperationType.DELETE, `bulk_delete/${deleteYearSelected}`);
          } catch (e: any) {
            alert(`เกิดข้อผิดพลาดในการลบข้อมูล: ${e.message}`);
          }
        } finally {
          setIsDeletingBulk(false);
        }
      },
      'ลบข้อมูลทั้งหมด',
      'ยกเลิก'
    );
  };

  // Add Dynamic Custom Question
  const handleAddQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!questionFormData.title) {
      alert('กรุณาระบุกลุ่มคำถาม');
      return;
    }

    try {
      const id = 'q_' + Date.now();
      const options = questionFormData.type === 'choice' 
        ? questionFormData.optionsInput.split(',').map(s => s.trim()).filter(Boolean)
        : [];
      
      const newQuestion: CustomQuestion = {
        id,
        title: questionFormData.title,
        type: questionFormData.type,
        options,
        section: questionFormData.section,
        required: questionFormData.required
      };

      await addDoc(collection(db, 'questions'), newQuestion);
      
      setQuestionFormData({
        title: '',
        type: 'text',
        optionsInput: '',
        section: 'general',
        required: false
      });
      setShowQuestionModal(false);
      onQuestionsUpdated();
    } catch (err: any) {
      alert(`ไม่สามารถสร้างคำถามได้: ${err.message}`);
    }
  };

  // Delete Custom Question
  const handleDeleteQuestion = async (docId: string) => {
    triggerConfirm(
      'ยืนยันการลบคำถาม',
      'ยืนยันการลบข้อสอบถามเพิ่มเติมนี้ใช่หรือไม่?',
      async () => {
        try {
          await deleteDoc(doc(db, 'questions', docId));
          onQuestionsUpdated();
        } catch (err: any) {
          alert(`ลบข้อคำถามล้มเหลว: ${err.message}`);
        }
      }
    );
  };

  // Helper to download sample 7-column CSV template matching user's layout
  const downloadSampleCSV = () => {
    const headers = 'ปีการศึกษา,ระดับปริญญา,รหัสนักศึกษา,ชื่อ,นามสกุล,คณะ,สาขา\n';
    const sampleRows = [
      '2568,ระดับปริญญาตรี,1000000079,น้องนับ,พรหมสุวรรณ,คณะเทคโนโลยีสารสนเทศและนวัตกรรม,วิทยาการคอมพิวเตอร์',
      '2568,ระดับปริญญาตรี,1000000020,แก้มใส,บุญประเสริฐ,คณะนิเทศศาสตร์,การสื่อสารการตลาดดิจิทัล',
      '2568,ระดับปริญญาตรี,1000000078,มะเหมี่ยว,สุขนิรันดร์,คณะบริหารธุรกิจ,การตลาดดิจิทัล',
      '2568,ระดับปริญญาตรี,1000000015,ข้าวหอม,สุวรรณดี,คณะวิศวกรรมศาสตร์,วิศวกรรมคอมพิวเตอร์และปัญญาประดิษฐ์',
      '2568,ระดับปริญญาตรี,1000000061,ใจดี,วัฒนกิจ,คณะมนุษยศาสตร์และการจัดการการท่องเที่ยว,การจัดการการท่องเที่ยวและนวัตกรรมการบริการ'
    ].join('\n');
    const blob = new Blob(['\uFEFF' + headers + sampleRows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sample_graduates_7_columns.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Safe client-side robust CSV parser to import graduates list
  // Supports both 7-column format: [ปีการศึกษา, ระดับปริญญา, รหัสนักศึกษา, ชื่อ, นามสกุล, คณะ, สาขา]
  // and dynamic column header matching based on Thai/English column names
  const handleCSVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingCSV(true);
    setCsvResult('');

    const reader = new FileReader();
    reader.onload = async (evt) => {
      const text = evt.target?.result as string;
      if (!text) {
        setIsUploadingCSV(false);
        return;
      }

      try {
        const rows = text.split(/\r\n|\n|\r/).map(r => r.trim()).filter(Boolean);
        if (rows.length === 0) {
          setCsvResult('ไม่พบข้อมูล ไฟล์ว่างเปล่า');
          setIsUploadingCSV(false);
          return;
        }

        // Robust CSV line parser handling quotes, double quotes, commas, and tabs
        const parseLine = (line: string): string[] => {
          const res: string[] = [];
          let cur = '';
          let inQuotes = false;
          for (let i = 0; i < line.length; i++) {
            const char = line[i];
            if (char === '"') {
              if (inQuotes && line[i + 1] === '"') {
                cur += '"';
                i++;
              } else {
                inQuotes = !inQuotes;
              }
            } else if ((char === ',' || char === '\t') && !inQuotes) {
              res.push(cur.trim());
              cur = '';
            } else {
              cur += char;
            }
          }
          res.push(cur.trim());
          return res;
        };

        const normalizeDegree = (val: string): string => {
          const s = (val || '').trim();
          if (s.includes('เอก') || s.toLowerCase().includes('doc') || s.toLowerCase().includes('phd')) {
            return 'ระดับปริญญาเอก';
          } else if (s.includes('โท') || s.toLowerCase().includes('master')) {
            return 'ระดับปริญญาโท';
          } else if (s.includes('ตรี') || s.toLowerCase().includes('bachelor')) {
            return 'ระดับปริญญาตรี';
          }
          return s ? (s.startsWith('ระดับ') ? s : `ระดับ${s}`) : 'ระดับปริญญาตรี';
        };

        // Inspect header row (Row 0)
        const headerCols = parseLine(rows[0]).map(c => c.replace(/^["']|["']$/g, '').trim());
        const lowerHeaders = headerCols.map(c => c.toLowerCase());

        let yearIdx = lowerHeaders.findIndex(h => h.includes('ปีการศึกษา') || h.includes('ปี') || h.includes('year') || h.includes('academic'));
        let degreeIdx = lowerHeaders.findIndex(h => h.includes('ระดับ') || h.includes('ปริญญา') || h.includes('degree') || h.includes('level'));
        let idIdx = lowerHeaders.findIndex(h => h.includes('รหัสนักศึกษา') || h.includes('รหัส') || h.includes('studentid') || h.includes('student_id') || h.includes('student id'));
        let firstIdx = lowerHeaders.findIndex(h => (h.includes('ชื่อ') || h.includes('firstname') || h.includes('first_name')) && !h.includes('นามสกุล') && !h.includes('สกุล') && !h.includes('ชื่อ-') && !h.includes('ชื่อ -') && !h.includes('ชื่อนามสกุล'));
        let lastIdx = lowerHeaders.findIndex(h => h.includes('นามสกุล') || h.includes('สกุล') || h.includes('lastname') || h.includes('last_name') || h.includes('surname'));
        let fullIdx = lowerHeaders.findIndex(h => h.includes('ชื่อ-นามสกุล') || h.includes('ชื่อ - นามสกุล') || h.includes('ชื่อนามสกุล') || h.includes('fullname') || h.includes('full_name'));
        let facIdx = lowerHeaders.findIndex(h => h.includes('คณะ') || h.includes('faculty') || h.includes('school'));
        let majIdx = lowerHeaders.findIndex(h => h.includes('สาขา') || h.includes('major') || h.includes('department') || h.includes('dept'));

        const matchedHeaderCount = [yearIdx, degreeIdx, idIdx, firstIdx, lastIdx, fullIdx, facIdx, majIdx].filter(idx => idx >= 0).length;
        const isHeaderRow = matchedHeaderCount >= 2;

        let startLine = isHeaderRow ? 1 : 0;

        // If headers not dynamically detected, check the first data line's pattern
        if (!isHeaderRow || (idIdx === -1 && yearIdx === -1)) {
          const sampleCols = parseLine(rows[startLine]).map(c => c.replace(/^["']|["']$/g, '').trim());
          // If col 0 looks like a 4-digit academic year (e.g., 2568, 2567):
          if (/^(25|20)\d{2}$/.test(sampleCols[0]) || sampleCols[0].length === 4) {
            // Matches user's 7-column layout: [ปีการศึกษา, ระดับปริญญา, รหัสนักศึกษา, ชื่อ, นามสกุล, คณะ, สาขา]
            yearIdx = 0;
            degreeIdx = 1;
            idIdx = 2;
            firstIdx = 3;
            lastIdx = 4;
            facIdx = 5;
            majIdx = 6;
          } else if (/^\d{8,12}$/.test(sampleCols[0])) {
            // Legacy format: [รหัสนักศึกษา, ชื่อ-นามสกุล, คณะ, สาขา, ปีการศึกษา, ระดับปริญญา]
            idIdx = 0;
            fullIdx = 1;
            facIdx = 2;
            majIdx = 3;
            yearIdx = 4;
            degreeIdx = 5;
          } else {
            // Default to user's 7-column layout
            yearIdx = 0;
            degreeIdx = 1;
            idIdx = 2;
            firstIdx = 3;
            lastIdx = 4;
            facIdx = 5;
            majIdx = 6;
          }
        }

        let count = 0;
        for (let i = startLine; i < rows.length; i++) {
          const cols = parseLine(rows[i]).map(c => c.replace(/^["']|["']$/g, '').trim());
          if (cols.length >= 3) {
            const academicYear = yearIdx >= 0 && cols[yearIdx] ? cols[yearIdx].trim() : '2568';
            const degreeLevel = degreeIdx >= 0 && cols[degreeIdx] ? normalizeDegree(cols[degreeIdx]) : 'ระดับปริญญาตรี';
            const studentId = idIdx >= 0 && cols[idIdx] ? cols[idIdx].trim().replace(/[^0-9]/g, '') : '';

            let firstName = firstIdx >= 0 && cols[firstIdx] ? cols[firstIdx].trim() : '';
            let lastName = lastIdx >= 0 && cols[lastIdx] ? cols[lastIdx].trim() : '';
            let fullName = '';

            if (firstName || lastName) {
              fullName = `${firstName} ${lastName}`.trim();
            } else if (fullIdx >= 0 && cols[fullIdx]) {
              fullName = cols[fullIdx].replace(/\s+/g, ' ').trim();
              const nParts = fullName.split(/\s+/);
              firstName = nParts[0] || '';
              lastName = nParts.slice(1).join(' ') || '';
            }

            let rawFaculty = facIdx >= 0 && cols[facIdx] ? cols[facIdx].trim().replace(/เเ/g, 'แ') : '';
            const major = majIdx >= 0 && cols[majIdx] ? cols[majIdx].trim().replace(/เเ/g, 'แ') : '';
            const faculty = normalizeFacultyName(rawFaculty, major, studentId);

            if (studentId && (fullName || firstName)) {
              try {
                await addDoc(collection(db, 'graduates'), {
                  studentId,
                  fullName: fullName || firstName,
                  firstName,
                  lastName,
                  faculty,
                  major,
                  academicYear,
                  degreeLevel
                });
                count++;
              } catch (writeErr: any) {
                console.error(`Row ${i} import failed:`, writeErr);
                handleFirestoreError(writeErr, OperationType.WRITE, 'graduates');
              }
            }
          }
        }
        setCsvResult(`อัพเดตสำเร็จ บันทึกเข้าฐานข้อมูลได้จำนวน ${count} รายชื่อ โดยจัดตำแหน่งคอลัมน์ [ปีการศึกษา, ระดับปริญญา, รหัสนักศึกษา, ชื่อ, นามสกุล, คณะ, สาขา] เรียบร้อยแล้ว`);
      } catch (err: any) {
        let msg = err.message || '';
        if (msg.includes('Missing or insufficient permissions')) {
          msg = 'สิทธิ์ไม่เพียงพอในการบันทึกข้อมูล กรุณาลงชื่อเข้าใช้ด้วยบัญชีผู้ดูแลระบบ (เช่น jeraporn.k@bu.ac.th)';
        } else if (msg.startsWith('{')) {
          try {
            const parsed = JSON.parse(msg);
            if (parsed.error && parsed.error.includes('Missing or insufficient permissions')) {
              msg = 'สิทธิ์ไม่เพียงพอในการบันทึกข้อมูล กรุณาลงชื่อเข้าใช้ด้วยบัญชีผู้ดูแลระบบ (เช่น jeraporn.k@bu.ac.th)';
            }
          } catch (e) {}
        }
        setCsvResult(`เกิดข้อผิดพลาดระหว่างนำเข้า: ${msg}`);
      } finally {
        setIsUploadingCSV(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.readAsText(file, 'UTF-8');
  };

  // Export current filtered survey responses to CSV
  const handleExportResponses = () => {
    if (filteredResponses.length === 0) {
      alert('ไม่มีข้อมูลให้ส่งออก');
      return;
    }

    // Build columns headers
    let csvContent = '\uFEFF'; // UTF-8 BOM
    csvContent += 'รหัสนักศึกษา,ชื่อ,นามสกุล,ระดับการศึกษา,คณะ,สาขาวิชา,ปีการศึกษา,เบอร์โทรศัพท์,อีเมล,วันที่ตอบแบบสอบถาม,สถานะ,ตำแหน่งงาน,บริษัท,ฝ่าย,เงินเดือน,สอดคล้องกับสาขา,ระยะเวลาได้งาน,สิ่งที่ประทับใจต่อมหาวิทยาลัยขณะที่กำลังศึกษาอยู่,สิ่งที่มหาวิทยาลัยควรปรับปรุงหรือพัฒนาหลักสูตร,สิ่งที่มหาวิทยาลัยควรปลูกฝังเพื่อเพิ่มทักษะความรู้ให้แก่ตัวบัณฑิต,' +
      'ผู้ประกอบการ_ข้อ1_ดำเนินธุรกิจคุณธรรม,ผู้ประกอบการ_ข้อ2_ความรู้เชี่ยวชาญ,ผู้ประกอบการ_ข้อ3_คิดแก้ปัญหาซับซ้อน,ผู้ประกอบการ_ข้อ4_มีมนุษยสัมพันธ์,ผู้ประกอบการ_ข้อ5_ใช้คณิตศาสตร์สถิติและไอที,ผู้ประกอบการ_ข้อ6_สร้างสรรค์นวัตกรรม,ผู้ประกอบการ_ข้อ7_จิตวิญญาณผู้ประกอบการ,ผู้ประกอบการ_ข้อ8_ใช้ภาษาต่างประเทศ,ผู้ประกอบการ_ข้อ9_ตั้งคำถามเพื่อโอกาสธุรกิจ,ผู้ประกอบการ_ข้อ10_ใฝ่เรียนรู้ในโลกดิจิทัล\n';

    filteredResponses.forEach(r => {
      const statusLabel = r.status === 'employed' ? 'ทำงานแล้ว' : r.status === 'unemployed' ? 'ยังไม่มีงานทำ' : 'เหตุผลอื่นๆ';
      const degreeLabel = r.degreeLevel || 'ระดับปริญญาตรี';
      const jobTitle = r.employedDetails?.jobTitle ? `"${r.employedDetails.jobTitle.replace(/"/g, '""')}"` : '';
      const company = r.employedDetails?.companyName ? `"${r.employedDetails.companyName.replace(/"/g, '""')}"` : '';
      const dept = r.employedDetails?.companyDept ? `"${r.employedDetails.companyDept.replace(/"/g, '""')}"` : '';
      const salary = r.employedDetails?.salary || 0;
      const related = r.employedDetails ? (r.employedDetails.isRelatedToStudy ? 'ตรงสาย' : 'ไม่ตรงสาย') : '';
      const timeline = r.employedDetails?.timeToGetJob || '';
      const responseDate = formatResponseDate(r.createdAt);

      const impressionsStr = r.suggestions?.impressions ? `"${r.suggestions.impressions.replace(/"/g, '""')}"` : '""';
      const improvementsStr = r.suggestions?.improvements ? `"${r.suggestions.improvements.replace(/"/g, '""')}"` : '""';
      const skillsToCultivateStr = r.suggestions?.skillsToCultivate ? `"${r.suggestions.skillsToCultivate.replace(/"/g, '""')}"` : '""';

      // Read entrepreneur ratings 1-10
      const ratingCols = ENTREPRENEUR_QUESTIONS.map(q => {
        const score = r.employedDetails?.entrepreneurRatings?.[String(q.id)];
        return score !== undefined ? score : '';
      }).join(',');

      csvContent += `="${r.studentId}","${r.firstName}","${r.lastName}","${degreeLabel}","${r.faculty}","${r.major}","${r.academicYear}","${r.phone}","${r.email}","${responseDate}","${statusLabel}",${jobTitle},${company},${dept},${salary},"${related}","${timeline}",${impressionsStr},${improvementsStr},${skillsToCultivateStr},${ratingCols}\n`;
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `survey_responses_academic_${filterAcademicYear}_degree_${filterDegreeLevel}_status_${filterResponseStatus}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Data Filtering computations
  const filteredResponses = responses.filter(r => {
    const matchYear = filterAcademicYear === 'all' || String(r.academicYear).trim() === filterAcademicYear;
    const matchStatus = filterResponseStatus === 'all' || filterResponseStatus === 'responded';
    const matchFaculty = filterFaculty === 'all' || r.faculty === filterFaculty;
    const matchDegree = filterDegreeLevel === 'all' || normalizeDegreeLevel(r.degreeLevel) === filterDegreeLevel;
    
    const query = searchQuery.trim().toLowerCase();
    const matchSearch = !query || 
      r.studentId.includes(query) || 
      r.firstName.toLowerCase().includes(query) || 
      r.lastName.toLowerCase().includes(query) ||
      r.faculty.toLowerCase().includes(query) ||
      r.major.toLowerCase().includes(query);

    return matchYear && matchStatus && matchFaculty && matchDegree && matchSearch;
  });

  const filteredGraduates = graduates.filter(g => {
    const matchYear = filterAcademicYear === 'all' || String(g.academicYear).trim() === filterAcademicYear;
    const matchFaculty = filterFaculty === 'all' || g.faculty === filterFaculty;
    const matchDegree = filterDegreeLevel === 'all' || normalizeDegreeLevel(g.degreeLevel) === filterDegreeLevel;
    
    const hasResponded = responses.some(r => r.studentId === g.studentId);
    const matchStatus = filterResponseStatus === 'all' || 
      (filterResponseStatus === 'responded' ? hasResponded : !hasResponded);
    
    const query = searchQuery.trim().toLowerCase();
    const matchSearch = !query || 
      g.studentId.includes(query) || 
      g.fullName.toLowerCase().includes(query) ||
      g.faculty.toLowerCase().includes(query) || 
      g.major.toLowerCase().includes(query);

    return matchYear && matchStatus && matchFaculty && matchDegree && matchSearch;
  });

  // Calculate Paginated subsets
  const startIndexGrads = (graduatesPage - 1) * itemsPerPage;
  const paginatedGraduates = filteredGraduates.slice(startIndexGrads, startIndexGrads + itemsPerPage);
  const totalGradPages = Math.ceil(filteredGraduates.length / itemsPerPage) || 1;

  const startIndexResponses = (responsesPage - 1) * itemsPerPage;
  const paginatedResponses = filteredResponses.slice(startIndexResponses, startIndexResponses + itemsPerPage);
  const totalResPages = Math.ceil(filteredResponses.length / itemsPerPage) || 1;

  // Recharts Analytical computation structures
  const totalResCount = filteredResponses.length;
  const employedCount = filteredResponses.filter(r => r.status === 'employed').length;
  const unemployedCount = filteredResponses.filter(r => r.status === 'unemployed').length;
  const inactiveCount = filteredResponses.filter(r => r.status === 'not_seeking').length;

  const statusPieData = [
    { name: 'มีงานทำแล้ว', value: employedCount, color: '#4f46e5' },
    { name: 'ยังไม่มีงานทำ', value: unemployedCount, color: '#f59e0b' },
    { name: 'เหตุผลอื่นๆ', value: inactiveCount, color: '#94a3b8' }
  ].filter(d => d.value > 0);

  // Degree level distribution computation
  const bachelorCount = filteredResponses.filter(r => normalizeDegreeLevel(r.degreeLevel) === 'ระดับปริญญาตรี').length;
  const masterCount = filteredResponses.filter(r => normalizeDegreeLevel(r.degreeLevel) === 'ระดับปริญญาโท').length;
  const doctoralCount = filteredResponses.filter(r => normalizeDegreeLevel(r.degreeLevel) === 'ระดับปริญญาเอก').length;

  const degreePieData = [
    { name: 'ระดับปริญญาตรี', value: bachelorCount, color: '#4C2D81' },
    { name: 'ระดับปริญญาโท', value: masterCount, color: '#8B5CF6' },
    { name: 'ระดับปริญญาเอก', value: doctoralCount, color: '#F15A22' }
  ].filter(d => d.value > 0);

  // Salaries range bar chart
  let salariesRanges = [
    { name: 'ต่ำกว่า 15k', count: 0 },
    { name: '15k - 20k', count: 0 },
    { name: '20k - 30k', count: 0 },
    { name: '30k - 50k', count: 0 },
    { name: '50k ขึ้นไป', count: 0 }
  ];

  filteredResponses.forEach(r => {
    if (r.status === 'employed' && r.employedDetails) {
      const sal = Number(r.employedDetails.salary) || 0;
      if (sal < 15000) salariesRanges[0].count++;
      else if (sal >= 15000 && sal < 20000) salariesRanges[1].count++;
      else if (sal >= 20000 && sal < 30000) salariesRanges[2].count++;
      else if (sal >= 30000 && sal < 50000) salariesRanges[3].count++;
      else salariesRanges[4].count++;
    }
  });

  // Salary ranges per faculty (Horizontal Axis = Faculty Abbreviation)
  const facultySalaryChartData = FACULTIES.map(fac => {
    const abbr = FACULTY_ABBR_MAP[fac] || fac;
    const facEmployedResponses = filteredResponses.filter(r => {
      return r.faculty === fac && r.status === 'employed' && r.employedDetails;
    });
    
    let under15k = 0;
    let k15_20 = 0;
    let k20_30 = 0;
    let k30_50 = 0;
    let above50k = 0;
    let totalSal = 0;

    facEmployedResponses.forEach(r => {
      const sal = Number(r.employedDetails?.salary) || 0;
      totalSal += sal;
      if (sal < 15000) under15k++;
      else if (sal >= 15000 && sal < 20000) k15_20++;
      else if (sal >= 20000 && sal < 30000) k20_30++;
      else if (sal >= 30000 && sal < 50000) k30_50++;
      else above50k++;
    });

    const count = facEmployedResponses.length;
    const avgSalary = count > 0 ? Math.round(totalSal / count) : 0;

    return {
      abbr,
      facultyName: fac,
      count,
      avgSalary,
      under15k,
      k15_20,
      k20_30,
      k30_50,
      above50k
    };
  });

  // Faculty Employment Rate Chart Data (Horizontal Axis = Faculty Abbreviation, Vertical Axis = Rate %)
  const facultyEmploymentRateChartData = FACULTIES.map(fac => {
    const abbr = FACULTY_ABBR_MAP[fac] || fac;
    const facResponses = filteredResponses.filter(r => r.faculty === fac);
    const total = facResponses.length;
    const employed = facResponses.filter(r => r.status === 'employed').length;
    const unemployed = facResponses.filter(r => r.status === 'unemployed').length;
    const notSeeking = facResponses.filter(r => r.status === 'not_seeking').length;
    const base = employed + unemployed;

    const employedRate = base > 0 ? Number(((employed / base) * 100).toFixed(1)) : 0;
    const unemployedRate = base > 0 ? Number(((unemployed / base) * 100).toFixed(1)) : 0;

    const employedTotalRate = total > 0 ? Number(((employed / total) * 100).toFixed(1)) : 0;
    const unemployedTotalRate = total > 0 ? Number(((unemployed / total) * 100).toFixed(1)) : 0;
    const notSeekingTotalRate = total > 0 ? Number(((notSeeking / total) * 100).toFixed(1)) : 0;

    const activeEmployedRate = empRateChartMode === 'base' ? employedRate : employedTotalRate;
    const activeUnemployedRate = empRateChartMode === 'base' ? unemployedRate : unemployedTotalRate;
    const activeNotSeekingRate = empRateChartMode === 'base' ? 0 : notSeekingTotalRate;

    const rate = employedRate;
    const totalRate = employedTotalRate;
    const activeRate = activeEmployedRate;

    return {
      abbr,
      facultyName: fac,
      total,
      employed,
      unemployed,
      notSeeking,
      base,
      employedRate,
      unemployedRate,
      employedTotalRate,
      unemployedTotalRate,
      notSeekingTotalRate,
      activeEmployedRate,
      activeUnemployedRate,
      activeNotSeekingRate,
      rate,
      totalRate,
      activeRate,
      displayRate: activeRate > 0 ? `${activeRate}%` : (total > 0 ? '0%' : '-')
    };
  });

  // Additional Detailed Analytical Metrics
  const baseEmployedUnemployed = employedCount + unemployedCount;
  const employmentRateCalculated = baseEmployedUnemployed > 0 
    ? ((employedCount / baseEmployedUnemployed) * 100).toFixed(1) 
    : '0';

  const relatedCount = filteredResponses.filter(r => r.status === 'employed' && r.employedDetails?.isRelatedToStudy).length;
  const relatedRate = employedCount > 0 ? ((relatedCount / employedCount) * 100).toFixed(1) : '0';

  const entrepreneurCount = filteredResponses.filter(r => 
    r.status === 'employed' && 
    r.employedDetails && 
    ['6', '7'].includes(r.employedDetails.workType)
  ).length;

  const totalEmployedSalary = filteredResponses
    .filter(r => r.status === 'employed' && r.employedDetails)
    .reduce((acc, curr) => acc + (curr.employedDetails?.salary || 0), 0);
  const avgSalary = employedCount > 0 ? Math.round(totalEmployedSalary / employedCount) : 0;

  const workTypeBreakdown = WORK_TYPES.map(wt => {
    const cnt = filteredResponses.filter(r => r.status === 'employed' && r.employedDetails?.workType === wt.value).length;
    let label = wt.label.replace(/^\d+\.\s*/, '');
    return {
      value: wt.value,
      label,
      count: cnt,
      percentage: employedCount > 0 ? ((cnt / employedCount) * 100).toFixed(1) : '0'
    };
  }).filter(wt => wt.count > 0);
  const sortedWorkTypes = [...workTypeBreakdown].sort((a, b) => b.count - a.count);
  const topWorkType = sortedWorkTypes[0];

  // Job search timeline < 6 months (คิดเฉพาะผู้มีงานทำก่อน 6 เดือน: ได้งานทันที '1', 1-2 เดือน '2', 3-6 เดือน '3', ได้งานทำระหว่างศึกษา '7')
  const before6MonthsValues = ['1', '2', '3', '7'];
  const before6MonthsResponses = filteredResponses.filter(r => 
    r.status === 'employed' && 
    r.employedDetails?.timeToGetJob && 
    before6MonthsValues.includes(r.employedDetails.timeToGetJob)
  );
  const before6MonthsCount = before6MonthsResponses.length;
  const before6MonthsRate = totalResCount > 0 
    ? ((before6MonthsCount / totalResCount) * 100).toFixed(1) 
    : '0';

  const timelineBreakdown = GET_JOB_TIMELINE
    .filter(tl => before6MonthsValues.includes(tl.value))
    .map(tl => {
      const cnt = filteredResponses.filter(r => 
        r.status === 'employed' && r.employedDetails?.timeToGetJob === tl.value
      ).length;
      const label = tl.label.replace(/^\d+\.\s*/, '');
      return {
        value: tl.value,
        label,
        count: cnt,
        percentage: before6MonthsCount > 0 ? ((cnt / before6MonthsCount) * 100).toFixed(1) : '0'
      };
    }).filter(tl => tl.count > 0);
  const sortedTimeline = [...timelineBreakdown].sort((a, b) => b.count - a.count);
  const topTimeline = sortedTimeline[0];

  const allRawSuggestions = useMemo(() => {
    return filteredResponses.filter(r => 
      r.suggestions && (
        (r.suggestions.impressions && r.suggestions.impressions.trim() !== '') || 
        (r.suggestions.improvements && r.suggestions.improvements.trim() !== '') || 
        (r.suggestions.skillsToCultivate && r.suggestions.skillsToCultivate.trim() !== '')
      )
    );
  }, [filteredResponses]);

  const feedbackMetrics = useMemo(() => {
    const total = allRawSuggestions.length;
    const impressionsCount = allRawSuggestions.filter(r => r.suggestions?.impressions && r.suggestions.impressions.trim() !== '').length;
    const improvementsCount = allRawSuggestions.filter(r => r.suggestions?.improvements && r.suggestions.improvements.trim() !== '').length;
    const skillsCount = allRawSuggestions.filter(r => r.suggestions?.skillsToCultivate && r.suggestions.skillsToCultivate.trim() !== '').length;
    const employedCount = allRawSuggestions.filter(r => r.status === 'employed').length;
    const unemployedCount = allRawSuggestions.filter(r => r.status === 'unemployed').length;
    const notSeekingCount = allRawSuggestions.filter(r => r.status === 'not_seeking').length;

    // Tag counts across all raw suggestions
    const tagCounts: Record<string, number> = {};
    FEEDBACK_TAGS.forEach(tag => {
      const count = allRawSuggestions.filter(r => {
        const text = `${r.suggestions?.impressions || ''} ${r.suggestions?.improvements || ''} ${r.suggestions?.skillsToCultivate || ''}`.toLowerCase();
        return tag.keywords.some(k => text.includes(k.toLowerCase()));
      }).length;
      tagCounts[tag.id] = count;
    });

    return {
      total,
      totalResponses: filteredResponses.length,
      percentage: filteredResponses.length > 0 ? Number(((total / filteredResponses.length) * 100).toFixed(1)) : 0,
      impressionsCount,
      improvementsCount,
      skillsCount,
      employedCount,
      unemployedCount,
      notSeekingCount,
      tagCounts
    };
  }, [allRawSuggestions, filteredResponses.length]);

  const suggestionsResponses = useMemo(() => {
    return allRawSuggestions.filter(r => {
      // 1. Faculty filter
      if (feedbackFacultyFilter !== 'all' && r.faculty !== feedbackFacultyFilter) {
        return false;
      }

      // 2. Employment status filter
      if (feedbackEmploymentFilter !== 'all' && r.status !== feedbackEmploymentFilter) {
        return false;
      }

      // 3. Category filter
      if (feedbackCategoryFilter === 'impressions' && (!r.suggestions?.impressions || r.suggestions.impressions.trim() === '')) {
        return false;
      }
      if (feedbackCategoryFilter === 'improvements' && (!r.suggestions?.improvements || r.suggestions.improvements.trim() === '')) {
        return false;
      }
      if (feedbackCategoryFilter === 'skills' && (!r.suggestions?.skillsToCultivate || r.suggestions.skillsToCultivate.trim() === '')) {
        return false;
      }

      // 4. Keyword tag filter
      if (feedbackTagFilter !== 'all') {
        const tag = FEEDBACK_TAGS.find(t => t.id === feedbackTagFilter);
        if (tag) {
          const text = `${r.suggestions?.impressions || ''} ${r.suggestions?.improvements || ''} ${r.suggestions?.skillsToCultivate || ''}`.toLowerCase();
          const matchTag = tag.keywords.some(k => text.includes(k.toLowerCase()));
          if (!matchTag) return false;
        }
      }

      // 5. Search query
      const q = feedbackSearch.trim().toLowerCase();
      if (q) {
        const matchSearch = 
          (r.suggestions?.impressions || '').toLowerCase().includes(q) ||
          (r.suggestions?.improvements || '').toLowerCase().includes(q) ||
          (r.suggestions?.skillsToCultivate || '').toLowerCase().includes(q) ||
          `${r.firstName} ${r.lastName}`.toLowerCase().includes(q) ||
          r.studentId.includes(q) ||
          (r.major || '').toLowerCase().includes(q) ||
          (r.faculty || '').toLowerCase().includes(q);
        if (!matchSearch) return false;
      }

      return true;
    }).sort((a, b) => {
      if (feedbackSort === 'studentId') {
        return a.studentId.localeCompare(b.studentId);
      }
      if (feedbackSort === 'faculty') {
        return a.faculty.localeCompare(b.faculty);
      }
      if (feedbackSort === 'length') {
        const lenA = `${a.suggestions?.impressions || ''} ${a.suggestions?.improvements || ''} ${a.suggestions?.skillsToCultivate || ''}`.length;
        const lenB = `${b.suggestions?.impressions || ''} ${b.suggestions?.improvements || ''} ${b.suggestions?.skillsToCultivate || ''}`.length;
        return lenB - lenA; // longest text first
      }
      // default: latest
      return 0;
    });
  }, [allRawSuggestions, feedbackFacultyFilter, feedbackEmploymentFilter, feedbackCategoryFilter, feedbackTagFilter, feedbackSearch, feedbackSort]);

  // Pagination for feedback
  const totalFeedbackPages = Math.max(1, Math.ceil(suggestionsResponses.length / feedbackPageSize));
  const currentFeedbackPage = Math.min(feedbackPage, totalFeedbackPages);
  const pagedFeedback = useMemo(() => {
    const start = (currentFeedbackPage - 1) * feedbackPageSize;
    return suggestionsResponses.slice(start, start + feedbackPageSize);
  }, [suggestionsResponses, currentFeedbackPage, feedbackPageSize]);

  // Export Feedback to CSV
  const handleExportFeedbackCSV = () => {
    if (suggestionsResponses.length === 0) {
      alert('ไม่มีข้อมูลข้อเสนอแนะให้ส่งออก');
      return;
    }

    let csvContent = '\uFEFF'; // UTF-8 BOM
    csvContent += 'รหัสนักศึกษา,ชื่อ,นามสกุล,ระดับการศึกษา,คณะ,สาขาวิชา,ปีการศึกษา,สถานะการมีงานทำ,ตำแหน่งงาน,บริษัท,สิ่งที่ประทับใจต่อมหาวิทยาลัย,สิ่งที่มหาวิทยาลัยควรปรับปรุงหรือพัฒนาหลักสูตร,สิ่งที่มหาวิทยาลัยควรปลูกฝังเพื่อเพิ่มทักษะความรู้ให้แก่ตัวบัณฑิต\n';

    suggestionsResponses.forEach(r => {
      const statusLabel = r.status === 'employed' ? 'ทำงานแล้ว' : r.status === 'unemployed' ? 'ยังไม่มีงานทำ' : 'เหตุผลอื่นๆ';
      const degreeLabel = r.degreeLevel || 'ระดับปริญญาตรี';
      const jobTitle = r.employedDetails?.jobTitle ? `"${r.employedDetails.jobTitle.replace(/"/g, '""')}"` : '';
      const company = r.employedDetails?.companyName ? `"${r.employedDetails.companyName.replace(/"/g, '""')}"` : '';
      const impressionsStr = r.suggestions?.impressions ? `"${r.suggestions.impressions.replace(/"/g, '""')}"` : '""';
      const improvementsStr = r.suggestions?.improvements ? `"${r.suggestions.improvements.replace(/"/g, '""')}"` : '""';
      const skillsToCultivateStr = r.suggestions?.skillsToCultivate ? `"${r.suggestions.skillsToCultivate.replace(/"/g, '""')}"` : '""';

      csvContent += `="${r.studentId}","${r.firstName}","${r.lastName}","${degreeLabel}","${r.faculty}","${r.major}","${r.academicYear}","${statusLabel}",${jobTitle},${company},${impressionsStr},${improvementsStr},${skillsToCultivateStr}\n`;
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const nowStr = new Date().toISOString().slice(0, 10);
    link.setAttribute('download', `feedback_suggestions_${nowStr}_${feedbackFacultyFilter}_count_${suggestionsResponses.length}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const copyFeedbackText = (r: SurveyResponse) => {
    const parts = [];
    parts.push(`[ข้อเสนอแนะจาก ${r.firstName} ${r.lastName} (${r.studentId}) - ${r.faculty} / ${r.major}]`);
    if (r.suggestions?.impressions) parts.push(`💖 สิ่งที่ประทับใจ: ${r.suggestions.impressions}`);
    if (r.suggestions?.improvements) parts.push(`🛠️ การพัฒนาหลักสูตร: ${r.suggestions.improvements}`);
    if (r.suggestions?.skillsToCultivate) parts.push(`💡 ทักษะที่ควรปลูกฝังเพิ่ม: ${r.suggestions.skillsToCultivate}`);
    navigator.clipboard.writeText(parts.join('\n\n'));
    setCopiedFeedbackId(r.id);
    setTimeout(() => setCopiedFeedbackId(null), 2000);
  };

  // Detect corrupted or misaligned graduate entries imported before column fix
  const corruptedGraduates = graduates.filter(g => 
    (g.studentId && g.studentId.length <= 4 && /^\d+$/.test(g.studentId)) ||
    (g.academicYear && !/^\d{4}$/.test(g.academicYear.trim())) ||
    (g.faculty && /^\d{8,12}$/.test(g.faculty.trim()))
  );

  const handleDeleteCorruptedGraduates = async () => {
    if (corruptedGraduates.length === 0) return;
    triggerConfirm(
      '⚠️ ยืนยันการลบข้อมูลที่คอลัมน์สลับตำแหน่ง',
      `ระบบตรวจพบรายชื่อบัณฑิตที่คอลัมน์สลับตำแหน่งกันจำนวน ${corruptedGraduates.length} รายชื่อ (เช่น ปีการศึกษาขึ้นเป็นนามสกุล หรือ รหัสนักศึกษาขึ้นเป็น 2568)\n\nต้องการลบรายการเหล่านี้ออกจากระบบเพื่อเตรียมนำเข้าไฟล์ CSV ใหม่อย่างถูกต้องใช่หรือไม่?`,
      async () => {
        setIsDeletingBulk(true);
        try {
          let count = 0;
          for (const g of corruptedGraduates) {
            if (g.id) {
              await deleteDoc(doc(db, 'graduates', g.id));
              count++;
            }
          }
          setCsvResult(`ลบข้อมูลที่สลับตำแหน่งเรียบร้อยแล้ว (${count} รายการ) ท่านสามารถกด 'นำเข้า CSV' เพื่อนำเข้าไฟล์ใหม่อย่างถูกต้องได้ทันที`);
        } catch (err: any) {
          alert(`เกิดข้อผิดพลาดในการลบข้อมูล: ${err.message}`);
        } finally {
          setIsDeletingBulk(false);
        }
      },
      'ลบข้อมูลที่ผิดพลาด',
      'ยกเลิก'
    );
  };

  // Get all unique valid academic years present in either roster list or survey replies
  const uniqueYearsForBulkDelete = Array.from(
    new Set([
      ...graduates.map(g => g.academicYear || ''),
      ...responses.map(r => r.academicYear || ''),
      ...ACADEMIC_YEARS
    ])
  ).filter(y => y && /^\d{4}$/.test(y.trim()) && y !== '2569').sort((a, b) => b.localeCompare(a)); // Sort in descending order (e.g. 2568 first)

  return (
    <div className="max-w-7xl mx-auto py-6 px-4" id="admin-dashboard">
      
      {/* Executive Header & Control Hub */}
      <div className="bg-white/90 backdrop-blur-md rounded-3xl p-6 border border-neutral-200/80 shadow-xs mb-6 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-violet-500 to-pink-500"></div>
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-1.5">
            <div className="flex items-center space-x-2.5">
              <span className="p-2 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center">
                <SlidersHorizontal className="w-5 h-5" />
              </span>
              <h1 className="font-sans font-black text-xl sm:text-2xl text-neutral-900 tracking-tight">
                Graduate Employment Analytics & Dashboard
              </h1>
              <span className="hidden sm:inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-100/60">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                <span>Firestore Realtime Sync</span>
              </span>
            </div>
            <p className="text-xs text-neutral-500 font-sans pl-0.5">
              ระบบศูนย์กลางประมวลผลและตรวจสอบภาวะการมีงานทำของบัณฑิต มหาวิทยาลัยกรุงเทพ
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Global Filters */}
            <div className="flex items-center space-x-1.5 bg-neutral-50 p-1.5 rounded-2xl border border-neutral-200/60">
              <Filter className="w-3.5 h-3.5 text-neutral-400 ml-1.5 flex-shrink-0" />
              <select
                value={filterAcademicYear}
                onChange={(e) => setFilterAcademicYear(e.target.value)}
                className="px-2.5 py-1 bg-white border border-neutral-200 rounded-xl text-xs font-bold text-neutral-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="all">ปีการศึกษาทั้งหมด</option>
                {ACADEMIC_YEARS.map(yr => (
                  <option key={yr} value={yr}>ปีการศึกษา {yr}</option>
                ))}
              </select>

              <select
                value={filterResponseStatus}
                onChange={(e) => setFilterResponseStatus(e.target.value)}
                className="px-2.5 py-1 bg-white border border-neutral-200 rounded-xl text-xs font-bold text-neutral-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="all">สถานะตอบกลับ (ทั้งหมด)</option>
                <option value="responded">ตอบกลับแล้ว</option>
                <option value="not_responded">ยังไม่ได้ตอบกลับ</option>
              </select>

              <select
                value={filterDegreeLevel}
                onChange={(e) => setFilterDegreeLevel(e.target.value)}
                className="px-2.5 py-1 bg-white border border-neutral-200 rounded-xl text-xs font-bold text-neutral-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="all">ทุกระดับการศึกษา</option>
                {DEGREE_LEVELS.map(deg => (
                  <option key={deg.value} value={deg.value}>{deg.labelTh}</option>
                ))}
              </select>

              <select
                value={filterFaculty}
                onChange={(e) => setFilterFaculty(e.target.value)}
                className="px-2.5 py-1 bg-white border border-neutral-200 rounded-xl text-xs font-bold text-neutral-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 max-w-[160px] truncate"
              >
                <option value="all">ทุกคณะการศึกษา</option>
                {FACULTIES.map(fac => (
                  <option key={fac} value={fac}>{fac}</option>
                ))}
              </select>
            </div>

            <button
              onClick={handleExportResponses}
              className="flex items-center space-x-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-xs font-bold shadow-xs hover:shadow-sm transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              <span>ส่งออก CSV</span>
            </button>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-24 text-neutral-500 bg-white rounded-3xl border border-neutral-100 shadow-xs">
          <RefreshCw className="w-10 h-10 animate-spin text-indigo-600 mb-4" />
          <p className="font-sans text-xs font-semibold">กำลังเชื่อมต่อและประมวลผลฐานข้อมูลเรียลไทม์...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

          {/* Left Rail Sidebar - Navigation Tabs */}
          <div className="space-y-2">
            <button
              onClick={() => setActiveTab('analytics')}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl font-sans font-extrabold text-xs transition-all duration-200 ${
                activeTab === 'analytics' 
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100' 
                  : 'bg-white text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900 border border-neutral-200/60'
              }`}
            >
              <div className="flex items-center space-x-2.5">
                <BarChart3 className="w-4 h-4" />
                <span>วิเคราะห์ภาพรวม (Analytics)</span>
              </div>
              <Sparkles className={`w-3.5 h-3.5 ${activeTab === 'analytics' ? 'text-indigo-200' : 'text-neutral-400'}`} />
            </button>

            <button
              onClick={() => setActiveTab('responses')}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl font-sans font-bold text-xs transition-all duration-200 ${
                activeTab === 'responses' 
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100' 
                  : 'bg-white text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900 border border-neutral-200/60'
              }`}
            >
              <div className="flex items-center space-x-2.5">
                <FileCheck className="w-4 h-4" />
                <span>ผลการตอบแบบสำรวจ</span>
              </div>
              <span className={`px-2 py-0.5 rounded-full font-mono text-[10px] font-extrabold ${
                activeTab === 'responses' ? 'bg-indigo-500 text-white' : 'bg-neutral-100 text-neutral-600'
              }`}>
                {filteredResponses.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('graduates')}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl font-sans font-bold text-xs transition-all duration-200 ${
                activeTab === 'graduates' 
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100' 
                  : 'bg-white text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900 border border-neutral-200/60'
              }`}
            >
              <div className="flex items-center space-x-2.5">
                <Database className="w-4 h-4" />
                <span>ทำเนียบรายชื่อบัณฑิต</span>
              </div>
              <span className={`px-2 py-0.5 rounded-full font-mono text-[10px] font-extrabold ${
                activeTab === 'graduates' ? 'bg-indigo-500 text-white' : 'bg-neutral-100 text-neutral-600'
              }`}>
                {filteredGraduates.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('custom_questions')}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl font-sans font-bold text-xs transition-all duration-200 ${
                activeTab === 'custom_questions' 
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100' 
                  : 'bg-white text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900 border border-neutral-200/60'
              }`}
            >
              <div className="flex items-center space-x-2.5">
                <HelpCircle className="w-4 h-4" />
                <span>คำถามพิเศษ</span>
              </div>
              <span className={`px-2 py-0.5 rounded-full font-mono text-[10px] font-extrabold ${
                activeTab === 'custom_questions' ? 'bg-indigo-500 text-white' : 'bg-neutral-100 text-neutral-600'
              }`}>
                {customQuestions.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('admins')}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl font-sans font-bold text-xs transition-all duration-200 ${
                activeTab === 'admins' 
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100' 
                  : 'bg-white text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900 border border-neutral-200/60'
              }`}
            >
              <div className="flex items-center space-x-2.5">
                <Shield className="w-4 h-4" />
                <span>ผู้ดูแลระบบ</span>
              </div>
              <span className={`px-2 py-0.5 rounded-full font-mono text-[10px] font-extrabold ${
                activeTab === 'admins' ? 'bg-indigo-500 text-white' : 'bg-neutral-100 text-neutral-600'
              }`}>
                {adminsList.length}
              </span>
            </button>

            {/* Quick Summary Card */}
            <div className="bg-gradient-to-br from-neutral-900 to-indigo-950 rounded-3xl p-5 text-white mt-6 shadow-md border border-neutral-800 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10 text-white pointer-events-none">
                <GraduationCap className="w-24 h-24" />
              </div>
              <h4 className="font-sans font-black text-[11px] text-indigo-300 uppercase tracking-widest mb-3 flex items-center space-x-1.5">
                <Activity className="w-3.5 h-3.5 text-indigo-400" />
                <span>Survey Status Overview</span>
              </h4>
              <div className="space-y-3 font-sans">
                <div>
                  <div className="flex justify-between text-xs font-bold mb-1">
                    <span className="text-neutral-400">Response Rate</span>
                    <span className="text-indigo-300 font-mono">{graduates.length > 0 ? ((responses.length / graduates.length) * 100).toFixed(1) : '0'}%</span>
                  </div>
                  <div className="w-full h-2 bg-neutral-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-indigo-500 to-emerald-400 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, graduates.length > 0 ? (responses.length / graduates.length) * 100 : 0)}%` }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-neutral-800/80 text-[11px]">
                  <div className="bg-white/5 p-2 rounded-xl">
                    <span className="text-[9px] text-neutral-400 uppercase font-bold block">Submitted</span>
                    <span className="text-sm font-black font-mono text-white">{responses.length}</span>
                  </div>
                  <div className="bg-white/5 p-2 rounded-xl">
                    <span className="text-[9px] text-neutral-400 uppercase font-bold block">Roster Size</span>
                    <span className="text-sm font-black font-mono text-white">{graduates.length}</span>
                  </div>
                </div>

                {graduates.length === 0 && (
                  <button 
                    onClick={seedMockGraduates}
                    className="w-full mt-2 py-2 px-3 bg-indigo-600 hover:bg-indigo-500 text-[11px] text-white rounded-xl flex items-center justify-center space-x-1 font-bold transition-all shadow-xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Seed Demo Data</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Right Area - Content Panel */}
          <div className="lg:col-span-3">

            {/* ERROR NOTIFICATION PANEL */}
            {errorMsg && (
              <div className="mb-4 flex items-center justify-between p-4 bg-red-50 border border-red-200 rounded-2xl text-red-800 text-xs font-sans">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                  <span>{errorMsg}</span>
                </div>
                <button onClick={() => setErrorMsg('')} className="text-red-500 hover:text-red-800 text-xs font-bold">✕</button>
              </div>
            )}

            {/* TAB CONTENT: ANALYTICS VISUALIZATIONS */}
            {activeTab === 'analytics' && (
              <div className="space-y-6">
                
                {/* 5 High-Impact Bento Stat Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                  
                  {/* Stat Card 1: จำนวนผู้ตอบแบบสำรวจ */}
                  <div className="bg-white rounded-3xl p-5 border border-neutral-200/70 shadow-xs hover:shadow-md transition-all group relative overflow-hidden flex flex-col justify-between">
                    <div className="absolute top-0 right-0 p-3 opacity-5 group-hover:opacity-10 transition-opacity">
                      <Target className="w-20 h-20 text-indigo-600" />
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-[10px] font-black text-neutral-400 uppercase tracking-wider block">1. จำนวนผู้ตอบแบบสำรวจ</span>
                        <span className="w-9 h-9 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-sm font-bold">🎯</span>
                      </div>
                      <div className="flex items-baseline space-x-2">
                        <span className="text-3xl font-black text-neutral-900 font-mono tracking-tight">{totalResCount}</span>
                        <span className="text-xs font-bold text-neutral-500">คน</span>
                      </div>
                    </div>
                    <div className="mt-3 pt-2.5 border-t border-neutral-100 flex items-center justify-between text-[11px]">
                      <span className="text-neutral-500 font-medium truncate">
                        {filterFaculty !== 'all' || filterDegreeLevel !== 'all' || filterAcademicYear !== 'all'
                          ? 'จากบัณฑิตในเงื่อนไข'
                          : 'จากบัณฑิตทั้งหมด'}
                      </span>
                      <span className="font-mono font-extrabold text-indigo-600 ml-1">
                        {filteredGraduates.length > 0 
                          ? `${((totalResCount / filteredGraduates.length) * 100).toFixed(1)}% (${totalResCount}/${filteredGraduates.length})`
                          : graduates.length > 0 
                            ? `${((totalResCount / graduates.length) * 100).toFixed(1)}% (${totalResCount}/${graduates.length})`
                            : '0%'}
                      </span>
                    </div>
                  </div>

                  {/* Stat Card 2: อัตราการมีงานทำ (ฐาน: มีงานทำ / มีงานทำ+ยังไม่มีงานทำ) */}
                  <div className="bg-white rounded-3xl p-5 border border-neutral-200/70 shadow-xs hover:shadow-md transition-all group relative overflow-hidden flex flex-col justify-between">
                    <div className="absolute top-0 right-0 p-3 opacity-5 group-hover:opacity-10 transition-opacity">
                      <Briefcase className="w-20 h-20 text-emerald-600" />
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-[10px] font-black text-neutral-400 uppercase tracking-wider block">2. อัตราการมีงานทำ</span>
                        <span className="w-9 h-9 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-sm font-bold">💼</span>
                      </div>
                      <div className="flex items-baseline space-x-2">
                        <span className="text-3xl font-black text-emerald-600 font-mono tracking-tight">
                          {employmentRateCalculated}
                        </span>
                        <span className="text-xs font-bold text-emerald-600">%</span>
                      </div>
                    </div>
                    <div className="mt-3 pt-2.5 border-t border-neutral-100 flex items-center justify-between text-[10px] sm:text-[11px]">
                      <span className="text-neutral-500 font-medium truncate" title="ฐานคำนวณ = มีงานทำ / (มีงานทำ + ยังไม่มีงานทำ)">มีงานทำ / ผู้ประสงค์มีงาน</span>
                      <span className="font-mono font-extrabold text-emerald-700 ml-1">
                        {employedCount} / {baseEmployedUnemployed} คน
                        {inactiveCount > 0 && <span className="text-neutral-400 font-normal text-[9.5px] ml-1">(ศึกษาต่อ/อื่นๆ {inactiveCount})</span>}
                      </span>
                    </div>
                  </div>

                  {/* Stat Card 3: ประเภทงานที่ทำ */}
                  <div className="bg-white rounded-3xl p-5 border border-neutral-200/70 shadow-xs hover:shadow-md transition-all group relative overflow-hidden flex flex-col justify-between">
                    <div className="absolute top-0 right-0 p-3 opacity-5 group-hover:opacity-10 transition-opacity">
                      <Building2 className="w-20 h-20 text-blue-600" />
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-black text-neutral-400 uppercase tracking-wider block">3. ประเภทงานที่ทำ</span>
                        <span className="w-9 h-9 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center text-sm font-bold">🏢</span>
                      </div>
                      <div className="mt-1">
                        <p className="text-xs font-black text-blue-950 leading-snug line-clamp-2 min-h-[2rem]" title={topWorkType ? topWorkType.label : 'ไม่มีข้อมูล'}>
                          {topWorkType ? topWorkType.label : 'ไม่มีข้อมูล'}
                        </p>
                        <div className="flex items-baseline space-x-1.5 mt-1">
                          <span className="text-2xl font-black text-blue-600 font-mono">{topWorkType ? topWorkType.count : 0}</span>
                          <span className="text-xs font-bold text-neutral-500">คน</span>
                          {topWorkType && (
                            <span className="text-xs font-bold text-blue-500 ml-1">({topWorkType.percentage}%)</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="mt-3 pt-2.5 border-t border-neutral-100 flex items-center justify-between text-[11px]">
                      <span className="text-neutral-500 font-medium truncate">ประเภทงานสูงสุด</span>
                      <span className="font-mono font-bold text-blue-700 ml-1">อันดับ 1</span>
                    </div>
                  </div>

                  {/* Stat Card 4: ค่าเฉลี่ยเงินเดือน */}
                  <div className="bg-white rounded-3xl p-5 border border-neutral-200/70 shadow-xs hover:shadow-md transition-all group relative overflow-hidden flex flex-col justify-between">
                    <div className="absolute top-0 right-0 p-3 opacity-5 group-hover:opacity-10 transition-opacity">
                      <DollarSign className="w-20 h-20 text-violet-600" />
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-[10px] font-black text-neutral-400 uppercase tracking-wider block">4. ค่าเฉลี่ยเงินเดือน</span>
                        <span className="w-9 h-9 rounded-2xl bg-violet-50 text-violet-600 flex items-center justify-center text-sm font-bold">💳</span>
                      </div>
                      <div className="flex items-baseline space-x-1">
                        <span className="text-2xl sm:text-3xl font-black text-violet-700 font-mono tracking-tight">
                          {avgSalary > 0 ? avgSalary.toLocaleString() : '0'}
                        </span>
                        <span className="text-xs font-bold text-neutral-500">฿/เดือน</span>
                      </div>
                    </div>
                    <div className="mt-3 pt-2.5 border-t border-neutral-100 flex items-center justify-between text-[11px]">
                      <span className="text-neutral-500 font-medium truncate">เฉลี่ยบัณฑิตมีงานทำ</span>
                      <span className="font-mono font-bold text-violet-600 ml-1">{employedCount} คน</span>
                    </div>
                  </div>

                  {/* Stat Card 5: ระยะเวลาในการหางานทำ (คิดเฉพาะผู้มีงานทำก่อน 6 เดือน) */}
                  <div className="bg-white rounded-3xl p-5 border border-neutral-200/70 shadow-xs hover:shadow-md transition-all group relative overflow-hidden flex flex-col justify-between">
                    <div className="absolute top-0 right-0 p-3 opacity-5 group-hover:opacity-10 transition-opacity">
                      <Clock className="w-20 h-20 text-amber-600" />
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-black text-neutral-400 uppercase tracking-wider block" title="คิดเฉพาะผู้มีงานทำก่อน 6 เดือน">5. ระยะเวลาหางาน (ก่อน 6 เดือน)</span>
                        <span className="w-9 h-9 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center text-sm font-bold">⏱️</span>
                      </div>
                      <div className="flex items-baseline space-x-1.5 mt-1">
                        <span className="text-3xl font-black text-amber-600 font-mono tracking-tight">{before6MonthsRate}</span>
                        <span className="text-xs font-bold text-amber-600">%</span>
                      </div>
                      <p className="text-[11px] text-neutral-500 font-medium mt-1">
                        ได้งานก่อน 6 เดือน ({before6MonthsCount} คน)
                      </p>
                    </div>
                    <div className="mt-3 pt-2.5 border-t border-neutral-100 flex items-center justify-between text-[11px]">
                      <span className="text-neutral-500 font-medium truncate" title="คิดจากผู้ตอบแบบสำรวจทั้งหมด">ฐานผู้ตอบแบบสำรวจ</span>
                      <span className="font-mono font-extrabold text-amber-700 ml-1">{before6MonthsCount} / {totalResCount} คน</span>
                    </div>
                  </div>

                </div>

                {/* Sub-Navigation Bar for Deep Analytics Views */}
                <div className="bg-white rounded-2xl p-2 border border-neutral-200/80 shadow-xs flex flex-wrap items-center gap-1.5">
                  <button
                    onClick={() => setAnalyticsSubTab('overview')}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-extrabold transition-all ${
                      analyticsSubTab === 'overview'
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'text-neutral-600 hover:bg-neutral-100/80'
                    }`}
                  >
                    <BarChart3 className="w-3.5 h-3.5" />
                    <span>ภาพรวม & กราฟสถิติ</span>
                  </button>

                  <button
                    onClick={() => setAnalyticsSubTab('faculties')}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-extrabold transition-all ${
                      analyticsSubTab === 'faculties'
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'text-neutral-600 hover:bg-neutral-100/80'
                    }`}
                  >
                    <Building2 className="w-3.5 h-3.5" />
                    <span>จำแนกตามรายคณะ</span>
                  </button>

                  <button
                    onClick={() => setAnalyticsSubTab('timeline')}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-extrabold transition-all ${
                      analyticsSubTab === 'timeline'
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'text-neutral-600 hover:bg-neutral-100/80'
                    }`}
                  >
                    <Clock className="w-3.5 h-3.5" />
                    <span>ระยะเวลาการได้งานทำ</span>
                  </button>

                  <button
                    onClick={() => setAnalyticsSubTab('feedback')}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-extrabold transition-all ${
                      analyticsSubTab === 'feedback'
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'text-neutral-600 hover:bg-neutral-100/80'
                    }`}
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>เสียงสะท้อน & ข้อเสนอแนะ ({allRawSuggestions.length.toLocaleString()})</span>
                  </button>
                </div>

                {/* ANALYTICS SUB-TAB 1: OVERVIEW & CHARTS */}
                {analyticsSubTab === 'overview' && (
                  <div className="space-y-6">
                    {totalResCount === 0 && (
                      <div className="bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-indigo-500/10 border border-amber-200/90 rounded-3xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4 text-amber-950 font-sans shadow-xs">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center flex-shrink-0 font-bold">
                            <AlertCircle className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="font-extrabold text-xs">ยังไม่มีข้อมูลผู้ตอบแบบสำรวจจริงในฐานข้อมูลตามตัวกรองที่เลือก</p>
                            <p className="text-[11px] text-amber-800">กราฟแท่งด้านล่างแสดงโครงสร้างรายคณะเตรียมพร้อมรับข้อมูล ท่านสามารถคลิกปุ่มสร้างข้อมูลตัวอย่างเพื่อแสดงกราฟแท่งแบบสมบูรณ์ได้ทันที</p>
                          </div>
                        </div>
                        <button
                          onClick={seedSampleSurveyResponses}
                          disabled={isSeedingResponses}
                          className="px-4 py-2.5 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white font-extrabold text-xs rounded-xl shadow-xs transition-all flex items-center space-x-2 flex-shrink-0 cursor-pointer disabled:opacity-50"
                        >
                          <Plus className="w-4 h-4" />
                          <span>{isSeedingResponses ? 'กำลังสร้างข้อมูล...' : 'สร้างข้อมูลตัวอย่างตอบแบบสำรวจ (39 รายการ)'}</span>
                        </button>
                      </div>
                    )}

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        
                        {/* Status Pie Chart */}
                        <div className="bg-white rounded-3xl p-6 border border-neutral-200/80 shadow-xs">
                          <h4 className="font-sans font-black text-xs text-neutral-800 uppercase tracking-wider mb-4 flex items-center space-x-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-indigo-600"></span>
                            <span>สัดส่วนภาวะการมีงานทำ (%)</span>
                          </h4>
                          <div className="h-64 sm:h-72">
                            <ResponsiveContainer width="100%" height="100%">
                              <PieChart>
                                <Pie
                                  data={statusPieData}
                                  cx="50%"
                                  cy="50%"
                                  innerRadius={55}
                                  outerRadius={80}
                                  paddingAngle={6}
                                  dataKey="value"
                                >
                                  {statusPieData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} stroke="#fff" strokeWidth={2} />
                                  ))}
                                </Pie>
                                <Tooltip 
                                  contentStyle={{ borderRadius: '14px', fontSize: '11px', border: '1px solid #f0f0f0', boxShadow: '0 4px 16px rgba(0,0,0,0.06)' }}
                                  formatter={(value) => [`${value} คน`, 'จำนวนบัณฑิต']} 
                                />
                                <Legend 
                                  verticalAlign="bottom" 
                                  height={36} 
                                  iconType="circle" 
                                  wrapperStyle={{ fontSize: '11px', fontFamily: 'sans-serif' }}
                                />
                              </PieChart>
                            </ResponsiveContainer>
                          </div>
                        </div>

                        {/* Degree Level Distribution Pie Chart */}
                        <div className="bg-white rounded-3xl p-6 border border-neutral-200/80 shadow-xs">
                          <h4 className="font-sans font-black text-xs text-neutral-800 uppercase tracking-wider mb-4 flex items-center space-x-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-[#4C2D81]"></span>
                            <span>สัดส่วนระดับการศึกษา (%)</span>
                          </h4>
                          <div className="h-64 sm:h-72">
                            {degreePieData.length === 0 ? (
                              <div className="h-full flex items-center justify-center text-neutral-400 text-xs font-sans">
                                ยังไม่มีข้อมูลระดับการศึกษา
                              </div>
                            ) : (
                              <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                  <Pie
                                    data={degreePieData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={55}
                                    outerRadius={80}
                                    paddingAngle={6}
                                    dataKey="value"
                                  >
                                    {degreePieData.map((entry, index) => (
                                      <Cell key={`degree-cell-${index}`} fill={entry.color} stroke="#fff" strokeWidth={2} />
                                    ))}
                                  </Pie>
                                  <Tooltip 
                                    contentStyle={{ borderRadius: '14px', fontSize: '11px', border: '1px solid #f0f0f0', boxShadow: '0 4px 16px rgba(0,0,0,0.06)' }}
                                    formatter={(value) => [`${value} คน`, 'จำนวนผู้ตอบ']} 
                                  />
                                  <Legend 
                                    verticalAlign="bottom" 
                                    height={36} 
                                    iconType="circle" 
                                    wrapperStyle={{ fontSize: '11px', fontFamily: 'sans-serif' }}
                                  />
                                </PieChart>
                              </ResponsiveContainer>
                            )}
                          </div>
                        </div>

                        {/* Summary Rate Quick Insights Card */}
                        <div className="bg-white rounded-3xl p-6 border border-neutral-200/80 shadow-xs space-y-4 flex flex-col justify-between">
                          <div>
                            <h4 className="font-sans font-black text-xs text-neutral-800 uppercase tracking-wider mb-3 flex items-center space-x-2">
                              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                              <span>สรุปสถิติอัตราการมีงานทำรวม (Employment Summary)</span>
                            </h4>
                            <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-indigo-500/10 border border-emerald-100/80 space-y-2">
                              <p className="text-xs text-neutral-600 font-medium">อัตราการมีงานทำเฉลี่ยทุกคณะ</p>
                              <div className="flex items-baseline space-x-2">
                                <span className="font-mono text-3xl font-black text-emerald-700">{employmentRateCalculated}%</span>
                                <span className="text-xs font-bold text-emerald-600">({employedCount} จาก {baseEmployedUnemployed} คน)</span>
                              </div>
                              <p className="text-[11px] text-neutral-400 italic pt-1 border-t border-emerald-100/60">
                                *คำนวณตามเกณฑ์กระทรวง (ผู้มีงานทำ / (ผู้มีงานทำ + ผู้ยังไม่มีงานทำ))
                              </p>
                            </div>
                          </div>

                          <div className="space-y-2 text-xs">
                            <div className="flex justify-between items-center p-2.5 rounded-xl bg-neutral-50 border border-neutral-100">
                              <span className="text-neutral-600 font-bold">คณะที่มีอัตรามีงานทำสูงสุด:</span>
                              <span className="font-mono font-black text-indigo-700">
                                {(() => {
                                  const sorted = [...facultyEmploymentRateChartData].filter(f => f.base > 0).sort((a, b) => b.rate - a.rate);
                                  return sorted.length > 0 ? `${sorted[0].abbr} (${sorted[0].rate}%)` : '-';
                                })()}
                              </span>
                            </div>
                            <div className="flex justify-between items-center p-2.5 rounded-xl bg-neutral-50 border border-neutral-100">
                              <span className="text-neutral-600 font-bold">จำนวนคณะที่สำรวจทั้งหมด:</span>
                              <span className="font-mono font-black text-neutral-800">{FACULTIES.length} คณะ</span>
                            </div>
                          </div>
                        </div>

                        {/* Faculty Employment Rate Bar Chart */}
                        <div className="md:col-span-2">
                          <FacultyEmploymentRateChart
                            id="faculty-employment-rate-chart-overview"
                            data={facultyEmploymentRateChartData}
                            employmentRateCalculated={employmentRateCalculated}
                            totalResponsesCount={filteredResponses.length}
                            empRateChartMode={empRateChartMode}
                            setEmpRateChartMode={setEmpRateChartMode}
                            title="กราฟแท่งเปรียบเทียบการมีงานทำในแต่ละคณะ (Faculty Employment Comparison)"
                            description="เปรียบเทียบร้อยละการมีงานทำและจำนวนผู้มีงานทำจำแนกตามรายคณะการศึกษาของมหาวิทยาลัยกรุงเทพ"
                          />
                        </div>

                        {/* Faculty Average Salary Bar Chart */}
                        <div className="md:col-span-2 bg-white rounded-3xl p-6 border border-neutral-200/80 shadow-xs space-y-4">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-neutral-100">
                            <div>
                              <h4 className="font-sans font-black text-xs text-neutral-800 uppercase tracking-wider flex items-center space-x-2">
                                <span className="w-2.5 h-2.5 rounded-full bg-violet-600"></span>
                                <span>ค่าเฉลี่ยเงินเดือนจำแนกตามรายคณะ (Faculty Average Salary)</span>
                              </h4>
                              <p className="text-[11px] text-neutral-400 font-sans mt-0.5">
                                แกนแนวตั้ง: ค่าเฉลี่ยเงินเดือน (บาท) / ช่วงเงินเดือน | แกนแนวนอน: คณะการศึกษา (อักษรย่อ)
                              </p>
                            </div>
                            <div className="flex items-center bg-neutral-100 p-1 rounded-xl text-[11px] font-bold self-start sm:self-auto">
                              <button
                                onClick={() => setSalaryChartMode('average')}
                                className={`px-3 py-1 rounded-lg transition-all ${
                                  salaryChartMode === 'average' 
                                    ? 'bg-white text-violet-700 shadow-xs' 
                                    : 'text-neutral-500 hover:text-neutral-800'
                                }`}
                              >
                                ค่าเฉลี่ยเงินเดือน (บาท)
                              </button>
                              <button
                                onClick={() => setSalaryChartMode('ranges')}
                                className={`px-3 py-1 rounded-lg transition-all ${
                                  salaryChartMode === 'ranges' 
                                    ? 'bg-white text-violet-700 shadow-xs' 
                                    : 'text-neutral-500 hover:text-neutral-800'
                                }`}
                              >
                                ช่วงเงินเดือน (สัดส่วน)
                              </button>
                            </div>
                          </div>

                          <div className="h-72 sm:h-80">
                            <ResponsiveContainer width="100%" height="100%">
                              {salaryChartMode === 'ranges' ? (
                                <BarChart data={facultySalaryChartData} margin={{ top: 15, right: 15, left: -20, bottom: 20 }}>
                                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                  <XAxis 
                                    dataKey="abbr" 
                                    stroke="#475569" 
                                    fontSize={11} 
                                    fontWeight={800} 
                                    tickLine={false} 
                                    axisLine={{ stroke: '#cbd5e1' }} 
                                    interval={0}
                                  />
                                  <YAxis allowDecimals={false} stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                                  <Tooltip 
                                    content={({ active, payload }) => {
                                      if (active && payload && payload.length) {
                                        const data = payload[0].payload;
                                        return (
                                          <div className="bg-white/95 backdrop-blur-md p-3.5 rounded-2xl border border-neutral-100 shadow-xl text-xs font-sans space-y-2 min-w-[210px]">
                                            <div className="border-b border-neutral-100 pb-1.5">
                                              <p className="font-extrabold text-neutral-900">{data.facultyName}</p>
                                              <span className="inline-block px-2 py-0.5 rounded-md bg-violet-50 text-violet-700 text-[10px] font-black mt-1">
                                                อักษรย่อ: {data.abbr}
                                              </span>
                                            </div>
                                            <div className="space-y-1 text-[11px]">
                                              <div className="flex justify-between text-neutral-600">
                                                <span>ผู้มีงานทำ:</span>
                                                <span className="font-mono font-bold text-neutral-900">{data.count} คน</span>
                                              </div>
                                              <div className="flex justify-between text-neutral-600">
                                                <span>ค่าเฉลี่ยเงินเดือน:</span>
                                                <span className="font-mono font-bold text-violet-700">{data.avgSalary > 0 ? `${data.avgSalary.toLocaleString()} ฿` : '-'}</span>
                                              </div>
                                              <div className="pt-1.5 border-t border-neutral-100 space-y-1 text-[10.5px]">
                                                <div className="flex justify-between text-amber-600">
                                                  <span>ต่ำกว่า 15k:</span>
                                                  <span className="font-mono font-bold">{data.under15k} คน</span>
                                                </div>
                                                <div className="flex justify-between text-indigo-600">
                                                  <span>15k - 20k:</span>
                                                  <span className="font-mono font-bold">{data.k15_20} คน</span>
                                                </div>
                                                <div className="flex justify-between text-purple-600">
                                                  <span>20k - 30k:</span>
                                                  <span className="font-mono font-bold">{data.k20_30} คน</span>
                                                </div>
                                                <div className="flex justify-between text-emerald-600">
                                                  <span>30k - 50k:</span>
                                                  <span className="font-mono font-bold">{data.k30_50} คน</span>
                                                </div>
                                                <div className="flex justify-between text-pink-600">
                                                  <span>50k ขึ้นไป:</span>
                                                  <span className="font-mono font-bold">{data.above50k} คน</span>
                                                </div>
                                              </div>
                                            </div>
                                          </div>
                                        );
                                      }
                                      return null;
                                    }}
                                  />
                                  <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '11px', fontFamily: 'sans-serif' }} />
                                  <Bar dataKey="under15k" name="ต่ำกว่า 15k" stackId="salaryStack" fill="#f59e0b" />
                                  <Bar dataKey="k15_20" name="15k - 20k" stackId="salaryStack" fill="#6366f1" />
                                  <Bar dataKey="k20_30" name="20k - 30k" stackId="salaryStack" fill="#8b5cf6" />
                                  <Bar dataKey="k30_50" name="30k - 50k" stackId="salaryStack" fill="#10b981" />
                                  <Bar dataKey="above50k" name="50k ขึ้นไป" stackId="salaryStack" fill="#ec4899" radius={[6, 6, 0, 0]} />
                                </BarChart>
                              ) : (
                                <BarChart data={facultySalaryChartData} margin={{ top: 28, right: 15, left: 10, bottom: 20 }}>
                                  <defs>
                                    <linearGradient id="facSalaryGrad" x1="0" y1="0" x2="0" y2="1">
                                      <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.95}/>
                                      <stop offset="95%" stopColor="#a78bfa" stopOpacity={0.4}/>
                                    </linearGradient>
                                  </defs>
                                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                  <XAxis 
                                    dataKey="abbr" 
                                    stroke="#475569" 
                                    fontSize={11} 
                                    fontWeight={800} 
                                    tickLine={false} 
                                    axisLine={{ stroke: '#cbd5e1' }} 
                                    interval={0}
                                  />
                                  <YAxis 
                                    stroke="#64748b" 
                                    fontSize={11} 
                                    tickLine={false} 
                                    axisLine={false}
                                    domain={[0, (dataMax: number) => Math.max(35000, Math.ceil((dataMax * 1.15) / 5000) * 5000)]}
                                    tickFormatter={(val) => `${(val / 1000).toFixed(0)}k`}
                                  />
                                  {avgSalary > 0 && (
                                    <ReferenceLine 
                                      y={avgSalary} 
                                      stroke="#dc2626" 
                                      strokeDasharray="4 4" 
                                      strokeWidth={1.5}
                                      label={{ 
                                        value: `เฉลี่ยรวม ${avgSalary.toLocaleString()} ฿`, 
                                        fill: '#dc2626', 
                                        fontSize: 10.5, 
                                        fontWeight: 800, 
                                        position: 'top' 
                                      }}
                                    />
                                  )}
                                  <Tooltip 
                                    contentStyle={{ borderRadius: '14px', fontSize: '11px', border: '1px solid #f0f0f0', boxShadow: '0 4px 16px rgba(0,0,0,0.06)' }}
                                    formatter={(value, _name, item: any) => [`${Number(value).toLocaleString()} บาท`, `เงินเดือนเฉลี่ย (${item?.payload?.facultyName || ''})`]}
                                  />
                                  <Bar dataKey="avgSalary" name="เงินเดือนเฉลี่ย (บาท)" fill="url(#facSalaryGrad)" radius={[8, 8, 0, 0]}>
                                    <LabelList 
                                      dataKey="avgSalary" 
                                      position="top" 
                                      fill="#000000" 
                                      fontSize={10.5} 
                                      fontWeight={900} 
                                      offset={6}
                                      formatter={(val: number) => (val > 0 ? `${Number(val).toLocaleString()} ฿` : '')} 
                                    />
                                  </Bar>
                                </BarChart>
                              )}
                            </ResponsiveContainer>
                          </div>

                          {/* Index Table of Faculty Abbreviations */}
                          <div className="pt-3 border-t border-neutral-100">
                            <p className="text-[10.5px] font-black text-neutral-400 uppercase tracking-wider mb-2">
                              ดรรชนีอักษรย่อคณะการศึกษาและค่าเฉลี่ยเงินเดือน (Faculty Abbreviation & Average Salary)
                            </p>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-1.5 text-[10.5px]">
                              {Object.entries({
                                "TI": "คณะเทคโนโลยีสารสนเทศและนวัตกรรม",
                                "EN": "คณะวิศวกรรมศาสตร์",
                                "AC": "คณะบัญชี",
                                "BA": "คณะบริหารธุรกิจ",
                                "EC": "คณะเศรษฐศาสตร์และการลงทุน",
                                "LA": "คณะนิติศาสตร์",
                                "CA": "คณะนิเทศศาสตร์",
                                "HTM": "คณะมนุษยศาสตร์และการจัดการการท่องเที่ยว",
                                "FA": "คณะศิลปกรรมศาสตร์",
                                "AR": "คณะสถาปัตยกรรมศาสตร์",
                                "SEM": "คณะการสร้างเจ้าของธุรกิจและการบริหารกิจการ",
                                "DC": "คณะดิจิทัลมีเดียและศิลปภาพยนตร์",
                                "BUI": "วิทยาลัยนานาชาติ (BUI)",
                                "BUCI": "วิทยาลัยนานาชาติจีน"
                              }).map(([abbr, name]) => {
                                const facStat = facultySalaryChartData.find(f => f.abbr === abbr);
                                const avgStr = facStat && facStat.avgSalary > 0 ? `${facStat.avgSalary.toLocaleString()} ฿` : '-';
                                return (
                                  <div key={abbr} className="bg-neutral-50 px-2 py-1.5 rounded-lg border border-neutral-100 flex items-center justify-between space-x-1.5">
                                    <div className="flex items-center space-x-1.5 min-w-0">
                                      <span className="font-mono font-black text-violet-700 bg-violet-100/80 px-1.5 py-0.5 rounded text-[10px] flex-shrink-0">{abbr}</span>
                                      <span className="text-neutral-600 truncate font-medium" title={name}>{name}</span>
                                    </div>
                                    <span className="font-mono font-black text-neutral-900 text-[10px] flex-shrink-0 ml-1">
                                      {avgStr}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </div>

                        {/* Work Type Breakdown Progress Bars */}
                        <div className="md:col-span-2 bg-white rounded-3xl p-6 border border-neutral-200/80 shadow-xs space-y-4">
                          <h4 className="font-sans font-black text-xs text-neutral-800 uppercase tracking-wider flex items-center space-x-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                            <span>สัดส่วนจำแนกตามประเภทของหน่วยงานและอาชีพ (Work Category Breakdown)</span>
                          </h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                            {workTypeBreakdown.map((wt) => (
                              <div key={wt.value} className="bg-neutral-50/70 p-3.5 rounded-2xl border border-neutral-100">
                                <div className="flex justify-between items-center mb-1.5 text-xs font-bold">
                                  <span className="text-neutral-700 truncate pr-2">{wt.label}</span>
                                  <span className="font-mono text-indigo-600 flex-shrink-0">{wt.count} คน ({wt.percentage}%)</span>
                                </div>
                                <div className="w-full h-2 bg-neutral-200/60 rounded-full overflow-hidden">
                                  <div 
                                    className="h-full bg-indigo-600 rounded-full transition-all duration-500"
                                    style={{ width: `${wt.percentage}%` }}
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                      </div>
                  </div>
                )}

                {/* ANALYTICS SUB-TAB 2: FACULTY DETAILED BREAKDOWN */}
                {analyticsSubTab === 'faculties' && (
                  <div className="space-y-6">
                    {/* Faculty Employment Rate Bar Chart */}
                    <FacultyEmploymentRateChart
                      id="faculty-employment-rate-chart-faculties"
                      data={facultyEmploymentRateChartData}
                      employmentRateCalculated={employmentRateCalculated}
                      totalResponsesCount={filteredResponses.length}
                      empRateChartMode={empRateChartMode}
                      setEmpRateChartMode={setEmpRateChartMode}
                      title="กราฟแท่งเปรียบเทียบการมีงานทำในแต่ละคณะ (Faculty Employment Comparison)"
                      description="เปรียบเทียบร้อยละการมีงานทำและจำนวนผู้มีงานทำจำแนกตามรายคณะการศึกษาของมหาวิทยาลัยกรุงเทพ"
                    />

                    <div className="bg-white rounded-3xl p-6 border border-neutral-200/80 shadow-xs space-y-5">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-3 border-b border-neutral-100 gap-2">
                        <div>
                          <h3 className="font-sans font-black text-sm text-neutral-900">
                            ตารางสรุปสถิติจำแนกตามรายคณะการศึกษา (Faculty Detailed Data)
                          </h3>
                          <p className="text-[11px] text-neutral-400 font-sans">
                            สรุปสัดส่วนผู้ตอบแบบสำรวจ อัตราการมีงานทำ อัตราการทำงานตรงสาย และเงินเดือนเฉลี่ยแยกประเภทวิชาการ
                          </p>
                        </div>
                        <span className="text-[11px] font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-xl self-start sm:self-auto">
                          มีข้อมูลตอบกลับ {FACULTIES.filter(fac => filteredResponses.some(r => normalizeFacultyName(r.faculty, r.major, r.studentId, graduates) === fac)).length} คณะ
                        </span>
                      </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="border-b border-neutral-200 text-[10px] font-extrabold text-neutral-400 uppercase tracking-wider h-10">
                            <th className="pb-2 pl-2">คณะการศึกษา</th>
                            <th className="pb-2 text-center">ผู้ตอบ (% Share)</th>
                            <th className="pb-2 text-center">มีงานทำ (คน)</th>
                            <th className="pb-2 text-center">ยังไม่มีงานทำ (คน)</th>
                            <th className="pb-2 text-center">อัตราการมีงานทำ (%)</th>
                            <th className="pb-2 text-center">ทำงานตรงสาย (%)</th>
                            <th className="pb-2 text-right pr-2">เงินเดือนเฉลี่ย (บาท)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-100 font-sans">
                          {FACULTIES.map(fac => {
                            const facResponses = filteredResponses.filter(r => r.faculty === fac);
                            const total = facResponses.length;
                            const employed = facResponses.filter(r => r.status === 'employed').length;
                            const unemployed = facResponses.filter(r => r.status === 'unemployed').length;
                            const notSeeking = facResponses.filter(r => r.status === 'not_seeking').length;
                            const totalResponsesCount = filteredResponses.length;
                            const responsePct = totalResponsesCount > 0 ? (total / totalResponsesCount) * 100 : 0;
                            
                            const empAndUnemp = employed + unemployed;
                            const empRate = empAndUnemp > 0 ? (employed / empAndUnemp) * 100 : 0;

                            const facRelated = facResponses.filter(r => r.status === 'employed' && r.employedDetails?.isRelatedToStudy).length;
                            const facRelatedRate = employed > 0 ? (facRelated / employed) * 100 : 0;

                            const totalSalary = facResponses
                              .filter(r => r.status === 'employed' && r.employedDetails)
                              .reduce((acc, curr) => acc + (Number(curr.employedDetails?.salary) || 0), 0);
                            const avgSal = employed > 0 ? Math.round(totalSalary / employed) : 0;

                            return (
                              <tr key={fac} className="hover:bg-neutral-50/80 transition-colors">
                                <td className="py-3.5 pl-2 font-bold text-neutral-800">{fac}</td>
                                <td className="py-3.5 text-center font-mono">
                                  <span className="font-extrabold text-neutral-800">{total}</span>
                                  <span className="text-[10px] text-neutral-400 ml-1">({responsePct.toFixed(1)}%)</span>
                                </td>
                                <td className="py-3.5 text-center font-mono font-bold text-emerald-600">{employed}</td>
                                <td className="py-3.5 text-center font-mono font-bold text-amber-600">{unemployed}</td>
                                <td className="py-3.5 text-center">
                                  <div className="flex items-center justify-center space-x-2">
                                    <span className="font-mono font-black text-neutral-800 w-12 text-right">{empRate.toFixed(1)}%</span>
                                    <div className="w-20 h-1.5 bg-neutral-100 rounded-full overflow-hidden hidden sm:block">
                                      <div 
                                        className={`h-full rounded-full ${empRate >= 75 ? 'bg-emerald-500' : empRate >= 50 ? 'bg-indigo-500' : 'bg-amber-500'}`}
                                        style={{ width: `${empRate}%` }}
                                      />
                                    </div>
                                  </div>
                                </td>
                                <td className="py-3.5 text-center font-mono font-bold text-blue-600">
                                  {employed > 0 ? `${facRelatedRate.toFixed(1)}%` : '-'}
                                </td>
                                <td className="py-3.5 text-right font-mono font-extrabold text-indigo-600 pr-2">
                                  {avgSal > 0 ? `${avgSal.toLocaleString()} ฿` : '-'}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

                {/* ANALYTICS SUB-TAB 3: TIMELINE BREAKDOWN */}
                {analyticsSubTab === 'timeline' && (
                  <div className="bg-white rounded-3xl p-6 border border-neutral-200/80 shadow-xs space-y-5">
                    <div className="pb-3 border-b border-neutral-100">
                      <h3 className="font-sans font-black text-sm text-neutral-900">
                        ระยะเวลาการได้งานทำหลังจากสำเร็จการศึกษา (Time to Landing Job)
                      </h3>
                      <p className="text-[11px] text-neutral-400 font-sans">
                        สถิติจำแนกความรวดเร็วในการได้งานของบัณฑิตแยกตามรายคณะการศึกษา
                      </p>
                    </div>

                    <div className="space-y-4">
                      {FACULTIES.map(fac => {
                        const facResponses = filteredResponses.filter(r => r.faculty === fac);
                        const employedResponses = facResponses.filter(r => r.status === 'employed');
                        const employed = employedResponses.length;

                        const timeline_immediate = employedResponses.filter(r => ['1', '7'].includes(r.employedDetails?.timeToGetJob || '')).length;
                        const timeline_1_2 = employedResponses.filter(r => r.employedDetails?.timeToGetJob === '2').length;
                        const timeline_3_6 = employedResponses.filter(r => r.employedDetails?.timeToGetJob === '3').length;
                        const timeline_more_6 = employedResponses.filter(r => ['4', '5', '6'].includes(r.employedDetails?.timeToGetJob || '')).length;

                        return (
                          <div key={fac} className="p-4 bg-neutral-50/70 rounded-2xl border border-neutral-200/60 font-sans space-y-2">
                            <div className="flex justify-between items-center">
                              <h4 className="font-bold text-xs text-neutral-800">{fac}</h4>
                              <span className="text-[11px] font-mono font-extrabold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-lg border border-emerald-100">
                                ได้งานแล้ว {employed} คน
                              </span>
                            </div>

                            {employed === 0 ? (
                              <p className="text-neutral-400 italic text-[11px]">ไม่มีผู้ตอบแบบสำรวจที่มีสถานะทำงานในคณะนี้</p>
                            ) : (
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                                <div className="bg-emerald-50/70 p-2.5 rounded-xl border border-emerald-100">
                                  <span className="text-[9px] font-black text-emerald-800 uppercase block">ทันที / ระหว่างเรียน</span>
                                  <span className="font-mono font-black text-emerald-700 text-xs">{timeline_immediate} คน</span>
                                  <span className="text-[10px] text-neutral-400 ml-1">({((timeline_immediate / employed) * 100).toFixed(0)}%)</span>
                                </div>
                                <div className="bg-indigo-50/70 p-2.5 rounded-xl border border-indigo-100">
                                  <span className="text-[9px] font-black text-indigo-800 uppercase block">1-2 เดือน</span>
                                  <span className="font-mono font-black text-indigo-700 text-xs">{timeline_1_2} คน</span>
                                  <span className="text-[10px] text-neutral-400 ml-1">({((timeline_1_2 / employed) * 100).toFixed(0)}%)</span>
                                </div>
                                <div className="bg-purple-50/70 p-2.5 rounded-xl border border-purple-100">
                                  <span className="text-[9px] font-black text-purple-800 uppercase block">3-6 เดือน</span>
                                  <span className="font-mono font-black text-purple-700 text-xs">{timeline_3_6} คน</span>
                                  <span className="text-[10px] text-neutral-400 ml-1">({((timeline_3_6 / employed) * 100).toFixed(0)}%)</span>
                                </div>
                                <div className="bg-amber-50/70 p-2.5 rounded-xl border border-amber-100">
                                  <span className="text-[9px] font-black text-amber-800 uppercase block">มากกว่า 6 เดือน</span>
                                  <span className="font-mono font-black text-amber-700 text-xs">{timeline_more_6} คน</span>
                                  <span className="text-[10px] text-neutral-400 ml-1">({((timeline_more_6 / employed) * 100).toFixed(0)}%)</span>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* ANALYTICS SUB-TAB 4: VOICE OF GRADUATES & SUGGESTIONS */}
                {analyticsSubTab === 'feedback' && (
                  <div className="bg-white rounded-3xl p-6 border border-neutral-200/80 shadow-xs space-y-5 font-sans">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-neutral-100">
                      <div>
                        <h3 className="font-sans font-black text-sm text-neutral-900 flex items-center space-x-2">
                          <MessageSquare className="w-4 h-4 text-indigo-600" />
                          <span>ข้อเสนอแนะและเสียงสะท้อนจากบัณฑิต (Voice of Graduates)</span>
                        </h3>
                        <p className="text-[11px] text-neutral-400">
                          รวบรวมข้อคิดเห็น สิ่งประทับใจ การพัฒนาหลักสูตร และทักษะที่ต้องการปลูกฝังเพิ่ม
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <div className="relative">
                          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-neutral-400" />
                          <input
                            type="text"
                            placeholder="ค้นหาตามข้อความ/ชื่อ/รหัส..."
                            value={feedbackSearch}
                            onChange={(e) => setFeedbackSearch(e.target.value)}
                            className="pl-8 pr-3 py-1.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs"
                          />
                        </div>
                        <select
                          value={feedbackFacultyFilter}
                          onChange={(e) => setFeedbackFacultyFilter(e.target.value)}
                          className="px-3 py-1.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-semibold max-w-[150px] truncate"
                        >
                          <option value="all">ทุกคณะ</option>
                          {FACULTIES.map(fac => <option key={fac} value={fac}>{fac}</option>)}
                        </select>
                      </div>
                    </div>

                    {suggestionsResponses.length === 0 ? (
                      <div className="py-12 text-center text-neutral-400 font-sans text-xs">
                        ไม่พบข้อเสนอแนะของบัณฑิตตามเงื่อนไขการค้นหาข้างต้น
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {suggestionsResponses.map((r) => (
                          <div key={r.id} className="p-5 bg-neutral-50/80 rounded-2xl border border-neutral-200/60 shadow-xs space-y-3">
                            <div className="flex items-center justify-between pb-2 border-b border-neutral-200/50">
                              <div className="flex items-center space-x-2">
                                <span className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs">
                                  {r.firstName ? r.firstName[0] : 'U'}
                                </span>
                                <div>
                                  <h4 className="font-bold text-xs text-neutral-800">{r.firstName} {r.lastName}</h4>
                                  <span className="text-[10px] text-neutral-400 font-mono">{r.studentId} • {r.faculty}</span>
                                </div>
                              </div>
                              <button
                                onClick={() => setSelectedResponse(r)}
                                className="text-[10px] font-bold text-indigo-600 hover:underline flex items-center space-x-0.5"
                              >
                                <span>ดูเต็ม</span>
                                <ChevronRight className="w-3 h-3" />
                              </button>
                            </div>

                            {r.suggestions?.impressions && (
                              <div className="space-y-1">
                                <span className="text-[9.5px] font-bold text-emerald-700 uppercase tracking-wider block">💖 สิ่งที่ประทับใจ:</span>
                                <p className="text-xs text-neutral-700 bg-white p-2.5 rounded-xl border border-neutral-100 italic leading-relaxed">
                                  "{r.suggestions.impressions}"
                                </p>
                              </div>
                            )}

                            {r.suggestions?.improvements && (
                              <div className="space-y-1">
                                <span className="text-[9.5px] font-bold text-indigo-700 uppercase tracking-wider block">🛠️ การพัฒนาหลักสูตร:</span>
                                <p className="text-xs text-neutral-700 bg-white p-2.5 rounded-xl border border-neutral-100 italic leading-relaxed">
                                  "{r.suggestions.improvements}"
                                </p>
                              </div>
                            )}

                            {r.suggestions?.skillsToCultivate && (
                              <div className="space-y-1">
                                <span className="text-[9.5px] font-bold text-purple-700 uppercase tracking-wider block">💡 ทักษะที่ควรเพิ่ม:</span>
                                <p className="text-xs text-neutral-700 bg-white p-2.5 rounded-xl border border-neutral-100 italic leading-relaxed">
                                  "{r.suggestions.skillsToCultivate}"
                                </p>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

              </div>
            )}

            {/* TAB CONTENT: GRADUATES ROSTER */}
            {activeTab === 'graduates' && (
              <div className="bg-white rounded-3xl p-6 border border-neutral-105 shadow-sm space-y-6">
                
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-2.5 w-4 h-4 text-neutral-400" />
                    <input
                      type="text"
                      placeholder="ค้นหาตามรหัสนักศึกษา, ชื่อ, คณะ, สาขา..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 border border-neutral-200 rounded-xl text-xs bg-neutral-50/50"
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={downloadSampleCSV}
                      className="flex items-center space-x-1 px-3.5 py-2 border border-emerald-200 bg-emerald-50/60 hover:bg-emerald-100/70 text-emerald-800 rounded-xl text-xs font-semibold shadow-2xs transition-all cursor-pointer"
                      title="ดาวน์โหลดโครงสร้างไฟล์ CSV ตัวอย่าง (7 คอลัมน์)"
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                      <span>ไฟล์ CSV ตัวอย่าง</span>
                    </button>

                    <button
                      onClick={() => {
                        setIsEditingGrad(false);
                        setGradForm({
                          studentId: '',
                          fullName: '',
                          faculty: FACULTIES[0],
                          major: MAJORS[FACULTIES[0]][0],
                          academicYear: '2568'
                        });
                        setShowGradModal(true);
                      }}
                      className="flex items-center space-x-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-sm cursor-pointer"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>เพิ่มรายชื่อรายบุคคล</span>
                    </button>

                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center space-x-1 px-4 py-2 border border-neutral-200 hover:bg-neutral-50 text-neutral-600 rounded-xl text-xs font-semibold cursor-pointer"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>นำเข้า CSV</span>
                    </button>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleCSVUpload}
                      accept=".csv"
                      className="hidden"
                    />
                  </div>
                </div>

                {/* BULK DELETE BY ACADEMIC YEAR SECTION */}
                <div className="bg-red-50/70 border border-red-100 rounded-2xl p-5 space-y-4 font-sans relative overflow-hidden">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <h4 className="text-xs font-black text-red-950 uppercase tracking-widest flex items-center space-x-1.5">
                        <Trash2 className="w-4 h-4 text-red-600" />
                        <span>ระบบล้างข้อมูลทั้งหมดรายปีการศึกษา (Bulk Delete)</span>
                      </h4>
                      <p className="text-[11px] text-red-700/80 font-medium">
                        ลบข้อมูลแบบสำรวจหรือทำเนียบรายชื่อของบัณฑิตทั้งหมดตามปีการศึกษาที่ท่านประสงค์จะจัดสรรพื้นที่หรือล้างเพื่อนำเข้าข้อมูลใหม่
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-end bg-white/60 p-4 rounded-xl border border-red-100/50">
                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold text-red-900 uppercase">1. ปีการศึกษาเป้าหมาย</label>
                      <select
                        value={deleteYearSelected}
                        onChange={(e) => setDeleteYearSelected(e.target.value)}
                        className="w-full px-3 py-1.5 bg-white border border-red-200 text-neutral-800 rounded-lg text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-red-400"
                      >
                        <option value="">-- เลือกปีการศึกษา --</option>
                        {uniqueYearsForBulkDelete.map(year => (
                          <option key={year} value={year}>ปีการศึกษา {year}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-[10px] font-bold text-red-900 uppercase">2. ข้อมูลที่ต้องการลบ</label>
                      <div className="flex flex-col space-y-1.5">
                        <label className="flex items-center space-x-2 text-xs font-bold text-neutral-700 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={deleteGradsOption}
                            onChange={(e) => setDeleteGradsOption(e.target.checked)}
                            className="rounded border-red-300 text-red-600 focus:ring-red-500 w-3.5 h-3.5 accent-red-600"
                          />
                          <span>ลบทำเนียบรายชื่อบัณฑิต (Graduates)</span>
                        </label>
                        <label className="flex items-center space-x-2 text-xs font-bold text-neutral-700 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={deleteResOption}
                            onChange={(e) => setDeleteResOption(e.target.checked)}
                            className="rounded border-red-300 text-red-600 focus:ring-red-500 w-3.5 h-3.5 accent-red-600"
                          />
                          <span>ลบผลการตอบแบบสำรวจ (Survey Responses)</span>
                        </label>
                      </div>
                    </div>

                    <div className="sm:col-span-2 flex justify-end">
                      <button
                        type="button"
                        onClick={handleBulkDeleteByYear}
                        disabled={isDeletingBulk || !deleteYearSelected || (!deleteGradsOption && !deleteResOption)}
                        className="w-full sm:w-auto px-5 py-2.5 bg-red-600 hover:bg-red-700 disabled:bg-red-300 text-white rounded-xl text-xs font-bold shadow-sm transition-all flex items-center justify-center space-x-2"
                      >
                        {isDeletingBulk ? (
                          <>
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            <span>กำลังเคลียร์ข้อมูล...</span>
                          </>
                        ) : (
                          <>
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>ยืนยันคำสั่งลบข้อมูลทั้งหมด</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {isUploadingCSV && (
                  <div className="flex items-center space-x-2 p-3 bg-indigo-50 text-indigo-700 rounded-xl text-xs animate-pulse font-sans">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>กำลังนำเข้าและบันทึกข้อมูลตารางบัณฑิต...</span>
                  </div>
                )}

                {csvResult && (
                  <div className="p-3 bg-violet-50 text-violet-700 border border-violet-100 rounded-xl text-xs font-bold flex justify-between items-center font-sans">
                    <span>{csvResult}</span>
                    <button onClick={() => setCsvResult('')} className="text-violet-500 hover:text-black">✕</button>
                  </div>
                )}

                {/* CORRUPTED DATA ALERT BANNER */}
                {corruptedGraduates.length > 0 && (
                  <div className="bg-amber-50/90 border border-amber-200/90 rounded-2xl p-4 sm:p-5 text-amber-950 space-y-3 font-sans shadow-xs">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-start space-x-3">
                        <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center flex-shrink-0 mt-0.5">
                          <AlertCircle className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="font-bold text-amber-950 text-xs sm:text-sm flex items-center space-x-2">
                            <span>ตรวจพบข้อมูลเดิมในระบบที่คอลัมน์สลับตำแหน่ง ({corruptedGraduates.length} รายชื่อ)</span>
                          </h4>
                          <p className="text-[11px] text-amber-900/80 mt-0.5 leading-relaxed">
                            ระบบตรวจพบแถวข้อมูลเดิมที่มีคอลัมน์สลับช่อง (เช่น ปีการศึกษาขึ้นเป็นนามสกุล หรือ รหัสนักศึกษาขึ้นเป็น 2568) สามารถกดลบข้อมูลชุดเดิมออก แล้วกดนำเข้าไฟล์ใหม่อีกครั้งได้อย่างถูกต้อง
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 self-start sm:self-center pl-11 sm:pl-0 flex-shrink-0">
                        <button
                          type="button"
                          onClick={handleDeleteCorruptedGraduates}
                          disabled={isDeletingBulk}
                          className="px-3.5 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-300 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center space-x-1.5 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>ลบข้อมูลที่สลับช่องออก ({corruptedGraduates.length})</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center space-x-1.5 cursor-pointer"
                        >
                          <Upload className="w-3.5 h-3.5" />
                          <span>นำเข้า CSV ใหม่</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Graduates List Table */}
                <div className="overflow-x-auto rounded-2xl border border-neutral-100">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-neutral-50 text-neutral-500 font-bold text-[10px] uppercase h-10 border-b border-neutral-100">
                        <th className="px-4 py-2 font-sans">ปีการศึกษา</th>
                        <th className="px-4 py-2 font-sans">ระดับปริญญา</th>
                        <th className="px-4 py-2 font-sans">รหัสนักศึกษา</th>
                        <th className="px-4 py-2 font-sans">ชื่อ</th>
                        <th className="px-4 py-2 font-sans">นามสกุล</th>
                        <th className="px-4 py-2 font-sans">คณะ</th>
                        <th className="px-4 py-2 font-sans">สาขา</th>
                        <th className="px-4 py-2 font-sans">สถานะการตอบกลับ</th>
                        <th className="px-4 py-2 font-sans text-right">ดำเนินการ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100">
                      {paginatedGraduates.length === 0 ? (
                        <tr>
                          <td colSpan={9} className="text-center py-10 text-neutral-400 font-sans text-xs">
                            ไม่พบข้อมูลตารางบัณฑิต โปรดกดอัพโหลดนำเข้า CSV หรือเพิ่มรายชื่อเพื่อใช้ทดสอบ
                          </td>
                        </tr>
                      ) : (
                        paginatedGraduates.map((g) => {
                          const graduateResponse = responses.find(r => r.studentId === g.studentId);
                          const nameParts = (g.fullName || '').trim().split(/\s+/);
                          const firstName = g.firstName || nameParts[0] || '-';
                          const lastName = g.lastName || nameParts.slice(1).join(' ') || '-';

                          return (
                            <tr key={g.id} className="hover:bg-neutral-50/50 h-11 text-xs text-neutral-700">
                              <td className="px-4 py-2 font-sans font-medium text-neutral-600 whitespace-nowrap">{g.academicYear}</td>
                              <td className="px-4 py-2 whitespace-nowrap">
                                <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10.5px] font-bold border ${
                                  (g.degreeLevel || 'ระดับปริญญาตรี') === 'ระดับปริญญาเอก'
                                    ? 'bg-orange-50 text-orange-700 border-orange-200'
                                    : (g.degreeLevel || 'ระดับปริญญาตรี') === 'ระดับปริญญาโท'
                                    ? 'bg-purple-50 text-purple-700 border-purple-200'
                                    : 'bg-indigo-50 text-indigo-700 border-indigo-100'
                                }`}>
                                  {g.degreeLevel || 'ระดับปริญญาตรี'}
                                </span>
                              </td>
                              <td className="px-4 py-2 font-mono font-semibold text-neutral-800 whitespace-nowrap">{g.studentId}</td>
                              <td className="px-4 py-2 font-sans font-medium whitespace-nowrap">{firstName}</td>
                              <td className="px-4 py-2 font-sans font-medium whitespace-nowrap">{lastName}</td>
                              <td className="px-4 py-2 font-sans text-xs">{g.faculty}</td>
                              <td className="px-4 py-2 font-sans text-xs text-neutral-600">{g.major}</td>
                              <td className="px-4 py-2 font-sans whitespace-nowrap">
                                {graduateResponse ? (
                                  <div className="flex flex-col items-start space-y-0.5">
                                    <button
                                      onClick={() => setSelectedResponse(graduateResponse)}
                                      className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-150 transition-colors text-[10px] font-semibold font-sans cursor-pointer"
                                      title="คลิกเพื่อดูคำตอบ"
                                    >
                                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                      <span>ตอบกลับแล้ว</span>
                                    </button>
                                    <span className="text-[9px] text-neutral-400 font-mono pl-1">
                                      {formatResponseDate(graduateResponse.createdAt)}
                                    </span>
                                  </div>
                                ) : (
                                  <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-neutral-50 text-neutral-400 border border-neutral-100 text-[10px] font-medium font-sans">
                                    <span className="w-1.5 h-1.5 rounded-full bg-neutral-300"></span>
                                    <span>ยังไม่ตอบ</span>
                                  </span>
                                )}
                              </td>
                              <td className="px-4 py-2 text-right whitespace-nowrap">
                                <div className="flex justify-end space-x-1">
                                  <button
                                    onClick={() => startEditGraduate(g)}
                                    className="p-1 text-neutral-400 hover:text-indigo-600 hover:bg-indigo-50 rounded cursor-pointer"
                                    title="แก้ไขข้อมูล"
                                  >
                                    <Edit3 className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteGraduate(g.id || '')}
                                    className="p-1 text-neutral-400 hover:text-red-500 hover:bg-red-50 rounded cursor-pointer"
                                    title="ลบรายชื่อ"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination Controls */}
                {filteredGraduates.length > itemsPerPage && (
                  <div className="flex flex-col sm:flex-row items-center justify-between pt-4 border-t border-neutral-100 gap-4 font-sans">
                    <span className="text-xs text-neutral-500">
                      แสดงรายการที่ <strong>{startIndexGrads + 1}</strong> ถึง <strong>{Math.min(startIndexGrads + itemsPerPage, filteredGraduates.length)}</strong> จากทั้งหมด <strong>{filteredGraduates.length}</strong> รายการ
                    </span>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setGraduatesPage(prev => Math.max(prev - 1, 1))}
                        disabled={graduatesPage === 1}
                        className="px-3 py-1.5 rounded-xl border border-neutral-200 text-xs font-semibold text-neutral-600 hover:bg-neutral-50 disabled:opacity-50 transition-colors cursor-pointer"
                      >
                        ก่อนหน้า
                      </button>
                      <span className="text-xs text-neutral-600 font-semibold px-2">
                        หน้า {graduatesPage} / {totalGradPages}
                      </span>
                      <button
                        onClick={() => setGraduatesPage(prev => Math.min(prev + 1, totalGradPages))}
                        disabled={graduatesPage === totalGradPages}
                        className="px-3 py-1.5 rounded-xl border border-neutral-200 text-xs font-semibold text-neutral-600 hover:bg-neutral-50 disabled:opacity-50 transition-colors cursor-pointer"
                      >
                        ถัดไป
                      </button>
                    </div>
                  </div>
                )}

              </div>
            )}

            {/* TAB CONTENT: CORE SURVEY RESPONSES TAB */}
            {activeTab === 'responses' && (
              <div className="bg-white rounded-3xl p-6 border border-neutral-105 shadow-sm space-y-6">
                
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-2.5 w-4 h-4 text-neutral-400" />
                    <input
                      type="text"
                      placeholder="ค้นตามชื่อ, รหัสนักศึกษา, คณะ บัณฑิต..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 border border-neutral-200 rounded-xl text-xs bg-neutral-50/50"
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <select
                      value={filterFaculty}
                      onChange={(e) => setFilterFaculty(e.target.value)}
                      className="px-3 py-1.5 border border-neutral-200 rounded-xl text-xs bg-white text-neutral-600"
                    >
                      <option value="all">ทุกคณะการศึกษา</option>
                      {FACULTIES.map(fac => <option key={fac} value={fac}>{fac}</option>)}
                    </select>

                    <button
                      onClick={handleExportResponses}
                      className="flex items-center space-x-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-sm"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>ส่งออก Excel/CSV</span>
                    </button>
                  </div>
                </div>

                {/* GOOGLE SHEETS SYNC BOARD */}
                <div className="p-5 bg-gradient-to-r from-emerald-50/70 to-teal-50/70 border border-emerald-100/80 rounded-2xl flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="p-1.5 bg-emerald-600 rounded-lg text-white">
                        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                          <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-2h2v2zm0-4H7v-2h2v2zm0-4H7V7h2v2zm4 8h-2v-2h2v2zm0-4h-2v-2h2v2zm0-4h-2V7h2v2zm4 8h-2v-2h2v2zm0-4h-2v-2h2v2zm0-4h-2V7h2v2z"/>
                        </svg>
                      </span>
                      <h4 className="text-xs font-bold text-emerald-950 font-sans">
                        ระบบซิงค์ข้อมูล Google Sheets (Real-time)
                      </h4>
                      {spreadsheetId ? (
                        <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-emerald-100 border border-emerald-200 text-[10px] font-bold text-emerald-700">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                          <span>เปิดใช้งานอยู่ (Real-time)</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-neutral-100 border border-neutral-200 text-[10px] font-bold text-neutral-500">
                          <span>ยังไม่ได้เชื่อมต่อ</span>
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-emerald-800 font-sans max-w-xl">
                      นำส่งและจัดเก็บข้อมูลตอบแบบสอบถามตรงเข้าสู่บัญชี Google Sheets ของท่านทันที ข้อมูลรหัสนักศึกษา 10 ตัวอักษรจะถูกล็อกรูปแบบเพื่อป้องกันตัวเลขผิดเพี้ยนและสูญหาย พร้อมระบุเวลาตอบแบบสอบถามอย่างครบถ้วน
                    </p>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 pt-1">
                      {lastSyncedTime && (
                        <p className="text-[10px] text-emerald-600 font-sans font-semibold flex items-center">
                          <span className="w-1 h-1 rounded-full bg-emerald-500 mr-1.5"></span>
                          ซิงค์ล่าสุดเมื่อ: {lastSyncedTime}
                        </p>
                      )}
                      {sheetsSyncError && (
                        <p className="text-[10px] text-red-600 font-sans font-medium">
                          เกิดข้อผิดพลาด: {sheetsSyncError}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {spreadsheetId && (
                      <a
                        href={`https://docs.google.com/spreadsheets/d/${spreadsheetId}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center space-x-1 px-3.5 py-2 bg-white border border-emerald-200 text-emerald-700 hover:bg-emerald-50 rounded-xl text-xs font-bold shadow-sm transition-colors cursor-pointer"
                      >
                        <span>เปิด Google Sheets ↗</span>
                      </a>
                    )}

                    {!spreadsheetId ? (
                      <button
                        onClick={() => handleSyncToGoogleSheets()}
                        disabled={isSyncingSheets}
                        className="inline-flex items-center space-x-1.5 px-4.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition-colors cursor-pointer disabled:opacity-50"
                      >
                        {isSyncingSheets ? (
                          <>
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            <span>กำลังเชื่อมต่อบัญชี Google...</span>
                          </>
                        ) : (
                          <>
                            <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                              <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-2h2v2zm0-4H7v-2h2v2zm0-4H7V7h2v2zm4 8h-2v-2h2v2zm0-4h-2v-2h2v2zm0-4h-2V7h2v2zm4 8h-2v-2h2v2zm0-4h-2v-2h2v2zm0-4h-2V7h2v2z"/>
                            </svg>
                            <span>ส่งข้อมูลเข้า Google Sheets โดยตรง 📊</span>
                          </>
                        )}
                      </button>
                    ) : (
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleSyncToGoogleSheets()}
                          disabled={isSyncingSheets}
                          className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition-colors cursor-pointer disabled:opacity-50"
                          title="ซิงค์ข้อมูลล่าสุดเข้าสู่แผ่นงาน"
                        >
                          {isSyncingSheets ? (
                            <>
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                              <span>กำลังซิงค์...</span>
                            </>
                          ) : (
                            <>
                              <RefreshCw className="w-3.5 h-3.5" />
                              <span>ซิงค์ด่วน</span>
                            </>
                          )}
                        </button>

                        <button
                          onClick={() => {
                            triggerConfirm(
                              'ตัดการเชื่อมต่อ Google Sheets',
                              'คุณแน่ใจหรือไม่ว่าต้องการตัดการเชื่อมต่อบัญชี Google Sheets ปัจจุบัน? (ข้อมูลบน Google Sheets ของคุณจะไม่สูญหาย)',
                              async () => {
                                setSpreadsheetId('');
                                setGoogleToken(null);
                                setLastSyncedTime('');
                                await setDoc(doc(db, 'settings', 'google_sheets_config'), {
                                  spreadsheetId: '',
                                  lastSyncedTime: ''
                                }, { merge: true });
                              }
                            );
                          }}
                          className="inline-flex items-center px-3 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-600 rounded-xl text-xs font-medium transition-colors cursor-pointer"
                        >
                          ตัดการเชื่อมต่อ
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Survey responses table */}
                <div className="overflow-x-auto rounded-2xl border border-neutral-100">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-neutral-50 text-neutral-400 font-bold text-[10px] uppercase h-10 border-b border-neutral-100">
                        <th className="px-4 py-2 font-sans">รหัสนักศึกษา</th>
                        <th className="px-4 py-2 font-sans">ชื่อบัณฑิต</th>
                        <th className="px-4 py-2 font-sans">ระดับการศึกษา</th>
                        <th className="px-4 py-2 font-sans">คณะ / สาขา</th>
                        <th className="px-4 py-2 font-sans">สถานะ</th>
                        <th className="px-4 py-2 font-sans">วันที่ตอบแบบสอบถาม</th>
                        <th className="px-4 py-2 font-sans">รายละเอียด</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100">
                      {paginatedResponses.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="text-center py-10 text-neutral-400 font-sans text-xs">
                            ยังไม่มีข้อมูลหรือตัวตอบรับภาวะมีงานทำตามพารามิเตอร์ที่กรอง
                          </td>
                        </tr>
                      ) : (
                        paginatedResponses.map((r) => (
                          <tr key={r.id} className="hover:bg-neutral-50/50 h-11 text-xs text-neutral-700">
                            <td className="px-4 py-2 font-mono font-medium">{r.studentId}</td>
                            <td className="px-4 py-2 font-sans font-semibold">{r.firstName} {r.lastName}</td>
                            <td className="px-4 py-2">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10.5px] font-bold border ${
                                (r.degreeLevel || 'ระดับปริญญาตรี') === 'ระดับปริญญาเอก'
                                  ? 'bg-orange-50 text-orange-700 border-orange-200'
                                  : (r.degreeLevel || 'ระดับปริญญาตรี') === 'ระดับปริญญาโท'
                                  ? 'bg-purple-50 text-purple-700 border-purple-200'
                                  : 'bg-indigo-50 text-indigo-700 border-indigo-100'
                              }`}>
                                {r.degreeLevel || 'ระดับปริญญาตรี'}
                              </span>
                            </td>
                            <td className="px-4 py-2">
                              <span className="block font-sans text-xs text-neutral-500">{r.faculty}</span>
                              <span className="block font-sans text-[10px] text-neutral-400">{r.major}</span>
                            </td>
                            <td className="px-4 py-2">
                              {r.status === 'employed' && (
                                <span className="inline-flex px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 text-[10.5px] font-semibold border border-emerald-100">มีงานทำ</span>
                              )}
                              {r.status === 'unemployed' && (
                                <span className="inline-flex px-2 py-0.5 rounded bg-amber-50 text-amber-700 text-[10.5px] font-semibold border border-amber-100">ยังไม่มีงาน</span>
                              )}
                              {r.status === 'not_seeking' && (
                                <span className="inline-flex px-2 py-0.5 rounded bg-neutral-100 text-neutral-600 text-[10.5px] font-semibold border border-neutral-200">เหตุผลอื่นๆ</span>
                              )}
                            </td>
                            <td className="px-4 py-2 font-mono text-neutral-500 text-[11px]">
                              {formatResponseDate(r.createdAt)}
                            </td>
                            <td className="px-4 py-2">
                              <button
                                onClick={() => setSelectedResponse(r)}
                                className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded text-[11px] font-semibold"
                              >
                                เรียกดูข้อมูล
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination Controls */}
                {filteredResponses.length > itemsPerPage && (
                  <div className="flex flex-col sm:flex-row items-center justify-between pt-4 border-t border-neutral-100 gap-4 font-sans">
                    <span className="text-xs text-neutral-500">
                      แสดงรายการที่ <strong>{startIndexResponses + 1}</strong> ถึง <strong>{Math.min(startIndexResponses + itemsPerPage, filteredResponses.length)}</strong> จากทั้งหมด <strong>{filteredResponses.length}</strong> รายการ
                    </span>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setResponsesPage(prev => Math.max(prev - 1, 1))}
                        disabled={responsesPage === 1}
                        className="px-3 py-1.5 rounded-xl border border-neutral-200 text-xs font-semibold text-neutral-600 hover:bg-neutral-50 disabled:opacity-50 transition-colors cursor-pointer"
                      >
                        ก่อนหน้า
                      </button>
                      <span className="text-xs text-neutral-600 font-semibold px-2">
                        หน้า {responsesPage} / {totalResPages}
                      </span>
                      <button
                        onClick={() => setResponsesPage(prev => Math.min(prev + 1, totalResPages))}
                        disabled={responsesPage === totalResPages}
                        className="px-3 py-1.5 rounded-xl border border-neutral-200 text-xs font-semibold text-neutral-600 hover:bg-neutral-50 disabled:opacity-50 transition-colors cursor-pointer"
                      >
                        ถัดไป
                      </button>
                    </div>
                  </div>
                )}

              </div>
            )}

            {/* TAB CONTENT: SPECIAL CUSTOM AUXILIARY QUESTIONS CONFIGURATION */}
            {activeTab === 'custom_questions' && (
              <div className="bg-white rounded-3xl p-6 border border-neutral-105 shadow-sm space-y-6">
                
                <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
                  <div>
                    <h3 className="font-sans font-extrabold text-sm text-neutral-800">
                      แบบสะท้อนข้อมูล/ข้อถามเพิ่มเติม
                    </h3>
                    <p className="text-[11px] text-neutral-400 font-sans">
                      เพิ่มช่องคำถามอื่น ๆ เพื่อให้บัณฑิตกรอก เช่น ข้อมูลผู้บังคับบัญชา, เสนอแนะหัวข้อวิชา หรืออื่น ๆ
                    </p>
                  </div>
                  <button
                    onClick={() => setShowQuestionModal(true)}
                    className="flex items-center space-x-1 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-sm"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>สร้างคำถามเพิ่ม</span>
                  </button>
                </div>

                {customQuestions.length === 0 ? (
                  <div className="py-12 text-center text-neutral-400 font-sans text-xs">
                    ยังไม่มีแบบสรวจพิเศษเพิ่มเติมพิเศษ หรือความต้องการความเห็นผู้บังคับบัญชา
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {customQuestions.map((q) => (
                      <div key={q.id} className="p-4 bg-neutral-50 rounded-2xl border border-neutral-100 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="inline-block px-2.5 py-0.5 bg-indigo-50 text-indigo-700 rounded-md text-[10px] font-bold">
                              {q.section === 'general' ? 'หน้าข้อมูลทั่วไป' : q.section === 'employed' ? 'หน้ากลุ่มมีงานทำ' : 'หน้ากลุ่มไม่มีงานทำ'}
                            </span>
                            {q.required && (
                              <span className="text-[10px] font-semibold text-red-500 font-sans">มีเครื่องหมาย *</span>
                            )}
                          </div>
                          <h4 className="font-sans font-bold text-xs text-neutral-700 leading-snug mb-1">{q.title}</h4>
                          <span className="font-mono text-[9px] text-neutral-400">ชนิดข้อมูล: {q.type === 'choice' ? 'ตัวเลือก (Choice)' : 'พิมพ์ข้อมูลเสรี (Text)'}</span>
                          {q.options && q.options.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-1">
                              {q.options.map((opt, oIdx) => (
                                <span key={oIdx} className="px-1.5 py-0.5 bg-white border border-neutral-150 rounded text-[9px] text-neutral-500">
                                  {opt}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="mt-4 pt-3 border-t border-neutral-200/50 flex justify-end">
                          <button
                            onClick={() => handleDeleteQuestion(q.id)}
                            className="flex items-center space-x-1 p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded text-xs"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>ลบคำถาม</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB CONTENT: ADMINS MANAGEMENT */}
            {activeTab === 'admins' && (
              <div className="bg-white rounded-3xl p-6 border border-neutral-105 shadow-sm space-y-6">
                
                <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
                  <div>
                    <h3 className="font-sans font-extrabold text-sm text-neutral-800">
                      จัดการผู้ดูแลระบบ (Admin Users)
                    </h3>
                    <p className="text-[11px] text-neutral-400 font-sans">
                      เพิ่ม ลบ หรือแก้ไขบัญชีอีเมลที่มีสิทธิ์เข้าถึงระบบผู้ดูแลระบบ
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setIsEditingAdmin(false);
                      setAdminFormEmail('');
                      setEditingAdminId(null);
                      setShowAdminModal(true);
                    }}
                    className="flex items-center space-x-1 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-sm"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>เพิ่มผู้ดูแลระบบ</span>
                  </button>
                </div>

                <div className="overflow-x-auto rounded-2xl border border-neutral-100">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-neutral-50 text-neutral-400 font-bold text-[10px] uppercase h-10 border-b border-neutral-100">
                        <th className="px-4 py-2 font-sans">อีเมล (Email)</th>
                        <th className="px-4 py-2 font-sans">บทบาท (Role)</th>
                        <th className="px-4 py-2 font-sans text-right">ดำเนินการ (Actions)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100">
                      {adminsList.map((adm) => (
                        <tr key={adm.id} className="hover:bg-neutral-50/50 h-11 text-xs">
                          <td className="px-4 py-2 font-mono font-medium text-neutral-700">
                            {adm.email}
                          </td>
                          <td className="px-4 py-2 font-sans">
                            <span className="inline-block px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-md text-[10px] font-bold">
                              {adm.role}
                            </span>
                          </td>
                          <td className="px-4 py-2 text-right">
                            <div className="flex items-center justify-end space-x-2">
                              <button
                                onClick={() => {
                                  setIsEditingAdmin(true);
                                  setAdminFormEmail(adm.email);
                                  setEditingAdminId(adm.id);
                                  setShowAdminModal(true);
                                }}
                                className="p-1 px-1.5 text-neutral-500 hover:text-indigo-600 hover:bg-neutral-100 rounded-lg text-[10px] font-bold flex items-center space-x-1"
                              >
                                <Edit3 className="w-3 h-3" />
                                <span>แก้ไข</span>
                              </button>
                              <button
                                onClick={() => handleDeleteAdmin(adm.id, adm.email)}
                                className="p-1 px-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg text-[10px] font-bold flex items-center space-x-1"
                              >
                                <Trash2 className="w-3 h-3" />
                                <span>ลบ</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

              </div>
            )}

          </div>
        </div>
      )}

      {/* MODAL WINDOW: ADD/EDIT GRADUATE ROSTER */}
      {showGradModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 shadow-2xl max-w-md w-full border border-neutral-100 animate-in fade-in zoom-in">
            <div className="flex justify-between items-center pb-4 border-b border-neutral-150 mb-4">
              <h3 className="font-sans font-black text-sm text-neutral-800">
                {isEditingGrad ? 'แก้ไขบัณฑิตรายบุคคล' : 'เพิ่มรายชื่อสู่ทำเนียบระเบียนบัณฑิต'}
              </h3>
              <button onClick={() => setShowGradModal(false)} className="text-neutral-400 hover:text-neutral-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveGraduate} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-neutral-500 mb-1">รหัสประจำตัวนักศึกษา (Student ID)</label>
                <input
                  type="text"
                  required
                  maxLength={10}
                  placeholder="เช่น 1640901234"
                  value={gradForm.studentId || ''}
                  onChange={(e) => setGradForm({ ...gradForm, studentId: e.target.value.replace(/[^0-9]/g, '') })}
                  className="w-full px-4 py-2 border border-neutral-200 bg-neutral-50 text-xs rounded-xl"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-500 mb-1">ชื่อจริง - นามสกุล</label>
                <input
                  type="text"
                  required
                  placeholder="เช่น สรณารักษ์ มหาโยธิน"
                  value={gradForm.fullName || ''}
                  onChange={(e) => setGradForm({ ...gradForm, fullName: e.target.value })}
                  className="w-full px-4 py-2 border border-neutral-200 bg-neutral-50 text-xs rounded-xl"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-500 mb-1">ปีการศึกษาที่สำเร็จ</label>
                <select
                  value={gradForm.academicYear || '2568'}
                  onChange={(e) => setGradForm({ ...gradForm, academicYear: e.target.value })}
                  className="w-full px-4 py-2 border border-neutral-200 bg-neutral-50 text-xs rounded-xl"
                >
                  {ACADEMIC_YEARS.map(yr => (
                    <option key={yr} value={yr}>{yr}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-500 mb-1">ระดับการศึกษา (Degree Level)</label>
                <select
                  value={gradForm.degreeLevel || 'ระดับปริญญาตรี'}
                  onChange={(e) => setGradForm({ ...gradForm, degreeLevel: e.target.value })}
                  className="w-full px-4 py-2 border border-neutral-200 bg-neutral-50 text-xs rounded-xl"
                >
                  {DEGREE_LEVELS.map(deg => (
                    <option key={deg.value} value={deg.value}>{deg.labelTh}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-500 mb-1">คณะผู้สำเร็จการศึกษา</label>
                <select
                  value={gradForm.faculty || FACULTIES[0]}
                  onChange={(e) => setGradForm({ ...gradForm, faculty: e.target.value })}
                  className="w-full px-4 py-2 border border-neutral-200 bg-neutral-50 text-xs rounded-xl"
                >
                  {FACULTIES.map(fac => <option key={fac} value={fac}>{fac}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-500 mb-1">สาขาวิชา</label>
                <select
                  value={gradForm.major || ''}
                  onChange={(e) => setGradForm({ ...gradForm, major: e.target.value })}
                  className="w-full px-4 py-2 border border-neutral-200 bg-neutral-50 text-xs rounded-xl"
                >
                  {gradForm.faculty && (MAJORS[gradForm.faculty] || []).map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>

              <div className="pt-4 border-t border-neutral-100 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowGradModal(false)}
                  className="px-4 py-2 border border-neutral-200 text-neutral-500 rounded-xl text-xs hover:bg-neutral-50"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold"
                >
                  บันทึกระเบียน
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL WINDOW: CREATE NEW CUSTOM QUESTION */}
      {showQuestionModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 shadow-2xl max-w-md w-full border border-neutral-100">
            <div className="flex justify-between items-center pb-4 border-b border-neutral-150 mb-4">
              <h3 className="font-sans font-black text-sm text-neutral-800">
                เพิ่มข้อสอบถาม/แบบสอบประเมินเพิ่มเติม
              </h3>
              <button onClick={() => setShowQuestionModal(false)} className="text-neutral-400 hover:text-neutral-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddQuestion} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-neutral-500 mb-1">หัวข้อคำถาม (เช่น ข้อมูลเจ้านาย/ข้อมูลผู้บังคับบัญชา)</label>
                <input
                  type="text"
                  required
                  placeholder="เช่น ชื่อผู้บังคับบัญชา และ แผนกจัดจ้าง"
                  value={questionFormData.title}
                  onChange={(e) => setQuestionFormData({ ...questionFormData, title: e.target.value })}
                  className="w-full px-4 py-2 border border-neutral-200 bg-neutral-50 text-xs rounded-xl"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-500 mb-1">ลักษณะข้อมูลตอบรับ</label>
                <select
                  value={questionFormData.type}
                  onChange={(e) => setQuestionFormData({ ...questionFormData, type: e.target.value as any })}
                  className="w-full px-4 py-2 border border-neutral-200 bg-neutral-50 text-xs rounded-xl"
                >
                  <option value="text">พิมพ์ตอบอิสระ (Text Field)</option>
                  <option value="choice">ตัวเลือกจำกัดคำตอบ (Drop down Choice Selection)</option>
                </select>
              </div>

              {questionFormData.type === 'choice' && (
                <div>
                  <label className="block text-xs font-bold text-neutral-500 mb-1">ระบุตัวเลือก (ใช้เครื่องหมายจุลภาค , คั่น)</label>
                  <input
                    type="text"
                    placeholder="เช่น น้อย, ปานกลาง, มากที่สุด"
                    value={questionFormData.optionsInput}
                    onChange={(e) => setQuestionFormData({ ...questionFormData, optionsInput: e.target.value })}
                    className="w-full px-4 py-2 border border-neutral-200 bg-neutral-50 text-xs rounded-xl"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-neutral-500 mb-1">ส่วนหน้าต่างที่ต้องการให้นำเสนอคำถาม</label>
                <select
                  value={questionFormData.section}
                  onChange={(e) => setQuestionFormData({ ...questionFormData, section: e.target.value as any })}
                  className="w-full px-4 py-2 border border-neutral-200 bg-neutral-50 text-xs rounded-xl"
                >
                  <option value="general">หน้าข้อมูลส่วนตัวทั่วไป (ตอนที่ 1)</option>
                  <option value="employed">หน้ากรอกพนักงานมีงานทำ (ตอนที่ 2)</option>
                  <option value="unemployed">หน้ากรอกผู้ยังไม่มีงานทำ (ตอนที่ 3)</option>
                </select>
              </div>

              <div className="flex items-center space-x-2 pt-2">
                <input
                  type="checkbox"
                  id="requiredCheck"
                  checked={questionFormData.required}
                  onChange={(e) => setQuestionFormData({ ...questionFormData, required: e.target.checked })}
                  className="accent-indigo-600 w-4 h-4"
                />
                <label htmlFor="requiredCheck" className="text-xs font-bold text-neutral-600">บังคับต้องตอบข้อนี้ (Required *)</label>
              </div>

              <div className="pt-4 border-t border-neutral-100 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowQuestionModal(false)}
                  className="px-4 py-2 border border-neutral-200 text-neutral-500 rounded-xl text-xs hover:bg-neutral-50"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold"
                >
                  บันทึกข้อระบุ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DETAIL SIDE DRAWER/MODAL FOR SUBMITTED RESPONSE DETAIL */}
      {selectedResponse && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-end p-0">
          <div className="bg-white rounded-l-3xl h-full shadow-2xl max-w-xl w-full border-l border-neutral-100 overflow-y-auto p-6 flex flex-col justify-between animate-in slide-in-from-right">
            
            <div>
              <div className="flex justify-between items-center pb-4 border-b border-neutral-150 mb-6">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-sm">
                    {selectedResponse.firstName ? selectedResponse.firstName[0] : 'U'}
                  </div>
                  <div>
                    <h3 className="font-sans font-black text-sm text-neutral-800">
                      รายละเอียดการรายงานภาวะการทำงาน
                    </h3>
                    <div className="flex flex-col space-y-0.5">
                      <p className="text-[9.5px] text-neutral-400 font-sans">
                        ID: <span className="font-mono font-bold text-neutral-500">{selectedResponse.id}</span>
                      </p>
                      <p className="text-[10px] text-indigo-600 font-sans font-semibold flex items-center space-x-1">
                        <Clock className="w-3 h-3 flex-shrink-0" />
                        <span>วันที่ส่งแบบสอบถาม: {formatResponseDate(selectedResponse.createdAt)}</span>
                      </p>
                    </div>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedResponse(null)} 
                  className="text-neutral-400 hover:text-neutral-600 p-1.5 hover:bg-neutral-100 rounded-xl transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-6">
                
                {/* SECTION A: STUDENT PROFILE CARD */}
                <div className="bg-gradient-to-r from-neutral-50 to-neutral-100/50 p-5 rounded-2xl border border-neutral-200/60 shadow-xs relative overflow-hidden">
                  <div className="absolute right-3 top-3 opacity-5">
                    <GraduationCap className="w-24 h-24" />
                  </div>
                  <h4 className="text-[10.5px] font-black text-neutral-400 uppercase tracking-wider mb-3 flex items-center space-x-1.5">
                    <GraduationCap className="w-4 h-4 text-indigo-500" />
                    <span>ข้อมูลระเบียนส่วนบุคคลบัณฑิต</span>
                  </h4>
                  <div className="grid grid-cols-2 gap-4 text-xs font-sans">
                    <div className="col-span-2 sm:col-span-1">
                      <span className="text-[10px] font-bold text-neutral-400 block mb-0.5">ชื่อ-นามสกุล บัณฑิต</span>
                      <p className="text-neutral-800 font-extrabold text-sm">{selectedResponse.firstName} {selectedResponse.lastName}</p>
                    </div>
                    <div className="col-span-2 sm:col-span-1">
                      <span className="text-[10px] font-bold text-neutral-400 block mb-0.5">รหัสนักศึกษา / ปีการศึกษา</span>
                      <p className="text-neutral-700 font-mono font-extrabold text-sm">{selectedResponse.studentId} <span className="text-neutral-400 font-sans font-medium text-xs">({selectedResponse.academicYear})</span></p>
                    </div>
                    <div className="col-span-2 sm:col-span-1">
                      <span className="text-[10px] font-bold text-neutral-400 block mb-0.5">ระดับการศึกษา</span>
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold border ${
                        (selectedResponse.degreeLevel || 'ระดับปริญญาตรี') === 'ระดับปริญญาเอก'
                          ? 'bg-orange-50 text-orange-700 border-orange-200'
                          : (selectedResponse.degreeLevel || 'ระดับปริญญาตรี') === 'ระดับปริญญาโท'
                          ? 'bg-purple-50 text-purple-700 border-purple-200'
                          : 'bg-indigo-50 text-indigo-700 border-indigo-100'
                      }`}>
                        {selectedResponse.degreeLevel || 'ระดับปริญญาตรี'}
                      </span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-[10px] font-bold text-neutral-400 block mb-0.5">คณะการศึกษา / สาขาวิชา</span>
                      <p className="text-neutral-700 font-semibold text-xs bg-white px-2.5 py-1 rounded-lg border border-neutral-200/50 inline-block">
                        {selectedResponse.faculty} <span className="text-indigo-400 mx-1">/</span> {selectedResponse.major}
                      </p>
                    </div>
                    <div className="col-span-2 sm:col-span-1">
                      <span className="text-[10px] font-bold text-neutral-400 block mb-0.5">เบอร์ติดต่อ</span>
                      <p className="text-neutral-700 font-mono flex items-center space-x-1 font-semibold">
                        <Phone className="w-3.5 h-3.5 text-neutral-400" />
                        <span>{selectedResponse.phone}</span>
                      </p>
                    </div>
                    <div className="col-span-2 sm:col-span-1">
                      <span className="text-[10px] font-bold text-neutral-400 block mb-0.5">อีเมลแอดเดรส</span>
                      <p className="text-neutral-700 font-mono flex items-center space-x-1 font-semibold truncate">
                        <Mail className="w-3.5 h-3.5 text-neutral-400" />
                        <span>{selectedResponse.email}</span>
                      </p>
                    </div>
                    <div className="col-span-2">
                      <span className="text-[10px] font-bold text-neutral-400 block mb-0.5">เดือนที่สำรวจผล</span>
                      <p className="text-neutral-700 font-sans flex items-center space-x-1 font-semibold">
                        <Calendar className="w-3.5 h-3.5 text-neutral-400" />
                        <span>{MONTHS.find(m => m.value === selectedResponse.surveyMonth)?.label || selectedResponse.surveyMonth}</span>
                      </p>
                    </div>
                  </div>
                </div>

                {/* SECTION B: STATUS ACCORDION */}
                <div className="p-5 bg-white rounded-2xl border border-neutral-200/60 shadow-xs space-y-4">
                  <div>
                    <h4 className="text-[10.5px] font-black text-neutral-400 uppercase tracking-wider mb-2 flex items-center space-x-1.5">
                      <Briefcase className="w-4 h-4 text-indigo-500" />
                      <span>สถานภาพและภาวะการทำงาน</span>
                    </h4>
                    <div className="flex items-center space-x-2">
                      {selectedResponse.status === 'employed' && (
                        <span className="inline-flex items-center space-x-1 px-3 py-1 bg-emerald-50 text-emerald-700 font-extrabold text-xs rounded-xl border border-emerald-100">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                          <span>ทำงานแล้วทุกประเภท</span>
                        </span>
                      )}
                      {selectedResponse.status === 'unemployed' && (
                        <span className="inline-flex items-center space-x-1 px-3 py-1 bg-amber-50 text-amber-700 font-extrabold text-xs rounded-xl border border-amber-100">
                          <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                          <span>ยังไม่มีงานทำ (อยู่ระหว่างหางานหรือสมัครงาน)</span>
                        </span>
                      )}
                      {selectedResponse.status === 'not_seeking' && (
                        <span className="inline-flex items-center space-x-1 px-3 py-1 bg-slate-100 text-slate-700 font-extrabold text-xs rounded-xl border border-slate-200">
                          <span className="w-2 h-2 rounded-full bg-slate-400"></span>
                          <span>เหตุผลอื่นๆ</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* SUBSECTION: EMPLOYED IN-DEPTH FIELDS */}
                  {selectedResponse.status === 'employed' && selectedResponse.employedDetails && (
                    <div className="pt-4 border-t border-neutral-150 space-y-4 text-xs font-sans">
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2">
                          <span className="text-[10px] font-bold text-neutral-400 block mb-0.5">ประเภทของงาน / ประเภทหน่วยงาน</span>
                          <p className="text-neutral-800 font-extrabold bg-indigo-50/50 p-2.5 rounded-xl border border-indigo-100/50">
                            {getWorkTypeLabel(selectedResponse.employedDetails.workType, selectedResponse.employedDetails.workTypeOther)}
                          </p>
                        </div>

                        <div>
                          <span className="text-[10px] font-bold text-neutral-400 block mb-0.5">ตำแหน่งงาน (Job Title)</span>
                          <p className="text-neutral-700 font-extrabold text-xs">{selectedResponse.employedDetails.jobTitle || '-'}</p>
                        </div>
                        <div>
                          <span className="text-[10px] font-bold text-neutral-400 block mb-0.5">อัตราเงินเดือนหลัก (Salary)</span>
                          <p className="text-indigo-600 font-mono font-extrabold text-sm flex items-center space-x-1">
                            <DollarSign className="w-4 h-4" />
                            <span>{(selectedResponse.employedDetails.salary || 0).toLocaleString()} บาท/เดือน</span>
                          </p>
                        </div>

                        <div className="col-span-2">
                          <span className="text-[10px] font-bold text-neutral-400 block mb-0.5">ชื่อหน่วยงาน / บริษัท / องค์กรที่สังกัด</span>
                          <p className="text-neutral-700 font-semibold flex items-center space-x-1.5">
                            <Building2 className="w-4 h-4 text-neutral-400 flex-shrink-0" />
                            <span>{selectedResponse.employedDetails.companyName}</span>
                            {selectedResponse.employedDetails.companyDept && (
                              <span className="text-neutral-400 text-[11px] font-normal">({selectedResponse.employedDetails.companyDept})</span>
                            )}
                          </p>
                        </div>

                        <div className="col-span-2 bg-neutral-50 p-3 rounded-xl border border-neutral-200/50">
                          <span className="text-[10px] font-bold text-neutral-400 block mb-1 flex items-center space-x-1">
                            <MapPin className="w-3 h-3 text-neutral-500" />
                            <span>ที่ตั้งสำนักงาน / สถานที่ทำงานเต็ม</span>
                          </span>
                          <p className="text-neutral-600 font-sans leading-relaxed text-[11.5px]">
                            {formatCompanyAddress(selectedResponse.employedDetails.companyAddress)}
                          </p>
                        </div>

                        <div>
                          <span className="text-[10px] font-bold text-neutral-400 block mb-0.5">ความตรงสาย / ความสอดคล้องกับวิชาเรียน</span>
                          <div className="mt-1">
                            {selectedResponse.employedDetails.isRelatedToStudy ? (
                              <span className="inline-flex px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-700 font-bold border border-emerald-100 text-[11px]">
                                ตรงสาย / สอดคล้องวิชาเรียน ✅
                              </span>
                            ) : (
                              <div className="space-y-1">
                                <span className="inline-flex px-2 py-0.5 rounded-lg bg-rose-50 text-rose-700 font-bold border border-rose-100 text-[11px]">
                                  ไม่ตรงสายวิชาเรียน ❌
                                </span>
                                {selectedResponse.employedDetails.unrelatedReason && (
                                  <p className="text-neutral-500 italic text-[11px] block mt-0.5">
                                    เหตุผล: {selectedResponse.employedDetails.unrelatedReason}
                                  </p>
                                )}
                              </div>
                            )}
                          </div>
                        </div>

                        <div>
                          <span className="text-[10px] font-bold text-neutral-400 block mb-0.5">ระยะเวลากว่าที่จะหางานทำได้</span>
                          <p className="text-neutral-700 font-semibold mt-1 flex items-center space-x-1.5">
                            <Clock className="w-3.5 h-3.5 text-indigo-400" />
                            <span>{getTimelineLabel(selectedResponse.employedDetails.timeToGetJob)}</span>
                          </p>
                        </div>

                        {/* SECONDARY INCOME CONTAINER */}
                        <div className="col-span-2 pt-3 border-t border-neutral-100 font-sans">
                          <span className="text-[10px] font-bold text-neutral-400 block mb-1">รายได้พิเศษ / อาชีพเสริมอื่นๆ</span>
                          {selectedResponse.employedDetails.hasOtherIncome ? (
                            <div className="bg-amber-50/40 border border-amber-100 rounded-xl p-3 space-y-1.5">
                              <p className="text-amber-800 font-bold text-[11px] flex items-center space-x-1">
                                <TrendingUp className="w-3.5 h-3.5 text-amber-500" />
                                <span>มีรายได้เสริมเพิ่มเติม</span>
                              </p>
                              {selectedResponse.employedDetails.otherIncomeDetails && (
                                <p className="text-neutral-600 text-[11px] leading-snug">
                                  <span className="font-bold text-neutral-500">ลักษณะงานเสริม:</span> {selectedResponse.employedDetails.otherIncomeDetails}
                                </p>
                              )}
                              {selectedResponse.employedDetails.otherIncomeAmount !== undefined && (
                                <p className="text-neutral-700 text-[11px]">
                                  <span className="font-bold text-neutral-500">รายได้เสริมเฉลี่ย:</span> <span className="text-amber-700 font-mono font-bold">{(selectedResponse.employedDetails.otherIncomeAmount).toLocaleString()} บาท/เดือน</span>
                                </p>
                              )}
                            </div>
                          ) : (
                            <p className="text-neutral-400 italic text-[11px]">ไม่มีรายได้เสริมอื่นนอกเหนือจากงานหลัก</p>
                          )}
                        </div>
                      </div>

                      {/* SELF RATING FOR ENTREPRENEURS */}
                      {['6', '7'].includes(selectedResponse.employedDetails.workType) && (
                        <div className="col-span-2 mt-2 pt-4 border-t border-indigo-100">
                          <span className="text-[10px] font-black text-indigo-700 block mb-2 uppercase tracking-wide font-sans flex items-center space-x-1.5">
                            <Award className="w-4 h-4 text-indigo-500" />
                            <span>ผลการประเมินตนเองในฐานะผู้ประกอบการ (1-10 คะแนน)</span>
                          </span>
                          <div className="bg-indigo-50/30 border border-indigo-100 rounded-xl p-3.5 space-y-2.5 max-h-56 overflow-y-auto">
                            {ENTREPRENEUR_QUESTIONS.map(q => {
                              const score = selectedResponse.employedDetails?.entrepreneurRatings?.[String(q.id)];
                              const percentage = score !== undefined ? (score / 10) * 100 : 0;
                              return (
                                <div key={q.id} className="text-[11px] py-1 border-b border-indigo-150/20 last:border-0 last:pb-0">
                                  <div className="flex items-start justify-between gap-3 mb-1.5">
                                    <span className="text-neutral-700 font-medium font-sans leading-relaxed">
                                      {q.id}. {q.th}
                                    </span>
                                    <span className="font-mono font-bold text-indigo-700 bg-white px-2 py-0.5 rounded-md border border-indigo-100 text-[11px]">
                                      {score !== undefined ? `${score} คะแนน` : 'ไม่ได้ระบุ'}
                                    </span>
                                  </div>
                                  {score !== undefined && (
                                    <div className="w-full h-1.5 bg-indigo-100/50 rounded-full overflow-hidden">
                                      <div 
                                        className="h-full bg-indigo-600 rounded-full" 
                                        style={{ width: `${percentage}%` }}
                                      ></div>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                    </div>
                  )}

                  {/* SUBSECTION: UNEMPLOYED IN-DEPTH FIELDS */}
                  {selectedResponse.status === 'unemployed' && selectedResponse.unemployedDetails && (
                    <div className="pt-4 border-t border-neutral-150 space-y-2 text-xs font-sans">
                      <span className="text-[10px] font-bold text-neutral-400 block mb-0.5">สาเหตุหลักที่บัณฑิตยังไม่มีงานทำ</span>
                      <p className="text-neutral-800 font-extrabold bg-amber-50/40 p-3 rounded-xl border border-amber-100 text-xs">
                        {getUnemployedReasonLabel(selectedResponse.unemployedDetails.reason, selectedResponse.unemployedDetails.reasonOther)}
                      </p>
                    </div>
                  )}

                  {/* SUBSECTION: NOT SEEKING IN-DEPTH FIELDS */}
                  {selectedResponse.status === 'not_seeking' && selectedResponse.notSeekingDetails && (
                    <div className="pt-4 border-t border-neutral-150 space-y-2 text-xs font-sans">
                      <span className="text-[10px] font-bold text-neutral-400 block mb-0.5">เหตุผลและจุดประสงค์เพิ่มเติมอื่นๆ</span>
                      <p className="text-neutral-800 font-extrabold bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs">
                        {getNotSeekingReasonLabel(selectedResponse.notSeekingDetails.reason, selectedResponse.notSeekingDetails.reasonOther)}
                      </p>
                    </div>
                  )}
                </div>

                {/* SECTION C: CUSTOM ANSWERS */}
                {selectedResponse.customAnswers && Object.keys(selectedResponse.customAnswers).length > 0 && (
                  <div className="p-5 bg-white rounded-2xl border border-neutral-200/60 shadow-xs space-y-3">
                    <span className="text-[10.5px] font-extrabold text-indigo-700 tracking-wider block mb-1 uppercase font-sans flex items-center space-x-1.5">
                      <HelpCircle className="w-4 h-4 text-indigo-500" />
                      <span>คำถามพิเศษเพิ่มเติมที่ผู้ดูแลระบบกำหนด</span>
                    </span>
                    <div className="space-y-3 text-xs">
                      {Object.entries(selectedResponse.customAnswers).map(([qKey, val]) => {
                        const questionDesc = customQuestions.find(x => x.id === qKey)?.title || qKey;
                        return (
                          <div key={qKey} className="bg-neutral-50/50 p-3 rounded-xl border border-neutral-200/50 font-sans">
                            <span className="text-[10px] font-bold text-neutral-500 block font-sans mb-1">{questionDesc}</span>
                            <p className="text-neutral-800 font-semibold bg-white px-2.5 py-1.5 rounded-lg border border-neutral-100">{val || '-'}</p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* SECTION D: SUGGESTIONS FOR UNIVERSITY DEVELOPMENT */}
                {selectedResponse.suggestions && (
                  <div className="p-5 bg-white rounded-2xl border border-neutral-200/60 shadow-xs space-y-4">
                    <span className="text-[10.5px] font-extrabold text-indigo-700 tracking-wider block uppercase font-sans flex items-center space-x-1.5">
                      <Heart className="w-4 h-4 text-pink-500 animate-pulse" />
                      <span>ความคิดเห็นและข้อเสนอแนะในการพัฒนาวิทยาลัย</span>
                    </span>
                    <div className="space-y-3 text-xs font-sans">
                      <div className="bg-neutral-50/50 p-3.5 rounded-xl border border-neutral-200/50 font-sans">
                        <span className="text-[10px] font-bold text-neutral-500 block font-sans mb-1.5">
                          1. สิ่งที่ประทับใจต่อมหาวิทยาลัยขณะที่กำลังศึกษาอยู่
                        </span>
                        <div className="bg-white p-2.5 rounded-lg border border-neutral-100 min-h-12 flex items-center">
                          <p className="text-neutral-700 font-sans whitespace-pre-line italic text-xs leading-relaxed">
                            "{selectedResponse.suggestions.impressions || '-'}"
                          </p>
                        </div>
                      </div>
                      <div className="bg-neutral-50/50 p-3.5 rounded-xl border border-neutral-200/50 font-sans">
                        <span className="text-[10px] font-bold text-neutral-500 block font-sans mb-1.5">
                          2. สิ่งที่มหาวิทยาลัยควรปรับปรุงหรือพัฒนาหลักสูตร
                        </span>
                        <div className="bg-white p-2.5 rounded-lg border border-neutral-100 min-h-12 flex items-center">
                          <p className="text-neutral-700 font-sans whitespace-pre-line italic text-xs leading-relaxed">
                            "{selectedResponse.suggestions.improvements || '-'}"
                          </p>
                        </div>
                      </div>
                      <div className="bg-neutral-50/50 p-3.5 rounded-xl border border-neutral-200/50 font-sans">
                        <span className="text-[10px] font-bold text-neutral-500 block font-sans mb-1.5">
                          3. ทักษะ/สิ่งที่มหาวิทยาลัยควรปลูกฝังเพื่อเพิ่มโอกาสในอนาคต
                        </span>
                        <div className="bg-white p-2.5 rounded-lg border border-neutral-100 min-h-12 flex items-center">
                          <p className="text-neutral-700 font-sans whitespace-pre-line italic text-xs leading-relaxed">
                            "{selectedResponse.suggestions.skillsToCultivate || '-'}"
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

              </div>
            </div>

            <div className="pt-6 border-t border-neutral-150 mt-6 flex justify-end">
              <button
                onClick={() => setSelectedResponse(null)}
                className="px-6 py-2.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-600 rounded-xl text-xs font-bold transition-all shadow-xs"
              >
                เสร็จสิ้น / ปิดหน้าต่างรายงาน
              </button>
            </div>

          </div>
        </div>
      )}

      {/* MODAL WINDOW: ADD/EDIT ADMIN USER */}
      {showAdminModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 shadow-2xl max-w-md w-full border border-neutral-100 animate-in fade-in zoom-in">
            <div className="flex justify-between items-center pb-4 border-b border-neutral-150 mb-4 font-sans">
              <h3 className="font-sans font-black text-sm text-neutral-800">
                {isEditingAdmin ? 'แก้ไขข้อมูลผู้ดูแลระบบ' : 'เพิ่มผู้ดูแลระบบใหม่'}
              </h3>
              <button 
                onClick={() => {
                  setShowAdminModal(false);
                  setAdminFormEmail('');
                  setIsEditingAdmin(false);
                  setEditingAdminId(null);
                }} 
                className="text-neutral-400 hover:text-neutral-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAdmin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-neutral-500 mb-1 font-sans">
                  อีเมล (Google Email)
                </label>
                <input
                  type="email"
                  required
                  placeholder="เช่น admin@example.com"
                  value={adminFormEmail}
                  onChange={(e) => setAdminFormEmail(e.target.value)}
                  className="w-full px-4 py-2 border border-neutral-200 bg-neutral-50 text-xs rounded-xl"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-500 mb-1 font-sans">
                  บทบาทผู้ใช้งาน (User Role)
                </label>
                <input
                  type="text"
                  disabled
                  value="admin"
                  className="w-full px-4 py-2 border border-neutral-200 bg-neutral-100 text-xs rounded-xl text-neutral-500 cursor-not-allowed font-sans"
                />
              </div>

              <div className="pt-4 border-t border-neutral-150 flex justify-end space-x-2 font-sans">
                <button
                  type="button"
                  onClick={() => {
                    setShowAdminModal(false);
                    setAdminFormEmail('');
                    setIsEditingAdmin(false);
                    setEditingAdminId(null);
                  }}
                  className="px-4 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-600 rounded-xl text-xs font-bold"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-sm"
                >
                  บันทึกข้อมูล
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CUSTOM CONFIRMATION DIALOG MODAL */}
      {confirmModal && (
        <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 shadow-2xl max-w-md w-full border border-neutral-100 animate-in fade-in zoom-in duration-200 font-sans">
            <div className="flex items-center space-x-3 mb-4 text-red-600">
              <span className="p-2.5 bg-red-50 rounded-2xl">
                <Trash2 className="w-5 h-5 text-red-600" />
              </span>
              <h3 className="font-sans font-black text-sm text-neutral-800">
                {confirmModal.title}
              </h3>
            </div>

            <p className="text-xs text-neutral-600 font-medium leading-relaxed mb-6 whitespace-pre-line">
              {confirmModal.message}
            </p>

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setConfirmModal(null)}
                className="px-4 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-600 rounded-xl text-xs font-bold transition-all"
              >
                {confirmModal.cancelText || 'ยกเลิก'}
              </button>
              <button
                type="button"
                onClick={confirmModal.onConfirm}
                className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all"
              >
                {confirmModal.confirmText || 'ยืนยัน'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

// Extra conversion map helpers
const formatCompanyAddress = (addr: any) => {
  if (!addr) return '-';
  const parts: string[] = [];
  if (addr.no) parts.push(`เลขที่ ${addr.no}`);
  if (addr.moo) parts.push(`หมู่ ${addr.moo}`);
  if (addr.building) parts.push(`อาคาร/ตึก ${addr.building}`);
  if (addr.floor) parts.push(`ชั้น ${addr.floor}`);
  if (addr.soi) parts.push(`ซอย ${addr.soi}`);
  if (addr.road) parts.push(`ถนน ${addr.road}`);
  if (addr.subdistrict) parts.push(`ตำบล/แขวง${addr.subdistrict}`);
  if (addr.district) parts.push(`อำเภอ/เขต${addr.district}`);
  if (addr.province) parts.push(`จังหวัด${addr.province}`);
  if (addr.zipcode) parts.push(addr.zipcode);
  return parts.length > 0 ? parts.join(' ') : '-';
};

const getWorkTypeLabel = (val: string, otherVal?: string) => {
  const wt = WORK_TYPES.find(x => x.value === val);
  let label = wt ? wt.label : val;
  if (label && /^\d+\.\s*/.test(label)) {
    label = label.replace(/^\d+\.\s*/, '');
  }
  if (['6', '7', '8'].includes(val) && otherVal) {
    return `${label} (${otherVal})`;
  }
  return label || '-';
};

const getTimelineLabel = (timelineValue: string) => {
  const labelObj = [
    { value: "1", label: "ได้งานทันที" },
    { value: "2", label: "1-2 เดือน" },
    { value: "3", label: "3-6 เดือน" },
    { value: "4", label: "7-9 เดือน" },
    { value: "5", label: "10-12 เดือน" },
    { value: "6", label: "มากกว่า 1 ปี" },
    { value: "7", label: "ได้งานทำระหว่างศึกษา" }
  ].find(x => x.value === timelineValue);
  let label = labelObj ? labelObj.label : timelineValue;
  if (label && /^\d+\.\s*/.test(label)) {
    label = label.replace(/^\d+\.\s*/, '');
  }
  return label;
};

const getUnemployedReasonLabel = (val: string, otherVal?: string) => {
  const r = UNEMPLOYED_REASONS.find(x => x.value === val);
  let label = r ? r.label : val;
  if (label && /^\d+\.\s*/.test(label)) {
    label = label.replace(/^\d+\.\s*/, '');
  }
  if (val === "5" && otherVal) {
    return `${label} (${otherVal})`;
  }
  return label;
};

const getNotSeekingReasonLabel = (val: string, otherVal?: string) => {
  const r = NOT_SEEKING_REASONS.find(x => x.value === val);
  let label = r ? r.label : val;
  if (label && /^\d+\.\s*/.test(label)) {
    label = label.replace(/^\d+\.\s*/, '');
  }
  if (val === "9" && otherVal) {
    return `${label} (${otherVal})`;
  }
  return label;
};

const formatResponseDate = (createdAt: any): string => {
  if (!createdAt) return '-';
  try {
    let date: Date;
    if (typeof createdAt.toDate === 'function') {
      date = createdAt.toDate();
    } else if (createdAt instanceof Date) {
      date = createdAt;
    } else if (typeof createdAt === 'string' || typeof createdAt === 'number') {
      date = new Date(createdAt);
    } else if (createdAt.seconds) {
      date = new Date(createdAt.seconds * 1000);
    } else if (createdAt._seconds) {
      date = new Date(createdAt._seconds * 1000);
    } else {
      return '-';
    }

    if (isNaN(date.getTime())) return '-';

    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear() + 543; // Convert to Buddhist Era (BE)
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    
    return `${day}/${month}/${year} ${hours}:${minutes} น.`;
  } catch (err) {
    console.error('Error formatting date:', err);
    return '-';
  }
};

