import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';
import {
  getDatabase,
  updateProfile,
  addChatMessage,
  clearChat,
  toggleBookmark,
  updateNotificationSettings,
  markAllNotificationsRead,
  clearNotifications,
  saveRoadmap,
  deleteRoadmap,
  saveRecommendation,
} from './server/storage.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: '10mb' }));

// Shared Gemini client
const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.warn('[Server] WARNING: GEMINI_API_KEY environment variable is not set. Gemini API calls may fail.');
}

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Mentor personas instructions
const PERSONA_PROMPTS: Record<string, string> = {
  general: `당신은 대학생 진로 종합 멘토 '로디(Rody)'입니다.
따뜻하고 공감 능력이 뛰어나며, 대학생의 눈높이에서 체계적인 진로 설계를 돕습니다.
- 학생의 현재 학년, 전공, MBTI 성향, 흥미, 두려움을 경청하고 용기를 줍니다.
- 막연한 고민을 구체적인 질문으로 좁혀주고, 사기업, 공기업, 스타트업, 대학원 등 다양한 경로를 균형 있게 안내합니다.
- 조언 후에는 항상 학생이 스스로 생각해볼 수 있는 가벼운 다음 질문이나 1주일 실천 과제를 1개 제안해주세요.`,

  recruiter: `당신은 대기업 및 IT 유니콘 기업 출신의 현직 채용담당자 '민우 팀장'입니다.
날카롭고 현실적인 시각으로 채용 시장의 트렌드와 인사담당자의 평가 기준을 설명합니다.
- 거품 없는 현실적인 조언과 함께, 실제 서류/면접에서 평가받는 핵심 역량(직무 연관성, 문제해결 경험, 정량적 성과)을 짚어줍니다.
- 단순 스펙 나열보다는 '스토리가 담긴 직무 경험'을 어떻게 만들지 구체적인 가이드를 제공합니다.
- 말투는 프로페셔널하고 정중하되 직설적이고 명확합니다.`,

  senior: `당신은 대학을 졸업하고 빠르게 역량을 쌓아 성장한 3~4년차 실무자 선배 '지원'입니다.
친근하고 생생한 경험담을 바탕으로 현업 실무의 진짜 모습과 취준 꿀팁을 전수합니다.
- 전공과 다른 길을 가거나 방황했던 경험에 깊이 공감하며, "지금 시기에 진짜 도움 되는 것 vs 시간 낭비인 것"을 필터링해줍니다.
- 포트폴리오 정리법, 커피챗 요청법, 실무 툴(노션, 피그마, 깃허브, 데이터 분석 툴) 활용법 등 실용적인 팁을 가르쳐줍니다.
- 말투는 편안하고 든든한 학교 선배처럼 친절합니다.`,

  academic: `당신은 대학원 석·박사 과정을 거쳐 첨단 R&D 연구소에 재직 중인 학술/연구 멘토 '박 박사'입니다.
학문적 탐구, 연구원 커리어, 국내외 대학원 진학, 전문 자격증 진로에 특화된 조언을 제공합니다.
- 학부 연구생 경험, 논문 읽는 법, 지도교수님 컨택 노하우, 석/박사 진학의 장단점과 현실을 심도 있게 조언합니다.
- 장기적인 커리어 로드맵과 전문성 심화 경로를 차분하고 논리적으로 설명합니다.`
};

// ==========================================
// 1. Data Persistence Endpoints (Backend Server)
// ==========================================

// Get all persisted database state
app.get('/api/data', async (_req: Request, res: Response) => {
  try {
    const data = await getDatabase();
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message || '데이터 조회 실패' });
  }
});

// Update Student Profile
app.post('/api/profile', async (req: Request, res: Response) => {
  try {
    const updated = await updateProfile(req.body);
    res.json({ success: true, profile: updated });
  } catch (err: any) {
    res.status(500).json({ error: err.message || '프로필 저장 실패' });
  }
});

// Toggle Curation Bookmark
app.post('/api/bookmarks/toggle', async (req: Request, res: Response) => {
  try {
    const { itemId } = req.body;
    if (!itemId) {
      res.status(400).json({ error: 'itemId가 필요합니다.' });
      return;
    }
    const bookmarkedIds = await toggleBookmark(itemId);
    res.json({ success: true, bookmarkedIds });
  } catch (err: any) {
    res.status(500).json({ error: err.message || '북마크 업데이트 실패' });
  }
});

// Clear Chat Messages
app.post('/api/chat/clear', async (_req: Request, res: Response) => {
  try {
    const messages = await clearChat();
    res.json({ success: true, chatMessages: messages });
  } catch (err: any) {
    res.status(500).json({ error: err.message || '대화 초기화 실패' });
  }
});

