import React, { useState } from 'react';
import { X, Bell, Check, Settings, Trash2, Clock, Sparkles } from 'lucide-react';
import { CurationNotification, NotificationSettings } from '../types';

interface NotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: CurationNotification[];
  settings: NotificationSettings;
  onUpdateSettings: (newSettings: NotificationSettings) => void;
  onMarkAllAsRead: () => void;
  onClearNotifications: () => void;
  onSelectNotificationItem?: (itemId: string) => void;
}

export const NotificationModal: React.FC<NotificationModalProps> = ({
  isOpen,
  onClose,
  notifications,
  settings,
  onUpdateSettings,
  onMarkAllAsRead,
  onClearNotifications,
  onSelectNotificationItem,
}) => {
  const [activeTab, setActiveTab] = useState<'list' | 'settings'>('list');
  const [newKeyword, setNewKeyword] = useState('');

  if (!isOpen) return null;

  const handleAddKeyword = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newKeyword.trim();
    if (trimmed && !settings.keywords.includes(trimmed)) {
      onUpdateSettings({
        ...settings,
        keywords: [...settings.keywords, trimmed],
      });
      setNewKeyword('');
    }
  };

  const handleRemoveKeyword = (kw: string) => {
    onUpdateSettings({
      ...settings,
      keywords: settings.keywords.filter((k) => k !== kw),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl border border-slate-200 overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900">
                취업·진학 맞춤 알림 센터
              </h2>
              <p className="text-xs text-slate-500">
                관심 공고 마감 일정 및 추천 정보 알림
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switch */}
        <div className="flex border-b border-slate-100 bg-slate-50/70 p-1">
          <button
            onClick={() => setActiveTab('list')}
            className={`flex-1 py-2 text-xs font-medium rounded-lg transition-colors flex items-center justify-center gap-1.5 ${
              activeTab === 'list'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <Bell className="w-3.5 h-3.5" />
            <span>받은 알림 ({notifications.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`flex-1 py-2 text-xs font-medium rounded-lg transition-colors flex items-center justify-center gap-1.5 ${
              activeTab === 'settings'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <Settings className="w-3.5 h-3.5" />
            <span>알림 및 키워드 설정</span>
          </button>
        </div>

        {/* Tab content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5">
          {activeTab === 'list' ? (
            <div>
              {notifications.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                  <Bell className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                  <p className="text-sm">현재 도착한 알림이 없습니다.</p>
                  <p className="text-xs text-slate-400 mt-1">
                    관심 분야 키워드를 등록하면 새로운 공고 알림을 보내드립니다.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100 text-xs">
                    <button
                      onClick={onMarkAllAsRead}
                      className="text-indigo-600 hover:underline flex items-center gap-1"
                    >
                      <Check className="w-3.5 h-3.5" />
                      모두 읽음 표시
                    </button>
                    <button
                      onClick={onClearNotifications}
                      className="text-slate-400 hover:text-rose-500 flex items-center gap-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      전체 삭제
                    </button>
                  </div>

                  {notifications.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => onSelectNotificationItem && onSelectNotificationItem(n.itemId)}
                      className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                        n.isRead
                          ? 'bg-slate-50/60 border-slate-200/80 text-slate-600'
                          : 'bg-indigo-50/40 border-indigo-200 text-slate-900 shadow-xs'
                      } hover:border-indigo-300`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-1.5">
                          {n.type === 'deadline' ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-600">
                              <Clock className="w-3 h-3" />
                              마감 임박
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600">
                              <Sparkles className="w-3 h-3" />
                              맞춤 추천
                            </span>
                          )}
                          <span className="text-[11px] text-slate-400">· {n.timestamp}</span>
                        </div>
                        {!n.isRead && (
                          <span className="w-2 h-2 rounded-full bg-indigo-600 shrink-0" />
                        )}
                      </div>
                      <p className="text-sm font-semibold mt-1">{n.title}</p>
                      <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                        {n.message}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              {/* Master toggle */}
              <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                <div>
                  <p className="text-sm font-semibold text-slate-900">맞춤 큐레이션 알림 활성화</p>
                  <p className="text-xs text-slate-500">신규 공고 및 관심 정보 수신</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.enabled}
                    onChange={(e) =>
                      onUpdateSettings({ ...settings, enabled: e.target.checked })
                    }
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-slate-900"></div>
                </label>
              </div>

              {/* Category Toggles */}
              <div className="space-y-3">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  수신 카테고리 선택
                </p>
                <div className="space-y-2">
                  <label className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer">
                    <span className="text-sm text-slate-800">💼 신입 및 인턴 채용 공고</span>
                    <input
                      type="checkbox"
                      checked={settings.categories.job}
                      onChange={(e) =>
                        onUpdateSettings({
                          ...settings,
                          categories: { ...settings.categories, job: e.target.checked },
                        })
                      }
                      className="rounded-sm border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    />
                  </label>

                  <label className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer">
                    <span className="text-sm text-slate-800">🎓 대학원 및 연구원 입학/장학 정보</span>
                    <input
                      type="checkbox"
                      checked={settings.categories.grad}
                      onChange={(e) =>
                        onUpdateSettings({
                          ...settings,
                          categories: { ...settings.categories, grad: e.target.checked },
                        })
                      }
                      className="rounded-sm border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    />
                  </label>

                  <label className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer">
                    <span className="text-sm text-slate-800">🚀 부트캠프 및 국비/기업 교육 프로그램</span>
                    <input
                      type="checkbox"
                      checked={settings.categories.bootcamp}
                      onChange={(e) =>
                        onUpdateSettings({
                          ...settings,
                          categories: { ...settings.categories, bootcamp: e.target.checked },
                        })
                      }
                      className="rounded-sm border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    />
                  </label>

                  <label className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer">
                    <span className="text-sm text-slate-800">⏰ 서류 마감 3일 전 D-Day 리마인더</span>
                    <input
                      type="checkbox"
                      checked={settings.notifyOnDeadline3Days}
                      onChange={(e) =>
                        onUpdateSettings({
                          ...settings,
                          notifyOnDeadline3Days: e.target.checked,
                        })
                      }
                      className="rounded-sm border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    />
                  </label>
                </div>
              </div>

              {/* Keyword Filters */}
              <div className="space-y-3">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  관심 알림 키워드 (예: 네이버, PM, AI대학원, SSAFY)
                </p>
                <form onSubmit={handleAddKeyword} className="flex gap-2">
                  <input
                    type="text"
                    value={newKeyword}
                    onChange={(e) => setNewKeyword(e.target.value)}
                    placeholder="키워드 입력 후 추가"
                    className="flex-1 px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-hidden focus:border-indigo-500"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-slate-900 text-white text-xs font-medium rounded-lg hover:bg-slate-800 transition-colors"
                  >
                    추가
                  </button>
                </form>

                <div className="flex flex-wrap gap-1.5 pt-1">
                  {settings.keywords.map((kw) => (
                    <span
                      key={kw}
                      className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 text-slate-700 text-xs rounded-md"
                    >
                      <span>#{kw}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveKeyword(kw)}
                        className="text-slate-400 hover:text-slate-700 ml-0.5"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                  {settings.keywords.length === 0 && (
                    <p className="text-xs text-slate-400">등록된 관심 키워드가 없습니다.</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 text-white text-xs font-medium rounded-lg hover:bg-slate-800 transition-colors"
          >
            확인
          </button>
        </div>
      </div>
    </div>
  );
};
