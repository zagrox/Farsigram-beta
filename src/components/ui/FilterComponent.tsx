import React from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDownIcon } from '../Icons';
import ActiveFilterPill from './ActiveFilterPill';

// --- Type Definitions ---
export interface FilterState {
  type: 'all' | 'influencers' | 'campaigns';
  audienceId: string;
  categoryId: string;
  socialNetworkUrl: string;
}

interface ApiItem {
  id: number | string;
  // Using a generic name key to handle both audiences and categories
  name: string;
}

interface FilterComponentProps {
  filters: FilterState;
  onFilterChange: (newFilters: Partial<FilterState>) => void;
  audiences: ApiItem[];
  categories: ApiItem[];
  socialNetworks: ApiItem[];
  loading: boolean;
}

// --- Sub-components ---
const FilterButton: React.FC<{
  label: string;
  isActive: boolean;
  onClick: () => void;
}> = ({ label, isActive, onClick }) => (
  <button
    onClick={onClick}
    className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors flex-shrink-0 ${
      isActive
        ? 'bg-primary text-white'
        : 'text-neutral-600 dark:text-neutral-300 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700'
    }`}
  >
    {label}
  </button>
);

const FilterDropdown: React.FC<{
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  options: ApiItem[];
  placeholder: string;
  disabled: boolean;
}> = ({ value, onChange, options, placeholder, disabled }) => (
    <div className="relative w-full h-[42px]">
        <select
          value={value}
          onChange={onChange}
          disabled={disabled}
          className="w-full h-full appearance-none bg-neutral-100 dark:bg-neutral-800 border-none rounded-md py-2 px-3 text-sm text-neutral-800 dark:text-neutral-200 focus:outline-none focus:ring-2 focus:ring-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <option value="">{placeholder}</option>
          {options.map((option) => (
            <option key={option.id} value={option.id}>
              {option.name}
            </option>
          ))}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-neutral-400">
          <ChevronDownIcon className="h-4 w-4" />
        </div>
    </div>
);


// --- Main Component ---
const FilterComponent: React.FC<FilterComponentProps> = ({
  filters,
  onFilterChange,
  audiences,
  categories,
  socialNetworks,
  loading,
}) => {
  const { t } = useTranslation('explore');

  const findItemName = (id: string, items: ApiItem[]) => items.find(item => String(item.id) === id)?.name || id;

  return (
    <section className="bg-white dark:bg-neutral-800/50 p-4 rounded-xl shadow-md mb-8">
      <div className="flex flex-col sm:flex-row items-center gap-4 flex-wrap">
        {/* Type Filter */}
        <div className="flex items-center gap-2 p-1 bg-neutral-200/50 dark:bg-neutral-900/50 rounded-lg">
          <FilterButton
            label={t('filter_type_all')}
            isActive={filters.type === 'all'}
            onClick={() => onFilterChange({ type: 'all' })}
          />
          <FilterButton
            label={t('filter_type_influencers')}
            isActive={filters.type === 'influencers'}
            onClick={() => onFilterChange({ type: 'influencers' })}
          />
          <FilterButton
            label={t('filter_type_campaigns')}
            isActive={filters.type === 'campaigns'}
            onClick={() => onFilterChange({ type: 'campaigns' })}
          />
        </div>

        <div className="flex-1 min-w-[150px]">
           {filters.categoryId ? (
                <ActiveFilterPill 
                    label={findItemName(filters.categoryId, categories)}
                    onClear={() => onFilterChange({ categoryId: '' })}
                    disabled={loading}
                />
            ) : (
                <FilterDropdown
                    value={filters.categoryId}
                    onChange={(e) => onFilterChange({ categoryId: e.target.value })}
                    options={categories}
                    placeholder={t('filter_placeholder_category')}
                    disabled={loading}
                />
            )}
        </div>
        <div className="flex-1 min-w-[150px]">
           {filters.audienceId ? (
                <ActiveFilterPill 
                    label={findItemName(filters.audienceId, audiences)}
                    onClear={() => onFilterChange({ audienceId: '' })}
                    disabled={loading}
                />
            ) : (
                <FilterDropdown
                    value={filters.audienceId}
                    onChange={(e) => onFilterChange({ audienceId: e.target.value })}
                    options={audiences}
                    placeholder={t('filter_placeholder_audience')}
                    disabled={loading}
                />
            )}
        </div>
        <div className="flex-1 min-w-[150px]">
           {filters.socialNetworkUrl ? (
                <ActiveFilterPill 
                    label={findItemName(filters.socialNetworkUrl, socialNetworks)}
                    onClear={() => onFilterChange({ socialNetworkUrl: '' })}
                    disabled={loading}
                />
            ) : (
                <FilterDropdown
                    value={filters.socialNetworkUrl}
                    onChange={(e) => onFilterChange({ socialNetworkUrl: e.target.value })}
                    options={socialNetworks}
                    placeholder={t('filter_placeholder_social')}
                    disabled={loading}
                />
            )}
        </div>
      </div>
    </section>
  );
};

export default FilterComponent;