// Update Notification Settings
app.post('/api/notifications/settings', async (req: Request, res: Response) => {
  try {
    const settings = await updateNotificationSettings(req.body);
    res.json({ success: true, notificationSettings: settings });
  } catch (err: any) {
    res.status(500).json({ error: err.message || '알림 설정 저장 실패' });
  }
});

// Mark All Notifications Read
app.post('/api/notifications/read-all', async (_req: Request, res: Response) => {
  try {
    const notifications = await markAllNotificationsRead();
    res.json({ success: true, notifications });
  } catch (err: any) {
    res.status(500).json({ error: err.message || '알림 읽음 처리 실패' });
  }
});

// Clear Notifications
app.post('/api/notifications/clear', async (_req: Request, res: Response) => {
  try {
    const notifications = await clearNotifications();
    res.json({ success: true, notifications });
  } catch (err: any) {
    res.status(500).json({ error: err.message || '알림 삭제 실패' });
  }
});

// Save Roadmap
app.post('/api/roadmaps', async (req: Request, res: Response) => {
  try {
    const saved = await saveRoadmap(req.body);
    res.json({ success: true, savedRoadmaps: saved });
  } catch (err: any) {
    res.status(500).json({ error: err.message || '로드맵 저장 실패' });
  }
});

// Delete Roadmap
app.delete('/api/roadmaps/:id', async (req: Request, res: Response) => {
  try {
    const saved = await deleteRoadmap(req.params.id);
    res.json({ success: true, savedRoadmaps: saved });
  } catch (err: any) {
    res.status(500).json({ error: err.message || '로드맵 삭제 실패' });
  }
});

// Save Recommendation
app.post('/api/recommendations/save', async (req: Request, res: Response) => {
  try {
    const saved = await saveRecommendation(req.body);
    res.json({ success: true, savedRecommendations: saved });
  } catch (err: any) {
    res.status(500).json({ error: err.message || '추천 결과 저장 실패' });
  }
});

