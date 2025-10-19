import React from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDownIcon, SearchIcon } from '../Icons';
import Input from './Input';
import ActiveFilterPill from './ActiveFilterPill';
import LayoutSwitcher, { Layout } from './LayoutSwitcher';

// --- Type Definitions ---
export interface BusinessFilterState {
  categoryId: string;
  locationId: string;
  audienceId: string;
  searchTerm: string;
}

interface ApiItem {
  id: number | string;
  name: string;
}

interface BusinessFilterComponentProps {
  filters: BusinessFilterState;
  onFilterChange: (newFilters: Partial<BusinessFilterState>) => void;
  categories: ApiItem[];
  locations: ApiItem[];
  audiences: ApiItem[];
  loading: boolean;
  resultsCount: number;
  layout: Layout;
  onLayoutChange: (layout: Layout) => void;
}

// --- Sub-components ---
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
      className="w-full h-full appearance-none bg-neutral-100 dark:bg-neutral-800 border-none rounded-md py-2.5 px-3 text-sm text-neutral-800 dark:text-neutral-200 focus:outline-none focus:ring-2 focus:ring-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
const BusinessFilterComponent: React.FC<BusinessFilterComponentProps> = ({
  filters,
  onFilterChange,
  categories,
  locations,
  audiences,
  loading,
  resultsCount,
  layout,
  onLayoutChange,
}) => {
  const { t, i18n } = useTranslation('business');

  const findItemName = (id: string, items: ApiItem[]) => items.find(item => String(item.id) === id)?.name || id;

  return (
    <section className="bg-white dark:bg-neutral-800/50 p-4 rounded-xl shadow-md">
      <div className="space-y-4">
        {/* Top row with search and dropdowns */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="lg:col-span-1">
            <Input
              type="text"
              placeholder={t('filter_search_placeholder')}
              icon={<SearchIcon className="h-5 w-5 text-neutral-400" />}
              isRtl={i18n.dir() === 'rtl'}
              value={filters.searchTerm || ''}
              onChange={(e) => onFilterChange({ searchTerm: e.target.value })}
              disabled={loading}
              className="h-[42px]"
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
            {filters.locationId ? (
              <ActiveFilterPill
                label={findItemName(filters.locationId, locations)}
                onClear={() => onFilterChange({ locationId: '' })}
                disabled={loading}
              />
            ) : (
              <FilterDropdown
                value={filters.locationId}
                onChange={(e) => onFilterChange({ locationId: e.target.value })}
                options={locations}
                placeholder={t('filter_placeholder_location')}
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
        </div>

        {/* Bottom row with results and layout switcher */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
          <p className="text-sm font-semibold text-neutral-600 dark:text-neutral-400 flex-shrink-0 whitespace-nowrap">
            {!loading && t('results_count', { count: resultsCount })}
          </p>
          <LayoutSwitcher currentLayout={layout} onLayoutChange={onLayoutChange} />
        </div>
      </div>
    </section>
  );
};

export default BusinessFilterComponent;