export interface Graduate {
  id?: string;
  studentId: string;
  fullName: string;
  firstName?: string;
  lastName?: string;
  faculty: string;
  major: string;
  academicYear: string;
  degreeLevel?: string;
}

export interface CustomQuestion {
  id: string;
  title: string;
  type: 'text' | 'choice';
  options?: string[];
  section: 'general' | 'employed' | 'unemployed' | 'not_seeking';
  required?: boolean;
}

export interface EmployedDetails {
  workType: string;
  workTypeOther?: string;
  jobTitle: string;
  companyName: string;
  companyDept: string;
  companyAddress: {
    no: string;
    moo: string;
    building: string;
    floor: string;
    soi: string;
    road: string;
    subdistrict: string;
    district: string;
    province: string;
    zipcode: string;
  };
  salary: number;
  hasOtherIncome: boolean;
  otherIncomeDetails?: string;
  otherIncomeAmount?: number;
  isRelatedToStudy: boolean;
  unrelatedReason?: string;
  timeToGetJob: string;
  entrepreneurRatings?: Record<string, number>;
}

export interface UnemployedDetails {
  reason: string;
  reasonOther?: string;
}

export interface NotSeekingDetails {
  reason: string;
  reasonOther?: string;
}

export interface SurveyResponse {
  id?: string;
  studentId: string;
  firstName: string;
  lastName: string;
  faculty: string;
  major: string;
  phone: string;
  email: string;
  academicYear: string;
  surveyMonth: string;
  status: 'employed' | 'unemployed' | 'not_seeking';
  degreeLevel?: string;
  employedDetails?: EmployedDetails;
  unemployedDetails?: UnemployedDetails;
  notSeekingDetails?: NotSeekingDetails;
  suggestions?: {
    impressions: string;
    improvements: string;
    skillsToCultivate: string;
  };
  customAnswers?: Record<string, string>; // Maps question ID to user response
  createdAt: any; // Firestore server timestamp or Date
}

export interface AdminUserData {
  uid: string;
  email: string | null;
  displayName: string | null;
  role: 'admin';
}
