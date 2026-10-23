import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { BellIcon } from 'lucide-react';
import { toast } from 'sonner';
import { apiRequest } from '../../api/client';
import { useClickOutside } from '../../hooks/useClickOutside';
import type { AppNotification, NotificationTone } from '../../types/shop';

const toneDot: Record<NotificationTone, string> = { danger: 'bg-danger', warning: 'bg-warning', info: 'bg-info', success: 'bg-success' };
function normalizeNotifications(value: unknown): AppNotification[] {
  const rows = Array.isArray(value) ? value : value && typeof value === 'object' && 'results' in value && Array.isArray((value as { results: unknown }).results) ? (value as { results: unknown[] }).results : [];
  return rows.filter((item): item is AppNotification => Boolean(item && typeof item === 'object' && 'id' in item && 'title' in item && 'body' in item));
}

export function NotificationMenu() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const ref = useClickOutside<HTMLDivElement>(() => setOpen(false), open);
  const unread = items.filter((n) => !n.read).length;
  const loadNotifications = useCallback(async () => {
    setLoading(true); setError('');
    try { setItems(normalizeNotifications(await apiRequest<unknown>('/api/v1/health/notifications/'))); }
    catch (err) { setError(err instanceof Error ? err.message : 'Could not load notifications.'); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void loadNotifications(); }, [loadNotifications]);
  async function markRead(id: string | number) {
    try { await apiRequest('/api/v1/health/notifications/' + id + '/read/', { method: 'POST' }); setItems((prev) => prev.map((item) => String(item.id) === String(id) ? { ...item, read: true } : item)); }
    catch (err) { toast.error(err instanceof Error ? err.message : 'Could not mark notification as read.'); }
  }
  async function markAllRead() {
    try { await apiRequest('/api/v1/health/notifications/read-all/', { method: 'POST' }); setItems((prev) => prev.map((item) => ({ ...item, read: true }))); }
    catch (err) { toast.error(err instanceof Error ? err.message : 'Could not mark notifications as read.'); }
  }
  async function openItem(n: AppNotification) { if (!n.read) await markRead(n.id); setOpen(false); navigate(n.link || '/'); }
  return <div ref={ref} className="relative">
    <button type="button" onClick={() => { setOpen((value) => !value); if (!open) void loadNotifications(); }} aria-label={'Notifications, ' + unread + ' unread'} aria-expanded={open} className="relative w-10 h-10 rounded-lg grid place-items-center text-ink-muted hover:text-ink hover:bg-canvas transition-colors duration-150">
      <BellIcon className="w-5 h-5" />
      {unread > 0 && <span className="absolute top-1.5 right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-danger text-white text-[11px] font-semibold grid place-items-center ring-2 ring-white tabular-nums">{unread}</span>}
    </button>
    <AnimatePresence>{open && <motion.div initial={{ opacity: 0, y: -4, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -4, scale: 0.98 }} transition={{ duration: 0.15, ease: [0.23, 1, 0.32, 1] }} className="absolute right-0 top-12 z-40 w-[min(360px,calc(100vw-2rem))] bg-white border border-line rounded-xl shadow-pop overflow-hidden origin-top-right">
      <div className="flex items-center justify-between px-4 py-3 border-b border-line"><p className="text-sm font-semibold text-ink">Notifications</p><button type="button" disabled={unread === 0 || loading} onClick={() => void markAllRead()} className="text-xs font-medium text-accent-strong hover:underline disabled:text-ink-subtle disabled:no-underline">Mark all as read</button></div>
      {loading && items.length === 0 ? <p className="px-4 py-6 text-sm text-ink-muted">Loading notifications…</p> : error && items.length === 0 ? <div className="px-4 py-5"><p className="text-sm text-danger">{error}</p><button type="button" onClick={() => void loadNotifications()} className="mt-2 text-xs font-medium text-accent-strong hover:underline">Try again</button></div> : items.length === 0 ? <p className="px-4 py-6 text-sm text-ink-muted">You’re all caught up. No notifications.</p> : <ul className="max-h-[360px] overflow-y-auto divide-y divide-line">{items.map((n) => <li key={n.id}><button type="button" onClick={() => void openItem(n)} className={'w-full text-left px-4 py-3 flex gap-3 hover:bg-canvas transition-colors duration-150 ' + (n.read ? '' : 'bg-accent-soft/40')}><span className={'mt-1.5 w-2 h-2 rounded-full shrink-0 ' + (toneDot[n.tone] || toneDot.info)} aria-hidden="true" /><div className="min-w-0 flex-1"><p className={'text-sm ' + (n.read ? 'text-ink-muted' : 'text-ink font-medium')}>{n.title}</p><p className="text-xs text-ink-muted mt-0.5">{n.body}</p><p className="text-[11px] text-ink-subtle mt-1">{n.time}</p></div></button></li>)}</ul>}
    </motion.div>}</AnimatePresence>
  </div>;
}
