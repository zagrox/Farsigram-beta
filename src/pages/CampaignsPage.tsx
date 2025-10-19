import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import CampaignCard, { CampaignCardSkeleton } from '../components/ui/CampaignCard';
import CompactCampaignCard, { CompactCampaignCardSkeleton } from '../components/ui/CompactCampaignCard';
import { ImageCard, ImageCardSkeleton } from '../components/ui/ImageCard';
import { API_BASE_URL } from '../constants';
import CampaignFilterComponent, { CampaignFilterState } from '../components/ui/CampaignFilterComponent';
import { Layout } from '../components/ui/LayoutSwitcher';
import { getSocialNetworkName } from '../utils/socialUtils';

interface Campaign {
  id: number;
  status: string;
  campaign_image: string;
  campaign_color: string | null;
  campaign_goal: string;
  campaign_title: string;
  campaign_slogan: string;
  campaign_overview: string;
  campaign_tags: string[] | null;
  campaign_audience: { audiences_id: { id: number } }[];
  campaign_location: { locations_id: { id: number } }[];
  campaign_type: { categories_id: { id: number } }[];
  campaign_social: { socials_id: { social_network: string } }[];
}

interface CampaignsPageProps {
  onSelectCampaign: (id: number) => void;
  layout: Layout;
  onLayoutChange: (layout: Layout) => void;
}

interface ApiItem {
  id: number;
  name: string;
}
interface ApiSocialItem {
  id: string;
  name: string;
}
interface LocationApiItem {
    id: number;
    persianName: string;
    englishName: string;
}

