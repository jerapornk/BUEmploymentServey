export const FACULTIES = [
  "คณะเทคโนโลยีสารสนเทศและนวัตกรรม",
  "คณะวิศวกรรมศาสตร์",
  "คณะบัญชี",
  "คณะบริหารธุรกิจ",
  "คณะเศรษฐศาสตร์และการลงทุน",
  "คณะนิติศาสตร์",
  "คณะนิเทศศาสตร์",
  "คณะมนุษยศาสตร์และการจัดการการท่องเที่ยว",
  "คณะศิลปกรรมศาสตร์",
  "คณะสถาปัตยกรรมศาสตร์",
  "คณะการสร้างเจ้าของธุรกิจและการบริหารจัดการ (BUSEM)",
  "คณะดิจิทัลมีเดียและศิลปะภาพยนตร์",
  "วิทยาลัยนานาชาติ (BUI)",
  "วิทยาลัยนานาชาติจีน (BUCI)"
];

export const FACULTY_ABBR_MAP: Record<string, string> = {
  "คณะเทคโนโลยีสารสนเทศและนวัตกรรม": "TI",
  "คณะวิศวกรรมศาสตร์": "EN",
  "คณะบัญชี": "AC",
  "คณะบริหารธุรกิจ": "BA",
  "คณะเศรษฐศาสตร์และการลงทุน": "EC",
  "คณะนิติศาสตร์": "LA",
  "คณะนิเทศศาสตร์": "CA",
  "คณะมนุษยศาสตร์และการจัดการการท่องเที่ยว": "HTM",
  "คณะศิลปกรรมศาสตร์": "FA",
  "คณะสถาปัตยกรรมศาสตร์": "AR",
  "คณะการสร้างเจ้าของธุรกิจและการบริหารกิจการ": "SEM",
  "คณะการสร้างเจ้าของธุรกิจและการบริหารจัดการ (BUSEM)": "SEM",
  "คณะดิจิทัลมีเดียและศิลปภาพยนตร์": "DC",
  "คณะดิจิทัลมีเดียและศิลปะภาพยนตร์": "DC",
  "วิทยาลัยนานาชาติ": "BUI",
  "วิทยาลัยนานาชาติ (BUI)": "BUI",
  "วิทยาลัยนานาชาติ (BUInter)": "BUI",
  "วิทยาลัยนานาชาติ (BUIC)": "BUI",
  "วิทยาลัยนานาชาติจีน": "BUCI",
  "วิทยาลัยนานาชาติจีน (BUCI)": "BUCI"
};

