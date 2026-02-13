/**
 * Notification Routes - Configure and manage webhook notifications
 */

import { Router } from 'express';
import { notificationDb } from '../database/db.js';
import NotificationService from '../services/notification.js';

const router = Router();

/**
 * GET /api/notifications/config
 * Get notification configurations for the current user
 */
router.get('/config', (req, res) => {
  try {
    const configs = notificationDb.getConfig(req.user.id);
    res.json({ configs });
  } catch (error) {
    console.error('Error getting notification config:', error);
    res.status(500).json({ error: 'Failed to get notification config' });
  }
});

/**
 * POST /api/notifications/config
 * Save a new notification webhook configuration
 */
router.post('/config', (req, res) => {
  try {
    const { webhookUrl, webhookType = 'wechat_work', events } = req.body;

    if (!webhookUrl) {
      return res.status(400).json({ error: 'webhookUrl is required' });
    }

    // Validate URL format
    try {
      new URL(webhookUrl);
    } catch {
      return res.status(400).json({ error: 'Invalid webhook URL format' });
    }

    const eventsStr = Array.isArray(events) ? events.join(',') : (events || 'git_commit,deploy_success,deploy_failure');
    const result = notificationDb.saveConfig(req.user.id, webhookUrl, webhookType, eventsStr);

    res.json({ success: true, id: result.id });
  } catch (error) {
    console.error('Error saving notification config:', error);
    res.status(500).json({ error: 'Failed to save notification config' });
  }
});

/**
 * PUT /api/notifications/config/:id
 * Update an existing notification configuration
 */
router.put('/config/:id', (req, res) => {
  try {
    const { webhookUrl, events } = req.body;
    const configId = parseInt(req.params.id);

    if (!webhookUrl) {
      return res.status(400).json({ error: 'webhookUrl is required' });
    }

    const eventsStr = Array.isArray(events) ? events.join(',') : events;
    const updated = notificationDb.updateConfig(req.user.id, configId, webhookUrl, eventsStr);

    if (!updated) {
      return res.status(404).json({ error: 'Configuration not found' });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error updating notification config:', error);
    res.status(500).json({ error: 'Failed to update notification config' });
  }
});

/**
 * DELETE /api/notifications/config/:id
 * Delete a notification configuration
 */
router.delete('/config/:id', (req, res) => {
  try {
    const configId = parseInt(req.params.id);
    const deleted = notificationDb.deleteConfig(req.user.id, configId);

    if (!deleted) {
      return res.status(404).json({ error: 'Configuration not found' });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting notification config:', error);
    res.status(500).json({ error: 'Failed to delete notification config' });
  }
});

/**
 * POST /api/notifications/test
 * Send a test notification to verify webhook configuration
 */
router.post('/test', async (req, res) => {
  try {
    const { configId } = req.body;

    const configs = notificationDb.getConfig(req.user.id);
    const config = configId
      ? configs.find(c => c.id === configId)
      : configs[0];

    if (!config) {
      return res.status(404).json({ error: 'No notification config found. Please add a webhook URL first.' });
    }

    await NotificationService.sendTest(config);
    notificationDb.addLog(req.user.id, 'test', { configId: config.id }, 'sent');

    res.json({ success: true, message: 'Test notification sent successfully' });
  } catch (error) {
    console.error('Error sending test notification:', error);
    notificationDb.addLog(req.user.id, 'test', {}, 'failed', error.message);
    res.status(500).json({ error: `Failed to send test notification: ${error.message}` });
  }
});

/**
 * GET /api/notifications/log
 * Get notification history
 */
router.get('/log', (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const offset = parseInt(req.query.offset) || 0;
    const logs = notificationDb.getLogs(req.user.id, limit, offset);

    res.json({ logs });
  } catch (error) {
    console.error('Error getting notification logs:', error);
    res.status(500).json({ error: 'Failed to get notification logs' });
  }
});

export default router;
