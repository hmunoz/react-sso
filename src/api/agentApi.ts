import { apiRequest } from './client';

export interface ChatResponse {
  prompt: string;
  conversationId?: string;
  response: string;
  agentsInvoked?: string[];
  toolsExecuted?: string[];
  toolsDenied?: string[];
  toolsAvailable: string[];
  fromMemory?: boolean;
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
