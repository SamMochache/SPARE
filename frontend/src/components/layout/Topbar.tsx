import React from 'react';
import { Link } from 'react-router-dom';
import { MenuIcon, PlusIcon } from 'lucide-react';
import { buttonClass } from '../ui/Button';
import { BranchSelector } from './BranchSelector';
import { GlobalSearch } from './GlobalSearch';
import { NotificationMenu } from './NotificationMenu';
import { UserMenu } from './UserMenu';

interface TopbarProps {
  onOpenMobileNav: () => void;
}

export function Topbar({ onOpenMobileNav }: TopbarProps) {
  return (
    <header className="h-16 shrink-0 bg-white border-b border-line flex items-center gap-2 sm:gap-3 px-3 sm:px-4 lg:px-6 z-30">
      <button
        type="button"
        onClick={onOpenMobileNav}
        aria-label="Open menu"
        className="lg:hidden w-10 h-10 rounded-lg grid place-items-center text-ink-muted hover:text-ink hover:bg-canvas">
        
        <MenuIcon className="w-5 h-5" />
      </button>
      <GlobalSearch />
      <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
        <div className="hidden md:block">
          <BranchSelector />
        </div>
        <NotificationMenu />
        <Link to="/pos" className={`${buttonClass('primary', 'md')} hidden sm:inline-flex`}>
          <PlusIcon className="w-4 h-4" aria-hidden="true" />
          New sale
        </Link>
        <UserMenu />
      </div>
    </header>);

}