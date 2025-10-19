import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import BusinessCard, { BusinessCardSkeleton } from '../components/ui/BusinessCard';
import { API_BASE_URL } from '../constants';
import BusinessFilterComponent, { BusinessFilterState } from '../components/ui/BusinessFilterComponent';
import { Layout } from '../components/ui/LayoutSwitcher';
import CompactBusinessCard, { CompactBusinessCardSkeleton } from '../components/ui/CompactBusinessCard';
import { ImageCard, ImageCardSkeleton } from '../components/ui/ImageCard';

// Raw API type
interface Business {
  id: number;
  status: string;
  business_logo: string;
  business_color: string | null;
  business_name: string;
  business_slogan: string;
  business_tags: string[] | null;
  business_category: number;
  business_location: number;
  business_audience: { audiences_id: { id: number } }[];
}

interface BusinessPageProps {
  onSelectBusiness: (id: number) => void;
  layout: Layout;
  onLayoutChange: (layout: Layout) => void;
}

// Helper types for enriched data
interface ApiItem {
  id: number;
  name: string;
}
interface LocationApiItem {
    id: number;
    persianName: string;
    englishName: string;
}

const BusinessPage: React.FC<BusinessPageProps> = ({ onSelectBusiness, layout, onLayoutChange }) => {
  const { t, i18n } = useTranslation('business');
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // Data for enriching businesses and for filters
  const [categories, setCategories] = useState<ApiItem[]>([]);
  const [locations, setLocations] = useState<LocationApiItem[]>([]);
  const [audiences, setAudiences] = useState<ApiItem[]>([]);
  const [loadingFilters, setLoadingFilters] = useState<boolean>(true);

  // Filter state
  const [filters, setFilters] = useState<BusinessFilterState>({
    categoryId: '',
    locationId: '',
    audienceId: '',
    searchTerm: '',
  });

  const handleFilterChange = (newFilters: Partial<BusinessFilterState>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  useEffect(() => {
    const fetchFilterData = async () => {
        setLoadingFilters(true);
        try {
            const [categoriesRes, locationsRes, audiencesRes] = await Promise.all([
                fetch(`${API_BASE_URL}/items/categories?filter[status][_eq]=published&fields=id,category_parent&limit=-1`),
                fetch(`${API_BASE_URL}/items/locations?fields=id,country_persian,country&limit=-1`),
                fetch(`${API_BASE_URL}/items/audiences?filter[status][_eq]=published&fields=id,audience_title&limit=-1`),
            ]);
            if (!categoriesRes.ok || !locationsRes.ok || !audiencesRes.ok) {
                throw new Error('Failed to fetch filter data');
            }

            const categoriesData = await categoriesRes.json();
            setCategories(categoriesData.data.map((c: { id: number; category_parent: string }) => ({ id: c.id, name: c.category_parent })));

            const locationsData = await locationsRes.json();
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

            const audiencesData = await audiencesRes.json();
            setAudiences(audiencesData.data.map((a: { id: number; audience_title: string }) => ({ id: a.id, name: a.audience_title })));
            
        } catch (error) {
            console.error("Failed to fetch filter data:", error);
            setError(t('error'));
        } finally {
            setLoadingFilters(false);
        }
    };
    fetchFilterData();
  }, [t]);

  const categoriesMap = useMemo(() => new Map(categories.map(c => [c.id, c.name])), [categories]);
  const locationsMap = useMemo(() => new Map(locations.map(l => [l.id, i18n.language === 'fa' ? l.persianName : l.englishName])), [locations, i18n.language]);

  useEffect(() => {
    const fetchBusinessData = async () => {
      if (loadingFilters) return; // Wait for filter data to load first
      setLoading(true);
      setError(null);
      
      const baseUrl = `${API_BASE_URL}/items/business?sort=-date_created&fields=*,business_audience.audiences_id.id`;
      
      const filterConditions: any[] = [{ status: { _eq: 'published' } }];

      if (filters.searchTerm) {
        filterConditions.push({
          _or: [
            { business_name: { _icontains: filters.searchTerm } },
            { business_slogan: { _icontains: filters.searchTerm } },
          ],
        });
      }
      if (filters.categoryId) {
        filterConditions.push({ business_category: { _eq: filters.categoryId } });
      }
      if (filters.locationId) {
        filterConditions.push({ business_location: { _eq: filters.locationId } });
      }
      if (filters.audienceId) {
        filterConditions.push({ business_audience: { audiences_id: { _eq: filters.audienceId } } });
      }

      const filterObject = { _and: filterConditions };
      const url = `${baseUrl}&filter=${encodeURIComponent(JSON.stringify(filterObject))}`;

      try {
        const res = await fetch(url);
        if (!res.ok) {
          throw new Error('Network response was not ok');
        }
        const data = await res.json();
        setBusinesses(data.data);
      } catch (err) {
        console.error("Failed to fetch businesses data:", err);
        setError(t('error'));
      } finally {
        setLoading(false);
      }
    };

    fetchBusinessData();
  }, [t, filters, loadingFilters]);

  const renderSkeletons = () => {
    const skeletonCount = 12;
    switch (layout) {
        case 'list':
            return Array.from({ length: 6 }).map((_, index) => <CompactBusinessCardSkeleton key={index} />);
        case 'image':
            return Array.from({ length: skeletonCount }).map((_, index) => <ImageCardSkeleton key={index} />);
        case 'card':
        default:
            return Array.from({ length: 6 }).map((_, index) => <BusinessCardSkeleton key={index} />);
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
      <BusinessFilterComponent
        filters={filters}
        onFilterChange={handleFilterChange}
        categories={categories}
        locations={locations.map(l => ({ id: l.id, name: i18n.language === 'fa' ? l.persianName : l.englishName }))}
        audiences={audiences}
        loading={loading || loadingFilters}
        resultsCount={businesses.length}
        layout={layout}
        onLayoutChange={onLayoutChange}
      />
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

        {!(loading || loadingFilters) && !error && businesses.length === 0 && (
          <div className="text-center p-8 bg-neutral-100 dark:bg-neutral-800 rounded-lg">
            <p className="text-neutral-500 dark:text-neutral-400 font-semibold">{t('noBusinesses')}</p>
          </div>
        )}

        {!(loading || loadingFilters) && !error && businesses.length > 0 && (
           <div className={getGridClasses()}>
            {businesses.map((business) => {
                switch(layout) {
                    case 'list':
                        return <CompactBusinessCard key={business.id} business={business} onSelectBusiness={onSelectBusiness} />;
                    case 'image':
                        return <ImageCard key={business.id} imageUrl={business.business_logo} title={business.business_name} onClick={() => onSelectBusiness(business.id)} />;
                    case 'card':
                    default:
                        return <BusinessCard 
                                  key={business.id} 
                                  business={business} 
                                  locationName={locationsMap.get(business.business_location) || ''}
                                  categoryName={categoriesMap.get(business.business_category) || ''}
                                  onSelectBusiness={onSelectBusiness}
                                />;
                }
            })}
          </div>
        )}
      </section>
    </div>
  );
};

export default BusinessPage;