/**
 * BaseProvider - Abstract interface for all AI providers
 *
 * All providers (Claude SDK, Cursor CLI, Codex, OpenAI-compatible, Wenxin)
 * must implement this interface to ensure consistent behavior.
 */
export class BaseProvider {
  constructor(config) {
    this.config = config;
    this.activeSessions = new Map(); // sessionId -> session data
  }

  /**
   * Send a query to the AI provider and stream responses via WebSocket
   * @param {string} command - The user's prompt/message
   * @param {object} options - Provider-specific options
   * @param {object} options.sessionId - Session ID to resume (optional)
   * @param {string} options.cwd - Working directory
   * @param {string} options.model - Model to use
   * @param {number} options.userId - User who initiated the request
   * @param {object} ws - WebSocket writer for streaming responses
   * @returns {Promise<void>}
   */
  async query(command, options, ws) {
    throw new Error('query() must be implemented by subclass');
  }

  /**
   * Abort an active session
   * @param {string} sessionId - Session to abort
   * @returns {Promise<boolean>} Whether the abort was successful
   */
  async abort(sessionId) {
    throw new Error('abort() must be implemented by subclass');
  }

  /**
   * Check if a session is currently active/processing
   * @param {string} sessionId
   * @returns {boolean}
   */
  isActive(sessionId) {
    return this.activeSessions.has(sessionId);
  }

  /**
   * Get all active session IDs
   * @returns {string[]}
   */
  getActiveSessions() {
    return Array.from(this.activeSessions.keys());
  }

  /**
   * Add a session to the active tracking
   * @param {string} sessionId
   * @param {*} sessionData - Provider-specific session data (query, process, etc.)
   */
  addSession(sessionId, sessionData) {
    this.activeSessions.set(sessionId, sessionData);
  }

  /**
   * Remove a session from active tracking
   * @param {string} sessionId
   */
  removeSession(sessionId) {
    this.activeSessions.delete(sessionId);
  }
}
