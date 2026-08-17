'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, Pencil, Trash2, Eye, EyeOff, Loader2, Save, X } from 'lucide-react';
import { adminFetch } from '@/lib/supabase';
import { useAdminAuth } from '@/lib/auth';
import { LoadingSpinner } from '@/components/ui/States';
import {
  AdminCard, Alert, ConfirmDialog, StatusPill, TableScroll, TH, TD,
  INPUT, LABEL, HINT, BTN_PRIMARY, BTN_SECONDARY,
} from '@/views/admin/ui';

/**
 * One CRUD screen, used for job categories, locations and employment types.
 *
 * All three are the same shape — a name, an optional Hindi name, an active
 * flag, a sort order, and a count of the jobs using it — so they share one
 * implementation. That also means the delete-safety behaviour is identical
 * everywhere rather than reimplemented three times with three sets of bugs.
 */

interface LookupRow {
  id: string;
  name: string;
  name_hi?: string | null;
  slug: string;
  description?: string | null;
  active: boolean;
  display_order: number;
  job_count?: number;
}

interface LookupManagerProps {
  /** e.g. '/admin-api/job-categories' */
  endpoint: string;
  /** Singular, lowercase: 'category', 'location', 'employment type'. */
  noun: string;
  title: string;
  description: string;
  /** Column header for the usage count. */
  countLabel: string;
  supportsHindi?: boolean;
  supportsDescription?: boolean;
  /** Rendered under the table — used to explain what deactivating does. */
  footnote?: string;
}

type Draft = Partial<LookupRow> & { isNew?: boolean };

