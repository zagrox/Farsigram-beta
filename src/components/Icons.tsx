import React from 'react';
import { ASSETS_URL } from '../constants';

// Re-exporting from Heroicons with aliases to maintain consistency
export {
  HomeIcon,
  MegaphoneIcon as CampaignIcon,
  SparklesIcon as CultureIcon,
  GlobeEuropeAfricaIcon as ExploreIcon,
  Squares2X2Icon as CategoryIcon,
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
  ArrowLeftIcon,
  LightBulbIcon,
  UsersIcon,
  MapPinIcon,
  TagIcon,
  ComputerDesktopIcon
} from '@heroicons/react/24/outline';

// Keep custom brand icon
type IconProps = { className?: string };
export const FarsigramIcon: React.FC<IconProps> = ({ className = 'w-6 h-6' }) => (
  <img 
    src={`${ASSETS_URL}/9e90ea38-c50b-4dd7-99ea-bcff23b98ce1`} 
    alt="Farsigram Logo" 
    className={`${className} dark:invert`} 
  />
);