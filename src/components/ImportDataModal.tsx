import React, { useState, useRef, useMemo } from 'react';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  writeBatch, 
  doc 
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { 
  FACULTIES, 
  MAJORS, 
  normalizeFacultyName, 
  normalizeDegreeLevel, 
  normalizeWorkStatus,
  ACADEMIC_YEARS 
} from '../data';
import { Graduate, SurveyResponse } from '../types';
import { 
  Upload, 
  X, 
  FileSpreadsheet, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  Calendar, 
  Layers, 
  Check, 
  Trash2, 
  ArrowRight,
  Info,
  Sparkles,
  GraduationCap,
  BarChart3
} from 'lucide-react';

interface ImportDataModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultYear?: string;
  availableYears?: string[];
  initialTargetType?: 'graduates' | 'responses';
  graduatesList?: Graduate[];
  onImportComplete?: (importedYear: string, targetType: 'graduates' | 'responses', count: number) => void;
}

interface ParsedGraduateItem {
  academicYear: string;
  degreeLevel: string;
  studentId: string;
  fullName: string;
  firstName: string;
  lastName: string;
  faculty: string;
  major: string;
  isValid: boolean;
  warning?: string;
}

interface ParsedResponseItem {
  academicYear: string;
  degreeLevel: string;
  studentId: string;
  firstName: string;
  lastName: string;
  faculty: string;
  major: string;
  phone: string;
  email: string;
  status: 'employed' | 'unemployed' | 'not_seeking';
  surveyMonth: string;
  employedDetails?: any;
  unemployedDetails?: any;
  notSeekingDetails?: any;
  suggestions?: {
    impressions: string;
    improvements: string;
    skillsToCultivate: string;
  };
  isValid: boolean;
  warning?: string;
}

