'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Users, Package, Briefcase, TrendingUp, Plus, ArrowRight,
  Phone, Tag, Wrench, Banknote, Building2, Clock,
} from 'lucide-react';
import { adminFetch } from '@/lib/supabase';
import { useAdminAuth } from '@/lib/auth';
import { LoadingSpinner } from '@/components/ui/States';
import { LEAD_TYPES, timeAgo } from '@/lib/types';

interface DashboardData {
  stats: {
    totalLeads: number;
    newLeads: number;
    openJobs: number;
    totalApplications: number;
    leadTypeCounts: Record<string, number>;
  };
  recentActivity: Array<{ action: string; entity_type: string; description: string; created_at: string }>;
  recentLeads: Array<{ id: string; name: string; lead_type: string; status: string; created_at: string }>;
  recentApplications: Array<{ id: string; full_name: string; job_slug: string; status: string; created_at: string }>;
  recentJobs: Array<{ id: string; title: string; status: string; published_at: string }>;
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

  const { stats, recentLeads, recentApplications, recentJobs } = data;

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
        <p className="text-sm text-gray-500 mt-1">Overview of enquiries, applications, and activity</p>
      </div>

      {/* Stat cards */}
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
              recentApplications.map((app) => (
                <Link
                  key={app.id}
                  href={`/admin/applications/${app.id}`}
                  className="flex items-center justify-between p-3 hover:bg-gray-50 rounded transition-colors"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{app.full_name}</p>
                    <p className="text-xs text-gray-500">{app.job_slug || 'General'}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-600">{app.status}</span>
                    <span className="text-xs text-gray-400">{timeAgo(app.created_at)}</span>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
