import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { API_BASE_URL } from '../constants';

import { EnrichedInfluencer } from '../components/ui/InfluencerCard';
import CompactInfluencerCard, { CompactInfluencerCardSkeleton } from '../components/ui/CompactInfluencerCard';
import CompactCampaignCard, { CompactCampaignCardSkeleton } from '../components/ui/CompactCampaignCard';
import CompactBusinessCard, { CompactBusinessCardSkeleton } from '../components/ui/CompactBusinessCard';
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
  country: string;
  country_persian: string;
}

// --- PROPS ---
interface ExplorePageProps {
  onSelectInfluencer: (id: number) => void;
  onSelectCampaign: (id: number) => void;
  onSelectBusiness: (id: number) => void;
}

const ExplorePage: React.FC<ExplorePageProps> = ({ onSelectInfluencer, onSelectCampaign, onSelectBusiness }) => {
    const { t, i18n } = useTranslation('explore');

    const [influencers, setInfluencers] = useState<EnrichedInfluencer[]>([]);
    const [campaigns, setCampaigns] = useState<Campaign[]>([]);
    const [businesses, setBusinesses] = useState<Business[]>([]);
    
    // State for filter dropdowns
    const [categories, setCategories] = useState<{ id: number; name: string }[]>([]);
    const [audiences, setAudiences] = useState<{ id: number; name: string }[]>([]);
    const [socialNetworks, setSocialNetworks] = useState<{ id: string; name: string }[]>([]);
    
    // Loading states
    const [loadingInfluencers, setLoadingInfluencers] = useState<boolean>(true);
    const [loadingCampaigns, setLoadingCampaigns] = useState<boolean>(true);
    const [loadingBusinesses, setLoadingBusinesses] = useState<boolean>(true);
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

                setCategories((categoriesData?.data ?? []).map((c: ApiCategory) => ({ id: c.id, name: c.category_parent })));
                setAudiences((audiencesData?.data ?? []).map((a: ApiAudience) => ({ id: a.id, name: a.audience_title })));

                const allSocialLinks: { social_network: string }[] = socialsData?.data ?? [];
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
        if (filters.type === 'campaigns' || filters.type === 'businesses') {
            setInfluencers([]);
            setLoadingInfluencers(false);
            return;
        };

        const fetchFilteredInfluencers = async () => {
            setLoadingInfluencers(true);
            
            const baseUrl = `${API_BASE_URL}/items/influencers?limit=20&sort=-date_created&fields=*,influencer_social.socials_id.*,influencer_audience.audiences_id.*`;
            
            const filterConditions: any[] = [{ status: { _eq: 'published' } }];
            if (filters.audienceId) {
                filterConditions.push({ influencer_audience: { audiences_id: { _eq: filters.audienceId } } });
            }
            if (filters.categoryId) {
                filterConditions.push({ influencer_category: { _eq: filters.categoryId } });
            }
            if (filters.socialNetworkUrl) {
                filterConditions.push({ influencer_social: { socials_id: { social_network: { _eq: filters.socialNetworkUrl } } } });
            }

            const filterObject = { _and: filterConditions };
            const url = `${baseUrl}&filter=${encodeURIComponent(JSON.stringify(filterObject))}`;

            try {
                // We need locations to enrich the data, so let's fetch them
                const [influencersRes, locationsRes] = await Promise.all([
                    fetch(url),
                    fetch(`${API_BASE_URL}/items/locations?fields=id,country,country_persian&limit=-1`),
                ]);
        
                if (!influencersRes.ok || !locationsRes.ok) {
                  throw new Error('Network response was not ok');
                }
        
                const influencersData = await influencersRes.json();
                const locationsData = await locationsRes.json();
        
                const farsigramLocations: Location[] = locationsData?.data ?? [];
                const detailPromises = farsigramLocations.map(loc =>
                    fetch(`https://restcountries.com/v3.1/alpha/${loc.country}`).then(res => res.ok ? res.json() : null)
                );
                const detailsResults = await Promise.all(detailPromises);

                const locationsMap = new Map(farsigramLocations.map((loc, index) => {
                    const detail = detailsResults[index]?.[0];
                    let englishName = detail?.name?.common || loc.country_persian;
                    if (loc.country_persian === 'جهانی') {
                        englishName = 'Global';
                    }
                    return [loc.id, {
                        persian: loc.country_persian,
                        english: englishName
                    }];
                }));
        
                const enrichedInfluencers = (influencersData?.data ?? []).map((inf: Influencer): EnrichedInfluencer => {
                    const locationInfo = locationsMap.get(inf.influencer_location);
                    const locationName = i18n.language === 'fa' 
                        ? (locationInfo?.persian || 'N/A') 
                        : (locationInfo?.english || locationInfo?.persian || 'N/A');

                    return {
                      id: inf.id,
                      influencer_name: inf.influencer_name,
                      influencer_title: inf.influencer_title,
                      influencer_avatar: inf.influencer_avatar,
                      categoryName: categoriesMap.get(inf.influencer_category) || 'N/A',
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
            } catch (err) {
                console.error("Failed to fetch filtered influencers:", err);
            } finally {
                setLoadingInfluencers(false);
            }
        };

        fetchFilteredInfluencers();
    }, [filters, categoriesMap, i18n.language]);

    // Fetch Campaigns based on filters
    useEffect(() => {
        if (filters.type === 'influencers' || filters.type === 'businesses') {
            setCampaigns([]);
            setLoadingCampaigns(false);
            return;
        }

        const fetchFilteredCampaigns = async () => {
            setLoadingCampaigns(true);
            
            const baseUrl = `${API_BASE_URL}/items/campaigns?sort=-date_created&limit=20`;
            
            const filterConditions: any[] = [{ status: { _eq: 'published' } }];
            if (filters.audienceId) {
                filterConditions.push({ campaign_audience: { audiences_id: { _eq: filters.audienceId } } });
            }
            if (filters.categoryId) {
                filterConditions.push({ campaign_type: { categories_id: { _eq: filters.categoryId } } });
            }
            if (filters.socialNetworkUrl) {
                filterConditions.push({ campaign_social: { socials_id: { social_network: { _eq: filters.socialNetworkUrl } } } });
            }

            const filterObject = { _and: filterConditions };
            const url = `${baseUrl}&filter=${encodeURIComponent(JSON.stringify(filterObject))}`;
            
            try {
                const response = await fetch(url);
                if (!response.ok) {
                  throw new Error('Network response was not ok');
                }
                const data = await response.json();
                setCampaigns(data?.data ?? []);
            } catch (err) {
                console.error("Failed to fetch filtered campaigns:", err);
            } finally {
                setLoadingCampaigns(false);
            }
        };

        fetchFilteredCampaigns();
    }, [filters]);

    // Fetch Businesses based on filters
    useEffect(() => {
        if (filters.type === 'influencers' || filters.type === 'campaigns') {
            setBusinesses([]);
            setLoadingBusinesses(false);
            return;
        }

        const fetchFilteredBusinesses = async () => {
            setLoadingBusinesses(true);
            
            const baseUrl = `${API_BASE_URL}/items/business?sort=-date_created&limit=20&fields=id,business_logo,business_name,business_slogan`;
            
            const filterConditions: any[] = [{ status: { _eq: 'published' } }];
            if (filters.audienceId) {
                filterConditions.push({ business_audience: { audiences_id: { _eq: filters.audienceId } } });
            }
            if (filters.categoryId) {
                filterConditions.push({ business_category: { _eq: filters.categoryId } });
            }
            if (filters.socialNetworkUrl) {
                filterConditions.push({ business_social: { socials_id: { social_network: { _eq: filters.socialNetworkUrl } } } });
            }

            const filterObject = { _and: filterConditions };
            const url = `${baseUrl}&filter=${encodeURIComponent(JSON.stringify(filterObject))}`;
            
            try {
                const response = await fetch(url);
                if (!response.ok) {
                  throw new Error('Network response was not ok');
                }
                const data = await response.json();
                setBusinesses(data?.data ?? []);
            } catch (err) {
                console.error("Failed to fetch filtered businesses:", err);
            } finally {
                setLoadingBusinesses(false);
            }
        };

        fetchFilteredBusinesses();
    }, [filters]);

    const showInfluencers = filters.type === 'all' || filters.type === 'influencers';
    const showCampaigns = filters.type === 'all' || filters.type === 'campaigns';
    const showBusinesses = filters.type === 'all' || filters.type === 'businesses';
    const isLoading = loadingInfluencers || loadingCampaigns || loadingBusinesses || loadingFilters;
    
    const gridCols = [showInfluencers, showCampaigns, showBusinesses].filter(Boolean).length;


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
        
            <div className={`grid grid-cols-1 ${gridCols > 1 ? `lg:grid-cols-${gridCols}` : ''} gap-8 items-start`}>
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

                {/* Businesses Column */}
                {showBusinesses && (
                    <div className="bg-white dark:bg-neutral-800/50 rounded-xl shadow-md p-6 flex flex-col h-full">
                        <h2 className="text-xl font-bold mb-4 text-neutral-800 dark:text-neutral-200">{t('businesses_results_title')}</h2>
                        <div className="space-y-3 overflow-y-auto no-scrollbar flex-grow pr-2 min-h-[200px]">
                            {loadingBusinesses ? (
                                Array.from({ length: 5 }).map((_, index) => <CompactBusinessCardSkeleton key={index} />)
                            ) : businesses.length > 0 ? (
                                businesses.map((business) => (
                                    <CompactBusinessCard key={business.id} business={business} onSelectBusiness={onSelectBusiness} />
                                ))
                            ) : (
                                <p className="text-center text-neutral-500 dark:text-neutral-400 py-8">{t('no_businesses_found')}</p>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ExplorePage;