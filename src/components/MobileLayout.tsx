'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  InboxIcon, 
  ClipboardDocumentCheckIcon,
  MagnifyingGlassIcon,
  UserCircleIcon,
  BellIcon,
  CameraIcon,
  PlusIcon,
} from '@heroicons/react/24/outline';
import { 
  InboxIcon as InboxIconSolid,
  ClipboardDocumentCheckIcon as ClipboardSolid,
  MagnifyingGlassIcon as SearchSolid,
  UserCircleIcon as UserSolid,
} from '@heroicons/react/24/solid';
import { useState } from 'react';

interface MobileLayoutProps {
  children: React.ReactNode;
  title?: string;
  showBack?: boolean;
  onBack?: () => void;
  rightAction?: React.ReactNode;
}

const tabs = [
  { 
    name: 'Inbox', 
    href: '/mobile', 
    icon: InboxIcon, 
    activeIcon: InboxIconSolid,
    badge: 12 // Pending count
  },
  { 
    name: 'Review', 
    href: '/mobile/review', 
    icon: ClipboardDocumentCheckIcon, 
    activeIcon: ClipboardSolid,
    badge: 5 // In review count
  },
  { 
    name: 'Scan', 
    href: '/mobile/scan', 
    icon: CameraIcon,
    activeIcon: CameraIcon,
    isCenter: true, // Special center button
  },
  { 
    name: 'Search', 
    href: '/mobile/search', 
    icon: MagnifyingGlassIcon, 
    activeIcon: SearchSolid,
  },
  { 
    name: 'Profile', 
    href: '/mobile/profile', 
    icon: UserCircleIcon, 
    activeIcon: UserSolid,
  },
];

export default function MobileLayout({ 
  children, 
  title,
  showBack = false,
  onBack,
  rightAction
}: MobileLayoutProps) {
  const pathname = usePathname();
  const [notifications] = useState(3);

  // Check if current path matches tab
  const isTabActive = (href: string) => {
    if (href === '/mobile') {
      return pathname === '/mobile';
    }
    return pathname.startsWith(href);
  };

  return (
    <div className="mobile-app">
      {/* Status bar spacer for iOS */}
      <div className="h-safe-top bg-white" />
      
      {/* Header */}
      <header className="mobile-header">
        <div className="mobile-header-left">
          {showBack ? (
            <button 
              onClick={onBack || (() => window.history.back())}
              className="mobile-back-btn"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          ) : (
            <img 
              src="https://www.mcoadvantage.com/wp-content/uploads/2023/03/mco-advantage_logonav.webp" 
              alt="DOKit" 
              className="h-8"
            />
          )}
        </div>
        
        <div className="mobile-header-center">
          {title && <h1 className="mobile-header-title">{title}</h1>}
        </div>
        
        <div className="mobile-header-right">
          {rightAction || (
            <button className="mobile-icon-btn relative">
              <BellIcon className="w-6 h-6" />
              {notifications > 0 && (
                <span className="notification-badge">{notifications}</span>
              )}
            </button>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="mobile-content">
        {children}
      </main>

      {/* Bottom Tab Bar */}
      <nav className="mobile-tab-bar">
        {tabs.map((tab) => {
          const active = isTabActive(tab.href);
          const Icon = active ? tab.activeIcon : tab.icon;
          
          // Special center Scan button
          if (tab.isCenter) {
            return (
              <Link
                key={tab.name}
                href={tab.href}
                className="mobile-tab-scan"
              >
                <div className="mobile-tab-scan-btn">
                  <CameraIcon className="w-6 h-6" />
                </div>
                <span className="mobile-tab-label">{tab.name}</span>
              </Link>
            );
          }
          
          return (
            <Link
              key={tab.name}
              href={tab.href}
              className={`mobile-tab ${active ? 'active' : ''}`}
            >
              <div className="mobile-tab-icon-wrapper">
                <Icon className="mobile-tab-icon" />
                {tab.badge && tab.badge > 0 && (
                  <span className="mobile-tab-badge">{tab.badge}</span>
                )}
              </div>
              <span className="mobile-tab-label">{tab.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Safe area spacer for bottom */}
      <div className="h-safe-bottom bg-white" />
    </div>
  );
}
