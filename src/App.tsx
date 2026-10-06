import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { ChatView } from './components/ChatView';
import { RecommendationView } from './components/RecommendationView';
import { CurationView } from './components/CurationView';
import { RoadmapView } from './components/RoadmapView';
import { NotificationModal } from './components/NotificationModal';
import { ProfileModal } from './components/ProfileModal';
import { Database, CheckCircle2, Cloud } from 'lucide-react';
import {
  StudentProfile,
  ChatMessage,
  CurationNotification,
  NotificationSettings,
  CareerRoadmap,
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

  // Backend sync states
  const [isServerSynced, setIsServerSynced] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string>('');

  // Persistent States
  const [profile, setProfile] = useState<StudentProfile>(INITIAL_PROFILE);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: `안녕하세요! 대학생을 위한 AI 진로 멘토링 **PathFinder**에 오신 것을 환영해요. 🌱

백엔드 서버와 실시간 연동되어 대화 내역, 프로필, 북마크, 로드맵이 안전하게 영구 저장됩니다.
진로 고민이나 희망 직무에 대해 편하게 질문해 주세요!`,
      timestamp: '09:00',
      mentorPersona: 'general',
    },
  ]);
  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>(['job-1', 'bootcamp-1']);
  const [notifications, setNotifications] = useState<CurationNotification[]>([]);
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>(INITIAL_SETTINGS);
  const [savedRoadmaps, setSavedRoadmaps] = useState<CareerRoadmap[]>([]);

  // Modals
  const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  // Cross-tab interaction
  const [externalPrefillPrompt, setExternalPrefillPrompt] = useState<string>('');
  const [selectedCurationItemId, setSelectedCurationItemId] = useState<string | null>(null);
  const [initialRoadmapJob, setInitialRoadmapJob] = useState<string>('');

  // 1. Fetch entire backend database on mount
  useEffect(() => {
    async function loadBackendData() {
      try {
        const res = await fetch('/api/data');
        if (res.ok) {
          const data = await res.json();
          if (data.profile) setProfile(data.profile);
          if (Array.isArray(data.chatMessages) && data.chatMessages.length > 0) {
            setMessages(data.chatMessages);
          }
          if (Array.isArray(data.bookmarkedIds)) setBookmarkedIds(data.bookmarkedIds);
          if (Array.isArray(data.notifications)) setNotifications(data.notifications);
          if (data.notificationSettings) setNotificationSettings(data.notificationSettings);
          if (Array.isArray(data.savedRoadmaps)) setSavedRoadmaps(data.savedRoadmaps);

          setIsServerSynced(true);
          setLastSyncTime(new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }));
        }
      } catch (err) {
        console.warn('[Backend Sync Notice]: Could not reach backend data endpoint, using client storage.', err);
      }
    }
    loadBackendData();
  }, []);

  // 2. Save profile to backend
  const handleSaveProfile = async (newProfile: StudentProfile) => {
    setProfile(newProfile);
    try {
      const res = await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newProfile),
      });
      if (res.ok) {
        setIsServerSynced(true);
        setLastSyncTime(new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }));
      }
    } catch (err) {
      console.error('Error saving profile to backend:', err);
    }
  };

  // 3. Toggle Bookmark on backend
  const handleToggleBookmark = async (id: string) => {
    // Optimistic UI update
    setBookmarkedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );

    try {
      const res = await fetch('/api/bookmarks/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId: id }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.bookmarkedIds) {
          setBookmarkedIds(data.bookmarkedIds);
        }
      }
    } catch (err) {
      console.error('Error updating bookmark on backend:', err);
    }
  };

  // 4. Update Notification settings on backend
  const handleUpdateNotificationSettings = async (newSettings: NotificationSettings) => {
    setNotificationSettings(newSettings);
    try {
      await fetch('/api/notifications/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSettings),
      });
    } catch (err) {
      console.error('Error updating notification settings on backend:', err);
    }
  };

  // 5. Mark All Notifications read on backend
  const handleMarkAllNotificationsAsRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    try {
      await fetch('/api/notifications/read-all', { method: 'POST' });
    } catch (err) {
      console.error('Error marking notifications read on backend:', err);
    }
  };

  // 6. Clear notifications on backend
  const handleClearNotifications = async () => {
    setNotifications([]);
    try {
      await fetch('/api/notifications/clear', { method: 'POST' });
    } catch (err) {
      console.error('Error clearing notifications on backend:', err);
    }
  };

  // 7. Clear Chat Messages on backend
  const handleClearChatBackend = async () => {
    try {
      const res = await fetch('/api/chat/clear', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        if (data.chatMessages) {
          setMessages(data.chatMessages);
        }
      }
    } catch (err) {
      console.error('Error clearing chat on backend:', err);
    }
  };

  // 8. Delete Roadmap on backend
  const handleDeleteRoadmap = async (roadmapId: string) => {
    setSavedRoadmaps((prev) => prev.filter((r) => r.id !== roadmapId));
    try {
      const res = await fetch(`/api/roadmaps/${roadmapId}`, { method: 'DELETE' });
      if (res.ok) {
        const data = await res.json();
        if (data.savedRoadmaps) {
          setSavedRoadmaps(data.savedRoadmaps);
        }
      }
    } catch (err) {
      console.error('Error deleting roadmap on backend:', err);
    }
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

      {/* Backend Storage Status Bar (Subtle & Clean) */}
      <div className="bg-slate-100/70 border-b border-slate-200/80 px-4 py-1 text-[11px] text-slate-500 flex items-center justify-between">
        <div className="max-w-7xl mx-auto w-full flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="font-medium text-slate-700">백엔드 서버 데이터 영구 저장 활성화</span>
            <span className="hidden sm:inline text-slate-400">· 대화 내역, 프로필, 북마크, 로드맵이 서버에 보관됩니다</span>
          </div>
          {lastSyncTime && (
            <span className="text-slate-400 hidden sm:inline">최근 서버 동기화: {lastSyncTime}</span>
          )}
        </div>
      </div>

      {/* 2. Main Content Area */}
      <main className="flex-1 pb-10">
        {activeTab === 'chat' && (
          <ChatView
            profile={profile}
            messages={messages}
            setMessages={setMessages}
            onClearChatBackend={handleClearChatBackend}
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
            onUpdateProfile={(updated) => handleSaveProfile({ ...profile, ...updated })}
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
            savedRoadmaps={savedRoadmaps}
            onDeleteRoadmap={handleDeleteRoadmap}
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
        onUpdateSettings={handleUpdateNotificationSettings}
        onMarkAllAsRead={handleMarkAllNotificationsAsRead}
        onClearNotifications={handleClearNotifications}
        onSelectNotificationItem={handleSelectNotificationItem}
      />

      {/* 4. Student Profile Modal */}
      <ProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        profile={profile}
        onSaveProfile={handleSaveProfile}
      />
    </div>
  );
}
