import { apiRequest, API_BASE_URL } from './client';
import { type Movie } from './moviesApi';

/**
 * Structured data the agent extracted and validated server-side, shipped beside the prose instead
 * of embedded in it. `kind` is the discriminator; a new domain is a new kind, not a new regex.
 */
export interface UiArtifact {
  kind: string;
  items: unknown[];
}

export interface MoviesArtifact extends UiArtifact {
  kind: 'movies';
  items: Movie[];
}

export function isMoviesArtifact(artifact: UiArtifact): artifact is MoviesArtifact {
  return artifact.kind === 'movies';
}

/** Collects the movie cards of a turn, across however many blocks the agent produced. */
export function moviesFrom(artifacts?: UiArtifact[]): Movie[] {
  return (artifacts ?? []).filter(isMoviesArtifact).flatMap((a) => a.items);
}

export interface ChatResponse {
  prompt: string;
  conversationId?: string;
  response: string;
  agentsInvoked?: string[];
  toolsExecuted?: string[];
  toolsDenied?: string[];
  toolsAvailable: string[];
  fromMemory?: boolean;
  artifacts?: UiArtifact[];
}

export interface AgentHealthResponse {
  status: string;
  agent: string;
}

export async function sendAgentPrompt(prompt: string, token?: string, conversationId?: string): Promise<ChatResponse> {
  return apiRequest<ChatResponse>(
    '/api/agent/chat',
    {
      method: 'POST',
      body: JSON.stringify({ prompt, conversationId })
    },
    token
  );
}

export interface AgentStreamStatus {
  agent?: string;
  message?: string;
}

export interface AgentStreamDone {
  conversationId?: string;
  agentsInvoked?: string[];
  toolsExecuted?: string[];
  toolsDenied?: string[];
  toolsAvailable?: string[];
  fromMemory?: boolean;
}

export interface AgentStreamCallbacks {
  onStatus?: (status: AgentStreamStatus) => void;
  onDelta?: (deltaText: string) => void;
  onArtifact?: (artifacts: UiArtifact[]) => void;
  onDone?: (done: AgentStreamDone) => void;
  onError?: (error: Error) => void;
}

function parseAndDispatchSseBlock(rawBlock: string, callbacks: AgentStreamCallbacks) {
  const lines = rawBlock.split(/\r?\n/);
  let eventName = 'message';
  let dataStr = '';

  for (const line of lines) {
    if (line.startsWith('event:')) {
      eventName = line.slice(6).trim();
    } else if (line.startsWith('data:')) {
      const val = line.slice(5).trim();
      dataStr += (dataStr ? '\n' : '') + val;
    }
  }

  if (!dataStr) return;

  try {
    const parsed = JSON.parse(dataStr);
    const eventType = parsed.event || eventName;

    switch (eventType) {
      case 'status':
        callbacks.onStatus?.({ agent: parsed.agent, message: parsed.message });
        break;
      case 'delta':
        if (typeof parsed.text === 'string') {
          callbacks.onDelta?.(parsed.text);
        }
        break;
      case 'artifact':
        if (Array.isArray(parsed.artifacts)) {
          callbacks.onArtifact?.(parsed.artifacts);
        }
        break;
      case 'done':
        callbacks.onDone?.({
          conversationId: parsed.conversationId,
          agentsInvoked: parsed.agentsInvoked,
          toolsExecuted: parsed.toolsExecuted,
          toolsDenied: parsed.toolsDenied,
          toolsAvailable: parsed.toolsAvailable,
          fromMemory: parsed.fromMemory
        });
        break;
      case 'error':
        callbacks.onError?.(new Error(parsed.message || parsed.error || 'Error en el stream del asistente'));
        break;
      default:
        if (typeof parsed.text === 'string') {
          callbacks.onDelta?.(parsed.text);
        }
    }
  } catch (err) {
    console.warn('Failed to parse SSE event data:', dataStr, err);
  }
}

export async function streamAgentPrompt(
  prompt: string,
  token: string | undefined,
  conversationId: string | undefined,
  callbacks: AgentStreamCallbacks,
  signal?: AbortSignal
): Promise<void> {
  const url = `${API_BASE_URL}/api/agent/chat/stream`;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept': 'text/event-stream'
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify({ prompt, conversationId }),
    signal
  });

  if (!response.ok) {
    let errorDetail = response.statusText;
    try {
      const errorBody = await response.json();
      errorDetail = errorBody.message || errorBody.error || errorDetail;
    } catch {
      // ignore
    }
    const err = new Error(`Error en el stream del agente (${response.status}): ${errorDetail}`);
    callbacks.onError?.(err);
    throw err;
  }

  const reader = response.body?.getReader();
  if (!reader) {
    const err = new Error('No se pudo inicializar la lectura del stream (response.body is null)');
    callbacks.onError?.(err);
    throw err;
  }

  const decoder = new TextDecoder('utf-8');
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      let boundary = buffer.indexOf('\n\n');
      while (boundary !== -1) {
        const rawBlock = buffer.slice(0, boundary).trim();
        buffer = buffer.slice(boundary + 2);

        if (rawBlock) {
          parseAndDispatchSseBlock(rawBlock, callbacks);
        }
        boundary = buffer.indexOf('\n\n');
      }
    }

    const remaining = buffer.trim();
    if (remaining) {
      parseAndDispatchSseBlock(remaining, callbacks);
    }
  } catch (error: unknown) {
    if (signal?.aborted) {
      return;
    }
    const err = error instanceof Error ? error : new Error(String(error));
    callbacks.onError?.(err);
    throw err;
  }
}

export async function clearAgentMemory(token?: string, conversationId?: string): Promise<{ status: string; message: string }> {
  const query = conversationId ? `?conversationId=${encodeURIComponent(conversationId)}` : '';
  return apiRequest<{ status: string; message: string }>(
    `/api/agent/chat/memory${query}`,
    { method: 'DELETE' },
    token
  );
}

export async function getAgentHealth(): Promise<AgentHealthResponse> {
  return apiRequest<AgentHealthResponse>('/api/agent/health');
}

export interface AgentToolsResponse {
  count: number;
  tools: string[];
}

export async function getAgentTools(token?: string): Promise<AgentToolsResponse> {
  return apiRequest<AgentToolsResponse>('/api/agent/tools', { method: 'GET' }, token);
}