// ==========================================
// 2. Streaming Chat Endpoint (with auto-persistence)
// ==========================================
app.post('/api/chat/stream', async (req: Request, res: Response) => {
  try {
    const { messages, studentProfile, mentorPersona = 'general' } = req.body;

    if (!Array.isArray(messages) || messages.length === 0) {
      res.status(400).json({ error: '대화 내용(messages)이 올바르지 않습니다.' });
      return;
    }

    const lastUserMessage = messages[messages.length - 1];
    // Persist user message to backend store
    if (lastUserMessage && lastUserMessage.role === 'user') {
      await addChatMessage({
        id: lastUserMessage.id || `user-${Date.now()}`,
        role: 'user',
        content: lastUserMessage.content,
        timestamp: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
      });
    }

    const personaPrompt = PERSONA_PROMPTS[mentorPersona] || PERSONA_PROMPTS.general;

    let profileContext = '';
    if (studentProfile) {
      profileContext = `
[학생 프로필 정보]
- 학년/상태: ${studentProfile.grade || '미입력'}
- 전공/계열: ${studentProfile.major || '미입력'}
- MBTI: ${studentProfile.mbti || '미입력'}
- 관심 분야/직무 키워드: ${studentProfile.targetField || '미정/탐색 중'}
- 현재 가장 큰 고민: ${studentProfile.currentConcerns || '미입력'}
- 희망 활동/키워드: ${(studentProfile.interests || []).join(', ') || '없음'}
- 추천 진로 분석 결과: ${studentProfile.recommendationSummary || '없음'}
`;
    }

    const systemInstruction = `${personaPrompt}

${profileContext}

[답변 작성 가이드라인]
1. 답변은 한국어로 작성하며, 대학생의 눈높이에 맞춰 이해하기 쉽고 명확하게 구성하세요.
2. 마크다운 문법(제목, 볼드체, 불릿포인트, 번호 목록)을 적극 활용하여 가독성을 극대화하세요.
3. 추상적인 조언에 그치지 말고, 실제 학점 관리, 추천 대외활동/공모전 유형, 포트폴리오 방향, 자격증, 인턴십 지원 전략 등 구체적인 액션 아이템을 제시하세요.
4. 필요시 학생이 바로 시도해볼 수 있는 '이번 주 실천 과제(Action Item)'를 마지막에 깔끔하게 요약해주세요.`;

    const contents = messages.map((m: { role: string; content: string }) => ({
      role: m.role === 'assistant' || m.role === 'model' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();

    const responseStream = await ai.models.generateContentStream({
      model: 'gemini-3.8-flash',
      contents,
      config: {
        systemInstruction,
        temperature: 0.7,
      },
    });

    let fullAssistantResponse = '';

    for await (const chunk of responseStream) {
      const text = chunk.text;
      if (text) {
        fullAssistantResponse += text;
        res.write(`data: ${JSON.stringify({ text })}\n\n`);
      }
    }

    // Persist assistant response to backend store
    if (fullAssistantResponse) {
      await addChatMessage({
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: fullAssistantResponse,
        timestamp: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
        mentorPersona,
      });
    }

    res.write('data: [DONE]\n\n');
    res.end();
  } catch (error: any) {
    console.error('[API /api/chat/stream Error]:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: error.message || 'AI 응답 생성 중 오류가 발생했습니다.' });
    } else {
      res.write(`data: ${JSON.stringify({ error: error.message || '스트리밍 중단' })}\n\n`);
      res.end();
    }
  }
});

// ==========================================
// 3. AI-Powered Career Recommendation System (MBTI + Keywords)
// ==========================================
app.post('/api/career/recommend-mbti', async (req: Request, res: Response) => {
  try {
    const { mbti, major, targetKeywords, interests, grade } = req.body;

    if (!mbti || !targetKeywords) {
      res.status(400).json({ error: 'MBTI와 관심 직무/키워드를 입력해주세요.' });
      return;
    }

    const prompt = `
대학생을 위한 심층 AI 진로 추천 시스템 요청:
- MBTI 유형: ${mbti}
- 현재 전공: ${major || '비전공/자율전공'}
- 관심 직무 키워드: ${targetKeywords}
- 세부 관심 분야: ${Array.isArray(interests) ? interests.join(', ') : interests || '다양한 직무 탐색 중'}
- 학년: ${grade || '대학 재학생'}

학생의 MBTI 업무 성향, 전공과의 시너지 또는 전향 가능성, 관심 키워드를 융합 분석하여:
1. MBTI 기반 업무 스타일 및 강점 분석
2. 추천 직업 3가지 (적합도 % 추정, 상세 업무, 왜 어울리는지, 시장 전망 및 초봉 수준, 필수 하드스킬/소프트스킬, 추천 자격증)
3. 추천 학과/연계 전공 (복수전공/부전공 또는 대학원 세부 연구실 트랙)
4. 핵심 필요 역량 로드맵 (Hard Skill, Soft Skill, 습득 방법)
5. 멘토 조언 한마디 및 챗봇에게 바로 물어볼 수 있는 맞춤 추천 질문 4가지
를 구조화된 JSON으로 생성해주세요.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction: '대학생 커리어 개발 전문 수석 컨설턴트로서 MBTI 성격 유형론과 최신 채용 시장 트렌드를 접목해 정확하고 유익한 진로 추천 데이터를 반환합니다.',
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            mbtiAnalysis: {
              type: Type.OBJECT,
              properties: {
                type: { type: Type.STRING },
                workStyle: { type: Type.STRING },
                coreStrengths: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                },
                potentialBlindspots: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                },
              },
              required: ['type', 'workStyle', 'coreStrengths', 'potentialBlindspots'],
            },
            recommendedJobs: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  category: { type: Type.STRING },
                  fitScore: { type: Type.INTEGER },
                  oneLineDescription: { type: Type.STRING },
                  whyFit: { type: Type.STRING },
                  marketOutlook: { type: Type.STRING },
                  salaryInsight: { type: Type.STRING },
                  hardSkills: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                  },
                  softSkills: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                  },
                  certifications: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                  },
                },
                required: ['title', 'category', 'fitScore', 'oneLineDescription', 'whyFit', 'marketOutlook', 'hardSkills', 'softSkills'],
              },
            },
            recommendedMajorsOrMinors: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  type: { type: Type.STRING },
                  rationale: { type: Type.STRING },
                },
                required: ['name', 'type', 'rationale'],
              },
            },
            coreCompetencies: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  area: { type: Type.STRING },
                  description: { type: Type.STRING },
                  actionToAcquire: { type: Type.STRING },
                },
                required: ['area', 'description', 'actionToAcquire'],
              },
            },
            advisorNote: { type: Type.STRING },
            suggestedPrompts: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
          },
          required: ['mbtiAnalysis', 'recommendedJobs', 'recommendedMajorsOrMinors', 'coreCompetencies', 'advisorNote', 'suggestedPrompts'],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    // Automatically persist to backend recommendation history
    await saveRecommendation(parsed);

    res.json(parsed);
  } catch (error: any) {
    console.error('[API /api/career/recommend-mbti Error]:', error);
    res.status(500).json({ error: error.message || 'AI 진로 추천 중 오류가 발생했습니다.' });
  }
});

// ==========================================
// 4. Structured Career Roadmap Generator
// ==========================================
app.post('/api/career/roadmap', async (req: Request, res: Response) => {
  try {
    const { targetJob, currentGrade, major, currentStatus } = req.body;

    if (!targetJob) {
      res.status(400).json({ error: '목표 직무(targetJob)가 필요합니다.' });
      return;
    }

    const prompt = `
대학생을 위한 맞춤형 단계별 커리어 로드맵을 작성해주세요.
- 목표 직무: ${targetJob}
- 현재 학년: ${currentGrade || '2~3학년'}
- 전공: ${major || '비전공/자율전공'}
- 현재 준비 상태 및 고민: ${currentStatus || '기초 단계부터 준비 희망'}

이 학생이 목표 직무에 도달하기 위한 4단계 실행 로드맵(기초 다지기 -> 역량 심화 -> 실전 경험 및 포트폴리오 -> 최종 취업 및 면접)을 구체적인 액션 플랜과 함께 JSON으로 생성해주세요.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction: '대학생 취업 진로 전문 컨설턴트로서 실질적이고 검증된 커리어 로드맵 데이터를 생성합니다.',
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            roadmapTitle: { type: Type.STRING },
            targetJob: { type: Type.STRING },
            executiveSummary: { type: Type.STRING },
            stages: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  stageNumber: { type: Type.INTEGER },
                  stageTitle: { type: Type.STRING },
                  timeframe: { type: Type.STRING },
                  goalDescription: { type: Type.STRING },
                  keyActions: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                  },
                  recommendedCertsOrTools: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                  },
                  proTip: { type: Type.STRING },
                },
                required: ['stageNumber', 'stageTitle', 'timeframe', 'goalDescription', 'keyActions', 'recommendedCertsOrTools'],
              },
            },
            portfolioKeyTip: { type: Type.STRING },
          },
          required: ['roadmapTitle', 'targetJob', 'executiveSummary', 'stages', 'portfolioKeyTip'],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    // Save to backend database
    await saveRoadmap(parsed);

    res.json(parsed);
  } catch (error: any) {
    console.error('[API /api/career/roadmap Error]:', error);
    res.status(500).json({ error: error.message || '로드맵 생성 중 오류가 발생했습니다.' });
  }
});

