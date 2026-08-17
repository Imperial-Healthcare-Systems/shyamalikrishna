'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Users, Package, Briefcase, Plus, ArrowRight, FileText, MapPin, Layers,
  Phone, Tag, Wrench, Banknote, Building2, Clock, Send, XCircle, AlertTriangle, Settings,
} from 'lucide-react';
import { adminFetch } from '@/lib/supabase';
import { useAdminAuth } from '@/lib/auth';
import { LoadingSpinner } from '@/components/ui/States';
import { LEAD_TYPES, APPLICATION_STATUSES, timeAgo } from '@/lib/types';
import { Alert } from '@/views/admin/ui';

interface DashboardData {
  stats: {
    totalLeads: number;
    newLeads: number;
    openJobs: number;
    publishedJobs: number;
    draftJobs: number;
    closedJobs: number;
    totalApplications: number;
    newApplications: number;
    failedNotifications: number;
    activeCategories: number;
    activeLocations: number;
    leadTypeCounts: Record<string, number>;
  };
  recentActivity: Array<{ action: string; entity_type: string; description: string; created_at: string }>;
  recentLeads: Array<{ id: string; name: string; lead_type: string; status: string; created_at: string }>;
  recentApplications: Array<{
    id: string;
    full_name: string;
    job_title_snapshot: string | null;
    job_slug: string | null;
    preferred_location: string | null;
    status: string;
    notification_status: string | null;
    created_at: string;
  }>;
  recentJobs: Array<{ id: string; title: string; slug: string; status: string; vacancies: number; published_at: string }>;
}

