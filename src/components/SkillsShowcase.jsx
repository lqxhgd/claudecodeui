import React, { useState, useMemo } from 'react';
import { Search, Copy, Check, Terminal, User, TrendingUp, ExternalLink, Flame } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { SKILL_CATEGORIES, POPULAR_SKILLS, HOT_SKILLS } from '../../shared/skillsData.js';

function SkillsShowcase({ onUseSkill }) {
  const { i18n } = useTranslation();
  const isZh = i18n.language?.startsWith('zh');

  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedSkillId, setCopiedSkillId] = useState(null);
  const [showAllHot, setShowAllHot] = useState(false);

  const visibleHotSkills = showAllHot ? HOT_SKILLS : HOT_SKILLS.slice(0, 5);

  const filteredSkills = useMemo(() => {
    let skills = POPULAR_SKILLS;

    if (selectedCategory !== 'all') {
      skills = skills.filter(skill => skill.category === selectedCategory);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      skills = skills.filter(skill =>
        skill.name.toLowerCase().includes(query) ||
        skill.title.toLowerCase().includes(query) ||
        (skill.titleZh && skill.titleZh.includes(query)) ||
        skill.description.toLowerCase().includes(query) ||
        (skill.descriptionZh && skill.descriptionZh.includes(query)) ||
        skill.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }

    return skills;
  }, [selectedCategory, searchQuery]);

  const getCategoryInfo = (categoryId) => {
    return SKILL_CATEGORIES.find(c => c.id === categoryId);
  };

  const handleUseSkill = (skill) => {
    if (onUseSkill) {
      onUseSkill(skill);
    } else {
      navigator.clipboard?.writeText(skill.name).then(() => {
        setCopiedSkillId(skill.id);
        setTimeout(() => setCopiedSkillId(null), 2000);
      });
    }
  };

  const getCategoryBadgeClasses = (categoryId) => {
    const map = {
      'built-in': 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
      'code-quality': 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
      'productivity': 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
      'devops': 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
      'documentation': 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300',
    };
    return map[categoryId] || 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-xl font-bold text-foreground">
          {isZh ? '技能展示' : 'Skills Showcase'}
        </h3>
        <p className="mt-1 text-sm text-muted-foreground">
          {isZh
            ? '浏览和使用热门的 Claude Code 技能与斜杠命令'
            : 'Browse and use popular Claude Code skills and slash commands'}
        </p>
      </div>

      {/* Trending from skills.sh */}
      <div className="relative overflow-hidden rounded-xl border border-orange-200 dark:border-orange-800/50 bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 dark:from-orange-950/30 dark:via-amber-950/20 dark:to-yellow-950/10">
        {/* Banner Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-orange-200/60 dark:border-orange-800/30 bg-gradient-to-r from-orange-100/80 to-amber-100/80 dark:from-orange-900/30 dark:to-amber-900/20">
          <div className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-orange-500" />
            <h4 className="text-sm font-bold text-orange-800 dark:text-orange-300">
              {isZh ? 'skills.sh 热门趋势' : 'Trending from skills.sh'}
            </h4>
            <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full bg-orange-500 text-white">
              HOT
            </span>
          </div>
          <a
            href="https://skills.sh/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-orange-600 dark:text-orange-400 hover:text-orange-800 dark:hover:text-orange-200 transition-colors font-medium"
          >
            {isZh ? '查看全部' : 'View all'}
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>

        {/* Hot Skills List */}
        <div className="divide-y divide-orange-100 dark:divide-orange-900/30">
          {visibleHotSkills.map((skill) => (
            <div
              key={skill.id}
              className="flex items-center gap-4 px-5 py-3 hover:bg-orange-100/40 dark:hover:bg-orange-900/20 transition-colors group"
            >
              {/* Rank */}
              <span className={`flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-full text-xs font-bold ${
                skill.rank <= 3
                  ? 'bg-orange-500 text-white'
                  : 'bg-orange-100 dark:bg-orange-900/50 text-orange-700 dark:text-orange-300'
              }`}>
                {skill.rank}
              </span>

              {/* Skill Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-foreground truncate">
                    {isZh ? skill.titleZh : skill.title}
                  </span>
                  <code className="hidden sm:inline text-[10px] font-mono text-orange-600 dark:text-orange-400 bg-orange-100 dark:bg-orange-900/50 px-1.5 py-0.5 rounded">
                    {skill.name}
                  </code>
                </div>
                <p className="text-xs text-muted-foreground truncate mt-0.5">
                  {isZh ? skill.descriptionZh : skill.description}
                </p>
              </div>

              {/* Author + Installs */}
              <div className="hidden md:flex items-center gap-3 flex-shrink-0">
                <span className="text-xs text-muted-foreground">
                  {skill.author}
                </span>
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-orange-600 dark:text-orange-400 tabular-nums">
                  <TrendingUp className="w-3 h-3" />
                  {skill.installs}
                </span>
              </div>

              {/* Link */}
              <a
                href={skill.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-shrink-0 inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg bg-orange-500 text-white hover:bg-orange-600 active:scale-95 shadow-sm transition-all opacity-0 group-hover:opacity-100 focus:opacity-100"
              >
                <ExternalLink className="w-3 h-3" />
                {isZh ? '查看' : 'View'}
              </a>
            </div>
          ))}
        </div>

        {/* Show More / Show Less */}
        {HOT_SKILLS.length > 5 && (
          <div className="px-5 py-2.5 border-t border-orange-200/60 dark:border-orange-800/30 text-center">
            <button
              onClick={() => setShowAllHot(!showAllHot)}
              className="text-xs font-medium text-orange-600 dark:text-orange-400 hover:text-orange-800 dark:hover:text-orange-200 transition-colors"
            >
              {showAllHot
                ? (isZh ? '收起' : 'Show less')
                : (isZh ? `展开全部 ${HOT_SKILLS.length} 个热门技能` : `Show all ${HOT_SKILLS.length} trending skills`)}
            </button>
          </div>
        )}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={isZh ? '搜索技能名称、描述或标签...' : 'Search skills by name, description or tags...'}
          className="w-full pl-10 pr-4 py-2.5 text-sm bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
        />
      </div>

      {/* Category Filter Tabs */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setSelectedCategory('all')}
          className={`px-3.5 py-1.5 text-sm font-medium rounded-full border transition-all duration-150 ${
            selectedCategory === 'all'
              ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
              : 'bg-gray-50 dark:bg-gray-900/50 text-muted-foreground border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-foreground'
          }`}
        >
          {isZh ? '全部' : 'All'}
        </button>
        {SKILL_CATEGORIES.map(category => (
          <button
            key={category.id}
            onClick={() => setSelectedCategory(category.id)}
            className={`px-3.5 py-1.5 text-sm font-medium rounded-full border transition-all duration-150 ${
              selectedCategory === category.id
                ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                : 'bg-gray-50 dark:bg-gray-900/50 text-muted-foreground border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-foreground'
            }`}
          >
            <span className="mr-1.5">{category.icon}</span>
            {isZh ? category.nameZh : category.name}
          </button>
        ))}
      </div>

      {/* Skills Grid */}
      {filteredSkills.length === 0 ? (
        <div className="py-16 text-center">
          <Terminal className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-muted-foreground text-sm">
            {isZh ? '没有找到匹配的技能' : 'No skills found matching your criteria'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredSkills.map(skill => {
            const category = getCategoryInfo(skill.category);
            const isCopied = copiedSkillId === skill.id;

            return (
              <div
                key={skill.id}
                className="group relative bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl p-5 hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-md transition-all duration-200"
              >
                {/* Top Row: Command name + Category badge */}
                <div className="flex items-start justify-between mb-3">
                  <code className="text-sm font-semibold font-mono text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 px-2.5 py-1 rounded-md">
                    {skill.name}
                  </code>
                  {category && (
                    <span className={`inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full ${getCategoryBadgeClasses(skill.category)}`}>
                      <span className="mr-1">{category.icon}</span>
                      {isZh ? category.nameZh : category.name}
                    </span>
                  )}
                </div>

                {/* Title */}
                <h4 className="text-sm font-semibold text-foreground mb-1.5">
                  {isZh ? skill.titleZh : skill.title}
                </h4>

                {/* Description */}
                <p className="text-xs text-muted-foreground leading-relaxed mb-4">
                  {isZh ? skill.descriptionZh : skill.description}
                </p>

                {/* Popularity Bar */}
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                  <div className="flex-1 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-blue-500 to-blue-400 transition-all duration-500"
                      style={{ width: `${skill.popularity}%` }}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground font-medium tabular-nums w-7 text-right">
                    {skill.popularity}
                  </span>
                </div>

                {/* Bottom Row: Author + Tags + Use Button */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 flex-1 min-w-0 overflow-hidden">
                    {/* Author Badge */}
                    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground flex-shrink-0">
                      <User className="w-3 h-3" />
                      {skill.author}
                    </span>

                    {/* Tags */}
                    <div className="flex items-center gap-1 overflow-hidden">
                      {skill.tags.slice(0, 2).map(tag => (
                        <span
                          key={tag}
                          className="inline-block text-[10px] font-medium px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-muted-foreground truncate"
                        >
                          {tag}
                        </span>
                      ))}
                      {skill.tags.length > 2 && (
                        <span className="text-[10px] text-muted-foreground">
                          +{skill.tags.length - 2}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Use Button */}
                  <button
                    onClick={() => handleUseSkill(skill)}
                    className={`flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-150 ${
                      isCopied
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300'
                        : 'bg-blue-600 text-white hover:bg-blue-700 active:scale-95 shadow-sm'
                    }`}
                  >
                    {isCopied ? (
                      <>
                        <Check className="w-3 h-3" />
                        {isZh ? '已复制' : 'Copied'}
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        {isZh ? '使用' : 'Use'}
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default SkillsShowcase;
