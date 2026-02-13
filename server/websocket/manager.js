/**
 * WebSocket Client Connection Manager
 *
 * Extracted from server/index.js to reduce file size.
 * Manages per-user WebSocket connections and provides broadcast utilities.
 */

import { WebSocket } from 'ws';

// Map<userId, Set<WebSocket>> - per-user WebSocket connections
const connectedClients = new Map();

/**
 * Iterate over all connected WebSocket clients across all users.
 *
 * @param {(client: WebSocket, userId: string) => void} callback
 */
export function forEachClient(callback) {
  for (const [userId, wsSet] of connectedClients) {
    for (const client of wsSet) {
      callback(client, userId);
    }
  }
}

/**
 * Register a WebSocket under a userId.
 *
 * @param {string}    userId
 * @param {WebSocket} ws
 */
export function addConnectedClient(userId, ws) {
  if (!connectedClients.has(userId)) {
    connectedClients.set(userId, new Set());
  }
  connectedClients.get(userId).add(ws);
}

/**
 * Remove a WebSocket from a userId's connection set.
 * If the set becomes empty the userId key is deleted.
 *
 * @param {string}    userId
 * @param {WebSocket} ws
 */
export function removeConnectedClient(userId, ws) {
  const wsSet = connectedClients.get(userId);
  if (wsSet) {
    wsSet.delete(ws);
    if (wsSet.size === 0) {
      connectedClients.delete(userId);
    }
  }
}

/**
 * Broadcast a message to all connected WebSocket clients (all users).
 *
 * @param {string|object} message - String or JSON-serializable object
 */
export function broadcastToAll(message) {
  const messageStr = typeof message === 'string' ? message : JSON.stringify(message);
  forEachClient((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(messageStr);
    }
  });
}

/**
 * Broadcast a message to all WebSocket connections for a specific user.
 *
 * @param {string}        userId
 * @param {string|object} message - String or JSON-serializable object
 */
export function broadcastToUser(userId, message) {
  const wsSet = connectedClients.get(userId);
  if (!wsSet) return;
  const messageStr = typeof message === 'string' ? message : JSON.stringify(message);
  for (const client of wsSet) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(messageStr);
    }
  }
}

/**
 * Return the underlying Map so callers can inspect connection state.
 *
 * @returns {Map<string, Set<WebSocket>>}
 */
export function getConnectedClients() {
  return connectedClients;
}
