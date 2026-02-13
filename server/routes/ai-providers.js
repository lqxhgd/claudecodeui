/**
 * AI Providers Routes - List available providers and their models
 */

import { Router } from 'express';
import { PROVIDER_REGISTRY, getProvidersByCategory, getProviderConfig } from '../providers/registry.js';
import { getModelsForProvider } from '../../shared/modelConstants.js';
import { credentialsDb } from '../database/db.js';

const router = Router();

/**
 * GET /api/ai-providers
 * List all available AI providers with their availability status
 */
router.get('/', (req, res) => {
  try {
    const providers = Object.entries(PROVIDER_REGISTRY).map(([id, config]) => {
      // Check if provider has API key configured
      let hasApiKey = false;

      if (config.type === 'claude-sdk' || config.type === 'cursor-cli' || config.type === 'codex-sdk') {
        // International providers - always available (use their own auth)
        hasApiKey = true;
      } else if (config.credentialType) {
        // Chinese providers - check user credentials or env vars
        const userKey = credentialsDb.getActiveCredential(req.user.id, config.credentialType);
        const envKey = config.envKey ? process.env[config.envKey] : null;
        hasApiKey = !!(userKey || envKey);
      }

      return {
        id,
        label: config.label,
        labelZh: config.labelZh,
        category: config.category,
        type: config.type,
        icon: config.icon,
        color: config.color,
        available: hasApiKey
      };
    });

    res.json({
      providers,
      categories: {
        international: getProvidersByCategory('international').map(p => p.id),
        chinese: getProvidersByCategory('chinese').map(p => p.id)
      }
    });
  } catch (error) {
    console.error('Error listing AI providers:', error);
    res.status(500).json({ error: 'Failed to list providers' });
  }
});

/**
 * GET /api/ai-providers/:providerId/models
 * Get available models for a specific provider
 */
router.get('/:providerId/models', (req, res) => {
  try {
    const { providerId } = req.params;
    const config = getProviderConfig(providerId);

    if (!config) {
      return res.status(404).json({ error: `Provider '${providerId}' not found` });
    }

    const models = getModelsForProvider(providerId);
    if (!models) {
      return res.status(404).json({ error: `No models defined for provider '${providerId}'` });
    }

    res.json({
      providerId,
      label: config.label,
      models: models.OPTIONS,
      defaultModel: models.DEFAULT
    });
  } catch (error) {
    console.error('Error getting provider models:', error);
    res.status(500).json({ error: 'Failed to get provider models' });
  }
});

/**
 * POST /api/ai-providers/:providerId/api-key
 * Save API key for a Chinese AI provider
 */
router.post('/:providerId/api-key', (req, res) => {
  try {
    const { providerId } = req.params;
    const { apiKey, secretKey } = req.body;
    const config = getProviderConfig(providerId);

    if (!config) {
      return res.status(404).json({ error: `Provider '${providerId}' not found` });
    }

    if (!config.credentialType) {
      return res.status(400).json({ error: 'This provider does not use API keys' });
    }

    if (!apiKey) {
      return res.status(400).json({ error: 'apiKey is required' });
    }

    // Save main API key
    credentialsDb.createCredential(
      req.user.id,
      `${config.label} API Key`,
      config.credentialType,
      apiKey,
      `API key for ${config.label}`
    );

    // Save secret key if applicable (Wenxin needs both)
    if (secretKey && providerId === 'wenxin') {
      credentialsDb.createCredential(
        req.user.id,
        `${config.label} Secret Key`,
        'baidu_secret_key',
        secretKey,
        'Secret key for Wenxin'
      );
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error saving API key:', error);
    res.status(500).json({ error: 'Failed to save API key' });
  }
});

/**
 * DELETE /api/ai-providers/:providerId/api-key
 * Remove API key for a Chinese AI provider
 */
router.delete('/:providerId/api-key', (req, res) => {
  try {
    const { providerId } = req.params;
    const config = getProviderConfig(providerId);

    if (!config || !config.credentialType) {
      return res.status(404).json({ error: 'Provider not found' });
    }

    // Get and delete all credentials of this type
    const credentials = credentialsDb.getCredentials(req.user.id, config.credentialType);
    for (const cred of credentials) {
      credentialsDb.deleteCredential(req.user.id, cred.id);
    }

    // Also delete secret key for Wenxin
    if (providerId === 'wenxin') {
      const secretCreds = credentialsDb.getCredentials(req.user.id, 'baidu_secret_key');
      for (const cred of secretCreds) {
        credentialsDb.deleteCredential(req.user.id, cred.id);
      }
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting API key:', error);
    res.status(500).json({ error: 'Failed to delete API key' });
  }
});

/**
 * GET /api/ai-providers/:providerId/api-key/status
 * Check if API key is configured for a provider
 */
router.get('/:providerId/api-key/status', (req, res) => {
  try {
    const { providerId } = req.params;
    const config = getProviderConfig(providerId);

    if (!config) {
      return res.status(404).json({ error: 'Provider not found' });
    }

    let configured = false;
    if (config.credentialType) {
      const userKey = credentialsDb.getActiveCredential(req.user.id, config.credentialType);
      const envKey = config.envKey ? process.env[config.envKey] : null;
      configured = !!(userKey || envKey);
    }

    res.json({ providerId, configured });
  } catch (error) {
    console.error('Error checking API key status:', error);
    res.status(500).json({ error: 'Failed to check API key status' });
  }
});

export default router;
