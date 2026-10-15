'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
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
  Camera,
  Image as ImageIcon,
  LayoutGrid,
  List,
  ArrowRight,
  SlidersHorizontal,
} from 'lucide-react';
import { Product, Category } from '@/lib/types';
import { formatINR } from '@/lib/pricing';
import { LoyaltyManagementTab } from '@/components/admin/LoyaltyManagementTab';
import { FOOD_PHOTO_PRESETS, FoodPhotoPreset } from '@/lib/data/photo-presets';

export default function AdminMenuPage() {
  const [activeTab, setActiveTab] = useState<'menu' | 'loyalty'>('menu');
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & View Mode
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedDiet, setSelectedDiet] = useState<'all' | 'veg' | 'non_veg'>('all');
  const [availabilityFilter, setAvailabilityFilter] = useState<'all' | 'available' | 'sold_out'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [previewProduct, setPreviewProduct] = useState<Product | null>(null);

  // Photo Change Modal State (WordPress style)
  const [photoModalProduct, setPhotoModalProduct] = useState<Product | null>(null);
  const [photoSelectedUrl, setPhotoSelectedUrl] = useState('');
  const [photoCustomUrl, setPhotoCustomUrl] = useState('');
  const [photoTab, setPhotoTab] = useState<'presets' | 'custom'>('presets');
  const [photoUpdating, setPhotoUpdating] = useState(false);

  // Add/Edit Gallery Picker
  const [showGalleryInForm, setShowGalleryInForm] = useState(false);

  // Feedback Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

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
    has_variants: true,
    regular_price_rupees: '',
    medium_price_rupees: '',
    large_price_rupees: '',
  });

  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 3500);
  };

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
    if (typeof window !== 'undefined') {
      const p = new URLSearchParams(window.location.search);
      if (p.get('tab') === 'loyalty') {
        setActiveTab('loyalty');
      }
    }
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
    setShowGalleryInForm(false);
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
      is_price_verified: true,
      is_available: p.is_available,
      has_variants: (p.variants && p.variants.length > 0) || false,
      regular_price_rupees: regularVar ? (regularVar.price_paise / 100).toString() : '',
      medium_price_rupees: mediumVar ? (mediumVar.price_paise / 100).toString() : '',
      large_price_rupees: largeVar ? (largeVar.price_paise / 100).toString() : '',
    });
    setFormError('');
    setShowGalleryInForm(false);
  };

  // 1-Click Available / Sold Out Toggle (WordPress style)
  const handleToggleStock = async (product: Product) => {
    const nextStatus = !product.is_available;

    // Optimistic UI update
    setProducts((prev) =>
      prev.map((p) =>
        p.id === product.id ? { ...p, is_available: nextStatus, is_price_verified: true } : p
      )
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
      showToast(`"${product.name}" is now ${nextStatus ? 'Available' : 'Sold Out'}`);
    } catch (e) {
      console.error('Error toggling availability', e);
      loadData();
    }
  };

  // Quick Photo Change Modal Handlers
  const openPhotoModal = (product: Product) => {
    setPhotoModalProduct(product);
    setPhotoSelectedUrl(product.image_url || '');
    setPhotoCustomUrl(product.image_url || '');
    setPhotoTab('presets');
  };

  const handleSavePhoto = async () => {
    if (!photoModalProduct) return;
    const urlToSave = photoTab === 'custom' ? photoCustomUrl.trim() : photoSelectedUrl.trim();

    if (!urlToSave) {
      alert('Please select a photo or enter an image URL.');
      return;
    }

    setPhotoUpdating(true);
    try {
      const res = await fetch('/api/admin/menu', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: photoModalProduct.id,
          updates: { image_url: urlToSave },
        }),
      });

      const data = await res.json();
      if (data.success) {
        setProducts((prev) =>
          prev.map((p) => (p.id === photoModalProduct.id ? { ...p, image_url: urlToSave } : p))
        );
        showToast(`Photo for "${photoModalProduct.name}" updated successfully!`);
        setPhotoModalProduct(null);
      } else {
        alert(data.error || 'Failed to update photo.');
      }
    } catch (e: any) {
      alert(e.message || 'Error updating photo.');
    } finally {
      setPhotoUpdating(false);
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
              is_price_verified: true,
              is_available: formData.is_available,
              variants: formData.has_variants ? variants : [],
            },
          }),
        });
        const data = await res.json();
        if (data.success) {
          setEditingProduct(null);
          showToast(`"${formData.name}" updated successfully!`);
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
            is_price_verified: true,
            is_available: formData.is_available,
            variants: formData.has_variants ? variants : [],
          }),
        });
        const data = await res.json();
        if (data.success) {
          setShowAddModal(false);
          showToast(`"${formData.name}" added to menu catalog!`);
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
        showToast(`"${name}" has been removed.`);
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
    if (availabilityFilter === 'available' && !p.is_available) return false;
    if (availabilityFilter === 'sold_out' && p.is_available) return false;
    return true;
  });

  const availableCount = products.filter((p) => p.is_available).length;
  const soldOutCount = products.filter((p) => !p.is_available).length;

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#161B16] text-white px-4 py-3 rounded-2xl shadow-2xl border border-emerald-500/30 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-xs font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Top Tabs */}
      <div className="flex items-center gap-2 border-b border-border-warm pb-3 overflow-x-auto text-xs font-bold">
        <button
          type="button"
          onClick={() => setActiveTab('menu')}
          className={`px-4 py-2 rounded-xl transition cursor-pointer flex items-center gap-2 ${
            activeTab === 'menu'
              ? 'bg-forest text-white shadow-xs'
              : 'bg-white text-charcoal border border-border-warm hover:bg-neutral-50'
          }`}
        >
          <Pizza className="w-3.5 h-3.5" />
          <span>Food Catalog & Inventory</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-white/20">
            {products.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('loyalty')}
          className={`px-4 py-2 rounded-xl transition cursor-pointer flex items-center gap-2 ${
            activeTab === 'loyalty'
              ? 'bg-primary-green text-white shadow-xs'
              : 'bg-white text-charcoal border border-border-warm hover:bg-neutral-50'
          }`}
        >
          <span className="text-sm">🎁</span>
          <span>Customer Loyalty Program</span>
        </button>

        <Link
          href="/admin/categories"
          className="px-4 py-2 rounded-xl bg-white text-charcoal border border-border-warm hover:bg-neutral-50 transition flex items-center gap-1.5"
        >
          <span>Categories ({categories.length})</span>
        </Link>

        <Link
          href="/admin/coupons"
          className="px-4 py-2 rounded-xl bg-white text-charcoal border border-border-warm hover:bg-neutral-50 transition flex items-center gap-1.5"
        >
          <span>Coupons & Offers</span>
        </Link>
      </div>

      {activeTab === 'loyalty' ? (
        <LoyaltyManagementTab />
      ) : (
        <>
          {/* Header Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-border-warm shadow-xs">
            <div>
              <div className="flex items-center gap-2">
                <Pizza className="w-5 h-5 text-primary-green" />
                <h1 className="text-xl sm:text-2xl font-black text-forest font-serif">
                  Food & Menu Management
                </h1>
              </div>
              <p className="text-xs text-muted-gray mt-1">
                WordPress-style catalog: 1-click photo change, instant Available / Sold Out toggle, and price management.
              </p>
            </div>

            <button
              type="button"
              onClick={openAddModal}
              className="bg-primary-green hover:bg-forest text-white text-xs font-bold px-4 py-2.5 rounded-xl flex items-center gap-1.5 shadow-sm transition cursor-pointer self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Food Item</span>
            </button>
          </div>

          {/* WordPress Filter & Control Bar */}
          <div className="bg-white p-4 rounded-3xl border border-border-warm shadow-xs space-y-3">
            {/* Row 1: Search and Category Dropdowns */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="relative">
                <Search className="w-4 h-4 text-muted-gray absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search dishes or ingredients..."
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

            {/* Row 2: Availability Quick Pills & View Switcher */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-border-warm">
              {/* Availability Filter Buttons */}
              <div className="flex items-center gap-1.5 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setAvailabilityFilter('all')}
                  className={`px-3 py-1.5 rounded-xl transition cursor-pointer flex items-center gap-1.5 ${
                    availabilityFilter === 'all'
                      ? 'bg-forest text-white shadow-xs'
                      : 'bg-[#FAF7F0] text-charcoal hover:bg-neutral-200'
                  }`}
                >
                  <span>All Items</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/10">
                    {products.length}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setAvailabilityFilter('available')}
                  className={`px-3 py-1.5 rounded-xl transition cursor-pointer flex items-center gap-1.5 ${
                    availabilityFilter === 'available'
                      ? 'bg-emerald-700 text-white shadow-xs'
                      : 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span>Available (In Stock)</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-900/20 font-mono">
                    {availableCount}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setAvailabilityFilter('sold_out')}
                  className={`px-3 py-1.5 rounded-xl transition cursor-pointer flex items-center gap-1.5 ${
                    availabilityFilter === 'sold_out'
                      ? 'bg-red-700 text-white shadow-xs'
                      : 'bg-red-50 text-red-800 border border-red-200 hover:bg-red-100'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-red-500" />
                  <span>Sold Out (Unavailable)</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-red-900/20 font-mono">
                    {soldOutCount}
                  </span>
                </button>
              </div>

              {/* View Switcher: Cards vs Table */}
              <div className="flex items-center gap-1 bg-[#FAF7F0] p-1 rounded-xl border border-border-warm text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setViewMode('grid')}
                  className={`px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 transition cursor-pointer ${
                    viewMode === 'grid'
                      ? 'bg-white text-forest shadow-xs'
                      : 'text-muted-gray hover:text-charcoal'
                  }`}
                  title="WordPress Cards View"
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  <span>Cards View</span>
                </button>

                <button
                  type="button"
                  onClick={() => setViewMode('table')}
                  className={`px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 transition cursor-pointer ${
                    viewMode === 'table'
                      ? 'bg-white text-forest shadow-xs'
                      : 'text-muted-gray hover:text-charcoal'
                  }`}
                  title="Compact Table View"
                >
                  <List className="w-3.5 h-3.5" />
                  <span>Table View</span>
                </button>
              </div>
            </div>
          </div>

          {/* ======================================================== */}
          {/* VIEW MODE 1: WORDPRESS VISUAL CARDS GRID */}
          {/* ======================================================== */}
          {viewMode === 'grid' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredProducts.map((p) => {
                const cat = categories.find((c) => c.id === p.category_id);
                const reg = p.variants?.find((v) => v.size_name.includes('Regular'));
                const med = p.variants?.find((v) => v.size_name.includes('Medium'));
                const lrg = p.variants?.find((v) => v.size_name.includes('Large'));

                return (
                  <div
                    key={p.id}
                    className={`bg-white rounded-3xl border transition-all duration-200 overflow-hidden shadow-xs hover:shadow-md flex flex-col justify-between ${
                      p.is_available ? 'border-border-warm' : 'border-red-200 bg-red-50/20'
                    }`}
                  >
                    {/* Food Photo Container */}
                    <div className="relative h-44 bg-neutral-100 overflow-hidden group">
                      {p.image_url ? (
                        <Image
                          src={p.image_url}
                          alt={p.name}
                          fill
                          className="object-cover group-hover:scale-105 transition duration-300"
                          unoptimized
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-4xl bg-[#FAF7F0]">
                          🍕
                        </div>
                      )}

                      {/* Top Badges */}
                      <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 flex-wrap">
                        <span
                          className={`w-3 h-3 rounded-full border-2 border-white shadow-xs ${
                            p.is_veg ? 'bg-emerald-600' : 'bg-red-600'
                          }`}
                          title={p.is_veg ? 'Pure Vegetarian' : 'Non-Vegetarian'}
                        />
                        {p.is_bestseller && (
                          <span className="bg-amber-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-xs">
                            BESTSELLER
                          </span>
                        )}
                        {cat && (
                          <span className="bg-black/60 backdrop-blur-xs text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                            {cat.name}
                          </span>
                        )}
                      </div>

                      {/* Quick "Change Photo" Button on Image */}
                      <button
                        type="button"
                        onClick={() => openPhotoModal(p)}
                        className="absolute bottom-2.5 right-2.5 bg-black/75 hover:bg-black text-white text-[11px] font-bold px-2.5 py-1 rounded-xl backdrop-blur-xs flex items-center gap-1.5 shadow-md transition cursor-pointer"
                        title="Change Food Photo"
                      >
                        <Camera className="w-3.5 h-3.5 text-amber-400" />
                        <span>Change Photo</span>
                      </button>

                      {/* Sold Out Overlay if unavailable */}
                      {!p.is_available && (
                        <div className="absolute inset-0 bg-black/40 backdrop-blur-2xs flex items-center justify-center">
                          <span className="bg-red-600 text-white font-black text-xs px-3 py-1 rounded-full uppercase tracking-wider shadow-lg">
                            Sold Out (Unavailable)
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Food Information */}
                    <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-bold text-forest text-sm font-serif leading-tight">
                            {p.name}
                          </h3>
                          <div className="text-right shrink-0">
                            <span className="font-mono font-black text-forest text-base">
                              {formatINR(p.base_price_paise)}
                            </span>
                          </div>
                        </div>

                        <p className="text-[11px] text-muted-gray line-clamp-2 mt-1">
                          {p.description || 'Artisan preparation baked fresh in wood-fired stone oven.'}
                        </p>

                        {/* Variants breakdown if present */}
                        {p.variants && p.variants.length > 0 && (
                          <div className="mt-2 text-[10px] font-mono text-muted-gray flex items-center gap-2">
                            <span>R: {reg ? formatINR(reg.price_paise) : '-'}</span>
                            <span>&bull;</span>
                            <span>M: {med ? formatINR(med.price_paise) : '-'}</span>
                            <span>&bull;</span>
                            <span>L: {lrg ? formatINR(lrg.price_paise) : '-'}</span>
                          </div>
                        )}
                      </div>

                      {/* Availability Toggle & Actions */}
                      <div className="pt-3 border-t border-border-warm space-y-2">
                        {/* 1-Click Available / Sold Out Toggle */}
                        <button
                          type="button"
                          onClick={() => handleToggleStock(p)}
                          className={`w-full py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-2xs ${
                            p.is_available
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-300 hover:bg-emerald-100'
                              : 'bg-red-50 text-red-800 border border-red-300 hover:bg-red-100'
                          }`}
                        >
                          <span
                            className={`w-2.5 h-2.5 rounded-full ${
                              p.is_available ? 'bg-emerald-600 animate-pulse' : 'bg-red-600'
                            }`}
                          />
                          <span>
                            {p.is_available ? 'In Stock (Available Online)' : 'Sold Out (Click to Enable)'}
                          </span>
                        </button>

                        {/* Action Buttons Row */}
                        <div className="flex items-center justify-between gap-1.5 pt-1">
                          <button
                            type="button"
                            onClick={() => openPhotoModal(p)}
                            className="flex-1 py-1.5 px-2 bg-neutral-100 hover:bg-neutral-200 text-charcoal rounded-xl text-[11px] font-bold flex items-center justify-center gap-1 transition"
                            title="Choose from photo library or paste image URL"
                          >
                            <ImageIcon className="w-3 h-3 text-muted-gray" />
                            <span>Photo</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => openEditModal(p)}
                            className="flex-1 py-1.5 px-2 bg-neutral-100 hover:bg-neutral-200 text-charcoal rounded-xl text-[11px] font-bold flex items-center justify-center gap-1 transition"
                            title="Edit Name, Price, Description"
                          >
                            <Edit className="w-3 h-3 text-muted-gray" />
                            <span>Edit</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setPreviewProduct(p)}
                            className="p-1.5 bg-neutral-100 hover:bg-neutral-200 text-charcoal rounded-xl transition"
                            title="Customer Storefront Preview"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeleteProduct(p.id, p.name)}
                            className="p-1.5 bg-neutral-100 hover:bg-red-100 text-red-600 rounded-xl transition"
                            title="Archive Item"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* ======================================================== */}
          {/* VIEW MODE 2: COMPACT TABLE VIEW */}
          {/* ======================================================== */}
          {viewMode === 'table' && (
            <div className="bg-white rounded-3xl border border-border-warm shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#FAF6EE] text-muted-gray uppercase font-bold text-[10px] tracking-wider border-b border-border-warm">
                    <tr>
                      <th className="px-5 py-3">Photo & Dish</th>
                      <th className="px-5 py-3">Category</th>
                      <th className="px-5 py-3">Base Price</th>
                      <th className="px-5 py-3">Variants (Reg/Med/Lrg)</th>
                      <th className="px-5 py-3">Stock Status</th>
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
                              {/* Thumbnail with Click to Change Photo */}
                              <div
                                onClick={() => openPhotoModal(p)}
                                className="w-12 h-12 rounded-xl bg-neutral-100 relative overflow-hidden shrink-0 border border-border-warm cursor-pointer group"
                                title="Click to Change Photo"
                              >
                                {p.image_url ? (
                                  <Image
                                    src={p.image_url}
                                    alt={p.name}
                                    fill
                                    className="object-cover group-hover:scale-110 transition"
                                    unoptimized
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-xl">
                                    🍕
                                  </div>
                                )}
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white">
                                  <Camera className="w-4 h-4" />
                                </div>
                              </div>

                              <div>
                                <div className="flex items-center gap-1.5 font-bold text-forest">
                                  <span>{p.name}</span>
                                  <span
                                    className={`w-2 h-2 rounded-full ${
                                      p.is_veg ? 'bg-emerald-600' : 'bg-red-600'
                                    }`}
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
                                <span>{reg ? formatINR(reg.price_paise) : '-'}</span>
                                <span className="text-muted-gray">/</span>
                                <span>{med ? formatINR(med.price_paise) : '-'}</span>
                                <span className="text-muted-gray">/</span>
                                <span>{lrg ? formatINR(lrg.price_paise) : '-'}</span>
                              </div>
                            ) : (
                              <span className="text-muted-gray italic">Single size</span>
                            )}
                          </td>

                          {/* 1-Click Available Toggle in Table */}
                          <td className="px-5 py-4">
                            <button
                              type="button"
                              onClick={() => handleToggleStock(p)}
                              className={`px-3 py-1.5 rounded-full text-[11px] font-bold flex items-center gap-1.5 transition cursor-pointer ${
                                p.is_available
                                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-300 hover:bg-emerald-100'
                                  : 'bg-red-50 text-red-800 border border-red-300 hover:bg-red-100'
                              }`}
                            >
                              <span
                                className={`w-2 h-2 rounded-full ${
                                  p.is_available ? 'bg-emerald-600' : 'bg-red-600'
                                }`}
                              />
                              <span>{p.is_available ? 'Available' : 'Sold Out'}</span>
                            </button>
                          </td>

                          {/* Actions */}
                          <td className="px-5 py-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => openPhotoModal(p)}
                                className="p-1.5 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-charcoal transition"
                                title="Change Photo"
                              >
                                <Camera className="w-3.5 h-3.5 text-amber-600" />
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
                                onClick={() => setPreviewProduct(p)}
                                className="p-1.5 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-charcoal transition"
                                title="Customer Preview"
                              >
                                <Eye className="w-3.5 h-3.5" />
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
          )}

          {/* ======================================================== */}
          {/* WORDPRESS MEDIA LIBRARY / PHOTO CHANGE MODAL */}
          {/* ======================================================== */}
          {photoModalProduct && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
              <div
                className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-7 shadow-2xl border border-border-warm space-y-4 max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-150"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Modal Header */}
                <div className="flex items-center justify-between pb-3 border-b border-border-warm">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center">
                      <Camera className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-base font-black text-forest font-serif">
                        Change Food Photo
                      </h2>
                      <p className="text-xs text-muted-gray">
                        Product: <strong>{photoModalProduct.name}</strong>
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setPhotoModalProduct(null)}
                    className="p-1 text-muted-gray hover:text-charcoal rounded-full"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Tab Selector: Presets vs Custom URL */}
                <div className="flex items-center gap-2 border-b border-border-warm pb-2 text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => setPhotoTab('presets')}
                    className={`px-3 py-1.5 rounded-xl transition cursor-pointer flex items-center gap-1.5 ${
                      photoTab === 'presets'
                        ? 'bg-forest text-white shadow-xs'
                        : 'bg-[#FAF7F0] text-charcoal hover:bg-neutral-200'
                    }`}
                  >
                    <ImageIcon className="w-3.5 h-3.5" />
                    <span>Artisan Photo Presets ({FOOD_PHOTO_PRESETS.length})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPhotoTab('custom')}
                    className={`px-3 py-1.5 rounded-xl transition cursor-pointer flex items-center gap-1.5 ${
                      photoTab === 'custom'
                        ? 'bg-forest text-white shadow-xs'
                        : 'bg-[#FAF7F0] text-charcoal hover:bg-neutral-200'
                    }`}
                  >
                    <span>Custom Image URL</span>
                  </button>
                </div>

                {/* Tab 1: Presets Gallery */}
                {photoTab === 'presets' && (
                  <div className="space-y-3">
                    <p className="text-[11px] text-muted-gray">
                      Click any photo below to instantly set it as the dish presentation on your website:
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-h-64 overflow-y-auto p-1 custom-scrollbar">
                      {FOOD_PHOTO_PRESETS.map((preset) => {
                        const isSelected = photoSelectedUrl === preset.url;
                        return (
                          <div
                            key={preset.title}
                            onClick={() => setPhotoSelectedUrl(preset.url)}
                            className={`rounded-2xl border p-1.5 cursor-pointer transition relative group ${
                              isSelected
                                ? 'border-primary-green ring-2 ring-primary-green/30 bg-emerald-50/40'
                                : 'border-border-warm hover:border-forest/50 bg-[#FAF7F0]'
                            }`}
                          >
                            <div className="h-24 rounded-xl relative overflow-hidden bg-neutral-200">
                              <Image
                                src={preset.url}
                                alt={preset.title}
                                fill
                                className="object-cover group-hover:scale-105 transition"
                                unoptimized
                              />
                              {isSelected && (
                                <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-primary-green text-white flex items-center justify-center shadow-xs">
                                  <Check className="w-3 h-3" />
                                </div>
                              )}
                            </div>
                            <div className="mt-1 px-1">
                              <div className="text-[11px] font-bold text-forest truncate">
                                {preset.title}
                              </div>
                              <div className="text-[9px] text-muted-gray uppercase font-semibold">
                                {preset.category}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Tab 2: Custom URL Input */}
                {photoTab === 'custom' && (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-bold text-forest mb-1.5">
                        Image Link / Direct URL
                      </label>
                      <input
                        type="url"
                        placeholder="https://images.unsplash.com/... or https://your-cdn.com/pizza.jpg"
                        value={photoCustomUrl}
                        onChange={(e) => setPhotoCustomUrl(e.target.value)}
                        className="w-full p-3 border border-border-warm rounded-xl bg-[#FAF7F0] focus:bg-white text-xs font-medium focus:outline-hidden"
                      />
                      <p className="text-[11px] text-muted-gray mt-1">
                        Paste any high-resolution web image link (Unsplash, Cloudinary, Imgur, WordPress, etc.)
                      </p>
                    </div>

                    {photoCustomUrl && (
                      <div className="mt-2">
                        <span className="text-[11px] font-bold text-muted-gray uppercase block mb-1">
                          Live Photo Preview:
                        </span>
                        <div className="h-36 max-w-sm rounded-2xl relative overflow-hidden border border-border-warm bg-neutral-100">
                          <Image
                            src={photoCustomUrl}
                            alt="Custom Preview"
                            fill
                            className="object-cover"
                            unoptimized
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Modal Footer */}
                <div className="flex items-center justify-between pt-3 border-t border-border-warm">
                  <button
                    type="button"
                    onClick={() => setPhotoModalProduct(null)}
                    className="px-4 py-2 text-xs font-bold text-muted-gray hover:text-charcoal cursor-pointer"
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    onClick={handleSavePhoto}
                    disabled={photoUpdating}
                    className="px-5 py-2.5 rounded-xl bg-forest hover:bg-forest/90 text-white font-bold text-xs flex items-center gap-2 shadow-sm transition disabled:opacity-50 cursor-pointer"
                  >
                    {photoUpdating ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Updating Photo...</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Apply & Save Photo</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* ADD / EDIT PRODUCT MODAL (WORDPRESS STYLE) */}
          {/* ======================================================== */}
          {(showAddModal || editingProduct) && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
              <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-xl w-full shadow-2xl border border-border-warm space-y-4 my-8">
                <div className="flex items-center justify-between pb-3 border-b border-border-warm">
                  <h2 className="text-lg font-black font-serif text-forest">
                    {editingProduct ? `Edit "${editingProduct.name}"` : 'Add New Food Item'}
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
                      <label className="font-bold text-charcoal block mb-1">Food Name *</label>
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
                      <label className="font-bold text-charcoal block mb-1">Category *</label>
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
                    <label className="font-bold text-charcoal block mb-1">
                      Description / Ingredients
                    </label>
                    <textarea
                      rows={2}
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="e.g. 100% mozzarella cheese, fresh hand-rolled dough, Italian herbs..."
                      className="w-full p-2.5 border border-border-warm rounded-xl bg-[#FAF7F0] focus:bg-white focus:outline-hidden"
                    />
                  </div>

                  {/* Photo Selection with Gallery Selector */}
                  <div className="p-3 bg-[#FAF7F0] rounded-2xl border border-border-warm space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="font-bold text-charcoal block">Food Presentation Photo</label>
                      <button
                        type="button"
                        onClick={() => setShowGalleryInForm(!showGalleryInForm)}
                        className="text-[11px] font-bold text-primary-green hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <ImageIcon className="w-3.5 h-3.5" />
                        <span>{showGalleryInForm ? 'Hide Gallery' : 'Choose from Photo Presets'}</span>
                      </button>
                    </div>

                    <input
                      type="url"
                      value={formData.image_url}
                      onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                      placeholder="Paste image URL or choose preset below"
                      className="w-full p-2.5 border border-border-warm rounded-xl bg-white focus:outline-hidden text-xs"
                    />

                    {showGalleryInForm && (
                      <div className="grid grid-cols-4 gap-2 pt-2 border-t border-border-warm max-h-40 overflow-y-auto">
                        {FOOD_PHOTO_PRESETS.map((item) => (
                          <div
                            key={item.title}
                            onClick={() => {
                              setFormData({ ...formData, image_url: item.url });
                              setShowGalleryInForm(false);
                            }}
                            className="cursor-pointer border border-border-warm rounded-xl overflow-hidden hover:ring-2 hover:ring-primary-green transition"
                          >
                            <div className="h-14 relative bg-neutral-100">
                              <Image
                                src={item.url}
                                alt={item.title}
                                fill
                                className="object-cover"
                                unoptimized
                              />
                            </div>
                            <div className="text-[9px] p-1 font-bold truncate bg-white">
                              {item.title}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Price & Variants in Simple Rupees */}
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
                        onChange={(e) =>
                          setFormData({ ...formData, base_price_rupees: e.target.value })
                        }
                        placeholder="e.g. 249"
                        className="w-full p-2.5 border border-border-warm rounded-xl bg-white font-mono font-bold text-sm"
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="has_variants"
                        checked={formData.has_variants}
                        onChange={(e) =>
                          setFormData({ ...formData, has_variants: e.target.checked })
                        }
                        className="w-4 h-4 accent-primary-green"
                      />
                      <label htmlFor="has_variants" className="font-bold text-charcoal cursor-pointer">
                        Enable Regular (7"), Medium (9"), Large (12") variants
                      </label>
                    </div>

                    {formData.has_variants && (
                      <div className="grid grid-cols-3 gap-2 pt-1 font-mono">
                        <div>
                          <span className="text-[10px] text-muted-gray block">Regular 7" (₹)</span>
                          <input
                            type="number"
                            value={formData.regular_price_rupees}
                            onChange={(e) =>
                              setFormData({ ...formData, regular_price_rupees: e.target.value })
                            }
                            placeholder={formData.base_price_rupees || '249'}
                            className="w-full p-2 border border-border-warm rounded-lg bg-white text-xs font-bold"
                          />
                        </div>
                        <div>
                          <span className="text-[10px] text-muted-gray block">Medium 9" (₹)</span>
                          <input
                            type="number"
                            value={formData.medium_price_rupees}
                            onChange={(e) =>
                              setFormData({ ...formData, medium_price_rupees: e.target.value })
                            }
                            placeholder="399"
                            className="w-full p-2 border border-border-warm rounded-lg bg-white text-xs font-bold"
                          />
                        </div>
                        <div>
                          <span className="text-[10px] text-muted-gray block">Large 12" (₹)</span>
                          <input
                            type="number"
                            value={formData.large_price_rupees}
                            onChange={(e) =>
                              setFormData({ ...formData, large_price_rupees: e.target.value })
                            }
                            placeholder="599"
                            className="w-full p-2 border border-border-warm rounded-lg bg-white text-xs font-bold"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Dietary & Badges */}
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

                  {/* Direct Availability Toggle (No verification blocker) */}
                  <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.is_available}
                        onChange={(e) => setFormData({ ...formData, is_available: e.target.checked })}
                        className="accent-primary-green w-4 h-4"
                      />
                      <div>
                        <span className="font-bold text-forest block">
                          Make Available Online immediately
                        </span>
                        <span className="text-[11px] text-emerald-800">
                          Customers can view, customize, and order this item right away.
                        </span>
                      </div>
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
                      <span>
                        {submitting
                          ? 'Saving...'
                          : editingProduct
                          ? 'Save Product Changes'
                          : 'Publish to Menu'}
                      </span>
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
                  <span className="text-xs font-bold text-muted-gray uppercase">
                    Customer Storefront Preview
                  </span>
                  <button
                    onClick={() => setPreviewProduct(null)}
                    className="p-1 text-muted-gray hover:text-charcoal"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

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
                      <div className="w-full h-full flex items-center justify-center text-4xl">
                        🍕
                      </div>
                    )}
                    {previewProduct.is_bestseller && (
                      <span className="absolute top-2.5 left-2.5 bg-amber-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-xs">
                        BESTSELLER
                      </span>
                    )}
                  </div>

                  <div className="p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-sm text-forest font-serif">
                        {previewProduct.name}
                      </h3>
                      <span
                        className={`w-2.5 h-2.5 rounded-full ${
                          previewProduct.is_veg ? 'bg-emerald-600' : 'bg-red-600'
                        }`}
                      />
                    </div>
                    <p className="text-xs text-muted-gray line-clamp-2">
                      {previewProduct.description}
                    </p>
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
        </>
      )}
    </div>
  );
}
