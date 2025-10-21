import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Page } from '../types';
import SectionHeader from '../components/ui/SectionHeader';
import { CountryCard, CountryCardSkeleton, CombinedCountryData } from '../components/ui/CountryCard';
import Button from '../components/ui/Button';
import { API_BASE_URL } from '../constants';
import { EnrichedInfluencer } from '../components/ui/InfluencerCard';
import CompactInfluencerCard, { CompactInfluencerCardSkeleton } from '../components/ui/CompactInfluencerCard';
import CompactCampaignCard, { CompactCampaignCardSkeleton } from '../components/ui/CompactCampaignCard';
import CompactBusinessCard, { CompactBusinessCardSkeleton } from '../components/ui/CompactBusinessCard';

// --- TYPE DEFINITIONS ---

interface ApiCategory {
  id: number;
  status: string;
  category_parent: string;
  category_name: number | null; // parent id
  category_color: string | null;
}
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
interface HomePageProps {
  setCurrentPage: (page: Page) => void;
  onSelectLocation: (id: number) => void;
  onSelectInfluencer: (id: number) => void;
  onSelectCampaign: (id: number) => void;
  onSelectBusiness: (id: number) => void;
}
interface FarsigramLocation {
  id: number;
  country: string;
  country_persian: string;
}
interface RestCountry {
  name: { common: string };
  flags: { svg: string };
  population: number;
  latlng: [number, number];
}

// --- IN-PAGE COMPONENTS ---

const ProductCard: React.FC<{ title: string; imageUrl: string }> = ({ title, imageUrl }) => (
  <div className="bg-white dark:bg-neutral-800/50 rounded-xl overflow-hidden flex-shrink-0 w-48 snap-start group">
    <div className="aspect-square bg-neutral-100 dark:bg-neutral-800">
      <img src={imageUrl} alt={title} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
    </div>
    <div className="p-3">
      <h4 className="font-semibold text-sm truncate text-neutral-800 dark:text-neutral-200">{title}</h4>
    </div>
  </div>
);

// --- MAIN COMPONENT ---

