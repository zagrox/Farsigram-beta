import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Page } from '../types';
import SectionHeader from '../components/ui/SectionHeader';
import { CountryCard, CountryCardSkeleton, CombinedCountryData } from '../components/ui/CountryCard';
import Button from '../components/ui/Button';

// --- TYPE DEFINITIONS (specific to this page) ---

interface ApiCategory {
  id: number;
  status: string;
  category_parent: string;
  category_name: number | null;
  category_color: string | null;
}

interface HomePageProps {
  setCurrentPage: (page: Page) => void;
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

const HomePage: React.FC<HomePageProps> = ({ setCurrentPage }) => {
  const { t } = useTranslation('home');
  const [locations, setLocations] = useState<CombinedCountryData[]>([]);
  const [categories, setCategories] = useState<ApiCategory[]>([]);
  const [loadingLocations, setLoadingLocations] = useState(true);
  const [loadingCategories, setLoadingCategories] = useState(true);

  // Fetch locations
  useEffect(() => {
    const fetchLocations = async () => {
      setLoadingLocations(true);
      try {
        const farsigramResponse = await fetch('https://crm.farsigram.com/items/locations?limit=20');
        const farsigramData = await farsigramResponse.json();
        const locations: FarsigramLocation[] = farsigramData.data;

        const detailPromises = locations.map(loc =>
          fetch(`https://restcountries.com/v3.1/alpha/${loc.country}`).then(res => res.ok ? res.json() : null)
        );
        const detailsResults = await Promise.all(detailPromises);

        const combinedData = locations
          .map((loc, index) => {
            const detail = detailsResults[index]?.[0] as RestCountry | undefined;
            if (!detail || !detail.latlng) return null;
            return {
              id: loc.id,
              code: loc.country,
              persianName: loc.country_persian,
              commonName: detail.name.common,
              flagUrl: detail.flags.svg,
              population: detail.population,
              latlng: detail.latlng,
            };
          })
          .filter((item): item is CombinedCountryData => item !== null);

        setLocations(combinedData);
      } catch (error) {
        console.error("Failed to fetch locations:", error);
      } finally {
        setLoadingLocations(false);
      }
    };
    fetchLocations();
  }, []);

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      setLoadingCategories(true);
      try {
        const response = await fetch('https://crm.farsigram.com/items/categories');
        const data = await response.json();
        const publishedParentCategories: ApiCategory[] = data.data.filter(
          (cat: ApiCategory) => cat.status === 'published' && cat.category_name === null
        );
        setCategories(publishedParentCategories);
      } catch (error) {
        console.error("Failed to fetch categories:", error);
      } finally {
        setLoadingCategories(false);
      }
    };
    fetchCategories();
  }, []);

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
        <SectionHeader title={t('exploreSectionTitle')} onViewAll={() => setCurrentPage(Page.Explore)} />
        <div className="flex items-center gap-8 overflow-x-auto pb-4 pt-2 no-scrollbar snap-x snap-mandatory -mx-6 px-6 lg:-mx-8 lg:px-8">
          {loadingLocations
            ? Array.from({ length: 20 }).map((_, i) => <CountryCardSkeleton key={i} />)
            : locations.map(country => <CountryCard key={country.id} country={country} />)}
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
        {loadingCategories ? (
          <div className="flex flex-wrap gap-3 animate-pulse">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-9 w-32 bg-neutral-200 dark:bg-neutral-700 rounded-full"></div>
            ))}
          </div>
        ) : (
          <div className="flex flex-wrap gap-3">
            {categories.map(cat => (
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