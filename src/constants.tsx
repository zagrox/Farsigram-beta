import React from 'react';
import { Page } from './types';
import { HomeIcon, CampaignIcon, CultureIcon, ExploreIcon, MarketplaceIcon, InfluencersIcon, ProfileIcon, CategoryIcon, MapIcon, BusinessIcon } from './components/Icons';

export const API_BASE_URL = 'https://crm.farsigram.com';
export const ASSETS_URL = `${API_BASE_URL}/assets`;

export interface NavItem {
  id: Page;
  label: string;
  icon: React.ReactNode;
}

export const NAVIGATION_ITEMS: NavItem[] = [
  { id: Page.Home, label: 'homeFeed', icon: <HomeIcon /> },
  { id: Page.Categories, label: 'categories', icon: <CategoryIcon /> },
  { id: Page.Explore, label: 'explore', icon: <ExploreIcon /> },
  { id: Page.Campaigns, label: 'campaigns', icon: <CampaignIcon /> },
  { id: Page.Influencers, label: 'influencers', icon: <InfluencersIcon /> },
  { id: Page.Business, label: 'business', icon: <BusinessIcon /> },
  { id: Page.Map, label: 'map', icon: <MapIcon /> },
  { id: Page.Marketplace, label: 'marketplace', icon: <MarketplaceIcon /> },
  { id: Page.CulturalHub, label: 'culturalHub', icon: <CultureIcon /> },
];