const CampaignsPage: React.FC<CampaignsPageProps> = ({ onSelectCampaign, layout, onLayoutChange }) => {
  const { t, i18n } = useTranslation('campaigns');
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingFilters, setLoadingFilters] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  const [categories, setCategories] = useState<ApiItem[]>([]);
  const [locations, setLocations] = useState<LocationApiItem[]>([]);
  const [audiences, setAudiences] = useState<ApiItem[]>([]);
  const [socialNetworks, setSocialNetworks] = useState<ApiSocialItem[]>([]);

  const [filters, setFilters] = useState<CampaignFilterState>({
    categoryId: '',
    locationId: '',
    audienceId: '',
    socialNetworkUrl: '',
    searchTerm: '',
  });

  const handleFilterChange = (newFilters: Partial<CampaignFilterState>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  useEffect(() => {
    const fetchFilterData = async () => {
        setLoadingFilters(true);
        try {
            const [categoriesRes, locationsRes, audiencesRes, socialsRes] = await Promise.all([
                fetch(`${API_BASE_URL}/items/categories?filter[status][_eq]=published&fields=id,category_parent&limit=-1`),
                fetch(`${API_BASE_URL}/items/locations?fields=id,country_persian,country&limit=-1`),
                fetch(`${API_BASE_URL}/items/audiences?filter[status][_eq]=published&fields=id,audience_title&limit=-1`),
                fetch(`${API_BASE_URL}/items/socials?fields=social_network&limit=-1`),
            ]);
            if (!categoriesRes.ok || !locationsRes.ok || !audiencesRes.ok || !socialsRes.ok) {
                throw new Error('Failed to fetch filter data');
            }

            const categoriesData = await categoriesRes.json();
            const locationsData = await locationsRes.json();
            const audiencesData = await audiencesRes.json();
            const socialsData = await socialsRes.json();

            setCategories(categoriesData.data.map((c: { id: number; category_parent: string }) => ({ id: c.id, name: c.category_parent })));
            
            const farsigramLocations: {id: number, country_persian: string, country: string}[] = locationsData.data;
            const detailPromises = farsigramLocations.map(loc =>
                fetch(`https://restcountries.com/v3.1/alpha/${loc.country}`).then(res => res.ok ? res.json() : null)
            );
            const detailsResults = await Promise.all(detailPromises);

            const combinedLocations = farsigramLocations.map((loc, index) => {
                const detail = detailsResults[index]?.[0];
                let englishName = detail?.name?.common || loc.country_persian;
                if (loc.country_persian === 'جهانی') {
                    englishName = 'Global';
                }
                return {
                    id: loc.id,
                    persianName: loc.country_persian,
                    englishName: englishName
                };
            });
            setLocations(combinedLocations);
            
            setAudiences(audiencesData.data.map((a: { id: number; audience_title: string }) => ({ id: a.id, name: a.audience_title })));

            const allSocialLinks: { social_network: string }[] = socialsData.data;
            const uniqueNetworks = [...new Set(allSocialLinks.map(s => s.social_network).filter(Boolean))];
            setSocialNetworks(uniqueNetworks.map(url => ({ id: url, name: getSocialNetworkName(url) })));

        } catch (error) {
            console.error("Failed to fetch filter data:", error);
            setError(t('error'));
        } finally {
            setLoadingFilters(false);
        }
    };
    fetchFilterData();
  }, [t]);


  const locationsMap = useMemo(() => {
    const map = new Map<number, string>();
    locations.forEach(loc => {
        map.set(loc.id, i18n.language === 'fa' ? loc.persianName : loc.englishName);
    });
    return map;
  }, [locations, i18n.language]);

  const categoriesMap = useMemo(() => {
    const map = new Map<number, string>();
    categories.forEach(cat => {
        map.set(cat.id, cat.name);
    });
    return map;
  }, [categories]);

  useEffect(() => {
    const fetchCampaignData = async () => {
      setLoading(true);
      setError(null);
      
      const baseUrl = `${API_BASE_URL}/items/campaigns?sort=-date_created&fields=*,campaign_location.locations_id.id,campaign_type.categories_id.id`;
      
      const filterConditions: any[] = [{ status: { _eq: 'published' } }];

      if (filters.searchTerm) {
        filterConditions.push({
          _or: [
            { campaign_title: { _icontains: filters.searchTerm } },
            { campaign_slogan: { _icontains: filters.searchTerm } },
            { campaign_goal: { _icontains: filters.searchTerm } },
          ],
        });
      }
      if (filters.categoryId) {
        filterConditions.push({ campaign_type: { categories_id: { _eq: filters.categoryId } } });
      }
      if (filters.locationId) {
        filterConditions.push({ campaign_location: { locations_id: { _eq: filters.locationId } } });
      }
      if (filters.audienceId) {
        filterConditions.push({ campaign_audience: { audiences_id: { _eq: filters.audienceId } } });
      }
      if (filters.socialNetworkUrl) {
        filterConditions.push({ campaign_social: { socials_id: { social_network: { _eq: filters.socialNetworkUrl } } } });
      }

      const filterObject = { _and: filterConditions };
      const url = `${baseUrl}&filter=${encodeURIComponent(JSON.stringify(filterObject))}`;

      try {
        const campaignsRes = await fetch(url);
        if (!campaignsRes.ok) {
          throw new Error('Network response was not ok');
        }

        const campaignsData = await campaignsRes.json();
        setCampaigns(campaignsData.data);
      } catch (err) {
        console.error("Failed to fetch campaigns data:", err);
        setError(t('error'));
      } finally {
        setLoading(false);
      }
    };

    if (!loadingFilters) {
        fetchCampaignData();
    }
  }, [filters, t, i18n.language, loadingFilters]);

  const renderSkeletons = () => {
    const skeletonCount = 12;
    switch (layout) {
        case 'list':
            return Array.from({ length: 6 }).map((_, index) => <CompactCampaignCardSkeleton key={index} />);
        case 'image':
            return Array.from({ length: skeletonCount }).map((_, index) => <ImageCardSkeleton key={index} />);
        case 'card':
        default:
            return Array.from({ length: 6 }).map((_, index) => <CampaignCardSkeleton key={index} />);
    }
  };

  const getGridClasses = () => {
      switch(layout) {
          case 'list':
            return 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4';
          case 'image':
            return 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 gap-6';
          case 'card':
          default:
            return 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6';
      }
  }

  return (
    <div className="space-y-8">
      <CampaignFilterComponent
        filters={filters}
        onFilterChange={handleFilterChange}
        categories={categories}
        locations={locations.map(l => ({ id: l.id, name: i18n.language === 'fa' ? l.persianName : l.englishName }))}
        audiences={audiences}
        socialNetworks={socialNetworks}
        loading={loading || loadingFilters}
        resultsCount={campaigns.length}
        layout={layout}
        onLayoutChange={onLayoutChange}
      />

      {/* Campaigns Grid Section */}
      <section>
        {(loading || loadingFilters) && (
          <div className={getGridClasses()}>
            {renderSkeletons()}
          </div>
        )}

        {error && (
          <div className="text-center p-8 bg-red-50 dark:bg-red-900/20 rounded-lg">
            <p className="text-red-600 dark:text-red-400 font-semibold">{error}</p>
          </div>
        )}

        {!(loading || loadingFilters) && !error && campaigns.length === 0 && (
          <div className="text-center p-8 bg-neutral-100 dark:bg-neutral-800 rounded-lg">
            <p className="text-neutral-500 dark:text-neutral-400 font-semibold">{t('noCampaigns')}</p>
          </div>
        )}

        {!(loading || loadingFilters) && !error && campaigns.length > 0 && (
           <div className={getGridClasses()}>
            {campaigns.map((campaign) => {
              const campaignLocations = (campaign.campaign_location as any[])?.map(l => l.locations_id.id) || [];
              const locationNames = campaignLocations
                ?.map(id => locationsMap.get(id))
                .filter((name): name is string => !!name) || [];
              
              const campaignCategories = (campaign.campaign_type as any[])?.map(c => c.categories_id.id) || [];
              const categoryNames = campaignCategories
                ?.map(id => categoriesMap.get(id))
                .filter((name): name is string => !!name) || [];

              switch(layout) {
                    case 'list':
                        return <CompactCampaignCard key={campaign.id} campaign={campaign} onSelectCampaign={onSelectCampaign} />;
                    case 'image':
                        return <ImageCard key={campaign.id} imageUrl={campaign.campaign_image} title={campaign.campaign_title} onClick={() => onSelectCampaign(campaign.id)} />;
                    case 'card':
                    default:
                        return <CampaignCard 
                                  key={campaign.id} 
                                  campaign={campaign} 
                                  locationNames={locationNames}
                                  categoryNames={categoryNames}
                                  onSelectCampaign={onSelectCampaign}
                                />;
                }
            })}
          </div>
        )}
      </section>
    </div>
  );
};

export default CampaignsPage;