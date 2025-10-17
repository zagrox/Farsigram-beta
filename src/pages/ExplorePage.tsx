import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { API_BASE_URL } from '../constants';

import { EnrichedInfluencer } from '../components/ui/InfluencerCard';
import CompactInfluencerCard, { CompactInfluencerCardSkeleton } from '../components/ui/CompactInfluencerCard';
import CompactCampaignCard, { CompactCampaignCardSkeleton } from '../components/ui/CompactCampaignCard';
import FilterComponent, { FilterState } from '../components/ui/FilterComponent';
import { getSocialNetworkName } from '../utils/socialUtils';

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
}
interface ApiCategory {
  id: number;
  category_parent: string;
}
interface ApiAudience {
  id: number;
  audience_title: string;
}
interface Location {
  id: number;
  country_persian: string;
}

// --- PROPS ---
interface ExplorePageProps {
  onSelectInfluencer: (id: number) => void;
  onSelectCampaign: (id: number) => void;
}

const ExplorePage: React.FC<ExplorePageProps> = ({ onSelectInfluencer, onSelectCampaign }) => {
    const { t } = useTranslation('explore');

    const [influencers, setInfluencers] = useState<EnrichedInfluencer[]>([]);
    const [campaigns, setCampaigns] = useState<Campaign[]>([]);
    
    // State for filter dropdowns
    const [categories, setCategories] = useState<{ id: number; name: string }[]>([]);
    const [audiences, setAudiences] = useState<{ id: number; name: string }[]>([]);
    const [socialNetworks, setSocialNetworks] = useState<{ id: string; name: string }[]>([]);
    
    // Loading states
    const [loadingInfluencers, setLoadingInfluencers] = useState<boolean>(true);
    const [loadingCampaigns, setLoadingCampaigns] = useState<boolean>(true);
    const [loadingFilters, setLoadingFilters] = useState<boolean>(true);
    
    // Filter state
    const [filters, setFilters] = useState<FilterState>({
      type: 'all',
      audienceId: '',
      categoryId: '',
      socialNetworkUrl: '',
    });

    const handleFilterChange = (newFilters: Partial<FilterState>) => {
      setFilters(prev => ({ ...prev, ...newFilters }));
    };
    
    // Fetch data for filter dropdowns
    useEffect(() => {
        const fetchFilterData = async () => {
            setLoadingFilters(true);
            try {
                const [categoriesRes, audiencesRes, socialsRes] = await Promise.all([
                    fetch(`${API_BASE_URL}/items/categories?filter[status][_eq]=published&fields=id,category_parent&limit=-1`),
                    fetch(`${API_BASE_URL}/items/audiences?filter[status][_eq]=published&fields=id,audience_title&limit=-1`),
                    fetch(`${API_BASE_URL}/items/socials?fields=social_network&limit=-1`),
                ]);
                if (!categoriesRes.ok || !audiencesRes.ok || !socialsRes.ok) throw new Error('Failed to fetch filter data');

                const categoriesData = await categoriesRes.json();
                const audiencesData = await audiencesRes.json();
                const socialsData = await socialsRes.json();

                setCategories(categoriesData.data.map((c: ApiCategory) => ({ id: c.id, name: c.category_parent })));
                setAudiences(audiencesData.data.map((a: ApiAudience) => ({ id: a.id, name: a.audience_title })));

                const allSocialLinks: { social_network: string }[] = socialsData.data;
                const uniqueNetworks = [...new Set(allSocialLinks.map(s => s.social_network).filter(Boolean))];
                setSocialNetworks(uniqueNetworks.map(url => ({ id: url, name: getSocialNetworkName(url) })));

            } catch (error) {
                console.error("Failed to fetch filter data:", error);
                // Optionally set an error state for filters
            } finally {
                setLoadingFilters(false);
            }
        };
        fetchFilterData();
    }, []);

    // Memoize the categories map to avoid re-calculating on every render
    const categoriesMap = useMemo(() => new Map(categories.map(c => [c.id, c.name])), [categories]);

    // Fetch Influencers based on filters
    useEffect(() => {
        if (filters.type === 'campaigns') {
            setInfluencers([]);
            setLoadingInfluencers(false);
            return;
        };

        const fetchFilteredInfluencers = async () => {
            setLoadingInfluencers(true);
            
            let url = `${API_BASE_URL}/items/influencers?filter[status][_eq]=published&limit=20&sort=-date_created`;
            if (filters.audienceId) {
                url += `&filter[influencer_audience][audiences_id][_eq]=${filters.audienceId}`;
            }
            if (filters.categoryId) {
                url += `&filter[influencer_category][_eq]=${filters.categoryId}`;
            }
            if (filters.socialNetworkUrl) {
                url += `&filter[influencer_social][socials_id][social_network][_eq]=${filters.socialNetworkUrl}`;
            }

            try {
                // We need locations to enrich the data, so let's fetch them
                const [influencersRes, locationsRes] = await Promise.all([
                    fetch(url),
                    fetch(`${API_BASE_URL}/items/locations`),
                ]);
        
                if (!influencersRes.ok || !locationsRes.ok) {
                  throw new Error('Network response was not ok');
                }
        
                const influencersData = await influencersRes.json();
                const locationsData = await locationsRes.json();
        
                const locationsMap = new Map<number, string>(locationsData.data.map((l: Location) => [l.id, l.country_persian]));
        
                const enrichedInfluencers = influencersData.data.map((inf: Influencer): EnrichedInfluencer => ({
                  id: inf.id,
                  influencer_name: inf.influencer_name,
                  influencer_title: inf.influencer_title,
                  influencer_avatar: inf.influencer_avatar,
                  categoryName: categoriesMap.get(inf.influencer_category) || 'N/A',
                  locationName: locationsMap.get(inf.influencer_location) || 'N/A',
                }));
        
                setInfluencers(enrichedInfluencers);
            } catch (err) {
                console.error("Failed to fetch filtered influencers:", err);
            } finally {
                setLoadingInfluencers(false);
            }
        };

        fetchFilteredInfluencers();
    }, [filters, categoriesMap]);

    // Fetch Campaigns based on filters
    useEffect(() => {
        if (filters.type === 'influencers') {
            setCampaigns([]);
            setLoadingCampaigns(false);
            return;
        }

        const fetchFilteredCampaigns = async () => {
            setLoadingCampaigns(true);
            
            let url = `${API_BASE_URL}/items/campaigns?filter[status][_eq]=published&sort=-date_created&limit=20`;
             if (filters.audienceId) {
                url += `&filter[campaign_audience][audiences_id][_eq]=${filters.audienceId}`;
            }
            if (filters.categoryId) {
                url += `&filter[campaign_type][categories_id][_eq]=${filters.categoryId}`;
            }
            if (filters.socialNetworkUrl) {
                url += `&filter[campaign_social][socials_id][social_network][_eq]=${filters.socialNetworkUrl}`;
            }
            
            try {
                const response = await fetch(url);
                if (!response.ok) {
                  throw new Error('Network response was not ok');
                }
                const data = await response.json();
                setCampaigns(data.data);
            } catch (err) {
                console.error("Failed to fetch filtered campaigns:", err);
            } finally {
                setLoadingCampaigns(false);
            }
        };

        fetchFilteredCampaigns();
    }, [filters]);

    const showInfluencers = filters.type === 'all' || filters.type === 'influencers';
    const showCampaigns = filters.type === 'all' || filters.type === 'campaigns';
    const isLoading = loadingInfluencers || loadingCampaigns || loadingFilters;

    return (
        <div className="space-y-8">
            <FilterComponent 
                filters={filters}
                onFilterChange={handleFilterChange}
                audiences={audiences}
                categories={categories}
                socialNetworks={socialNetworks}
                loading={isLoading}
            />
        
            <div className={`grid grid-cols-1 ${showInfluencers && showCampaigns ? 'lg:grid-cols-2' : ''} gap-8 items-start`}>
                {/* Influencers Column */}
                {showInfluencers && (
                    <div className="bg-white dark:bg-neutral-800/50 rounded-xl shadow-md p-6 flex flex-col h-full">
                        <h2 className="text-xl font-bold mb-4 text-neutral-800 dark:text-neutral-200">{t('influencers_results_title')}</h2>
                        <div className="space-y-3 overflow-y-auto no-scrollbar flex-grow pr-2 min-h-[200px]">
                            {loadingInfluencers ? (
                                Array.from({ length: 5 }).map((_, index) => <CompactInfluencerCardSkeleton key={index} />)
                            ) : influencers.length > 0 ? (
                                influencers.map((influencer) => (
                                    <CompactInfluencerCard key={influencer.id} influencer={influencer} onSelectInfluencer={onSelectInfluencer} />
                                ))
                            ) : (
                                <p className="text-center text-neutral-500 dark:text-neutral-400 py-8">{t('no_influencers_found')}</p>
                            )}
                        </div>
                    </div>
                )}
                
                {/* Campaigns Column */}
                {showCampaigns && (
                    <div className="bg-white dark:bg-neutral-800/50 rounded-xl shadow-md p-6 flex flex-col h-full">
                        <h2 className="text-xl font-bold mb-4 text-neutral-800 dark:text-neutral-200">{t('campaigns_results_title')}</h2>
                        <div className="space-y-3 overflow-y-auto no-scrollbar flex-grow pr-2 min-h-[200px]">
                            {loadingCampaigns ? (
                                Array.from({ length: 5 }).map((_, index) => <CompactCampaignCardSkeleton key={index} />)
                            ) : campaigns.length > 0 ? (
                                campaigns.map((campaign) => (
                                    <CompactCampaignCard key={campaign.id} campaign={campaign} onSelectCampaign={onSelectCampaign} />
                                ))
                            ) : (
                                <p className="text-center text-neutral-500 dark:text-neutral-400 py-8">{t('no_campaigns_found')}</p>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ExplorePage;