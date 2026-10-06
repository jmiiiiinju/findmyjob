import { MentorPersona } from '../types';

export const MENTOR_PERSONAS: MentorPersona[] = [
  {
    id: 'general',
    name: '로디 (Rody)',
    role: '종합 진로 코치',
    badge: '따뜻한 길잡이',
    description: '막연한 진로 고민을 체계적인 단계로 풀어주고 방향성을 찾아주는 멘토',
    avatarBg: 'bg-emerald-500 text-white',
    avatarText: '🌱',
  },
  {
    id: 'recruiter',
    name: '민우 팀장',
    role: '현직 채용담당자',
    badge: '서류·면접 현실 조언',
    description: '인사담당자의 실제 평가 기준과 채용 시장의 객관적인 팩트 체크',
    avatarBg: 'bg-blue-600 text-white',
    avatarText: '💼',
  },
  {
    id: 'senior',
    name: '지원 선배',
    role: '3년차 실무자 선배',
    badge: '실전 취준 꿀팁',
    description: '학교 다닐 때 겪었던 시행착오와 진짜 필요한 실무 역량 전수',
    avatarBg: 'bg-indigo-600 text-white',
    avatarText: '🚀',
  },
  {
    id: 'academic',
    name: '박 박사',
    role: '연구·학술 멘토',
    badge: '대학원 & R&D',
    description: '국내외 대학원 진학, 학부 연구생, R&D 연구소 진로 심층 상담',
    avatarBg: 'bg-amber-600 text-white',
    avatarText: '🎓',
  },
];

export const QUICK_PROMPTS = [
  '비전공자인데 IT/개발 직무로 전향하려면 지금 뭘 해야 할까요?',
  '3학년 2학기인데 아직 스펙이 없어요. 현실적인 준비 순서 알려주세요.',
  '마케팅 vs 프로덕트 기획(PM) 중 제 성향에 더 맞는 쪽은 어딜까요?',
  '학부 졸업 후 취업과 대학원 진학 사이에서 깊이 고민 중입니다.',
  '서류에서 탈락하지 않는 포트폴리오 만드는 핵심 비결이 궁금해요.',
  '문과생이 데이터 분석가(DA)가 되려면 어떤 프로젝트를 해야 하나요?',
];
