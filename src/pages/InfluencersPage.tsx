import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import InfluencerCard, { InfluencerCardSkeleton, EnrichedInfluencer } from '../components/ui/InfluencerCard';
import CompactInfluencerCard, { CompactInfluencerCardSkeleton } from '../components/ui/CompactInfluencerCard';
import { ImageCard, ImageCardSkeleton } from '../components/ui/ImageCard';
import { API_BASE_URL } from '../constants';
import InfluencerFilterComponent, { InfluencerFilterState } from '../components/ui/InfluencerFilterComponent';
import { Layout } from '../components/ui/LayoutSwitcher';
import { getSocialNetworkName } from '../utils/socialUtils';


// Raw types from API
interface SocialProfile {
  id: number;
  social_network: string;
  social_account: string;
}

interface AudienceProfile {
  id: number;
  audience_title: string;
}

interface Influencer {
  id: number;
  status: string;
  influencer_name: string;
  influencer_title: string;
  influencer_category: number;
  influencer_location: number;
  influencer_avatar: string;
  influencer_hub: boolean;
  influencer_social: { socials_id: SocialProfile }[];
  influencer_audience: { audiences_id: AudienceProfile }[];
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


interface InfluencersPageProps {
  onSelectInfluencer: (id: number) => void;
  layout: Layout;
  onLayoutChange: (layout: Layout) => void;
}

const InfluencersPage: React.FC<InfluencersPageProps> = ({ onSelectInfluencer, layout, onLayoutChange }) => {
  const { t, i18n } = useTranslation('influencers');
  const [influencers, setInfluencers] = useState<EnrichedInfluencer[]>([]);
  
  // Loading states
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingFilters, setLoadingFilters] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filter dropdown data
  const [categories, setCategories] = useState<ApiItem[]>([]);
  const [locations, setLocations] = useState<LocationApiItem[]>([]);
  const [audiences, setAudiences] = useState<ApiItem[]>([]);
  const [socialNetworks, setSocialNetworks] = useState<ApiSocialItem[]>([]);

  // Filter state
  const [filters, setFilters] = useState<InfluencerFilterState>({
    categoryId: '',
    locationId: '',
    audienceId: '',
    socialNetworkUrl: '',
    gender: 'all',
    isHubMember: false,
    searchTerm: '',
  });

  const handleFilterChange = (newFilters: Partial<InfluencerFilterState>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  // Fetch data for filter dropdowns
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
            setError(t('error')); // Generic error for now
        } finally {
            setLoadingFilters(false);
        }
    };
    fetchFilterData();
  }, [t]);

  // Memoize maps for enriching influencer data
  const categoriesMap = useMemo(() => new Map(categories.map(c => [c.id, c.name])), [categories]);
  const locationsMap = useMemo(() => new Map(locations.map(l => [l.id, {persian: l.persianName, english: l.englishName}])), [locations]);

  // Fetch influencers based on filters
  useEffect(() => {
    const fetchFilteredInfluencers = async () => {
      setLoading(true);
      setError(null);
      
      const baseUrl = `${API_BASE_URL}/items/influencers?sort=-date_created&fields=*,influencer_social.socials_id.*,influencer_audience.audiences_id.*`;
      
      const filterConditions: any[] = [{ status: { _eq: 'published' } }];

      if (filters.searchTerm) {
        filterConditions.push({
          _or: [
            { influencer_name: { _icontains: filters.searchTerm } },
            { influencer_title: { _icontains: filters.searchTerm } },
          ],
        });
      }
      if (filters.categoryId) {
        filterConditions.push({ influencer_category: { _eq: filters.categoryId } });
      }
      if (filters.locationId) {
        filterConditions.push({ influencer_location: { _eq: filters.locationId } });
      }
      if (filters.audienceId) {
        filterConditions.push({ influencer_audience: { audiences_id: { _eq: filters.audienceId } } });
      }
      if (filters.socialNetworkUrl) {
        filterConditions.push({ influencer_social: { socials_id: { social_network: { _eq: filters.socialNetworkUrl } } } });
      }
      if (filters.gender !== 'all') {
        filterConditions.push({ influencer_gender: { _eq: filters.gender } });
      }
      if (filters.isHubMember) {
        filterConditions.push({ influencer_hub: { _eq: true } });
      }

      const filterObject = { _and: filterConditions };
      const url = `${baseUrl}&filter=${encodeURIComponent(JSON.stringify(filterObject))}`;

      try {
        const influencersRes = await fetch(url);
        if (!influencersRes.ok) {
          throw new Error('Network response was not ok');
        }

        const influencersData = await influencersRes.json();

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
        console.error("Failed to fetch influencers data:", err);
        setError(t('error'));
      } finally {
        setLoading(false);
      }
    };

    if (!loadingFilters) {
        fetchFilteredInfluencers();
    }
  }, [filters, t, i18n.language, categoriesMap, locationsMap, loadingFilters]);

  const renderSkeletons = () => {
    const skeletonCount = 12;
    switch (layout) {
        case 'list':
            return Array.from({ length: 6 }).map((_, index) => <CompactInfluencerCardSkeleton key={index} />);
        case 'image':
            return Array.from({ length: skeletonCount }).map((_, index) => <ImageCardSkeleton key={index} />);
        case 'card':
        default:
            return Array.from({ length: 8 }).map((_, index) => <InfluencerCardSkeleton key={index} />);
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
            return 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-6';
      }
  }

  return (
    <div className="space-y-8">
      {/* Filters Section */}
      <InfluencerFilterComponent
        filters={filters}
        onFilterChange={handleFilterChange}
        categories={categories}
        locations={locations.map(l => ({ id: l.id, name: i18n.language === 'fa' ? l.persianName : l.englishName }))}
        audiences={audiences}
        socialNetworks={socialNetworks}
        loading={loading || loadingFilters}
        resultsCount={influencers.length}
        layout={layout}
        onLayoutChange={onLayoutChange}
      />

      {/* Influencers Grid Section */}
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

        {!(loading || loadingFilters) && !error && influencers.length === 0 && (
          <div className="text-center p-8 bg-neutral-100 dark:bg-neutral-800 rounded-lg">
            <p className="text-neutral-500 dark:text-neutral-400 font-semibold">{t('noInfluencers')}</p>
          </div>
        )}

        {!(loading || loadingFilters) && !error && influencers.length > 0 && (
           <div className={getGridClasses()}>
            {influencers.map((influencer) => {
                switch(layout) {
                    case 'list':
                        return <CompactInfluencerCard key={influencer.id} influencer={influencer} onSelectInfluencer={onSelectInfluencer} />;
                    case 'image':
                        return <ImageCard key={influencer.id} imageUrl={influencer.influencer_avatar} title={influencer.influencer_name} onClick={() => onSelectInfluencer(influencer.id)} />;
                    case 'card':
                    default:
                        return <InfluencerCard key={influencer.id} influencer={influencer} onSelectInfluencer={onSelectInfluencer} />;
                }
            })}
          </div>
        )}
      </section>
    </div>
  );
};

export default InfluencersPage;
