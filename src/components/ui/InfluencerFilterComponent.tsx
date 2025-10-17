import React from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDownIcon, SearchIcon } from '../Icons';
import LayoutSwitcher, { Layout } from './LayoutSwitcher';
import Input from './Input';

// --- Type Definitions ---
export interface InfluencerFilterState {
  categoryId: string;
  locationId: string;
  audienceId: string;
  socialNetworkUrl: string;
  gender: 'all' | 'male' | 'female' | 'trans';
  isHubMember: boolean;
  searchTerm: string;
}

interface ApiItem {
  id: number | string;
  name: string;
}

interface InfluencerFilterComponentProps {
  filters: InfluencerFilterState;
  onFilterChange: (newFilters: Partial<InfluencerFilterState>) => void;
  categories: ApiItem[];
  locations: ApiItem[];
  audiences: ApiItem[];
  socialNetworks: ApiItem[];
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
  <div className="relative flex-1 min-w-[150px]">
    <select
      value={value}
      onChange={onChange}
      disabled={disabled}
      className="w-full appearance-none bg-neutral-100 dark:bg-neutral-800 border-none rounded-md py-2.5 px-3 text-sm text-neutral-800 dark:text-neutral-200 focus:outline-none focus:ring-2 focus:ring-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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

const GenderButton: React.FC<{
  label: string;
  isActive: boolean;
  onClick: () => void;
}> = ({ label, isActive, onClick }) => (
  <button
    onClick={onClick}
    className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors flex-shrink-0 ${
      isActive
        ? 'bg-primary text-white'
        : 'text-neutral-600 dark:text-neutral-300 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700'
    }`}
  >
    {label}
  </button>
);

const HubToggle: React.FC<{
  label: string;
  checked: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  disabled: boolean;
}> = ({ label, checked, onChange, disabled }) => (
  <label className={`flex items-center gap-3 cursor-pointer ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}>
    <span className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">{label}</span>
    <div className="relative">
      <input
        type="checkbox"
        className="sr-only"
        checked={checked}
        onChange={onChange}
        disabled={disabled}
      />
      <div className={`block w-12 h-6 rounded-full transition-colors ${checked ? 'bg-primary' : 'bg-neutral-200 dark:bg-neutral-700'}`}></div>
      <div
        className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${
          checked ? 'transform translate-x-6' : ''
        }`}
      ></div>
    </div>
  </label>
);


// --- Main Component ---
const InfluencerFilterComponent: React.FC<InfluencerFilterComponentProps> = ({
  filters,
  onFilterChange,
  categories,
  locations,
  audiences,
  socialNetworks,
  loading,
  resultsCount,
  layout,
  onLayoutChange
}) => {
  const { t, i18n } = useTranslation('influencers');

  return (
    <section className="bg-white dark:bg-neutral-800/50 p-4 rounded-xl shadow-md">
      <div className="space-y-4">
        {/* Top row with search and dropdowns */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
           <div className="lg:col-span-2 xl:col-span-1">
             <Input
                type="text"
                placeholder={t('filter_search_placeholder')}
                icon={<SearchIcon className="h-5 w-5 text-neutral-400" />}
                isRtl={i18n.dir() === 'rtl'}
                value={filters.searchTerm}
                onChange={(e) => onFilterChange({ searchTerm: e.target.value })}
                disabled={loading}
              />
           </div>
          <FilterDropdown
            value={filters.categoryId}
            onChange={(e) => onFilterChange({ categoryId: e.target.value })}
            options={categories}
            placeholder={t('filter_placeholder_category')}
            disabled={loading}
          />
          <FilterDropdown
            value={filters.locationId}
            onChange={(e) => onFilterChange({ locationId: e.target.value })}
            options={locations}
            placeholder={t('filter_placeholder_location')}
            disabled={loading}
          />
          <FilterDropdown
            value={filters.audienceId}
            onChange={(e) => onFilterChange({ audienceId: e.target.value })}
            options={audiences}
            placeholder={t('filter_placeholder_audience')}
            disabled={loading}
          />
          <FilterDropdown
            value={filters.socialNetworkUrl}
            onChange={(e) => onFilterChange({ socialNetworkUrl: e.target.value })}
            options={socialNetworks}
            placeholder={t('filter_placeholder_social')}
            disabled={loading}
          />
        </div>

        {/* Bottom row with toggles and layout switcher */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
            {/* Left Side: Gender + Results */}
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-2 p-1 bg-neutral-200/50 dark:bg-neutral-900/50 rounded-lg">
                <GenderButton label={t('filter_gender_all')} isActive={filters.gender === 'all'} onClick={() => onFilterChange({ gender: 'all' })} />
                <GenderButton label={t('male')} isActive={filters.gender === 'male'} onClick={() => onFilterChange({ gender: 'male' })} />
                <GenderButton label={t('female')} isActive={filters.gender === 'female'} onClick={() => onFilterChange({ gender: 'female' })} />
                <GenderButton label={t('trans')} isActive={filters.gender === 'trans'} onClick={() => onFilterChange({ gender: 'trans' })} />
              </div>
              <p className="text-sm font-semibold text-neutral-600 dark:text-neutral-400 flex-shrink-0 whitespace-nowrap">
                {!loading && t('results_count', { count: resultsCount })}
              </p>
            </div>
          
            {/* Right Side: Hub Member + Layout Switcher */}
            <div className="flex items-center gap-4 flex-shrink-0">
              <HubToggle 
                label={t('filter_hub_member')}
                checked={filters.isHubMember}
                onChange={(e) => onFilterChange({ isHubMember: e.target.checked })}
                disabled={loading}
              />
              <div className="border-l border-neutral-200 dark:border-neutral-700/50 h-8"></div>
              <LayoutSwitcher currentLayout={layout} onLayoutChange={onLayoutChange} />
            </div>
        </div>
      </div>
    </section>
  );
};

export default InfluencerFilterComponent;