import { useState, useEffect } from 'react';
import i18n from '../i18n/config';

const CATEGORY_COLORS = {
  'model-release': { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-300', dot: 'bg-blue-500' },
  'open-source': { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-700 dark:text-green-300', dot: 'bg-green-500' },
  'regulation': { bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-700 dark:text-amber-300', dot: 'bg-amber-500' },
  'research': { bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-700 dark:text-purple-300', dot: 'bg-purple-500' },
  'application': { bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-700 dark:text-emerald-300', dot: 'bg-emerald-500' },
  'ecosystem': { bg: 'bg-cyan-100 dark:bg-cyan-900/30', text: 'text-cyan-700 dark:text-cyan-300', dot: 'bg-cyan-500' }
};

const CATEGORY_LABELS = {
  'model-release': { en: 'Model Release', zh: '模型发布' },
  'open-source': { en: 'Open Source', zh: '开源' },
  'regulation': { en: 'Regulation', zh: '法规政策' },
  'research': { en: 'Research', zh: '研究' },
  'application': { en: 'Application', zh: '应用' },
  'ecosystem': { en: 'Ecosystem', zh: '生态' }
};

export default function AIEvents() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const isZh = i18n.language?.startsWith('zh');

  useEffect(() => {
    fetch('/api/ai-events')
      .then(r => r.json())
      .then(data => {
        setEvents(data.events || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const filtered = filter === 'all' ? events : events.filter(e => e.category === filter);
  const categories = ['all', ...new Set(events.map(e => e.category))];

  if (loading) {
    return (
      <div className="space-y-4 p-4">
        {[1,2,3].map(i => (
          <div key={i} className="animate-pulse bg-gray-100 dark:bg-gray-800 rounded-xl h-32" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <span className="text-2xl">🔥</span>
          {isZh ? 'AI 热点事件' : 'AI Hot Events'}
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          {isZh ? '追踪全球最热门的AI动态' : 'Track the hottest AI developments worldwide'}
        </p>
      </div>

      {/* Category filters */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
              filter === cat
                ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            {cat === 'all'
              ? (isZh ? '全部' : 'All')
              : (isZh ? CATEGORY_LABELS[cat]?.zh : CATEGORY_LABELS[cat]?.en) || cat}
          </button>
        ))}
      </div>

      {/* Events list */}
      <div className="space-y-3">
        {filtered.map((event, index) => {
          const colors = CATEGORY_COLORS[event.category] || CATEGORY_COLORS['research'];
          const catLabel = isZh ? CATEGORY_LABELS[event.category]?.zh : CATEGORY_LABELS[event.category]?.en;
          return (
            <div
              key={event.id}
              className="group bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl p-4 hover:shadow-md hover:border-gray-300 dark:hover:border-gray-600 transition-all duration-200"
            >
              <div className="flex items-start gap-4">
                {/* Rank number */}
                <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-sm font-bold text-gray-500 dark:text-gray-400">
                  {index + 1}
                </div>

                <div className="flex-1 min-w-0">
                  {/* Title row */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-gray-900 dark:text-white text-sm">
                      {isZh ? event.titleZh : event.title}
                    </h3>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${colors.bg} ${colors.text}`}>
                      {catLabel}
                    </span>
                  </div>

                  {/* Description */}
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                    {isZh ? event.summaryZh : event.summary}
                  </p>

                  {/* Meta row */}
                  <div className="flex items-center gap-3 mt-2 text-[11px] text-gray-400 dark:text-gray-500">
                    <span>{event.source}</span>
                    <span>{event.date}</span>
                    {/* Hot indicator */}
                    <div className="flex items-center gap-1">
                      <span>🔥</span>
                      <div className="w-16 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-orange-400 to-red-500"
                          style={{ width: `${event.hot}%` }}
                        />
                      </div>
                      <span className="font-medium">{event.hot}</span>
                    </div>
                    {/* Tags */}
                    <div className="flex gap-1 ml-auto">
                      {event.tags?.slice(0, 2).map(tag => (
                        <span key={tag} className="px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12 text-gray-400 dark:text-gray-500">
          <div className="text-4xl mb-2">📭</div>
          <p>{isZh ? '暂无相关事件' : 'No events found'}</p>
        </div>
      )}
    </div>
  );
}
