import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Theme, Page } from '../types';
import { SunIcon, MoonIcon, SearchIcon, CampaignIcon, InfluencersIcon, BusinessIcon } from './Icons';
import Input from './ui/Input';
import { API_BASE_URL, ASSETS_URL } from '../constants';

interface HeaderProps {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  currentPage: Page;
  onSearch: (query: string) => void;
}

type SuggestionType = 'campaign' | 'influencer' | 'business';
interface Suggestion {
  id: number;
  name: string;
  type: SuggestionType;
  image?: string;
  slogan?: string;
}

const pageInfo: Record<Page, { ns: string; titleKey: string }> = {
  [Page.Home]: { ns: 'home', titleKey: 'title' },
  [Page.Campaigns]: { ns: 'campaigns', titleKey: 'title' },
  [Page.CulturalHub]: { ns: 'culturalhub', titleKey: 'title' },
  [Page.Explore]: { ns: 'explore', titleKey: 'title' },
  [Page.Map]: { ns: 'map', titleKey: 'title' },
  [Page.Categories]: { ns: 'categories', titleKey: 'title' },
  [Page.Marketplace]: { ns: 'marketplace', titleKey: 'title' },
  [Page.Profile]: { ns: 'profile', titleKey: 'title' },
  [Page.Influencers]: { ns: 'influencers', titleKey: 'title' },
  [Page.Business]: { ns: 'business', titleKey: 'title' },
  [Page.Search]: { ns: 'search', titleKey: 'title' },
};