export function LookupManager({
  endpoint,
  noun,
  title,
  description,
  countLabel,
  supportsHindi = false,
  supportsDescription = false,
  footnote,
}: LookupManagerProps) {
  const { token } = useAdminAuth();
  const [rows, setRows] = useState<LookupRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [confirmTarget, setConfirmTarget] = useState<LookupRow | null>(null);
  const [confirmBlocker, setConfirmBlocker] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setLoadError(null);
    const result = await adminFetch(endpoint, { token });
    if (result.ok) {
      setRows(result.data?.data || []);
    } else {
      setLoadError(`Unable to load ${noun}s. Please try again.`);
    }
    setLoading(false);
  }, [token, endpoint, noun]);

  useEffect(() => {
    load();
  }, [load]);

  const startCreate = () => {
    setFormError(null);
    setDraft({ isNew: true, name: '', name_hi: '', description: '', active: true, display_order: rows.length + 1 });
  };

  const startEdit = (row: LookupRow) => {
    setFormError(null);
    setDraft({ ...row });
  };

  const save = async () => {
    if (!token || !draft) return;
    if (!String(draft.name || '').trim()) {
      setFormError(`Please enter a ${noun} name.`);
      return;
    }
    setSaving(true);
    setFormError(null);

    const body: Record<string, unknown> = {
      name: draft.name,
      active: draft.active ?? true,
      display_order: Number(draft.display_order) || 0,
    };
    if (!draft.isNew) body.id = draft.id;
    if (supportsHindi) body.name_hi = draft.name_hi || null;
    if (supportsDescription) body.description = draft.description || null;

    const result = await adminFetch(`${endpoint}/save`, { method: 'POST', body, token });
    setSaving(false);

    if (!result.ok) {
      setFormError(result.data?.error || `Could not save the ${noun}.`);
      return;
    }

    setNotice(draft.isNew ? `${capitalise(noun)} added.` : `${capitalise(noun)} updated.`);
    setDraft(null);
    load();
  };

  const toggleActive = async (row: LookupRow) => {
    if (!token) return;
    setBusyId(row.id);
    setNotice(null);
    const result = await adminFetch(`${endpoint}/save`, {
      method: 'POST',
      body: { id: row.id, name: row.name, active: !row.active, display_order: row.display_order },
      token,
    });
    setBusyId(null);
    if (result.ok) {
      setNotice(`"${row.name}" is now ${row.active ? 'inactive' : 'active'}.`);
      load();
    } else {
      setLoadError(result.data?.error || `Could not update the ${noun}.`);
    }
  };

  const askDelete = (row: LookupRow) => {
    setConfirmBlocker(null);
    setConfirmTarget(row);
  };

  const confirmDelete = async () => {
    if (!token || !confirmTarget) return;
    setSaving(true);
    const result = await adminFetch(`${endpoint}/delete`, {
      method: 'DELETE',
      body: { id: confirmTarget.id },
      token,
    });
    setSaving(false);

    if (result.ok) {
      setNotice(`"${confirmTarget.name}" deleted.`);
      setConfirmTarget(null);
      load();
      return;
    }

    // 409 means the row is still referenced. Keep the dialog open and show
    // exactly what is blocking, so the admin can deactivate instead.
    setConfirmBlocker(result.data?.error || `Could not delete the ${noun}.`);
  };

  const inUse = (confirmTarget?.job_count || 0) > 0;

  return (
    <div className="space-y-4">
      {notice && <Alert tone="success" onDismiss={() => setNotice(null)}>{notice}</Alert>}
      {loadError && <Alert tone="error" onDismiss={() => setLoadError(null)}>{loadError}</Alert>}

      <AdminCard
        title={title}
        description={description}
        actions={
          !draft && (
            <button type="button" onClick={startCreate} className={BTN_PRIMARY}>
              <Plus className="w-4 h-4" /> Add {noun}
            </button>
          )
        }
      >
        {/* Add / edit form */}
        {draft && (
          <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">
              {draft.isNew ? `New ${noun}` : `Edit ${noun}`}
            </h3>

            {formError && (
              <div className="mb-3">
                <Alert tone="error">{formError}</Alert>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={LABEL} htmlFor="lookup-name">
                  Name <span className="text-red-600">*</span>
                </label>
                <input
                  id="lookup-name"
                  type="text"
                  value={draft.name || ''}
                  onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                  className={INPUT}
                  maxLength={80}
                  autoFocus
                />
              </div>

              {supportsHindi && (
                <div>
                  <label className={LABEL} htmlFor="lookup-name-hi">Name (Hindi)</label>
                  <input
                    id="lookup-name-hi"
                    type="text"
                    value={draft.name_hi || ''}
                    onChange={(e) => setDraft({ ...draft, name_hi: e.target.value })}
                    className={INPUT}
                    maxLength={80}
                  />
                  <p className={HINT}>Optional. Shown when a visitor switches the site to Hindi.</p>
                </div>
              )}

              <div>
                <label className={LABEL} htmlFor="lookup-order">Display order</label>
                <input
                  id="lookup-order"
                  type="number"
                  min={0}
                  value={draft.display_order ?? 0}
                  onChange={(e) => setDraft({ ...draft, display_order: Number(e.target.value) })}
                  className={INPUT}
                />
                <p className={HINT}>Lower numbers appear first.</p>
              </div>

              <div className="flex items-center">
                <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={draft.active ?? true}
                    onChange={(e) => setDraft({ ...draft, active: e.target.checked })}
                    className="w-4 h-4"
                  />
                  Active
                </label>
              </div>

              {supportsDescription && (
                <div className="md:col-span-2">
                  <label className={LABEL} htmlFor="lookup-description">Description</label>
                  <textarea
                    id="lookup-description"
                    value={draft.description || ''}
                    onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                    rows={2}
                    className={`${INPUT} resize-y`}
                    maxLength={400}
                  />
                  <p className={HINT}>Internal note. Not shown on the public careers page.</p>
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-2 mt-4">
              <button type="button" onClick={save} disabled={saving} className={BTN_PRIMARY}>
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {saving ? 'Saving…' : `Save ${noun}`}
              </button>
              <button type="button" onClick={() => setDraft(null)} disabled={saving} className={BTN_SECONDARY}>
                <X className="w-4 h-4" /> Cancel
              </button>
            </div>
          </div>
        )}

        {/* Table */}
        {loading ? (
          <LoadingSpinner label={`Loading ${noun}s…`} />
        ) : rows.length === 0 ? (
          <div className="py-10 text-center">
            <p className="text-gray-900 font-medium">No {noun}s yet</p>
            <p className="text-sm text-gray-500 mt-1 mb-4">
              Add your first {noun} so it can be selected when creating a job.
            </p>
            {!draft && (
              <button type="button" onClick={startCreate} className={BTN_PRIMARY}>
                <Plus className="w-4 h-4" /> Add {noun}
              </button>
            )}
          </div>
        ) : (
          <TableScroll>
            <table className="w-full text-sm min-w-[620px]">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className={TH}>Name</th>
                  {supportsHindi && <th className={TH}>Hindi</th>}
                  <th className={TH}>Status</th>
                  <th className={TH}>{countLabel}</th>
                  <th className={TH}>Order</th>
                  <th className={`${TH} text-right`}>Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {rows.map((row) => (
                  <tr key={row.id} className="hover:bg-gray-50">
                    <td className={`${TD} font-medium text-gray-900`}>
                      {row.name}
                      {supportsDescription && row.description && (
                        <span className="block text-xs text-gray-500 font-normal mt-0.5">{row.description}</span>
                      )}
                    </td>
                    {supportsHindi && <td className={TD}>{row.name_hi || '—'}</td>}
                    <td className={TD}>
                      <StatusPill
                        kind="active"
                        value={String(row.active)}
                        label={row.active ? 'Active' : 'Inactive'}
                      />
                    </td>
                    <td className={TD}>
                      {row.job_count ? (
                        <span className="font-medium text-gray-900">{row.job_count}</span>
                      ) : (
                        <span className="text-gray-400">0</span>
                      )}
                    </td>
                    <td className={TD}>{row.display_order}</td>
                    <td className={TD}>
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => startEdit(row)}
                          className="p-2 rounded text-gray-600 hover:bg-gray-200"
                          aria-label={`Edit ${row.name}`}
                          title="Edit"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => toggleActive(row)}
                          disabled={busyId === row.id}
                          className="p-2 rounded text-gray-600 hover:bg-gray-200 disabled:opacity-50"
                          aria-label={`${row.active ? 'Deactivate' : 'Reactivate'} ${row.name}`}
                          title={row.active ? 'Deactivate' : 'Reactivate'}
                        >
                          {busyId === row.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : row.active ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => askDelete(row)}
                          className="p-2 rounded text-red-600 hover:bg-red-100"
                          aria-label={`Delete ${row.name}`}
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableScroll>
        )}

        {footnote && <p className="text-xs text-gray-500 mt-4 pt-4 border-t border-gray-100">{footnote}</p>}
      </AdminCard>

      <ConfirmDialog
        open={Boolean(confirmTarget)}
        busy={saving}
        title={`Delete "${confirmTarget?.name}"?`}
        message={
          inUse
            ? undefined
            : `This ${noun} is not used by any job, so deleting it is safe. This cannot be undone.`
        }
        consequence={
          inUse
            ? `This ${noun} is currently being used by ${confirmTarget?.job_count} job${confirmTarget?.job_count === 1 ? '' : 's'}. Move those jobs to another ${noun} first, or deactivate this one instead — deactivating hides it from new jobs while leaving existing jobs untouched.`
            : undefined
        }
        confirmLabel={`Delete ${noun}`}
        onConfirm={confirmDelete}
        onCancel={() => {
          setConfirmTarget(null);
          setConfirmBlocker(null);
        }}
      >
        {confirmBlocker && <Alert tone="error">{confirmBlocker}</Alert>}
        {inUse && confirmTarget && (
          <button
            type="button"
            onClick={async () => {
              await toggleActive(confirmTarget);
              setConfirmTarget(null);
              setConfirmBlocker(null);
            }}
            className={`${BTN_SECONDARY} w-full mt-2`}
          >
            <EyeOff className="w-4 h-4" /> Deactivate instead
          </button>
        )}
      </ConfirmDialog>
    </div>
  );
}

function capitalise(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
