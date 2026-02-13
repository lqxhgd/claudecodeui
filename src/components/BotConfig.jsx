import React, { useState, useEffect, useCallback } from 'react';

const API_BASE = '';

async function apiRequest(url, options = {}) {
  const token = localStorage.getItem('auth_token');
  const res = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...options.headers,
    },
  });
  return res.json();
}

const PLATFORMS = [
  { id: 'dingtalk', name: '\u9489\u9489 DingTalk', icon: '\uD83E\uDD16' },
  { id: 'wechat_work', name: '\u4F01\u4E1A\u5FAE\u4FE1 WeChat Work', icon: '\uD83D\uDCAC' },
];

export default function BotConfig() {
  const [activePlatform, setActivePlatform] = useState('dingtalk');
  const [configs, setConfigs] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [testResult, setTestResult] = useState(null);
  const [testing, setTesting] = useState(false);
  const [formData, setFormData] = useState({
    platform: 'dingtalk',
    botName: 'Claude Bot',
    appKey: '',
    appSecret: '',
    webhookToken: '',
    webhookUrl: '',
    replyWebhookUrl: '',
    cwd: '',
    model: 'sonnet',
  });
  const [editingId, setEditingId] = useState(null);

  const loadData = useCallback(async () => {
    try {
      const [configRes, sessionRes] = await Promise.all([
        apiRequest('/api/bot/config'),
        apiRequest('/api/bot/sessions'),
      ]);
      setConfigs(configRes.configs || []);
      setSessions(sessionRes.sessions || []);
    } catch (e) {
      console.error('Failed to load bot config:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleSave = async () => {
    const payload = { ...formData, platform: activePlatform };
    if (editingId) {
      await apiRequest(`/api/bot/config/${editingId}`, { method: 'PUT', body: JSON.stringify(payload) });
    } else {
      await apiRequest('/api/bot/config', { method: 'POST', body: JSON.stringify(payload) });
    }
    setEditingId(null);
    setFormData({ platform: activePlatform, botName: 'Claude Bot', appKey: '', appSecret: '', webhookToken: '', webhookUrl: '', replyWebhookUrl: '', cwd: '', model: 'sonnet' });
    loadData();
  };

  const handleDelete = async (id) => {
    if (!confirm('\u786E\u8BA4\u5220\u9664\uFF1F')) return;
    await apiRequest(`/api/bot/config/${id}`, { method: 'DELETE' });
    loadData();
  };

  const handleEdit = (config) => {
    setEditingId(config.id);
    setActivePlatform(config.platform);
    setFormData({
      platform: config.platform,
      botName: config.bot_name,
      appKey: config.app_key || '',
      appSecret: config.app_secret || '',
      webhookToken: config.webhook_token || '',
      webhookUrl: config.webhook_url || '',
      replyWebhookUrl: config.reply_webhook_url || '',
      cwd: config.cwd || '',
      model: config.model || 'sonnet',
    });
  };

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await apiRequest('/api/bot/test', {
        method: 'POST',
        body: JSON.stringify({ platform: activePlatform, message: '\u4F60\u597D\uFF0C\u6D4B\u8BD5\u673A\u5668\u4EBA\u8FDE\u63A5' }),
      });
      setTestResult(res);
    } catch (e) {
      setTestResult({ error: e.message });
    } finally {
      setTesting(false);
    }
  };

  const serverUrl = window.location.origin;
  const platformConfigs = configs.filter(c => c.platform === activePlatform);

  if (loading) {
    return <div className="flex items-center justify-center py-12 text-gray-400">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Bot Integration / \u673A\u5668\u4EBA\u96C6\u6210
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Connect DingTalk or WeChat Work bots to send messages and get AI responses.
          <br />
          \u8FDE\u63A5\u9489\u9489\u6216\u4F01\u4E1A\u5FAE\u4FE1\u673A\u5668\u4EBA\uFF0C\u53D1\u9001\u6D88\u606F\u83B7\u53D6AI\u56DE\u590D\u3002
        </p>
      </div>

      {/* Platform Tabs */}
      <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700 pb-2">
        {PLATFORMS.map(p => (
          <button
            key={p.id}
            onClick={() => { setActivePlatform(p.id); setEditingId(null); }}
            className={`px-4 py-2 rounded-t-lg text-sm font-medium transition-colors ${
              activePlatform === p.id
                ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border-b-2 border-blue-500'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            {p.icon} {p.name}
          </button>
        ))}
      </div>

      {/* Webhook URL Info */}
      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
        <p className="text-sm font-medium text-blue-800 dark:text-blue-300 mb-1">
          Webhook URL ({'\u914D\u7F6E\u5230'}{activePlatform === 'dingtalk' ? '\u9489\u9489' : '\u4F01\u4E1A\u5FAE\u4FE1'}{'\u540E\u53F0'}):
        </p>
        <code className="text-xs bg-white dark:bg-gray-800 px-3 py-1.5 rounded block mt-1 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700 select-all">
          {serverUrl}/api/bot/{activePlatform === 'dingtalk' ? 'dingtalk' : 'wechat'}/webhook
        </code>
        <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">
          {activePlatform === 'dingtalk'
            ? '\u5728\u9489\u9489\u5F00\u653E\u5E73\u53F0 \u2192 \u673A\u5668\u4EBA\u7BA1\u7406 \u2192 \u6D88\u606F\u63A5\u6536\u5730\u5740\u4E2D\u586B\u5165\u6B64URL'
            : '\u5728\u4F01\u4E1A\u5FAE\u4FE1\u7BA1\u7406\u540E\u53F0 \u2192 \u5E94\u7528\u7BA1\u7406 \u2192 \u63A5\u6536\u6D88\u606F\u8BBE\u7F6E\u4E2D\u586B\u5165\u6B64URL'}
        </p>
      </div>

      {/* Configuration Form */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
          {editingId ? '\u7F16\u8F91\u914D\u7F6E / Edit Config' : '\u65B0\u589E\u914D\u7F6E / Add Config'}
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">{'\u673A\u5668\u4EBA\u540D\u79F0'} / Bot Name</label>
            <input
              type="text"
              value={formData.botName}
              onChange={e => setFormData(f => ({ ...f, botName: e.target.value }))}
              className="w-full px-3 py-2 text-sm rounded-lg bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500/40 focus:outline-none"
              placeholder="Claude Bot"
            />
          </div>

          {activePlatform === 'dingtalk' && (
            <>
              <div>
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">App Key</label>
                <input
                  type="text"
                  value={formData.appKey}
                  onChange={e => setFormData(f => ({ ...f, appKey: e.target.value }))}
                  className="w-full px-3 py-2 text-sm rounded-lg bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500/40 focus:outline-none"
                  placeholder="dingtalk app key"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">App Secret ({'\u7B7E\u540D\u9A8C\u8BC1'})</label>
                <input
                  type="password"
                  value={formData.appSecret}
                  onChange={e => setFormData(f => ({ ...f, appSecret: e.target.value }))}
                  className="w-full px-3 py-2 text-sm rounded-lg bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500/40 focus:outline-none"
                  placeholder="SEC..."
                />
              </div>
            </>
          )}

          {activePlatform === 'wechat_work' && (
            <>
              <div>
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Webhook URL ({'\u63A5\u6536\u6D88\u606F'})</label>
                <input
                  type="text"
                  value={formData.webhookUrl}
                  onChange={e => setFormData(f => ({ ...f, webhookUrl: e.target.value }))}
                  className="w-full px-3 py-2 text-sm rounded-lg bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500/40 focus:outline-none"
                  placeholder="https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=xxx"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Reply Webhook URL ({'\u56DE\u590D\u6D88\u606F'})</label>
                <input
                  type="text"
                  value={formData.replyWebhookUrl}
                  onChange={e => setFormData(f => ({ ...f, replyWebhookUrl: e.target.value }))}
                  className="w-full px-3 py-2 text-sm rounded-lg bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500/40 focus:outline-none"
                  placeholder="https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=xxx"
                />
              </div>
            </>
          )}

          <div>
            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">{'\u5DE5\u4F5C\u76EE\u5F55'} / Working Directory</label>
            <input
              type="text"
              value={formData.cwd}
              onChange={e => setFormData(f => ({ ...f, cwd: e.target.value }))}
              className="w-full px-3 py-2 text-sm rounded-lg bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500/40 focus:outline-none"
              placeholder="/path/to/project"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">{'\u6A21\u578B'} / Model</label>
            <select
              value={formData.model}
              onChange={e => setFormData(f => ({ ...f, model: e.target.value }))}
              className="w-full px-3 py-2 text-sm rounded-lg bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500/40 focus:outline-none"
            >
              <option value="sonnet">Sonnet</option>
              <option value="opus">Opus</option>
              <option value="haiku">Haiku</option>
            </select>
          </div>
        </div>

        <div className="flex gap-2 mt-4">
          <button
            onClick={handleSave}
            className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            {editingId ? '\u66F4\u65B0 / Update' : '\u4FDD\u5B58 / Save'}
          </button>
          {editingId && (
            <button
              onClick={() => { setEditingId(null); setFormData({ platform: activePlatform, botName: 'Claude Bot', appKey: '', appSecret: '', webhookToken: '', webhookUrl: '', replyWebhookUrl: '', cwd: '', model: 'sonnet' }); }}
              className="px-4 py-2 text-sm font-medium bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
            >
              {'\u53D6\u6D88'} / Cancel
            </button>
          )}
          <button
            onClick={handleTest}
            disabled={testing}
            className="px-4 py-2 text-sm font-medium bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
          >
            {testing ? '\u6D4B\u8BD5\u4E2D...' : '\u6D4B\u8BD5\u8FDE\u63A5 / Test'}
          </button>
        </div>

        {testResult && (
          <div className={`mt-3 p-3 rounded-lg text-sm ${
            testResult.error
              ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800'
              : 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800'
          }`}>
            {testResult.error
              ? `Error: ${testResult.error}`
              : `Response: ${testResult.response?.slice(0, 200)}${testResult.response?.length > 200 ? '...' : ''}`
            }
          </div>
        )}
      </div>

      {/* Existing Configs */}
      {platformConfigs.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
            {'\u5DF2\u914D\u7F6E'} / Configured Bots ({platformConfigs.length})
          </h4>
          <div className="space-y-2">
            {platformConfigs.map(config => (
              <div key={config.id} className="flex items-center justify-between bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
                <div>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">{config.bot_name}</span>
                  <span className={`ml-2 text-xs px-2 py-0.5 rounded-full ${config.is_active ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 'bg-gray-100 dark:bg-gray-700 text-gray-500'}`}>
                    {config.is_active ? 'Active' : 'Inactive'}
                  </span>
                  {config.cwd && <span className="ml-2 text-xs text-gray-400">{config.cwd}</span>}
                  <span className="ml-2 text-xs text-gray-400">Model: {config.model}</span>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => handleEdit(config)} className="px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded hover:bg-blue-200 dark:hover:bg-blue-900/50">{'\u7F16\u8F91'}</button>
                  <button onClick={() => handleDelete(config.id)} className="px-2 py-1 text-xs bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded hover:bg-red-200 dark:hover:bg-red-900/50">{'\u5220\u9664'}</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Active Sessions */}
      {sessions.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
            {'\u6D3B\u8DC3\u4F1A\u8BDD'} / Active Sessions ({sessions.length})
          </h4>
          <div className="space-y-1">
            {sessions.map((s, i) => (
              <div key={i} className="flex items-center justify-between text-xs bg-gray-50 dark:bg-gray-800 rounded px-3 py-2">
                <span className="text-gray-600 dark:text-gray-400">
                  {s.platform} | {s.userId} | Last: {new Date(s.lastActive).toLocaleTimeString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Setup Instructions */}
      <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
          {activePlatform === 'dingtalk' ? '\u9489\u9489\u673A\u5668\u4EBA\u914D\u7F6E\u6B65\u9AA4' : '\u4F01\u4E1A\u5FAE\u4FE1\u673A\u5668\u4EBA\u914D\u7F6E\u6B65\u9AA4'}
        </h4>
        {activePlatform === 'dingtalk' ? (
          <ol className="text-xs text-gray-500 dark:text-gray-400 space-y-1 list-decimal list-inside">
            <li>{'\u767B\u5F55\u9489\u9489\u5F00\u653E\u5E73\u53F0'} (open.dingtalk.com)</li>
            <li>{'\u521B\u5EFA\u4F01\u4E1A\u5185\u90E8\u5E94\u7528 \u2192 \u673A\u5668\u4EBA'}</li>
            <li>{'\u5728\u6D88\u606F\u63A5\u6536\u6A21\u5F0F\u4E2D\u9009\u62E9 HTTP \u6A21\u5F0F'}</li>
            <li>{'\u586B\u5165\u4E0A\u65B9 Webhook URL \u4F5C\u4E3A\u6D88\u606F\u63A5\u6536\u5730\u5740'}</li>
            <li>{'\u590D\u5236 App Key \u548C App Secret \u586B\u5165\u4E0A\u65B9\u8868\u5355'}</li>
            <li>{'\u53D1\u5E03\u673A\u5668\u4EBA\uFF0C\u5728\u7FA4\u4E2D @\u673A\u5668\u4EBA \u53D1\u9001\u6D88\u606F\u5373\u53EF'}</li>
          </ol>
        ) : (
          <ol className="text-xs text-gray-500 dark:text-gray-400 space-y-1 list-decimal list-inside">
            <li>{'\u767B\u5F55\u4F01\u4E1A\u5FAE\u4FE1\u7BA1\u7406\u540E\u53F0'} (work.weixin.qq.com)</li>
            <li>{'\u5E94\u7528\u7BA1\u7406 \u2192 \u521B\u5EFA\u5E94\u7528 \u6216 \u4F7F\u7528\u7FA4\u673A\u5668\u4EBA'}</li>
            <li>{'\u8BBE\u7F6E\u63A5\u6536\u6D88\u606F\u7684 URL \u4E3A\u4E0A\u65B9 Webhook URL'}</li>
            <li>{'\u83B7\u53D6\u7FA4\u673A\u5668\u4EBA\u7684 Webhook Key \u586B\u5165\u8868\u5355'}</li>
            <li>{'\u5728\u7FA4\u4E2D @\u673A\u5668\u4EBA \u53D1\u9001\u6D88\u606F\u5373\u53EF'}</li>
          </ol>
        )}
      </div>
    </div>
  );
}
