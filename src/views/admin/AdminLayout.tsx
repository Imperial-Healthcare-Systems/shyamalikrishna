'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard, Users, Phone, Package, Tag, Building2,
  Wrench, FileText, Briefcase, Settings, LogOut, Menu, X,
  Layers, MapPin, UserCheck,
} from 'lucide-react';
import { useAdminAuth } from '@/lib/auth';

/**
 * Grouped so the recruitment screens read as one section rather than being
 * scattered through the CMS entries — the admin who opens this portal to check
 * applications should not have to hunt for them.
 */
const navGroups: Array<{ label: string | null; items: Array<{ label: string; href: string; icon: typeof Users }> }> = [
  {
    label: null,
    items: [{ label: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard }],
  },
  {
    label: 'Recruitment',
    items: [
      { label: 'Jobs', href: '/admin/jobs', icon: Briefcase },
      { label: 'Applications', href: '/admin/applications', icon: UserCheck },
      { label: 'Job Categories', href: '/admin/job-categories', icon: Layers },
      { label: 'Locations', href: '/admin/job-locations', icon: MapPin },
    ],
  },
  {
    label: 'Enquiries',
    items: [
      { label: 'Leads', href: '/admin/leads', icon: Users },
      { label: 'RFQs', href: '/admin/leads?lead_type=product_enquiry', icon: Tag },
      { label: 'Callback Requests', href: '/admin/leads?lead_type=callback', icon: Phone },
    ],
  },
  {
    label: 'Catalogue',
    items: [
      { label: 'Products', href: '/admin/products', icon: Package },
      { label: 'Product Categories', href: '/admin/categories', icon: Tag },
      { label: 'OEM Partners', href: '/admin/partners', icon: Building2 },
      { label: 'Services', href: '/admin/services', icon: Wrench },
      { label: 'Resources', href: '/admin/resources', icon: FileText },
    ],
  },
  {
    label: null,
    items: [{ label: 'Settings', href: '/admin/settings', icon: Settings }],
  },
];

const navItems = navGroups.flatMap((group) => group.items);

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const { logout } = useAdminAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    router.push('/admin');
  };

  const currentPath = pathname;
  const isActive = (href: string) => {
    const path = href.split('?')[0];
    return currentPath === path || currentPath.startsWith(path + '/');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside
        className={`fixed lg:sticky top-0 left-0 z-40 w-64 h-screen bg-gray-900 text-gray-300 transition-transform duration-300 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-800">
          <Link href="/admin/dashboard" className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gold flex items-center justify-center">
              <span className="heading-serif text-charcoal text-sm font-bold">SK</span>
            </div>
            <span className="text-sm font-medium text-white">Admin Portal</span>
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-gray-400 hover:text-white p-1"
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="p-3 space-y-1 overflow-y-auto h-[calc(100vh-140px)]" aria-label="Admin navigation">
          {navGroups.map((group, groupIndex) => (
            <div key={groupIndex} className={group.label ? 'pt-3' : undefined}>
              {group.label && (
                <p className="px-3 pb-1.5 text-[10px] font-semibold tracking-[0.12em] uppercase text-gray-500">
                  {group.label}
                </p>
              )}
              {group.items.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={isActive(item.href) ? 'page' : undefined}
                    className={`flex items-center gap-3 px-3 py-2.5 text-sm rounded transition-colors ${
                      isActive(item.href)
                        ? 'bg-gold text-white'
                        : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                    }`}
                    onClick={() => setSidebarOpen(false)}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-3 border-t border-gray-800">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 text-sm text-gray-400 hover:bg-gray-800 hover:text-white rounded transition-colors w-full"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <div className="flex-1 min-w-0">
        {/* Top bar */}
        <header className="bg-white border-b border-gray-200 sticky top-0 z-20">
          <div className="flex items-center justify-between px-4 lg:px-6 h-14">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 hover:bg-gray-100 rounded"
                aria-label="Open sidebar"
              >
                <Menu className="w-5 h-5" />
              </button>
              <div className="hidden sm:flex items-center gap-2 text-sm text-gray-500">
                <span>Shyamali Krishna Automobile</span>
                <span className="text-gray-300">/</span>
                <span className="text-gray-900 font-medium">
                  {navItems.find(n => isActive(n.href))?.label || 'Admin'}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {/* Replaces a bell icon that had a permanent unread dot and no
                  behaviour behind it — this goes where the admin actually
                  wants to land. */}
              <Link
                href="/admin/applications?status=new"
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded"
              >
                <UserCheck className="w-4 h-4" />
                New applications
              </Link>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gray-900 text-gold flex items-center justify-center text-sm font-medium rounded-full">
                  A
                </div>
                <span className="hidden sm:block text-sm font-medium text-gray-700">Administrator</span>
              </div>
            </div>
          </div>
        </header>

        {/* Page content — routing now lives in the app/admin route segments */}
        <main className="p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
