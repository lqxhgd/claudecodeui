/**
 * Mock AI provider responses for testing
 */
export function createMockWebSocket() {
  const messages = [];
  return {
    send: (data) => {
      messages.push(typeof data === 'string' ? JSON.parse(data) : data);
    },
    getMessages: () => messages,
    getLastMessage: () => messages[messages.length - 1],
    clear: () => { messages.length = 0; }
  };
}

export const mockStreamResponse = {
  choices: [{
    delta: { content: 'Hello, world!' },
    finish_reason: null
  }]
};

export const mockCompleteResponse = {
  choices: [{
    delta: {},
    finish_reason: 'stop'
  }],
  usage: {
    prompt_tokens: 10,
    completion_tokens: 20,
    total_tokens: 30
  }
};
