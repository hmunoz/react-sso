import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from 'react-oidc-context';
import { usePermissions } from '../../hooks/usePermissions';
import { sendAgentPrompt, getAgentHealth, clearAgentMemory, getAgentTools } from '../../api/agentApi';
import { MovieGrid } from '../chat/MovieGrid';
import { type Movie } from '../../api/moviesApi';

interface ChatMessage {
  id: string;
  sender: 'user' | 'agent';
  text: string;
  timestamp: string;
  agentsInvoked?: string[];
  tools?: string[];
  toolsExecuted?: string[];
  fromMemory?: boolean;
}

export const AgentChatView: React.FC = () => {
  const auth = useAuth();
  const { username, groups } = usePermissions();
  const displayName = auth.user?.profile?.name || username;

  const createWelcomeMessage = (name: string, initialTools?: string[]): ChatMessage => ({
    id: `welcome-${Date.now()}`,
    sender: 'agent',
    text: `¡Hola ${name}! Soy el Asistente de Inteligencia Artificial del VideoClub UNRN.\n\nEstoy conectado mediante Model Context Protocol (MCP) a nuestro backend seguro con Keycloak. Puedo consultar el catálogo de películas y el padrón de socios según los permisos de tu cuenta.\n\n¿En qué te puedo ayudar hoy?`,
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    tools: initialTools
  });

  const [conversationId, setConversationId] = useState<string>(() => `session-${Date.now()}`);
  const [messages, setMessages] = useState<ChatMessage[]>(() => [createWelcomeMessage(displayName)]);
  const [availableTools, setAvailableTools] = useState<string[]>([]);

  const [inputPrompt, setInputPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [agentStatus, setAgentStatus] = useState<'UP' | 'DOWN' | 'CHECKING'>('CHECKING');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getAgentHealth()
      .then((res) => {
        if (res.status === 'UP') setAgentStatus('UP');
        else setAgentStatus('DOWN');
      })
      .catch(() => setAgentStatus('DOWN'));
  }, []);

  useEffect(() => {
    const token = auth.user?.access_token;
    if (!token) return;

    getAgentTools(token)
      .then((res) => {
        if (res?.tools && Array.isArray(res.tools)) {
          setAvailableTools(res.tools);
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id.startsWith('welcome-') ? { ...msg, tools: res.tools } : msg
            )
          );
        }
      })
      .catch((err) => {
        console.warn('Could not fetch agent tools dynamically', err);
      });
  }, [auth.user?.access_token]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSendMessage = async (textToSend?: string) => {
    const prompt = (textToSend || inputPrompt).trim();
    if (!prompt || isLoading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: prompt,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputPrompt('');
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const token = auth.user?.access_token;
      const res = await sendAgentPrompt(prompt, token, conversationId);
      if (res.conversationId && res.conversationId !== conversationId) {
        setConversationId(res.conversationId);
      }

      const agentMsg: ChatMessage = {
        id: `agent-${Date.now()}`,
        sender: 'agent',
        text: res.response,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        agentsInvoked: res.agentsInvoked,
        tools: res.toolsAvailable,
        toolsExecuted: res.toolsExecuted,
        fromMemory: res.fromMemory
      };

      if (res.toolsAvailable && res.toolsAvailable.length > 0) {
        setAvailableTools(res.toolsAvailable);
      }

      setMessages((prev) => [...prev, agentMsg]);
    } catch (err: unknown) {
      const errText = err instanceof Error ? err.message : 'Error comunicando con el agente';
      setErrorMessage(errText);

      const errorMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        sender: 'agent',
        text: `⚠️ Ocurrió un error al procesar tu consulta: ${errText}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetChat = async () => {
    if (isLoading) return;
    try {
      if (conversationId) {
        await clearAgentMemory(auth.user?.access_token, conversationId);
      }
    } catch (e) {
      console.warn('Error clearing previous chat memory', e);
    }
    const newSession = `session-${Date.now()}`;
    setConversationId(newSession);
    setMessages([createWelcomeMessage(displayName, availableTools)]);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void handleSendMessage();
    }
  };

  const quickPrompts = [
    '¿Qué películas tienen disponibles actualmente?',
    '¿Tienen alguna película de Matrix en el catálogo?',
    '¿Quiénes son los socios registrados en el videoclub?'
  ];

  const parseGenerativeContent = (rawText: string): { cleanedText: string; movies?: Movie[] } => {
    const moviesFenceRegex = /```(?:json:movies|json)\s*([\s\S]*?)\s*```/;
    const match = rawText.match(moviesFenceRegex);

    if (match) {
      try {
        const parsed = JSON.parse(match[1]);
        if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].title !== undefined) {
          let textWithoutFence = rawText.replace(moviesFenceRegex, '').trim();

          // Strip redundant movie detail bullets if movie cards are rendered
          textWithoutFence = textWithoutFence
            .split('\n')
            .filter((line) => {
              const trimmed = line.trim();
              // Remove redundant movie attribute bullets
              if (/^[-*•]\s*(\*\*)?(título|title|género|genre|precio|price|imagen|image|id|código)\b/i.test(trimmed)) {
                return false;
              }
              // Remove standalone or leading markdown image lines
              if (/^[-*•]?\s*!?\[.*?\]\(.*?\)$/.test(trimmed)) {
                return false;
              }
              return true;
            })
            .join('\n')
            .replace(/\n{3,}/g, '\n\n')
            .trim();

          return {
            cleanedText: textWithoutFence,
            movies: parsed as Movie[],
          };
        }
      } catch {
        // Fallback: leave as plain text
      }
    }

    return { cleanedText: rawText };
  };

  const formatText = (text: string) => {
    return text.split('\n').map((line, idx) => {
      // Fallback: render markdown images if present anywhere in line
      const imgMatch = line.match(/!\[(.*?)\]\((.*?)\)/);
      if (imgMatch) {
        const alt = imgMatch[1];
        const src = imgMatch[2];
        const textBefore = line.slice(0, imgMatch.index).replace(/^[-*•]\s*(\*\*)?.*?:?(\*\*)?\s*/, '').trim();
        return (
          <span key={idx} style={{ display: 'block', margin: '0.45rem 0' }}>
            {textBefore && <span style={{ display: 'block', marginBottom: '0.25rem' }}>{textBefore}</span>}
            <img
              src={src}
              alt={alt}
              style={{
                maxWidth: '180px',
                maxHeight: '260px',
                borderRadius: '8px',
                border: '1px solid #e2e8f0',
                display: 'block',
                objectFit: 'cover',
                boxShadow: '0 2px 4px rgba(0,0,0,0.08)'
              }}
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          </span>
        );
      }

      // Bold rendering **text**
      const parts = line.split(/(\*\*.*?\*\*)/g);
      return (
        <span key={idx} style={{ display: 'block', minHeight: line === '' ? '0.75rem' : 'auto' }}>
          {parts.map((part, pIdx) => {
            if (part.startsWith('**') && part.endsWith('**')) {
              return <strong key={pIdx}>{part.slice(2, -2)}</strong>;
            }
            return part;
          })}
        </span>
      );
    });
  };

  return (
    <div style={{ maxWidth: '950px', margin: '0 auto', display: 'flex', flexDirection: 'column', height: 'calc(100vh - 160px)' }}>
      {/* Header card */}
      <div style={{
        backgroundColor: '#ffffff',
        padding: '1rem 1.5rem',
        borderRadius: '10px 10px 0 0',
        border: '1px solid #e2e8f0',
        borderBottom: 'none',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{
            fontSize: '1.75rem',
            backgroundColor: '#ebf8ff',
            width: '45px',
            height: '45px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '10px',
            border: '1px solid #bee3f8'
          }}>
            🤖
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, color: '#2d3748' }}>
              Asistente AI VideoClub
            </h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.2rem', fontSize: '0.8rem', color: '#718096' }}>
              <span>Spring AI 2.0 + MCP Server</span>
              <span>•</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <span style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: agentStatus === 'UP' ? '#38a169' : '#e53e3e',
                  display: 'inline-block'
                }} />
                {agentStatus === 'UP' ? 'En línea (:9500 Gateway)' : 'Desconectado'}
              </span>
            </div>
          </div>
        </div>

        {/* User Identity Chip */}
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '0.75rem', color: '#718096' }}>Sesión autenticada</div>
          <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center', justifyContent: 'flex-end', marginTop: '0.15rem' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#2b6cb0' }}>{username}</span>
            {groups.map((g) => (
              <span key={g} style={{
                fontSize: '0.65rem',
                padding: '0.1rem 0.4rem',
                backgroundColor: g === 'administrador' ? '#fed7d7' : '#c3dafe',
                color: g === 'administrador' ? '#9b2c2c' : '#2b6cb0',
                borderRadius: '4px',
                fontWeight: 700
              }}>
                {g}
              </span>
            ))}
          </div>
          <button
            onClick={() => void handleResetChat()}
            disabled={isLoading}
            title="Reiniciar historial y memoria del chat"
            style={{
              marginTop: '0.35rem',
              padding: '0.2rem 0.55rem',
              backgroundColor: '#edf2f7',
              color: '#4a5568',
              border: '1px solid #cbd5e0',
              borderRadius: '6px',
              fontSize: '0.72rem',
              fontWeight: 600,
              cursor: isLoading ? 'not-allowed' : 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.25rem'
            }}
          >
            🔄 <span>Nueva conversación</span>
          </button>
        </div>
      </div>

      {/* Messages area */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        backgroundColor: '#f7fafc',
        border: '1px solid #e2e8f0',
        padding: '1.25rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem'
      }}>
        {errorMessage && (
          <div style={{
            backgroundColor: '#fff5f5',
            color: '#c53030',
            border: '1px solid #feb2b2',
            padding: '0.6rem 0.9rem',
            borderRadius: '6px',
            fontSize: '0.85rem'
          }}>
            <strong>Aviso:</strong> {errorMessage}
          </div>
        )}
        {messages.map((msg) => {
          const isUser = msg.sender === 'user';
          const { cleanedText, movies } = isUser
            ? { cleanedText: msg.text, movies: undefined }
            : parseGenerativeContent(msg.text);

          const hasMovies = !isUser && Boolean(movies && movies.length > 0);

          return (
            <div
              key={msg.id}
              style={{
                display: 'flex',
                justifyContent: isUser ? 'flex-end' : 'flex-start',
                alignItems: 'flex-start',
                gap: '0.5rem'
              }}
            >
              {!isUser && (
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  backgroundColor: '#3182ce',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1rem',
                  flexShrink: 0
                }}>
                  🤖
                </div>
              )}

              <div style={{
                maxWidth: hasMovies ? '88%' : '78%',
                backgroundColor: isUser ? '#3182ce' : '#ffffff',
                color: isUser ? '#ffffff' : '#2d3748',
                padding: '0.85rem 1.15rem',
                borderRadius: isUser ? '16px 16px 2px 16px' : '16px 16px 16px 2px',
                boxShadow: '0 1px 2px rgba(0,0,0,0.06)',
                border: isUser ? 'none' : '1px solid #e2e8f0',
                lineHeight: 1.5,
                fontSize: '0.92rem'
              }}>
                {cleanedText && <div>{formatText(cleanedText)}</div>}

                {hasMovies && movies && (
                  <MovieGrid movies={movies} />
                )}

                {!isUser && msg.agentsInvoked && msg.agentsInvoked.length > 0 && (
                  <div style={{
                    marginTop: '0.65rem',
                    padding: '0.35rem 0.65rem',
                    backgroundColor: '#ebf8ff',
                    border: '1px solid #bee3f8',
                    borderRadius: '6px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    fontSize: '0.75rem',
                    color: '#2b6cb0'
                  }}>
                    <span>🤖 <strong>Sub-agentes convocados:</strong></span>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                      {msg.agentsInvoked.map((agent) => (
                        <span key={agent} style={{
                          backgroundColor: '#e6f6ff',
                          border: '1px solid #90cdf4',
                          borderRadius: '4px',
                          padding: '0.1rem 0.4rem',
                          fontSize: '0.72rem',
                          fontWeight: 600
                        }}>
                          {agent}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {!isUser && msg.toolsExecuted && msg.toolsExecuted.length > 0 && (
                  <div style={{
                    marginTop: '0.65rem',
                    padding: '0.4rem 0.65rem',
                    backgroundColor: '#f0fff4',
                    border: '1px solid #c6f6d5',
                    borderRadius: '6px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    fontSize: '0.75rem',
                    color: '#22543d'
                  }}>
                    <span>🛠️ <strong>Herramientas ejecutadas:</strong></span>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                      {msg.toolsExecuted.map((tool) => (
                        <code key={tool} style={{
                          backgroundColor: '#e6fffa',
                          border: '1px solid #b2f5ea',
                          borderRadius: '4px',
                          padding: '0.1rem 0.4rem',
                          fontFamily: 'monospace',
                          fontSize: '0.72rem',
                          color: '#234e52',
                          fontWeight: 600
                        }}>
                          {tool}
                        </code>
                      ))}
                    </div>
                  </div>
                )}

                {!isUser && msg.fromMemory && (
                  <div style={{
                    marginTop: '0.65rem',
                    padding: '0.4rem 0.65rem',
                    backgroundColor: '#faf5ff',
                    border: '1px solid #e9d8fd',
                    borderRadius: '6px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    fontSize: '0.75rem',
                    color: '#553c9e'
                  }}>
                    <span>🧠 <strong>Origen:</strong></span>
                    <span style={{
                      backgroundColor: '#f3e8ff',
                      border: '1px solid #d6bcfa',
                      borderRadius: '4px',
                      padding: '0.1rem 0.4rem',
                      fontSize: '0.72rem',
                      fontWeight: 600,
                      color: '#44337a'
                    }}>
                      Memoria conversacional
                    </span>
                  </div>
                )}

                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginTop: '0.5rem',
                  paddingTop: '0.35rem',
                  borderTop: isUser ? '1px solid rgba(255,255,255,0.2)' : '1px solid #edf2f7',
                  fontSize: '0.7rem',
                  color: isUser ? 'rgba(255,255,255,0.8)' : '#a0aec0'
                }}>
                  <span>{msg.timestamp}</span>
                  {!isUser && msg.tools && msg.tools.length > 0 && (
                    <span style={{ fontSize: '0.68rem', color: '#718096' }}>
                      ⚡ MCP Tools: {msg.tools.length} disponibles
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {isLoading && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: '#718096', fontSize: '0.85rem' }}>
            <div style={{
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              backgroundColor: '#e2e8f0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              ⏳
            </div>
            <span>El Asistente está analizando tu consulta y ejecutando herramientas MCP...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Quick Prompts */}
      <div style={{
        backgroundColor: '#edf2f7',
        borderLeft: '1px solid #e2e8f0',
        borderRight: '1px solid #e2e8f0',
        padding: '0.5rem 1.25rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        overflowX: 'auto'
      }}>
        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#4a5568', whiteSpace: 'nowrap' }}>
          💡 Sugerencias:
        </span>
        {quickPrompts.map((qp, i) => (
          <button
            key={i}
            onClick={() => void handleSendMessage(qp)}
            disabled={isLoading}
            style={{
              padding: '0.25rem 0.6rem',
              backgroundColor: '#ffffff',
              color: '#3182ce',
              border: '1px solid #cbd5e0',
              borderRadius: '12px',
              fontSize: '0.75rem',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              whiteSpace: 'nowrap',
              transition: 'background-color 0.15s'
            }}
          >
            {qp}
          </button>
        ))}
      </div>

      {/* Input controls */}
      <div style={{
        backgroundColor: '#ffffff',
        padding: '1rem 1.25rem',
        borderRadius: '0 0 10px 10px',
        border: '1px solid #e2e8f0',
        borderTop: 'none',
        display: 'flex',
        gap: '0.75rem',
        boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
      }}>
        <input
          type="text"
          value={inputPrompt}
          onChange={(e) => setInputPrompt(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Escribí tu consulta sobre películas o socios aquí..."
          disabled={isLoading}
          style={{
            flex: 1,
            padding: '0.75rem 1rem',
            border: '1px solid #cbd5e0',
            borderRadius: '8px',
            fontSize: '0.95rem',
            outline: 'none'
          }}
        />
        <button
          onClick={() => void handleSendMessage()}
          disabled={!inputPrompt.trim() || isLoading}
          style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: !inputPrompt.trim() || isLoading ? '#a0aec0' : '#3182ce',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '0.95rem',
            fontWeight: 600,
            cursor: !inputPrompt.trim() || isLoading ? 'not-allowed' : 'pointer',
            transition: 'background-color 0.15s ease'
          }}
        >
          {isLoading ? 'Consultando...' : 'Enviar'}
        </button>
      </div>
    </div>
  );
};
