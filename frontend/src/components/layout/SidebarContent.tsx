import React from 'react';
import { NavLink } from 'react-router-dom';
import { LogOutIcon, PanelLeftCloseIcon, PanelLeftOpenIcon, WrenchIcon, XIcon } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { navItems } from '../../data/navigation';

interface SidebarContentProps {
  collapsed: boolean;
  onToggleCollapse?: () => void;
  onNavigate?: () => void;
  onClose?: () => void;
}

export function SidebarContent({ collapsed, onToggleCollapse, onNavigate, onClose }: SidebarContentProps) {
  const { user, logout } = useAuth();
  const displayName = user ? [user.first_name, user.last_name].filter(Boolean).join(' ') || user.username : 'Staff';
  const initials = displayName.split(/\s+/).map((part) => part[0]).join('').slice(0, 2).toUpperCase();
  const roleLabel = user?.is_superuser ? 'Superuser' : (user?.role || 'Staff').replace(/\b\w/g, (letter) => letter.toUpperCase());

  async function handleLogout() {
    await logout();
    window.location.assign('/login');
  }

  return (
    <>
      <div className={`h-16 shrink-0 flex items-center border-b border-white/10 ${collapsed ? 'justify-center' : 'px-5 gap-3'}`}>
        <div className="w-9 h-9 rounded-lg bg-accent grid place-items-center shrink-0"><WrenchIcon className="w-5 h-5 text-navy-950" aria-hidden="true" /></div>
        {!collapsed && <div className="min-w-0"><p className="font-semibold text-[15px] leading-tight">AutoParts Pro</p><p className="text-xs text-white/55">Sales & Inventory</p></div>}
        {onClose && <button type="button" onClick={onClose} aria-label="Close menu" className="ml-auto w-8 h-8 rounded-lg grid place-items-center text-white/70 hover:text-white hover:bg-white/10"><XIcon className="w-4 h-4" /></button>}
      </div>
      <nav className="flex-1 overflow-y-auto py-4 px-3" aria-label="Primary">
        <ul className="space-y-0.5">
          {navItems.map((item) => <li key={item.path}>
            {item.dividerBefore && <div className="my-3 border-t border-white/10" role="separator" />}
            <NavLink to={item.path} end={item.path === '/'} onClick={onNavigate} title={collapsed ? item.label : undefined}
              className={({ isActive }) => `relative flex items-center gap-3 rounded-lg h-10 text-sm font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60 ${collapsed ? 'justify-center' : 'px-3'} ${isActive ? 'bg-white/10 text-white' : 'text-white/65 hover:text-white hover:bg-white/5'}`}>
              {({ isActive }) => <>{isActive && <span className="absolute left-0 top-2 bottom-2 w-[3px] rounded-r bg-accent" aria-hidden="true" />}<item.icon className={`w-[18px] h-[18px] shrink-0 ${isActive ? 'text-accent' : ''}`} aria-hidden="true" />{!collapsed && <span className="truncate">{item.label}</span>}</>}
            </NavLink>
          </li>)}
        </ul>
      </nav>
      <div className="shrink-0 border-t border-white/10 p-3 space-y-2">
        <div className={`flex items-center gap-3 rounded-lg ${collapsed ? 'flex-col py-1' : 'px-2 py-1.5'}`}>
          <div className="w-9 h-9 rounded-full bg-white/15 grid place-items-center text-[13px] font-semibold shrink-0" aria-hidden="true">{initials || 'U'}</div>
          {!collapsed && <div className="min-w-0 flex-1"><p className="text-sm font-medium truncate">{displayName}</p><p className="text-xs text-white/55 truncate">{roleLabel}</p></div>}
          <button type="button" onClick={() => void handleLogout()} aria-label="Log out" title="Log out" className="w-8 h-8 rounded-lg grid place-items-center text-white/60 hover:text-white hover:bg-white/10 transition-colors duration-150"><LogOutIcon className="w-4 h-4" /></button>
        </div>
        {onToggleCollapse && <button type="button" onClick={onToggleCollapse} aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'} title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'} className={`w-full h-9 rounded-lg flex items-center gap-2 text-[13px] text-white/55 hover:text-white hover:bg-white/5 transition-colors duration-150 ${collapsed ? 'justify-center' : 'px-3'}`}>{collapsed ? <PanelLeftOpenIcon className="w-4 h-4" /> : <PanelLeftCloseIcon className="w-4 h-4" />}{!collapsed && 'Collapse'}</button>}
      </div>
    </>
  );
}
