/**
 * Popular Claude Code Skills / Slash Commands
 * Curated collection of community and built-in skills
 */
export const SKILL_CATEGORIES = [
  {
    id: 'built-in',
    name: 'Built-in',
    nameZh: '内置命令',
    icon: '⚡'
  },
  {
    id: 'code-quality',
    name: 'Code Quality',
    nameZh: '代码质量',
    icon: '🔍'
  },
  {
    id: 'productivity',
    name: 'Productivity',
    nameZh: '效率工具',
    icon: '🚀'
  },
  {
    id: 'devops',
    name: 'DevOps',
    nameZh: 'DevOps',
    icon: '🔧'
  },
  {
    id: 'documentation',
    name: 'Documentation',
    nameZh: '文档',
    icon: '📝'
  }
];

/**
 * Trending skills from skills.sh — top 10 by all-time installs
 * Source: https://skills.sh/
 * Last updated: 2026-02-14
 */
export const HOT_SKILLS = [
  {
    id: 'hot-find-skills',
    name: 'find-skills',
    title: 'Find Skills',
    titleZh: '发现技能',
    description: 'Discover and install skills from the open agent skills ecosystem. Search for skills interactively or by keyword.',
    descriptionZh: '从开放的 Agent 技能生态中发现和安装技能，支持交互式搜索或按关键词搜索。',
    author: 'vercel-labs',
    repo: 'vercel-labs/skills',
    category: 'productivity',
    installs: '210.0K',
    rank: 1,
    url: 'https://skills.sh/vercel-labs/skills/find-skills',
    tags: ['discovery', 'ecosystem', 'tools']
  },
  {
    id: 'hot-vercel-react-best-practices',
    name: 'vercel-react-best-practices',
    title: 'Vercel React Best Practices',
    titleZh: 'Vercel React 最佳实践',
    description: 'Comprehensive performance optimization guide for React and Next.js applications. Contains 57 rules across 8 categories, prioritized by impact.',
    descriptionZh: 'React 和 Next.js 应用的全面性能优化指南，包含 8 个类别中的 57 条规则，按影响力排序。',
    author: 'vercel-labs',
    repo: 'vercel-labs/agent-skills',
    category: 'code-quality',
    installs: '128.8K',
    rank: 2,
    url: 'https://skills.sh/vercel-labs/agent-skills/vercel-react-best-practices',
    tags: ['react', 'nextjs', 'performance']
  },
  {
    id: 'hot-web-design-guidelines',
    name: 'web-design-guidelines',
    title: 'Web Design Guidelines',
    titleZh: 'Web 设计规范',
    description: 'Review files for compliance with Web Interface Guidelines. Ensure your web UI follows modern design standards and best practices.',
    descriptionZh: '审查文件是否符合 Web 界面设计规范，确保 UI 遵循现代设计标准和最佳实践。',
    author: 'vercel-labs',
    repo: 'vercel-labs/agent-skills',
    category: 'code-quality',
    installs: '96.6K',
    rank: 3,
    url: 'https://skills.sh/vercel-labs/agent-skills/web-design-guidelines',
    tags: ['design', 'ui', 'guidelines']
  },
  {
    id: 'hot-remotion-best-practices',
    name: 'remotion-best-practices',
    title: 'Remotion Best Practices',
    titleZh: 'Remotion 最佳实践',
    description: 'Domain-specific knowledge for Remotion code. Use this skill whenever dealing with Remotion video generation projects.',
    descriptionZh: 'Remotion 视频生成项目的领域特定知识，处理 Remotion 代码时可使用此技能。',
    author: 'remotion-dev',
    repo: 'remotion-dev/skills',
    category: 'productivity',
    installs: '88.4K',
    rank: 4,
    url: 'https://skills.sh/remotion-dev/skills/remotion-best-practices',
    tags: ['remotion', 'video', 'react']
  },
  {
    id: 'hot-frontend-design',
    name: 'frontend-design',
    title: 'Frontend Design',
    titleZh: '前端设计',
    description: 'Create distinctive, production-grade frontend interfaces that avoid generic AI aesthetics. Implement real working code with exceptional attention to aesthetic details.',
    descriptionZh: '创建独特的生产级前端界面，避免千篇一律的 AI 风格，实现精美细节的真实可用代码。',
    author: 'anthropics',
    repo: 'anthropics/skills',
    category: 'code-quality',
    installs: '66.0K',
    rank: 5,
    url: 'https://skills.sh/anthropics/skills/frontend-design',
    tags: ['frontend', 'design', 'ui']
  },
  {
    id: 'hot-vercel-composition-patterns',
    name: 'vercel-composition-patterns',
    title: 'Vercel Composition Patterns',
    titleZh: 'Vercel 组合模式',
    description: 'Composition patterns for building flexible, maintainable React components. Use compound components, lift state, and compose internals to scale codebases.',
    descriptionZh: '构建灵活可维护 React 组件的组合模式，使用复合组件、状态提升和内部组合来扩展代码库。',
    author: 'vercel-labs',
    repo: 'vercel-labs/agent-skills',
    category: 'code-quality',
    installs: '38.6K',
    rank: 6,
    url: 'https://skills.sh/vercel-labs/agent-skills/vercel-composition-patterns',
    tags: ['react', 'patterns', 'architecture']
  },
  {
    id: 'hot-agent-browser',
    name: 'agent-browser',
    title: 'Agent Browser',
    titleZh: '代理浏览器',
    description: 'Browser automation with agent-browser. Enables AI agents to navigate, interact with, and extract data from web pages programmatically.',
    descriptionZh: '使用 Agent Browser 进行浏览器自动化，让 AI 代理能够以编程方式浏览、交互和提取网页数据。',
    author: 'vercel-labs',
    repo: 'vercel-labs/agent-browser',
    category: 'devops',
    installs: '33.9K',
    rank: 7,
    url: 'https://skills.sh/vercel-labs/agent-browser/agent-browser',
    tags: ['browser', 'automation', 'scraping']
  },
  {
    id: 'hot-skill-creator',
    name: 'skill-creator',
    title: 'Skill Creator',
    titleZh: '技能创建器',
    description: 'Guidance for creating effective skills. Helps you author, structure, and publish your own custom skills for the agent ecosystem.',
    descriptionZh: '创建有效技能的指导工具，帮助你编写、构建和发布自定义 Agent 技能。',
    author: 'anthropics',
    repo: 'anthropics/skills',
    category: 'productivity',
    installs: '32.7K',
    rank: 8,
    url: 'https://skills.sh/anthropics/skills/skill-creator',
    tags: ['skills', 'authoring', 'ecosystem']
  },
  {
    id: 'hot-browser-use',
    name: 'browser-use',
    title: 'Browser Use',
    titleZh: '浏览器使用',
    description: 'Browser automation with browser-use CLI. Control browsers programmatically for testing, scraping, and automating web workflows.',
    descriptionZh: '通过 browser-use CLI 进行浏览器自动化，以编程方式控制浏览器进行测试、抓取和自动化 Web 工作流。',
    author: 'browser-use',
    repo: 'browser-use/browser-use',
    category: 'devops',
    installs: '28.5K',
    rank: 9,
    url: 'https://skills.sh/browser-use/browser-use/browser-use',
    tags: ['browser', 'automation', 'testing']
  },
  {
    id: 'hot-vercel-react-native-skills',
    name: 'vercel-react-native-skills',
    title: 'React Native Best Practices',
    titleZh: 'React Native 最佳实践',
    description: 'Comprehensive best practices for React Native and Expo applications. Covers performance, animations, UI patterns, and platform-specific optimizations.',
    descriptionZh: 'React Native 和 Expo 应用的全面最佳实践，涵盖性能、动画、UI 模式和平台特定优化。',
    author: 'vercel-labs',
    repo: 'vercel-labs/agent-skills',
    category: 'code-quality',
    installs: '27.8K',
    rank: 10,
    url: 'https://skills.sh/vercel-labs/agent-skills/vercel-react-native-skills',
    tags: ['react-native', 'expo', 'mobile']
  }
];

