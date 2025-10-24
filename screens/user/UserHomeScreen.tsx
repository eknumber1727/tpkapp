import React, { useState, useMemo, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useData } from '../../context/DataContext';
import TemplateCard from '../../components/user/TemplateCard';
import CategoryChips from '../../components/user/CategoryChips';
import { SearchIcon } from '../../components/shared/Icons';
import { CategoryName } from '../../types';
import { LANGUAGES } from '../../constants';
import AdBanner from '../../components/shared/AdBanner';
import TemplateCardSkeleton from '../../components/user/TemplateCardSkeleton';

type SortOption = 'Latest' | 'Trending' | 'Most Liked';

const TrendingTemplates: React.FC = () => {
    const { templates, loading } = useData();
    const trendingTemplates = useMemo(() => {
        return [...templates]
            .filter(t => t.is_active)
            .sort((a, b) => (b.downloadCount || 0) - (a.downloadCount || 0))
            .slice(0, 10);
    }, [templates]);

    if (loading || trendingTemplates.length === 0) return null;

    return (
        <div className="py-4">
            <h2 className="text-xl font-bold text-[#2C3E50] px-4 mb-3">Trending Now</h2>
            <div className="flex overflow-x-auto gap-4 px-4 pb-2 scrollbar-hide">
                {trendingTemplates.map(template => (
                    <div key={template.id} className="w-48 flex-shrink-0">
                        <TemplateCard template={template} />
                    </div>
                ))}
            </div>
        </div>
    )
}


const UserHomeScreen: React.FC = () => {
  const { templates, categories, loading } = useData();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<CategoryName | 'All'>('All');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('All');
  const [sortBy, setSortBy] = useState<SortOption>('Latest');
  const location = useLocation();

  useEffect(() => {
    if (location.state?.selectedCategory) {
        setSelectedCategory(location.state.selectedCategory);
        // Clean up state to prevent it from sticking on back navigation
        window.history.replaceState({}, document.title)
    }
  }, [location.state]);


  const filteredAndSortedTemplates = useMemo(() => {
    const filtered = templates
      .filter(template => template.is_active)
      .filter(template => {
        if (selectedCategory === 'All') return true;
        return template.category === selectedCategory;
      })
      .filter(template => {
        if (selectedLanguage === 'All') return true;
        return template.language === selectedLanguage;
      })
      .filter(template => {
        const lowerSearchTerm = searchTerm.toLowerCase();
        if (!lowerSearchTerm) return true;
        return (
          template.title.toLowerCase().includes(lowerSearchTerm) ||
          template.tags.some(tag => tag.toLowerCase().includes(lowerSearchTerm)) ||
          template.category.toLowerCase().includes(lowerSearchTerm)
        );
      });
    
    // Now sort the filtered results
    switch (sortBy) {
        case 'Trending':
            return filtered.sort((a, b) => (b.downloadCount || 0) - (a.downloadCount || 0));
        case 'Most Liked':
            return filtered.sort((a, b) => (b.likeCount || 0) - (a.likeCount || 0));
        case 'Latest':
        default:
            return filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }
  }, [templates, searchTerm, selectedCategory, selectedLanguage, sortBy]);

  return (
    <div className="flex flex-col">
      <TrendingTemplates />

      <div className="sticky top-16 z-30 bg-[#F8F9FA] pt-4 pb-2 shadow-sm">
        <div className="px-4 flex gap-2 items-center">
          <div className="relative flex-grow">
            <input
              type="search"
              placeholder="Search here"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white rounded-full shadow-sm text-[#2C3E50] placeholder-[#7F8C8D] focus:outline-none focus:ring-2 focus:ring-[#FFB800]"
            />
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-6 h-6 text-[#7F8C8D]" />
          </div>
          <select 
            value={sortBy} 
            onChange={e => setSortBy(e.target.value as SortOption)}
            className="bg-white px-3 py-3 rounded-full shadow-sm text-[#2C3E50] focus:outline-none focus:ring-2 focus:ring-[#FFB800] appearance-none"
          >
            <option value="Latest">Latest</option>
            <option value="Trending">Trending</option>
            <option value="Most Liked">Most Liked</option>
          </select>
          <select 
            value={selectedLanguage} 
            onChange={e => setSelectedLanguage(e.target.value)}
            className="bg-white px-3 py-3 rounded-full shadow-sm text-[#2C3E50] focus:outline-none focus:ring-2 focus:ring-[#FFB800] appearance-none"
          >
            <option value="All">All Languages</option>
            {LANGUAGES.map(lang => <option key={lang} value={lang}>{lang}</option>)}
          </select>
        </div>
        <CategoryChips categories={categories} selectedCategory={selectedCategory} onSelectCategory={setSelectedCategory} />
      </div>

      <div className="p-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {loading ? (
          <>
            {Array.from({ length: 10 }).map((_, index) => (
              <TemplateCardSkeleton key={index} />
            ))}
          </>
        ) : (
          <>
            {filteredAndSortedTemplates.map((template, index) => (
              <React.Fragment key={template.id}>
                <TemplateCard template={template} />
                {index === 5 && (
                  <div className="col-span-full">
                    <AdBanner />
                  </div>
                )}
              </React.Fragment>
            ))}
          </>
        )}
        
        {!loading && filteredAndSortedTemplates.length === 0 && (
          <div className="col-span-full text-center py-20 bg-white rounded-[30px] mt-4">
            <p className="text-[#7F8C8D]">No templates found. Try a different search!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserHomeScreen;