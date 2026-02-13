/**
 * Bot Gateway - Unified message routing for DingTalk and WeChat Work
 * 
 * Flow: DingTalk/WeChat → Webhook → Bot Gateway → Claude SDK → Reply
 */

import { query } from '@anthropic-ai/claude-agent-sdk';
import crypto from 'crypto';
import { CLAUDE_MODELS } from '../../shared/modelConstants.js';

// Active bot sessions for tracking ongoing conversations
const botSessions = new Map();

/**
 * Process an incoming message from any bot platform
 * @param {object} params
 * @param {string} params.platform - 'dingtalk' or 'wechat_work'
 * @param {string} params.message - User's message text
 * @param {string} params.userId - Platform user identifier
 * @param {string} params.conversationId - Platform conversation/group ID
 * @param {string} params.senderName - Display name of sender
 * @param {object} params.botConfig - Bot configuration from database
 * @returns {Promise<string>} Response text to send back
 */
export async function processMessage({ platform, message, userId, conversationId, senderName, botConfig }) {
  const sessionKey = `${platform}-${conversationId || userId}`;
  
  console.log(`[BotGateway] ${platform} message from ${senderName}(${userId}): ${message.slice(0, 100)}`);

  try {
    // Get or create session for this conversation
    let sessionId = botSessions.get(sessionKey)?.sessionId || null;
    
    const sdkOptions = {
      model: botConfig?.model || CLAUDE_MODELS.DEFAULT,
      systemPrompt: { type: 'preset', preset: 'claude_code' },
      settingSources: ['project', 'user', 'local'],
      permissionMode: 'bypassPermissions',  // Bot messages auto-approve tools
    };

    if (botConfig?.cwd) {
      sdkOptions.cwd = botConfig.cwd;
    }

    // Resume existing session if available
    if (sessionId) {
      sdkOptions.resume = sessionId;
    }

    // Collect response text from streaming messages
    let responseText = '';
    let newSessionId = null;

    const queryInstance = query({
      prompt: message,
      options: sdkOptions
    });

    for await (const msg of queryInstance) {
      // Capture session ID
      if (msg.session_id && !newSessionId) {
        newSessionId = msg.session_id;
      }

      // Collect text content from assistant messages
      if (msg.type === 'assistant' && msg.message?.content) {
        for (const block of msg.message.content) {
          if (block.type === 'text') {
            responseText += block.text;
          }
        }
      }

      // Also collect from result messages
      if (msg.type === 'result' && msg.result) {
        if (!responseText) {
          responseText = msg.result;
        }
      }
    }

    // Update session tracking
    if (newSessionId) {
      botSessions.set(sessionKey, {
        sessionId: newSessionId,
        platform,
        userId,
        conversationId,
        lastActive: Date.now()
      });
    }

    // Truncate very long responses for chat platforms
    const maxLength = platform === 'dingtalk' ? 6000 : 4000;
    if (responseText.length > maxLength) {
      responseText = responseText.slice(0, maxLength) + '\n\n...(Response truncated)';
    }

    return responseText || 'No response generated.';
  } catch (error) {
    console.error(`[BotGateway] Error processing ${platform} message:`, error);
    return `Error: ${error.message || 'Failed to process message'}`;
  }
}

/**
 * Send reply to DingTalk
 * Uses the incoming webhook's sessionWebhook URL for direct reply
 */
export async function replyDingTalk(webhookUrl, text, atUserId) {
  const body = {
    msgtype: 'text',
    text: { content: text },
  };
  
  if (atUserId) {
    body.at = { atUserIds: [atUserId] };
  }

  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    throw new Error(`DingTalk reply failed: HTTP ${response.status}`);
  }
  return response.json();
}

/**
 * Send reply to WeChat Work
 * Uses the configured webhook URL for group bot replies
 */
export async function replyWeChatWork(webhookUrl, text, mentionedList) {
  const body = {
    msgtype: 'text',
    text: {
      content: text,
      mentioned_list: mentionedList || []
    }
  };

  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    throw new Error(`WeChat Work reply failed: HTTP ${response.status}`);
  }
  
  const result = await response.json();
  if (result.errcode !== 0) {
    throw new Error(`WeChat Work error: ${result.errmsg}`);
  }
  return result;
}

/**
 * Verify DingTalk webhook signature
 * @see https://open.dingtalk.com/document/robots/custom-robot-access
 */
export function verifyDingTalkSignature(timestamp, sign, secret) {
  if (!secret) return true; // No secret configured, skip verification
  
  const stringToSign = `${timestamp}\n${secret}`;
  const hmac = crypto.createHmac('sha256', secret).update(stringToSign).digest('base64');
  return hmac === sign;
}

/**
 * Clear a bot session (for /clear command)
 */
export function clearBotSession(platform, conversationId, userId) {
  const sessionKey = `${platform}-${conversationId || userId}`;
  botSessions.delete(sessionKey);
  return true;
}

/**
 * Get all active bot sessions (for monitoring)
 */
export function getActiveBotSessions() {
  const sessions = [];
  for (const [key, value] of botSessions) {
    sessions.push({ key, ...value });
  }
  return sessions;
}

// Cleanup stale sessions every 30 minutes
setInterval(() => {
  const staleThreshold = Date.now() - 30 * 60 * 1000;
  for (const [key, session] of botSessions) {
    if (session.lastActive < staleThreshold) {
      botSessions.delete(key);
    }
  }
}, 30 * 60 * 1000);

export default {
  processMessage,
  replyDingTalk,
  replyWeChatWork,
  verifyDingTalkSignature,
  clearBotSession,
  getActiveBotSessions
};
