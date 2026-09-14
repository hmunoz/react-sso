import { apiRequest } from './client';

export interface ChatResponse {
  prompt: string;
  response: string;
  agentsInvoked?: string[];
  toolsExecuted?: string[];
  toolsAvailable: string[];
}

export interface AgentHealthResponse {
  status: string;
  agent: string;
}

export async function sendAgentPrompt(prompt: string, token?: string): Promise<ChatResponse> {
  return apiRequest<ChatResponse>(
    '/api/agent/chat',
    {
      method: 'POST',
      body: JSON.stringify({ prompt })
    },
    token
  );
}

export async function getAgentHealth(): Promise<AgentHealthResponse> {
  return apiRequest<AgentHealthResponse>('/api/agent/health');
}
