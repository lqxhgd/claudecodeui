/**
 * Wenxin (文心一言 / ERNIE Bot) Provider
 *
 * Baidu's Wenxin uses a non-standard API that requires:
 * 1. OAuth2 token exchange (API Key + Secret Key -> access_token)
 * 2. Custom chat completions endpoint
 *
 * This adapter transforms Wenxin's API into the same WebSocket message format
 * the frontend expects.
 */

import { BaseProvider } from './base-provider.js';
import { credentialsDb } from '../database/db.js';

// Token cache
let cachedToken = null;
let tokenExpiry = 0;

class WenxinProvider extends BaseProvider {
  constructor() {
    super({});
  }

  /**
   * Resolve API Key and Secret Key
   */
  resolveCredentials(userId) {
    let apiKey = null;
    let secretKey = null;

    // Try user credentials from DB
    if (userId) {
      apiKey = credentialsDb.getActiveCredential(userId, 'baidu_api_key');
      secretKey = credentialsDb.getActiveCredential(userId, 'baidu_secret_key');
    }

    // Fallback to environment variables
    if (!apiKey) apiKey = process.env.BAIDU_API_KEY;
    if (!secretKey) secretKey = process.env.BAIDU_SECRET_KEY;

    return { apiKey, secretKey };
  }

  /**
   * Get OAuth2 access token (cached)
   */
  async getAccessToken(apiKey, secretKey) {
    // Return cached token if still valid (with 5 minute buffer)
    if (cachedToken && Date.now() < tokenExpiry - 300000) {
      return cachedToken;
    }

    const url = `https://aip.baidubce.com/oauth/2.0/token?grant_type=client_credentials&client_id=${apiKey}&client_secret=${secretKey}`;

    const response = await fetch(url, { method: 'POST' });
    if (!response.ok) {
      throw new Error(`Wenxin OAuth failed: ${response.status} ${await response.text()}`);
    }

    const data = await response.json();
    cachedToken = data.access_token;
    // Token typically expires in 30 days
    tokenExpiry = Date.now() + (data.expires_in || 2592000) * 1000;

    return cachedToken;
  }

  /**
   * Get the API endpoint URL for a given model
   */
  getModelEndpoint(model) {
    const endpoints = {
      'ernie-4.0-8k': 'https://aip.baidubce.com/rpc/2.0/ai_custom/v1/wenxinworkshop/chat/completions_pro',
      'ernie-4.0-turbo-8k': 'https://aip.baidubce.com/rpc/2.0/ai_custom/v1/wenxinworkshop/chat/ernie-4.0-turbo-8k',
      'ernie-3.5-8k': 'https://aip.baidubce.com/rpc/2.0/ai_custom/v1/wenxinworkshop/chat/completions',
      'ernie-3.5-128k': 'https://aip.baidubce.com/rpc/2.0/ai_custom/v1/wenxinworkshop/chat/ernie-3.5-128k',
      'ernie-speed-8k': 'https://aip.baidubce.com/rpc/2.0/ai_custom/v1/wenxinworkshop/chat/ernie_speed',
      'ernie-speed-128k': 'https://aip.baidubce.com/rpc/2.0/ai_custom/v1/wenxinworkshop/chat/ernie-speed-128k',
      'ernie-lite-8k': 'https://aip.baidubce.com/rpc/2.0/ai_custom/v1/wenxinworkshop/chat/ernie-lite-8k',
      'ernie-tiny-8k': 'https://aip.baidubce.com/rpc/2.0/ai_custom/v1/wenxinworkshop/chat/ernie-tiny-8k'
    };
    return endpoints[model] || endpoints['ernie-4.0-8k'];
  }

