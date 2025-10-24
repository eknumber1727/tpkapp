import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { useData } from '../../context/DataContext';
import TemplateCard from '../../components/user/TemplateCard';
import CategoryChips from '../../components/user/CategoryChips';
import { SearchIcon } from '../../components/shared/Icons';
import { CategoryName } from '../../types';
import AdBanner from '../../components/shared/AdBanner';
import TemplateCardSkeleton from '../../components/user/TemplateCardSkeleton';

type SortOption = 'Latest' | 'Trending' | 'Most Liked';

const TrendingTemplates: React.FC = () => {
    const { templates, appSettings, loading } = useData();
    
    // FEATURE: Get featured templates based on the ordered list of IDs from app settings
    const featuredTemplates = useMemo(() => {
        const featuredIds = appSettings.featuredTemplates || [];
        const templateMap = new Map(templates.map(t => [t.id, t]));
        return featuredIds
            .map(id => templateMap.get(id))
            .filter((t): t is NonNullable<typeof t> => !!t && t.is_active);
    }, [appSettings.featuredTemplates, templates]);

    if (loading && templates.length === 0) return null;
    if (featuredTemplates.length === 0) return null;

    return (
        <div className="py-4">
            <h2 className="text-xl font-bold text-[#2C3E50] px-4 mb-3">Trending Now</h2>
            <div className="flex overflow-x-auto gap-4 px-4 pb-2 scrollbar-hide">
                 {loading && templates.length === 0 ? (
                    Array.from({ length: 5 }).map((_, index) => (
                        <div key={index} className="w-48 flex-shrink-0">
                            <TemplateCardSkeleton />
                        </div>
                    ))
                ) : (
                    featuredTemplates.map(template => (
                        <div key={template.id} className="w-48 flex-shrink-0">
                            <TemplateCard template={template} />
                        </div>
                    ))
                )}
            </div>
        </div>
    )
}


const UserHomeScreen: React.FC = () => {
  const { templates, categories, languages, templatesLoading, fetchMoreTemplates, hasMoreTemplates } = useData();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<CategoryName | 'All'>('All');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('All');
  const [sortBy, setSortBy] = useState<SortOption>('Latest');
  const location = useLocation();

  const observer = useRef<IntersectionObserver | null>(null);
  const lastTemplateElementRef = useCallback(node => {
    if (templatesLoading) return;
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMoreTemplates) {
        fetchMoreTemplates();
      }
    });
    if (node) observer.current.observe(node);
  }, [templatesLoading, hasMoreTemplates, fetchMoreTemplates]);


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
  
  const initialLoading = templatesLoading && templates.length === 0;

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
            {languages.map(lang => <option key={lang.id} value={lang.name}>{lang.name}</option>)}
          </select>
        </div>
        <CategoryChips categories={categories} selectedCategory={selectedCategory} onSelectCategory={setSelectedCategory} />
      </div>

      <div className="p-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {initialLoading ? (
            Array.from({ length: 12 }).map((_, index) => <TemplateCardSkeleton key={index} />)
        ) : (
          <>
            {filteredAndSortedTemplates.map((template, index) => {
              const isLastElement = filteredAndSortedTemplates.length === index + 1;
              return (
                  <React.Fragment key={template.id}>
                    {isLastElement ? (
                      <div ref={lastTemplateElementRef}><TemplateCard template={template} /></div>
                    ) : (
                      <TemplateCard template={template} />
                    )}
                    {index === 5 && (
                      <div className="col-span-full">
                        <AdBanner />
                      </div>
                    )}
                  </React.Fragment>
              )
            })}
          </>
        )}
      </div>

      {templatesLoading && !initialLoading && (
        <div className="col-span-full p-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {Array.from({ length: 4 }).map((_, index) => <TemplateCardSkeleton key={index} />)}
        </div>
      )}

      {!templatesLoading && templates.length === 0 && (
        <div className="col-span-full text-center py-20 bg-white rounded-[30px] mt-4 mx-4">
          <p className="text-[#7F8C8D]">No templates found. Try a different search!</p>
        </div>
      )}
    </div>
  );
};

export default UserHomeScreen;