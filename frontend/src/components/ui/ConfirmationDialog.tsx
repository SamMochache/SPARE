import React from 'react';
import { AlertTriangleIcon } from 'lucide-react';
import { Button } from './Button';
import { Modal } from './Modal';

interface ConfirmationDialogProps {
  open: boolean;
  title: string;
  description: React.ReactNode;
  confirmLabel: string;
  tone?: 'danger' | 'default';
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmationDialog({ open, title, description, confirmLabel, tone = 'danger', onConfirm, onCancel }: ConfirmationDialogProps) {
  return (
    <Modal
      open={open}
      onClose={onCancel}
      title={title}
      size="sm"
      footer={
      <>
          <Button onClick={onCancel}>Cancel</Button>
          <Button variant={tone === 'danger' ? 'danger' : 'navy'} onClick={onConfirm} autoFocus>
            {confirmLabel}
          </Button>
        </>
      }>
      
      <div className="flex gap-3">
        {tone === 'danger' &&
        <span className="w-9 h-9 rounded-full bg-danger-soft text-danger grid place-items-center shrink-0">
            <AlertTriangleIcon className="w-[18px] h-[18px]" aria-hidden="true" />
          </span>
        }
        <div className="text-sm text-ink-muted leading-relaxed">{description}</div>
      </div>
    </Modal>);

}