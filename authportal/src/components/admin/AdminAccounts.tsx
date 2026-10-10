import React, { useState } from 'react';
import {
  Users,
  Search,
  Filter,
  Shield,
  ShieldAlert,
  UserCheck,
  CheckCircle2,
  XCircle,
  MoreVertical,
  Mail,
  KeyRound,
  Ban,
  RotateCcw,
  Edit2,
  User,
} from 'lucide-react';
import { Button } from '../ui/Button';
import { EmployeeWorkProfileModal } from '../profile/EmployeeWorkProfileModal';
import type { ManagedAccount, PortalRole } from '../../types/work';

interface AdminAccountsProps {
  accounts: ManagedAccount[];
  onToggleAccountStatus: (accountId: string) => void;
  onResetUserCredentials: (accountId: string) => void;
  onAccountProfileUpdated?: (updated: any) => void;
}

export const AdminAccounts: React.FC<AdminAccountsProps> = ({
  accounts,
  onToggleAccountStatus,
  onResetUserCredentials,
  onAccountProfileUpdated,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<PortalRole | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'suspended'>('all');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [selectedAccount, setSelectedAccount] = useState<ManagedAccount | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const filteredAccounts = accounts.filter((acc) => {
    const matchesRole = roleFilter === 'all' || acc.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || acc.status === statusFilter;
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      acc.fullName.toLowerCase().includes(q) ||
      acc.email.toLowerCase().includes(q) ||
      acc.systemId.toLowerCase().includes(q) ||
      acc.department.toLowerCase().includes(q);

    return matchesRole && matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--text-primary)]">
              Enterprise Directory &amp; Access Control
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#C5A059]/15 border border-[#C5A059]/30 text-[#C5A059]">
              {accounts.length} Accounts Provisioned
            </span>
          </div>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5">
            Click on any user or select &quot;Manage Profile&quot; to inspect deliverables, edit profile fields, or manage avatars.
          </p>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search accounts, IDs, departments..."
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-[var(--bg-card)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[#D9B66F]/40"
          />
        </div>
      </div>

      {toastMessage && (
        <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-700 dark:text-emerald-400 flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Segmented Filter Controls */}
      <div className="flex flex-wrap items-center gap-2">
        <div
          role="group"
          aria-label="Filter by role"
          className="inline-flex items-center gap-1 p-1 rounded-xl bg-[var(--bg-card)] border border-[var(--border-subtle)] text-xs"
        >
          {(
            [
              { id: 'all', label: 'All Roles' },
              { id: 'employee', label: 'Employees' },
              { id: 'manager', label: 'Managers' },
              { id: 'admin', label: 'Administrators' },
            ] as const
          ).map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setRoleFilter(t.id)}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
                roleFilter === t.id
                  ? 'bg-[#222222] dark:bg-[#F7F7F8] text-white dark:text-[#222222] font-semibold'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div
          role="group"
          aria-label="Filter by status"
          className="inline-flex items-center gap-1 p-1 rounded-xl bg-[var(--bg-card)] border border-[var(--border-subtle)] text-xs"
        >
          {(
            [
              { id: 'all', label: 'All Status' },
              { id: 'active', label: 'Active' },
              { id: 'suspended', label: 'Suspended' },
            ] as const
          ).map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setStatusFilter(s.id)}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
                statusFilter === s.id
                  ? 'bg-[#222222] dark:bg-[#F7F7F8] text-white dark:text-[#222222] font-semibold'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Accounts Directory Table */}
      <div className="p-6 rounded-3xl bg-[var(--bg-card)] border border-[var(--border-subtle)] overflow-x-auto">
        {filteredAccounts.length === 0 ? (
          <div className="p-8 text-center text-xs text-[var(--text-muted)] space-y-2">
            <Users className="w-8 h-8 mx-auto text-[var(--text-muted)]" />
            <p>No user accounts matched the filter criteria.</p>
          </div>
        ) : (
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[var(--border-subtle)] text-[var(--text-muted)]">
                <th className="py-2.5 font-semibold">User Details</th>
                <th className="py-2.5 font-semibold">System ID</th>
                <th className="py-2.5 font-semibold">Role</th>
                <th className="py-2.5 font-semibold">Department</th>
                <th className="py-2.5 font-semibold">Status</th>
                <th className="py-2.5 font-semibold">Last Authenticated</th>
                <th className="py-2.5 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-subtle)]">
              {filteredAccounts.map((account) => {
                const isActive = account.status === 'active';
                const isIncomplete = !account.fullName || account.fullName === 'outFyt Member';

                return (
                  <tr
                    key={account.id}
                    onClick={() => setSelectedAccount(account)}
                    className="hover:bg-[var(--bg-card-subtle)]/70 cursor-pointer transition-colors"
                  >
                    <td className="py-3.5">
                      <div className="flex items-center gap-3">
                        {account.avatarUrl ? (
                          <img
                            src={account.avatarUrl}
                            alt={account.fullName}
                            className="w-8 h-8 rounded-full object-cover border border-[#C5A059]/30 shrink-0"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-[#D9B66F]/20 text-[#222222] dark:text-[#F8E7A1] font-bold text-xs flex items-center justify-center border border-[#D9B66F]/30 shrink-0">
                            {account.fullName
                              ? account.fullName
                                  .split(' ')
                                  .map((n) => n[0])
                                  .join('')
                                  .slice(0, 2)
                                  .toUpperCase()
                              : account.systemId}
                          </div>
                        )}
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-[var(--text-primary)] hover:text-[#D9B66F]">
                              {account.fullName}
                            </span>
                            {isIncomplete && (
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400">
                                Profile not completed
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-[var(--text-muted)] flex items-center gap-1 mt-0.5">
                            <Mail className="w-3 h-3" />
                            <span>{account.email}</span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 font-mono text-[11px] font-semibold text-[var(--text-primary)]">
                      {account.systemId}
                    </td>
                    <td className="py-3.5 capitalize font-semibold text-[var(--text-primary)]">
                      {account.role}
                    </td>
                    <td className="py-3.5 text-[var(--text-secondary)]">
                      {account.department}
                    </td>
                    <td className="py-3.5">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            isActive ? 'bg-emerald-500' : 'bg-red-500'
                          }`}
                        />
                        <span className="capitalize font-medium text-[var(--text-primary)]">
                          {account.status}
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 text-[var(--text-muted)] text-[11px]">
                      {account.lastLogin}
                    </td>
                    <td className="py-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedAccount(account)}
                          title="Open employee profile and management view"
                          className="text-xs"
                        >
                          <Edit2 className="w-3 h-3 mr-1 text-[#D9B66F]" />
                          <span>Manage Profile</span>
                        </Button>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            onResetUserCredentials(account.id);
                            showToast(`Credential reset link dispatched to ${account.email}`);
                          }}
                          title="Send password reset trigger"
                          className="text-xs"
                        >
                          <KeyRound className="w-3 h-3 mr-1 text-[#D9B66F]" />
                          <span>Reset Auth</span>
                        </Button>

                        {account.role !== 'admin' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              onToggleAccountStatus(account.id);
                              showToast(
                                `Account ${account.systemId} (${account.fullName}) is now ${
                                  isActive ? 'suspended' : 'active'
                                }`
                              );
                            }}
                            className={`text-xs ${
                              isActive
                                ? 'text-red-600 dark:text-red-400 hover:border-red-300'
                                : 'text-emerald-600 dark:text-emerald-400 hover:border-emerald-300'
                            }`}
                          >
                            {isActive ? (
                              <>
                                <Ban className="w-3 h-3 mr-1" />
                                <span>Suspend</span>
                              </>
                            ) : (
                              <>
                                <RotateCcw className="w-3 h-3 mr-1" />
                                <span>Reactivate</span>
                              </>
                            )}
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Clickable Work Profile Modal with Admin Editing Capabilities */}
      {selectedAccount && (
        <EmployeeWorkProfileModal
          isOpen={Boolean(selectedAccount)}
          onClose={() => setSelectedAccount(null)}
          employeeProfileId={selectedAccount.id}
          employeeSystemId={selectedAccount.systemId}
          employeeName={selectedAccount.fullName}
          isAdmin={true}
          onProfileUpdated={(updated) => {
            showToast(`Profile changes saved for ${selectedAccount.systemId}.`);
            if (onAccountProfileUpdated) {
              onAccountProfileUpdated(updated);
            }
          }}
        />
      )}
    </div>
  );
};