// ==========================================
// 5. Curation AI Insights & Fit Check
// ==========================================
app.post('/api/curation/analyze-fit', async (req: Request, res: Response) => {
  try {
    const { item, userProfile } = req.body;
    if (!item) {
      res.status(400).json({ error: '공고/프로그램 정보가 누락되었습니다.' });
      return;
    }

    const prompt = `
대학생이 지원을 고려 중인 공고/프로그램 정보:
제목: ${item.title}
기관/기업: ${item.organization}
구분: ${item.category} (${item.subCategory})
요약/내용: ${item.description}
주요 요구역량/자격요건: ${(item.requirements || []).join(', ')}

학생 프로필:
전공: ${userProfile?.major || '미입력'}
학년: ${userProfile?.grade || '미입력'}
MBTI: ${userProfile?.mbti || '미입력'}
관심분야: ${userProfile?.targetField || '미입력'}

학생의 입장에서 다음을 분석해주세요:
1. 적합도 평가 (상/중/하 및 이유)
2. 지금 시점에 바로 준비해야 할 3가지 핵심 행동
3. 자기소개서/서류 준비 시 어필할 수 있는 포인트
4. 이 공고 지원 전 AI 멘토에게 물어볼 추천 질문 2가지`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction: '대학생 취업/진학 코치로서 공고 분석과 맞춤 지원 전략을 제시합니다.',
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            fitLevel: { type: Type.STRING },
            fitEvaluation: { type: Type.STRING },
            actionSteps: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            applicationTip: { type: Type.STRING },
            suggestedChatQuestions: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
          },
          required: ['fitLevel', 'fitEvaluation', 'actionSteps', 'applicationTip', 'suggestedChatQuestions'],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    res.json(parsed);
  } catch (error: any) {
    console.error('[API /api/curation/analyze-fit Error]:', error);
    res.status(500).json({ error: error.message || '공고 분석 중 오류가 발생했습니다.' });
  }
});

// Health check
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', service: 'PathFinder AI Career Mentoring with Backend Persistence' });
});

// Development vs Production serving
async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[PathFinder Server] Running on http://localhost:${PORT} (${isProduction ? 'production' : 'development'})`);
  });
}

startServer().catch((err) => {
  console.error('[Fatal Server Startup Error]:', err);
  process.exit(1);
});
