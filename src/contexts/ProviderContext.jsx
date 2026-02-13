import { createContext, useContext, useState, useCallback } from 'react';

const ProviderContext = createContext(null);

// Chinese AI provider IDs
const CHINESE_PROVIDERS = ['kimi', 'qwen', 'deepseek', 'glm', 'doubao', 'wenxin'];
const ALL_PROVIDERS = ['claude', 'cursor', 'codex', ...CHINESE_PROVIDERS];

export function ProviderProvider({ children }) {
  const [provider, setProviderState] = useState(() => {
    return localStorage.getItem('selected-provider') || 'claude';
  });

  const setProvider = useCallback((newProvider) => {
    setProviderState(newProvider);
    localStorage.setItem('selected-provider', newProvider);
  }, []);

  // Per-provider model selection
  const getModel = useCallback((providerId) => {
    return localStorage.getItem(`${providerId}-model`) || null;
  }, []);

  const setModel = useCallback((providerId, model) => {
    localStorage.setItem(`${providerId}-model`, model);
  }, []);

  const isChineseProvider = CHINESE_PROVIDERS.includes(provider);

  const value = {
    provider,
    setProvider,
    getModel,
    setModel,
    isChineseProvider,
    CHINESE_PROVIDERS,
    ALL_PROVIDERS
  };

  return (
    <ProviderContext.Provider value={value}>
      {children}
    </ProviderContext.Provider>
  );
}

export function useProvider() {
  const context = useContext(ProviderContext);
  if (!context) {
    throw new Error('useProvider must be used within a ProviderProvider');
  }
  return context;
}

export default ProviderContext;
