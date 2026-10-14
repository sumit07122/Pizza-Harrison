'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import {
  Pizza,
  Check,
  X,
  Search,
  Filter,
  RefreshCw,
  Edit,
  Plus,
  Flame,
  Sparkles,
  ShieldCheck,
  AlertCircle,
  Eye,
  Trash2,
  CheckCircle2,
} from 'lucide-react';
import { Product, Category } from '@/lib/types';
import { formatINR } from '@/lib/pricing';

export default function AdminMenuPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedDiet, setSelectedDiet] = useState<'all' | 'veg' | 'non_veg'>('all');

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [previewProduct, setPreviewProduct] = useState<Product | null>(null);

  // Form State for Add / Edit Product
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    category_id: '',
    description: '',
    image_url: '',
    is_veg: true,
    is_spicy: false,
    is_bestseller: false,
    is_featured: false,
    base_price_rupees: '',
    is_price_verified: true,
    is_available: true,
    // Variants
    has_variants: true,
    regular_price_rupees: '',
    medium_price_rupees: '',
    large_price_rupees: '',
  });

  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [prodRes, catRes] = await Promise.all([
        fetch('/api/admin/menu'),
        fetch('/api/admin/categories'),
      ]);
      const prodData = await prodRes.json();
      const catData = await catRes.json();

      if (prodData.products) setProducts(prodData.products);
      if (catData.categories) setCategories(catData.categories);
    } catch (e) {
      console.warn('Error loading menu', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const resetForm = () => {
    setFormData({
      name: '',
      slug: '',
      category_id: categories[0]?.id || '',
      description: '',
      image_url: '',
      is_veg: true,
      is_spicy: false,
      is_bestseller: false,
      is_featured: false,
      base_price_rupees: '',
      is_price_verified: true,
      is_available: true,
      has_variants: true,
      regular_price_rupees: '',
      medium_price_rupees: '',
      large_price_rupees: '',
    });
    setFormError('');
  };

  const openAddModal = () => {
    resetForm();
    setShowAddModal(true);
  };

  const openEditModal = (p: Product) => {
    setEditingProduct(p);
    const regularVar = p.variants?.find((v) => v.size_name.includes('Regular'));
    const mediumVar = p.variants?.find((v) => v.size_name.includes('Medium'));
    const largeVar = p.variants?.find((v) => v.size_name.includes('Large'));

    setFormData({
      name: p.name,
      slug: p.slug,
      category_id: p.category_id,
      description: p.description || '',
      image_url: p.image_url || '',
      is_veg: p.is_veg,
      is_spicy: p.is_spicy,
      is_bestseller: p.is_bestseller,
      is_featured: p.is_featured,
      base_price_rupees: (p.base_price_paise / 100).toString(),
      is_price_verified: p.is_price_verified,
      is_available: p.is_available,
      has_variants: (p.variants && p.variants.length > 0) || false,
      regular_price_rupees: regularVar ? (regularVar.price_paise / 100).toString() : '',
      medium_price_rupees: mediumVar ? (mediumVar.price_paise / 100).toString() : '',
      large_price_rupees: largeVar ? (largeVar.price_paise / 100).toString() : '',
    });
    setFormError('');
  };

  const handleToggleStock = async (product: Product) => {
    const nextStatus = !product.is_available;
    // Check price verification constraint
    if (nextStatus && !product.is_price_verified) {
      alert('Cannot publish product: Price must be verified first by staff.');
      return;
    }

    setProducts((prev) =>
      prev.map((p) => (p.id === product.id ? { ...p, is_available: nextStatus } : p))
    );

    try {
      await fetch('/api/admin/menu', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'toggle-availability',
          productId: product.id,
          isAvailable: nextStatus,
        }),
      });
    } catch (e) {
      console.error(e);
      loadData();
    }
  };

  const handleToggleVerification = async (product: Product) => {
    const nextVerified = !product.is_price_verified;
    try {
      const res = await fetch('/api/admin/menu', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'verify-price',
          productId: product.id,
          isVerified: nextVerified,
          updatedBy: 'Manager',
        }),
      });
      const data = await res.json();
      if (data.success) {
        setProducts((prev) =>
          prev.map((p) =>
            p.id === product.id
              ? {
                  ...p,
                  is_price_verified: nextVerified,
                  is_available: nextVerified ? p.is_available : false,
                }
              : p
          )
        );
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!formData.name.trim()) {
      setFormError('Product name is required.');
      return;
    }
    const basePriceRupees = parseFloat(formData.base_price_rupees);
    if (isNaN(basePriceRupees) || basePriceRupees <= 0) {
      setFormError('Please enter a valid base price in rupees.');
      return;
    }

    // Price verification check: Cannot publish if not verified
    if (formData.is_available && !formData.is_price_verified) {
      setFormError('Cannot publish product: Price verification checkbox must be checked before making available.');
      return;
    }

    const variants = [];
    if (formData.has_variants) {
      const reg = parseFloat(formData.regular_price_rupees) || basePriceRupees;
      const med = parseFloat(formData.medium_price_rupees) || Math.round(basePriceRupees * 1.6);
      const lrg = parseFloat(formData.large_price_rupees) || Math.round(basePriceRupees * 2.3);

      variants.push(
        { id: `var-r-${Date.now()}`, product_id: '', size_name: 'Regular 7"', price_paise: Math.round(reg * 100), is_default: true, is_available: true },
        { id: `var-m-${Date.now()}`, product_id: '', size_name: 'Medium 9"', price_paise: Math.round(med * 100), is_default: false, is_available: true },
        { id: `var-l-${Date.now()}`, product_id: '', size_name: 'Large 12"', price_paise: Math.round(lrg * 100), is_default: false, is_available: true }
      );
    }

    setSubmitting(true);
    try {
      if (editingProduct) {
        const res = await fetch('/api/admin/menu', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: editingProduct.id,
            updates: {
              name: formData.name.trim(),
              slug: formData.slug.trim() || formData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
              category_id: formData.category_id || categories[0]?.id,
              description: formData.description.trim(),
              image_url: formData.image_url.trim() || undefined,
              is_veg: formData.is_veg,
              is_spicy: formData.is_spicy,
              is_bestseller: formData.is_bestseller,
              is_featured: formData.is_featured,
              base_price_paise: Math.round(basePriceRupees * 100),
              is_price_verified: formData.is_price_verified,
              is_available: formData.is_available,
              variants: formData.has_variants ? variants : [],
            },
          }),
        });
        const data = await res.json();
        if (data.success) {
          setEditingProduct(null);
          loadData();
        } else {
          setFormError(data.error || 'Failed to update product.');
        }
      } else {
        const res = await fetch('/api/admin/menu', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: formData.name.trim(),
            slug: formData.slug.trim() || formData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
            category_id: formData.category_id || categories[0]?.id,
            description: formData.description.trim(),
            image_url: formData.image_url.trim() || undefined,
            is_veg: formData.is_veg,
            is_spicy: formData.is_spicy,
            is_bestseller: formData.is_bestseller,
            is_featured: formData.is_featured,
            base_price_paise: Math.round(basePriceRupees * 100),
            is_price_verified: formData.is_price_verified,
            is_available: formData.is_available,
            variants: formData.has_variants ? variants : [],
          }),
        });
        const data = await res.json();
        if (data.success) {
          setShowAddModal(false);
          loadData();
        } else {
          setFormError(data.error || 'Failed to create product.');
        }
      }
    } catch (e: any) {
      setFormError(e.message || 'Server error.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteProduct = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to archive product "${name}"?`)) return;
    try {
      const res = await fetch(`/api/admin/menu?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setProducts((prev) => prev.filter((p) => p.id !== id));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const filteredProducts = products.filter((p) => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      if (!p.name.toLowerCase().includes(q) && !p.description?.toLowerCase().includes(q)) return false;
    }
    if (selectedCategory !== 'all' && p.category_id !== selectedCategory) return false;
    if (selectedDiet === 'veg' && !p.is_veg) return false;
    if (selectedDiet === 'non_veg' && p.is_veg) return false;
    return true;
  });

  return (
    <div className="space-y-6 max-w-7xl">
      
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-border-warm shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <Pizza className="w-5 h-5 text-primary-green" />
            <h1 className="text-xl sm:text-2xl font-black text-forest font-serif">
              Menu & Product Catalog
            </h1>
          </div>
          <p className="text-xs text-muted-gray mt-1">
            Manage recipes, individual variant prices, stock availability, and price verification approvals.
          </p>
        </div>

        <button
          type="button"
          onClick={openAddModal}
          className="bg-primary-green hover:bg-forest text-white text-xs font-bold px-4 py-2.5 rounded-xl flex items-center gap-1.5 shadow-sm transition cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Product</span>
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-3xl border border-border-warm shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          
          <div className="relative">
            <Search className="w-4 h-4 text-muted-gray absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search dishes by name or ingredients..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs pl-10 pr-3 py-2.5 border border-border-warm rounded-xl bg-[#FAF7F0] focus:bg-white focus:outline-hidden font-medium"
            />
          </div>

          <div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full text-xs p-2.5 border border-border-warm rounded-xl bg-[#FAF7F0] font-semibold text-charcoal focus:bg-white focus:outline-hidden"
            >
              <option value="all">All Categories ({categories.length})</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={selectedDiet}
              onChange={(e) => setSelectedDiet(e.target.value as any)}
              className="w-full text-xs p-2.5 border border-border-warm rounded-xl bg-[#FAF7F0] font-semibold text-charcoal focus:bg-white focus:outline-hidden"
            >
              <option value="all">All Dietary Preferences</option>
              <option value="veg">100% Pure Vegetarian 🟢</option>
              <option value="non_veg">Non-Vegetarian 🔴</option>
            </select>
          </div>

        </div>
      </div>

      {/* Menu Products Table */}
      <div className="bg-white rounded-3xl border border-border-warm shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FAF6EE] text-muted-gray uppercase font-bold text-[10px] tracking-wider border-b border-border-warm">
              <tr>
                <th className="px-5 py-3">Product</th>
                <th className="px-5 py-3">Category</th>
                <th className="px-5 py-3">Base Price</th>
                <th className="px-5 py-3">Variants (Reg / Med / Lrg)</th>
                <th className="px-5 py-3">Price Verification</th>
                <th className="px-5 py-3">Availability</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-warm font-medium text-charcoal">
              {filteredProducts.map((p) => {
                const cat = categories.find((c) => c.id === p.category_id);
                const reg = p.variants?.find((v) => v.size_name.includes('Regular'));
                const med = p.variants?.find((v) => v.size_name.includes('Medium'));
                const lrg = p.variants?.find((v) => v.size_name.includes('Large'));

                return (
                  <tr key={p.id} className="hover:bg-neutral-50/80 transition">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-neutral-100 relative overflow-hidden shrink-0 border border-border-warm">
                          {p.image_url ? (
                            <Image
                              src={p.image_url}
                              alt={p.name}
                              fill
                              className="object-cover"
                              unoptimized
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-xl">
                              🍕
                            </div>
                          )}
                        </div>

                        <div>
                          <div className="flex items-center gap-1.5 font-bold text-forest">
                            <span>{p.name}</span>
                            <span
                              className={`w-2 h-2 rounded-full ${
                                p.is_veg ? 'bg-emerald-600' : 'bg-red-600'
                              }`}
                              title={p.is_veg ? 'Vegetarian' : 'Non-Vegetarian'}
                            />
                            {p.is_bestseller && (
                              <span className="text-[9px] bg-amber-100 text-amber-800 font-black px-1.5 py-0.2 rounded">
                                Bestseller
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-muted-gray line-clamp-1 max-w-xs">
                            {p.description}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-4 text-xs font-semibold text-muted-gray">
                      {cat?.name || 'Uncategorized'}
                    </td>

                    <td className="px-5 py-4 font-mono font-black text-forest">
                      {formatINR(p.base_price_paise)}
                    </td>

                    <td className="px-5 py-4 font-mono text-[11px]">
                      {p.variants && p.variants.length > 0 ? (
                        <div className="space-x-1.5">
                          <span title="Regular">{reg ? formatINR(reg.price_paise) : '-'}</span>
                          <span className="text-muted-gray">/</span>
                          <span title="Medium">{med ? formatINR(med.price_paise) : '-'}</span>
                          <span className="text-muted-gray">/</span>
                          <span title="Large">{lrg ? formatINR(lrg.price_paise) : '-'}</span>
                        </div>
                      ) : (
                        <span className="text-muted-gray italic">Single size</span>
                      )}
                    </td>

                    <td className="px-5 py-4">
                      <button
                        type="button"
                        onClick={() => handleToggleVerification(p)}
                        className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1 transition cursor-pointer ${
                          p.is_price_verified
                            ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                            : 'bg-red-100 text-red-800 hover:bg-red-200'
                        }`}
                        title="Click to toggle verified status"
                      >
                        {p.is_price_verified ? (
                          <>
                            <ShieldCheck className="w-3 h-3 text-emerald-600" />
                            <span>Verified</span>
                          </>
                        ) : (
                          <>
                            <AlertCircle className="w-3 h-3 text-red-600" />
                            <span>Unverified</span>
                          </>
                        )}
                      </button>
                    </td>

                    <td className="px-5 py-4">
                      <button
                        type="button"
                        onClick={() => handleToggleStock(p)}
                        className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider transition cursor-pointer ${
                          p.is_available
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : 'bg-neutral-100 text-neutral-500 border border-neutral-200'
                        }`}
                      >
                        {p.is_available ? '● In Stock' : '○ Sold Out'}
                      </button>
                    </td>

                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => setPreviewProduct(p)}
                          className="p-1.5 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-charcoal transition"
                          title="Customer Preview"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => openEditModal(p)}
                          className="p-1.5 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-charcoal transition"
                          title="Edit Product"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteProduct(p.id, p.name)}
                          className="p-1.5 rounded-lg bg-neutral-100 hover:bg-red-100 text-red-600 transition"
                          title="Archive Product"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ======================================================== */}
      {/* ADD / EDIT PRODUCT MODAL */}
      {/* ======================================================== */}
      {(showAddModal || editingProduct) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-xl w-full shadow-2xl border border-border-warm space-y-5 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-border-warm">
              <h2 className="text-lg font-black font-serif text-forest">
                {editingProduct ? `Edit "${editingProduct.name}"` : 'Create New Menu Product'}
              </h2>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setEditingProduct(null);
                }}
                className="p-1 text-muted-gray hover:text-charcoal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 bg-red-50 text-red-700 rounded-xl text-xs flex items-center gap-2 border border-red-200">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSaveProduct} className="space-y-4 text-xs">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-charcoal block mb-1">Product Name</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Double Cheese Margherita"
                    className="w-full p-2.5 border border-border-warm rounded-xl bg-[#FAF7F0] focus:bg-white focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="font-bold text-charcoal block mb-1">Category</label>
                  <select
                    value={formData.category_id}
                    onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                    className="w-full p-2.5 border border-border-warm rounded-xl bg-[#FAF7F0] font-semibold"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-charcoal block mb-1">Description / Ingredients</label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="e.g. Loaded with 100% real mozzarella cheese and hand-tossed artisan dough..."
                  className="w-full p-2.5 border border-border-warm rounded-xl bg-[#FAF7F0] focus:bg-white focus:outline-hidden"
                />
              </div>

              <div>
                <label className="font-bold text-charcoal block mb-1">Image URL</label>
                <input
                  type="url"
                  value={formData.image_url}
                  onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full p-2.5 border border-border-warm rounded-xl bg-[#FAF7F0] focus:bg-white focus:outline-hidden"
                />
              </div>

              {/* Price & Variants */}
              <div className="p-4 bg-[#FAF7F0] rounded-2xl border border-border-warm space-y-3">
                <div>
                  <label className="font-bold text-forest block mb-1">
                    Base Price (in ₹ Rupees) *
                  </label>
                  <input
                    type="number"
                    step="1"
                    min="1"
                    required
                    value={formData.base_price_rupees}
                    onChange={(e) => setFormData({ ...formData, base_price_rupees: e.target.value })}
                    placeholder="e.g. 249"
                    className="w-full p-2.5 border border-border-warm rounded-xl bg-white font-mono font-bold text-sm"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="has_variants"
                    checked={formData.has_variants}
                    onChange={(e) => setFormData({ ...formData, has_variants: e.target.checked })}
                    className="w-4 h-4 accent-primary-green"
                  />
                  <label htmlFor="has_variants" className="font-bold text-charcoal cursor-pointer">
                    Enable Regular, Medium, Large size variants
                  </label>
                </div>

                {formData.has_variants && (
                  <div className="grid grid-cols-3 gap-2 pt-1 font-mono">
                    <div>
                      <span className="text-[10px] text-muted-gray block">Regular 7" (₹)</span>
                      <input
                        type="number"
                        value={formData.regular_price_rupees}
                        onChange={(e) => setFormData({ ...formData, regular_price_rupees: e.target.value })}
                        placeholder={formData.base_price_rupees || '249'}
                        className="w-full p-2 border border-border-warm rounded-lg bg-white text-xs font-bold"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-muted-gray block">Medium 9" (₹)</span>
                      <input
                        type="number"
                        value={formData.medium_price_rupees}
                        onChange={(e) => setFormData({ ...formData, medium_price_rupees: e.target.value })}
                        placeholder="399"
                        className="w-full p-2 border border-border-warm rounded-lg bg-white text-xs font-bold"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-muted-gray block">Large 12" (₹)</span>
                      <input
                        type="number"
                        value={formData.large_price_rupees}
                        onChange={(e) => setFormData({ ...formData, large_price_rupees: e.target.value })}
                        placeholder="599"
                        className="w-full p-2 border border-border-warm rounded-lg bg-white text-xs font-bold"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Badges & Flags */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                <label className="flex items-center gap-1.5 p-2 bg-[#FAF7F0] rounded-xl border border-border-warm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_veg}
                    onChange={(e) => setFormData({ ...formData, is_veg: e.target.checked })}
                    className="accent-primary-green"
                  />
                  <span className="font-bold">Pure Veg 🟢</span>
                </label>

                <label className="flex items-center gap-1.5 p-2 bg-[#FAF7F0] rounded-xl border border-border-warm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_spicy}
                    onChange={(e) => setFormData({ ...formData, is_spicy: e.target.checked })}
                    className="accent-red-600"
                  />
                  <span className="font-bold">Spicy 🌶️</span>
                </label>

                <label className="flex items-center gap-1.5 p-2 bg-[#FAF7F0] rounded-xl border border-border-warm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_bestseller}
                    onChange={(e) => setFormData({ ...formData, is_bestseller: e.target.checked })}
                    className="accent-amber-500"
                  />
                  <span className="font-bold">Bestseller ⭐</span>
                </label>

                <label className="flex items-center gap-1.5 p-2 bg-[#FAF7F0] rounded-xl border border-border-warm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_featured}
                    onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked })}
                    className="accent-purple-600"
                  />
                  <span className="font-bold">Featured 👑</span>
                </label>
              </div>

              {/* Verification & Publication Rule */}
              <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200 space-y-2">
                <label className="flex items-start gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_price_verified}
                    onChange={(e) => setFormData({ ...formData, is_price_verified: e.target.checked })}
                    className="mt-0.5 accent-emerald-600 w-4 h-4"
                  />
                  <div>
                    <span className="font-black text-emerald-900 block">
                      Price Verification Approved (Required to publish)
                    </span>
                    <span className="text-[11px] text-emerald-700">
                      I certify that the above price is authentic and verified with the restaurant menu card.
                    </span>
                  </div>
                </label>

                <label className="flex items-center gap-2 cursor-pointer pt-1 border-t border-emerald-200/60">
                  <input
                    type="checkbox"
                    checked={formData.is_available}
                    onChange={(e) => setFormData({ ...formData, is_available: e.target.checked })}
                    className="accent-primary-green w-4 h-4"
                  />
                  <span className="font-bold text-forest">
                    Publish immediately (Make available to online customers)
                  </span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-border-warm">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingProduct(null);
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
                  <span>{submitting ? 'Saving...' : editingProduct ? 'Save Product Changes' : 'Create & Publish'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* CUSTOMER PREVIEW MODAL */}
      {/* ======================================================== */}
      {previewProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-border-warm space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-2 border-b border-border-warm">
              <span className="text-xs font-bold text-muted-gray uppercase">Customer Storefront Preview</span>
              <button onClick={() => setPreviewProduct(null)} className="p-1 text-muted-gray hover:text-charcoal">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Product Card Rendering */}
            <div className="rounded-2xl border border-border-warm overflow-hidden bg-white shadow-xs">
              <div className="h-44 bg-neutral-100 relative overflow-hidden">
                {previewProduct.image_url ? (
                  <Image
                    src={previewProduct.image_url}
                    alt={previewProduct.name}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-4xl">🍕</div>
                )}
                {previewProduct.is_bestseller && (
                  <span className="absolute top-2.5 left-2.5 bg-amber-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-xs">
                    BESTSELLER
                  </span>
                )}
              </div>

              <div className="p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-sm text-forest font-serif">{previewProduct.name}</h3>
                  <span className={`w-2.5 h-2.5 rounded-full ${previewProduct.is_veg ? 'bg-emerald-600' : 'bg-red-600'}`} />
                </div>
                <p className="text-xs text-muted-gray line-clamp-2">{previewProduct.description}</p>
                <div className="flex items-center justify-between pt-2">
                  <span className="text-base font-black text-forest font-mono">
                    {formatINR(previewProduct.base_price_paise)}
                  </span>
                  <span className="bg-primary-green text-white text-xs font-bold px-3 py-1.5 rounded-xl shadow-xs">
                    + ADD
                  </span>
                </div>
              </div>
            </div>

            <div className="text-center">
              <button
                type="button"
                onClick={() => setPreviewProduct(null)}
                className="w-full py-2 bg-neutral-100 hover:bg-neutral-200 text-xs font-bold text-charcoal rounded-xl transition cursor-pointer"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
