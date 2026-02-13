/**
 * WebSocket Chat Handler
 *
 * Extracted from server/index.js to reduce file size.
 * Contains the WebSocketWriter class and the chat message dispatch logic.
 */

import { queryClaudeSDK, abortClaudeSDKSession, isClaudeSDKSessionActive, getActiveClaudeSDKSessions, resolveToolApproval } from '../claude-sdk.js';
import { spawnCursor, abortCursorSession, isCursorSessionActive, getActiveCursorSessions } from '../cursor-cli.js';
import { queryCodex, abortCodexSession, isCodexSessionActive, getActiveCodexSessions } from '../openai-codex.js';
import { queryOpenAICompatible, abortOpenAICompatibleSession, isOpenAICompatibleSessionActive } from '../providers/openai-compatible.js';
import { queryWenxin, abortWenxinSession, isWenxinSessionActive } from '../providers/wenxin-sdk.js';
import { getProviderConfig } from '../providers/registry.js';

/**
 * WebSocket Writer - Wrapper for WebSocket to match SSEStreamWriter interface.
 * Provides a consistent send() API that JSON-serializes outgoing messages.
 */
export class WebSocketWriter {
  constructor(ws) {
    this.ws = ws;
    this.sessionId = null;
    this.isWebSocketWriter = true;  // Marker for transport detection
  }

  send(data) {
    if (this.ws.readyState === 1) { // WebSocket.OPEN
      // Providers send raw objects, we stringify for WebSocket
      this.ws.send(JSON.stringify(data));
    }
  }

  setSessionId(sessionId) {
    this.sessionId = sessionId;
  }

  getSessionId() {
    return this.sessionId;
  }
}

/**
 * Dispatch a single incoming WebSocket message to the appropriate provider
 * or internal handler.
 *
 * @param {object}          data    - Parsed JSON message from the client
 * @param {WebSocketWriter} writer  - Writer instance wrapping the client WebSocket
 * @param {string|null}     userId  - Authenticated user id (may be null)
 */
