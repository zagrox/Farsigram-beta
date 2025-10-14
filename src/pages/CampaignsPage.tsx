import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Button from '../components/ui/Button';
import CampaignCard, { CampaignCardSkeleton } from '../components/ui/CampaignCard';
import { API_BASE_URL } from '../constants';

// Define the Campaign interface based on the API response
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
  campaign_audience: number[];
  campaign_location: number[];
  campaign_type: number[];
}

interface CampaignsPageProps {
  onSelectCampaign: (id: number) => void;
}


const CampaignsPage: React.FC<CampaignsPageProps> = ({ onSelectCampaign }) => {
  const { t } = useTranslation('campaigns');
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCampaigns = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`${API_BASE_URL}/items/campaigns`);
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        const data = await response.json();
        // Filter for published campaigns
        const publishedCampaigns = data.data.filter((c: Campaign) => c.status === 'published');
        setCampaigns(publishedCampaigns);
      } catch (err) {
        console.error("Failed to fetch campaigns:", err);
        setError(t('error'));
      } finally {
        setLoading(false);
      }
    };

    fetchCampaigns();
  }, [t]);

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <section className="bg-white dark:bg-neutral-800/50 p-6 md:p-8 rounded-xl shadow-md flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="text-center md:text-left">
          <h2 className="text-2xl font-semibold">{t('headerTitle')}</h2>
          <p className="mt-1 text-neutral-500 dark:text-neutral-400">{t('headerDescription')}</p>
        </div>
        <Button className="flex-shrink-0">
          {t('createButton')}
        </Button>
      </section>

      {/* Campaigns Grid Section */}
      <section>
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, index) => (
              <CampaignCardSkeleton key={index} />
            ))}
          </div>
        )}

        {error && (
          <div className="text-center p-8 bg-red-50 dark:bg-red-900/20 rounded-lg">
            <p className="text-red-600 dark:text-red-400 font-semibold">{error}</p>
          </div>
        )}

        {!loading && !error && campaigns.length === 0 && (
          <div className="text-center p-8 bg-neutral-100 dark:bg-neutral-800 rounded-lg">
            <p className="text-neutral-500 dark:text-neutral-400 font-semibold">{t('noCampaigns')}</p>
          </div>
        )}

        {!loading && !error && campaigns.length > 0 && (
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {campaigns.map((campaign) => (
              <CampaignCard 
                key={campaign.id} 
                campaign={campaign} 
                onSelectCampaign={onSelectCampaign}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default CampaignsPage;