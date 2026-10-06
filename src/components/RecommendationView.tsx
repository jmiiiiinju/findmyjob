import React, { useState } from 'react';
import { Sparkles, Brain, Briefcase, GraduationCap, ArrowRight, MessageSquare, CheckCircle2, ChevronRight, RefreshCw, Star } from 'lucide-react';
import { MBTIRecommendationResult, StudentProfile } from '../types';
import { MBTI_OPTIONS, POPULAR_KEYWORDS } from '../data/curationData';

interface RecommendationViewProps {
  profile: StudentProfile;
  onUpdateProfile: (updated: Partial<StudentProfile>) => void;
  onNavigateToChatWithPrompt: (prompt: string) => void;
  onNavigateToRoadmap: (targetJob: string) => void;
}

export const RecommendationView: React.FC<RecommendationViewProps> = ({
  profile,
  onUpdateProfile,
  onNavigateToChatWithPrompt,
  onNavigateToRoadmap,
}) => {
  const [mbti, setMbti] = useState(profile.mbti || 'ENFP');
  const [major, setMajor] = useState(profile.major || '');
  const [grade, setGrade] = useState(profile.grade || '3학년');
  const [targetKeywords, setTargetKeywords] = useState(profile.targetField || '기획 및 데이터 분석');
  const [selectedInterests, setSelectedInterests] = useState<string[]>(
    profile.interests && profile.interests.length > 0
      ? profile.interests
      : ['프로덕트 매니저 (PM)', '데이터 분석가 (DA)']
  );

  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<MBTIRecommendationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleToggleKeyword = (kw: string) => {
    if (selectedInterests.includes(kw)) {
      setSelectedInterests(selectedInterests.filter((k) => k !== kw));
    } else {
      setSelectedInterests([...selectedInterests, kw]);
    }
  };

  const handleRunRecommendation = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!mbti || !targetKeywords) {
      alert('MBTI와 희망 직무 키워드를 입력해주세요.');
      return;
    }

    setIsLoading(true);
    setError(null);

    // Save profile preferences
    onUpdateProfile({
      mbti,
      major,
      grade,
      targetField: targetKeywords,
      interests: selectedInterests,
    });

    try {
      const response = await fetch('/api/career/recommend-mbti', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mbti,
          major,
          grade,
          targetKeywords,
          interests: selectedInterests,
        }),
      });

      if (!response.ok) {
        const errJson = await response.json();
        throw new Error(errJson.error || '진로 추천 분석에 실패했습니다.');
      }

      const data: MBTIRecommendationResult = await response.json();
      setResult(data);
    } catch (err: any) {
      setError(err.message || '네트워크 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-8">
      {/* 1. Header Banner */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 sm:p-8 shadow-sm">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-400 mb-2">
            <Sparkles className="w-4 h-4" />
            <span>AI 기반 정밀 진로 추천 시스템</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            나의 MBTI와 관심 분야에 딱 맞는 직업·학과·역량 추천
          </h1>
          <p className="mt-2 text-sm text-slate-300 leading-relaxed">
            성격 유형론(MBTI)의 업무 스타일과 채용 시장의 최신 트렌드를 결합하여,
            단순 직업 나열을 넘어 구체적인 학과/연계전공과 필수 역량 로드맵을 도출해 드립니다.
          </p>
        </div>
      </div>

      {/* 2. Input Form Deck */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-7 shadow-xs">
        <form onSubmit={handleRunRecommendation} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* MBTI Selector */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5">
                1. 나의 MBTI 성격 유형
              </label>
              <select
                value={mbti}
                onChange={(e) => setMbti(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm font-medium border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-hidden focus:border-indigo-500 transition-colors"
              >
                {MBTI_OPTIONS.map((opt) => (
                  <option key={opt.code} value={opt.code}>
                    {opt.code} · {opt.label}
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-slate-400 mt-1">
                {MBTI_OPTIONS.find((o) => o.code === mbti)?.desc}
              </p>
            </div>

            {/* Current Major */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5">
                2. 현재 전공 (주전공/복수전공)
              </label>
              <input
                type="text"
                value={major}
                onChange={(e) => setMajor(e.target.value)}
                placeholder="예: 경영학, 컴퓨터공학, 심리학, 자유전공"
                className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-hidden focus:border-indigo-500 transition-colors"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                전공과 무관한 전향도 완벽히 지원합니다.
              </p>
            </div>

            {/* Current Grade */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5">
                3. 현재 학년
              </label>
              <select
                value={grade}
                onChange={(e) => setGrade(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-hidden focus:border-indigo-500 transition-colors"
              >
                <option value="1학년">1학년 (기초 탐색기)</option>
                <option value="2학년">2학년 (전공 심화기)</option>
                <option value="3학년">3학년 (스펙·실전 준비기)</option>
                <option value="4학년">4학년 (취업·진학 집중기)</option>
                <option value="졸업유예/취준">졸업유예 / 본격 취준생</option>
              </select>
              <p className="text-[11px] text-slate-400 mt-1">
                학년에 맞는 현실적 실행 방안을 제안합니다.
              </p>
            </div>
          </div>

          {/* Target keywords input */}
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1.5">
              4. 희망 직무 또는 관심 키워드
            </label>
            <input
              type="text"
              value={targetKeywords}
              onChange={(e) => setTargetKeywords(e.target.value)}
              placeholder="예: 프로덕트 매니저(PM), 프론트엔드 개발, AI 연구원, 퍼포먼스 마케팅, 공기업 사무"
              className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-hidden focus:border-indigo-500 transition-colors"
            />
          </div>

          {/* Popular Keyword Chips */}
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1.5">
              관심 분야 빠른 태그 선택 (다중 선택 가능)
            </label>
            <div className="flex flex-wrap gap-2">
              {POPULAR_KEYWORDS.map((kw) => {
                const isSelected = selectedInterests.includes(kw);
                return (
                  <button
                    key={kw}
                    type="button"
                    onClick={() => handleToggleKeyword(kw)}
                    className={`px-3 py-1.5 text-xs rounded-lg border transition-all ${
                      isSelected
                        ? 'bg-slate-900 border-slate-900 text-white shadow-xs font-medium'
                        : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    {kw}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Submit Action */}
          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full sm:w-auto px-6 py-3 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-slate-800 transition-all flex items-center justify-center gap-2 shadow-xs disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-amber-400" />
                  <span>Gemini가 진로 데이터를 심층 분석 중입니다...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>AI 맞춤 진로 정밀 추천받기</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Error state */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-sm text-rose-700">
          {error}
        </div>
      )}

      {/* 3. Recommendation Results */}
      {result && (
        <div className="space-y-8 animate-in fade-in duration-300">
          {/* A. MBTI Work Style & Strengths */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
            <div className="flex items-center gap-2 text-indigo-600 font-bold text-sm mb-3">
              <Brain className="w-5 h-5" />
              <span>MBTI 성향 및 업무 스타일 분석 ({result.mbtiAnalysis.type})</span>
            </div>
            <p className="text-sm text-slate-800 leading-relaxed font-medium">
              {result.mbtiAnalysis.workStyle}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-5 pt-4 border-t border-slate-100">
              <div className="bg-slate-50 rounded-xl p-4">
                <p className="text-xs font-bold text-slate-900 mb-2">🎯 핵심 직무 강점</p>
                <ul className="space-y-1.5 text-xs text-slate-700">
                  {result.mbtiAnalysis.coreStrengths.map((str, i) => (
                    <li key={i} className="flex items-start gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 mt-0.5 shrink-0" />
                      <span>{str}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-slate-50 rounded-xl p-4">
                <p className="text-xs font-bold text-slate-900 mb-2">⚠️ 커리어 준비 시 주의할 맹점</p>
                <ul className="space-y-1.5 text-xs text-slate-700">
                  {result.mbtiAnalysis.potentialBlindspots.map((blind, i) => (
                    <li key={i} className="flex items-start gap-1.5">
                      <span className="text-amber-500 font-bold mt-0.5">·</span>
                      <span>{blind}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* B. Top 3 Recommended Jobs */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Briefcase className="w-5 h-5 text-indigo-600" />
                  <span>적합도 높은 추천 직업 TOP 3</span>
                </h2>
                <p className="text-xs text-slate-500">
                  성향, 전공 확장성, 채용 시장 전망을 종합 반영한 직무입니다.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {result.recommendedJobs.map((job, idx) => (
                <div
                  key={idx}
                  className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between hover:border-slate-400 transition-all"
                >
                  <div>
                    {/* Top unboxed metadata */}
                    <div className="flex items-center justify-between text-xs text-slate-500 pb-2 mb-2 border-b border-slate-100">
                      <span>{job.category}</span>
                      <span className="font-bold text-indigo-600">
                        적합도 {job.fitScore}%
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-slate-900">
                      {job.title}
                    </h3>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                      {job.oneLineDescription}
                    </p>

                    <div className="mt-4 pt-3 border-t border-slate-100 space-y-2.5 text-xs">
                      <div>
                        <span className="font-semibold text-slate-800">추천 이유:</span>
                        <p className="text-slate-600 mt-0.5 leading-relaxed">{job.whyFit}</p>
                      </div>

                      <div>
                        <span className="font-semibold text-slate-800">시장 전망 및 처우:</span>
                        <p className="text-slate-600 mt-0.5 leading-relaxed">{job.marketOutlook}</p>
                      </div>

                      {/* Hard/Soft skills */}
                      <div>
                        <span className="font-semibold text-slate-800">핵심 기술 (Hard Skills):</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {job.hardSkills.map((s, i) => (
                            <span
                              key={i}
                              className="px-2 py-0.5 bg-slate-100 text-slate-700 text-[11px] rounded-md"
                            >
                              {s}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div>
                        <span className="font-semibold text-slate-800">필수 소프트스킬:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {job.softSkills.map((s, i) => (
                            <span
                              key={i}
                              className="px-2 py-0.5 bg-indigo-50 text-indigo-700 text-[11px] rounded-md"
                            >
                              {s}
                            </span>
                          ))}
                        </div>
                      </div>

                      {job.certifications && job.certifications.length > 0 && (
                        <div>
                          <span className="font-semibold text-slate-800">추천 자격/툴:</span>
                          <p className="text-slate-600 mt-0.5">{job.certifications.join(', ')}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="mt-5 pt-3 border-t border-slate-100 flex flex-col gap-2">
                    <button
                      onClick={() =>
                        onNavigateToChatWithPrompt(
                          `제가 MBTI 진단에서 '${job.title}' 직무를 추천받았는데요! 현재 ${grade} ${major || '비전공'} 상태에서 이 직무를 위해 지금 당장 시작해야 할 준비 단계와 스펙을 자세히 알려주세요.`
                        )
                      }
                      className="w-full py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 transition-colors flex items-center justify-center gap-1.5"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>이 직무로 AI 멘토와 상담하기</span>
                    </button>
                    <button
                      onClick={() => onNavigateToRoadmap(job.title)}
                      className="w-full py-1.5 border border-slate-200 text-slate-700 rounded-lg text-xs font-medium hover:bg-slate-50 transition-colors flex items-center justify-center gap-1"
                    >
                      <span>4단계 커리어 로드맵 보기</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* C. Recommended Majors & Minor/Graduate Tracks */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 mb-3">
              <GraduationCap className="w-5 h-5 text-indigo-600" />
              <span>추천 복수전공·부전공 및 대학원 연계 트랙</span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {result.recommendedMajorsOrMinors.map((item, i) => (
                <div key={i} className="p-4 bg-slate-50 rounded-xl border border-slate-200/80">
                  <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                    <span className="font-semibold text-indigo-600">{item.type}</span>
                  </div>
                  <p className="text-sm font-bold text-slate-900">{item.name}</p>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    {item.rationale}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* D. Core Competencies Acquisition Guide */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
            <h2 className="text-base font-bold text-slate-900 mb-3">
              📚 핵심 필요 역량 습득 로드맵
            </h2>
            <div className="space-y-3">
              {result.coreCompetencies.map((comp, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-xl border border-slate-200 bg-white flex flex-col md:flex-row md:items-start justify-between gap-3"
                >
                  <div className="md:w-1/3">
                    <span className="text-xs font-bold text-indigo-600">0{idx + 1}.</span>
                    <h3 className="text-sm font-bold text-slate-900 mt-0.5">{comp.area}</h3>
                    <p className="text-xs text-slate-600 mt-1">{comp.description}</p>
                  </div>
                  <div className="md:w-2/3 bg-slate-50 p-3 rounded-lg text-xs text-slate-700">
                    <span className="font-semibold text-slate-900">대학 재학 중 실천법: </span>
                    <span>{comp.actionToAcquire}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* E. Advisor note & Suggested prompts */}
          <div className="bg-indigo-50/50 border border-indigo-200/80 rounded-2xl p-6">
            <p className="text-xs font-bold text-indigo-800 uppercase tracking-wider mb-1">
              멘토의 총평 조언
            </p>
            <p className="text-sm text-slate-800 leading-relaxed font-medium">
              "{result.advisorNote}"
            </p>

            <div className="mt-5 pt-4 border-t border-indigo-200/60">
              <p className="text-xs font-bold text-slate-700 mb-2">
                💬 AI 챗봇에게 바로 물어보기 좋은 후속 질문:
              </p>
              <div className="flex flex-wrap gap-2">
                {result.suggestedPrompts.map((p, i) => (
                  <button
                    key={i}
                    onClick={() => onNavigateToChatWithPrompt(p)}
                    className="px-3 py-1.5 bg-white border border-indigo-200 text-indigo-900 rounded-lg text-xs font-medium hover:bg-indigo-600 hover:text-white transition-colors"
                  >
                    {p} →
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
