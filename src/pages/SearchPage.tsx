import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { API_BASE_URL } from '../constants';
import Input from '../components/ui/Input';
import { SearchIcon } from '../components/Icons';

import { EnrichedInfluencer } from '../components/ui/InfluencerCard';
import CompactInfluencerCard, { CompactInfluencerCardSkeleton } from '../components/ui/CompactInfluencerCard';
import CompactCampaignCard, { CompactCampaignCardSkeleton } from '../components/ui/CompactCampaignCard';
import CompactBusinessCard, { CompactBusinessCardSkeleton } from '../components/ui/CompactBusinessCard';

// --- TYPE DEFINITIONS ---
interface Campaign {
  id: number;
  campaign_image: string;
  campaign_color: string | null;
  campaign_goal: string;
  campaign_title: string;
}
interface Influencer {
  id: number;
  influencer_name: string;
  influencer_title: string;
  influencer_category: number;
  influencer_location: number;
  influencer_avatar: string;
  influencer_hub: boolean;
  influencer_social: { socials_id: { id: number; social_network: string; social_account: string; } }[];
  influencer_audience: { audiences_id: { id: number; audience_title: string; } }[];
}
interface Business {
  id: number;
  business_logo: string;
  business_name: string;
  business_slogan: string;
}
interface Category {
  id: number;
  category_parent: string;
}
interface Location {
  id: number;
  country: string;
  country_persian: string;
}

// --- PROPS ---
interface SearchPageProps {
  query: string;
  onSearch: (query: string) => void;
  onSelectInfluencer: (id: number) => void;
  onSelectCampaign: (id: number) => void;
  onSelectBusiness: (id: number) => void;
}