const HomePage: React.FC<HomePageProps> = ({ setCurrentPage, onSelectLocation, onSelectInfluencer, onSelectCampaign, onSelectBusiness }) => {
  const { t, i18n } = useTranslation('home');
  
  // Page content state
  const [locations, setLocations] = useState<CombinedCountryData[]>([]);
  const [popularCategories, setPopularCategories] = useState<ApiCategory[]>([]);
  const [latestInfluencers, setLatestInfluencers] = useState<EnrichedInfluencer[]>([]);
  const [latestCampaigns, setLatestCampaigns] = useState<Campaign[]>([]);
  const [latestBusinesses, setLatestBusinesses] = useState<Business[]>([]);
  
  // Loading states
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAllData = async () => {
        setLoading(true);
        try {
            const [
                locationsRes,
                categoriesRes,
                influencersRes,
                campaignsRes,
                businessesRes
            ] = await Promise.all([
                fetch(`${API_BASE_URL}/items/locations?limit=20`),
                fetch(`${API_BASE_URL}/items/categories?fields=id,status,category_parent,category_name,category_color&limit=-1`),
                fetch(`${API_BASE_URL}/items/influencers?limit=5&sort=-date_created&fields=*,influencer_social.socials_id.*,influencer_audience.audiences_id.*&filter[status][_eq]=published`),
                fetch(`${API_BASE_URL}/items/campaigns?limit=5&sort=-date_created&fields=id,campaign_image,campaign_color,campaign_goal,campaign_title&filter[status][_eq]=published`),
                fetch(`${API_BASE_URL}/items/business?limit=5&sort=-date_created&fields=id,business_logo,business_name,business_slogan&filter[status][_eq]=published`),
            ]);

            // 1. Process Locations
            const farsigramData = await locationsRes.json();
            const farsigramLocations: FarsigramLocation[] = farsigramData.data;
            const detailPromises = farsigramLocations.map(loc =>
              fetch(`https://restcountries.com/v3.1/alpha/${loc.country}`).then(res => res.ok ? res.json() : null)
            );
            const detailsResults = await Promise.all(detailPromises);
            const combinedLocationData = farsigramLocations.map((loc, index) => {
                const detail = detailsResults[index]?.[0] as RestCountry | undefined;
                if (!detail || !detail.latlng) return null;
                return {
                  id: loc.id, code: loc.country, persianName: loc.country_persian, commonName: detail.name.common,
                  flagUrl: detail.flags.svg, population: detail.population, latlng: detail.latlng,
                };
            }).filter((item): item is CombinedCountryData => item !== null);
            setLocations(combinedLocationData);

            // Create location map for enrichment
            const locationsMap = new Map(farsigramLocations.map((loc, index) => {
                const detail = detailsResults[index]?.[0];
                let englishName = detail?.name?.common || loc.country_persian;
                if (loc.country_persian === 'جهانی') englishName = 'Global';
                return [loc.id, { persian: loc.country_persian, english: englishName }];
            }));

            // 2. Process Categories
            const categoriesData = await categoriesRes.json();
            const allCategories: ApiCategory[] = categoriesData.data;
            const publishedParentCategories = allCategories.filter(cat => cat.status === 'published' && cat.category_name === null);
            setPopularCategories(publishedParentCategories);
            const categoriesMap = new Map(allCategories.map(c => [c.id, c.category_parent]));

            // 3. Process Influencers (and enrich)
            const influencersData = await influencersRes.json();
            const enrichedInfluencers = influencersData.data.map((inf: Influencer): EnrichedInfluencer => {
                const locationInfo = locationsMap.get(inf.influencer_location);
                const locationName = i18n.language === 'fa' ? (locationInfo?.persian || 'N/A') : (locationInfo?.english || locationInfo?.persian || 'N/A');
                return {
                  id: inf.id, influencer_name: inf.influencer_name, influencer_title: inf.influencer_title,
                  influencer_avatar: inf.influencer_avatar, categoryName: categoriesMap.get(inf.influencer_category) || 'N/A',
                  locationName: locationName, isHubMember: inf.influencer_hub || false,
                  socials: inf.influencer_social?.map(j => j.socials_id).filter(Boolean) || [],
                  audiences: inf.influencer_audience?.map(j => ({ id: j.audiences_id.id, name: j.audiences_id.audience_title })).filter(a => a.id && a.name) || [],
                };
            });
            setLatestInfluencers(enrichedInfluencers);

            // 4. Process Campaigns & Businesses
            const campaignsData = await campaignsRes.json();
            setLatestCampaigns(campaignsData.data);
            const businessesData = await businessesRes.json();
            setLatestBusinesses(businessesData.data);

        } catch (error) {
            console.error("Failed to fetch homepage data:", error);
        } finally {
            setLoading(false);
        }
    };
    fetchAllData();
  }, [i18n.language]);

  const sampleProducts = [
    { id: 1, title: t('sampleProduct1'), imageUrl: 'https://picsum.photos/seed/product1/300/300' },
    { id: 2, title: t('sampleProduct2'), imageUrl: 'https://picsum.photos/seed/product2/300/300' },
    { id: 3, title: t('sampleProduct3'), imageUrl: 'https://picsum.photos/seed/product3/300/300' },
    { id: 4, title: t('sampleProduct4'), imageUrl: 'https://picsum.photos/seed/product4/300/300' },
  ];

  return (
    <div className="space-y-12">
      {/* Creator Spotlight Section */}
      <section className="relative bg-white dark:bg-neutral-800/50 rounded-2xl shadow-lg overflow-hidden h-80 flex items-center">
        <img
          src="https://picsum.photos/seed/creator-bg/1200/400"
          alt="Creator background"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-black/10 dark:from-black/80 dark:to-black/20"></div>
        <div className="relative z-10 p-8 md:p-12 text-white max-w-2xl">
          <h2 className="text-sm font-bold uppercase tracking-widest text-secondary-light">{t('creatorSpotlightTitle')}</h2>
          <p className="text-3xl md:text-4xl font-bold mt-2">{t('creatorSpotlightDescription')}</p>
          <Button variant="secondary" onClick={() => setCurrentPage(Page.Profile)}>
            {t('creatorSpotlightButton')}
          </Button>
        </div>
      </section>

      {/* Explore Section */}
      <section>
        <SectionHeader title={t('exploreSectionTitle')} onViewAll={() => setCurrentPage(Page.Map)} />
        <div className="flex items-center gap-8 overflow-x-auto pb-4 pt-2 no-scrollbar snap-x snap-mandatory">
          {loading
            ? Array.from({ length: 10 }).map((_, i) => <CountryCardSkeleton key={i} />)
            : locations.map(country => <CountryCard key={country.id} country={country} onSelect={() => onSelectLocation(country.id)} />)}
        </div>
      </section>
      
      {/* Latest Influencers Section */}
      <section>
        <SectionHeader title={t('latestInfluencersSectionTitle')} onViewAll={() => setCurrentPage(Page.Influencers)} />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
          {loading
            ? Array.from({ length: 5 }).map((_, i) => <CompactInfluencerCardSkeleton key={i} />)
            : latestInfluencers.map(influencer => <CompactInfluencerCard key={influencer.id} influencer={influencer} onSelectInfluencer={onSelectInfluencer} />)}
        </div>
      </section>
      
      {/* Latest Campaigns Section */}
      <section>
        <SectionHeader title={t('latestCampaignsSectionTitle')} onViewAll={() => setCurrentPage(Page.Campaigns)} />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
          {loading
            ? Array.from({ length: 5 }).map((_, i) => <CompactCampaignCardSkeleton key={i} />)
            : latestCampaigns.map(campaign => <CompactCampaignCard key={campaign.id} campaign={campaign} onSelectCampaign={onSelectCampaign} />)}
        </div>
      </section>
      
      {/* Latest Businesses Section */}
      <section>
        <SectionHeader title={t('latestBusinessesSectionTitle')} onViewAll={() => setCurrentPage(Page.Business)} />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
          {loading
            ? Array.from({ length: 5 }).map((_, i) => <CompactBusinessCardSkeleton key={i} />)
            : latestBusinesses.map(business => <CompactBusinessCard key={business.id} business={business} onSelectBusiness={onSelectBusiness} />)}
        </div>
      </section>
      
      {/* Two Column Section: Campaign & Cultural Hub */}
      <section className="grid md:grid-cols-2 gap-8">
        {/* Featured Campaign */}
        <div className="bg-white dark:bg-neutral-800/50 p-8 rounded-2xl shadow-md text-center flex flex-col items-center justify-center">
          <h3 className="text-2xl font-semibold text-neutral-800 dark:text-neutral-200">{t('trendingCampaignTitle')}</h3>
          <p className="mt-2 text-neutral-500 dark:text-neutral-400 max-w-sm">{t('trendingCampaignDescription')}</p>
          <Button onClick={() => setCurrentPage(Page.Campaigns)}>
            {t('learnMore')}
          </Button>
        </div>
        {/* Cultural Spotlight */}
        <div className="bg-white dark:bg-neutral-800/50 p-8 rounded-2xl shadow-md text-center flex flex-col items-center justify-center">
           <h3 className="text-2xl font-semibold text-neutral-800 dark:text-neutral-200">{t('culturalHubSectionTitle')}</h3>
          <p className="mt-2 text-neutral-500 dark:text-neutral-400 max-w-sm">{t('culturalSpotlightDescription')}</p>
          <Button variant="secondary" onClick={() => setCurrentPage(Page.CulturalHub)}>
            {t('readStory')}
          </Button>
        </div>
      </section>

      {/* Marketplace Section */}
      <section>
        <SectionHeader title={t('marketplaceSectionTitle')} onViewAll={() => setCurrentPage(Page.Marketplace)} />
        <div className="flex gap-6 overflow-x-auto pb-4 no-scrollbar snap-x snap-mandatory">
          {sampleProducts.map(product => <ProductCard key={product.id} {...product} />)}
        </div>
      </section>

      {/* Categories Section */}
      <section>
        <SectionHeader title={t('categoriesSectionTitle')} onViewAll={() => setCurrentPage(Page.Categories)} />
        {loading ? (
          <div className="flex flex-wrap gap-3 animate-pulse">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-9 w-32 bg-neutral-200 dark:bg-neutral-700 rounded-full"></div>
            ))}
          </div>
        ) : (
          <div className="flex flex-wrap gap-3">
            {popularCategories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setCurrentPage(Page.Categories)}
                className="text-md font-medium text-neutral-700 dark:text-neutral-300 bg-neutral-100 dark:bg-neutral-700/50 px-5 py-2 rounded-full cursor-pointer transition-colors hover:bg-primary/10 hover:text-primary dark:hover:bg-primary/20"
                style={{ border: `1px solid ${cat.category_color || 'transparent'}` }}
              >
                {cat.category_parent}
              </button>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default HomePage;
