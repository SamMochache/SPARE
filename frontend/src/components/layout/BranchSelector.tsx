import React from 'react';
import { StoreIcon } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export function BranchSelector() {
  const { user } = useAuth();
  const branchName = user?.branch_name?.trim();

  return (
    <div
      className="h-10 flex max-w-56 items-center gap-2 rounded-lg border border-line bg-white px-3 text-sm text-ink"
      aria-label={branchName ? `Assigned branch: ${branchName}` : 'No branch assigned'}
      title={branchName ? `Assigned branch: ${branchName}` : 'This account has no branch assigned'}>
      <StoreIcon className="h-4 w-4 shrink-0 text-ink-muted" aria-hidden="true" />
      <span className="truncate font-medium whitespace-nowrap">
        {branchName || 'No branch assigned'}
      </span>
    </div>
  );
}
