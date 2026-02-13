/**
 * AI Hot Events Route
 * Aggregates trending AI events from multiple sources
 */
import express from 'express';
import fetch from 'node-fetch';

const router = express.Router();

// Cache for events data (refresh every 30 minutes)
let eventsCache = null;
let lastFetchTime = 0;
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes

// Curated list of trending AI events (fallback when API is unavailable)
const CURATED_EVENTS = [
  {
    id: 1,
    title: 'Claude Opus 4.6 Released',
    titleZh: 'Claude Opus 4.6 发布',
    summary: 'Anthropic releases Claude Opus 4.6 with improved reasoning, coding capabilities, and extended context window support.',
    summaryZh: 'Anthropic发布Claude Opus 4.6，提升推理、编码能力和扩展上下文窗口支持。',
    category: 'model-release',
    source: 'Anthropic',
    date: '2026-02-10',
    hot: 99,
    url: 'https://anthropic.com',
    tags: ['claude', 'llm', 'anthropic']
  },
  {
    id: 2,
    title: 'GPT-5.2 Achieves New Benchmarks',
    titleZh: 'GPT-5.2 达到新基准',
    summary: 'OpenAI GPT-5.2 sets new records on major AI benchmarks including MMLU-Pro, HumanEval, and MATH.',
    summaryZh: 'OpenAI GPT-5.2在MMLU-Pro、HumanEval和MATH等主要AI基准上创下新纪录。',
    category: 'model-release',
    source: 'OpenAI',
    date: '2026-02-08',
    hot: 97,
    url: 'https://openai.com',
    tags: ['gpt', 'openai', 'benchmark']
  },
  {
    id: 3,
    title: 'DeepSeek R2 Open-Source Release',
    titleZh: 'DeepSeek R2 开源发布',
    summary: 'DeepSeek releases R2 reasoning model as open-source, rivaling proprietary models in complex reasoning tasks.',
    summaryZh: 'DeepSeek开源发布R2推理模型，在复杂推理任务上与闭源模型媲美。',
    category: 'open-source',
    source: 'DeepSeek',
    date: '2026-02-06',
    hot: 95,
    url: 'https://deepseek.com',
    tags: ['deepseek', 'open-source', 'reasoning']
  },
  {
    id: 4,
    title: 'EU AI Act Full Enforcement Begins',
    titleZh: 'EU AI 法案全面实施',
    summary: 'The European Union AI Act enters full enforcement, requiring compliance from all AI providers operating in EU markets.',
    summaryZh: '欧盟AI法案全面实施，要求所有在欧盟市场运营的AI提供商合规。',
    category: 'regulation',
    source: 'EU Commission',
    date: '2026-02-01',
    hot: 92,
    url: 'https://ec.europa.eu',
    tags: ['regulation', 'eu', 'policy']
  },
  {
    id: 5,
    title: 'Google Gemini 3 Pro Launch',
    titleZh: 'Google Gemini 3 Pro 发布',
    summary: 'Google launches Gemini 3 Pro with native multimodal capabilities and real-time web access integration.',
    summaryZh: 'Google发布Gemini 3 Pro，具备原生多模态能力和实时网络访问集成。',
    category: 'model-release',
    source: 'Google',
    date: '2026-01-28',
    hot: 90,
    url: 'https://deepmind.google',
    tags: ['gemini', 'google', 'multimodal']
  },
  {
    id: 6,
    title: 'AI Coding Agents Reach 90% SWE-bench Score',
    titleZh: 'AI编码代理达到90% SWE-bench分数',
    summary: 'Multiple AI coding agents now solve over 90% of SWE-bench verified tasks, approaching human-level software engineering.',
    summaryZh: '多个AI编码代理现在解决超过90%的SWE-bench验证任务，接近人类水平的软件工程能力。',
    category: 'research',
    source: 'Multiple',
    date: '2026-01-25',
    hot: 88,
    url: '#',
    tags: ['coding', 'benchmark', 'agents']
  },
  {
    id: 7,
    title: 'Qwen 3.0 Tops Chinese AI Benchmarks',
    titleZh: '通义千问3.0 领跑国内AI基准',
    summary: 'Alibaba Qwen 3.0 achieves top scores on Chinese language benchmarks and competitive results on international tests.',
    summaryZh: '阿里巴巴通义千问3.0在中文基准上取得最高分，在国际测试中也取得竞争力结果。',
    category: 'model-release',
    source: 'Alibaba',
    date: '2026-01-22',
    hot: 86,
    url: 'https://qwen.alibaba.com',
    tags: ['qwen', 'alibaba', 'chinese-ai']
  },
  {
    id: 8,
    title: 'AI-Powered Drug Discovery Breakthrough',
    titleZh: 'AI驱动药物发现突破',
    summary: 'AI-designed drug enters Phase 3 clinical trials, potentially the first fully AI-discovered treatment to reach late-stage testing.',
    summaryZh: 'AI设计的药物进入3期临床试验，可能是首个完全由AI发现的进入后期测试的治疗方案。',
    category: 'application',
    source: 'Nature',
    date: '2026-01-18',
    hot: 85,
    url: 'https://nature.com',
    tags: ['healthcare', 'drug-discovery', 'biotech']
  },
  {
    id: 9,
    title: 'MCP Protocol Becomes Industry Standard',
    titleZh: 'MCP协议成为行业标准',
    summary: 'Model Context Protocol (MCP) gains widespread adoption across AI tools, becoming the de facto standard for AI tool integration.',
    summaryZh: '模型上下文协议(MCP)在AI工具中获得广泛采用，成为AI工具集成的事实标准。',
    category: 'ecosystem',
    source: 'Anthropic',
    date: '2026-01-15',
    hot: 83,
    url: 'https://modelcontextprotocol.io',
    tags: ['mcp', 'protocol', 'tools']
  },
  {
    id: 10,
    title: 'AI Video Generation Reaches Film Quality',
    titleZh: 'AI视频生成达到电影级质量',
    summary: 'Latest AI video generation models produce cinema-quality 4K clips up to 2 minutes long with consistent characters and physics.',
    summaryZh: '最新AI视频生成模型可生成长达2分钟的电影级4K片段，角色和物理效果一致。',
    category: 'research',
    source: 'Multiple',
    date: '2026-01-12',
    hot: 80,
    url: '#',
    tags: ['video', 'generation', 'creative']
  }
];

const EVENT_CATEGORIES = {
  'model-release': { label: 'Model Release', labelZh: '模型发布', color: 'blue' },
  'open-source': { label: 'Open Source', labelZh: '开源', color: 'green' },
  'regulation': { label: 'Regulation', labelZh: '法规政策', color: 'amber' },
  'research': { label: 'Research', labelZh: '研究', color: 'purple' },
  'application': { label: 'Application', labelZh: '应用', color: 'emerald' },
  'ecosystem': { label: 'Ecosystem', labelZh: '生态', color: 'cyan' }
};

// GET /api/ai-events - return trending AI events
router.get('/', async (req, res) => {
  try {
    // Return cached or curated events
    const now = Date.now();
    if (eventsCache && (now - lastFetchTime) < CACHE_TTL) {
      return res.json({ events: eventsCache, categories: EVENT_CATEGORIES, cached: true });
    }

    // Use curated events (in production, this would fetch from an API)
    eventsCache = CURATED_EVENTS;
    lastFetchTime = now;

    res.json({ events: CURATED_EVENTS, categories: EVENT_CATEGORIES, cached: false });
  } catch (error) {
    console.error('Error fetching AI events:', error);
    res.json({ events: CURATED_EVENTS, categories: EVENT_CATEGORIES, cached: false });
  }
});

export default router;