export function AdminDashboard() {
  const { token } = useAdminAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    const result = await adminFetch('/admin-api/dashboard', { token });
    if (result.ok) {
      setData(result.data);
      setError(null);
    } else {
      setError(result.data?.error || 'Failed to load dashboard');
    }
    setLoading(false);
  }, [token]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) return <LoadingSpinner label="Loading dashboard…" />;
  if (error || !data) return <div className="text-error">{error || 'No data'}</div>;

  const { stats, recentLeads, recentApplications, recentJobs = [] } = data;

  // Recruitment gets its own row of cards. Applications are the thing the
  // admin logs in to check, so they should not be the tenth tile down.
  const recruitmentCards = [
    { label: 'Published Jobs', value: stats.publishedJobs ?? stats.openJobs ?? 0, icon: Send, href: '/admin/jobs?status=published', color: 'bg-green-50 text-green-600' },
    { label: 'Draft Jobs', value: stats.draftJobs ?? 0, icon: FileText, href: '/admin/jobs?status=draft', color: 'bg-amber-50 text-amber-600' },
    { label: 'Closed Jobs', value: stats.closedJobs ?? 0, icon: XCircle, href: '/admin/jobs?status=closed', color: 'bg-gray-100 text-gray-600' },
    { label: 'Total Applications', value: stats.totalApplications ?? 0, icon: Users, href: '/admin/applications', color: 'bg-blue-50 text-blue-600' },
    { label: 'New Applications', value: stats.newApplications ?? 0, icon: Clock, href: '/admin/applications?status=new', color: 'bg-orange-50 text-orange-600' },
    { label: 'Active Categories', value: stats.activeCategories ?? 0, icon: Layers, href: '/admin/job-categories', color: 'bg-purple-50 text-purple-600' },
    { label: 'Active Locations', value: stats.activeLocations ?? 0, icon: MapPin, href: '/admin/job-locations', color: 'bg-teal-50 text-teal-600' },
  ];

  const recruitmentActions = [
    { label: 'Create Job', href: '/admin/jobs/new', icon: Plus },
    { label: 'Manage Jobs', href: '/admin/jobs', icon: Briefcase },
    { label: 'Applications', href: '/admin/applications', icon: Users },
    { label: 'Categories', href: '/admin/job-categories', icon: Layers },
    { label: 'Locations', href: '/admin/job-locations', icon: MapPin },
    { label: 'Settings', href: '/admin/settings', icon: Settings },
  ];

  const statCards = [
    { label: 'Total Leads', value: stats.totalLeads, icon: Users, href: '/admin/leads', color: 'bg-blue-50 text-blue-600' },
    { label: 'New Leads', value: stats.newLeads, icon: Clock, href: '/admin/leads?status=new', color: 'bg-orange-50 text-orange-600' },
    { label: 'RFQs', value: stats.leadTypeCounts['product_enquiry'] || 0, icon: Tag, href: '/admin/leads?lead_type=product_enquiry', color: 'bg-purple-50 text-purple-600' },
    { label: 'Callback Requests', value: stats.leadTypeCounts['callback'] || 0, icon: Phone, href: '/admin/leads?lead_type=callback', color: 'bg-teal-50 text-teal-600' },
    { label: 'Service Requests', value: stats.leadTypeCounts['service'] || 0, icon: Wrench, href: '/admin/leads?lead_type=service', color: 'bg-yellow-50 text-yellow-600' },
    { label: 'Finance Requests', value: stats.leadTypeCounts['finance'] || 0, icon: Banknote, href: '/admin/leads?lead_type=finance', color: 'bg-green-50 text-green-600' },
    { label: 'Subsidy Requests', value: stats.leadTypeCounts['subsidy'] || 0, icon: Building2, href: '/admin/leads?lead_type=subsidy', color: 'bg-indigo-50 text-indigo-600' },
    { label: 'Institutional', value: stats.leadTypeCounts['institutional'] || 0, icon: Building2, href: '/admin/leads?lead_type=institutional', color: 'bg-pink-50 text-pink-600' },
    { label: 'Open Jobs', value: stats.openJobs, icon: Briefcase, href: '/admin/jobs', color: 'bg-cyan-50 text-cyan-600' },
    { label: 'Applications', value: stats.totalApplications, icon: Users, href: '/admin/applications', color: 'bg-red-50 text-red-600' },
  ];

  const quickActions = [
    { label: 'New Product', href: '/admin/products/new', icon: Package },
    { label: 'New Job', href: '/admin/jobs/new', icon: Briefcase },
    { label: 'View Leads', href: '/admin/leads', icon: Users },
    { label: 'View Applications', href: '/admin/applications', icon: Users },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">Overview of recruitment, enquiries, and activity</p>
      </div>

      {stats.failedNotifications > 0 && (
        <Alert tone="warning">
          <strong>{stats.failedNotifications}</strong> application
          {stats.failedNotifications === 1 ? '' : 's'} were saved but their email notification did not go out.
          The applications and CVs are safe.{' '}
          <Link href="/admin/applications" className="underline font-medium">
            Open Applications
          </Link>{' '}
          to review and resend.
        </Alert>
      )}

      {/* Recruitment */}
      <section>
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">Recruitment</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-4">
          {recruitmentCards.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Link
                key={index}
                href={stat.href}
                className="bg-white p-4 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors"
              >
                <div className={`w-8 h-8 rounded ${stat.color} flex items-center justify-center mb-3`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                <div className="text-xs text-gray-500 mt-1">{stat.label}</div>
              </Link>
            );
          })}
        </div>

        <div className="flex flex-wrap gap-2 mt-4">
          {recruitmentActions.map((action, index) => {
            const Icon = action.icon;
            const primary = index === 0;
            return (
              <Link
                key={action.href}
                href={action.href}
                className={`inline-flex items-center gap-2 px-4 py-2 text-sm rounded transition-colors ${
                  primary
                    ? 'bg-gray-900 text-white hover:bg-gray-700'
                    : 'border border-gray-300 text-gray-700 bg-white hover:bg-gray-50'
                }`}
              >
                <Icon className="w-4 h-4" />
                {action.label}
              </Link>
            );
          })}
        </div>
      </section>

      {/* Recent jobs */}
      {recentJobs.length > 0 && (
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Recent Jobs</h2>
            <Link href="/admin/jobs" className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1">
              View all <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="space-y-2">
            {recentJobs.map((job) => (
              <Link
                key={job.id}
                href={`/admin/jobs/${job.id}`}
                className="flex items-center justify-between gap-3 p-3 hover:bg-gray-50 rounded transition-colors"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{job.title}</p>
                  <p className="text-xs text-gray-500">
                    {job.vacancies} vacanc{job.vacancies === 1 ? 'y' : 'ies'}
                    {job.published_at && ` · posted ${timeAgo(job.published_at)}`}
                  </p>
                </div>
                <span
                  className={`text-xs px-2 py-0.5 rounded shrink-0 ${
                    job.status === 'published'
                      ? 'bg-green-100 text-green-700'
                      : job.status === 'draft'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-gray-200 text-gray-700'
                  }`}
                >
                  {job.status}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Enquiries */}
      <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Enquiries &amp; Leads</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Link
              key={index}
              href={stat.href}
              className="bg-white p-4 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors"
            >
              <div className={`w-8 h-8 rounded ${stat.color} flex items-center justify-center mb-3`}>
                <Icon className="w-4 h-4" />
              </div>
              <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
              <div className="text-xs text-gray-500 mt-1">{stat.label}</div>
            </Link>
          );
        })}
      </div>

      {/* Quick actions */}
      <div className="flex flex-wrap gap-3">
        {quickActions.map((action, index) => {
          const Icon = action.icon;
          return (
            <Link
              key={index}
              href={action.href}
              className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 text-white text-sm rounded hover:bg-gray-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              {action.label}
            </Link>
          );
        })}
      </div>

      {/* Charts placeholder - Lead type distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Lead Type Distribution</h2>
          <div className="space-y-3">
            {Object.entries(stats.leadTypeCounts).map(([type, count]) => {
              const max = Math.max(...Object.values(stats.leadTypeCounts));
              const pct = (count / max) * 100;
              return (
                <div key={type}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-gray-600">{LEAD_TYPES[type as keyof typeof LEAD_TYPES] || type}</span>
                    <span className="font-medium text-gray-900">{count}</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-gold rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
            {Object.keys(stats.leadTypeCounts).length === 0 && (
              <p className="text-sm text-gray-400">No leads yet</p>
            )}
          </div>
        </div>

        {/* Recent activity */}
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h2>
          <div className="space-y-3">
            {data.recentActivity.length === 0 ? (
              <p className="text-sm text-gray-400">No recent activity</p>
            ) : (
              data.recentActivity.slice(0, 5).map((activity, index) => (
                <div key={index} className="flex items-start gap-3 text-sm">
                  <div className="w-2 h-2 bg-gold rounded-full mt-1.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-gray-900 truncate">{activity.description}</p>
                    <p className="text-xs text-gray-400">{timeAgo(activity.created_at)}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Recent leads + applications */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Recent Leads</h2>
            <Link href="/admin/leads" className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1">
              View all <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="space-y-3">
            {recentLeads.length === 0 ? (
              <p className="text-sm text-gray-400">No enquiries received yet</p>
            ) : (
              recentLeads.map((lead) => (
                <Link
                  key={lead.id}
                  href={`/admin/leads/${lead.id}`}
                  className="flex items-center justify-between p-3 hover:bg-gray-50 rounded transition-colors"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{lead.name}</p>
                    <p className="text-xs text-gray-500">{LEAD_TYPES[lead.lead_type as keyof typeof LEAD_TYPES] || lead.lead_type}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-600">{lead.status}</span>
                    <span className="text-xs text-gray-400">{timeAgo(lead.created_at)}</span>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Recent Applications</h2>
            <Link href="/admin/applications" className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1">
              View all <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="space-y-3">
            {recentApplications.length === 0 ? (
              <p className="text-sm text-gray-400">No applications received yet</p>
            ) : (
              recentApplications.map((app) => {
                const mailFailed =
                  app.notification_status === 'failed' || app.notification_status === 'skipped';
                return (
                  <Link
                    key={app.id}
                    href={`/admin/applications/${app.id}`}
                    className="flex items-center justify-between gap-3 p-3 hover:bg-gray-50 rounded transition-colors"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{app.full_name}</p>
                      <p className="text-xs text-gray-500 truncate">
                        {app.job_title_snapshot || app.job_slug || 'General Application'}
                        {app.preferred_location && ` · ${app.preferred_location}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {mailFailed && (
                        <AlertTriangle
                          className="w-3.5 h-3.5 text-amber-600"
                          aria-label="Email notification not delivered"
                        />
                      )}
                      <span className="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-600">
                        {APPLICATION_STATUSES[app.status as keyof typeof APPLICATION_STATUSES] || app.status}
                      </span>
                      <span className="text-xs text-gray-400">{timeAgo(app.created_at)}</span>
                    </div>
                  </Link>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
