import React, { useState } from 'react';
import { X, User, Check } from 'lucide-react';
import { StudentProfile } from '../types';
import { MBTI_OPTIONS, POPULAR_KEYWORDS } from '../data/curationData';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: StudentProfile;
  onSaveProfile: (profile: StudentProfile) => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  isOpen,
  onClose,
  profile,
  onSaveProfile,
}) => {
  const [form, setForm] = useState<StudentProfile>(profile);
  const [newInterest, setNewInterest] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveProfile(form);
    onClose();
  };

  const handleToggleKeyword = (kw: string) => {
    const exists = form.interests.includes(kw);
    if (exists) {
      setForm({ ...form, interests: form.interests.filter((i) => i !== kw) });
    } else {
      setForm({ ...form, interests: [...form.interests, kw] });
    }
  };

  const handleAddCustomInterest = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newInterest.trim();
    if (trimmed && !form.interests.includes(trimmed)) {
      setForm({ ...form, interests: [...form.interests, trimmed] });
      setNewInterest('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <User className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900">
                대학생 커리어 프로필 설정
              </h2>
              <p className="text-xs text-slate-500">
                AI 챗봇과 추천 시스템이 맞춤형으로 분석합니다
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                학년 / 재적 상태
              </label>
              <select
                value={form.grade}
                onChange={(e) => setForm({ ...form, grade: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-hidden focus:border-indigo-500"
              >
                <option value="1학년">1학년 (새내기)</option>
                <option value="2학년">2학년</option>
                <option value="3학년">3학년</option>
                <option value="4학년">4학년 (졸업예정)</option>
                <option value="졸업유예/취준">졸업유예 / 취준생</option>
                <option value="휴학 중">휴학 중</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                MBTI 성격 유형
              </label>
              <select
                value={form.mbti}
                onChange={(e) => setForm({ ...form, mbti: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-hidden focus:border-indigo-500"
              >
                <option value="">선택 안 함</option>
                {MBTI_OPTIONS.map((m) => (
                  <option key={m.code} value={m.code}>
                    {m.code} ({m.label})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              전공 (주전공 또는 복수전공)
            </label>
            <input
              type="text"
              value={form.major}
              onChange={(e) => setForm({ ...form, major: e.target.value })}
              placeholder="예: 경영학과, 컴퓨터공학부, 국어국문학 등"
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-hidden focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              관심 직무 또는 희망 진로 키워드
            </label>
            <input
              type="text"
              value={form.targetField}
              onChange={(e) => setForm({ ...form, targetField: e.target.value })}
              placeholder="예: 프로덕트 매니저(PM), 프론트엔드, AI대학원 진학"
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-hidden focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              관심 세부 키워드 태그 (클릭하여 선택)
            </label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {POPULAR_KEYWORDS.slice(0, 10).map((kw) => {
                const isSelected = form.interests.includes(kw);
                return (
                  <button
                    key={kw}
                    type="button"
                    onClick={() => handleToggleKeyword(kw)}
                    className={`px-2.5 py-1 text-xs rounded-md border transition-colors ${
                      isSelected
                        ? 'bg-slate-900 border-slate-900 text-white'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {kw}
                  </button>
                );
              })}
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={newInterest}
                onChange={(e) => setNewInterest(e.target.value)}
                placeholder="직접 키워드 입력 후 추가"
                className="flex-1 px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:border-indigo-500"
              />
              <button
                type="button"
                onClick={handleAddCustomInterest}
                className="px-3 py-1.5 bg-slate-100 text-slate-700 text-xs font-medium rounded-lg hover:bg-slate-200"
              >
                추가
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              현재 가장 큰 진로 고민 (선택)
            </label>
            <textarea
              rows={2}
              value={form.currentConcerns}
              onChange={(e) => setForm({ ...form, currentConcerns: e.target.value })}
              placeholder="예: 문과생인데 IT 기획이나 개발 쪽으로 전향하고 싶은데 스펙이 없어서 막막해요."
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-hidden focus:border-indigo-500 resize-none"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-200 text-slate-700 text-xs font-medium rounded-lg hover:bg-slate-50"
            >
              취소
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-slate-900 text-white text-xs font-medium rounded-lg hover:bg-slate-800 transition-colors flex items-center gap-1.5"
            >
              <Check className="w-3.5 h-3.5" />
              프로필 저장
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
