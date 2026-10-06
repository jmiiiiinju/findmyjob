import React, { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, RotateCcw, Copy, Check, Bot, User, ArrowRight, CornerDownLeft } from 'lucide-react';
import { marked } from 'marked';
import { ChatMessage, MentorPersonaId, StudentProfile } from '../types';
import { MENTOR_PERSONAS, QUICK_PROMPTS } from '../data/mentorPersonas';

interface ChatViewProps {
  profile: StudentProfile;
  messages: ChatMessage[];
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  onClearChatBackend: () => Promise<void>;
  onOpenProfile: () => void;
  onNavigateTab: (tab: 'chat' | 'recommend' | 'curation' | 'roadmap', params?: any) => void;
  externalPrefillPrompt?: string;
  onClearPrefill?: () => void;
}

export const ChatView: React.FC<ChatViewProps> = ({
  profile,
  messages,
  setMessages,
  onClearChatBackend,
  onOpenProfile,
  onNavigateTab,
  externalPrefillPrompt,
  onClearPrefill,
}) => {
  const [selectedPersona, setSelectedPersona] = useState<MentorPersonaId>('general');
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isStreaming]);

  // Handle external prefill from Curation or Recommendation tabs
  useEffect(() => {
    if (externalPrefillPrompt) {
      setInput(externalPrefillPrompt);
      textareaRef.current?.focus();
      onClearPrefill?.();
    }
  }, [externalPrefillPrompt]);

  const handleSendMessage = async (customText?: string) => {
    const textToSend = (customText || input).trim();
    if (!textToSend || isStreaming) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: textToSend,
      timestamp: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
    };

    const assistantPlaceholderId = `assistant-${Date.now()}`;
    const initialAssistantMessage: ChatMessage = {
      id: assistantPlaceholderId,
      role: 'assistant',
      content: '',
      timestamp: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
      mentorPersona: selectedPersona,
    };

    const updatedMessages = [...messages, userMessage];
    setMessages([...updatedMessages, initialAssistantMessage]);
    setInput('');
    setIsStreaming(true);

    try {
      const response = await fetch('/api/chat/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: updatedMessages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
          studentProfile: profile,
          mentorPersona: selectedPersona,
        }),
      });

      if (!response.ok) {
        throw new Error('응답을 가져오는데 실패했습니다.');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder('utf-8');
      let accumulatedText = '';

      if (reader) {
        let buffer = '';
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed.startsWith('data: ')) {
              const dataStr = trimmed.slice(6);
              if (dataStr === '[DONE]') {
                break;
              }
              try {
                const parsed = JSON.parse(dataStr);
                if (parsed.text) {
                  accumulatedText += parsed.text;
                  setMessages((prev) =>
                    prev.map((msg) =>
                      msg.id === assistantPlaceholderId
                        ? { ...msg, content: accumulatedText }
                        : msg
                    )
                  );
                } else if (parsed.error) {
                  accumulatedText += `\n\n*(안내: ${parsed.error})*`;
                }
              } catch (e) {
                // partial json chunk
              }
            }
          }
        }
      }
    } catch (err: any) {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantPlaceholderId
            ? { ...msg, content: '죄송합니다. 일시적인 연결 지연이 발생했습니다. 다시 질문해 주시겠어요?' }
            : msg
        )
      );
    } finally {
      setIsStreaming(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleResetChat = async () => {
    if (confirm('대화 내용을 초기화하시겠습니까? (서버에 저장된 대화도 함께 초기화됩니다)')) {
      await onClearChatBackend();
    }
  };

  const currentMentor = MENTOR_PERSONAS.find((p) => p.id === selectedPersona) || MENTOR_PERSONAS[0];

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] max-w-5xl mx-auto px-3 sm:px-6 py-4">
      {/* 1. Mentor Persona Selector Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-2.5 mb-3 shadow-xs">
        <div className="flex items-center justify-between mb-2 px-1">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
            <span>멘토 페르소나 선택</span>
            <span className="text-[11px] font-normal text-slate-400">· 질문 목적에 맞춰 변경해보세요</span>
          </div>
          <button
            onClick={onOpenProfile}
            className="text-[11px] text-indigo-600 hover:underline flex items-center gap-1"
          >
            내 프로필: {profile.grade} · {profile.major || '전공 미설정'} {profile.mbti ? `(${profile.mbti})` : ''}
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
          {MENTOR_PERSONAS.map((persona) => {
            const isSelected = selectedPersona === persona.id;
            return (
              <button
                key={persona.id}
                onClick={() => setSelectedPersona(persona.id)}
                className={`p-2 rounded-lg text-left transition-all border ${
                  isSelected
                    ? 'bg-slate-900 border-slate-900 text-white shadow-xs'
                    : 'bg-slate-50 border-slate-200/80 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <span className="text-sm">{persona.avatarText}</span>
                  <span className={`text-xs font-semibold truncate ${isSelected ? 'text-white' : 'text-slate-900'}`}>
                    {persona.name}
                  </span>
                </div>
                <p className={`text-[11px] truncate mt-0.5 ${isSelected ? 'text-slate-300' : 'text-slate-500'}`}>
                  {persona.badge}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Messages Container */}
      <div className="flex-1 overflow-y-auto bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 shadow-xs space-y-5">
        {messages.map((message) => {
          const isUser = message.role === 'user';
          const mentor = message.mentorPersona
            ? MENTOR_PERSONAS.find((p) => p.id === message.mentorPersona) || currentMentor
            : currentMentor;

          return (
            <div
              key={message.id}
              className={`flex gap-3 sm:gap-4 ${isUser ? 'justify-end' : 'justify-start'}`}
            >
              {/* Avatar for Assistant */}
              {!isUser && (
                <div className="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center text-sm shrink-0 shadow-xs mt-1">
                  {mentor.avatarText}
                </div>
              )}

              {/* Message Bubble */}
              <div
                className={`max-w-[85%] sm:max-w-[78%] rounded-2xl px-4 py-3 sm:px-5 sm:py-3.5 leading-relaxed text-sm ${
                  isUser
                    ? 'bg-slate-900 text-white rounded-tr-xs'
                    : 'bg-slate-50 border border-slate-200 text-slate-800 rounded-tl-xs shadow-xs'
                }`}
              >
                {/* Header for assistant message */}
                {!isUser && (
                  <div className="flex items-center justify-between border-b border-slate-200/60 pb-1.5 mb-2 text-xs">
                    <div className="flex items-center gap-1.5 font-medium text-slate-700">
                      <span>{mentor.name}</span>
                      <span className="text-slate-400">·</span>
                      <span className="text-slate-500 text-[11px]">{mentor.role}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-slate-400">{message.timestamp}</span>
                      <button
                        onClick={() => handleCopy(message.id, message.content)}
                        className="text-slate-400 hover:text-slate-600 transition-colors p-0.5"
                        title="답변 복사"
                      >
                        {copiedId === message.id ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {/* Content */}
                {isUser ? (
                  <div className="whitespace-pre-wrap">{message.content}</div>
                ) : (
                  <div
                    className="prose prose-sm max-w-none text-slate-800 prose-headings:font-bold prose-headings:text-slate-900 prose-p:my-1.5 prose-ul:my-1.5 prose-li:my-0.5 prose-pre:bg-slate-900 prose-pre:text-slate-100"
                    dangerouslySetInnerHTML={{
                      __html: marked.parse(message.content || '생각하는 중입니다...'),
                    }}
                  />
                )}
              </div>

              {/* User Avatar */}
              {isUser && (
                <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center text-xs shrink-0 font-bold mt-1 shadow-xs">
                  {profile.mbti ? profile.mbti.slice(0, 2) : '나'}
                </div>
              )}
            </div>
          );
        })}

        {isStreaming && (
          <div className="flex items-center gap-2 text-xs text-slate-400 pl-12">
            <span className="inline-block w-2 h-2 rounded-full bg-indigo-500 animate-ping" />
            <span>{currentMentor.name} 멘토가 답변을 작성하고 있습니다...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* 3. Quick Prompts suggestions */}
      <div className="py-2 overflow-x-auto no-scrollbar flex items-center gap-1.5 shrink-0">
        <span className="text-[11px] font-semibold text-slate-400 whitespace-nowrap px-1">
          추천 질문:
        </span>
        {QUICK_PROMPTS.map((prompt, idx) => (
          <button
            key={idx}
            onClick={() => handleSendMessage(prompt)}
            disabled={isStreaming}
            className="px-2.5 py-1 bg-white border border-slate-200 text-slate-700 hover:border-slate-400 hover:bg-slate-50 text-xs rounded-full whitespace-nowrap transition-colors shrink-0 disabled:opacity-50"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* 4. Chat Input Box */}
      <div className="bg-white rounded-2xl border border-slate-200 p-2 shadow-xs flex flex-col gap-2">
        <div className="flex items-end gap-2">
          <textarea
            ref={textareaRef}
            rows={2}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`${currentMentor.name} 멘토에게 전공 고민, 취업 준비, 스펙 등 진로에 관한 무엇이든 물어보세요... (Shift+Enter 줄바꿈)`}
            className="flex-1 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 border-none focus:outline-hidden resize-none leading-relaxed"
          />
          <div className="flex items-center gap-1 pb-1 pr-1">
            <button
              onClick={handleResetChat}
              title="대화 초기화"
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleSendMessage()}
              disabled={!input.trim() || isStreaming}
              className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold hover:bg-slate-800 disabled:opacity-40 disabled:hover:bg-slate-900 transition-all flex items-center gap-1.5 shadow-xs"
            >
              <span>전송</span>
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Action Link bar */}
        <div className="flex items-center justify-between border-t border-slate-100 pt-1.5 px-2 text-[11px] text-slate-500">
          <div className="flex items-center gap-2">
            <span>더 많은 기능:</span>
            <button
              onClick={() => onNavigateTab('recommend')}
              className="text-indigo-600 hover:underline flex items-center gap-0.5"
            >
              <Sparkles className="w-3 h-3 text-amber-500" />
              MBTI 정밀 추천
            </button>
            <span>·</span>
            <button
              onClick={() => onNavigateTab('curation')}
              className="text-indigo-600 hover:underline"
            >
              인턴/대학원 공고
            </button>
            <span>·</span>
            <button
              onClick={() => onNavigateTab('roadmap')}
              className="text-indigo-600 hover:underline"
            >
              단계별 로드맵
            </button>
          </div>
          <span className="hidden sm:inline text-slate-400">Enter 전송</span>
        </div>
      </div>
    </div>
  );
};
