/**
 * Centralized Model Definitions
 * Single source of truth for all supported AI models
 */

/**
 * Claude (Anthropic) Models
 *
 * Note: Claude uses two different formats:
 * - SDK format ('sonnet', 'opus') - used by the UI and claude-sdk.js
 * - API format ('claude-sonnet-4.5') - used by slash commands for display
 */
export const CLAUDE_MODELS = {
  // Models in SDK format (what the actual SDK accepts)
  OPTIONS: [
    { value: 'sonnet', label: 'Sonnet' },
    { value: 'opus', label: 'Opus' },
    { value: 'haiku', label: 'Haiku' },
    { value: 'opusplan', label: 'Opus Plan' },
    { value: 'sonnet[1m]', label: 'Sonnet [1M]' }
  ],

  DEFAULT: 'sonnet'
};

/**
 * Cursor Models
 */
export const CURSOR_MODELS = {
  OPTIONS: [
    { value: 'gpt-5.2-high', label: 'GPT-5.2 High' },
    { value: 'gemini-3-pro', label: 'Gemini 3 Pro' },
    { value: 'opus-4.5-thinking', label: 'Claude 4.5 Opus (Thinking)' },
    { value: 'gpt-5.2', label: 'GPT-5.2' },
    { value: 'gpt-5.1', label: 'GPT-5.1' },
    { value: 'gpt-5.1-high', label: 'GPT-5.1 High' },
    { value: 'composer-1', label: 'Composer 1' },
    { value: 'auto', label: 'Auto' },
    { value: 'sonnet-4.5', label: 'Claude 4.5 Sonnet' },
    { value: 'sonnet-4.5-thinking', label: 'Claude 4.5 Sonnet (Thinking)' },
    { value: 'opus-4.5', label: 'Claude 4.5 Opus' },
    { value: 'gpt-5.1-codex', label: 'GPT-5.1 Codex' },
    { value: 'gpt-5.1-codex-high', label: 'GPT-5.1 Codex High' },
    { value: 'gpt-5.1-codex-max', label: 'GPT-5.1 Codex Max' },
    { value: 'gpt-5.1-codex-max-high', label: 'GPT-5.1 Codex Max High' },
    { value: 'opus-4.1', label: 'Claude 4.1 Opus' },
    { value: 'grok', label: 'Grok' }
  ],

  DEFAULT: 'gpt-5'
};

/**
 * Codex (OpenAI) Models
 */
export const CODEX_MODELS = {
  OPTIONS: [
    { value: 'gpt-5.2', label: 'GPT-5.2' },
    { value: 'gpt-5.1-codex-max', label: 'GPT-5.1 Codex Max' },
    { value: 'o3', label: 'O3' },
    { value: 'o4-mini', label: 'O4-mini' }
  ],

  DEFAULT: 'gpt-5.2'
};

// ============================================
// Chinese AI Models (国产大模型)
// ============================================

/**
 * Kimi (Moonshot AI / 月之暗面) Models
 */
export const KIMI_MODELS = {
  OPTIONS: [
    { value: 'moonshot-v1-8k', label: 'Moonshot V1 8K' },
    { value: 'moonshot-v1-32k', label: 'Moonshot V1 32K' },
    { value: 'moonshot-v1-128k', label: 'Moonshot V1 128K' }
  ],
  DEFAULT: 'moonshot-v1-32k'
};

/**
 * Qwen (通义千问 / DashScope) Models
 */
export const QWEN_MODELS = {
  OPTIONS: [
    { value: 'qwen-max', label: 'Qwen Max' },
    { value: 'qwen-plus', label: 'Qwen Plus' },
    { value: 'qwen-turbo', label: 'Qwen Turbo' },
    { value: 'qwen-long', label: 'Qwen Long' },
    { value: 'qwen2.5-72b-instruct', label: 'Qwen 2.5 72B' },
    { value: 'qwen2.5-32b-instruct', label: 'Qwen 2.5 32B' },
    { value: 'qwen2.5-coder-32b-instruct', label: 'Qwen 2.5 Coder 32B' }
  ],
  DEFAULT: 'qwen-plus'
};

/**
 * DeepSeek (深度求索) Models
 */
export const DEEPSEEK_MODELS = {
  OPTIONS: [
    { value: 'deepseek-chat', label: 'DeepSeek Chat (V3)' },
    { value: 'deepseek-reasoner', label: 'DeepSeek Reasoner (R1)' }
  ],
  DEFAULT: 'deepseek-chat'
};

/**
 * GLM (智谱 ChatGLM) Models
 */
export const GLM_MODELS = {
  OPTIONS: [
    { value: 'glm-4-plus', label: 'GLM-4 Plus' },
    { value: 'glm-4-0520', label: 'GLM-4 0520' },
    { value: 'glm-4-flash', label: 'GLM-4 Flash' },
    { value: 'glm-4-long', label: 'GLM-4 Long' },
    { value: 'glm-4-airx', label: 'GLM-4 AirX' }
  ],
  DEFAULT: 'glm-4-flash'
};

/**
 * Doubao (豆包 / Volcengine) Models
 */
export const DOUBAO_MODELS = {
  OPTIONS: [
    { value: 'doubao-pro-256k', label: 'Doubao Pro 256K' },
    { value: 'doubao-pro-128k', label: 'Doubao Pro 128K' },
    { value: 'doubao-pro-32k', label: 'Doubao Pro 32K' },
    { value: 'doubao-lite-128k', label: 'Doubao Lite 128K' },
    { value: 'doubao-lite-32k', label: 'Doubao Lite 32K' }
  ],
  DEFAULT: 'doubao-pro-32k'
};

/**
 * Wenxin (文心一言 / Baidu ERNIE) Models
 */
export const WENXIN_MODELS = {
  OPTIONS: [
    { value: 'ernie-4.0-8k', label: 'ERNIE 4.0 8K' },
    { value: 'ernie-4.0-turbo-8k', label: 'ERNIE 4.0 Turbo' },
    { value: 'ernie-3.5-8k', label: 'ERNIE 3.5 8K' },
    { value: 'ernie-3.5-128k', label: 'ERNIE 3.5 128K' },
    { value: 'ernie-speed-8k', label: 'ERNIE Speed 8K' },
    { value: 'ernie-speed-128k', label: 'ERNIE Speed 128K' },
    { value: 'ernie-lite-8k', label: 'ERNIE Lite 8K' },
    { value: 'ernie-tiny-8k', label: 'ERNIE Tiny 8K' }
  ],
  DEFAULT: 'ernie-4.0-8k'
};

/**
 * All Chinese model constants grouped by provider ID
 */
export const CHINESE_MODELS = {
  kimi: KIMI_MODELS,
  qwen: QWEN_MODELS,
  deepseek: DEEPSEEK_MODELS,
  glm: GLM_MODELS,
  doubao: DOUBAO_MODELS,
  wenxin: WENXIN_MODELS
};

/**
 * Get models for a given provider
 */
export function getModelsForProvider(providerId) {
  const map = {
    claude: CLAUDE_MODELS,
    cursor: CURSOR_MODELS,
    codex: CODEX_MODELS,
    kimi: KIMI_MODELS,
    qwen: QWEN_MODELS,
    deepseek: DEEPSEEK_MODELS,
    glm: GLM_MODELS,
    doubao: DOUBAO_MODELS,
    wenxin: WENXIN_MODELS
  };
  return map[providerId] || null;
}