export const normalizeFacultyName = (
  rawFaculty?: string,
  majorName?: string,
  studentId?: string,
  graduatesList?: { studentId: string; faculty: string; major?: string }[]
): string => {
  let f = (rawFaculty || '').trim().replace(/เเ/g, 'แ');

  // If directly matching one of the FACULTIES, return it
  if (FACULTIES.includes(f)) return f;

  // If rawFaculty is empty or is purely numbers (e.g. from previous corrupted CSV shift where studentId was placed in faculty column)
  if (!f || /^\d+$/.test(f)) {
    const lookupId = (studentId || f).trim();
    if (lookupId && graduatesList && graduatesList.length > 0) {
      const g = graduatesList.find(item => item.studentId === lookupId);
      if (g && g.faculty && !/^\d+$/.test(g.faculty.trim())) {
        return normalizeFacultyName(g.faculty, majorName || g.major);
      }
    }
  }

  // Check aliases and keywords
  const upper = f.toUpperCase();
  if (upper.includes('BUCI') || f.includes('จีน')) {
    return 'วิทยาลัยนานาชาติจีน (BUCI)';
  }
  if (upper.includes('BUINTER') || upper.includes('BUIC') || upper.includes('BUI') || (f.includes('นานาชาติ') && !f.includes('จีน'))) {
    return 'วิทยาลัยนานาชาติ (BUI)';
  }
  if (upper.includes('BUSEM') || f.includes('การสร้างเจ้าของธุรกิจ')) {
    return 'คณะการสร้างเจ้าของธุรกิจและการบริหารจัดการ (BUSEM)';
  }
  if (f.includes('ดิจิทัลมีเดีย') || f.includes('ศิลปะภาพยนตร์') || f.includes('ศิลปภาพยนตร์') || upper === 'DC') {
    return 'คณะดิจิทัลมีเดียและศิลปะภาพยนตร์';
  }
  if (f.includes('เทคโนโลยีสารสนเทศ') || upper === 'TI') {
    return 'คณะเทคโนโลยีสารสนเทศและนวัตกรรม';
  }
  if (f.includes('วิศวกรรม') || upper === 'EN') {
    return 'คณะวิศวกรรมศาสตร์';
  }
  if (f.includes('บัญชี') || upper === 'AC') {
    return 'คณะบัญชี';
  }
  if (f.includes('บริหารธุรกิจ') || upper === 'BA') {
    return 'คณะบริหารธุรกิจ';
  }
  if (f.includes('เศรษฐศาสตร์') || upper === 'EC') {
    return 'คณะเศรษฐศาสตร์และการลงทุน';
  }
  if (f.includes('นิติศาสตร์') || upper === 'LA') {
    return 'คณะนิติศาสตร์';
  }
  if (f.includes('นิเทศศาสตร์') || upper === 'CA') {
    return 'คณะนิเทศศาสตร์';
  }
  if (f.includes('มนุษยศาสตร์') || f.includes('ท่องเที่ยว') || upper === 'HTM') {
    return 'คณะมนุษยศาสตร์และการจัดการการท่องเที่ยว';
  }
  if (f.includes('ศิลปกรรม') || upper === 'FA') {
    return 'คณะศิลปกรรมศาสตร์';
  }
  if (f.includes('สถาปัตยกรรม') || upper === 'AR') {
    return 'คณะสถาปัตยกรรมศาสตร์';
  }

  // Infer from major if available
  if (majorName) {
    const cleanMajor = majorName.trim().replace(/เเ/g, 'แ');
    for (const [fac, majors] of Object.entries(MAJORS)) {
      if (majors.some(m => cleanMajor.includes(m) || m.includes(cleanMajor))) {
        return fac;
      }
    }
  }

  // Check prefix / partial match against standard faculties
  for (const fac of FACULTIES) {
    const strippedFac = fac.replace(/^คณะ/, '').trim();
    if (f.includes(strippedFac) || strippedFac.includes(f)) {
      return fac;
    }
  }

  // Fallback to match in graduatesList if studentId was passed
  if (studentId && graduatesList && graduatesList.length > 0) {
    const g = graduatesList.find(item => item.studentId === studentId);
    if (g && g.faculty) {
      return normalizeFacultyName(g.faculty, g.major);
    }
  }

  // Guarantees returning one of the valid 14 faculties so responses are never omitted from charts
  return 'คณะบริหารธุรกิจ';
};

export const normalizeWorkStatus = (r: {
  status?: string;
  workStatus?: string;
  employedDetails?: any;
  unemployedDetails?: any;
  notSeekingDetails?: any;
}): 'employed' | 'unemployed' | 'not_seeking' => {
  const s = String(r.status || r.workStatus || '').trim().toLowerCase();
  if (
    s === 'employed' ||
    s.includes('ทำแล้ว') ||
    s.includes('มีงาน') ||
    s.includes('ทำงาน') ||
    s === '1' ||
    s.includes('ประกอบอาชีพ')
  ) {
    return 'employed';
  }
  if (
    s === 'unemployed' ||
    s.includes('ยังไม่มีงาน') ||
    s.includes('ว่างงาน') ||
    s.includes('หางาน') ||
    s === '2'
  ) {
    return 'unemployed';
  }
  if (
    s === 'not_seeking' ||
    s.includes('ศึกษา') ||
    s.includes('บวช') ||
    s.includes('เกณฑ์ทหาร') ||
    s.includes('ไม่ประสงค์') ||
    s === '3'
  ) {
    return 'not_seeking';
  }
  if (r.employedDetails && (r.employedDetails.salary || r.employedDetails.jobTitle || r.employedDetails.companyName)) {
    return 'employed';
  }
  if (r.unemployedDetails) {
    return 'unemployed';
  }
  if (r.notSeekingDetails) {
    return 'not_seeking';
  }
  return 'not_seeking';
};

export const normalizeDegreeLevel = (degree?: string): string => {
  const d = String(degree || '').trim();
  if (d.includes('เอก') || d.toLowerCase().includes('doc')) return 'ระดับปริญญาเอก';
  if (d.includes('โท') || d.toLowerCase().includes('master')) return 'ระดับปริญญาโท';
  return 'ระดับปริญญาตรี';
};

