import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { ChatView } from './components/ChatView';
import { RecommendationView } from './components/RecommendationView';
import { CurationView } from './components/CurationView';
import { RoadmapView } from './components/RoadmapView';
import { NotificationModal } from './components/NotificationModal';
import { ProfileModal } from './components/ProfileModal';
import {
  StudentProfile,
  CurationNotification,
  NotificationSettings,
} from './types';

const INITIAL_PROFILE: StudentProfile = {
  name: '대학생',
  grade: '3학년',
  major: '경영학과',
  mbti: 'ENFP',
  targetField: '프로덕트 매니저 (PM) 및 데이터 분석',
  interests: ['프로덕트 매니저 (PM)', '데이터 분석가 (DA)', 'IT 기획'],
  currentConcerns: '전공과 다른 IT 직무로 취업하고 싶은데 학점과 스펙 준비 순서가 고민입니다.',
};

const INITIAL_NOTIFICATIONS: CurationNotification[] = [
  {
    id: 'noti-1',
    itemId: 'job-5',
    title: '한국전력공사 2026 청년인턴 마감 임박',
    message: '한국전력공사 청년인턴 서류 접수가 9일 남았습니다 (2026-10-15 마감). 지원서를 점검해보세요.',
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
];

const INITIAL_SETTINGS: NotificationSettings = {
  enabled: true,
  categories: {
    job: true,
    grad: true,
    bootcamp: true,
  },
  keywords: ['네이버', 'PM', 'AI대학원', 'SSAFY'],
  notifyOnDeadline3Days: true,
};

export default function App() {
  const [activeTab, setActiveTab] = useState<'chat' | 'recommend' | 'curation' | 'roadmap'>('chat');

  // Profile state
  const [profile, setProfile] = useState<StudentProfile>(() => {
    try {
      const saved = localStorage.getItem('pathfinder_profile');
      return saved ? JSON.parse(saved) : INITIAL_PROFILE;
    } catch {
      return INITIAL_PROFILE;
    }
  });

  // Bookmarks
  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('pathfinder_bookmarks');
      return saved ? JSON.parse(saved) : ['job-1', 'bootcamp-1'];
    } catch {
      return ['job-1', 'bootcamp-1'];
    }
  });

  // Notifications
  const [notifications, setNotifications] = useState<CurationNotification[]>(() => {
    try {
      const saved = localStorage.getItem('pathfinder_notifications');
      return saved ? JSON.parse(saved) : INITIAL_NOTIFICATIONS;
    } catch {
      return INITIAL_NOTIFICATIONS;
    }
  });

  // Notification settings
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>(() => {
    try {
      const saved = localStorage.getItem('pathfinder_notif_settings');
      return saved ? JSON.parse(saved) : INITIAL_SETTINGS;
    } catch {
      return INITIAL_SETTINGS;
    }
  });

  // Modals
  const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  // Cross-tab interaction
  const [externalPrefillPrompt, setExternalPrefillPrompt] = useState<string>('');
  const [selectedCurationItemId, setSelectedCurationItemId] = useState<string | null>(null);
  const [initialRoadmapJob, setInitialRoadmapJob] = useState<string>('');

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem('pathfinder_profile', JSON.stringify(profile));
  }, [profile]);

  useEffect(() => {
    localStorage.setItem('pathfinder_bookmarks', JSON.stringify(bookmarkedIds));
  }, [bookmarkedIds]);

  useEffect(() => {
    localStorage.setItem('pathfinder_notifications', JSON.stringify(notifications));
  }, [notifications]);

  useEffect(() => {
    localStorage.setItem('pathfinder_notif_settings', JSON.stringify(notificationSettings));
  }, [notificationSettings]);

  const handleToggleBookmark = (id: string) => {
    setBookmarkedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleMarkAllNotificationsAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const handleClearNotifications = () => {
    setNotifications([]);
  };

  const handleNavigateToChatWithPrompt = (prompt: string) => {
    setExternalPrefillPrompt(prompt);
    setActiveTab('chat');
  };

  const handleNavigateToRoadmap = (jobTitle: string) => {
    setInitialRoadmapJob(jobTitle);
    setActiveTab('roadmap');
  };

  const handleSelectNotificationItem = (itemId: string) => {
    setSelectedCurationItemId(itemId);
    setIsNotificationModalOpen(false);
    setActiveTab('curation');
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* 1. Universal Top Navigation Bar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenNotifications={() => setIsNotificationModalOpen(true)}
        onOpenProfile={() => setIsProfileModalOpen(true)}
        unreadCount={unreadCount}
        profile={profile}
      />

      {/* 2. Main Content Area */}
      <main className="flex-1 pb-10">
        {activeTab === 'chat' && (
          <ChatView
            profile={profile}
            onOpenProfile={() => setIsProfileModalOpen(true)}
            onNavigateTab={(tab, params) => {
              if (params?.prompt) {
                setExternalPrefillPrompt(params.prompt);
              }
              setActiveTab(tab);
            }}
            externalPrefillPrompt={externalPrefillPrompt}
            onClearPrefill={() => setExternalPrefillPrompt('')}
          />
        )}

        {activeTab === 'recommend' && (
          <RecommendationView
            profile={profile}
            onUpdateProfile={(updated) => setProfile((prev) => ({ ...prev, ...updated }))}
            onNavigateToChatWithPrompt={handleNavigateToChatWithPrompt}
            onNavigateToRoadmap={handleNavigateToRoadmap}
          />
        )}

        {activeTab === 'curation' && (
          <CurationView
            profile={profile}
            bookmarkedIds={bookmarkedIds}
            onToggleBookmark={handleToggleBookmark}
            onOpenNotificationSettings={() => setIsNotificationModalOpen(true)}
            onNavigateToChatWithPrompt={handleNavigateToChatWithPrompt}
            selectedItemId={selectedCurationItemId}
            onClearSelectedItem={() => setSelectedCurationItemId(null)}
          />
        )}

        {activeTab === 'roadmap' && (
          <RoadmapView
            profile={profile}
            initialTargetJob={initialRoadmapJob}
            onNavigateToChatWithPrompt={handleNavigateToChatWithPrompt}
          />
        )}
      </main>

      {/* 3. Notification Modal */}
      <NotificationModal
        isOpen={isNotificationModalOpen}
        onClose={() => setIsNotificationModalOpen(false)}
        notifications={notifications}
        settings={notificationSettings}
        onUpdateSettings={setNotificationSettings}
        onMarkAllAsRead={handleMarkAllNotificationsAsRead}
        onClearNotifications={handleClearNotifications}
        onSelectNotificationItem={handleSelectNotificationItem}
      />

      {/* 4. Student Profile Modal */}
      <ProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        profile={profile}
        onSaveProfile={setProfile}
      />
    </div>
  );
}
