import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { LogOutIcon, RotateCcwIcon, SettingsIcon, UserIcon } from 'lucide-react';
import { toast } from 'sonner';
import { useAppData } from '../../contexts/AppDataContext';
import { currentUser } from '../../data/shop';
import { useClickOutside } from '../../hooks/useClickOutside';
import { ConfirmationDialog } from '../ui/ConfirmationDialog';

export function UserMenu() {
  const { resetDemoData } = useAppData();
  const [open, setOpen] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const ref = useClickOutside<HTMLDivElement>(() => setOpen(false), open);

  const itemClass = 'w-full flex items-center gap-2.5 px-3.5 py-2 text-sm text-ink hover:bg-canvas transition-colors duration-150';

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label="Open user menu"
        aria-expanded={open}
        className="w-10 h-10 rounded-full bg-navy text-white text-[13px] font-semibold grid place-items-center hover:bg-navy-800 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:ring-offset-2">
        
        {currentUser.initials}
      </button>
      <AnimatePresence>
        {open &&
        <motion.div
          initial={{ opacity: 0, y: -4, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -4, scale: 0.98 }}
          transition={{ duration: 0.15, ease: [0.23, 1, 0.32, 1] }}
          className="absolute right-0 top-12 z-40 w-64 bg-white border border-line rounded-xl shadow-pop py-1.5 origin-top-right">
          
            <div className="px-3.5 py-2.5 border-b border-line mb-1.5">
              <p className="text-sm font-semibold text-ink">{currentUser.name}</p>
              <p className="text-xs text-ink-muted">{currentUser.email}</p>
              <p className="text-xs text-ink-muted mt-0.5">{currentUser.role}</p>
            </div>
            <Link to="/settings" onClick={() => setOpen(false)} className={itemClass}>
              <UserIcon className="w-4 h-4 text-ink-muted" aria-hidden="true" /> My profile
            </Link>
            <Link to="/settings" onClick={() => setOpen(false)} className={itemClass}>
              <SettingsIcon className="w-4 h-4 text-ink-muted" aria-hidden="true" /> Preferences
            </Link>
            <button
            type="button"
            onClick={() => {
              setOpen(false);
              setConfirmReset(true);
            }}
            className={itemClass}>
            
              <RotateCcwIcon className="w-4 h-4 text-ink-muted" aria-hidden="true" /> Reset demo data
            </button>
            <div className="border-t border-line mt-1.5 pt-1.5">
              <button type="button" onClick={() => toast('Sign-out is not connected yet', { description: 'Authentication will be handled by the backend.' })} className={`${itemClass} text-danger`}>
                <LogOutIcon className="w-4 h-4" aria-hidden="true" /> Log out
              </button>
            </div>
          </motion.div>
        }
      </AnimatePresence>
      <ConfirmationDialog
        open={confirmReset}
        title="Reset demo data?"
        description="This restores the original sample products, customers and stock levels, and clears held and recorded prototype sales stored in this browser."
        confirmLabel="Reset data"
        onCancel={() => setConfirmReset(false)}
        onConfirm={() => {
          resetDemoData();
          setConfirmReset(false);
          toast.success('Demo data restored');
        }} />
      
    </div>);

}