const SearchPage: React.FC<SearchPageProps> = ({ query, onSearch, onSelectInfluencer, onSelectCampaign, onSelectBusiness }) => {
    const { t, i18n } = useTranslation(['search', 'common']);

    const [influencers, setInfluencers] = useState<EnrichedInfluencer[]>([]);
    const [campaigns, setCampaigns] = useState<Campaign[]>([]);
    const [businesses, setBusinesses] = useState<Business[]>([]);
    
    const [loading, setLoading] = useState<boolean>(true);
    
    const [internalQuery, setInternalQuery] = useState(query);

    // Sync local input state if the global query prop changes (e.g., from header search)
    useEffect(() => {
        setInternalQuery(query);
    }, [query]);

    useEffect(() => {
        if (!query) {
            setLoading(false);
            setInfluencers([]);
            setCampaigns([]);
            setBusinesses([]);
            return;
        };

        const fetchData = async () => {
            setLoading(true);
            
            try {
                // Fetch enrichment data first
                const [categoriesRes, locationsRes] = await Promise.all([
                    fetch(`${API_BASE_URL}/items/categories?fields=id,category_parent&limit=-1`),
                    fetch(`${API_BASE_URL}/items/locations?fields=id,country,country_persian&limit=-1`),
                ]);
                if (!categoriesRes.ok || !locationsRes.ok) throw new Error('Failed to fetch enrichment data');
                // FIX: Cast json response to any to avoid type errors with strict configs
                const categoriesData: any = await categoriesRes.json();

                // FIX: Cast json response to any to avoid type errors with strict configs
                const locationsData: any = await locationsRes.json();
                const farsigramLocations: Location[] = locationsData?.data ?? [];
                const detailPromises = farsigramLocations.map(loc =>
                    fetch(`https://restcountries.com/v3.1/alpha/${loc.country}`).then(res => res.ok ? res.json() : null)
                );
                const detailsResults: any = await Promise.all(detailPromises);
                const mappedLocations = farsigramLocations.map((loc, index) => {
                    const detail = detailsResults[index]?.[0];
                    let englishName = detail?.name?.common || loc.country_persian;
                    if (loc.country_persian === 'جهانی') {
                        englishName = 'Global';
                    }
                    return { id: loc.id, persian: loc.country_persian, english: englishName };
                });

                // Now fetch search results
                const searchFilter = (fields: string[]) => ({
                    _and: [
                        { status: { _eq: 'published' } },
                        {
                          _or: fields.map(field => ({ [field]: { _icontains: query } }))
                        }
                    ]
                });
                
                const influencersFilter = searchFilter(['influencer_name', 'influencer_title', 'influencer_bio']);
                const campaignsFilter = searchFilter(['campaign_title', 'campaign_slogan', 'campaign_goal', 'campaign_overview']);
                const businessesFilter = searchFilter(['business_name', 'business_slogan', 'business_summary']);

                const [influencersPromise, campaignsPromise, businessesPromise] = await Promise.all([
                    fetch(`${API_BASE_URL}/items/influencers?limit=20&fields=*,influencer_social.socials_id.*,influencer_audience.audiences_id.*&filter=${encodeURIComponent(JSON.stringify(influencersFilter))}`),
                    fetch(`${API_BASE_URL}/items/campaigns?limit=20&filter=${encodeURIComponent(JSON.stringify(campaignsFilter))}`),
                    fetch(`${API_BASE_URL}/items/business?limit=20&fields=id,business_logo,business_name,business_slogan&filter=${encodeURIComponent(JSON.stringify(businessesFilter))}`)
                ]);

                if (!influencersPromise.ok || !campaignsPromise.ok || !businessesPromise.ok) {
                    throw new Error('One or more search requests failed');
                }

                // FIX: Cast json response to any to resolve the 'unknown' to 'string' assignment error.
                const influencersData: any = await influencersPromise.json();
                const campaignsData: any = await campaignsPromise.json();
                const businessesData: any = await businessesPromise.json();
                
                // Enrich Influencers
                const tempLocationsMap = new Map(mappedLocations.map(l => [l.id, l]));
                const tempCategoriesMap = new Map((categoriesData?.data ?? []).map((c: Category) => [c.id, c.category_parent]));

                const enrichedInfluencers = (influencersData?.data ?? []).map((inf: Influencer): EnrichedInfluencer => {
                    const locationInfo = tempLocationsMap.get(inf.influencer_location);
                    const locationName = i18n.language === 'fa' 
                        ? (locationInfo?.persian || 'N/A') 
                        : (locationInfo?.english || locationInfo?.persian || 'N/A');

                    return {
                      id: inf.id,
                      influencer_name: inf.influencer_name,
                      influencer_title: inf.influencer_title,
                      influencer_avatar: inf.influencer_avatar,
                      // FIX: Explicitly cast the map lookup result to a string to prevent a possible 'unknown' type assignment error in strict mode.
                      categoryName: String(tempCategoriesMap.get(inf.influencer_category) || 'N/A'),
                      locationName: locationName,
                      isHubMember: inf.influencer_hub || false,
                      socials: inf.influencer_social?.map(j => j.socials_id).filter(Boolean) || [],
                      audiences: inf.influencer_audience?.map(j => ({
                        id: j.audiences_id.id,
                        name: j.audiences_id.audience_title,
                      })).filter(a => a.id && a.name) || [],
                    };
                });
                
                setInfluencers(enrichedInfluencers);
                setCampaigns(campaignsData?.data ?? []);
                setBusinesses(businessesData?.data ?? []);
            } catch (err) {
                console.error("Failed to fetch search data:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [query, i18n.language]);
    
    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const newQuery = internalQuery.trim();
        if (newQuery && newQuery !== query) {
            onSearch(newQuery);
        }
    };

    const totalResults = influencers.length + campaigns.length + businesses.length;
    const hasResults = totalResults > 0;

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                {/* Left side: query pill and result count */}
                <div className="flex items-center gap-4">
                    <span className="bg-secondary/20 text-secondary-dark font-bold text-sm px-4 py-2 rounded-full">
                        {query}
                    </span>
                    {!loading && (
                        <div className="flex items-baseline gap-2">
                          <span className="text-lg font-bold text-neutral-800 dark:text-neutral-200">
                              {totalResults}
                          </span>
                          <span className="text-sm font-medium text-neutral-500 dark:text-neutral-400">
                              {t('results')}
                          </span>
                        </div>
                    )}
                </div>

                {/* Right side: search input */}
                <form onSubmit={handleSearchSubmit} className="w-full sm:max-w-xs">
                    <Input
                        type="text"
                        placeholder={t('common:searchInputPlaceholder')}
                        icon={<SearchIcon className="h-5 w-5 text-neutral-400" />}
                        isRtl={i18n.dir() === 'rtl'}
                        value={internalQuery}
                        onChange={(e) => setInternalQuery(e.target.value)}
                        className="bg-white dark:bg-neutral-800 border-neutral-300 dark:border-neutral-700"
                    />
                </form>
            </div>
            
            {loading && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                    <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <CompactInfluencerCardSkeleton key={i} />)}</div>
                    <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <CompactCampaignCardSkeleton key={i} />)}</div>
                    <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <CompactBusinessCardSkeleton key={i} />)}</div>
                </div>
            )}

            {!loading && !hasResults && (
                <div className="text-center p-8 bg-neutral-100 dark:bg-neutral-800 rounded-lg">
                    <p className="text-neutral-500 dark:text-neutral-400 font-semibold">{t('noResults', { query })}</p>
                </div>
            )}

            {!loading && hasResults && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                    {/* Influencers Column */}
                    <div className="bg-white dark:bg-neutral-800/50 rounded-xl shadow-md p-6 flex flex-col h-full">
                        <h2 className="text-xl font-bold mb-4 text-neutral-800 dark:text-neutral-200">{t('influencers')}</h2>
                        <div className="space-y-3 overflow-y-auto no-scrollbar flex-grow pr-2 min-h-[200px]">
                           {influencers.length > 0 ? (
                                influencers.map((influencer) => (
                                    <CompactInfluencerCard key={influencer.id} influencer={influencer} onSelectInfluencer={onSelectInfluencer} />
                                ))
                            ) : (
                                <p className="text-center text-neutral-500 dark:text-neutral-400 py-8">{t('noInfluencers')}</p>
                            )}
                        </div>
                    </div>
                    
                    {/* Campaigns Column */}
                    <div className="bg-white dark:bg-neutral-800/50 rounded-xl shadow-md p-6 flex flex-col h-full">
                        <h2 className="text-xl font-bold mb-4 text-neutral-800 dark:text-neutral-200">{t('campaigns')}</h2>
                        <div className="space-y-3 overflow-y-auto no-scrollbar flex-grow pr-2 min-h-[200px]">
                           {campaigns.length > 0 ? (
                                campaigns.map((campaign) => (
                                    <CompactCampaignCard key={campaign.id} campaign={campaign} onSelectCampaign={onSelectCampaign} />
                                ))
                            ) : (
                                <p className="text-center text-neutral-500 dark:text-neutral-400 py-8">{t('noCampaigns')}</p>
                            )}
                        </div>
                    </div>

                    {/* Businesses Column */}
                    <div className="bg-white dark:bg-neutral-800/50 rounded-xl shadow-md p-6 flex flex-col h-full">
                        <h2 className="text-xl font-bold mb-4 text-neutral-800 dark:text-neutral-200">{t('businesses')}</h2>
                        <div className="space-y-3 overflow-y-auto no-scrollbar flex-grow pr-2 min-h-[200px]">
                           {businesses.length > 0 ? (
                                businesses.map((business) => (
                                    <CompactBusinessCard key={business.id} business={business} onSelectBusiness={onSelectBusiness} />
                                ))
                            ) : (
                                <p className="text-center text-neutral-500 dark:text-neutral-400 py-8">{t('noBusinesses')}</p>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SearchPage;