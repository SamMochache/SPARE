import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { SidebarContent } from './SidebarContent';

interface SidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export function Sidebar({ collapsed, onToggleCollapse, mobileOpen, onCloseMobile }: SidebarProps) {
  return (
    <>
      <aside
        className={`hidden lg:flex flex-col shrink-0 bg-navy text-white transition-[width] duration-200 ease-out ${collapsed ? 'w-[72px]' : 'w-[248px]'}`}
        aria-label="Main navigation">
        
        <SidebarContent collapsed={collapsed} onToggleCollapse={onToggleCollapse} />
      </aside>

      <AnimatePresence>
        {mobileOpen &&
        <div className="lg:hidden fixed inset-0 z-50">
            <motion.div
            className="absolute inset-0 bg-navy-950/50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onCloseMobile} />
          
            <motion.aside
            className="absolute inset-y-0 left-0 w-[272px] bg-navy text-white flex flex-col shadow-pop"
            aria-label="Main navigation"
            initial={{ x: -272 }}
            animate={{ x: 0 }}
            exit={{ x: -272 }}
            transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}>
            
              <SidebarContent collapsed={false} onNavigate={onCloseMobile} onClose={onCloseMobile} />
            </motion.aside>
          </div>
        }
      </AnimatePresence>
    </>);

}