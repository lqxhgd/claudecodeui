/**
 * Bot Webhook Routes - Receive messages from DingTalk / WeChat Work
 * 
 * Endpoints:
 * - POST /api/bot/dingtalk/webhook   - DingTalk robot callback
 * - POST /api/bot/wechat/webhook    - WeChat Work robot callback
 * - GET  /api/bot/config             - Get bot configurations
 * - POST /api/bot/config             - Save bot configuration
 * - DELETE /api/bot/config/:id       - Delete bot configuration
 * - POST /api/bot/test               - Test bot reply
 * - GET  /api/bot/sessions           - Get active bot sessions
 * - POST /api/bot/clear-session     - Clear a bot session
 */

import { Router } from 'express';
import { db } from '../database/db.js';
import {
  processMessage,
  replyDingTalk,
  replyWeChatWork,
  verifyDingTalkSignature,
  clearBotSession,
  getActiveBotSessions
} from '../services/bot-gateway.js';

const router = Router();

// ────────────────────────────────────────────────────────
// Database helpers (bot_config table)
// ────────────────────────────────────────────────────────

function ensureBotConfigTable() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS bot_config (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      platform TEXT NOT NULL DEFAULT 'dingtalk',
      bot_name TEXT NOT NULL DEFAULT 'Claude Bot',
      app_key TEXT,
      app_secret TEXT,
      webhook_token TEXT,
      webhook_url TEXT,
      reply_webhook_url TEXT,
      cwd TEXT,
      model TEXT DEFAULT 'sonnet',
      is_active BOOLEAN DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);
}

// Initialize table on module load
ensureBotConfigTable();

function getBotConfigs(userId) {
  return db.prepare('SELECT * FROM bot_config WHERE user_id = ? ORDER BY created_at DESC').all(userId);
}

function getBotConfigByPlatform(platform) {
  return db.prepare('SELECT * FROM bot_config WHERE platform = ? AND is_active = 1').all(platform);
}

