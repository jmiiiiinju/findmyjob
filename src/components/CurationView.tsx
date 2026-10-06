import React, { useState, useMemo } from 'react';
import {
  Briefcase,
  GraduationCap,
  Sparkles,
  Search,
  Filter,
  Bookmark,
  BookmarkCheck,
  Calendar,
  ExternalLink,
  Bell,
  Clock,
  ArrowUpDown,
  Building,
  CheckCircle,
  MessageSquare,
  X,
  RefreshCw,
} from 'lucide-react';
import { CurationCategory, CurationItem, StudentProfile } from '../types';
import { CURATION_DATA } from '../data/curationData';

interface CurationViewProps {
  profile: StudentProfile;
  bookmarkedIds: string[];
  onToggleBookmark: (id: string) => void;
  onOpenNotificationSettings: () => void;
  onNavigateToChatWithPrompt: (prompt: string) => void;
  selectedItemId?: string | null;
  onClearSelectedItem?: () => void;
}

export const CurationView: React.FC<CurationViewProps> = ({
  profile,
  bookmarkedIds,
  onToggleBookmark,
  onOpenNotificationSettings,
  onNavigateToChatWithPrompt,
  selectedItemId,
  onClearSelectedItem,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<CurationCategory>('all');
  const [selectedSubCategory, setSelectedSubCategory] = useState<string>('전체');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'latest' | 'deadline' | 'hot'>('latest');
  const [showBookmarksOnly, setShowBookmarksOnly] = useState(false);

  // Detail Modal state
  const [activeModalItem, setActiveModalItem] = useState<CurationItem | null>(() => {
    if (selectedItemId) {
      return CURATION_DATA.find((c) => c.id === selectedItemId) || null;
    }
    return null;
  });

  // AI Fit Analysis state
  const [isAnalyzingFit, setIsAnalyzingFit] = useState(false);
  const [fitResult, setFitResult] = useState<any | null>(null);

  // Sub-categories list
  const subCategories = ['전체', 'IT/개발', '경영/기획', '마케팅/비즈니스', '연구/R&D', '디자인', '공기업/금융'];

  // Filtered and sorted data
  const filteredItems = useMemo(() => {
    return CURATION_DATA.filter((item) => {
      // Category filter
      if (selectedCategory !== 'all' && item.category !== selectedCategory) {
        return false;
      }
      // SubCategory filter
      if (selectedSubCategory !== '전체' && item.subCategory !== selectedSubCategory) {
        return false;
      }
      // Bookmarks only filter
      if (showBookmarksOnly && !bookmarkedIds.includes(item.id)) {
        return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = item.title.toLowerCase().includes(query);
        const matchesOrg = item.organization.toLowerCase().includes(query);
        const matchesTags = item.tags.some((t) => t.toLowerCase().includes(query));
        const matchesDesc = item.description.toLowerCase().includes(query);
        if (!matchesTitle && !matchesOrg && !matchesTags && !matchesDesc) {
          return false;
        }
      }
      return true;
    }).sort((a, b) => {
      if (sortBy === 'deadline') {
        const aVal = typeof a.dDay === 'number' ? a.dDay : 999;
        const bVal = typeof b.dDay === 'number' ? b.dDay : 999;
        return aVal - bVal;
      }
      if (sortBy === 'hot') {
        if (a.isHot && !b.isHot) return -1;
        if (!a.isHot && b.isHot) return 1;
        return 0;
      }
      // Default: latest
      return new Date(b.postedDate).getTime() - new Date(a.postedDate).getTime();
    });
  }, [selectedCategory, selectedSubCategory, searchQuery, sortBy, showBookmarksOnly, bookmarkedIds]);

  const handleOpenModal = (item: CurationItem) => {
    setActiveModalItem(item);
    setFitResult(null);
  };

  const handleCloseModal = () => {
    setActiveModalItem(null);
    setFitResult(null);
    onClearSelectedItem?.();
  };

  const handleAnalyzeFit = async (item: CurationItem) => {
    setIsAnalyzingFit(true);
    setFitResult(null);

    try {
      const response = await fetch('/api/curation/analyze-fit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          item,
          userProfile: profile,
        }),
      });

      if (!response.ok) {
        throw new Error('적합도 분석에 실패했습니다.');
      }

      const data = await response.json();
      setFitResult(data);
    } catch (err: any) {
      alert(err.message || '네트워크 오류가 발생했습니다.');
    } finally {
      setIsAnalyzingFit(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* 1. Header & Notification Settings Callout */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-indigo-600 mb-1">
            <Briefcase className="w-4 h-4" />
            <span>실시간 취업·진학 큐레이션 포털</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            대학생 맞춤 인턴 채용 · 대학원 · 부트캠프 정보
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            관심 분야의 최신 공고를 한곳에서 확인하고, 마감 D-Day 알림을 구독해보세요.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={onOpenNotificationSettings}
            className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold hover:bg-slate-800 transition-colors flex items-center gap-2 shadow-xs"
          >
            <Bell className="w-3.5 h-3.5" />
            <span>맞춤 알림 설정</span>
          </button>
        </div>
      </div>

      {/* 2. Category Switcher (Tabs) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <button
          onClick={() => setSelectedCategory('all')}
          className={`p-3 rounded-xl border text-left transition-all ${
            selectedCategory === 'all'
              ? 'bg-slate-900 border-slate-900 text-white shadow-xs'
              : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
        >
          <p className="text-xs font-bold">전체 정보</p>
          <p className={`text-[11px] mt-0.5 ${selectedCategory === 'all' ? 'text-slate-300' : 'text-slate-500'}`}>
            총 {CURATION_DATA.length}건 수록
          </p>
        </button>

        <button
          onClick={() => setSelectedCategory('job')}
          className={`p-3 rounded-xl border text-left transition-all ${
            selectedCategory === 'job'
              ? 'bg-slate-900 border-slate-900 text-white shadow-xs'
              : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
        >
          <div className="flex items-center gap-1.5">
            <Briefcase className="w-3.5 h-3.5" />
            <p className="text-xs font-bold">신입 & 인턴 채용</p>
          </div>
          <p className={`text-[11px] mt-0.5 ${selectedCategory === 'job' ? 'text-slate-300' : 'text-slate-500'}`}>
            대기업, IT, 스타트업
          </p>
        </button>

        <button
          onClick={() => setSelectedCategory('grad')}
          className={`p-3 rounded-xl border text-left transition-all ${
            selectedCategory === 'grad'
              ? 'bg-slate-900 border-slate-900 text-white shadow-xs'
              : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
        >
          <div className="flex items-center gap-1.5">
            <GraduationCap className="w-3.5 h-3.5" />
            <p className="text-xs font-bold">대학원 & 연구원</p>
          </div>
          <p className={`text-[11px] mt-0.5 ${selectedCategory === 'grad' ? 'text-slate-300' : 'text-slate-500'}`}>
            국내외 석박사 장학
          </p>
        </button>

        <button
          onClick={() => setSelectedCategory('bootcamp')}
          className={`p-3 rounded-xl border text-left transition-all ${
            selectedCategory === 'bootcamp'
              ? 'bg-slate-900 border-slate-900 text-white shadow-xs'
              : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
        >
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <p className="text-xs font-bold">교육 & 부트캠프</p>
          </div>
          <p className={`text-[11px] mt-0.5 ${selectedCategory === 'bootcamp' ? 'text-slate-300' : 'text-slate-500'}`}>
            SSAFY, 우테코, 국비
          </p>
        </button>
      </div>

      {/* 3. Sub-Category Pills & Controls Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3">
        {/* Sub-category buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
          <span className="text-[11px] font-semibold text-slate-400 whitespace-nowrap mr-1">
            분야 필터:
          </span>
          {subCategories.map((sub) => {
            const isSelected = selectedSubCategory === sub;
            return (
              <button
                key={sub}
                onClick={() => setSelectedSubCategory(sub)}
                className={`px-3 py-1.5 text-xs rounded-lg whitespace-nowrap transition-colors ${
                  isSelected
                    ? 'bg-slate-900 text-white font-medium'
                    : 'bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200'
                }`}
              >
                {sub}
              </button>
            );
          })}
        </div>

        {/* Search & Sort Row */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-slate-100">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="기업명, 직무, 키워드 검색..."
              className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:border-indigo-500"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            {/* Bookmark filter toggle */}
            <button
              onClick={() => setShowBookmarksOnly(!showBookmarksOnly)}
              className={`px-2.5 py-1.5 text-xs rounded-lg border transition-colors flex items-center gap-1 ${
                showBookmarksOnly
                  ? 'bg-indigo-50 border-indigo-200 text-indigo-700 font-semibold'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Bookmark className="w-3.5 h-3.5" />
              <span>북마크 ({bookmarkedIds.length})</span>
            </button>

            {/* Sort selector */}
            <div className="flex items-center gap-1 bg-slate-50 p-1 border border-slate-200 rounded-lg text-xs">
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 ml-1" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-transparent border-none text-slate-700 text-xs focus:outline-hidden pr-2"
              >
                <option value="latest">최신 등록순</option>
                <option value="deadline">마감 임박순 (D-Day)</option>
                <option value="hot">인기·추천순</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Curation Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredItems.map((item) => {
          const isBookmarked = bookmarkedIds.includes(item.id);
          const isUrgent = typeof item.dDay === 'number' && item.dDay <= 7;

          return (
            <div
              key={item.id}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between hover:border-slate-400 transition-all group"
            >
              <div>
                {/* Header Metadata (unboxed, separated by dot) */}
                <div className="flex items-center justify-between text-xs text-slate-500 pb-2 mb-2 border-b border-slate-100">
                  <div className="flex items-center gap-1.5 truncate">
                    <span className="font-semibold text-slate-700">{item.organization}</span>
                    <span>·</span>
                    <span>{item.organizationType}</span>
                    <span>·</span>
                    <span>{item.subCategory}</span>
                  </div>

                  <button
                    onClick={() => onToggleBookmark(item.id)}
                    className="text-slate-400 hover:text-indigo-600 p-1 transition-colors"
                    title={isBookmarked ? '북마크 취소' : '북마크 저장'}
                  >
                    {isBookmarked ? (
                      <BookmarkCheck className="w-4 h-4 text-indigo-600" />
                    ) : (
                      <Bookmark className="w-4 h-4" />
                    )}
                  </button>
                </div>

                {/* Title */}
                <h3
                  onClick={() => handleOpenModal(item)}
                  className="text-sm sm:text-base font-bold text-slate-900 group-hover:text-indigo-600 transition-colors cursor-pointer line-clamp-2"
                >
                  {item.title}
                </h3>

                {/* D-Day & Target Audience */}
                <div className="flex items-center gap-2 mt-2 text-xs">
                  <span
                    className={`font-bold ${
                      isUrgent ? 'text-rose-600' : 'text-slate-700'
                    }`}
                  >
                    D-{item.dDay} ({item.deadline})
                  </span>
                  <span className="text-slate-300">|</span>
                  <span className="text-slate-500 truncate">{item.location}</span>
                </div>

                {/* Benefit / Salary callout */}
                <div className="mt-3 p-2.5 bg-slate-50 rounded-xl text-xs text-slate-800 font-medium">
                  💰 {item.benefitOrSalary}
                </div>

                {/* Brief description */}
                <p className="text-xs text-slate-600 mt-2.5 line-clamp-2 leading-relaxed">
                  {item.description}
                </p>

                {/* Tags */}
                <div className="flex flex-wrap gap-1 mt-3">
                  {item.tags.slice(0, 3).map((tag, i) => (
                    <span
                      key={i}
                      className="text-[11px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                <button
                  onClick={() => handleOpenModal(item)}
                  className="flex-1 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-medium hover:bg-slate-800 transition-colors text-center"
                >
                  상세 요강 & AI 분석
                </button>
                <button
                  onClick={() =>
                    onNavigateToChatWithPrompt(
                      `[${item.organization}]의 '${item.title}' 공고 지원을 고민 중인데요, 현재 ${profile.grade || '재학생'} ${profile.major || '비전공'} 입장에서 서류 합격 가능성을 높이기 위해 어떤 경험을 강조해야 할까요?`
                    )
                  }
                  title="챗봇에게 물어보기"
                  className="p-1.5 border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  <MessageSquare className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {filteredItems.length === 0 && (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200">
          <Briefcase className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <p className="text-sm font-semibold text-slate-700">검색 조건에 맞는 공고가 없습니다.</p>
          <p className="text-xs text-slate-500 mt-1">검색어나 카테고리 필터를 변경해보세요.</p>
        </div>
      )}

      {/* 5. Item Detail & AI Fit Analysis Modal */}
      {activeModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="p-5 border-b border-slate-100 flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
                  <span className="font-bold text-slate-800">{activeModalItem.organization}</span>
                  <span>·</span>
                  <span>{activeModalItem.organizationType}</span>
                  <span>·</span>
                  <span>{activeModalItem.subCategory}</span>
                </div>
                <h2 className="text-lg font-bold text-slate-900 leading-snug">
                  {activeModalItem.title}
                </h2>
              </div>
              <button
                onClick={handleCloseModal}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-5 text-sm">
              {/* Quick Info Grid */}
              <div className="grid grid-cols-2 gap-3 p-3.5 bg-slate-50 rounded-xl text-xs">
                <div>
                  <span className="text-slate-400">마감일:</span>
                  <p className="font-semibold text-slate-800 mt-0.5">
                    {activeModalItem.deadline} (D-{activeModalItem.dDay})
                  </p>
                </div>
                <div>
                  <span className="text-slate-400">근무/실습지:</span>
                  <p className="font-semibold text-slate-800 mt-0.5">{activeModalItem.location}</p>
                </div>
                <div>
                  <span className="text-slate-400">지원 대상:</span>
                  <p className="font-semibold text-slate-800 mt-0.5">{activeModalItem.targetAudience}</p>
                </div>
                <div>
                  <span className="text-slate-400">처우/혜택:</span>
                  <p className="font-semibold text-slate-800 mt-0.5">{activeModalItem.benefitOrSalary}</p>
                </div>
              </div>

              {/* Description */}
              <div>
                <h4 className="text-xs font-bold text-slate-900 mb-1.5">개요 및 주요 업무</h4>
                <p className="text-xs text-slate-700 leading-relaxed bg-white p-3 border border-slate-200 rounded-xl">
                  {activeModalItem.description}
                </p>
              </div>

              {/* Requirements */}
              <div>
                <h4 className="text-xs font-bold text-slate-900 mb-1.5">지원 자격</h4>
                <ul className="space-y-1 text-xs text-slate-700 bg-white p-3 border border-slate-200 rounded-xl">
                  {activeModalItem.requirements.map((req, i) => (
                    <li key={i} className="flex items-start gap-1.5">
                      <span className="text-indigo-600 font-bold">✓</span>
                      <span>{req}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Preferred */}
              {activeModalItem.preferredQualifications && (
                <div>
                  <h4 className="text-xs font-bold text-slate-900 mb-1.5">우대 사항</h4>
                  <ul className="space-y-1 text-xs text-slate-700 bg-white p-3 border border-slate-200 rounded-xl">
                    {activeModalItem.preferredQualifications.map((pref, i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <span className="text-amber-500 font-bold">★</span>
                        <span>{pref}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* AI Fit Analysis Section */}
              <div className="border border-indigo-200 bg-indigo-50/40 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    <span className="text-xs font-bold text-indigo-900">
                      내 프로필 기반 AI 합격 적합도 분석
                    </span>
                  </div>
                  {!fitResult && (
                    <button
                      onClick={() => handleAnalyzeFit(activeModalItem)}
                      disabled={isAnalyzingFit}
                      className="px-3 py-1 bg-slate-900 text-white rounded-lg text-xs font-medium hover:bg-slate-800 transition-colors flex items-center gap-1"
                    >
                      {isAnalyzingFit ? (
                        <>
                          <RefreshCw className="w-3 h-3 animate-spin" />
                          <span>분석 중...</span>
                        </>
                      ) : (
                        <span>적합도 분석 실행</span>
                      )}
                    </button>
                  )}
                </div>

                {!fitResult && !isAnalyzingFit && (
                  <p className="text-xs text-slate-600">
                    현재 학생의 학년({profile.grade}), 전공({profile.major || '미입력'}), MBTI({profile.mbti || '미입력'})를 바탕으로 합격 가능성과 지금 보완할 점을 분석합니다.
                  </p>
                )}

                {fitResult && (
                  <div className="space-y-3 pt-2 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-800">적합도 등급:</span>
                      <span className="px-2 py-0.5 bg-indigo-600 text-white font-bold rounded-md text-[11px]">
                        {fitResult.fitLevel}
                      </span>
                    </div>
                    <p className="text-slate-700 leading-relaxed">{fitResult.fitEvaluation}</p>

                    <div>
                      <p className="font-bold text-slate-900 mt-2 mb-1">지금 당장 실행할 준비 과제:</p>
                      <ul className="space-y-1 text-slate-700">
                        {fitResult.actionSteps.map((step: string, idx: number) => (
                          <li key={idx} className="flex items-start gap-1.5">
                            <span className="text-emerald-600 font-bold">0{idx + 1}.</span>
                            <span>{step}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="p-2.5 bg-white rounded-lg border border-indigo-100">
                      <span className="font-bold text-slate-900">서류/자기소개서 어필 꿀팁: </span>
                      <span className="text-slate-700">{fitResult.applicationTip}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Footer Actions */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                {activeModalItem.officialUrl && (
                  <a
                    href={activeModalItem.officialUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3.5 py-2 border border-slate-200 text-slate-700 text-xs font-semibold rounded-lg hover:bg-white transition-colors flex items-center gap-1.5"
                  >
                    <span>공식 홈페이지 확인</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>

              <button
                onClick={() => {
                  handleCloseModal();
                  onNavigateToChatWithPrompt(
                    `[${activeModalItem.organization}]의 '${activeModalItem.title}' 공고에 지원하고 싶은데요! 제 현재 스펙 상황(${profile.grade}, ${profile.major || '비전공'})에서 합격하려면 자기소개서에 어떤 스토리와 프로젝트를 풀어내면 좋을까요?`
                  );
                }}
                className="px-4 py-2 bg-slate-900 text-white text-xs font-semibold rounded-lg hover:bg-slate-800 transition-colors flex items-center gap-1.5"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>AI 멘토에게 심층 질문하기</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
