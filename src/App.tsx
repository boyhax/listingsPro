/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, SlidersHorizontal, Plus, Briefcase, User, 
  MapPin, Check, PlusCircle, LayoutDashboard, Store, Sparkles, LogIn, Globe,
  Calendar, Repeat, Tag, Layers, Shield, X
} from 'lucide-react';
import { Listing, ListingCategory, ListingActionType } from './types';
import { ListingCard } from './components/ListingCard';
import { ListingDetail } from './components/ListingDetail';
import { CreateListingModal } from './components/CreateListingModal';
import { DashboardView } from './components/DashboardView';
import { AdminView } from './components/AdminView';
import { useLocalization } from './localization';

export default function App() {
  const { language, setLanguage, t, detectedLocale } = useLocalization();

  const [viewMode, setViewMode] = useState<'listings' | 'dashboard' | 'admin'>('listings');
  const [listings, setListings] = useState<Listing[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Categorical filters
  const [activeCategory, setActiveCategory] = useState<ListingCategory | 'all'>('all');
  const [activeAction, setActiveAction] = useState<ListingActionType | 'all'>('all');

  // Modal open states
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [selectedListingInitialTab, setSelectedListingInitialTab] = useState<'booking' | 'chat'>('booking');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showApprovalNotice, setShowApprovalNotice] = useState(false);

  // User state switchable via login simulation drawer
  const [currentUserEmail, setCurrentUserEmail] = useState<string>("facegoogl@gmail.com");
  const [currentUserRole, setCurrentUserRole] = useState<'admin' | 'user'>('admin');
  const [showLoginModal, setShowLoginModal] = useState<boolean>(false);

  // Sync user role securely from server-side active profiles list
  useEffect(() => {
    const syncRole = async () => {
      try {
        const uRes = await fetch('/api/admin/users');
        if (uRes.ok) {
          const list = await uRes.json();
          const match = list.find((u: any) => u.email.toLowerCase() === currentUserEmail.toLowerCase());
          if (match) {
            setCurrentUserRole(match.role);
          } else {
            setCurrentUserRole(currentUserEmail.toLowerCase() === 'facegoogl@gmail.com' ? 'admin' : 'user');
          }
        }
      } catch (e) {
        setCurrentUserRole(currentUserEmail.toLowerCase() === 'facegoogl@gmail.com' ? 'admin' : 'user');
      }
    };
    syncRole();
  }, [currentUserEmail]);

  useEffect(() => {
    fetchListings();
  }, [activeCategory, activeAction, searchQuery]);

  // Record user search history for marketing automated matches
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.trim().length <= 2) return;
    const timer = setTimeout(() => {
      fetch("/api/track-search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: currentUserEmail,
          query: searchQuery.trim(),
          category: activeCategory
        })
      }).catch(err => console.error("Search tracking error:", err));
    }, 1500); // 1.5 seconds debounce idle window
    return () => clearTimeout(timer);
  }, [searchQuery, currentUserEmail, activeCategory]);

  const fetchListings = async () => {
    setIsLoading(true);
    try {
      const parts = [];
      if (activeCategory !== 'all') parts.push(`category=${activeCategory}`);
      if (activeAction !== 'all') parts.push(`actionType=${activeAction}`);
      if (searchQuery.trim()) parts.push(`search=${encodeURIComponent(searchQuery)}`);
      
      const queryStr = parts.length > 0 ? `?${parts.join('&')}` : '';
      const res = await fetch(`/api/listings${queryStr}`);
      if (res.ok) {
        const data = await res.json();
        setListings(data);
      }
    } catch (e) {
      console.error("Failed to load listings:", e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenListingChat = (listing: Listing) => {
    // Dynamically transition and launch details drawer mapped on the chatting tab!
    setSelectedListing(listing);
    // Detail component will mount chat interval instantly
    setViewMode('listings');
  };

  return (
    <div id="main-marketplace-app" className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-slate-900 selection:text-white antialiased flex flex-col">
      
      {/* Visual Header / Promotion Banner */}
      <header className="bg-white border-b border-slate-100 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14">
            
            {/* Branding Logo (Icon Only) */}
            <div 
              id="marketplace-branding" 
              onClick={() => { setViewMode('listings'); setActiveCategory('all'); setActiveAction('all'); setSearchQuery(''); }}
              className="flex items-center cursor-pointer group"
              title={t('title')}
            >
              <div className="bg-slate-950 text-white p-2 rounded-xl transition-all group-hover:scale-105">
                <Briefcase className="w-4 h-4" />
              </div>
            </div>

            {/* Compact Navigation containing user & explore icon buttons */}
            <nav id="header-user-component" className="flex items-center gap-1.5 sm:gap-2">
              
              {/* Detect Location Badge (Discreet description of neighborhood) */}
              {detectedLocale.city && (
                <div className="hidden md:flex items-center gap-1 px-2 py-1 bg-slate-50 border border-slate-150 text-slate-500 rounded-lg text-[10px] font-sans">
                  <MapPin className="w-2.5 h-2.5 text-slate-400" />
                  <span className="max-w-[120px] truncate">{detectedLocale.city}, {detectedLocale.country}</span>
                </div>
              )}

              {/* Language Switcher Icon Button */}
              <button
                id="toggle-language"
                onClick={() => setLanguage(language === 'en' ? 'ar' : 'en')}
                className="p-1.5 sm:p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-50 border border-transparent hover:border-slate-100 rounded-xl cursor-pointer transition-all flex items-center justify-center gap-1"
                title={language === 'en' ? 'العربية' : 'English'}
              >
                <Globe className="w-4 h-4 text-amber-600" />
                <span className="text-[10px] font-bold hidden md:inline">{language === 'en' ? 'العربية' : 'English'}</span>
              </button>

              {/* Publish/Add Service Icon Button */}
              <button
                id="btn-publish-service"
                onClick={() => setShowCreateModal(true)}
                className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-50 border border-transparent hover:border-slate-100 rounded-xl cursor-pointer transition-colors"
                title={t('publishService')}
              >
                <Plus className="w-4 h-4" />
              </button>

              {/* Explore/Store Icon Button */}
              <button
                id="tab-explore"
                onClick={() => setViewMode('listings')}
                className={`p-2 rounded-xl transition-all cursor-pointer border ${
                  viewMode === 'listings' 
                    ? 'bg-slate-900 border-slate-900 text-white shadow-sm' 
                    : 'bg-transparent border-transparent text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                }`}
                title={t('explore')}
              >
                <Store className="w-4 h-4" />
              </button>

              {/* User Account / Dashboard Icon Button */}
              <button
                id="tab-dashboard"
                onClick={() => setViewMode('dashboard')}
                className={`p-2 rounded-xl transition-all relative cursor-pointer border ${
                  viewMode === 'dashboard' 
                    ? 'bg-slate-900 border-slate-900 text-white shadow-sm' 
                    : 'bg-transparent border-transparent text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                }`}
                title={t('myHub')}
              >
                <User className="w-4 h-4" />
                {/* Secure Active account indicator green dot */}
                <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-emerald-500 rounded-full border border-white" />
              </button>

              {/* Simulated authentication account selector */}
              <button
                id="btn-login-simulator"
                onClick={() => setShowLoginModal(true)}
                className="px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white text-slate-705 text-[10.5px] font-extrabold cursor-pointer hover:bg-slate-50 transition-all flex items-center gap-1.5 shrink-0"
                title="Simulate User Log-In / Switch profile"
              >
                <LogIn className="w-3.5 h-3.5 text-slate-450" />
                <span className="hidden lg:inline">{currentUserEmail.split('@')[0]}</span>
                <span className={`px-1 py-0.2 rounded text-[8.5px] font-black uppercase ${
                  currentUserRole === 'admin' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-500'
                }`}>
                  {currentUserRole}
                </span>
              </button>

            </nav>

          </div>
        </div>
      </header>

      {/* Main Core Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {showApprovalNotice && (
          <div className="mb-6 p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-semibold flex items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                {language === 'ar' 
                  ? 'تم تسجيل إعلانك بنجاح! تم حفظ الإعلان بوضعية "معلق الموافقة" للمراجعة ولن يظهر للعامة حتى يوافق عليه المشرف.' 
                  : 'Listing submitted successfully! Note that newly created listings are marked "Pending Approval" and will only appear publicly once verified by an administrator.'}
              </span>
            </div>
            <button 
              onClick={() => setShowApprovalNotice(false)}
              className="text-[10px] font-black uppercase text-amber-700 hover:text-amber-950 cursor-pointer"
            >
              [ {language === 'ar' ? 'إغلاق' : 'Close'} ]
            </button>
          </div>
        )}

        {viewMode === 'listings' ? (
          <div id="explore-view-section" className="space-y-6">
            
            {/* Exploration Hero & Dynamic filters search widget */}
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.02)] space-y-4">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <h2 className="text-xl font-bold text-slate-900 tracking-tight">{t('discoverTitle')}</h2>
                  <p className="text-xs text-slate-500 mt-0.5">{t('discoverSub')}</p>
                </div>
                
                {/* Search Bar Input */}
                <div className="relative w-full md:w-80">
                  <Search className={`absolute ${language === 'ar' ? 'right-3.5' : 'left-3.5'} top-3 w-4 h-4 text-slate-400 pointer-events-none`} />
                  <input
                    id="global-search-inp"
                    type="text"
                    placeholder={t('placeholderSearch')}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className={`w-full ${language === 'ar' ? 'pr-10 pl-4' : 'pl-10 pr-4'} py-2 text-xs bg-slate-50 rounded-xl border border-slate-200 placeholder-slate-405 font-medium focus:outline-none focus:border-slate-400 focus:bg-white transition-all shadow-inner`}
                  />
                </div>
              </div>

              {/* High-level Categorical Filter Selector (HivePress style) */}
              <div className="pt-2 border-t border-slate-50 space-y-3">
                <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                  <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider shrink-0">{t('categoryFilter')}</span>
                  <div className="flex flex-wrap gap-2">
                    <button
                      id="filter-category-all"
                      onClick={() => setActiveCategory('all')}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                        activeCategory === 'all' 
                          ? 'bg-slate-900 text-white' 
                          : 'bg-slate-50 text-slate-650 hover:bg-slate-100'
                      }`}
                    >
                      {t('allServices')}
                    </button>
                    <button
                      id="filter-category-cars"
                      onClick={() => setActiveCategory('cars')}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                        activeCategory === 'cars' 
                          ? 'bg-slate-900 text-white' 
                          : 'bg-slate-50 text-slate-650 hover:bg-slate-100'
                      }`}
                    >
                      {t('catCars')}
                    </button>
                    <button
                      id="filter-category-properties"
                      onClick={() => setActiveCategory('real-estate')}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                        activeCategory === 'real-estate' 
                          ? 'bg-slate-900 text-white' 
                          : 'bg-slate-50 text-slate-650 hover:bg-slate-100'
                      }`}
                    >
                      {t('catProperties')}
                    </button>
                    <button
                      id="filter-category-products"
                      onClick={() => setActiveCategory('products')}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                        activeCategory === 'products' 
                          ? 'bg-slate-900 text-white' 
                          : 'bg-slate-50 text-slate-650 hover:bg-slate-100'
                      }`}
                    >
                      {t('catGoods')}
                    </button>
                    <button
                      id="filter-category-services"
                      onClick={() => setActiveCategory('services')}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                        activeCategory === 'services' 
                          ? 'bg-slate-900 text-white' 
                          : 'bg-slate-50 text-slate-650 hover:bg-slate-100'
                      }`}
                    >
                      {t('catAppointments')}
                    </button>
                  </div>
                </div>

                {/* Listing Action Type Filters */}
                <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center pt-2 border-t border-slate-50">
                  <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider shrink-0">{t('actionModel')}</span>
                  <div className="flex flex-wrap gap-2">
                    
                    {/* All Actions */}
                    <button
                      id="filter-action-all"
                      onClick={() => setActiveAction('all')}
                      className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer border ${
                        activeAction === 'all' 
                          ? 'bg-slate-900 border-slate-900 text-white shadow-sm' 
                          : 'bg-white border-slate-200 text-slate-650 hover:bg-slate-50'
                      }`}
                    >
                      <Layers className={`w-3.5 h-3.5 ${activeAction === 'all' ? 'text-amber-400' : 'text-slate-400'}`} />
                      <span>{t('allActions').replace(/^✓\s*/, '')}</span>
                    </button>

                    {/* Book Appointment */}
                    <button
                      id="filter-action-booking"
                      onClick={() => setActiveAction('booking')}
                      className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer border ${
                        activeAction === 'booking' 
                          ? 'bg-emerald-600 border-emerald-600 text-white shadow-sm' 
                          : 'bg-white border-slate-200 text-slate-650 hover:bg-emerald-50 hover:border-emerald-250 hover:text-emerald-700'
                      }`}
                    >
                      <Calendar className={`w-3.5 h-3.5 ${activeAction === 'booking' ? 'text-white' : 'text-emerald-500'}`} />
                      <span>{t('actionBook').replace(/^✓\s*/, '')}</span>
                    </button>

                    {/* Renting */}
                    <button
                      id="filter-action-renting"
                      onClick={() => setActiveAction('renting')}
                      className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer border ${
                        activeAction === 'renting' 
                          ? 'bg-blue-600 border-blue-600 text-white shadow-sm' 
                          : 'bg-white border-slate-200 text-slate-650 hover:bg-blue-50 hover:border-blue-250 hover:text-blue-700'
                      }`}
                    >
                      <Repeat className={`w-3.5 h-3.5 ${activeAction === 'renting' ? 'text-white' : 'text-blue-500'}`} />
                      <span>{t('actionRent').replace(/^✓\s*/, '')}</span>
                    </button>

                    {/* Buying */}
                    <button
                      id="filter-action-buying"
                      onClick={() => setActiveAction('buying')}
                      className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer border ${
                        activeAction === 'buying' 
                          ? 'bg-amber-600 border-amber-600 text-white shadow-sm' 
                          : 'bg-white border-slate-200 text-slate-650 hover:bg-amber-50 hover:border-amber-250 hover:text-amber-700'
                      }`}
                    >
                      <Tag className={`w-3.5 h-3.5 ${activeAction === 'buying' ? 'text-white' : 'text-amber-500'}`} />
                      <span>{t('actionBuy').replace(/^✓\s*/, '')}</span>
                    </button>

                  </div>
                </div>
              </div>
            </div>

            {/* Active listings listings grid */}
            {isLoading ? (
              <div className="text-center py-20 uppercase font-extrabold text-xs text-slate-400 tracking-widest animate-pulse">
                {language === 'ar' ? 'جاري تحميل مصفوفة الخدمات الآمنة...' : 'Fetching secure service grid catalog...'}
              </div>
            ) : listings.length === 0 ? (
              <div className="text-center py-16 bg-white border border-slate-100 rounded-3xl space-y-3">
                <p className="text-sm font-bold text-slate-500">{t('noMatches')}</p>
                <p className="text-xs text-slate-400">{t('noMatchesTips')}</p>
                <button
                  id="cta-publish-no-matches"
                  onClick={() => setShowCreateModal(true)}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl cursor-pointer"
                >
                  {t('btnPublishItem')}
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {listings.map((l, index) => (
                  <motion.div
                    key={l.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.04 }}
                  >
                    <ListingCard
                      listing={l}
                      onClick={() => {
                        setSelectedListing(l);
                      }}
                    />
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        ) : viewMode === 'admin' ? (
          <AdminView
            currentUserEmail={currentUserEmail}
            onExit={() => setViewMode('listings')}
          />
        ) : (
          /* Dashboard Workspace Component */
          <DashboardView
            currentUserEmail={currentUserEmail}
            allListings={listings}
            onOpenListingChat={handleOpenListingChat}
            currentUserRole={currentUserRole}
            onNavigateToAdmin={() => setViewMode('admin')}
          />
        )}

      </main>

      {/* Floating Action Button for easy creation access */}
      <button
        id="fab-publish-action"
        onClick={() => setShowCreateModal(true)}
        className={`fixed bottom-6 ${language === 'ar' ? 'left-6' : 'right-6'} p-4 bg-slate-950 text-white rounded-full shadow-xl hover:bg-slate-850 hover:scale-105 transition-all text-sm font-bold flex items-center gap-2 cursor-pointer group z-40`}
      >
        <span className="w-2.5 h-2.5 bg-emerald-400 rounded-full animate-bounce" />
        {t('deployService')}
      </button>

      {/* Overlays / Modal layers */}
      < AnimatePresence >
        
        {/* Modal 1: Details Drawer overlay */}
        {selectedListing && (
          <ListingDetail
            listing={selectedListing}
            currentUserEmail={currentUserEmail}
            onClose={() => setSelectedListing(null)}
            onBookingSuccess={() => {
              // Refresh root state listing items on booking success
              fetchListings();
            }}
          />
        )}

        {/* Modal 2: Create Listing Modal wizard */}
        {showCreateModal && (
          <CreateListingModal
            currentUserEmail={currentUserEmail}
            onClose={() => setShowCreateModal(false)}
            onSuccess={() => {
              setShowCreateModal(false);
              fetchListings(); // Refetch lists to display published item!
              setViewMode('listings'); // Toggle back to directory to show off item
              setShowApprovalNotice(true); // Trigger pending notice
            }}
          />
        )}

        {/* Modal 3: Simulated Sign-In Profile Switcher */}
        {showLoginModal && (
          <motion.div
            id="simulation-login-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/55 backdrop-blur-xs z-50 flex items-center justify-center p-4 inline-flex"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              className="bg-white rounded-3xl max-w-sm w-full border border-slate-100 shadow-2xl p-6 relative space-y-5 text-left"
            >
              {/* Close Button Button */}
              <button
                onClick={() => setShowLoginModal(false)}
                className="absolute top-4 right-4 p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="space-y-1">
                <h3 className="text-base font-black text-slate-905 tracking-tight flex items-center gap-2">
                  <LogIn className="w-4 h-4 text-emerald-600" />
                  <span>{language === 'ar' ? 'تبديل الحساب والمحاكاة' : 'Simulated Session Login'}</span>
                </h3>
                <p className="text-xs text-slate-400 font-medium leading-relaxed">
                  {language === 'ar' 
                    ? 'اختر أحد المعرفات التجريبية أو أدخل بريداً مخصصاً لتبديل الصلاحيات الإدارية والمستندات.' 
                    : 'Switch active session credentials instantly to test the role restricted views & admin panel.'}
                </p>
              </div>

              {/* Quick Choice Profiles list */}
              <div className="space-y-2.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
                  {language === 'ar' ? 'حسابات المحاكاة الافتراضية' : 'Preset Simulated Profiles'}
                </span>
                
                <div className="grid grid-cols-1 gap-2">
                  <button
                    onClick={() => {
                      setCurrentUserEmail("facegoogl@gmail.com");
                      setShowLoginModal(false);
                    }}
                    className={`p-3 rounded-xl border text-left cursor-pointer transition-all flex items-center justify-between ${
                      currentUserEmail === "facegoogl@gmail.com"
                        ? 'bg-slate-50 border-slate-900 text-slate-900'
                        : 'bg-white hover:bg-slate-50 border-slate-150 text-slate-705'
                    }`}
                  >
                    <div>
                      <span className="font-extrabold text-xs block">facegoogl@gmail.com</span>
                      <span className="text-[10px] text-emerald-600 font-bold">Admin role (Primary Host)</span>
                    </div>
                    {currentUserEmail === "facegoogl@gmail.com" && <Check className="w-4 h-4 text-emerald-600" />}
                  </button>

                  <button
                    onClick={() => {
                      setCurrentUserEmail("owner-anna@earth.com");
                      setShowLoginModal(false);
                    }}
                    className={`p-3 rounded-xl border text-left cursor-pointer transition-all flex items-center justify-between ${
                      currentUserEmail === "owner-anna@earth.com"
                        ? 'bg-slate-50 border-slate-900 text-slate-900'
                        : 'bg-white hover:bg-slate-50 border-slate-150 text-slate-705'
                    }`}
                  >
                    <div>
                      <span className="font-extrabold text-xs block">owner-anna@earth.com</span>
                      <span className="text-[10px] text-slate-450 font-bold">User role (Standard Merchant)</span>
                    </div>
                    {currentUserEmail === "owner-anna@earth.com" && <Check className="w-4 h-4 text-emerald-605" />}
                  </button>

                  <button
                    onClick={() => {
                      setCurrentUserEmail("buyer-sarah@jenkins.com");
                      setShowLoginModal(false);
                    }}
                    className={`p-3 rounded-xl border text-left cursor-pointer transition-all flex items-center justify-between ${
                      currentUserEmail === "buyer-sarah@jenkins.com"
                        ? 'bg-slate-50 border-slate-900 text-slate-900'
                        : 'bg-white hover:bg-slate-50 border-slate-150 text-slate-705'
                    }`}
                  >
                    <div>
                      <span className="font-extrabold text-xs block">buyer-sarah@jenkins.com</span>
                      <span className="text-[10px] text-slate-450 font-bold">User role (Regular Customer)</span>
                    </div>
                    {currentUserEmail === "buyer-sarah@jenkins.com" && <Check className="w-4 h-4 text-emerald-605" />}
                  </button>
                </div>
              </div>

              {/* Direct email input switch switcher */}
              <div className="border-t border-slate-100 pt-4 space-y-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
                  {language === 'ar' ? 'أو تسجيل بريد إلكتروني مخصص' : 'Or Enter Custom Account'}
                </span>
                
                <form 
                  onSubmit={(e) => {
                    e.preventDefault();
                    const formdata = new FormData(e.currentTarget);
                    const emailInput = formdata.get('custom_email') as string;
                    if (emailInput && emailInput.trim()) {
                      setCurrentUserEmail(emailInput.trim().toLowerCase());
                      setShowLoginModal(false);
                    }
                  }}
                  className="flex gap-2"
                >
                  <input
                    type="email"
                    name="custom_email"
                    required
                    placeholder="guest@mail.com"
                    defaultValue={currentUserEmail}
                    className="flex-1 p-2 bg-slate-50 border border-slate-200 text-xs rounded-xl focus:bg-white text-slate-800 font-mono font-bold"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs rounded-xl cursor-pointer"
                  >
                    {language === 'ar' ? 'دخول' : 'Sign In'}
                  </button>
                </form>
              </div>

            </motion.div>
          </motion.div>
        )}

      </AnimatePresence>

      {/* Tidy Footer */}
      <footer className="bg-white border-t border-slate-100 py-6 mt-12 bg-linear-to-b from-white to-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-1.5">
          <p className="text-[11px] font-bold text-slate-800">
            {t('footerDesc')}
          </p>
          <p className="text-[10px] text-slate-400 font-mono">
            {t('footerDetails')}
          </p>
        </div>
      </footer>

    </div>
  );
}
