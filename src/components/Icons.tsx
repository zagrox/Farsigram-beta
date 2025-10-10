import React from 'react';

// Re-exporting from Heroicons with aliases to maintain consistency
export {
  HomeIcon,
  MegaphoneIcon as CampaignIcon,
  SparklesIcon as CultureIcon,
  GlobeEuropeAfricaIcon as ExploreIcon,
  ShoppingBagIcon as MarketplaceIcon,
  ChatBubbleOvalLeftEllipsisIcon as MessageIcon,
  BellIcon as NotificationIcon,
  UserCircleIcon as ProfileIcon,
  Cog6ToothIcon as SettingsIcon,
  ArrowRightStartOnRectangleIcon as LogoutIcon,
  SunIcon,
  MoonIcon,
  MagnifyingGlassIcon as SearchIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline';

// Keep custom brand icon
type IconProps = { className?: string };
export const FarsigramIcon: React.FC<IconProps> = ({ className = 'w-6 h-6' }) => (
  <img 
    src="https://crm.ir48.com/assets/14240e0b-beee-4d60-9dd3-e4794746c53e" 
    alt="Farsigram Logo" 
    className={`${className} dark:invert`} 
  />
);