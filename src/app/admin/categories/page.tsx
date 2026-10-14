'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import {
  FolderTree,
  Plus,
  Edit,
  Trash2,
  Check,
  X,
  AlertCircle,
  ArrowUpDown,
  CheckCircle2,
} from 'lucide-react';
import { Category } from '@/lib/types';

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [sortOrder, setSortOrder] = useState('1');
  const [isActive, setIsActive] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const loadCategories = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/categories');
      const data = await res.json();
      if (data.categories) setCategories(data.categories);
    } catch (e) {
      console.warn('Error loading categories', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const openAdd = () => {
    setName('');
    setSlug('');
    setDescription('');
    setImageUrl('');
    setSortOrder((categories.length + 1).toString());
    setIsActive(true);
    setErrorMsg('');
    setShowAddModal(true);
  };

  const openEdit = (cat: Category) => {
    setEditingCategory(cat);
    setName(cat.name);
    setSlug(cat.slug);
    setDescription(cat.description || '');
    setImageUrl(cat.image_url || '');
    setSortOrder(cat.sort_order.toString());
    setIsActive(cat.is_active);
    setErrorMsg('');
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    if (!name.trim()) {
      setErrorMsg('Category name is required.');
      return;
    }

    setSubmitting(true);
    try {
      if (editingCategory) {
        const res = await fetch('/api/admin/categories', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: editingCategory.id,
            updates: {
              name: name.trim(),
              slug: slug.trim() || name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
              description: description.trim(),
              image_url: imageUrl.trim() || undefined,
              sort_order: Number(sortOrder) || 1,
              is_active: isActive,
            },
          }),
        });
        const data = await res.json();
        if (data.success) {
          setEditingCategory(null);
          loadCategories();
        } else {
          setErrorMsg(data.error || 'Failed to update category.');
        }
      } else {
        const res = await fetch('/api/admin/categories', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: name.trim(),
            slug: slug.trim() || name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
            description: description.trim(),
            image_url: imageUrl.trim() || undefined,
            sort_order: Number(sortOrder) || categories.length + 1,
            is_active: isActive,
          }),
        });
        const data = await res.json();
        if (data.success) {
          setShowAddModal(false);
          loadCategories();
        } else {
          setErrorMsg(data.error || 'Failed to create category.');
        }
      }
    } catch (e: any) {
      setErrorMsg(e.message || 'Server error.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string, catName: string) => {
    if (!confirm(`Are you sure you want to remove category "${catName}"?`)) return;
    try {
      const res = await fetch(`/api/admin/categories?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setCategories((prev) => prev.filter((c) => c.id !== id));
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl">
      
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-border-warm shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <FolderTree className="w-5 h-5 text-primary-green" />
            <h1 className="text-xl sm:text-2xl font-black text-forest font-serif">
              Category Hierarchy & Ordering
            </h1>
          </div>
          <p className="text-xs text-muted-gray mt-1">
            Organize menu groups, display sequencing on the customer menu, and custom category banners.
          </p>
        </div>

        <button
          type="button"
          onClick={openAdd}
          className="bg-primary-green hover:bg-forest text-white text-xs font-bold px-4 py-2.5 rounded-xl flex items-center gap-1.5 shadow-sm transition cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Category</span>
        </button>
      </div>

      {/* Categories Table */}
      <div className="bg-white rounded-3xl border border-border-warm shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FAF6EE] text-muted-gray uppercase font-bold text-[10px] tracking-wider border-b border-border-warm">
              <tr>
                <th className="px-5 py-3">Order</th>
                <th className="px-5 py-3">Category Name</th>
                <th className="px-5 py-3">Slug</th>
                <th className="px-5 py-3">Description</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-warm font-medium text-charcoal">
              {categories.map((cat) => (
                <tr key={cat.id} className="hover:bg-neutral-50/80 transition">
                  <td className="px-5 py-4 font-mono font-bold text-forest">
                    #{cat.sort_order}
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      {cat.image_url && (
                        <div className="w-10 h-10 rounded-lg relative overflow-hidden shrink-0 border border-border-warm">
                          <Image
                            src={cat.image_url}
                            alt={cat.name}
                            fill
                            className="object-cover"
                            unoptimized
                          />
                        </div>
                      )}
                      <div>
                        <div className="font-bold text-forest">{cat.name}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 font-mono text-[11px] text-muted-gray">
                    /{cat.slug}
                  </td>
                  <td className="px-5 py-4 max-w-xs truncate text-[11px] text-muted-gray">
                    {cat.description || '—'}
                  </td>
                  <td className="px-5 py-4">
                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                        cat.is_active
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-neutral-100 text-neutral-600'
                      }`}
                    >
                      {cat.is_active ? 'Active' : 'Hidden'}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => openEdit(cat)}
                        className="p-1.5 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-charcoal transition"
                        title="Edit Category"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(cat.id, cat.name)}
                        className="p-1.5 rounded-lg bg-neutral-100 hover:bg-red-100 text-red-600 transition"
                        title="Delete Category"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Add / Edit */}
      {(showAddModal || editingCategory) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-border-warm space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-border-warm">
              <h2 className="text-base font-black font-serif text-forest">
                {editingCategory ? `Edit Category "${editingCategory.name}"` : 'New Category'}
              </h2>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setEditingCategory(null);
                }}
                className="p-1 text-muted-gray hover:text-charcoal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 bg-red-50 text-red-700 rounded-xl text-xs flex items-center gap-2 border border-red-200">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-charcoal block mb-1">Category Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Italian Pastas"
                  className="w-full p-2.5 border border-border-warm rounded-xl bg-[#FAF7F0] focus:bg-white focus:outline-hidden font-medium"
                />
              </div>

              <div>
                <label className="font-bold text-charcoal block mb-1">URL Slug</label>
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="e.g. italian-pastas (auto-generated if empty)"
                  className="w-full p-2.5 border border-border-warm rounded-xl bg-[#FAF7F0] focus:bg-white focus:outline-hidden font-mono"
                />
              </div>

              <div>
                <label className="font-bold text-charcoal block mb-1">Description</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Penne tossed in creamy Alfredo or spicy Arrabbiata..."
                  className="w-full p-2.5 border border-border-warm rounded-xl bg-[#FAF7F0] focus:bg-white focus:outline-hidden"
                />
              </div>

              <div>
                <label className="font-bold text-charcoal block mb-1">Banner Image URL</label>
                <input
                  type="url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full p-2.5 border border-border-warm rounded-xl bg-[#FAF7F0] focus:bg-white focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="font-bold text-charcoal block mb-1">Sort Order</label>
                  <input
                    type="number"
                    min="1"
                    value={sortOrder}
                    onChange={(e) => setSortOrder(e.target.value)}
                    className="w-full p-2.5 border border-border-warm rounded-xl bg-[#FAF7F0] font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="font-bold text-charcoal block mb-1">Visibility</label>
                  <label className="flex items-center gap-2 p-2.5 bg-[#FAF7F0] rounded-xl border border-border-warm cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isActive}
                      onChange={(e) => setIsActive(e.target.checked)}
                      className="accent-primary-green"
                    />
                    <span className="font-bold">Active in Menu</span>
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-border-warm">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingCategory(null);
                  }}
                  className="px-4 py-2 text-xs font-bold text-muted-gray hover:text-charcoal cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 text-xs font-black bg-primary-green hover:bg-forest text-white rounded-xl shadow-xs transition disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{submitting ? 'Saving...' : editingCategory ? 'Save Changes' : 'Create Category'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