export const MAJORS: Record<string, string[]> = {
  "คณะเทคโนโลยีสารสนเทศและนวัตกรรม": [
    "วิทยาการคอมพิวเตอร์",
    "เทคโนโลยีสารสนเทศ",
    "เกมและสื่อเชิงโต้ตอบ",
    "วิศวกรรมข้อมูลและการวิเคราะห์และการจัดการเทคโนโลยีอุตสาหกรรม"
  ],
  "คณะบริหารธุรกิจ": [
    "การตลาด",
    "การจัดการ",
    "การเงิน",
    "การบริหารธุรกิจระหว่างประเทศ",
    "การมุ่งเน้นนวัตกรรมและการวิเคราะห์ข้อมูลการตลาด"
  ],
  "คณะนิเทศศาสตร์": [
    "สื่อสารตราสินค้าดิจิทัล",
    "ศิลปะการแสดงและการกำกับ",
    "การผลิตสื่อคอนเทนท์และพอดแคสต์",
    "โฆษณาและการประชาสัมพันธ์",
    "วารสารศาสตร์คอนเทนต์เชิงพาณิชย์"
  ],
  "คณะวิศวกรรมศาสตร์": [
    "วิศวกรรมคอมพิวเตอร์",
    "วิศวกรรมเทคโนโลยีชีวภาพ",
    "วิศวกรรมมัลติมีเดียและระบบกระจายเสียง",
    "วิศวกรรมไฟฟ้า"
  ],
  "คณะมนุษยศาสตร์และการจัดการการท่องเที่ยว": [
    "การจัดการการท่องเที่ยวและการบริการ",
    "การสาธิตการบินและการบินพาณิชย์",
    "ภาษาโปรตุเกสธุรกิจ",
    "ภาษาอังกฤษธุรกิจ",
    "ภาษาจีนธุรกิจ",
    "ภาษาญี่ปุ่นธุรกิจ"
  ],
  "คณะบัญชี": [
    "การบัญชี",
    "ระบบสารสนเทศทางการบัญชี"
  ],
  "คณะนิติศาสตร์": [
    "นิติศาสตร์",
    "กฎหมายธุรกิจดิจิทัล"
  ],
  "คณะเศรษฐศาสตร์และการลงทุน": [
    "เศรษฐศาสตร์ธุรกิจ",
    "การวิเคราะห์การลงทุน"
  ],
  "คณะศิลปกรรมศาสตร์": [
    "การออกแบบกราฟิกและอินเทอร์แอกทีฟ",
    "สถาปัตยกรรมภายใน",
    "ศิลปะและการออกแบบผลิตภัณฑ์"
  ],
  "คณะสถาปัตยกรรมศาสตร์": [
    "สถาปัตยกรรมศาสตร์",
    "การออกแบบภายใน"
  ],
  "คณะการสร้างเจ้าของธุรกิจและการบริหารจัดการ (BUSEM)": [
    "การสร้างเจ้าของธุรกิจดิจิทัล",
    "ผู้ประกอบการทางเทคโนโลยี"
  ],
  "คณะดิจิทัลมีเดียและศิลปะภาพยนตร์": [
    "ภาพยนตร์และสื่อระบบดิจิทัล",
    "เอฟเฟกต์ภาพและแอนิเมชัน"
  ],
  "วิทยาลัยนานาชาติ (BUI)": [
    "International Business",
    "Communication Arts",
    "Computer Graphics and Multimedia",
    "Culinary Arts and Design"
  ],
  "วิทยาลัยนานาชาติ (BUInter)": [
    "International Business",
    "Communication Arts",
    "Computer Graphics and Multimedia",
    "Culinary Arts and Design"
  ],
  "วิทยาลัยนานาชาติจีน (BUCI)": [
    "ภาษาจีนเพื่อธุรกิจระหว่างประเทศ",
    "การค้าระหว่างประเทศจีน",
    "การตลาดดิจิทัลจีน",
    "อุตสาหกรรมการท่องเที่ยวและการบริการ"
  ]
};

export const WORK_TYPES = [
  { value: "1", label: "1. ข้าราชการ/เจ้าหน้าที่หน่วยงานของรัฐ" },
  { value: "2", label: "2. พนักงาน/ลูกจ้างรัฐวิสาหกิจ" },
  { value: "3", label: "3. พนักงานบริษัท/องค์กรธุรกิจเอกชน" },
  { value: "4", label: "4. พนักงานองค์การต่างประเทศ/ระหว่างประเทศ" },
  { value: "5", label: "5. ประกอบอาชีพอิสระ (เช่น อินฟลูเอนเซอร์ ยูทูบเบอร์ เทรดเดอร์ สตรีมเมอร์ เป็นต้น ฯลฯ)" },
  { value: "6", label: "6. เจ้าของกิจการ - ระบุลักษณะของงาน (เช่น เสื้อผ้า เบเกอรี่ เครื่องสำอาง ฯลฯ)" },
  { value: "7", label: "7. ธุรกิจครอบครัว - ระบุลักษณะของงาน (เช่น เสื้อผ้า เบเกอรี่ เครื่องสำอาง ฯลฯ)" },
  { value: "8", label: "8. อื่นๆ - ระบุ" }
];