const Header: React.FC<HeaderProps> = ({ theme, setTheme, currentPage, onSearch }) => {
  const { ns, titleKey } = pageInfo[currentPage];
  const { t, i18n } = useTranslation([ns, 'common']);
  
  const pageTitle = t(`${ns}:${titleKey}`);

  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  const searchContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const fetchSuggestions = useCallback(async (query: string) => {
    if (query.length < 2) return;
    setLoadingSuggestions(true);
    
    try {
        const campaignFilter = `filter[campaign_title][_icontains]=${query}`;
        const influencerFilter = `filter[influencer_name][_icontains]=${query}`;
        const businessFilter = `filter[business_name][_icontains]=${query}`;

        const [campaignRes, influencerRes, businessRes] = await Promise.all([
            fetch(`${API_BASE_URL}/items/campaigns?${campaignFilter}&limit=3&fields=id,campaign_title,campaign_image`),
            fetch(`${API_BASE_URL}/items/influencers?${influencerFilter}&limit=3&fields=id,influencer_name,influencer_avatar,influencer_title`),
            fetch(`${API_BASE_URL}/items/business?${businessFilter}&limit=3&fields=id,business_name,business_logo,business_slogan`),
        ]);

        const campaignData = await campaignRes.json();
        const influencerData = await influencerRes.json();
        const businessData = await businessRes.json();

        const campaignSuggestions: Suggestion[] = campaignData.data.map((item: any) => ({
            id: item.id, name: item.campaign_title, type: 'campaign', image: item.campaign_image
        }));
        const influencerSuggestions: Suggestion[] = influencerData.data.map((item: any) => ({
            id: item.id, name: item.influencer_name, type: 'influencer', image: item.influencer_avatar, slogan: item.influencer_title
        }));
        const businessSuggestions: Suggestion[] = businessData.data.map((item: any) => ({
            id: item.id, name: item.business_name, type: 'business', image: item.business_logo, slogan: item.business_slogan
        }));

        const allSuggestions = [...campaignSuggestions, ...influencerSuggestions, ...businessSuggestions];
        setSuggestions(allSuggestions);
        setShowSuggestions(allSuggestions.length > 0);
    } catch (error) {
        console.error("Failed to fetch suggestions:", error);
        setSuggestions([]);
    } finally {
        setLoadingSuggestions(false);
    }
  }, []);

  useEffect(() => {
    if (searchTerm.trim().length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    const handler = setTimeout(() => {
      fetchSuggestions(searchTerm);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchTerm, fetchSuggestions]);


  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
        if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
            setIsSearchExpanded(false);
            setShowSuggestions(false);
        }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
        document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const resetSearch = () => {
    setSearchTerm('');
    setSuggestions([]);
    setShowSuggestions(false);
    setHighlightedIndex(-1);
    setIsSearchExpanded(false);
  }

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let query = searchTerm.trim();
    if (highlightedIndex >= 0 && suggestions[highlightedIndex]) {
        query = suggestions[highlightedIndex].name;
    }
    if (query) {
      onSearch(query);
      resetSearch();
    }
  };
  
  const handleSuggestionClick = (suggestion: Suggestion) => {
    onSearch(suggestion.name);
    resetSearch();
  };
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex(prev => (prev < suggestions.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex(prev => (prev > 0 ? prev - 1 : 0));
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  const toggleTheme = () => {
    setTheme(theme === Theme.Light ? Theme.Dark : Theme.Light);
  };

  const toggleLanguage = () => {
    const newLang = i18n.language === 'en' ? 'fa' : 'en';
    i18n.changeLanguage(newLang);
  };

  const renderSuggestionIcon = (type: SuggestionType) => {
    switch (type) {
      case 'campaign': return <CampaignIcon className="w-5 h-5" />;
      case 'influencer': return <InfluencersIcon className="w-5 h-5" />;
      case 'business': return <BusinessIcon className="w-5 h-5" />;
      default: return null;
    }
  };

  return (
    <header className="flex-shrink-0 h-20 bg-white dark:bg-neutral-950 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between px-6 lg:px-8">
      <div className="flex items-center gap-4">
        <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100 whitespace-nowrap">{pageTitle}</h1>
      </div>
      
      <div className="flex items-center space-x-4">
        <button
          onClick={toggleLanguage}
          className="p-2 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500 dark:text-neutral-400 transition-colors"
          title={t('common:toggleLanguage')}
        >
          <span className="font-semibold text-sm">{i18n.language === 'en' ? 'FA' : 'EN'}</span>
        </button>
        <div ref={searchContainerRef} className="relative">
          {isSearchExpanded ? (
            <>
              <form onSubmit={handleSearchSubmit} className="w-64">
                <Input
                  ref={inputRef}
                  type="text"
                  placeholder={t('common:searchInputPlaceholder')}
                  icon={
                    <button type="submit" className="text-neutral-400 hover:text-primary transition-colors" aria-label={t('common:submitSearch')}>
                      <SearchIcon className="h-5 w-5" />
                    </button>
                  }
                  isRtl={i18n.dir() === 'rtl'}
                  autoFocus
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setHighlightedIndex(-1);
                  }}
                  onFocus={() => setShowSuggestions(suggestions.length > 0)}
                  onKeyDown={handleKeyDown}
                />
              </form>
              {showSuggestions && (
                <div className="absolute top-full mt-2 w-full bg-white dark:bg-neutral-800 rounded-lg shadow-lg border border-neutral-200 dark:border-neutral-700 z-20 overflow-hidden">
                  {loadingSuggestions ? (
                     <div className="p-4 text-center text-sm text-neutral-500 dark:text-neutral-400">{t('common:loading')}...</div>
                  ) : suggestions.length > 0 ? (
                    <ul className="max-h-96 overflow-y-auto">
                        {suggestions.map((s, index) => (
                            <li key={`${s.type}-${s.id}`}>
                                <button 
                                    onClick={() => handleSuggestionClick(s)}
                                    className={`w-full text-left p-3 flex items-center gap-3 transition-colors ${highlightedIndex === index ? 'bg-primary/10 dark:bg-primary/20' : 'hover:bg-neutral-100 dark:hover:bg-neutral-700/50'}`}
                                >
                                    <img src={`${ASSETS_URL}/${s.image}`} alt={s.name} className="w-10 h-10 rounded-md object-cover flex-shrink-0 bg-neutral-200 dark:bg-neutral-700"/>
                                    <div className="flex-1 overflow-hidden">
                                        <div className="flex items-center gap-2">
                                            <span className="text-primary dark:text-primary-light">{renderSuggestionIcon(s.type)}</span>
                                            <p className="font-semibold truncate text-neutral-800 dark:text-neutral-200">{s.name}</p>
                                        </div>
                                        {s.slogan && <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate">{s.slogan}</p>}
                                    </div>
                                </button>
                            </li>
                        ))}
                    </ul>
                  ) : (
                    <div className="p-4 text-center text-sm text-neutral-500 dark:text-neutral-400">{t('common:noSuggestionsFound')}</div>
                  )}
                </div>
              )}
            </>
          ) : (
            <button
              onClick={() => {
                setIsSearchExpanded(true);
                setTimeout(() => inputRef.current?.focus(), 0);
              }}
              className="p-2 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500 dark:text-neutral-400 transition-colors"
              aria-label={t('common:search')}
            >
              <SearchIcon className="h-6 w-6" />
            </button>
          )}
        </div>
        
        <button
          onClick={toggleTheme}
          className="p-2 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500 dark:text-neutral-400 transition-colors"
          title={t('common:toggleTheme')}
        >
          {theme === Theme.Light ? (
            <MoonIcon className="h-6 w-6" />
          ) : (
            <SunIcon className="h-6 w-6" />
          )}
        </button>
        <div className="w-10 h-10 bg-gradient-to-br from-primary to-secondary rounded-full cursor-pointer">
          <img
            src="https://picsum.photos/100"
            alt="User Avatar"
            className="w-full h-full rounded-full object-cover border-2 border-white dark:border-neutral-800"
          />
        </div>
      </div>
    </header>
  );
};

export default Header;