export default function ImportDataModal({
  isOpen,
  onClose,
  defaultYear = '2568',
  availableYears = ACADEMIC_YEARS,
  initialTargetType = 'graduates',
  graduatesList = [],
  onImportComplete
}: ImportDataModalProps) {
  // Target collection to import into
  const [targetType, setTargetType] = useState<'graduates' | 'responses'>(initialTargetType);

  // Year Selection States
  const [selectedYear, setSelectedYear] = useState<string>(defaultYear);
  const [customYear, setCustomYear] = useState<string>('');
  const [isCustomYearMode, setIsCustomYearMode] = useState<boolean>(false);
  const [yearStrategy, setYearStrategy] = useState<'enforce_selected' | 'prefer_file'>('enforce_selected');

  // Conflict handling: append or replace year
  const [conflictMode, setConflictMode] = useState<'append' | 'replace_year'>('append');

  // File & Parsing States
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isParsing, setIsParsing] = useState<boolean>(false);
  const [parseError, setParseError] = useState<string>('');
  
  const [parsedGraduates, setParsedGraduates] = useState<ParsedGraduateItem[]>([]);
  const [parsedResponses, setParsedResponses] = useState<ParsedResponseItem[]>([]);

  // Execution & Progress States
  const [isImporting, setIsImporting] = useState<boolean>(false);
  const [importProgress, setImportProgress] = useState<{ current: number; total: number; percent: number }>({ current: 0, total: 0, percent: 0 });
  const [importStatusText, setImportStatusText] = useState<string>('');
  const [successReport, setSuccessReport] = useState<{
    targetType: 'graduates' | 'responses';
    targetYear: string;
    totalImported: number;
    deletedPrevious: number;
  } | null>(null);

  // Effective year to use
  const effectiveYear = useMemo(() => {
    if (isCustomYearMode) {
      const trimmed = customYear.trim();
      return /^\d{4}$/.test(trimmed) ? trimmed : '2568';
    }
    return selectedYear || '2568';
  }, [isCustomYearMode, customYear, selectedYear]);

  // Merge available years with common defaults (excluding 2565 and 2566)
  const yearOptions = useMemo(() => {
    const list = Array.from(new Set([...ACADEMIC_YEARS, ...availableYears, '2569', '2568', '2567']))
      .filter(y => /^\d{4}$/.test(y) && y !== '2565' && y !== '2566')
      .sort((a, b) => b.localeCompare(a));
    return list;
  }, [availableYears]);

  if (!isOpen) return null;

  // CSV Line Parser handling quotes, commas, tabs
  const parseCSVLine = (line: string): string[] => {
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

  // Process File when selected
  const handleFileProcess = (file: File) => {
    if (!file) return;
    setSelectedFile(file);
    setIsParsing(true);
    setParseError('');
    setSuccessReport(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        if (!text || !text.trim()) {
          setParseError('ไฟล์ว่างเปล่า ไม่พบข้อมูล');
          setIsParsing(false);
          return;
        }

        const lines = text.split(/\r\n|\n|\r/).map(r => r.trim()).filter(Boolean);
        if (lines.length === 0) {
          setParseError('ไม่พบแถวข้อมูลในไฟล์');
          setIsParsing(false);
          return;
        }

        const headerCols = parseCSVLine(lines[0]).map(c => c.replace(/^["']|["']$/g, '').trim());
        const lowerHeaders = headerCols.map(c => c.toLowerCase());

        // Header detection
        let yearIdx = lowerHeaders.findIndex(h => h.includes('ปีการศึกษา') || h.includes('ปี') || h.includes('academic') || h.includes('year'));
        let degreeIdx = lowerHeaders.findIndex(h => h.includes('ระดับ') || h.includes('ปริญญา') || h.includes('degree') || h.includes('level'));
        let idIdx = lowerHeaders.findIndex(h => h.includes('รหัสนักศึกษา') || h.includes('รหัส') || h.includes('studentid') || h.includes('student_id'));
        let firstIdx = lowerHeaders.findIndex(h => (h.includes('ชื่อ') || h.includes('firstname')) && !h.includes('นามสกุล') && !h.includes('ชื่อ-'));
        let lastIdx = lowerHeaders.findIndex(h => h.includes('นามสกุล') || h.includes('lastname') || h.includes('surname'));
        let fullIdx = lowerHeaders.findIndex(h => h.includes('ชื่อ-นามสกุล') || h.includes('ชื่อนามสกุล') || h.includes('fullname'));
        let facIdx = lowerHeaders.findIndex(h => h.includes('คณะ') || h.includes('faculty') || h.includes('school'));
        let majIdx = lowerHeaders.findIndex(h => h.includes('สาขา') || h.includes('major') || h.includes('department'));
        let phoneIdx = lowerHeaders.findIndex(h => h.includes('โทร') || h.includes('phone') || h.includes('tel') || h.includes('mobile'));
        let emailIdx = lowerHeaders.findIndex(h => h.includes('อีเมล') || h.includes('email') || h.includes('mail'));
        let statusIdx = lowerHeaders.findIndex(h => h.includes('สถานะ') || h.includes('status') || h.includes('ภาวะ'));
        let salaryIdx = lowerHeaders.findIndex(h => h.includes('เงินเดือน') || h.includes('salary') || h.includes('รายได้'));
        let jobIdx = lowerHeaders.findIndex(h => h.includes('ตำแหน่ง') || h.includes('job') || h.includes('title'));
        let companyIdx = lowerHeaders.findIndex(h => h.includes('บริษัท') || h.includes('หน่วยงาน') || h.includes('company') || h.includes('workplace'));
        let impressionIdx = lowerHeaders.findIndex(h => h.includes('ประทับใจ') || h.includes('impression'));
        let improveIdx = lowerHeaders.findIndex(h => h.includes('ปรับปรุง') || h.includes('พัฒนาหลักสูตร') || h.includes('improvement'));
        let skillIdx = lowerHeaders.findIndex(h => h.includes('ปลูกฝัง') || h.includes('ทักษะ') || h.includes('skill'));

        const matchedCount = [yearIdx, degreeIdx, idIdx, firstIdx, lastIdx, fullIdx, facIdx, majIdx].filter(x => x >= 0).length;
        const isHeaderRow = matchedCount >= 2;
        const startLine = isHeaderRow ? 1 : 0;

        // Auto-detect 7-column layout if headers not present
        if (!isHeaderRow) {
          const sample = parseCSVLine(lines[0]);
          if (/^(25|20)\d{2}$/.test(sample[0]) || sample[0]?.length === 4) {
            yearIdx = 0; degreeIdx = 1; idIdx = 2; firstIdx = 3; lastIdx = 4; facIdx = 5; majIdx = 6;
          } else {
            yearIdx = 0; degreeIdx = 1; idIdx = 2; firstIdx = 3; lastIdx = 4; facIdx = 5; majIdx = 6;
          }
        }

        if (targetType === 'graduates') {
          const items: ParsedGraduateItem[] = [];
          for (let i = startLine; i < lines.length; i++) {
            const cols = parseCSVLine(lines[i]).map(c => c.replace(/^["']|["']$/g, '').trim());
            if (cols.length < 2) continue;

            // Determine Academic Year based on selected strategy
            let rowYear = effectiveYear;
            if (yearStrategy === 'prefer_file' && yearIdx >= 0 && cols[yearIdx] && /^\d{4}$/.test(cols[yearIdx].trim())) {
              rowYear = cols[yearIdx].trim();
            }

            const rawDeg = degreeIdx >= 0 ? cols[degreeIdx] : '';
            const degreeLevel = normalizeDegreeLevel(rawDeg);
            const rawId = idIdx >= 0 && cols[idIdx] ? cols[idIdx].replace(/[^0-9]/g, '') : '';
            
            let firstName = firstIdx >= 0 && cols[firstIdx] ? cols[firstIdx] : '';
            let lastName = lastIdx >= 0 && cols[lastIdx] ? cols[lastIdx] : '';
            let fullName = '';

            if (firstName || lastName) {
              fullName = `${firstName} ${lastName}`.trim();
            } else if (fullIdx >= 0 && cols[fullIdx]) {
              fullName = cols[fullIdx].replace(/\s+/g, ' ').trim();
              const parts = fullName.split(/\s+/);
              firstName = parts[0] || '';
              lastName = parts.slice(1).join(' ') || '';
            }

            const rawFac = facIdx >= 0 && cols[facIdx] ? cols[facIdx] : '';
            const rawMaj = majIdx >= 0 && cols[majIdx] ? cols[majIdx] : '';
            const faculty = normalizeFacultyName(rawFac, rawMaj, rawId, graduatesList);
            const major = rawMaj || MAJORS[faculty]?.[0] || 'สาขาวิชาทั่วไป';

            const isValid = rawId.length === 10 && !!fullName;
            let warning = '';
            if (rawId.length !== 10) {
              warning = `รหัสนักศึกษา (${rawId}) ไม่ครบ 10 หลัก`;
            }

            items.push({
              academicYear: rowYear,
              degreeLevel,
              studentId: rawId,
              fullName,
              firstName,
              lastName,
              faculty,
              major,
              isValid,
              warning
            });
          }

          setParsedGraduates(items);
          if (items.length === 0) {
            setParseError('ไม่พบข้อมูลรายชื่อบัณฑิตที่สามารถประมวลผลได้');
          }
        } else {
          // Survey Responses
          const items: ParsedResponseItem[] = [];
          for (let i = startLine; i < lines.length; i++) {
            const cols = parseCSVLine(lines[i]).map(c => c.replace(/^["']|["']$/g, '').trim());
            if (cols.length < 2) continue;

            let rowYear = effectiveYear;
            if (yearStrategy === 'prefer_file' && yearIdx >= 0 && cols[yearIdx] && /^\d{4}$/.test(cols[yearIdx].trim())) {
              rowYear = cols[yearIdx].trim();
            }

            const rawDeg = degreeIdx >= 0 ? cols[degreeIdx] : '';
            const degreeLevel = normalizeDegreeLevel(rawDeg);
            const rawId = idIdx >= 0 && cols[idIdx] ? cols[idIdx].replace(/[^0-9]/g, '') : '';
            
            let firstName = firstIdx >= 0 && cols[firstIdx] ? cols[firstIdx] : '';
            let lastName = lastIdx >= 0 && cols[lastIdx] ? cols[lastIdx] : '';
            if (!firstName && fullIdx >= 0 && cols[fullIdx]) {
              const parts = cols[fullIdx].split(/\s+/);
              firstName = parts[0] || 'บัณฑิต';
              lastName = parts.slice(1).join(' ') || '';
            }

            const rawFac = facIdx >= 0 && cols[facIdx] ? cols[facIdx] : '';
            const rawMaj = majIdx >= 0 && cols[majIdx] ? cols[majIdx] : '';
            const faculty = normalizeFacultyName(rawFac, rawMaj, rawId, graduatesList);
            const major = rawMaj || MAJORS[faculty]?.[0] || 'สาขาวิชาทั่วไป';

            const phone = phoneIdx >= 0 && cols[phoneIdx] ? cols[phoneIdx] : '0800000000';
            const email = emailIdx >= 0 && cols[emailIdx] ? cols[emailIdx] : `${rawId}@bu.ac.th`;

            const rawStatus = statusIdx >= 0 ? cols[statusIdx] : '';
            const status = normalizeWorkStatus({ status: rawStatus });

            const salary = salaryIdx >= 0 && cols[salaryIdx] ? parseInt(cols[salaryIdx].replace(/[^0-9]/g, '') || '0', 10) : 0;
            const jobTitle = jobIdx >= 0 && cols[jobIdx] ? cols[jobIdx] : '';
            const companyName = companyIdx >= 0 && cols[companyIdx] ? cols[companyIdx] : '';

            const impressions = impressionIdx >= 0 && cols[impressionIdx] ? cols[impressionIdx] : '';
            const improvements = improveIdx >= 0 && cols[improveIdx] ? cols[improveIdx] : '';
            const skillsToCultivate = skillIdx >= 0 && cols[skillIdx] ? cols[skillIdx] : '';

            items.push({
              academicYear: rowYear,
              degreeLevel,
              studentId: rawId,
              firstName: firstName || 'บัณฑิต',
              lastName: lastName || '-',
              faculty,
              major,
              phone,
              email,
              status,
              surveyMonth: '06',
              employedDetails: status === 'employed' ? {
                jobTitle: jobTitle || 'พนักงานบริษัท/ผู้ประกอบวิชาชีพ',
                companyName: companyName || 'องค์กรภาคเอกชน',
                companyDept: 'ฝ่ายปฏิบัติการ',
                companyAddress: {
                  no: '1', moo: '', building: '', floor: '', soi: '', road: '', subdistrict: '', district: '', province: 'กรุงเทพมหานคร', zipcode: '10110'
                },
                salary: salary || 22000,
                hasOtherIncome: false,
                isRelatedToStudy: true,
                timeToGetJob: '1'
              } : undefined,
              unemployedDetails: status === 'unemployed' ? { reason: '4' } : undefined,
              notSeekingDetails: status === 'not_seeking' ? { reason: '1' } : undefined,
              suggestions: {
                impressions,
                improvements,
                skillsToCultivate
              },
              isValid: !!rawId
            });
          }

          setParsedResponses(items);
          if (items.length === 0) {
            setParseError('ไม่พบข้อมูลผลสำรวจที่สามารถประมวลผลได้');
          }
        }
      } catch (err: any) {
        console.error('File parsing error:', err);
        setParseError(`เกิดข้อผิดพลาดในการอ่านไฟล์: ${err.message || 'โครงสร้างไม่ถูกต้อง'}`);
      } finally {
        setIsParsing(false);
      }
    };

    reader.readAsText(file, 'UTF-8');
  };

  // Re-run parsing if yearStrategy changes while a file is already loaded
  const handleYearChange = (newYear: string) => {
    setSelectedYear(newYear);
    setIsCustomYearMode(false);
    if (selectedFile) {
      setTimeout(() => handleFileProcess(selectedFile), 50);
    }
  };

  const handleStrategyChange = (newStrategy: 'enforce_selected' | 'prefer_file') => {
    setYearStrategy(newStrategy);
    if (selectedFile) {
      setTimeout(() => handleFileProcess(selectedFile), 50);
    }
  };

  // Execute Batch Import to Firestore
  const handleExecuteImport = async () => {
    const isGrads = targetType === 'graduates';
    const totalItems = isGrads ? parsedGraduates.length : parsedResponses.length;
    if (totalItems === 0) return;

    setIsImporting(true);
    setImportProgress({ current: 0, total: totalItems, percent: 0 });
    setImportStatusText('กำลังเตรียมการบันทึกข้อมูล...');
    let deletedCount = 0;

    try {
      const collectionName = isGrads ? 'graduates' : 'survey_responses';

      // 1. Replace Mode: Delete existing docs of effectiveYear
      if (conflictMode === 'replace_year') {
        setImportStatusText(`กำลังล้างข้อมูลเดิมของปีการศึกษา ${effectiveYear}...`);
        const q = query(collection(db, collectionName), where('academicYear', '==', effectiveYear));
        const snapshot = await getDocs(q);
        
        const docsToDelete = snapshot.docs;
        deletedCount = docsToDelete.length;

        // Batch delete in chunks of 450
        const chunkSize = 450;
        for (let i = 0; i < docsToDelete.length; i += chunkSize) {
          const chunk = docsToDelete.slice(i, i + chunkSize);
          const batch = writeBatch(db);
          chunk.forEach(d => batch.delete(d.ref));
          await batch.commit();
        }
      }

      // 2. Insert new documents in chunks of 400 using writeBatch
      setImportStatusText(`กำลังบันทึก ${totalItems} รายการเข้าสู่ปีการศึกษา ${effectiveYear}...`);
      const BATCH_SIZE = 400;
      let processed = 0;

      if (isGrads) {
        for (let i = 0; i < parsedGraduates.length; i += BATCH_SIZE) {
          const chunk = parsedGraduates.slice(i, i + BATCH_SIZE);
          const batch = writeBatch(db);

          chunk.forEach(item => {
            const docRef = doc(collection(db, 'graduates'));
            batch.set(docRef, {
              studentId: item.studentId,
              fullName: item.fullName,
              firstName: item.firstName,
              lastName: item.lastName,
              faculty: item.faculty,
              major: item.major,
              academicYear: item.academicYear,
              degreeLevel: item.degreeLevel
            });
          });

          await batch.commit();
          processed += chunk.length;
          const pct = Math.round((processed / totalItems) * 100);
          setImportProgress({ current: processed, total: totalItems, percent: pct });
          setImportStatusText(`บันทึกแล้ว ${processed.toLocaleString()} จาก ${totalItems.toLocaleString()} รายชื่อ (${pct}%)`);
        }
      } else {
        for (let i = 0; i < parsedResponses.length; i += BATCH_SIZE) {
          const chunk = parsedResponses.slice(i, i + BATCH_SIZE);
          const batch = writeBatch(db);

          chunk.forEach(item => {
            const docRef = doc(collection(db, 'survey_responses'));
            const payload: any = {
              studentId: item.studentId,
              firstName: item.firstName,
              lastName: item.lastName,
              faculty: item.faculty,
              major: item.major,
              phone: item.phone,
              email: item.email,
              academicYear: item.academicYear,
              degreeLevel: item.degreeLevel,
              surveyMonth: item.surveyMonth,
              status: item.status,
              createdAt: new Date()
            };
            if (item.employedDetails) payload.employedDetails = item.employedDetails;
            if (item.unemployedDetails) payload.unemployedDetails = item.unemployedDetails;
            if (item.notSeekingDetails) payload.notSeekingDetails = item.notSeekingDetails;
            if (item.suggestions) payload.suggestions = item.suggestions;

            batch.set(docRef, payload);
          });

          await batch.commit();
          processed += chunk.length;
          const pct = Math.round((processed / totalItems) * 100);
          setImportProgress({ current: processed, total: totalItems, percent: pct });
          setImportStatusText(`บันทึกแล้ว ${processed.toLocaleString()} จาก ${totalItems.toLocaleString()} รายการ (${pct}%)`);
        }
      }

      setSuccessReport({
        targetType,
        targetYear: effectiveYear,
        totalImported: totalItems,
        deletedPrevious: deletedCount
      });

      if (onImportComplete) {
        onImportComplete(effectiveYear, targetType, totalItems);
      }
    } catch (err: any) {
      console.error('Import execution failed:', err);
      try {
        handleFirestoreError(err, OperationType.WRITE, targetType === 'graduates' ? 'graduates' : 'survey_responses');
      } catch (e: any) {
        setParseError(`เกิดข้อผิดพลาดในการบันทึกข้อมูล: ${e.message}`);
      }
    } finally {
      setIsImporting(false);
    }
  };

  // Helper to download sample CSV template for the selected academic year
  const downloadSampleTemplate = () => {
    if (targetType === 'graduates') {
      const headers = 'ปีการศึกษา,ระดับปริญญา,รหัสนักศึกษา,ชื่อ,นามสกุล,คณะ,สาขา\n';
      const sampleRows = [
        `${effectiveYear},ระดับปริญญาตรี,1640901234,สมชาย,รักเรียน,คณะเทคโนโลยีสารสนเทศและนวัตกรรม,วิทยาการคอมพิวเตอร์`,
        `${effectiveYear},ระดับปริญญาตรี,1640905678,แพรวา,บุญประเสริฐ,คณะนิเทศศาสตร์,การสื่อสารการตลาดดิจิทัล`,
        `${effectiveYear},ระดับปริญญาตรี,1640909999,ธนภูมิ,สุขนิรันดร์,คณะบริหารธุรกิจ,การตลาด`,
        `${effectiveYear},ระดับปริญญาโท,1640902222,ชลลดา,สุวรรณดี,คณะวิศวกรรมศาสตร์,วิศวกรรมคอมพิวเตอร์`,
        `${effectiveYear},ระดับปริญญาเอก,1640903333,ใจดี,วัฒนกิจ,คณะมนุษยศาสตร์และการจัดการการท่องเที่ยว,การจัดการการท่องเที่ยว`
      ].join('\n');
      const blob = new Blob(['\uFEFF' + headers + sampleRows], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `sample_graduates_year_${effectiveYear}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } else {
      const headers = 'รหัสนักศึกษา,ชื่อ,นามสกุล,ระดับการศึกษา,คณะ,สาขาวิชา,ปีการศึกษา,เบอร์โทรศัพท์,อีเมล,สถานะ,ตำแหน่งงาน,บริษัท,เงินเดือน,สิ่งที่ประทับใจต่อมหาวิทยาลัย,สิ่งที่มหาวิทยาลัยควรปรับปรุงหรือพัฒนาหลักสูตร,สิ่งที่มหาวิทยาลัยควรปลูกฝังเพื่อเพิ่มทักษะความรู้ให้แก่ตัวบัณฑิต\n';
      const sampleRows = [
        `1640901234,สมชาย,รักเรียน,ระดับปริญญาตรี,คณะเทคโนโลยีสารสนเทศและนวัตกรรม,วิทยาการคอมพิวเตอร์,${effectiveYear},0812345678,somchai@bu.ac.th,ทำงานแล้ว,Software Engineer,บริษัท เทคโนโลยี จำกัด,32000,อาจารย์เอาใจใส่ ห้องปฏิบัติการทันสมัย,อยากให้เพิ่มวิชา AI และ Cloud,ทักษะการทำงานร่วมกับผู้อื่นและการสื่อสาร`,
        `1640905678,แพรวา,บุญประเสริฐ,ระดับปริญญาตรี,คณะนิเทศศาสตร์,การสื่อสารการตลาดดิจิทัล,${effectiveYear},0898765432,praewa@bu.ac.th,ทำงานแล้ว,Digital Content Creator,บริษัท มีเดีย จำกัด,25000,อุปกรณ์ถ่ายทำครบครัน มี workshop ลงมือทำจริง,อยากให้เพิ่มการวิเคราะห์ข้อมูลผู้บริโภค,ภาษาอังกฤษเพื่อการสื่อสารระดับสากล`,
        `1640909999,ธนภูมิ,สุขนิรันดร์,ระดับปริญญาตรี,คณะบริหารธุรกิจ,การตลาด,${effectiveYear},0845678901,thanapoom@bu.ac.th,ยังไม่มีงานทำ,,,,,,บรรยากาศในมหาวิทยาลัยอบอุ่น,ต้องการให้จัด job fair บ่อยขึ้น,เทคนิคการสัมภาษณ์งาน`
      ].join('\n');
      const blob = new Blob(['\uFEFF' + headers + sampleRows], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `sample_survey_responses_year_${effectiveYear}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  const previewItems = targetType === 'graduates' ? parsedGraduates : parsedResponses;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full border border-neutral-200 overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-200 font-sans">
        
        {/* MODAL HEADER */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-indigo-50/80 via-white to-violet-50/80 border-b border-neutral-150 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white flex items-center justify-center shadow-sm">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-sans font-black text-base sm:text-lg text-neutral-900 flex items-center space-x-2">
                <span>นำเข้าข้อมูลตามปีการศึกษา</span>
                <span className="px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-700 font-mono text-xs font-bold">
                  ปีการศึกษา {effectiveYear}
                </span>
              </h3>
              <p className="text-xs text-neutral-500 font-medium">
                เลือกปีการศึกษาเป้าหมายและอัปโหลดไฟล์ CSV เพื่อนำเข้าข้อมูลรายชื่อบัณฑิตหรือผลสำรวจ
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isImporting}
            className="p-2 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 rounded-xl transition-all cursor-pointer disabled:opacity-30"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* MODAL BODY */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1 text-xs">

          {/* SUCCESS BANNER */}
          {successReport && (
            <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-950 space-y-3 animate-in fade-in">
              <div className="flex items-start space-x-3">
                <CheckCircle2 className="w-6 h-6 text-emerald-600 flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="font-black text-sm text-emerald-900">
                    นำเข้าข้อมูลสำเร็จเรียบร้อยแล้ว! 🎉
                  </h4>
                  <p className="text-xs text-emerald-800 leading-relaxed">
                    บันทึกข้อมูลเข้าสู่ฐานข้อมูลสำเร็จจำนวน <strong>{successReport.totalImported.toLocaleString()} รายการ</strong> สำหรับ <strong>ปีการศึกษา {successReport.targetYear}</strong>
                    {successReport.deletedPrevious > 0 && ` (ล้างข้อมูลชุดเดิมออก ${successReport.deletedPrevious.toLocaleString()} รายการ)`}
                  </p>
                </div>
              </div>
              <div className="flex justify-end space-x-2 pt-2 border-t border-emerald-200/60">
                <button
                  onClick={() => {
                    setSuccessReport(null);
                    setSelectedFile(null);
                    setParsedGraduates([]);
                    setParsedResponses([]);
                  }}
                  className="px-4 py-2 bg-white border border-emerald-300 text-emerald-800 hover:bg-emerald-100 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  นำเข้าไฟล์อื่นเพิ่มเติม
                </button>
                <button
                  onClick={onClose}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer"
                >
                  เสร็จสิ้น / ปิดหน้าต่าง
                </button>
              </div>
            </div>
          )}

          {!successReport && (
            <>
              {/* TARGET TYPE TABS */}
              <div className="flex p-1 bg-neutral-100 rounded-2xl">
                <button
                  type="button"
                  onClick={() => {
                    setTargetType('graduates');
                    if (selectedFile) handleFileProcess(selectedFile);
                  }}
                  className={`flex-1 py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center space-x-2 transition-all cursor-pointer ${
                    targetType === 'graduates'
                      ? 'bg-white text-indigo-700 shadow-xs'
                      : 'text-neutral-500 hover:text-neutral-900'
                  }`}
                >
                  <GraduationCap className="w-4 h-4" />
                  <span>ทำเนียบรายชื่อบัณฑิต (Graduates Roster)</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTargetType('responses');
                    if (selectedFile) handleFileProcess(selectedFile);
                  }}
                  className={`flex-1 py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center space-x-2 transition-all cursor-pointer ${
                    targetType === 'responses'
                      ? 'bg-white text-indigo-700 shadow-xs'
                      : 'text-neutral-500 hover:text-neutral-900'
                  }`}
                >
                  <BarChart3 className="w-4 h-4" />
                  <span>ผลการตอบแบบสำรวจ (Survey Responses)</span>
                </button>
              </div>

              {/* STEP 1: SELECT ACADEMIC YEAR */}
              <div className="bg-neutral-50/80 p-4 sm:p-5 rounded-2xl border border-neutral-200/80 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="w-6 h-6 rounded-full bg-indigo-600 text-white text-[11px] font-black flex items-center justify-center">1</span>
                    <label className="font-black text-neutral-800 text-xs uppercase tracking-wider">
                      เลือกปีการศึกษาที่ต้องการนำเข้า (Academic Year)
                    </label>
                  </div>
                  <span className="text-[11px] text-neutral-500">
                    ปีที่เลือก: <strong className="text-indigo-600 font-mono text-xs">{effectiveYear}</strong>
                  </span>
                </div>

                {/* YEAR BADGE SELECTOR */}
                <div className="flex flex-wrap gap-2 items-center">
                  {yearOptions.map(yr => (
                    <button
                      key={yr}
                      type="button"
                      onClick={() => handleYearChange(yr)}
                      className={`px-3.5 py-1.5 rounded-xl font-mono text-xs font-bold border transition-all cursor-pointer flex items-center space-x-1.5 ${
                        !isCustomYearMode && selectedYear === yr
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs scale-102'
                          : 'bg-white text-neutral-700 border-neutral-200 hover:border-indigo-300 hover:bg-indigo-50/50'
                      }`}
                    >
                      <span>ปีการศึกษา {yr}</span>
                      {!isCustomYearMode && selectedYear === yr && (
                        <Check className="w-3.5 h-3.5" />
                      )}
                    </button>
                  ))}

                  <button
                    type="button"
                    onClick={() => {
                      setIsCustomYearMode(true);
                      if (!customYear) setCustomYear('2570');
                    }}
                    className={`px-3 py-1.5 rounded-xl font-sans text-xs font-bold border transition-all cursor-pointer ${
                      isCustomYearMode
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                        : 'bg-white text-neutral-600 border-neutral-200 hover:bg-neutral-100'
                    }`}
                  >
                    + กำหนดปีอื่นเอง
                  </button>
                </div>

                {/* CUSTOM YEAR INPUT BOX */}
                {isCustomYearMode && (
                  <div className="flex items-center space-x-2 p-3 bg-white rounded-xl border border-indigo-200 animate-in fade-in">
                    <Calendar className="w-4 h-4 text-indigo-600" />
                    <span className="text-xs font-bold text-neutral-700">ระบุปีการศึกษา (พ.ศ. 4 หลัก):</span>
                    <input
                      type="text"
                      maxLength={4}
                      value={customYear}
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^0-9]/g, '');
                        setCustomYear(val);
                        if (val.length === 4 && selectedFile) {
                          setTimeout(() => handleFileProcess(selectedFile), 50);
                        }
                      }}
                      placeholder="เช่น 2570"
                      className="w-24 px-3 py-1 font-mono font-bold text-sm text-indigo-700 border border-indigo-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <span className="text-[11px] text-neutral-400 font-sans">
                      (ระบบจะบันทึกข้อมูลเข้าสู่ปีการศึกษา {customYear || '...'})
                    </span>
                  </div>
                )}

                {/* YEAR ASSIGNMENT STRATEGY */}
                <div className="pt-2 border-t border-neutral-200/60 space-y-2">
                  <span className="text-[10.5px] font-bold text-neutral-500 uppercase tracking-wider block">
                    กลยุทธ์การกำหนดปีการศึกษา:
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <label className={`p-3 rounded-xl border flex items-start space-x-2.5 cursor-pointer transition-all ${
                      yearStrategy === 'enforce_selected'
                        ? 'bg-indigo-50/70 border-indigo-300 text-indigo-950 font-semibold'
                        : 'bg-white border-neutral-200 text-neutral-600 hover:bg-neutral-50'
                    }`}>
                      <input
                        type="radio"
                        name="yearStrategy"
                        checked={yearStrategy === 'enforce_selected'}
                        onChange={() => handleStrategyChange('enforce_selected')}
                        className="mt-0.5 text-indigo-600 focus:ring-indigo-500 accent-indigo-600"
                      />
                      <div className="space-y-0.5">
                        <strong className="block text-xs font-bold">บังคับใช้ปีการศึกษา {effectiveYear} ทุกรายชื่อ (แนะนำ)</strong>
                        <p className="text-[10.5px] text-neutral-500 leading-relaxed font-normal">
                          กำหนดปีการศึกษาที่เลือกนี้ให้ทุกแถวในไฟล์ เหมาะเมื่อไฟล์ไม่มีคอลัมน์ปีการศึกษาหรือต้องการรวมเข้าปีนี้ทั้งหมด
                        </p>
                      </div>
                    </label>

                    <label className={`p-3 rounded-xl border flex items-start space-x-2.5 cursor-pointer transition-all ${
                      yearStrategy === 'prefer_file'
                        ? 'bg-indigo-50/70 border-indigo-300 text-indigo-950 font-semibold'
                        : 'bg-white border-neutral-200 text-neutral-600 hover:bg-neutral-50'
                    }`}>
                      <input
                        type="radio"
                        name="yearStrategy"
                        checked={yearStrategy === 'prefer_file'}
                        onChange={() => handleStrategyChange('prefer_file')}
                        className="mt-0.5 text-indigo-600 focus:ring-indigo-500 accent-indigo-600"
                      />
                      <div className="space-y-0.5">
                        <strong className="block text-xs font-bold">ใช้ตามคอลัมน์ปีการศึกษาในไฟล์ CSV</strong>
                        <p className="text-[10.5px] text-neutral-500 leading-relaxed font-normal">
                          อ่านปีการศึกษาจากแต่ละแถวในไฟล์ หากแถวใดเว้นว่างจะใช้ปีการศึกษา {effectiveYear} เป็นค่าเริ่มต้น
                        </p>
                      </div>
                    </label>
                  </div>
                </div>

                {/* CONFLICT HANDLING (APPEND VS REPLACE) */}
                <div className="pt-2 border-t border-neutral-200/60 space-y-2">
                  <span className="text-[10.5px] font-bold text-neutral-500 uppercase tracking-wider block">
                    การจัดการข้อมูลเดิมของปีการศึกษา {effectiveYear}:
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <label className={`p-3 rounded-xl border flex items-start space-x-2.5 cursor-pointer transition-all ${
                      conflictMode === 'append'
                        ? 'bg-indigo-50/70 border-indigo-300 text-indigo-950 font-semibold'
                        : 'bg-white border-neutral-200 text-neutral-600 hover:bg-neutral-50'
                    }`}>
                      <input
                        type="radio"
                        name="conflictMode"
                        checked={conflictMode === 'append'}
                        onChange={() => setConflictMode('append')}
                        className="mt-0.5 text-indigo-600 focus:ring-indigo-500 accent-indigo-600"
                      />
                      <div className="space-y-0.5">
                        <strong className="block text-xs font-bold">นำเข้าเพิ่มต่อท้าย (Append / Update)</strong>
                        <p className="text-[10.5px] text-neutral-500 leading-relaxed font-normal">
                          บันทึกรายชื่อใหม่เพิ่มเข้าไป ข้อมูลเดิมของปีการศึกษานี้จะยังคงอยู่
                        </p>
                      </div>
                    </label>

                    <label className={`p-3 rounded-xl border flex items-start space-x-2.5 cursor-pointer transition-all ${
                      conflictMode === 'replace_year'
                        ? 'bg-red-50/70 border-red-300 text-red-950 font-semibold'
                        : 'bg-white border-neutral-200 text-neutral-600 hover:bg-neutral-50'
                    }`}>
                      <input
                        type="radio"
                        name="conflictMode"
                        checked={conflictMode === 'replace_year'}
                        onChange={() => setConflictMode('replace_year')}
                        className="mt-0.5 text-red-600 focus:ring-red-500 accent-red-600"
                      />
                      <div className="space-y-0.5">
                        <strong className="block text-xs font-bold text-red-900">ล้างข้อมูลเดิมของปี {effectiveYear} ทั้งหมดก่อนนำเข้า (Clean Replace)</strong>
                        <p className="text-[10.5px] text-red-700/80 leading-relaxed font-normal">
                          ลบข้อมูลเก่าของปีนี้ออกก่อนทั้งหมด แล้วนำเข้าชุดใหม่ ป้องกันข้อมูลซ้ำซ้อน
                        </p>
                      </div>
                    </label>
                  </div>
                </div>

              </div>

              {/* STEP 2: CHOOSE CSV FILE / DRAG & DROP */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="w-6 h-6 rounded-full bg-indigo-600 text-white text-[11px] font-black flex items-center justify-center">2</span>
                    <label className="font-black text-neutral-800 text-xs uppercase tracking-wider">
                      เลือกไฟล์ CSV สำหรับนำเข้า
                    </label>
                  </div>

                  <button
                    type="button"
                    onClick={downloadSampleTemplate}
                    className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 rounded-xl font-bold text-xs transition-colors cursor-pointer"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                    <span>ดาวน์โหลดเทมเพลต CSV ตัวอย่าง (ปี {effectiveYear})</span>
                  </button>
                </div>

                <div
                  onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDragging(false);
                    const file = e.dataTransfer.files?.[0];
                    if (file) handleFileProcess(file);
                  }}
                  onClick={() => fileInputRef.current?.click()}
                  className={`p-6 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
                    isDragging
                      ? 'border-indigo-500 bg-indigo-50/50 scale-101'
                      : selectedFile
                      ? 'border-emerald-300 bg-emerald-50/20'
                      : 'border-neutral-200 hover:border-indigo-300 hover:bg-neutral-50/60'
                  }`}
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept=".csv,text/csv"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileProcess(file);
                    }}
                  />

                  <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-2">
                    {isParsing ? (
                      <RefreshCw className="w-6 h-6 animate-spin text-indigo-600" />
                    ) : selectedFile ? (
                      <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                    ) : (
                      <Upload className="w-6 h-6" />
                    )}
                  </div>

                  {selectedFile ? (
                    <div className="space-y-1">
                      <p className="font-bold text-neutral-800 text-xs">
                        {selectedFile.name}
                      </p>
                      <p className="text-[11px] text-neutral-400 font-mono">
                        {(selectedFile.size / 1024).toFixed(1)} KB • คลิกเพื่อเปลี่ยนไฟล์ใหม่
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <p className="font-bold text-neutral-700 text-xs">
                        คลิกเพื่อเลือกไฟล์ หรือลากไฟล์ CSV มาวางที่นี่
                      </p>
                      <p className="text-[11px] text-neutral-400">
                        รองรับไฟล์ .csv (UTF-8) รูปแบบ 7 คอลัมน์ หรือไฟล์ที่มีหัวคอลัมน์มาตรฐาน
                      </p>
                    </div>
                  )}
                </div>

                {parseError && (
                  <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded-xl text-xs font-semibold flex items-center space-x-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-600" />
                    <span>{parseError}</span>
                  </div>
                )}
              </div>

              {/* STEP 3: PREVIEW & VALIDATION */}
              {previewItems.length > 0 && (
                <div className="space-y-3 pt-2 border-t border-neutral-150 animate-in fade-in">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div className="flex items-center space-x-2">
                      <span className="w-6 h-6 rounded-full bg-indigo-600 text-white text-[11px] font-black flex items-center justify-center">3</span>
                      <label className="font-black text-neutral-800 text-xs uppercase tracking-wider">
                        ตัวอย่างข้อมูลที่ตรวจพบ ({previewItems.length.toLocaleString()} รายการ)
                      </label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <span className="px-2.5 py-1 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-700 font-bold text-[11px]">
                        เป้าหมาย: ปีการศึกษา {effectiveYear}
                      </span>
                      <span className="px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 font-bold text-[11px]">
                        พร้อมนำเข้า: {previewItems.length.toLocaleString()} แถว
                      </span>
                    </div>
                  </div>

                  {/* PREVIEW TABLE (TOP 5 ROWS) */}
                  <div className="overflow-x-auto rounded-xl border border-neutral-200 bg-white">
                    <table className="w-full text-left text-[11px] border-collapse">
                      <thead>
                        <tr className="bg-neutral-50 text-neutral-500 font-bold border-b border-neutral-200">
                          <th className="px-3 py-2 whitespace-nowrap">ปีการศึกษาที่จะบันทึก</th>
                          <th className="px-3 py-2 whitespace-nowrap">ระดับปริญญา</th>
                          <th className="px-3 py-2 whitespace-nowrap">รหัสนักศึกษา</th>
                          <th className="px-3 py-2 whitespace-nowrap">ชื่อ - นามสกุล</th>
                          <th className="px-3 py-2 whitespace-nowrap">คณะ</th>
                          <th className="px-3 py-2 whitespace-nowrap">สาขาวิชา</th>
                          {targetType === 'responses' && (
                            <th className="px-3 py-2 whitespace-nowrap">สถานะการทำงาน</th>
                          )}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-100">
                        {previewItems.slice(0, 5).map((row: any, idx: number) => (
                          <tr key={idx} className="hover:bg-neutral-50/50">
                            <td className="px-3 py-1.5 font-mono font-bold text-indigo-600 whitespace-nowrap">
                              {row.academicYear}
                            </td>
                            <td className="px-3 py-1.5 whitespace-nowrap">
                              <span className="px-1.5 py-0.5 rounded bg-neutral-100 text-[10px] font-semibold text-neutral-700">
                                {row.degreeLevel}
                              </span>
                            </td>
                            <td className="px-3 py-1.5 font-mono font-bold text-neutral-800 whitespace-nowrap">
                              {row.studentId}
                            </td>
                            <td className="px-3 py-1.5 font-medium whitespace-nowrap">
                              {targetType === 'graduates' ? row.fullName : `${row.firstName} ${row.lastName}`}
                            </td>
                            <td className="px-3 py-1.5 text-neutral-700 whitespace-nowrap">
                              {row.faculty}
                            </td>
                            <td className="px-3 py-1.5 text-neutral-500 whitespace-nowrap">
                              {row.major}
                            </td>
                            {targetType === 'responses' && (
                              <td className="px-3 py-1.5 whitespace-nowrap">
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  row.status === 'employed'
                                    ? 'bg-emerald-50 text-emerald-700'
                                    : row.status === 'unemployed'
                                    ? 'bg-amber-50 text-amber-700'
                                    : 'bg-neutral-100 text-neutral-600'
                                }`}>
                                  {row.status === 'employed' ? 'ทำงานแล้ว' : row.status === 'unemployed' ? 'ยังไม่มีงาน' : 'อื่นๆ'}
                                </span>
                              </td>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {previewItems.length > 5 && (
                    <p className="text-[10.5px] text-neutral-400 italic text-right">
                      * แสดงตัวอย่าง 5 รายการแรก จากทั้งหมด {previewItems.length.toLocaleString()} รายการในไฟล์
                    </p>
                  )}
                </div>
              )}

              {/* PROGRESS BAR DURING EXECUTION */}
              {isImporting && (
                <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-2xl space-y-2 animate-in fade-in">
                  <div className="flex justify-between items-center text-xs font-bold text-indigo-900">
                    <span className="flex items-center space-x-2">
                      <RefreshCw className="w-4 h-4 animate-spin text-indigo-600" />
                      <span>{importStatusText}</span>
                    </span>
                    <span className="font-mono">{importProgress.percent}%</span>
                  </div>
                  <div className="w-full bg-indigo-100 rounded-full h-2.5 overflow-hidden">
                    <div 
                      className="bg-indigo-600 h-2.5 rounded-full transition-all duration-300"
                      style={{ width: `${importProgress.percent}%` }}
                    ></div>
                  </div>
                  <p className="text-[10.5px] text-indigo-700 font-sans">
                    ระบบกำลังทำการจัดเก็บเข้าสู่ Firestore Cloud Database กรุณาอย่าปิดหน้าต่างจนกว่ากระบวนการจะเสร็จสิ้น
                  </p>
                </div>
              )}
            </>
          )}

        </div>

        {/* MODAL FOOTER */}
        {!successReport && (
          <div className="p-4 sm:p-5 bg-neutral-50 border-t border-neutral-150 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-xs text-neutral-500">
              {previewItems.length > 0 ? (
                <span>
                  พร้อมนำเข้า <strong className="text-neutral-800">{previewItems.length.toLocaleString()}</strong> รายการ สู่ <strong>ปีการศึกษา {effectiveYear}</strong>
                </span>
              ) : (
                <span>โปรดเลือกไฟล์ CSV เพื่อตรวจสอบตัวอย่างก่อนนำเข้า</span>
              )}
            </div>

            <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={onClose}
                disabled={isImporting}
                className="px-4 py-2.5 border border-neutral-200 bg-white hover:bg-neutral-100 text-neutral-700 rounded-xl text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
              >
                ยกเลิก
              </button>

              <button
                type="button"
                onClick={handleExecuteImport}
                disabled={isImporting || previewItems.length === 0}
                className="flex-1 sm:flex-initial px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 disabled:opacity-40 text-white rounded-xl text-xs font-black shadow-md hover:shadow-lg transition-all cursor-pointer flex items-center justify-center space-x-2"
              >
                {isImporting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>กำลังนำเข้า ({importProgress.percent}%)...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    <span>
                      ยืนยันนำเข้าข้อมูลเข้าสู่ปีการศึกษา {effectiveYear} ({previewItems.length.toLocaleString()} รายการ)
                    </span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
