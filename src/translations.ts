export interface Dictionary {
  langLabel: string;
  surveyTitle: string;
  surveySubtitle: string;
  qualityStandard: string;
  instructionTitle: string;
  instructionText: string;
  p1ObjectiveTitle: string;
  p1ObjectiveDesc: string;
  p2PdpaTitle: string;
  p2PdpaDesc: string;
  p3FastTitle: string;
  p3FastDesc: string;
  startSurveyBtn: string;
  submittedRecent: string;
  stepGeneral: string;
  stepEmployment: string;
  stepStatistics: string;
  stepReview: string;
  stepSuggestions: string;
  enterStudentIdTitle: string;
  enterStudentIdDesc: string;
  studentIdPlaceholder: string;
  identityCheckBtn: string;
  verifyingId: string;
  idSuccessAlert: string;
  idNotFoundAlert: string;
  idRequired: string;
  firstNameLabel: string;
  lastNameLabel: string;
  facultyLabel: string;
  majorLabel: string;
  phoneLabel: string;
  emailLabel: string;
  prevBtn: string;
  nextBtn: string;
  submitSurveyBtn: string;
  submittingText: string;
  academicYearLabel: string;
  surveyMonthLabel: string;
  
  // Section 2: Status choice
  statusChooseTitle: string;
  statusEmployed: string;
  statusEmployedDesc: string;
  statusUnemployed: string;
  statusUnemployedDesc: string;
  statusNotSeeking: string;
  statusNotSeekingDesc: string;

  // Employed Fields
  professionType: string;
  workPosition: string;
  organizationName: string;
  department: string;
  orgAddress: string;
  addressNo: string;
  addressMoo: string;
  addressBuilding: string;
  addressFloor: string;
  addressSoi: string;
  addressRoad: string;
  addressSubdistrict: string;
  addressDistrict: string;
  addressProvince: string;
  addressZipcode: string;
  salaryLabel: string;
  otherIncomeLabel: string;
  otherIncomeDesc: string;
  otherIncomeSubLabel: string;
  otherIncomeAmount: string;
  matchEdu: string;
  timeSpentJobSeeking: string;
  
  // Yes/No & options
  yesLabel: string;
  noLabel: string;
  specifyDetail: string;
  selectOption: string;
  otherSpecify: string;

  // Unemployed Fields
  unemployedReasonTitle: string;
  notSeekingReasonTitle: string;

  // Review
  confirmSubmitTitle: string;
  confirmSubmitDesc: string;
  reviewSummary: string;
  reviewPersonal: string;
  reviewStatus: string;
  reviewDetails: string;
  reviewEmploymentDetails: string;
  reviewUnemployedDetails: string;
  reviewNotSeekingDetails: string;
  reviewCustomAnswers: string;

  // Success screen
  successTitle: string;
  successDesc: string;
  additionalResponseBtn: string;

  // Validations
  errFirstName: string;
  errLastName: string;
  errFaculty: string;
  errMajor: string;
  errPhone: string;
  errEmail: string;
  errSurveyMonth: string;
  errWorkType: string;
  errJobTitle: string;
  errCompanyName: string;
  errSalary: string;
  errUnemployedReason: string;
  errNotSeekingReason: string;
  errOtherIncome: string;

  // Options Translations
  professionsList: Record<string, string>;
  unemployedReasonsList: Record<string, string>;
  notSeekingReasonsList: Record<string, string>;
  getJobTimelineList: Record<string, string>;
  facultiesList: Record<string, string>;
}

