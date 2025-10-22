import React, { useState, useMemo } from 'react';
import { useData } from '../../context/DataContext';
import TemplateCard from '../../components/user/TemplateCard';
import CategoryChips from '../../components/user/CategoryChips';
import { SearchIcon } from '../../components/shared/Icons';
import { CategoryName } from '../../types';
import { LANGUAGES } from '../../constants';

const UserHomeScreen: React.FC = () => {
  const { templates, categories } = useData();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<CategoryName | 'All'>('All');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('All');

  const filteredTemplates = useMemo(() => {
    return templates
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
  // FIX: Changed `selected` to `selectedCategory` in the dependency array to match the state variable.
  }, [templates, searchTerm, selectedCategory, selectedLanguage]);

  return (
    <div className="flex flex-col">
      <div className="sticky top-[70px] z-30 bg-[#F8F9FA] pt-4 shadow-sm">
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
            value={selectedLanguage} 
            onChange={e => setSelectedLanguage(e.target.value)}
            className="bg-white px-3 py-3 rounded-full shadow-sm text-[#2C3E50] focus:outline-none focus:ring-2 focus:ring-[#FFB800]"
          >
            <option value="All">All Languages</option>
            {LANGUAGES.map(lang => <option key={lang} value={lang}>{lang}</option>)}
          </select>
        </div>
        <CategoryChips categories={categories} selectedCategory={selectedCategory} onSelectCategory={setSelectedCategory} />
      </div>

      <div className="p-4 grid grid-cols-2 gap-4">
        {filteredTemplates.map(template => (
          <TemplateCard key={template.id} template={template} />
        ))}
        {filteredTemplates.length === 0 && (
          <div className="col-span-2 text-center py-20 bg-white rounded-[30px] mt-4">
            <p className="text-[#7F8C8D]">No templates found. Try a different search!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserHomeScreen;