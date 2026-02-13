/**
 * Provider Registry - Central catalog of all available AI providers
 *
 * Provider types:
 * - 'claude-sdk': Uses @anthropic-ai/claude-agent-sdk (direct SDK)
 * - 'cursor-cli': Spawns cursor-agent subprocess
 * - 'codex-sdk': Uses @openai/codex-sdk
 * - 'openai-compatible': Generic OpenAI-compatible API (for Chinese AI models)
 * - 'wenxin': Baidu Wenxin/ERNIE Bot (non-standard API)
 */

export const PROVIDER_REGISTRY = {
  // === International Providers (existing) ===
  claude: {
    type: 'claude-sdk',
    label: 'Claude Code',
    labelZh: 'Claude Code',
    category: 'international',
    icon: 'claude',
    color: '#D97706'
  },
  cursor: {
    type: 'cursor-cli',
    label: 'Cursor',
    labelZh: 'Cursor',
    category: 'international',
    icon: 'cursor',
    color: '#6366F1'
  },
  codex: {
    type: 'codex-sdk',
    label: 'Codex',
    labelZh: 'Codex',
    category: 'international',
    icon: 'codex',
    color: '#10A37F'
  },

  // === Chinese AI Providers (OpenAI-compatible) ===
  kimi: {
    type: 'openai-compatible',
    baseURL: 'https://api.moonshot.cn/v1',
    label: 'Kimi',
    labelZh: 'Kimi (月之暗面)',
    category: 'chinese',
    icon: 'kimi',
    color: '#6C5CE7',
    envKey: 'MOONSHOT_API_KEY',
    credentialType: 'moonshot_api_key'
  },
  qwen: {
    type: 'openai-compatible',
    baseURL: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    label: 'Qwen',
    labelZh: '通义千问',
    category: 'chinese',
    icon: 'qwen',
    color: '#6149F6',
    envKey: 'DASHSCOPE_API_KEY',
    credentialType: 'dashscope_api_key'
  },
  deepseek: {
    type: 'openai-compatible',
    baseURL: 'https://api.deepseek.com/v1',
    label: 'DeepSeek',
    labelZh: 'DeepSeek (深度求索)',
    category: 'chinese',
    icon: 'deepseek',
    color: '#4D6BFE',
    envKey: 'DEEPSEEK_API_KEY',
    credentialType: 'deepseek_api_key'
  },
  glm: {
    type: 'openai-compatible',
    baseURL: 'https://open.bigmodel.cn/api/paas/v4',
    label: 'GLM',
    labelZh: '智谱 ChatGLM',
    category: 'chinese',
    icon: 'glm',
    color: '#3B82F6',
    envKey: 'ZHIPU_API_KEY',
    credentialType: 'zhipu_api_key'
  },
  doubao: {
    type: 'openai-compatible',
    baseURL: 'https://ark.cn-beijing.volces.com/api/v3',
    label: 'Doubao',
    labelZh: '豆包',
    category: 'chinese',
    icon: 'doubao',
    color: '#FF6B35',
    envKey: 'VOLCENGINE_API_KEY',
    credentialType: 'volcengine_api_key'
  },
  wenxin: {
    type: 'wenxin',
    label: 'Wenxin',
    labelZh: '文心一言',
    category: 'chinese',
    icon: 'wenxin',
    color: '#2468F2',
    envKey: 'BAIDU_API_KEY',
    envSecretKey: 'BAIDU_SECRET_KEY',
    credentialType: 'baidu_api_key'
  }
};

/**
 * Get all providers of a specific category
 */
export function getProvidersByCategory(category) {
  return Object.entries(PROVIDER_REGISTRY)
    .filter(([, config]) => config.category === category)
    .map(([id, config]) => ({ id, ...config }));
}

/**
 * Get all OpenAI-compatible providers
 */
export function getOpenAICompatibleProviders() {
  return Object.entries(PROVIDER_REGISTRY)
    .filter(([, config]) => config.type === 'openai-compatible')
    .map(([id, config]) => ({ id, ...config }));
}

/**
 * Check if a provider ID is valid
 */
export function isValidProvider(providerId) {
  return providerId in PROVIDER_REGISTRY;
}

/**
 * Get provider config by ID
 */
export function getProviderConfig(providerId) {
  return PROVIDER_REGISTRY[providerId] || null;
}
