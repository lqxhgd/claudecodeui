import { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Key, Eye, EyeOff, Check, X, Trash2 } from 'lucide-react';
import { authenticatedFetch } from '../../utils/api';
import { useTranslation } from 'react-i18next';
import KimiLogo from '../KimiLogo';
import QwenLogo from '../QwenLogo';
import DeepSeekLogo from '../DeepSeekLogo';
import GLMLogo from '../GLMLogo';
import DoubaoLogo from '../DoubaoLogo';
import WenxinLogo from '../WenxinLogo';

const PROVIDER_CONFIGS = {
  kimi: {
    name: 'Kimi (Moonshot)',
    Logo: KimiLogo,
    colorDot: 'bg-purple-600',
    hasSecretKey: false,
  },
  qwen: {
    name: 'Qwen (Tongyi Qianwen)',
    Logo: QwenLogo,
    colorDot: 'bg-indigo-600',
    hasSecretKey: false,
  },
  deepseek: {
    name: 'DeepSeek',
    Logo: DeepSeekLogo,
    colorDot: 'bg-blue-600',
    hasSecretKey: false,
  },
  glm: {
    name: 'GLM (Zhipu AI)',
    Logo: GLMLogo,
    colorDot: 'bg-sky-500',
    hasSecretKey: false,
  },
  doubao: {
    name: 'Doubao (ByteDance)',
    Logo: DoubaoLogo,
    colorDot: 'bg-orange-500',
    hasSecretKey: false,
  },
  wenxin: {
    name: 'Wenxin (Baidu)',
    Logo: WenxinLogo,
    colorDot: 'bg-blue-500',
    hasSecretKey: true,
  },
};

