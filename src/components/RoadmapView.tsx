import React, { useState } from 'react';
import { Map, ArrowRight, CheckCircle2, Circle, Sparkles, MessageSquare, RefreshCw, Copy, Check } from 'lucide-react';
import { CareerRoadmap, StudentProfile } from '../types';
import { POPULAR_KEYWORDS } from '../data/curationData';

interface RoadmapViewProps {
  profile: StudentProfile;
  initialTargetJob?: string;
  savedRoadmaps?: CareerRoadmap[];
  onDeleteRoadmap?: (id: string) => Promise<void>;
  onNavigateToChatWithPrompt: (prompt: string) => void;
}

export const RoadmapView: React.FC<RoadmapViewProps> = ({
  profile,
  initialTargetJob,
  savedRoadmaps = [],
  onDeleteRoadmap,
  onNavigateToChatWithPrompt,
}) => {
  const [targetJob, setTargetJob] = useState(initialTargetJob || profile.targetField || '프로덕트 매니저 (PM)');
  const [currentGrade, setCurrentGrade] = useState(profile.grade || '3학년');
  const [major, setMajor] = useState(profile.major || '경영학과');
  const [currentStatus, setCurrentStatus] = useState('기초 단계부터 체계적으로 준비하고 싶음');

  const [isLoading, setIsLoading] = useState(false);
  const [roadmap, setRoadmap] = useState<CareerRoadmap | null>(null);
  const [completedActions, setCompletedActions] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);

  const handleGenerateRoadmap = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!targetJob) {
      alert('목표 직무를 입력해주세요.');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/career/roadmap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetJob,
          currentGrade,
          major,
          currentStatus,
        }),
      });

      if (!response.ok) {
        throw new Error('로드맵 생성에 실패했습니다.');
      }

      const data: CareerRoadmap = await response.json();
      setRoadmap(data);
      setCompletedActions([]);
    } catch (err: any) {
      alert(err.message || '네트워크 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleAction = (action: string) => {
    if (completedActions.includes(action)) {
      setCompletedActions(completedActions.filter((a) => a !== action));
    } else {
      setCompletedActions([...completedActions, action]);
    }
  };

  const handleCopyRoadmap = () => {
    if (!roadmap) return;
    const text = `[PathFinder 커리어 로드맵] - ${roadmap.targetJob}
${roadmap.executiveSummary}

${roadmap.stages
  .map(
    (s) => `### ${s.stageNumber}단계. ${s.stageTitle} (${s.timeframe})
- 목표: ${s.goalDescription}
- 주요 액션:
${s.keyActions.map((a) => `  * ${a}`).join('\n')}
- 추천 자격증/툴: ${s.recommendedCertsOrTools.join(', ')}
${s.proTip ? `- 멘토 팁: ${s.proTip}` : ''}`
  )
  .join('\n\n')}

포트폴리오 핵심 조언: ${roadmap.portfolioKeyTip}`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-8">
      {/* 1. Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
        <div className="flex items-center gap-2 text-indigo-600 font-bold text-xs mb-1">
          <Map className="w-4 h-4" />
          <span>4단계 맞춤 커리어 로드맵 빌더</span>
        </div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
          목표 직무에 도달하기 위한 대학생 단계별 실행 계획
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          현재 학년과 전공에서 시작해 최종 합격까지 필요한 핵심 역량과 스펙을 체계적으로 설계합니다.
        </p>

        {/* Server Saved Roadmaps Quick Select */}
        {savedRoadmaps && savedRoadmaps.length > 0 && (
          <div className="mt-4 p-3 bg-slate-50 border border-slate-200 rounded-xl">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-700 mb-2">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span>서버에 저장된 로드맵 ({savedRoadmaps.length}개)</span>
              </span>
              <span className="text-[11px] font-normal text-slate-400">클릭하여 불러오기</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {savedRoadmaps.map((s, idx) => (
                <div
                  key={s.id || idx}
                  className="flex items-center bg-white border border-slate-200 rounded-lg text-xs overflow-hidden shadow-2xs hover:border-indigo-400 transition-colors"
                >
                  <button
                    type="button"
                    onClick={() => {
                      setRoadmap(s);
                      setTargetJob(s.targetJob);
                      setCompletedActions([]);
                    }}
                    className="px-2.5 py-1.5 text-left text-slate-800 font-medium hover:text-indigo-600 truncate max-w-[200px]"
                  >
                    {s.targetJob}
                  </button>
                  {onDeleteRoadmap && s.id && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm(`'${s.targetJob}' 로드맵을 삭제하시겠습니까?`)) {
                          onDeleteRoadmap(s.id!);
                        }
                      }}
                      className="px-2 py-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 border-l border-slate-100"
                      title="삭제"
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleGenerateRoadmap} className="mt-5 space-y-4 pt-4 border-t border-slate-100">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                목표 직무
              </label>
              <input
                type="text"
                value={targetJob}
                onChange={(e) => setTargetJob(e.target.value)}
                placeholder="예: 프론트엔드 개발자, PM, 데이터 분석가"
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                현재 학년
              </label>
              <select
                value={currentGrade}
                onChange={(e) => setCurrentGrade(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white focus:outline-hidden focus:border-indigo-500"
              >
                <option value="1학년">1학년</option>
                <option value="2학년">2학년</option>
                <option value="3학년">3학년</option>
                <option value="4학년">4학년</option>
                <option value="졸업유예/취준">졸업유예 / 취준생</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                현재 전공
              </label>
              <input
                type="text"
                value={major}
                onChange={(e) => setMajor(e.target.value)}
                placeholder="예: 컴퓨터공학, 경영학, 생명공학"
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Quick chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
            <span className="text-[11px] text-slate-400 whitespace-nowrap">추천 목표:</span>
            {POPULAR_KEYWORDS.slice(0, 7).map((kw) => (
              <button
                key={kw}
                type="button"
                onClick={() => setTargetJob(kw)}
                className="px-2.5 py-1 text-[11px] bg-slate-100 text-slate-600 rounded-md hover:bg-slate-200 whitespace-nowrap"
              >
                {kw}
              </button>
            ))}
          </div>

          <div className="flex justify-end pt-1">
            <button
              type="submit"
              disabled={isLoading}
              className="px-5 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-colors flex items-center gap-1.5 shadow-xs disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-400" />
                  <span>로드맵을 구성하는 중...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>맞춤 로드맵 생성하기</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* 2. Generated Roadmap Content */}
      {roadmap && (
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* Summary Banner */}
          <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-xs text-amber-400 font-bold uppercase tracking-wider">
                {roadmap.targetJob} 맞춤 가이드
              </span>
              <h2 className="text-xl font-bold mt-1">{roadmap.roadmapTitle}</h2>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed max-w-2xl">
                {roadmap.executiveSummary}
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={handleCopyRoadmap}
                className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-medium transition-colors flex items-center gap-1.5"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? '복사 완료' : '텍스트 복사'}</span>
              </button>
            </div>
          </div>

          {/* 4 Stages Timeline */}
          <div className="space-y-4">
            {roadmap.stages.map((stage) => {
              return (
                <div
                  key={stage.stageNumber}
                  className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs relative overflow-hidden"
                >
                  {/* Stage Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 mb-4 border-b border-slate-100">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-xs">
                        0{stage.stageNumber}
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-slate-900">
                          {stage.stageTitle}
                        </h3>
                        <span className="text-xs text-slate-500">{stage.timeframe}</span>
                      </div>
                    </div>
                    <div className="text-xs text-slate-600 bg-slate-50 px-3 py-1.5 rounded-lg">
                      <span className="font-semibold text-slate-800">단계 목표: </span>
                      <span>{stage.goalDescription}</span>
                    </div>
                  </div>

                  {/* Key Actions Checklist */}
                  <div className="space-y-2 mb-4">
                    <p className="text-xs font-bold text-slate-800">실행 과제 체크리스트:</p>
                    {stage.keyActions.map((action, idx) => {
                      const isDone = completedActions.includes(action);
                      return (
                        <div
                          key={idx}
                          onClick={() => toggleAction(action)}
                          className={`p-2.5 rounded-xl border text-xs flex items-center gap-2.5 cursor-pointer transition-all ${
                            isDone
                              ? 'bg-emerald-50/60 border-emerald-200 text-slate-500 line-through'
                              : 'bg-white border-slate-200/90 text-slate-800 hover:border-indigo-300'
                          }`}
                        >
                          {isDone ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          ) : (
                            <Circle className="w-4 h-4 text-slate-300 shrink-0" />
                          )}
                          <span>{action}</span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Certifications or Tools & ProTip */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs pt-3 border-t border-slate-100">
                    <div className="bg-slate-50 p-3 rounded-xl">
                      <span className="font-bold text-slate-900">추천 툴 / 자격증: </span>
                      <span className="text-slate-700">
                        {stage.recommendedCertsOrTools.join(', ')}
                      </span>
                    </div>
                    {stage.proTip && (
                      <div className="bg-indigo-50/50 p-3 rounded-xl text-indigo-900">
                        <span className="font-bold">💡 멘토 실전 팁: </span>
                        <span>{stage.proTip}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Portfolio & Application Tip Card */}
          <div className="bg-amber-50/60 border border-amber-200 rounded-2xl p-6">
            <h4 className="text-xs font-bold text-amber-900 uppercase tracking-wider mb-1">
              합격을 부르는 포트폴리오 핵심 포인트
            </h4>
            <p className="text-sm text-slate-800 font-medium leading-relaxed">
              {roadmap.portfolioKeyTip}
            </p>

            <div className="mt-4 pt-3 border-t border-amber-200/60 flex justify-end">
              <button
                onClick={() =>
                  onNavigateToChatWithPrompt(
                    `'${roadmap.targetJob}' 목표로 4단계 로드맵을 확인했는데요, 현재 제 상황(${currentGrade}, ${major})에서 당장 이번 달에 시작할 1단계 실천 과제를 구체적인 주차별 스케줄로 짜주세요!`
                  )
                }
                className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-bold hover:bg-slate-800 transition-colors flex items-center gap-1.5"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>AI 멘토와 주차별 세부 계획 상담하기</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
