import fs from 'fs/promises';
import path from 'path';

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
  mentorPersona?: string;
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

export interface CareerRoadmap {
  id?: string;
  savedAt?: string;
  roadmapTitle: string;
  targetJob: string;
  executiveSummary: string;
  stages: any[];
  portfolioKeyTip: string;
}

export interface BackendDatabase {
  profile: StudentProfile;
  chatMessages: ChatMessage[];
  bookmarkedIds: string[];
  notifications: CurationNotification[];
  notificationSettings: NotificationSettings;
  savedRoadmaps: CareerRoadmap[];
  savedRecommendations: any[];
  updatedAt: string;
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

const DEFAULT_DB: BackendDatabase = {
  profile: {
    name: '대학생',
    grade: '3학년',
    major: '경영학과',
    mbti: 'ENFP',
    targetField: '프로덕트 매니저 (PM) 및 데이터 분석',
    interests: ['프로덕트 매니저 (PM)', '데이터 분석가 (DA)', 'IT 기획'],
    currentConcerns: '전공과 다른 IT 직무로 취업하고 싶은데 학점과 스펙 준비 순서가 고민입니다.',
  },
  chatMessages: [
    {
      id: 'welcome',
      role: 'assistant',
      content: `안녕하세요! 대학생을 위한 AI 진로 멘토링 **PathFinder**에 오신 것을 환영해요. 🌱

백엔드 서버와 연동되어 대화 내역, 프로필, 북마크, 로드맵이 안전하게 영구 저장됩니다.
진로 고민이나 희망 직무에 대해 편하게 질문해 주세요!`,
      timestamp: '09:00',
      mentorPersona: 'general',
    },
  ],
  bookmarkedIds: ['job-1', 'bootcamp-1'],
  notifications: [
    {
      id: 'noti-1',
      itemId: 'job-5',
      title: '한국전력공사 2026 청년인턴 마감 임박',
      message: '한국전력공사 청년인턴 서류 접수가 9일 남았습니다 (2026-10-15 마감).',
      type: 'deadline',
      timestamp: '오늘 09:30',
      isRead: false,
    },
    {
      id: 'noti-2',
      itemId: 'job-1',
      title: 'NAVER 테크 인턴십 신규 모집 시작',
      message: '네이버 2026 채용연계형 테크 인턴십(SW/데이터/AI)이 오픈되었습니다. 전공 무관 지원 가능!',
      type: 'new_match',
      timestamp: '어제 14:15',
      isRead: false,
    },
    {
      id: 'noti-3',
      itemId: 'bootcamp-1',
      title: '삼성 청년 SW 아카데미 (SSAFY) 13기 모집 중',
      message: '월 100만원 교육지원금 지급! 비전공자 전용 트랙이 개설되어 있습니다.',
      type: 'new_match',
      timestamp: '2일 전',
      isRead: true,
    },
  ],
  notificationSettings: {
    enabled: true,
    categories: {
      job: true,
      grad: true,
      bootcamp: true,
    },
    keywords: ['네이버', 'PM', 'AI대학원', 'SSAFY'],
    notifyOnDeadline3Days: true,
  },
  savedRoadmaps: [],
  savedRecommendations: [],
  updatedAt: new Date().toISOString(),
};

// In-memory cache synced with disk
let cachedDb: BackendDatabase | null = null;
let writeQueue: Promise<void> = Promise.resolve();

async function initStorage(): Promise<BackendDatabase> {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    try {
      const data = await fs.readFile(DB_FILE, 'utf-8');
      cachedDb = JSON.parse(data);
      return cachedDb!;
    } catch {
      // File doesn't exist, create default
      cachedDb = { ...DEFAULT_DB, updatedAt: new Date().toISOString() };
      await fs.writeFile(DB_FILE, JSON.stringify(cachedDb, null, 2), 'utf-8');
      return cachedDb;
    }
  } catch (err) {
    console.error('[Storage Init Error]:', err);
    cachedDb = { ...DEFAULT_DB };
    return cachedDb;
  }
}

