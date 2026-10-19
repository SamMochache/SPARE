import React, { useEffect, useId } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { XIcon } from 'lucide-react';

type ModalSize = 'sm' | 'md' | 'lg' | 'xl';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: React.ReactNode;
  size?: ModalSize;
  children: React.ReactNode;
  footer?: React.ReactNode;
  dismissible?: boolean;
}

const sizeClasses: Record<ModalSize, string> = {
  sm: 'sm:max-w-md',
  md: 'sm:max-w-lg',
  lg: 'sm:max-w-2xl',
  xl: 'sm:max-w-4xl'
};

export function Modal({ open, onClose, title, description, size = 'md', children, footer, dismissible = true }: ModalProps) {
  const titleId = useId();

  useEffect(() => {
    if (!open || !dismissible) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open, onClose, dismissible]);

  return (
    <AnimatePresence>
      {open &&
      <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center sm:p-4" role="dialog" aria-modal="true" aria-labelledby={titleId}>
          <motion.div
          className="absolute inset-0 bg-navy-950/50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          onClick={dismissible ? onClose : undefined} />
        
          <motion.div
          className={`relative w-full ${sizeClasses[size]} bg-white rounded-t-2xl sm:rounded-xl shadow-pop flex flex-col max-h-[94vh] sm:max-h-[90vh]`}
          initial={{ opacity: 0, scale: 0.96, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.98, y: 4 }}
          transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}>
          
            <header className="flex items-start gap-4 px-5 py-4 border-b border-line">
              <div className="min-w-0 flex-1">
                <h2 id={titleId} className="text-base font-semibold text-ink">
                  {title}
                </h2>
                {description && <div className="text-[13px] text-ink-muted mt-0.5">{description}</div>}
              </div>
              {dismissible &&
            <button
              type="button"
              onClick={onClose}
              aria-label="Close dialog"
              className="w-8 h-8 -mr-1.5 -mt-1 rounded-lg grid place-items-center text-ink-subtle hover:text-ink hover:bg-canvas transition-colors duration-150">
              
                  <XIcon className="w-4 h-4" />
                </button>
            }
            </header>
            <div className="flex-1 overflow-y-auto px-5 py-5">{children}</div>
            {footer && <footer className="px-5 py-3.5 border-t border-line bg-canvas/70 flex flex-wrap justify-end gap-2 sm:rounded-b-xl">{footer}</footer>}
          </motion.div>
        </div>
      }
    </AnimatePresence>);

}