export async function handleChatMessage(data, writer, userId) {
  if (data.type === 'claude-command') {
    console.log('[DEBUG] User message:', data.command || '[Continue/Resume]');
    console.log('\u{1F4C1} Project:', data.options?.projectPath || 'Unknown');
    console.log('\u{1F504} Session:', data.options?.sessionId ? 'Resume' : 'New');

    // Include userId in options for per-user tracking
    const options = { ...data.options, userId };
    // Use Claude Agents SDK
    await queryClaudeSDK(data.command, options, writer);

  } else if (data.type === 'cursor-command') {
    console.log('[DEBUG] Cursor message:', data.command || '[Continue/Resume]');
    console.log('\u{1F4C1} Project:', data.options?.cwd || 'Unknown');
    console.log('\u{1F504} Session:', data.options?.sessionId ? 'Resume' : 'New');
    console.log('\u{1F916} Model:', data.options?.model || 'default');
    const options = { ...data.options, userId };
    await spawnCursor(data.command, options, writer);

  } else if (data.type === 'codex-command') {
    console.log('[DEBUG] Codex message:', data.command || '[Continue/Resume]');
    console.log('\u{1F4C1} Project:', data.options?.projectPath || data.options?.cwd || 'Unknown');
    console.log('\u{1F504} Session:', data.options?.sessionId ? 'Resume' : 'New');
    console.log('\u{1F916} Model:', data.options?.model || 'default');
    const options = { ...data.options, userId };
    await queryCodex(data.command, options, writer);

  } else if (data.type === 'ai-command') {
    // Chinese AI models (Kimi, Qwen, DeepSeek, GLM, Doubao, Wenxin)
    const providerId = data.provider;
    const providerConfig = getProviderConfig(providerId);
    console.log(`[DEBUG] AI command for ${providerId}:`, data.command?.slice(0, 100) || '[empty]');
    console.log('\u{1F4C1} Project:', data.options?.cwd || 'Unknown');
    console.log('\u{1F916} Model:', data.options?.model || 'default');

    if (!providerConfig) {
      writer.send({ type: 'error', error: `Unknown provider: ${providerId}` });
    } else {
      const options = { ...data.options, provider: providerId, userId };
      if (providerConfig.type === 'openai-compatible') {
        await queryOpenAICompatible(data.command, options, writer);
      } else if (providerConfig.type === 'wenxin') {
        await queryWenxin(data.command, options, writer);
      } else {
        writer.send({ type: 'error', error: `Unsupported provider type: ${providerConfig.type}` });
      }
    }

  } else if (data.type === 'cursor-resume') {
    // Backward compatibility: treat as cursor-command with resume and no prompt
    console.log('[DEBUG] Cursor resume session (compat):', data.sessionId);
    await spawnCursor('', {
      sessionId: data.sessionId,
      resume: true,
      cwd: data.options?.cwd,
      userId
    }, writer);

  } else if (data.type === 'abort-session') {
    console.log('[DEBUG] Abort session request:', data.sessionId);
    const provider = data.provider || 'claude';
    let success;

    if (provider === 'cursor') {
      success = abortCursorSession(data.sessionId);
    } else if (provider === 'codex') {
      success = abortCodexSession(data.sessionId);
    } else if (['kimi', 'qwen', 'deepseek', 'glm', 'doubao'].includes(provider)) {
      success = await abortOpenAICompatibleSession(data.sessionId);
    } else if (provider === 'wenxin') {
      success = await abortWenxinSession(data.sessionId);
    } else {
      // Use Claude Agents SDK
      success = await abortClaudeSDKSession(data.sessionId);
    }

    writer.send({
      type: 'session-aborted',
      sessionId: data.sessionId,
      provider,
      success
    });

  } else if (data.type === 'claude-permission-response') {
    // Relay UI approval decisions back into the SDK control flow.
    // This does not persist permissions; it only resolves the in-flight request,
    // introduced so the SDK can resume once the user clicks Allow/Deny.
    if (data.requestId) {
      resolveToolApproval(data.requestId, {
        allow: Boolean(data.allow),
        updatedInput: data.updatedInput,
        message: data.message,
        rememberEntry: data.rememberEntry
      });
    }

  } else if (data.type === 'cursor-abort') {
    console.log('[DEBUG] Abort Cursor session:', data.sessionId);
    const success = abortCursorSession(data.sessionId);
    writer.send({
      type: 'session-aborted',
      sessionId: data.sessionId,
      provider: 'cursor',
      success
    });

  } else if (data.type === 'check-session-status') {
    // Check if a specific session is currently processing
    const provider = data.provider || 'claude';
    const sessionId = data.sessionId;
    let isActive;

    if (provider === 'cursor') {
      isActive = isCursorSessionActive(sessionId);
    } else if (provider === 'codex') {
      isActive = isCodexSessionActive(sessionId);
    } else if (['kimi', 'qwen', 'deepseek', 'glm', 'doubao'].includes(provider)) {
      isActive = isOpenAICompatibleSessionActive(sessionId);
    } else if (provider === 'wenxin') {
      isActive = isWenxinSessionActive(sessionId);
    } else {
      // Use Claude Agents SDK
      isActive = isClaudeSDKSessionActive(sessionId);
    }

    writer.send({
      type: 'session-status',
      sessionId,
      provider,
      isProcessing: isActive
    });

  } else if (data.type === 'get-active-sessions') {
    // Get all currently active sessions (including Chinese AI providers)
    const { getOpenAICompatibleActiveSessions } = await import('../providers/openai-compatible.js');
    const { getWenxinActiveSessions } = await import('../providers/wenxin-sdk.js');
    const activeSessions = {
      claude: getActiveClaudeSDKSessions(),
      cursor: getActiveCursorSessions(),
      codex: getActiveCodexSessions(),
      openai_compatible: getOpenAICompatibleActiveSessions(),
      wenxin: getWenxinActiveSessions()
    };
    writer.send({
      type: 'active-sessions',
      sessions: activeSessions
    });
  }
}
