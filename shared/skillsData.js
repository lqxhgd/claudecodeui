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