export const TRANSLATIONS: Record<'th' | 'en', Dictionary> = {
  th: {
    langLabel: "ภาษาไทย",
    surveyTitle: "แบบสำรวจภาวะการมีงานทำ",
    surveySubtitle: "สำหรับ บัณฑิต มหาบัณฑิตและดุษฎีบัณฑิต มหาวิทยาลัยกรุงเทพ ประจำปี พ.ศ. 2568",
    qualityStandard: "แบบสำรวจมาตรฐานคุณภาพการศึกษาระดับอุดมศึกษา",
    instructionTitle: "คำชี้แจงในการตอบแบบสำรวจ",
    instructionText: "แบบสอบถามชุดนี้มีความสำคัญเป็นอย่างยิ่งต่อท่าน เนื่องจากเป็นฐานข้อมูลที่มีผลต่อการสร้างความเชื่อมั่นด้านศักยภาพในการทำงานของท่านให้กับสถานประกอบการ เพื่อใช้เป็นข้อมูลประกอบการตัดสินใจ และเป็นข้อมูลในการพัฒนาหลักสูตร/การเรียนการสอนของมหาวิทยาลัยให้เป็นไปตามมาตรฐานการประกันคุณภาพการศึกษาของกระทรวงการอุดมศึกษา วิทยาศาสตร์ วิจัย และนวัตกรรม (อว.) และสำนักงานรับรองมาตรฐานและประเมินคุณภาพการศึกษา (สมศ.) มหาวิทยาลัยมีวัตถุประสงค์ในการเก็บรวบรวม ใช้ หรือเปิดเผยข้อมูลส่วนบุคคลดังกล่าว เพื่อใช้เป็นข้อมูลการสำรวจการมีงานทำหรือการติดตามการมีงานทำของบัณฑิต มหาบัณฑิตและดุษฎีบัณฑิต โดยมีระยะเวลาในการจัดเก็บ เป็นเวลา 10 ปี โดยท่านในฐานะบัณฑิต มหาบัณฑิต หรือดุษฎีบัณฑิต ตกลงยินยอมให้มหาวิทยาลัยทำการจัดเก็บรวบรวม ใช้ หรือเปิดเผยข้อมูลส่วนบุคคลดังกล่าวของท่านได้ \n\nดังนั้นขอให้บัณฑิต มหาบัณฑิตและดุษฎีบัณฑิต โปรดกรอกข้อมูลตามความเป็นจริงให้ครบทุกข้อ กรณีบัณฑิต ตอบว่า “ยังไม่มีงานทำ” มหาวิทยาลัยขอทำการติดตามสถานภาพการมีงานทำของบัณฑิตในโอกาสต่อไป",
    p1ObjectiveTitle: "1. วัตถุประสงค์เพื่อคุณภาพการศึกษา",
    p1ObjectiveDesc: "เป็นเกณฑ์วัดมาตรฐานคุณภาพหลักสูตรของมหาวิทยาลัยกรุงเทพ ร่วมกับกระทรวง อว. และ สมศ. เพื่อยกระดับสู่มาตรฐานสากล",
    p2PdpaTitle: "2. ความเป็นส่วนตัว PDPA สูงสุด",
    p2PdpaDesc: "ข้อมูลส่วนบุคคลของท่านจะได้รับการคุ้มครองตามมาตรฐานการรักษาความมั่นคงปลอดภัยของข้อมูลและกฎหมายคุ้มครองข้อมูลส่วนบุคคล (PDPA) โดยข้อมูลที่เก็บรวบรวมจะถูกเก็บรักษาเป็นความลับ ใช้เพื่อวัตถุประสงค์ในการวิจัยและพัฒนาคุณภาพการศึกษาของมหาวิทยาลัยกรุงเทพเท่านั้น โดยจะนำเสนอผลการประเมินในภาพรวม แบบไม่เปิดเผยข้อมูลที่สามารถระบุตัวตนของผู้ให้ข้อมูลได้",
    p3FastTitle: "3. ระบบกรอกข้อมูลอัตโนมัติอย่างรวดเร็ว",
    p3FastDesc: "กรอกรหัสประจำตัวนักศึกษาเพื่อดึงข้อมูลคณะ สาขาวิชา และปีการศึกษาโดยอัตโนมัติ เพื่ออำนวยความสะดวกสูงสุดแก่บัณฑิตวิทยาลัย",
    startSurveyBtn: "เริ่มต้นตอบแบบสำรวจ",
    submittedRecent: "ส่งสำเร็จแล้ว {count} รายล่าสุด",
    stepGeneral: "ข้อมูลทั่วไป",
    stepEmployment: "สถานะการทำงาน",
    stepStatistics: "ข้อมูลเชิงสถิติ",
    stepReview: "สรุปและส่งแบบสำรวจ",
    stepSuggestions: "ข้อเสนอแนะ",
    enterStudentIdTitle: "เริ่มต้นกรอกข้อมูลแบบสำรวจ",
    enterStudentIdDesc: "กรุณากรอกรหัสประจำตัวนักศึกษา 10 หลัก เพื่อดึงข้อมูลประวัติการสำเร็จการศึกษาโดยอัตโนมัติ",
    studentIdPlaceholder: "รหัสประจำตัวนักศึกษา เช่น 1640901234",
    identityCheckBtn: "ตรวจสอบข้อมูลนักศึกษา",
    verifyingId: "กำลังตรวจสอบข้อมูล...",
    idSuccessAlert: "ดึงข้อมูลสำเร็จ! ยินดีต้อนรับคุณ {name}",
    idNotFoundAlert: "ไม่พบข้อมูล รหัสนักศึกษานี้ในระบบ ท่านสามารถกรอกข้อมูลแบบสอบถามต่อด้วยตนเองได้ทันที",
    idRequired: "กรุณากรอกรหัสประจำตัวนักศึกษา 10 หลัก",
    firstNameLabel: "ชื่อจริง (ภาษาไทย/อังกฤษ)",
    lastNameLabel: "นามสกุล (ภาษาไทย/อังกฤษ)",
    facultyLabel: "คณะการศึกษา",
    majorLabel: "สาขาวิชา",
    phoneLabel: "เบอร์โทรศัพท์ติดต่อ",
    emailLabel: "อีเมลติดต่อ (E-mail)",
    prevBtn: "ย้อนกลับ",
    nextBtn: "ขั้นตอนถัดไป",
    submitSurveyBtn: "ยืนยันและส่งแบบสำรวจ",
    submittingText: "กำลังบันทึกข้อมูลแบบสำรวจ...",
    academicYearLabel: "ปีการศึกษาที่สำเร็จ",
    surveyMonthLabel: "เดือนที่ทำแบบสำรวจประเมิน",
    
    // Status Choosing
    statusChooseTitle: "กรุณาเลือกสถานะการทำงานปัจจุบันของท่าน",
    statusEmployed: "มีงานทำแล้ว/ประกอบอาชีพอิสระ",
    statusEmployedDesc: "รวมถึงผู้ประกอบธุรกิจส่วนตัว อาชีพอิสระ ทำงานอิสระ ธุรกิจครอบครัว หรือมีรายได้ประจำเสรี",
    statusUnemployed: "ยังไม่มีงานทำ / อยู่ระหว่างหางาน",
    statusUnemployedDesc: "ไม่ได้ทำงานในปัจจุบัน และมีระยะเวลาเตรียมตัวหาตำแหน่งงานหรือกำลังสมัครงาน",
    statusNotSeeking: "เหตุผลอื่นๆ",
    statusNotSeekingDesc: "เช่น กำลังศึกษาต่อในระดับที่สูงขึ้น อุปสมบท เกณฑ์ทหาร หรือต้องการพักผ่อนส่วนตัว",

    // Employed Form Details
    professionType: "ประเภทอาชีพ / อุตสาหกรรมหลักที่ทำงาน",
    workPosition: "ชื่อตำแหน่งงานปัจจุบัน",
    organizationName: "ชื่อบริษัท / หน่วยงานต้นสังกัด",
    department: "ฝ่าย / แผนก",
    orgAddress: "ที่ตั้งสำนักงาน / สถานประกอบการ",
    addressNo: "เลขที่",
    addressMoo: "หมู่ที่",
    addressBuilding: "ชื่ออาคาร/ตึก",
    addressFloor: "ชั้น",
    addressSoi: "ตรอก/ซอย",
    addressRoad: "ถนน",
    addressSubdistrict: "ตำบล/แขวง",
    addressDistrict: "อำเภอ/เขต",
    addressProvince: "จังหวัด",
    addressZipcode: "รหัสไปรษณีย์",
    salaryLabel: "เงินเดือนประจำ หรือ รายได้เฉลี่ยต่อเดือน (บาท)",
    otherIncomeLabel: "ท่านมีรายได้หรือค่าตอบแทนอื่น นอกเหนือจากเงินเดือนหรือไม่?",
    otherIncomeDesc: "เช่น ค่าเบี้ยเลี้ยง, ค่าตำแหน่ง, ค่าพาหนะเดินทาง, ค่าประกอบวิชาชีพพิเศษ",
    otherIncomeSubLabel: "ระบุรายได้อื่นพ่วงตำแหน่งที่ได้รับ",
    otherIncomeAmount: "มูลค่าเฉลี่ยต่อเดือนของรายได้อื่น (บาท)",
    matchEdu: "งานปัจจุบันตรงกับสาขาวิชาที่ท่านสำเร็จการศึกษาหรือไม่?",
    timeSpentJobSeeking: "ระยะเวลาที่ใช้ในการหางานจนกระทั่งได้งานทำหลังจากเรียนจบ",
    
    yesLabel: "ตรงตามสาขาวิชา",
    noLabel: "ไม่ตรงตามสาขาวิชา",
    specifyDetail: "กรุณาระบุรายละเอียดเพิ่มเติม",
    selectOption: "-- เลือกตัวเลือกที่สอดคล้อง --",
    otherSpecify: "อื่นๆ (โปรดระบุรายละเอียด)",

    unemployedReasonTitle: "สาเหตุที่ยังไม่มีงานทำในปัจจุบัน (เลือกได้ 1 หัวข้อหลัก)",
    notSeekingReasonTitle: "สาเหตุหรือรายละเอียดสำหรับเหตุผลอื่นๆ (เลือกได้ 1 หัวข้อหลัก)",

    // Confirms
    confirmSubmitTitle: "ตรวจสอบความถูกต้องของข้อมูล",
    confirmSubmitDesc: "กรุณาตรวจสอบข้อมูลทั้งหมดอย่างถี่ถ้วน หากถูกต้องแล้วกดปุ่มยืนยันด้านล่างเพื่อบันทึกประวัติเข้าสู่ระบบมหาวิทยาลัยแบบถาวร",
    reviewSummary: "สรุปข้อมูลที่กรอก",
    reviewPersonal: "ข้อมูลประวัตินักศึกษา",
    reviewStatus: "สถานะการมีงานทำ",
    reviewDetails: "ข้อมูลจำแนกตามสายงาน",
    reviewEmploymentDetails: "ข้อมูลสถานประกอบการและรายได้",
    reviewUnemployedDetails: "ข้อมูลสถิติผู้ว่างงาน",
    reviewNotSeekingDetails: "ข้อมูลการเรียนต่อหรือธุระส่วนตัว",
    reviewCustomAnswers: "คำถามเพิ่มเติมจากผู้บริหาร",

    // Success Screen
    successTitle: "ส่งแบบสำรวจภาวะการมีงานทำเรียบร้อยแล้ว!",
    successDesc: "มหาวิทยาลัยกรุงเทพ ขอขอบคุณข้อมูลความร่วมมืออันมีค่าจากท่าน ข้อมูลทั้งหมดจะถูกรักษาความปลอดภัยสูงสุดภายใต้มาตรฐานระบบวิเคราะห์คุณภาพ อว.",
    additionalResponseBtn: "ทำแบบสำรวจอื่นเพิ่มเติม",

    // Validations
    errFirstName: "กรุณากรอกชื่อจริงภาษาไทยหรืออังกฤษ",
    errLastName: "กรุณากรอกนามสกุลภาษาไทยหรืออังกฤษ",
    errFaculty: "กรุณากรอกหรือเลือกคณะที่จบการศึกษา",
    errMajor: "กรุณากรอกหรือเลือกสาขาวิชา",
    errPhone: "กรุณากรอกเบอร์โทรศัพท์ติดต่อที่ถูกต้อง 10 หลัก",
    errEmail: "กรุณากรอกอีเมลติดต่อในรูปแบบที่ถูกต้อง",
    errSurveyMonth: "กรุณาระบุมวลเดือนที่ประเมินข้อมูล",
    errWorkType: "กรุณาเลือกประเภทอาชีพของงานปัจจุบัน",
    errJobTitle: "กรุณากรอกชื่อตำแหน่งงานปัจจุบัน",
    errCompanyName: "กรุณากรอกชื่อหน่วยงานหรือบริษัทประกอบการ",
    errSalary: "กรุณากรอกค่าเงินเดือนหรือรายได้เฉลี่ยที่สมเหตุสมผล",
    errUnemployedReason: "กรุณาเลือกเหตุผลที่ว่างงานในปัจจุบัน",
    errNotSeekingReason: "กรุณาเลือกรายละเอียดสำหรับเหตุผลอื่นๆ",
    errOtherIncome: "กรุณาระบุคำอธิบายรายได้อื่นพร้อมจดจำนวนเงิน",

    // Options mapping lists
    professionsList: {
      "1": "1. ข้าราชการ/เจ้าหน้าที่หน่วยงานของรัฐ",
      "2": "2. พนักงาน/ลูกจ้างรัฐวิสาหกิจ",
      "3": "3. พนักงานบริษัท/องค์กรธุรกิจเอกชน",
      "4": "4. พนักงานองค์การต่างประเทศ/ระหว่างประเทศ",
      "5": "5. ประกอบอาชีพอิสระ (เช่น อินฟลูเอนเซอร์ ยูทูบเบอร์ เทรดเดอร์ สตรีมเมอร์ เป็นต้น ฯลฯ)",
      "6": "6. เจ้าของกิจการ - ระบุลักษณะของงาน (เช่น เสื้อผ้า เบเกอรี่ เครื่องสำอาง ฯลฯ)",
      "7": "7. ธุรกิจครอบครัว - ระบุลักษณะของงาน (เช่น เสื้อผ้า เบเกอรี่ เครื่องสำอาง ฯลฯ)",
      "8": "8. อื่นๆ - ระบุ"
    },
    unemployedReasonsList: {
      "1": "1. รอฟังคำตอบจากหน่วยงาน",
      "2": "2. หางานทำไม่ได้",
      "3": "3. หางานที่ถูกใจไม่ได้",
      "4": "4. กำลังหางานทำ",
      "5": "5. อื่นๆ (ระบุเหตุผล)"
    },
    notSeekingReasonsList: {
      "1": "1. กำลังศึกษาต่อ",
      "2": "2. อุปสมบท",
      "3": "3. เกณฑ์ทหาร",
      "4": "4. รอรับปริญญา",
      "5": "5. รอศึกษาต่อ",
      "6": "6. รอไปต่างประเทศ",
      "7": "7. ดูแลพ่อแม่/ญาติที่กำลังป่วย",
      "8": "8. ต้องการพักผ่อน",
      "9": "9. อื่นๆ(ระบุ)"
    },
    getJobTimelineList: {
      "1": "1. ได้งานทันที",
      "2": "2. 1-2 เดือน",
      "3": "3. 3-6 เดือน",
      "4": "4. 7-9 เดือน",
      "5": "5. 10-12 เดือน",
      "6": "6. มากกว่า 1 ปี",
      "7": "7. ได้งานทำระหว่างศึกษา"
    },
    facultiesList: {
      "คณะเทคโนโลยีสารสนเทศและนวัตกรรม": "คณะเทคโนโลยีสารสนเทศและนวัตกรรม",
      "คณะบริหารธุรกิจ": "คณะบริหารธุรกิจ",
      "คณะนิเทศศาสตร์": "คณะนิเทศศาสตร์",
      "คณะวิศวกรรมศาสตร์": "คณะวิศวกรรมศาสตร์",
      "คณะมนุษยศาสตร์และการจัดการการท่องเที่ยว": "คณะมนุษยศาสตร์และการจัดการการท่องเที่ยว",
      "คณะบัญชี": "คณะบัญชี",
      "คณะนิติศาสตร์": "คณะนิติศาสตร์",
      "คณะเศรษฐศาสตร์และการลงทุน": "คณะเศรษฐศาสตร์และการลงทุน",
      "คณะศิลปกรรมศาสตร์": "คณะศิลปกรรมศาสตร์",
      "คณะสถาปัตยกรรมศาสตร์": "คณะสถาปัตยกรรมศาสตร์",
      "คณะการสร้างเจ้าของธุรกิจและการบริหารจัดการ (BUSEM)": "คณะการสร้างเจ้าของธุรกิจและการบริหารจัดการ (BUSEM)",
      "คณะดิจิทัลมีเดียและศิลปะภาพยนตร์": "คณะดิจิทัลมีเดียและศิลปะภาพยนตร์",
      "วิทยาลัยนานาชาติ (BUI)": "วิทยาลัยนานาชาติ (BUI)",
      "วิทยาลัยนานาชาติ (BUInter)": "วิทยาลัยนานาชาติ (BUI)",
      "วิทยาลัยนานาชาติจีน (BUCI)": "วิทยาลัยนานาชาติจีน (BUCI)"
    }
  },
  en: {
    langLabel: "English",
    surveyTitle: "Graduate Employment Survey",
    surveySubtitle: "For Doctoral, Master's, and Bachelor's Degree Graduates of Bangkok University, Academic Year 2024",
    qualityStandard: "Higher Education Quality Standards Assessment Tool",
    instructionTitle: "Instructions for Completing the Survey",
    instructionText: "Instruction: This is very important survey for all graduates since its results will become the database that influences the employer’s confidence in the BU Graduate’s working abilities, and is served as their decision-making tool, and to promote and monitor the BU graduates for job search and change. They will also be used to improve the University’s curriculum and instruction in order to meet the quality assurance standards set by Ministry of Higher Education, Science, Research and Innovation and the Office of Nation Education Standards and Quality Assessment Bangkok University will collect, use and disclose this information for the above-mentioned purposes only. This database will be securely stored for 10 years. By responding to this survey, you agree and give consent to Bangkok University for the collection, use and disclosure of your information that you provide.\n\nAccordingly, the University requests for your kind cooperation in truthfully answering all items of this questionnaire. Please your answer and answer each question as accurately as possible. For graduates who answered “Unemployed” to this survey, Bangkok University would to follow up with your employment status again in the future.",
    p1ObjectiveTitle: "1. Core Quality Metrics",
    p1ObjectiveDesc: "Measures course performance criteria set by MHESI & ONESQA to evaluate international curriculum standing.",
    p2PdpaTitle: "2. Absolute PDPA Protection",
    p2PdpaDesc: "Your personal data will be protected in accordance with data security standards and the Personal Data Protection Act (PDPA). All information collected will be treated with strict confidentiality and used solely for research purposes and the enhancement of educational quality at Bangkok University. The evaluation results will be reported only in an aggregated format, without disclosing any information that could identify individual participants.",
    p3FastTitle: "3. Auto ID-Sync Recognition",
    p3FastDesc: "Input your student ID key code to dynamically load registered division, major and school years.",
    startSurveyBtn: "Start Questionnaire",
    submittedRecent: "Succeeded in receiving {count} submissions recently",
    stepGeneral: "General Information",
    stepEmployment: "Employment Status",
    stepStatistics: "Survey Statistics",
    stepReview: "Review & Submit",
    stepSuggestions: "Suggestions",
    enterStudentIdTitle: "Unlock Your Enrollment File",
    enterStudentIdDesc: "Please enter your 10-digit Bangkok University student ID number to populate standard register folders.",
    studentIdPlaceholder: "Student ID (e.g. 1640901234)",
    identityCheckBtn: "Validate Student ID",
    verifyingId: "Authenticating ID record...",
    idSuccessAlert: "ID Sync Complete! Welcome, {name}",
    idNotFoundAlert: "Student ID code was not located in our system directory. You can complete the fields manually.",
    idRequired: "Please input a valid 10-digit Registration Student ID key",
    firstNameLabel: "First Name (TH/EN)",
    lastNameLabel: "Last Name (TH/EN)",
    facultyLabel: "School Faculty",
    majorLabel: "Major Program of Study",
    phoneLabel: "Active Mobile Phone Number",
    emailLabel: "Active E-mail Address",
    prevBtn: "Previous",
    nextBtn: "Next Step",
    submitSurveyBtn: "Confirm and Submit Survey",
    submittingText: "Transmitting survey data securely...",
    academicYearLabel: "Graduating School Year",
    surveyMonthLabel: "Month of Statement Valuation",

    // Status Choosing
    statusChooseTitle: "Please select your current real employment status",
    statusEmployed: "Employed / Self-Employed / Active Career",
    statusEmployedDesc: "Includes office personnel, government officers, remote freelancers, brand founders, or family-owned firm managers.",
    statusUnemployed: "Unemployed / Actively Seeking Work",
    statusUnemployedDesc: "Currently without active revenue but seeking job placements or actively submitting resumes.",
    statusNotSeeking: "Other Reasons",
    statusNotSeekingDesc: "Includes pursuing higher graduate studies abroad, ordination, army conscription, or taking a wellness leave.",

    // Employed Form Details
    professionType: "Type of profession / Industrial Sector",
    workPosition: "Your Current Work Position",
    organizationName: "Your Organization/Company Name",
    department: "Corporate Division / Department",
    orgAddress: "Office Headquarters Address",
    addressNo: "No.",
    addressMoo: "Moo",
    addressBuilding: "Building Name",
    addressFloor: "Floor",
    addressSoi: "Soi (Alley)",
    addressRoad: "Road",
    addressSubdistrict: "Sub-District (Subdivision)",
    addressDistrict: "District (City Division)",
    addressProvince: "Province (State)",
    addressZipcode: "Postal/Zip code",
    salaryLabel: "Base Salary or Month Average Income (THB)",
    otherIncomeLabel: "Do you receive other sources of stable revenue or allowances?",
    otherIncomeDesc: "For example: daily allowance, position allowance, fuel allowance, special profession certification allowance.",
    otherIncomeSubLabel: "Specify description of allowance",
    otherIncomeAmount: "Special Allowance Average Value / Month (THB)",
    matchEdu: "Does your active role align with your graduating major curriculum?",
    timeSpentJobSeeking: "Duration spent seeking jobs until acquisition after graduation",

    yesLabel: "Yes (Directly Aligns with Major)",
    noLabel: "No (Does Not Align - Specify)",
    specifyDetail: "Please provide specific details",
    selectOption: "-- Choice Option --",
    otherSpecify: "Others (Please specify details)",

    unemployedReasonTitle: "Primary reason for active unemployment (Select only 1 category)",
    notSeekingReasonTitle: "Details or reasons for other choices (Select only 1 category)",

    // Confirms
    confirmSubmitTitle: "Validate Stated Information",
    confirmSubmitDesc: "Please review your entries. If accurate and correct, press the button below to record your response in our secure servers.",
    reviewSummary: "Valued Response Summary",
    reviewPersonal: "Academic Biography Folder",
    reviewStatus: "Active Stated Standard Status",
    reviewDetails: "Detailed Form Response Classification",
    reviewEmploymentDetails: "Stated Corporate Assets and Revenue",
    reviewUnemployedDetails: "Unemployed Metrics Tracker",
    reviewNotSeekingDetails: "Graduate Education/Inactive Statement",
    reviewCustomAnswers: "Executive Board Questionnaires",

    // Success Screen
    successTitle: "Submission Recorded Successfully!",
    successDesc: "Bangkok University sincerely expresses gratitude for your valuable cooperation. Your records are protected under highest security parameters of the MHESI quality engine database.",
    additionalResponseBtn: "Submit Additional Survey",

    // Validations
    errFirstName: "Please fill in your valid First Name",
    errLastName: "Please fill in your valid Last Name",
    errFaculty: "School Faculty is currently required",
    errMajor: "Major Program of Study is currently required",
    errPhone: "Please insert a valid 10-digit mobile number",
    errEmail: "Please provide a valid active email format",
    errSurveyMonth: "Please select the current evaluation month",
    errWorkType: "Select your active profession classification",
    errJobTitle: "Work position title is required",
    errCompanyName: "Name of organization or brand is required",
    errSalary: "Please insert a reasonable monthly salary number",
    errUnemployedReason: "Unemployed constraint reason is required",
    errNotSeekingReason: "Details for other reasons is required",
    errOtherIncome: "Please detail the source along with correct currency estimates",

    // Options lookup strings
    professionsList: {
      "1": "1. Civil/Government officer",
      "2": "2. Public enterprise officer",
      "3": "3. Private organization employee",
      "4": "4. International organization employee",
      "5": "5. Freelance",
      "6": "6. Business owner - Type of work",
      "7": "7. Family business - Type of work",
      "8": "8. Others (Specify)"
    },
    unemployedReasonsList: {
      "1": "1. Awaiting application result",
      "2": "2. Job search unsuccessful",
      "3": "3. No job matches preference",
      "4": "4. Currently seeking employment",
      "5": "5. Others (Specify)"
    },
    notSeekingReasonsList: {
      "1": "1. Presently studying",
      "2": "2. Ordained",
      "3": "3. Conscripted for army service",
      "4": "4. Awaiting for graduation",
      "5": "5. Awaiting for further education",
      "6": "6. Awaiting for going aboard",
      "7": "7. Take care your parents / relatives who are ill.",
      "8": "8. To relax",
      "9": "9. Others (Specify)"
    },
    getJobTimelineList: {
      "1": "1. Immediately employed after graduation",
      "2": "2. 1-2 month(s)",
      "3": "3. 3-6 month(s)",
      "4": "4. 7-9 month(s)",
      "5": "5. 10-12 month(s)",
      "6": "6. More than 1 year",
      "7": "7. Employed during my study"
    },
    facultiesList: {
      "คณะเทคโนโลยีสารสนเทศและนวัตกรรม": "Information Technology and Innovation",
      "คณะบริหารธุรกิจ": "Business Administration",
      "คณะนิเทศศาสตร์": "Communication Arts",
      "คณะวิศวกรรมศาสตร์": "Engineering",
      "คณะมนุษยศาสตร์และการจัดการการท่องเที่ยว": "Humanities and Tourism Management",
      "คณะบัญชี": "Accounting",
      "คณะนิติศาสตร์": "Law",
      "คณะเศรษฐศาสตร์และการลงทุน": "Economics and Investment",
      "คณะศิลปกรรมศาสตร์": "Fine and Applied Arts",
      "คณะสถาปัตยกรรมศาสตร์": "Architecture",
      "คณะการสร้างเจ้าของธุรกิจและการบริหารจัดการ (BUSEM)": "School of Entrepreneurship and Management (BUSEM)",
      "คณะดิจิทัลมีเดียและศิลปะภาพยนตร์": "Digital Media and Cinematic Arts",
      "วิทยาลัยนานาชาติ (BUI)": "Bangkok University International (BUI)",
      "วิทยาลัยนานาชาติ (BUInter)": "Bangkok University International (BUI)",
      "วิทยาลัยนานาชาติจีน (BUCI)": "Bangkok University Chinese International (BUCI)"
    }
  }
};
