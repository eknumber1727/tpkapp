import React from 'react';
import { Category, CategoryName } from '../../types';

interface CategoryChipsProps {
  categories: Category[];
  selectedCategory: CategoryName | 'All';
  onSelectCategory: (category: CategoryName | 'All') => void;
}

const CategoryChips: React.FC<CategoryChipsProps> = ({ categories, selectedCategory, onSelectCategory }) => {
  const allCategories: (CategoryName | 'All')[] = ['All', ...categories.map(c => c.name)];

  return (
    <div className="py-2 overflow-x-auto whitespace-nowrap scrollbar-hide">
      <div className="flex gap-2 px-4">
        {allCategories.map((category) => (
          <button
            key={category}
            onClick={() => onSelectCategory(category)}
            className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors duration-200 ${
              selectedCategory === category
                ? 'bg-gradient-to-r from-[#FFB800] to-[#FF7A00] text-[#3D2811]'
                : 'bg-white text-[#2C3E50] shadow-sm'
            }`}
          >
            {category}
          </button>
        ))}
      </div>
    </div>
  );
};

export default CategoryChips;