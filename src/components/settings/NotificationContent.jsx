import { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Bell, Send, Trash2, CheckCircle, XCircle, Plus } from 'lucide-react';
import { authenticatedFetch } from '../../utils/api';
import { useTranslation } from 'react-i18next';

const EVENT_TYPES = [
  { key: 'git_commit', label: 'Git Commit' },
  { key: 'deploy_success', label: 'Deploy Success' },
  { key: 'deploy_failure', label: 'Deploy Failure' },
];

export default function NotificationContent() {
  const { t } = useTranslation('settings');
  const [configs, setConfigs] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newWebhookUrl, setNewWebhookUrl] = useState('');
  const [newEvents, setNewEvents] = useState([]);
  const [testingId, setTestingId] = useState(null);
  const [testResult, setTestResult] = useState(null);
  const [saving, setSaving] = useState(false);
  const [showLogs, setShowLogs] = useState(false);

  useEffect(() => {
    fetchConfigs();
  }, []);

  const fetchConfigs = async () => {
    try {
      setLoading(true);
      const res = await authenticatedFetch('/api/notifications/config');
      if (res.ok) {
        const data = await res.json();
        setConfigs(data.configs || []);
      }
    } catch (error) {
      console.error('Error fetching notification configs:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchLogs = async () => {
    try {
      const res = await authenticatedFetch('/api/notifications/log');
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs || []);
      }
    } catch (error) {
      console.error('Error fetching notification logs:', error);
    }
  };

  const handleAddConfig = async () => {
    if (!newWebhookUrl.trim() || newEvents.length === 0) return;

    setSaving(true);
    try {
      const res = await authenticatedFetch('/api/notifications/config', {
        method: 'POST',
        body: JSON.stringify({
          webhookUrl: newWebhookUrl,
          events: newEvents,
        }),
      });

      if (res.ok) {
        setNewWebhookUrl('');
        setNewEvents([]);
        setShowAddForm(false);
        fetchConfigs();
      }
    } catch (error) {
      console.error('Error adding notification config:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteConfig = async (id) => {
    if (!confirm(t('notifications.confirmDelete', 'Are you sure you want to delete this webhook?'))) return;

    try {
      const res = await authenticatedFetch(`/api/notifications/config/${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        fetchConfigs();
      }
    } catch (error) {
      console.error('Error deleting notification config:', error);
    }
  };

  const handleTestNotification = async (id) => {
    setTestingId(id);
    setTestResult(null);

    try {
      const res = await authenticatedFetch('/api/notifications/test', {
        method: 'POST',
        body: JSON.stringify({ configId: id }),
      });

      const data = await res.json();
      setTestResult({ id, success: data.success, message: data.message || (data.success ? 'Test sent successfully' : 'Test failed') });
    } catch (error) {
      setTestResult({ id, success: false, message: error.message });
    } finally {
      setTestingId(null);
    }
  };

  const toggleEvent = (eventKey) => {
    setNewEvents((prev) =>
      prev.includes(eventKey)
        ? prev.filter((e) => e !== eventKey)
        : [...prev, eventKey]
    );
  };

  const handleToggleLogs = () => {
    if (!showLogs) {
      fetchLogs();
    }
    setShowLogs(!showLogs);
  };

  if (loading) {
    return <div className="text-muted-foreground">{t('notifications.loading', 'Loading notification settings...')}</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          <h3 className="text-lg font-semibold">{t('notifications.title', 'WeChat Work Notifications')}</h3>
        </div>
        <Button
          size="sm"
          onClick={() => setShowAddForm(!showAddForm)}
        >
          <Plus className="h-4 w-4 mr-1" />
          {t('notifications.addWebhook', 'Add Webhook')}
        </Button>
      </div>

      <p className="text-sm text-muted-foreground">
        {t('notifications.description', 'Configure WeChat Work webhook URLs to receive notifications for git commits and deployments.')}
      </p>

      {/* Add Webhook Form */}
      {showAddForm && (
        <div className="p-4 border border-border rounded-lg bg-card space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              {t('notifications.webhookUrl', 'Webhook URL')}
            </label>
            <Input
              value={newWebhookUrl}
              onChange={(e) => setNewWebhookUrl(e.target.value)}
              placeholder="https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              {t('notifications.eventSubscriptions', 'Event Subscriptions')}
            </label>
            <div className="flex flex-wrap gap-3">
              {EVENT_TYPES.map((event) => (
                <label
                  key={event.key}
                  className="flex items-center gap-2 cursor-pointer select-none"
                >
                  <input
                    type="checkbox"
                    checked={newEvents.includes(event.key)}
                    onChange={() => toggleEvent(event.key)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-foreground">{event.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handleAddConfig}
              disabled={saving || !newWebhookUrl.trim() || newEvents.length === 0}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {saving ? t('notifications.saving', 'Saving...') : t('notifications.save', 'Save')}
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setShowAddForm(false);
                setNewWebhookUrl('');
                setNewEvents([]);
              }}
            >
              {t('notifications.cancel', 'Cancel')}
            </Button>
          </div>
        </div>
      )}

      {/* Existing Configs */}
      <div className="space-y-3">
        {configs.length === 0 ? (
          <p className="text-sm text-muted-foreground italic">
            {t('notifications.noWebhooks', 'No webhooks configured. Add one to start receiving notifications.')}
          </p>
        ) : (
          configs.map((config) => (
            <div
              key={config.id}
              className="p-4 border border-border rounded-lg bg-gray-50 dark:bg-gray-900/50 space-y-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-foreground truncate">
                    {config.webhookUrl}
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {(config.events || []).map((event) => (
                      <span
                        key={event}
                        className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
                      >
                        {event}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleTestNotification(config.id)}
                    disabled={testingId === config.id}
                  >
                    <Send className="h-3.5 w-3.5 mr-1" />
                    {testingId === config.id
                      ? t('notifications.testing', 'Testing...')
                      : t('notifications.test', 'Test')}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDeleteConfig(config.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Test Result */}
              {testResult && testResult.id === config.id && (
                <div
                  className={`flex items-center gap-2 text-sm px-3 py-2 rounded-md ${
                    testResult.success
                      ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-300'
                      : 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-300'
                  }`}
                >
                  {testResult.success ? (
                    <CheckCircle className="h-4 w-4 flex-shrink-0" />
                  ) : (
                    <XCircle className="h-4 w-4 flex-shrink-0" />
                  )}
                  <span>{testResult.message}</span>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Notification History */}
      <div className="border-t border-border pt-4">
        <button
          onClick={handleToggleLogs}
          className="text-sm text-blue-600 dark:text-blue-400 hover:underline font-medium"
        >
          {showLogs
            ? t('notifications.hideLogs', 'Hide notification history')
            : t('notifications.showLogs', 'Show notification history')}
        </button>

        {showLogs && (
          <div className="mt-3 space-y-2">
            {logs.length === 0 ? (
              <p className="text-sm text-muted-foreground italic">
                {t('notifications.noLogs', 'No notification history found.')}
              </p>
            ) : (
              logs.map((log, index) => (
                <div
                  key={log.id || index}
                  className="flex items-center justify-between p-3 border border-border rounded-lg text-sm"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    {log.success ? (
                      <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
                    )}
                    <div className="min-w-0">
                      <div className="font-medium text-foreground truncate">
                        {log.eventType || log.event_type}
                      </div>
                      {log.message && (
                        <div className="text-xs text-muted-foreground truncate">
                          {log.message}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground flex-shrink-0 ml-3">
                    {log.createdAt || log.created_at
                      ? new Date(log.createdAt || log.created_at).toLocaleString()
                      : ''}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