function saveBotConfig(userId, config) {
  const stmt = db.prepare(`
    INSERT INTO bot_config (user_id, platform, bot_name, app_key, app_secret, webhook_token, webhook_url, reply_webhook_url, cwd, model)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const result = stmt.run(
    userId,
    config.platform || 'dingtalk',
    config.botName || 'Claude Bot',
    config.appKey || null,
    config.appSecret || null,
    config.webhookToken || null,
    config.webhookUrl || null,
    config.replyWebhookUrl || null,
    config.cwd || null,
    config.model || 'sonnet'
  );
  return { id: result.lastInsertRowid };
}

function updateBotConfig(userId, configId, config) {
  const stmt = db.prepare(`
    UPDATE bot_config SET
      platform = COALESCE(?, platform),
      bot_name = COALESCE(?, bot_name),
      app_key = ?,
      app_secret = ?,
      webhook_token = ?,
      webhook_url = ?,
      reply_webhook_url = ?,
      cwd = ?,
      model = COALESCE(?, model),
      is_active = COALESCE(?, is_active),
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ? AND user_id = ?
  `);
  return stmt.run(
    config.platform, config.botName,
    config.appKey ?? null, config.appSecret ?? null,
    config.webhookToken ?? null, config.webhookUrl ?? null,
    config.replyWebhookUrl ?? null, config.cwd ?? null,
    config.model, config.isActive !== undefined ? (config.isActive ? 1 : 0) : null,
    configId, userId
  ).changes > 0;
}

function deleteBotConfig(userId, configId) {
  return db.prepare('DELETE FROM bot_config WHERE id = ? AND user_id = ?').run(configId, userId).changes > 0;
}

// ────────────────────────────────────────────────────────
// DingTalk Webhook (no auth required - public endpoint)
// ────────────────────────────────────────────────────────

router.post('/dingtalk/webhook', async (req, res) => {
  try {
    const { text, senderNick, senderStaffId, conversationId, sessionWebhook, msgtype } = req.body;
    const timestamp = req.headers['timestamp'];
    const sign = req.headers['sign'];

    // Only handle text messages
    if (msgtype !== 'text' || !text?.content) {
      return res.json({ msgtype: 'empty' });
    }

    const userMessage = text.content.trim();

    // Handle /clear command
    if (userMessage === '/clear' || userMessage === '清除会话') {
      clearBotSession('dingtalk', conversationId, senderStaffId);
      // Reply directly via sessionWebhook
      if (sessionWebhook) {
        await replyDingTalk(sessionWebhook, '会话已清除，下次发送将开始新对话。');
      }
      return res.json({ msgtype: 'empty' });
    }

    // Find active DingTalk bot config
    const configs = getBotConfigByPlatform('dingtalk');
    const botConfig = configs[0]; // Use first active config

    // Verify signature if secret is configured
    if (botConfig?.app_secret && timestamp && sign) {
      if (!verifyDingTalkSignature(timestamp, sign, botConfig.app_secret)) {
        console.error('[DingTalk] Signature verification failed');
        return res.status(403).json({ error: 'Invalid signature' });
      }
    }

    // Respond immediately to avoid DingTalk timeout (must reply within 3s)
    res.json({ msgtype: 'empty' });

    // Process message asynchronously and reply via sessionWebhook
    const responseText = await processMessage({
      platform: 'dingtalk',
      message: userMessage,
      userId: senderStaffId || 'unknown',
      conversationId: conversationId,
      senderName: senderNick || 'User',
      botConfig: botConfig ? { model: botConfig.model, cwd: botConfig.cwd } : {}
    });

    // Send reply back to DingTalk
    if (sessionWebhook) {
      await replyDingTalk(sessionWebhook, responseText, senderStaffId);
    }
  } catch (error) {
    console.error('[DingTalk Webhook] Error:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Internal error' });
    }
  }
});

// ────────────────────────────────────────────────────────
// WeChat Work Webhook
// ────────────────────────────────────────────────────────

// WeChat Work verification (GET request for URL verification)
router.get('/wechat/webhook', (req, res) => {
  // WeChat Work URL verification callback
  const { msg_signature, timestamp, nonce, echostr } = req.query;
  // For simple webhook bots, just echo back
  if (echostr) {
    return res.send(echostr);
  }
  res.json({ status: 'ok' });
});

router.post('/wechat/webhook', async (req, res) => {
  try {
    const { MsgType, Content, FromUserName, CreateTime, AgentID } = req.body;

    // Handle text messages only
    if (MsgType !== 'text' || !Content) {
      return res.json({ code: 0 });
    }

    const userMessage = Content.trim();

    // Handle /clear command
    if (userMessage === '/clear' || userMessage === '清除会话') {
      clearBotSession('wechat_work', AgentID, FromUserName);
      // Find reply webhook
      const configs = getBotConfigByPlatform('wechat_work');
      if (configs[0]?.reply_webhook_url) {
        await replyWeChatWork(configs[0].reply_webhook_url, '会话已清除，下次发送将开始新对话。');
      }
      return res.json({ code: 0 });
    }

    // Respond immediately
    res.json({ code: 0 });

    // Find active WeChat Work bot config
    const configs = getBotConfigByPlatform('wechat_work');
    const botConfig = configs[0];

    // Process message asynchronously
    const responseText = await processMessage({
      platform: 'wechat_work',
      message: userMessage,
      userId: FromUserName || 'unknown',
      conversationId: AgentID?.toString() || '',
      senderName: FromUserName || 'User',
      botConfig: botConfig ? { model: botConfig.model, cwd: botConfig.cwd } : {}
    });

    // Reply via webhook
    if (botConfig?.reply_webhook_url) {
      await replyWeChatWork(botConfig.reply_webhook_url, responseText, [FromUserName]);
    }
  } catch (error) {
    console.error('[WeChat Work Webhook] Error:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Internal error' });
    }
  }
});

// ────────────────────────────────────────────────────────
// Bot Config Management (requires auth)
// ────────────────────────────────────────────────────────

router.get('/config', (req, res) => {
  try {
    const configs = getBotConfigs(req.user?.id || 1);
    res.json({ configs });
  } catch (error) {
    console.error('[Bot Config] Error getting configs:', error);
    res.status(500).json({ error: 'Failed to get bot configs' });
  }
});

router.post('/config', (req, res) => {
  try {
    const result = saveBotConfig(req.user?.id || 1, req.body);
    res.json({ success: true, id: result.id });
  } catch (error) {
    console.error('[Bot Config] Error saving config:', error);
    res.status(500).json({ error: 'Failed to save bot config' });
  }
});

router.put('/config/:id', (req, res) => {
  try {
    const updated = updateBotConfig(req.user?.id || 1, parseInt(req.params.id), req.body);
    if (!updated) {
      return res.status(404).json({ error: 'Config not found' });
    }
    res.json({ success: true });
  } catch (error) {
    console.error('[Bot Config] Error updating config:', error);
    res.status(500).json({ error: 'Failed to update bot config' });
  }
});

router.delete('/config/:id', (req, res) => {
  try {
    const deleted = deleteBotConfig(req.user?.id || 1, parseInt(req.params.id));
    if (!deleted) {
      return res.status(404).json({ error: 'Config not found' });
    }
    res.json({ success: true });
  } catch (error) {
    console.error('[Bot Config] Error deleting config:', error);
    res.status(500).json({ error: 'Failed to delete bot config' });
  }
});

// ────────────────────────────────────────────────────────
// Bot session management
// ────────────────────────────────────────────────────────

router.get('/sessions', (req, res) => {
  try {
    const sessions = getActiveBotSessions();
    res.json({ sessions });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get sessions' });
  }
});

router.post('/clear-session', (req, res) => {
  try {
    const { platform, conversationId, userId } = req.body;
    clearBotSession(platform, conversationId, userId);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to clear session' });
  }
});

// Test endpoint - send a test message through the bot pipeline
router.post('/test', async (req, res) => {
  try {
    const { platform, message } = req.body;
    const configs = getBotConfigs(req.user?.id || 1);
    const config = configs.find(c => c.platform === (platform || 'dingtalk'));
    
    const responseText = await processMessage({
      platform: platform || 'dingtalk',
      message: message || '你好，这是测试消息',
      userId: 'test-user',
      conversationId: 'test-conversation',
      senderName: 'Test User',
      botConfig: config ? { model: config.model, cwd: config.cwd } : {}
    });

    res.json({ success: true, response: responseText });
  } catch (error) {
    console.error('[Bot Test] Error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