export default function AIProvidersContent() {
  const { t } = useTranslation('settings');
  const [providers, setProviders] = useState({});
  const [loading, setLoading] = useState(true);
  const [apiKeys, setApiKeys] = useState({});
  const [secretKeys, setSecretKeys] = useState({});
  const [showKeys, setShowKeys] = useState({});
  const [showSecretKeys, setShowSecretKeys] = useState({});
  const [savingProvider, setSavingProvider] = useState(null);
  const [saveStatus, setSaveStatus] = useState({});

  useEffect(() => {
    fetchProviders();
  }, []);

  const fetchProviders = async () => {
    try {
      setLoading(true);
      const res = await authenticatedFetch('/api/ai-providers');
      if (res.ok) {
        const data = await res.json();
        const providerMap = {};
        (data.providers || []).forEach((p) => {
          providerMap[p.id] = p;
        });
        setProviders(providerMap);
      }
    } catch (error) {
      console.error('Error fetching AI providers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (providerId) => {
    const apiKey = apiKeys[providerId];
    if (!apiKey || !apiKey.trim()) return;

    setSavingProvider(providerId);
    setSaveStatus((prev) => ({ ...prev, [providerId]: null }));

    try {
      const body = { apiKey: apiKey.trim() };
      if (PROVIDER_CONFIGS[providerId]?.hasSecretKey && secretKeys[providerId]) {
        body.secretKey = secretKeys[providerId].trim();
      }

      const res = await authenticatedFetch(`/api/ai-providers/${providerId}/api-key`, {
        method: 'POST',
        body: JSON.stringify(body),
      });

      if (res.ok) {
        setSaveStatus((prev) => ({ ...prev, [providerId]: 'success' }));
        setApiKeys((prev) => ({ ...prev, [providerId]: '' }));
        setSecretKeys((prev) => ({ ...prev, [providerId]: '' }));
        fetchProviders();
        setTimeout(() => {
          setSaveStatus((prev) => ({ ...prev, [providerId]: null }));
        }, 2000);
      } else {
        setSaveStatus((prev) => ({ ...prev, [providerId]: 'error' }));
      }
    } catch (error) {
      console.error(`Error saving API key for ${providerId}:`, error);
      setSaveStatus((prev) => ({ ...prev, [providerId]: 'error' }));
    } finally {
      setSavingProvider(null);
    }
  };

  const handleRemove = async (providerId) => {
    if (!confirm(t('aiProviders.confirmRemove', 'Are you sure you want to remove this API key?'))) return;

    try {
      const res = await authenticatedFetch(`/api/ai-providers/${providerId}/api-key`, {
        method: 'DELETE',
      });

      if (res.ok) {
        fetchProviders();
      }
    } catch (error) {
      console.error(`Error removing API key for ${providerId}:`, error);
    }
  };

  const toggleShowKey = (providerId) => {
    setShowKeys((prev) => ({ ...prev, [providerId]: !prev[providerId] }));
  };

  const toggleShowSecretKey = (providerId) => {
    setShowSecretKeys((prev) => ({ ...prev, [providerId]: !prev[providerId] }));
  };

  if (loading) {
    return <div className="text-muted-foreground">{t('aiProviders.loading', 'Loading AI providers...')}</div>;
  }

  const providerIds = Object.keys(PROVIDER_CONFIGS);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Key className="h-5 w-5" />
        <h3 className="text-lg font-semibold">{t('aiProviders.title', 'Chinese AI Model Providers')}</h3>
      </div>

      <p className="text-sm text-muted-foreground">
        {t('aiProviders.description', 'Configure API keys for Chinese AI model providers. Keys are stored securely and used for model access.')}
      </p>

      {/* Provider List */}
      <div className="space-y-4">
        {providerIds.map((providerId) => {
          const config = PROVIDER_CONFIGS[providerId];
          const provider = providers[providerId];
          const isConfigured = provider?.configured || false;
          const Logo = config.Logo;

          return (
            <div
              key={providerId}
              className="p-4 border border-border rounded-lg bg-gray-50 dark:bg-gray-900/50 space-y-3"
            >
              {/* Provider Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Logo className="w-6 h-6" />
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${config.colorDot}`} />
                    <span className="font-medium text-foreground">{config.name}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {isConfigured ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                      <Check className="h-3 w-3 mr-1" />
                      {t('aiProviders.configured', 'Configured')}
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                      {t('aiProviders.notConfigured', 'Not configured')}
                    </span>
                  )}
                </div>
              </div>

              {/* API Key Input */}
              <div className="space-y-2">
                <div className="relative">
                  <Input
                    type={showKeys[providerId] ? 'text' : 'password'}
                    value={apiKeys[providerId] || ''}
                    onChange={(e) =>
                      setApiKeys((prev) => ({ ...prev, [providerId]: e.target.value }))
                    }
                    placeholder={
                      isConfigured
                        ? t('aiProviders.keyPlaceholderConfigured', 'Enter new API key to update...')
                        : t('aiProviders.keyPlaceholder', 'Enter API key...')
                    }
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => toggleShowKey(providerId)}
                    className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground"
                  >
                    {showKeys[providerId] ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>

                {/* Secret Key for Wenxin */}
                {config.hasSecretKey && (
                  <div className="relative">
                    <Input
                      type={showSecretKeys[providerId] ? 'text' : 'password'}
                      value={secretKeys[providerId] || ''}
                      onChange={(e) =>
                        setSecretKeys((prev) => ({
                          ...prev,
                          [providerId]: e.target.value,
                        }))
                      }
                      placeholder={t('aiProviders.secretKeyPlaceholder', 'Enter Secret Key...')}
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => toggleShowSecretKey(providerId)}
                      className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground"
                    >
                      {showSecretKeys[providerId] ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  onClick={() => handleSave(providerId)}
                  disabled={
                    savingProvider === providerId ||
                    !apiKeys[providerId] ||
                    !apiKeys[providerId].trim()
                  }
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {savingProvider === providerId
                    ? t('aiProviders.saving', 'Saving...')
                    : t('aiProviders.save', 'Save')}
                </Button>

                {isConfigured && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleRemove(providerId)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    {t('aiProviders.remove', 'Remove')}
                  </Button>
                )}

                {/* Save Status */}
                {saveStatus[providerId] === 'success' && (
                  <span className="flex items-center gap-1 text-sm text-green-600 dark:text-green-400">
                    <Check className="h-4 w-4" />
                    {t('aiProviders.saved', 'Saved')}
                  </span>
                )}
                {saveStatus[providerId] === 'error' && (
                  <span className="flex items-center gap-1 text-sm text-red-600 dark:text-red-400">
                    <X className="h-4 w-4" />
                    {t('aiProviders.saveFailed', 'Save failed')}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
