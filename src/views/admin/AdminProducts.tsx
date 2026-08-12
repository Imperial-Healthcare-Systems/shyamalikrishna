'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Plus, Search, Edit, Trash2, Eye } from 'lucide-react';
import { adminFetch } from '@/lib/supabase';
import { useAdminAuth } from '@/lib/auth';
import { LoadingSpinner, EmptyState } from '@/components/ui/States';

interface AdminProduct {
  id: string;
  name: string;
  slug: string;
  is_published: boolean;
  display_order: number;
  category?: { name: string; slug: string } | null;
  partner?: { name: string; slug: string } | null;
}

export function AdminProducts() {
  const { token } = useAdminAuth();
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const fetchProducts = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    const params: Record<string, string> = { per_page: '100' };
    if (search) params.search = search;
    const result = await adminFetch('/admin-api/products', { token, searchParams: params });
    if (result.ok) {
      setProducts(result.data || []);
    }
    setLoading(false);
  }, [token, search]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleDelete = async (id: string) => {
    if (!token) return;
    const result = await adminFetch('/admin-api/products/delete', { method: 'DELETE', body: { id }, token });
    if (result.ok) {
      setConfirmDelete(null);
      fetchProducts();
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Products</h1>
          <p className="text-sm text-gray-500 mt-1">{products.length} products</p>
        </div>
        <Link href="/admin/products/new" className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 text-white text-sm rounded hover:bg-gray-700">
          <Plus className="w-4 h-4" /> New Product
        </Link>
      </div>

      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <form onSubmit={(e) => { e.preventDefault(); fetchProducts(); }} className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search products…" className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded text-sm focus:border-gray-900 focus:outline-none" />
          </div>
          <button type="submit" className="px-4 py-2 bg-gray-900 text-white text-sm rounded">Search</button>
        </form>
      </div>

      {loading ? (
        <LoadingSpinner label="Loading products…" />
      ) : products.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200">
          <EmptyState title="No products yet" message="Add your first product to the catalogue." />
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Product</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Category</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">OEM</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {products.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{product.name}</td>
                    <td className="px-4 py-3 text-gray-600">{product.category?.name || '—'}</td>
                    <td className="px-4 py-3 text-gray-600">{product.partner?.name || '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2 py-0.5 text-xs rounded ${product.is_published ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                        {product.is_published ? 'Published' : 'Draft'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        {product.category && (
                          <Link href={`/portfolio/${product.category.slug}/${product.slug}`} className="p-1.5 hover:bg-gray-200 rounded text-gray-600" aria-label="View product">
                            <Eye className="w-4 h-4" />
                          </Link>
                        )}
                        <Link href={`/admin/products/${product.id}`} className="p-1.5 hover:bg-gray-200 rounded text-gray-600" aria-label="Edit product">
                          <Edit className="w-4 h-4" />
                        </Link>
                        <button onClick={() => setConfirmDelete(product.id)} className="p-1.5 hover:bg-red-100 rounded text-red-600" aria-label="Delete product">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-black/50" onClick={() => setConfirmDelete(null)} />
          <div className="relative bg-white p-6 rounded-lg max-w-sm w-full">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete this product?</h3>
            <p className="text-sm text-gray-600 mb-4">This cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDelete(null)} className="flex-1 px-4 py-2 border border-gray-300 rounded text-sm hover:bg-gray-50">Cancel</button>
              <button onClick={() => handleDelete(confirmDelete)} className="flex-1 px-4 py-2 bg-red-600 text-white rounded text-sm hover:bg-red-700">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