export const UNEMPLOYED_REASONS = [
  { value: "1", label: "1. รอฟังคำตอบจากหน่วยงาน" },
  { value: "2", label: "2. หางานทำไม่ได้" },
  { value: "3", label: "3. หางานที่ถูกใจไม่ได้" },
  { value: "4", label: "4. กำลังหางานทำ" },
  { value: "5", label: "5. อื่นๆ (ระบุเหตุผล)" }
];

export const NOT_SEEKING_REASONS = [
  { value: "1", label: "1. กำลังศึกษาต่อ" },
  { value: "2", label: "2. อุปสมบท" },
  { value: "3", label: "3. เกณฑ์ทหาร" },
  { value: "4", label: "4. รอรับปริญญา" },
  { value: "5", label: "5. รอศึกษาต่อ" },
  { value: "6", label: "6. รอไปต่างประเทศ" },
  { value: "7", label: "7. ดูแลพ่อแม่/ญาติที่กำลังป่วย" },
  { value: "8", label: "8. ต้องการพักผ่อน" },
  { value: "9", label: "9. อื่นๆ(ระบุ)" }
];

export const GET_JOB_TIMELINE = [
  { value: "1", label: "1. ได้งานทันที" },
  { value: "2", label: "2. 1-2 เดือน" },
  { value: "3", label: "3. 3-6 เดือน" },
  { value: "4", label: "4. 7-9 เดือน" },
  { value: "5", label: "5. 10-12 เดือน" },
  { value: "6", label: "6. มากกว่า 1 ปี" },
  { value: "7", label: "7. ได้งานทำระหว่างศึกษา" }
];

export const MONTHS = [
  { value: "01", label: "มกราคม" },
  { value: "02", label: "กุมภาพันธ์" },
  { value: "03", label: "มีนาคม" },
  { value: "04", label: "เมษายน" },
  { value: "05", label: "พฤษภาคม" },
  { value: "06", label: "มิถุนายน" },
  { value: "07", label: "กรกฎาคม" },
  { value: "08", label: "สิงหาคม" },
  { value: "09", label: "กันยายน" },
  { value: "10", label: "ตุลาคม" },
  { value: "11", label: "พฤศจิกายน" },
  { value: "12", label: "ธันวาคม" }
];

export const ACADEMIC_YEARS = ["2567", "2568"];

export const DEGREE_LEVELS = [
  { value: "ระดับปริญญาตรี", labelTh: "ระดับปริญญาตรี", labelEn: "Bachelor's Degree", shortTh: "ป.ตรี" },
  { value: "ระดับปริญญาโท", labelTh: "ระดับปริญญาโท", labelEn: "Master's Degree", shortTh: "ป.โท" },
  { value: "ระดับปริญญาเอก", labelTh: "ระดับปริญญาเอก", labelEn: "Doctoral Degree", shortTh: "ป.เอก" }
];

// Simple bootstrap graduates to make testing straight out of the box easy
export const STUB_GRADUATES = [
  {
    studentId: "1640901234",
    fullName: "สมชาย รักเรียน",
    faculty: "คณะเทคโนโลยีสารสนเทศและนวัตกรรม",
    major: "วิทยาการคอมพิวเตอร์",
    academicYear: "2568",
    degreeLevel: "ระดับปริญญาตรี"
  },
  {
    studentId: "1640905678",
    fullName: "สุดารัตน์ บิวตี้",
    faculty: "คณะดิจิทัลมีเดียและศิลปะภาพยนตร์",
    major: "ภาพยนตร์และสื่อระบบดิจิทัล",
    academicYear: "2568",
    degreeLevel: "ระดับปริญญาโท"
  },
  {
    studentId: "1640909999",
    fullName: "ณัฐพงษ์ มั่งมี",
    faculty: "คณะวิศวกรรมศาสตร์",
    major: "วิศวกรรมคอมพิวเตอร์",
    academicYear: "2568",
    degreeLevel: "ระดับปริญญาเอก"
  }
];