async function persistToDisk(): Promise<void> {
  if (!cachedDb) return;
  cachedDb.updatedAt = new Date().toISOString();
  const content = JSON.stringify(cachedDb, null, 2);

  // Write via queue to prevent concurrent corruption
  writeQueue = writeQueue.then(async () => {
    try {
      await fs.mkdir(DATA_DIR, { recursive: true });
      const tempFile = `${DB_FILE}.tmp`;
      await fs.writeFile(tempFile, content, 'utf-8');
      await fs.rename(tempFile, DB_FILE);
    } catch (err) {
      console.error('[Storage Write Error]:', err);
    }
  });

  await writeQueue;
}

export async function getDatabase(): Promise<BackendDatabase> {
  if (!cachedDb) {
    return await initStorage();
  }
  return cachedDb;
}

export async function updateProfile(newProfile: Partial<StudentProfile>): Promise<StudentProfile> {
  const db = await getDatabase();
  db.profile = { ...db.profile, ...newProfile };
  await persistToDisk();
  return db.profile;
}

export async function addChatMessage(message: ChatMessage): Promise<ChatMessage[]> {
  const db = await getDatabase();
  // Filter duplicate ID if exists
  db.chatMessages = [...db.chatMessages.filter((m) => m.id !== message.id), message];
  // Keep last 100 messages for storage efficiency
  if (db.chatMessages.length > 100) {
    db.chatMessages = db.chatMessages.slice(-100);
  }
  await persistToDisk();
  return db.chatMessages;
}

export async function setChatMessages(messages: ChatMessage[]): Promise<ChatMessage[]> {
  const db = await getDatabase();
  db.chatMessages = messages;
  await persistToDisk();
  return db.chatMessages;
}

export async function clearChat(): Promise<ChatMessage[]> {
  const db = await getDatabase();
  db.chatMessages = [
    {
      id: `welcome-${Date.now()}`,
      role: 'assistant',
      content: '대화가 초기화되었습니다. 새로운 진로 고민이나 질문을 편하게 남겨주세요!',
      timestamp: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
      mentorPersona: 'general',
    },
  ];
  await persistToDisk();
  return db.chatMessages;
}

export async function toggleBookmark(itemId: string): Promise<string[]> {
  const db = await getDatabase();
  if (db.bookmarkedIds.includes(itemId)) {
    db.bookmarkedIds = db.bookmarkedIds.filter((id) => id !== itemId);
  } else {
    db.bookmarkedIds.push(itemId);
  }
  await persistToDisk();
  return db.bookmarkedIds;
}

export async function updateNotificationSettings(settings: NotificationSettings): Promise<NotificationSettings> {
  const db = await getDatabase();
  db.notificationSettings = settings;
  await persistToDisk();
  return db.notificationSettings;
}

export async function markAllNotificationsRead(): Promise<CurationNotification[]> {
  const db = await getDatabase();
  db.notifications = db.notifications.map((n) => ({ ...n, isRead: true }));
  await persistToDisk();
  return db.notifications;
}

export async function clearNotifications(): Promise<CurationNotification[]> {
  const db = await getDatabase();
  db.notifications = [];
  await persistToDisk();
  return db.notifications;
}

export async function saveRoadmap(roadmap: CareerRoadmap): Promise<CareerRoadmap[]> {
  const db = await getDatabase();
  const itemWithId: CareerRoadmap = {
    ...roadmap,
    id: roadmap.id || `roadmap-${Date.now()}`,
    savedAt: new Date().toISOString(),
  };
  db.savedRoadmaps = [itemWithId, ...db.savedRoadmaps.filter((r) => r.id !== itemWithId.id)];
  await persistToDisk();
  return db.savedRoadmaps;
}

export async function deleteRoadmap(roadmapId: string): Promise<CareerRoadmap[]> {
  const db = await getDatabase();
  db.savedRoadmaps = db.savedRoadmaps.filter((r) => r.id !== roadmapId);
  await persistToDisk();
  return db.savedRoadmaps;
}

export async function saveRecommendation(recommendation: any): Promise<any[]> {
  const db = await getDatabase();
  const item = {
    ...recommendation,
    id: `rec-${Date.now()}`,
    savedAt: new Date().toISOString(),
  };
  db.savedRecommendations = [item, ...db.savedRecommendations];
  await persistToDisk();
  return db.savedRecommendations;
}
