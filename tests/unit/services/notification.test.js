import { describe, test, expect } from '@jest/globals';
import { NotificationService } from '../../../server/services/notification.js';

describe('NotificationService', () => {
  test('formatCommitMessage should format correctly', () => {
    const message = NotificationService.formatCommitMessage({
      project: 'my-project',
      message: 'fix: resolve login bug',
      files: ['src/auth.js', 'src/login.jsx'],
      author: 'developer',
      branch: 'main',
      commitHash: 'abc123def456',
      timestamp: '2024-01-01T00:00:00Z'
    });

    expect(message).toContain('Git Commit');
    expect(message).toContain('my-project');
    expect(message).toContain('fix: resolve login bug');
    expect(message).toContain('developer');
    expect(message).toContain('src/auth.js');
  });

  test('formatDeployMessage should format success correctly', () => {
    const message = NotificationService.formatDeployMessage({
      project: 'my-project',
      environment: 'production',
      version: 'v1.0.0'
    }, true);

    expect(message).toContain('部署成功');
    expect(message).toContain('my-project');
    expect(message).toContain('production');
  });

  test('formatDeployMessage should format failure correctly', () => {
    const message = NotificationService.formatDeployMessage({
      project: 'my-project',
      error: 'Build failed'
    }, false);

    expect(message).toContain('部署失败');
    expect(message).toContain('Build failed');
  });
});
