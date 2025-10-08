import React from 'react';
import { Page } from './types';
import { HomeIcon, CampaignIcon, CultureIcon, ExploreIcon, MarketplaceIcon, MessageIcon, NotificationIcon, ProfileIcon } from './components/Icons';

export interface NavItem {
  id: Page;
  label: string;
  icon: React.ReactNode;
}

export const NAVIGATION_ITEMS: NavItem[] = [
  { id: Page.Home, label: 'homeFeed', icon: <HomeIcon /> },
  { id: Page.Campaigns, label: 'campaigns', icon: <CampaignIcon /> },
  { id: Page.CulturalHub, label: 'culturalHub', icon: <CultureIcon /> },
  { id: Page.Explore, label: 'explore', icon: <ExploreIcon /> },
  { id: Page.Marketplace, label: 'marketplace', icon: <MarketplaceIcon /> },
  { id: Page.Messages, label: 'messages', icon: <MessageIcon /> },
  { id: Page.Notifications, label: 'notifications', icon: <NotificationIcon /> },
];