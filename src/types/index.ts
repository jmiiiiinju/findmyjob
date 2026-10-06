export type MentorPersonaId = 'general' | 'recruiter' | 'senior' | 'academic';

export interface MentorPersona {
  id: MentorPersonaId;
  name: string;
  role: string;
  badge: string;
  description: string;
  avatarBg: string;
  avatarText: string;
}

export interface StudentProfile {
  name?: string;
  grade: string;
  major: string;
  mbti: string;
  targetField: string;
  interests: string[];
  currentConcerns: string;
  recommendationSummary?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  mentorPersona?: MentorPersonaId;
}

export interface MBTIRecommendationResult {
  mbtiAnalysis: {
    type: string;
    workStyle: string;
    coreStrengths: string[];
    potentialBlindspots: string[];
  };
  recommendedJobs: {
    title: string;
    category: string;
    fitScore: number;
    oneLineDescription: string;
    whyFit: string;
    marketOutlook: string;
    salaryInsight?: string;
    hardSkills: string[];
    softSkills: string[];
    certifications?: string[];
  }[];
  recommendedMajorsOrMinors: {
    name: string;
    type: string;
    rationale: string;
  }[];
  coreCompetencies: {
    area: string;
    description: string;
    actionToAcquire: string;
  }[];
  advisorNote: string;
  suggestedPrompts: string[];
}

export type CurationCategory = 'all' | 'job' | 'grad' | 'bootcamp';

export interface CurationItem {
  id: string;
  category: 'job' | 'grad' | 'bootcamp';
  subCategory: string; // 'IT/개발', '경영/기획', '연구/R&D', '디자인', '공기업/금융' 등
  title: string;
  organization: string;
  organizationType: '대기업' | 'IT기업' | '유니콘/스타트업' | '공공기관' | '연구소/대학';
  location: string;
  deadline: string; // YYYY-MM-DD or '상시채용'
  dDay: number | string; // e.g. 5 for D-5, or '상시'
  targetAudience: string; // '대학 재학/휴학/졸업예정자' 등
  benefitOrSalary: string; // '교육비 전액무료 + 월 100만 지원' or '정규직 연봉 4,800만~'
  description: string;
  requirements: string[];
  preferredQualifications?: string[];
  tags: string[];
  officialUrl?: string;
  postedDate: string;
  isHot?: boolean;
}

export interface CurationNotification {
  id: string;
  itemId: string;
  title: string;
  message: string;
  type: 'deadline' | 'new_match' | 'system';
  timestamp: string;
  isRead: boolean;
}

export interface NotificationSettings {
  enabled: boolean;
  categories: {
    job: boolean;
    grad: boolean;
    bootcamp: boolean;
  };
  keywords: string[];
  notifyOnDeadline3Days: boolean;
}

export interface CareerRoadmapStage {
  stageNumber: number;
  stageTitle: string;
  timeframe: string;
  goalDescription: string;
  keyActions: string[];
  recommendedCertsOrTools: string[];
  proTip?: string;
}

export interface CareerRoadmap {
  id?: string;
  savedAt?: string;
  roadmapTitle: string;
  targetJob: string;
  executiveSummary: string;
  stages: CareerRoadmapStage[];
  portfolioKeyTip: string;
}