  /**
   * Send a query and stream responses
   */
  async query(command, options, ws) {
    const { apiKey, secretKey } = this.resolveCredentials(options.userId);

    // Generate a sessionId early so ALL messages (including errors) include it.
    // Without this, the frontend drops messages with no sessionId and the page freezes.
    const sessionId = options.sessionId || `wenxin-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    if (!apiKey || !secretKey) {
      ws.send({
        type: 'error',
        sessionId,
        error: 'Wenxin API requires both API Key and Secret Key. Please configure them in Settings → AI Providers.'
      });
      // Send completion so frontend knows the session ended
      ws.send({
        type: 'claude-complete',
        sessionId,
        provider: 'wenxin',
        error: 'Wenxin API requires both API Key and Secret Key.'
      });
      return;
    }

    const model = options.model || 'ernie-4.0-8k';
    const controller = new AbortController();
    this.addSession(sessionId, { controller });

    ws.send({
      type: 'session-created',
      sessionId,
      model,
      provider: 'wenxin',
      cwd: options.cwd || ''
    });

    try {
      const accessToken = await this.getAccessToken(apiKey, secretKey);
      const endpoint = this.getModelEndpoint(model);

      const messages = [];
      if (options.history && Array.isArray(options.history)) {
        messages.push(...options.history);
      }
      messages.push({ role: 'user', content: command });

      const requestBody = {
        messages,
        stream: true,
        temperature: options.temperature ?? 0.7
      };

      if (options.systemPrompt) {
        requestBody.system = options.systemPrompt;
      }

      const response = await fetch(`${endpoint}?access_token=${accessToken}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
        signal: controller.signal
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Wenxin API error (${response.status}): ${errorText}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let fullContent = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || !trimmed.startsWith('data: ')) continue;

          try {
            const data = JSON.parse(trimmed.slice(6));

            if (data.result) {
              fullContent += data.result;
              ws.send({
                type: 'claude-response',
                sessionId,
                data: {
                  type: 'content_block_delta',
                  delta: { type: 'text_delta', text: data.result }
                }
              });
            }

            if (data.is_end) {
              ws.send({
                type: 'claude-response',
                sessionId,
                data: { type: 'content_block_stop' }
              });

              if (data.usage) {
                ws.send({
                  type: 'claude-response',
                  sessionId,
                  data: {
                    type: 'usage',
                    usage: {
                      input_tokens: data.usage.prompt_tokens || 0,
                      output_tokens: data.usage.completion_tokens || 0,
                      total_tokens: data.usage.total_tokens || 0
                    }
                  }
                });
              }
            }

            // Handle Wenxin error responses
            if (data.error_code) {
              throw new Error(`Wenxin error ${data.error_code}: ${data.error_msg}`);
            }
          } catch (parseError) {
            if (parseError.message.includes('Wenxin error')) throw parseError;
            console.warn('[wenxin] SSE parse error:', parseError.message);
          }
        }
      }

      ws.send({
        type: 'claude-complete',
        sessionId,
        provider: 'wenxin',
        result: { content: fullContent, model, provider: 'wenxin' }
      });

    } catch (error) {
      if (error.name === 'AbortError') {
        ws.send({
          type: 'session-aborted',
          sessionId,
          provider: 'wenxin',
          success: true
        });
      } else {
        console.error('[wenxin] Query error:', error.message);
        ws.send({ type: 'error', sessionId, error: error.message });
        ws.send({
          type: 'claude-complete',
          sessionId,
          provider: 'wenxin',
          error: error.message
        });
      }
    } finally {
      this.removeSession(sessionId);
    }
  }

  async abort(sessionId) {
    const session = this.activeSessions.get(sessionId);
    if (!session) return false;
    try {
      session.controller.abort();
      this.removeSession(sessionId);
      return true;
    } catch (error) {
      console.error('[wenxin] Abort error:', error.message);
      return false;
    }
  }
}

const provider = new WenxinProvider();

export async function queryWenxin(command, options, ws) {
  return provider.query(command, options, ws);
}

export async function abortWenxinSession(sessionId) {
  return provider.abort(sessionId);
}

export function isWenxinSessionActive(sessionId) {
  return provider.isActive(sessionId);
}

export function getWenxinActiveSessions() {
  return provider.getActiveSessions();
}

export default provider;
