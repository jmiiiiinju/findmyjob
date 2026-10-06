import React from 'react';
import { Bot, Compass, Briefcase, Map, Bell, User, Sparkles } from 'lucide-react';
import { StudentProfile } from '../types';

interface NavbarProps {
  activeTab: 'chat' | 'recommend' | 'curation' | 'roadmap';
  setActiveTab: (tab: 'chat' | 'recommend' | 'curation' | 'roadmap') => void;
  onOpenNotifications: () => void;
  onOpenProfile: () => void;
  unreadCount: number;
  profile: StudentProfile;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onOpenNotifications,
  onOpenProfile,
  unreadCount,
  profile,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Zone 1: Brand title wordmark */}
        <button
          onClick={() => setActiveTab('chat')}
          className="flex items-center gap-2 text-left group focus:outline-hidden"
        >
          <div className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-lg shadow-sm group-hover:bg-indigo-600 transition-colors">
            P
          </div>
          <div>
            <span className="font-bold text-lg tracking-tight text-slate-900">
              PathFinder AI
            </span>
            <span className="hidden sm:inline-block ml-2 text-xs text-slate-500 font-normal">
              대학생 진로 멘토링
            </span>
          </div>
        </button>

        {/* Zone 2: Navigation Links (single line with active states) */}
        <nav className="flex items-center gap-1 sm:gap-2">
          <button
            onClick={() => setActiveTab('chat')}
            className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg transition-colors whitespace-nowrap ${
              activeTab === 'chat'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Bot className="w-4 h-4" />
            <span>AI 멘토 챗봇</span>
          </button>

          <button
            onClick={() => setActiveTab('recommend')}
            className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg transition-colors whitespace-nowrap ${
              activeTab === 'recommend'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>AI 진로 추천</span>
          </button>

          <button
            onClick={() => setActiveTab('curation')}
            className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg transition-colors whitespace-nowrap ${
              activeTab === 'curation'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Briefcase className="w-4 h-4" />
            <span>취업·진학 큐레이션</span>
          </button>

          <button
            onClick={() => setActiveTab('roadmap')}
            className={`hidden md:flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg transition-colors whitespace-nowrap ${
              activeTab === 'roadmap'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Map className="w-4 h-4" />
            <span>커리어 로드맵</span>
          </button>
        </nav>

        {/* Zone 3: Primary Actions (Notifications & Profile) */}
        <div className="flex items-center gap-2">
          {/* Notification bell */}
          <button
            onClick={onOpenNotifications}
            aria-label="알림 센터 열기"
            className="relative p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full animate-pulse" />
            )}
          </button>

          {/* Student Profile Quick Pill */}
          <button
            onClick={onOpenProfile}
            className="flex items-center gap-2 px-3 py-1.5 border border-slate-200 rounded-lg hover:border-slate-300 hover:bg-slate-50 transition-colors text-xs text-slate-700"
          >
            <div className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-semibold text-[10px]">
              {profile.mbti ? profile.mbti.slice(0, 2) : 'MY'}
            </div>
            <div className="hidden sm:block text-left">
              <p className="font-semibold text-slate-900 truncate max-w-[90px]">
                {profile.major ? profile.major : '내 프로필'}
              </p>
              <p className="text-[10px] text-slate-500">
                {profile.grade || '학년 미설정'} {profile.mbti ? `· ${profile.mbti}` : ''}
              </p>
            </div>
            <User className="w-3.5 h-3.5 text-slate-400 sm:hidden" />
          </button>
        </div>
      </div>
    </header>
  );
};
