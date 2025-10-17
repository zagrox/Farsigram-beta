import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { API_BASE_URL, ASSETS_URL } from '../constants';

import { EnrichedInfluencer } from '../components/ui/InfluencerCard';
import CompactInfluencerCard, { CompactInfluencerCardSkeleton } from '../components/ui/CompactInfluencerCard';
import CompactCampaignCard, { CompactCampaignCardSkeleton } from '../components/ui/CompactCampaignCard';
import { ArrowLeftIcon, ArrowRightIcon } from '../components/Icons';

// --- TYPE DEFINITIONS ---
interface Campaign {
  id: number;
  status: string;
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
interface Location {
  id: number;
  country: string;
  country_persian: string;
}
interface Category {
    id: number;
    category_parent: string; // The name
    category_color: string | null;
    category_image: string | null;
}

// --- PROPS ---
interface CategoryDetailsPageProps {
  categoryId: number;
  onBack: () => void;
  onSelectInfluencer: (id: number) => void;
  onSelectCampaign: (id: number) => void;
}

// --- MAIN COMPONENT ---
const CategoryDetailsPage: React.FC<CategoryDetailsPageProps> = ({ categoryId, onBack, onSelectInfluencer, onSelectCampaign }) => {
    const { t, i18n } = useTranslation('categories');

    const [category, setCategory] = useState<Category | null>(null);
    const [influencers, setInfluencers] = useState<EnrichedInfluencer[]>([]);
    const [campaigns, setCampaigns] = useState<Campaign[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    
    useEffect(() => {
        const fetchCategoryData = async () => {
            if (!categoryId) return;
            setLoading(true);
            setError(null);
            
            try {
                // 1. Fetch Category details
                const categoryRes = await fetch(`${API_BASE_URL}/items/categories/${categoryId}`);
                if (!categoryRes.ok) throw new Error('Could not fetch category details');
                const categoryData = await categoryRes.json();
                setCategory(categoryData.data);

                // 2. Fetch related influencers and campaigns
                const [influencersRes, campaignsRes] = await Promise.all([
                    fetch(`${API_BASE_URL}/items/influencers?filter[influencer_category][_eq]=${categoryId}&filter[status][_eq]=published&fields=*,influencer_social.socials_id.*,influencer_audience.audiences_id.*`),
                    fetch(`${API_BASE_URL}/items/campaigns?filter[campaign_type][categories_id][_eq]=${categoryId}&filter[status][_eq]=published`)
                ]);

                // 3. Process influencers
                if (!influencersRes.ok) throw new Error(t('error_loading_influencers_for_category'));
                const influencersData = await influencersRes.json();

                // Enrich influencers (could be a shared hook)
                const locationsRes = await fetch(`${API_BASE_URL}/items/locations?fields=id,country,country_persian&limit=-1`);
                if (!locationsRes.ok) throw new Error('Failed to fetch locations for enrichment');
                const locationsData = await locationsRes.json();
                
                const farsigramLocations: Location[] = locationsData.data;
                const detailPromises = farsigramLocations.map(loc =>
                    fetch(`https://restcountries.com/v3.1/alpha/${loc.country}`).then(res => res.ok ? res.json() : null)
                );
                const detailsResults = await Promise.all(detailPromises);

                const locationsMap = new Map(farsigramLocations.map((loc, index) => {
                    const detail = detailsResults[index]?.[0];
                    return [loc.id, {
                        persian: loc.country_persian,
                        english: detail?.name?.common || loc.country_persian
                    }];
                }));

                const enrichedInfluencers = influencersData.data.map((inf: Influencer): EnrichedInfluencer => {
                    const locationInfo = locationsMap.get(inf.influencer_location);
                    const locationName = i18n.language === 'fa' 
                        ? (locationInfo?.persian || 'N/A') 
                        : (locationInfo?.english || locationInfo?.persian || 'N/A');
                        
                    return {
                      id: inf.id,
                      influencer_name: inf.influencer_name,
                      influencer_title: inf.influencer_title,
                      influencer_avatar: inf.influencer_avatar,
                      categoryName: categoryData.data.category_parent,
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

                // 4. Process campaigns
                if (!campaignsRes.ok) throw new Error(t('error_loading_campaigns_for_category'));
                const campaignsData = await campaignsRes.json();
                setCampaigns(campaignsData.data);

            } catch (err: any) {
                console.error("Failed to fetch category data:", err);
                setError(err.message || t('error'));
            } finally {
                setLoading(false);
            }
        };

        fetchCategoryData();
    }, [categoryId, t, i18n.language]);

    const categoryName = category?.category_parent || '';
    const themeColor = category?.category_color || '#0D9488'; // Primary fallback

    if (loading) {
        return (
            <div className="space-y-8 animate-pulse">
                <div className="h-16 w-3/4 md:w-1/2 bg-neutral-200 dark:bg-neutral-700 rounded-xl"></div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="bg-white dark:bg-neutral-800/50 rounded-xl p-6 space-y-3">
                         <div className="h-6 w-3/4 bg-neutral-200 dark:bg-neutral-700 rounded-md"></div>
                         {Array.from({ length: 5 }).map((_, index) => <CompactInfluencerCardSkeleton key={index} />)}
                    </div>
                     <div className="bg-white dark:bg-neutral-800/50 rounded-xl p-6 space-y-3">
                         <div className="h-6 w-3/4 bg-neutral-200 dark:bg-neutral-700 rounded-md"></div>
                         {Array.from({ length: 4 }).map((_, index) => <CompactCampaignCardSkeleton key={index} />)}
                    </div>
                </div>
            </div>
        )
    }

    if (error || !category) {
        return (
            <div className="text-center p-8 bg-red-50 dark:bg-red-900/20 rounded-lg">
                <p className="text-red-600 dark:text-red-400 font-semibold">{error || "Category not found."}</p>
                <button onClick={onBack} className="mt-4 font-semibold text-primary hover:text-primary-dark">{t('back_to_categories')}</button>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-center gap-4">
                <button 
                    onClick={onBack}
                    className="p-2 rounded-full hover:bg-neutral-200 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-300 transition-colors"
                    aria-label={t('back_to_categories')}
                >
                    {i18n.dir() === 'rtl' ? <ArrowRightIcon className="w-6 h-6" /> : <ArrowLeftIcon className="w-6 h-6" />}
                </button>
                <div className="flex items-center gap-3 bg-white dark:bg-neutral-800/50 p-3 rounded-xl shadow-sm">
                    {category.category_image && (
                         <img 
                            src={`${ASSETS_URL}/${category.category_image}`} 
                            alt={categoryName}
                            className="w-8 h-8 object-contain"
                         />
                    )}
                    <h1 className="text-2xl font-bold text-neutral-800 dark:text-neutral-200" style={{ color: themeColor }}>
                        {t('category_details_title', { categoryName })}
                    </h1>
                </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                {/* Influencers Column */}
                <div className="bg-white dark:bg-neutral-800/50 rounded-xl shadow-md p-6 flex flex-col h-full">
                     <h2 className="text-xl font-bold mb-4 text-neutral-800 dark:text-neutral-200">{t('influencers_in_category', { categoryName })}</h2>
                     <div className="space-y-3 overflow-y-auto no-scrollbar flex-grow pr-2">
                        {influencers.length > 0 ? (
                            influencers.map((influencer) => (
                                <CompactInfluencerCard key={influencer.id} influencer={influencer} onSelectInfluencer={onSelectInfluencer} />
                            ))
                        ) : (
                            <p className="text-center text-neutral-500 dark:text-neutral-400 py-8">{t('no_influencers_found_for_category')}</p>
                        )}
                     </div>
                </div>
                
                {/* Campaigns Column */}
                 <div className="bg-white dark:bg-neutral-800/50 rounded-xl shadow-md p-6 flex flex-col h-full">
                     <h2 className="text-xl font-bold mb-4 text-neutral-800 dark:text-neutral-200">{t('campaigns_for_category', { categoryName })}</h2>
                     <div className="space-y-3 overflow-y-auto no-scrollbar flex-grow pr-2">
                        {campaigns.length > 0 ? (
                            campaigns.map((campaign) => (
                                <CompactCampaignCard key={campaign.id} campaign={campaign} onSelectCampaign={onSelectCampaign} />
                            ))
                        ) : (
                            <p className="text-center text-neutral-500 dark:text-neutral-400 py-8">{t('no_campaigns_found_for_category')}</p>
                        )}
                     </div>
                </div>
            </div>
        </div>
    );
};
export default CategoryDetailsPage;