export const POPULAR_SKILLS = [
  {
    id: 'review-pr',
    name: '/review-pr',
    title: 'Review Pull Request',
    titleZh: '审查PR',
    description: 'Automatically review a pull request, check for bugs, suggest improvements',
    descriptionZh: '自动审查PR，检查bug，提出改进建议',
    category: 'built-in',
    popularity: 98,
    author: 'Claude Code',
    tags: ['git', 'review', 'quality']
  },
  {
    id: 'commit',
    name: '/commit',
    title: 'Smart Commit',
    titleZh: '智能提交',
    description: 'Generate meaningful commit messages based on staged changes',
    descriptionZh: '根据暂存的更改生成有意义的提交信息',
    category: 'built-in',
    popularity: 95,
    author: 'Claude Code',
    tags: ['git', 'commit']
  },
  {
    id: 'refactor',
    name: '/refactor',
    title: 'Code Refactoring',
    titleZh: '代码重构',
    description: 'Refactor selected code with best practices, improve readability and performance',
    descriptionZh: '按最佳实践重构代码，提升可读性和性能',
    category: 'code-quality',
    popularity: 92,
    author: 'Community',
    tags: ['refactor', 'clean-code']
  },
  {
    id: 'test',
    name: '/test',
    title: 'Generate Tests',
    titleZh: '生成测试',
    description: 'Generate unit tests for the current file or function with good coverage',
    descriptionZh: '为当前文件或函数生成高覆盖率的单元测试',
    category: 'code-quality',
    popularity: 90,
    author: 'Community',
    tags: ['testing', 'quality']
  },
  {
    id: 'explain',
    name: '/explain',
    title: 'Explain Code',
    titleZh: '解释代码',
    description: 'Get a detailed explanation of complex code with examples',
    descriptionZh: '获取复杂代码的详细解释和示例',
    category: 'built-in',
    popularity: 88,
    author: 'Claude Code',
    tags: ['learning', 'documentation']
  },
  {
    id: 'fix-bug',
    name: '/fix',
    title: 'Fix Bug',
    titleZh: '修复Bug',
    description: 'Identify and fix bugs in the current file or error stack trace',
    descriptionZh: '识别并修复当前文件中的bug或错误堆栈',
    category: 'code-quality',
    popularity: 87,
    author: 'Community',
    tags: ['debug', 'fix']
  },
  {
    id: 'docker',
    name: '/docker',
    title: 'Dockerize',
    titleZh: 'Docker化',
    description: 'Generate Dockerfile and docker-compose for your project',
    descriptionZh: '为项目生成Dockerfile和docker-compose配置',
    category: 'devops',
    popularity: 85,
    author: 'Community',
    tags: ['docker', 'deployment']
  },
  {
    id: 'api-docs',
    name: '/api-docs',
    title: 'API Documentation',
    titleZh: 'API文档',
    description: 'Generate OpenAPI/Swagger documentation for your API endpoints',
    descriptionZh: '为API端点生成OpenAPI/Swagger文档',
    category: 'documentation',
    popularity: 83,
    author: 'Community',
    tags: ['api', 'swagger', 'docs']
  },
  {
    id: 'optimize',
    name: '/optimize',
    title: 'Performance Optimize',
    titleZh: '性能优化',
    description: 'Analyze and optimize code for better performance',
    descriptionZh: '分析并优化代码性能',
    category: 'productivity',
    popularity: 82,
    author: 'Community',
    tags: ['performance', 'optimization']
  },
  {
    id: 'security',
    name: '/security',
    title: 'Security Audit',
    titleZh: '安全审计',
    description: 'Scan code for security vulnerabilities and suggest fixes',
    descriptionZh: '扫描代码安全漏洞并提供修复建议',
    category: 'code-quality',
    popularity: 80,
    author: 'Community',
    tags: ['security', 'audit']
  },
  {
    id: 'ci-cd',
    name: '/ci',
    title: 'CI/CD Setup',
    titleZh: 'CI/CD配置',
    description: 'Generate GitHub Actions or other CI/CD pipeline configurations',
    descriptionZh: '生成GitHub Actions或其他CI/CD流水线配置',
    category: 'devops',
    popularity: 78,
    author: 'Community',
    tags: ['ci', 'github-actions']
  },
  {
    id: 'readme',
    name: '/readme',
    title: 'Generate README',
    titleZh: '生成README',
    description: 'Create a comprehensive README.md for your project',
    descriptionZh: '为项目创建完整的README.md文档',
    category: 'documentation',
    popularity: 76,
    author: 'Community',
    tags: ['readme', 'docs']
  }
];
