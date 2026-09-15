import { apiRequest } from './client';
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
