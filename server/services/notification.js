/**
 * Notification Service - WeChat Work (企业微信) Webhook Integration
 *
 * Sends notifications for:
 * - Git commits
 * - Deployment success/failure
 *
 * WeChat Work webhook API: https://developer.work.weixin.qq.com/document/path/91770
 */

import { notificationDb } from '../database/db.js';

export class NotificationService {
  /**
   * Send a notification to all active webhook configs for a user
   * @param {number} userId
   * @param {string} eventType - 'git_commit', 'deploy_success', 'deploy_failure'
   * @param {object} payload - Event-specific data
   */
  static async notify(userId, eventType, payload) {
    try {
      const configs = notificationDb.getConfig(userId);

      for (const config of configs) {
        // Check if this config subscribes to this event type
        const subscribedEvents = config.events.split(',').map(e => e.trim());
        if (!subscribedEvents.includes(eventType)) continue;

        try {
          await NotificationService.send(config, eventType, payload);
          notificationDb.addLog(userId, eventType, payload, 'sent');
        } catch (error) {
          console.error(`Notification failed for config ${config.id}:`, error.message);
          notificationDb.addLog(userId, eventType, payload, 'failed', error.message);
        }
      }
    } catch (error) {
      console.error('NotificationService.notify error:', error.message);
    }
  }

  /**
   * Send a message to a specific webhook
   */
  static async send(config, eventType, payload) {
    const message = NotificationService.formatMessage(config.webhook_type, eventType, payload);

    const response = await fetch(config.webhook_url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(message)
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Webhook HTTP ${response.status}: ${text}`);
    }

    const result = await response.json();

    // WeChat Work returns errcode 0 for success
    if (config.webhook_type === 'wechat_work' && result.errcode !== 0) {
      throw new Error(`WeChat Work error: ${result.errmsg} (code: ${result.errcode})`);
    }
  }

  /**
   * Format notification message based on webhook type
   */
  static formatMessage(webhookType, eventType, payload) {
    if (webhookType === 'wechat_work') {
      return NotificationService.formatWeChatWorkMessage(eventType, payload);
    }
    // Extensible for future webhook types (DingTalk, Slack, etc.)
    return NotificationService.formatWeChatWorkMessage(eventType, payload);
  }

  /**
   * Format WeChat Work markdown message
   */
  static formatWeChatWorkMessage(eventType, payload) {
    let content = '';

    switch (eventType) {
      case 'git_commit':
        content = NotificationService.formatCommitMessage(payload);
        break;
      case 'deploy_success':
        content = NotificationService.formatDeployMessage(payload, true);
        break;
      case 'deploy_failure':
        content = NotificationService.formatDeployMessage(payload, false);
        break;
      default:
        content = `**${eventType}**\n${JSON.stringify(payload, null, 2)}`;
    }

    return {
      msgtype: 'markdown',
      markdown: { content }
    };
  }

  /**
   * Format git commit notification
   */
  static formatCommitMessage(payload) {
    const { project, message, files, author, branch, commitHash, timestamp } = payload;
    const fileList = Array.isArray(files) && files.length > 0
      ? files.slice(0, 10).map(f => `> - ${f}`).join('\n')
      : '> (no files)';
    const truncated = Array.isArray(files) && files.length > 10
      ? `\n> ... and ${files.length - 10} more files`
      : '';

    return [
      `## 📦 Git Commit`,
      `> **项目**: ${project || 'Unknown'}`,
      branch ? `> **分支**: ${branch}` : null,
      `> **提交者**: ${author || 'Unknown'}`,
      `> **信息**: ${message || '(no message)'}`,
      commitHash ? `> **Hash**: ${commitHash.slice(0, 8)}` : null,
      `> **时间**: ${timestamp || new Date().toISOString()}`,
      ``,
      `**修改文件**:`,
      fileList,
      truncated
    ].filter(Boolean).join('\n');
  }

  /**
   * Format deployment notification
   */
  static formatDeployMessage(payload, success) {
    const { project, environment, version, url, error, timestamp } = payload;
    const icon = success ? '✅' : '❌';
    const status = success ? '部署成功' : '部署失败';

    return [
      `## ${icon} ${status}`,
      `> **项目**: ${project || 'Unknown'}`,
      environment ? `> **环境**: ${environment}` : null,
      version ? `> **版本**: ${version}` : null,
      url ? `> **地址**: ${url}` : null,
      !success && error ? `> **错误**: ${error}` : null,
      `> **时间**: ${timestamp || new Date().toISOString()}`
    ].filter(Boolean).join('\n');
  }

  /**
   * Send a test notification
   */
  static async sendTest(config) {
    const testPayload = {
      project: 'Test Project',
      message: 'This is a test notification / 这是一条测试通知',
      author: 'System',
      files: ['test.js'],
      timestamp: new Date().toISOString()
    };

    await NotificationService.send(config, 'git_commit', testPayload);
  }
}

export default NotificationService;
