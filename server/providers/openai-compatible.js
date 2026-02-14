/**
 * OpenAI-Compatible Provider
 *
 * Unified provider for all AI models that implement the OpenAI Chat Completions API.
 * Works with: Kimi (Moonshot), Qwen (DashScope), DeepSeek, GLM (智谱), Doubao (豆包)
 *
 * Transforms streaming responses into the same WebSocket message format that the
 * frontend already handles (content_block_delta / content_block_stop / claude-complete),
 * enabling zero frontend changes for Chinese model support.
 */

import { BaseProvider } from './base-provider.js';
import { getProviderConfig } from './registry.js';
import { credentialsDb } from '../database/db.js';

class OpenAICompatibleProvider extends BaseProvider {
  constructor() {
    super({});
  }

  /**
   * Resolve API key from: user credentials DB → environment variable
   */
  resolveApiKey(providerId, userId) {
    const config = getProviderConfig(providerId);
    if (!config) return null;

    // Try user-specific credential from DB
    if (userId && config.credentialType) {
      const dbKey = credentialsDb.getActiveCredential(userId, config.credentialType);
      if (dbKey) return dbKey;
    }

    // Fallback to environment variable
    if (config.envKey && process.env[config.envKey]) {
      return process.env[config.envKey];
    }

    return null;
  }

  /**
   * Build the message history for the API call
   */
  buildMessages(command, options) {
    const messages = [];

    // Add system prompt if provided
    if (options.systemPrompt) {
      messages.push({ role: 'system', content: options.systemPrompt });
    }

    // Add conversation history if resuming
    if (options.history && Array.isArray(options.history)) {
      messages.push(...options.history);
    }

    // Add current user message
    messages.push({ role: 'user', content: command });

    return messages;
  }

  /**
   * Send a query and stream responses via WebSocket
   */
  async query(command, options, ws) {
    const providerId = options.provider;
    const config = getProviderConfig(providerId);

    // Generate a sessionId early so ALL messages (including errors) include it.
    // Without this, the frontend drops messages with no sessionId and the page freezes.
    const sessionId = options.sessionId || `${providerId}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    if (!config || config.type !== 'openai-compatible') {
      ws.send({
        type: 'error',
        sessionId,
        error: `Invalid OpenAI-compatible provider: ${providerId}`
      });
      // Send completion so frontend knows the session ended
      ws.send({
        type: 'claude-complete',
        sessionId,
        provider: providerId,
        error: `Invalid OpenAI-compatible provider: ${providerId}`
      });
      return;
    }

    const apiKey = this.resolveApiKey(providerId, options.userId);
    if (!apiKey) {
      ws.send({
        type: 'error',
        sessionId,
        error: `No API key configured for ${config.label}. Please add your API key in Settings → AI Providers.`
      });
      // Send completion so frontend knows the session ended
      ws.send({
        type: 'claude-complete',
        sessionId,
        provider: providerId,
        error: `No API key configured for ${config.label}.`
      });
      return;
    }

    const model = options.model || this.getDefaultModel(providerId);

    // Create AbortController for cancellation support
    const controller = new AbortController();
    this.addSession(sessionId, { controller, providerId, userId: options.userId });

    // Notify frontend of session creation
    ws.send({
      type: 'session-created',
      sessionId,
      model,
      provider: providerId,
      cwd: options.cwd || ''
    });

    try {
      const messages = this.buildMessages(command, options);

      const requestBody = {
        model,
        messages,
        stream: true,
        temperature: options.temperature ?? 0.7,
        max_tokens: options.maxTokens ?? 4096
      };

      // Some providers support additional parameters
      if (options.topP !== undefined) {
        requestBody.top_p = options.topP;
      }

      const response = await fetch(`${config.baseURL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage;
        try {
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.error?.message || errorJson.message || errorText;
        } catch {
          errorMessage = errorText;
        }
        throw new Error(`${config.label} API error (${response.status}): ${errorMessage}`);
      }

      // Process SSE stream
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
          if (!trimmed || trimmed === 'data: [DONE]') continue;
          if (!trimmed.startsWith('data: ')) continue;

          try {
            const data = JSON.parse(trimmed.slice(6));
            const delta = data.choices?.[0]?.delta;

            if (delta?.content) {
              fullContent += delta.content;

              // Send in the same format the frontend expects
              // NOTE: ws is a WebSocketWriter that already JSON.stringifies, so pass objects directly
              ws.send({
                type: 'claude-response',
                sessionId,
                data: {
                  type: 'content_block_delta',
                  delta: {
                    type: 'text_delta',
                    text: delta.content
                  }
                }
              });
            }

            // Handle reasoning/thinking content if present (DeepSeek, GLM)
            if (delta?.reasoning_content) {
              ws.send({
                type: 'claude-response',
                sessionId,
                data: {
                  type: 'content_block_delta',
                  delta: {
                    type: 'thinking_delta',
                    thinking: delta.reasoning_content
                  }
                }
              });
            }

            // Check for finish_reason
            if (data.choices?.[0]?.finish_reason) {
              // Send content block stop
              ws.send({
                type: 'claude-response',
                sessionId,
                data: {
                  type: 'content_block_stop'
                }
              });

              // Send usage info if available
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
          } catch (parseError) {
            // Skip malformed SSE data
            console.warn(`[${providerId}] SSE parse error:`, parseError.message);
          }
        }
      }

      // Send completion signal
      ws.send({
        type: 'claude-complete',
        sessionId,
        provider: providerId,
        result: {
          content: fullContent,
          model,
          provider: providerId
        }
      });

    } catch (error) {
      if (error.name === 'AbortError') {
        ws.send({
          type: 'session-aborted',
          sessionId,
          provider: providerId,
          success: true
        });
      } else {
        console.error(`[${providerId}] Query error:`, error.message);
        ws.send({
          type: 'error',
          sessionId,
          error: error.message
        });
        // Also send completion so frontend knows the session ended
        ws.send({
          type: 'claude-complete',
          sessionId,
          provider: providerId,
          error: error.message
        });
      }
    } finally {
      this.removeSession(sessionId);
    }
  }

  /**
   * Abort an active session
   */
  async abort(sessionId) {
    const session = this.activeSessions.get(sessionId);
    if (!session) return false;

    try {
      session.controller.abort();
      this.removeSession(sessionId);
      return true;
    } catch (error) {
      console.error(`[${session.providerId}] Abort error:`, error.message);
      return false;
    }
  }

  /**
   * Get default model for a provider
   */
  getDefaultModel(providerId) {
    const defaults = {
      kimi: 'moonshot-v1-32k',
      qwen: 'qwen-plus',
      deepseek: 'deepseek-chat',
      glm: 'glm-4-flash',
      doubao: 'doubao-pro-32k'
    };
    return defaults[providerId] || 'default';
  }
}

// Singleton instance
const provider = new OpenAICompatibleProvider();

/**
 * Query an OpenAI-compatible provider
 * @param {string} command - User prompt
 * @param {object} options - { provider, model, sessionId, cwd, userId, history, ... }
 * @param {object} ws - WebSocket writer
 */
export async function queryOpenAICompatible(command, options, ws) {
  return provider.query(command, options, ws);
}

/**
 * Abort an active session
 */
export async function abortOpenAICompatibleSession(sessionId) {
  return provider.abort(sessionId);
}

/**
 * Check if a session is active
 */
export function isOpenAICompatibleSessionActive(sessionId) {
  return provider.isActive(sessionId);
}

/**
 * Get all active sessions
 */
export function getOpenAICompatibleActiveSessions() {
  return provider.getActiveSessions();
}

export default provider;
