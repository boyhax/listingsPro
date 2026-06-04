/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  User, Shield, Trash2, Plus, Check, DollarSign, Settings, Layers, 
  AlertTriangle, TrendingUp, UserX, UserCheck, Coins, ArrowUpRight, Percent, RefreshCw, Eye,
  Mail, Send, History, Sparkles
} from 'lucide-react';
import { useLocalization } from '../localization';

interface AdminViewProps {
  currentUserEmail: string;
  onExit: () => void;
}

interface UserAccount {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'user';
  createdAt: string;
  isBlocked: boolean;
}

interface CategoryAttribute {
  key: string;
  label: string;
  type: 'text' | 'number' | 'select' | 'boolean';
  options?: string[];
  required?: boolean;
}

interface Collection {
  id: string;
  key: string;
  title: string;
  description: string;
  attributes?: CategoryAttribute[];
}

interface MarketSettings {
  platformFeePercentage: number;
  escrowProtection: boolean;
  maintenanceMode: boolean;
  systemCurrency: string;
  allowGuestBookings: boolean;
}

interface EarningsStats {
  totalGmv: number;
  totalRevenue: number;
  platformFeePercentage: number;
  activeBookingsCount: number;
  cancelledBookingsCount: number;
  transactionsList: any[];
  bookingsList: any[];
  timelineData: { name: string; sales: number; profit: number; }[];
}

export function AdminView({ currentUserEmail, onExit }: AdminViewProps) {
  const { language } = useLocalization();
  
  // Tab states
  const [activeTab, setActiveTab] = useState<'users' | 'listings' | 'collections' | 'settings' | 'earnings' | 'mailing'>('users');
  
  // Data lists loaded securely from server
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [listings, setListings] = useState<any[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [settings, setSettings] = useState<MarketSettings | null>(null);
  const [earnings, setEarnings] = useState<EarningsStats | null>(null);

  // Mailing and automated newsletter campaigns states
  const [mailHistory, setMailHistory] = useState<any[]>([]);
  const [searchLog, setSearchLog] = useState<any[]>([]);
  
  // Mailing Campaign Form
  const [campaignName, setCampaignName] = useState('Premium Weekly Deals');
  const [mailSubject, setMailSubject] = useState('New handpicked matches in your region');
  const [mailBodyInput, setMailBodyInput] = useState('Dear customer,\n\nWe would love to introduce our latest collection of premium certified electric sports cars, penthouses, and oral health services to you!\n\nVisit our catalog listing to reserve your custom view today.\n\nWarmly,\nPlatform Editorial Team');
  const [targetRecipient, setTargetRecipient] = useState('all');
  const [generateWithAI, setGenerateWithAI] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('Write an inspiring marketing update about verified luxury penthouses and sports cars available on our premium directory.');
  const [isSendingMail, setIsSendingMail] = useState(false);
  
  // Busy / Status feedback
  const [isLoading, setIsLoading] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Sub-forms states
  // Add new user form
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserName, setNewUserName] = useState('');
  const [newUserRole, setNewUserRole] = useState<'admin' | 'user'>('user');
  
  // Add new collection form
  const [newColKey, setNewColKey] = useState('');
  const [newColTitle, setNewColTitle] = useState('');
  const [newColDesc, setNewColDesc] = useState('');

  // Category attributes state managers
  const [selectedColKey, setSelectedColKey] = useState<string | null>(null);
  const [editingAttrKey, setEditingAttrKey] = useState<string | null>(null);
  const [attrKey, setAttrKey] = useState('');
  const [attrLabel, setAttrLabel] = useState('');
  const [attrType, setAttrType] = useState<'text' | 'number' | 'select' | 'boolean'>('text');
  const [attrOptions, setAttrOptions] = useState('');
  const [attrRequired, setAttrRequired] = useState(false);

  useEffect(() => {
    loadAllAdminData();
  }, [activeTab]);

  const loadAllAdminData = async () => {
    setIsLoading(true);
    setErrorMsg('');
    setFeedbackMsg('');
    try {
      // 1. Always load data relevant to current tab for high efficiency
      if (activeTab === 'users') {
        const uRes = await fetch('/api/admin/users');
        if (uRes.ok) setUsers(await uRes.json());
      } else if (activeTab === 'listings') {
        const lRes = await fetch('/api/listings?includePending=true');
        if (lRes.ok) setListings(await lRes.json());
        const eRes = await fetch('/api/admin/earnings');
        if (eRes.ok) setEarnings(await eRes.json());
      } else if (activeTab === 'collections') {
        const cRes = await fetch('/api/admin/collections');
        if (cRes.ok) setCollections(await cRes.json());
      } else if (activeTab === 'settings') {
        const sRes = await fetch('/api/admin/settings');
        if (sRes.ok) setSettings(await sRes.json());
      } else if (activeTab === 'earnings') {
        const eRes = await fetch('/api/admin/earnings');
        if (eRes.ok) setEarnings(await eRes.json());
      } else if (activeTab === 'mailing') {
        // Fetch emails list
        const mRes = await fetch('/api/admin/emails');
        if (mRes.ok) setMailHistory(await mRes.json());
        // Fetch search history records
        const shRes = await fetch('/api/admin/search-history');
        if (shRes.ok) setSearchLog(await shRes.json());
        // Load users registry to show options for targeted campaign recipients
        const uRes = await fetch('/api/admin/users');
        if (uRes.ok) setUsers(await uRes.json());
      }
    } catch (e) {
      setErrorMsg('Connectivity issue fetching administrative data records.');
    } finally {
      setIsLoading(false);
    }
  };

  // --- Users Operations ---
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setFeedbackMsg('');
    if (!newUserEmail.trim() || !newUserName.trim()) return;

    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: newUserEmail.trim(), name: newUserName.trim(), role: newUserRole })
      });
      if (res.ok) {
        setFeedbackMsg(language === 'ar' ? 'تم إنشاء الحساب بنجاح!' : 'User account generated successfully!');
        setNewUserEmail('');
        setNewUserName('');
        loadAllAdminData();
      } else {
        const err = await res.json();
        setErrorMsg(err.error || 'Failed to create user account.');
      }
    } catch (err) {
      setErrorMsg('Fail safe check activated.');
    }
  };

  const handleToggleBlock = async (email: string, currentStatus: boolean) => {
    setErrorMsg('');
    setFeedbackMsg('');
    try {
      const res = await fetch(`/api/admin/users/${encodeURIComponent(email)}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isBlockedChange: !currentStatus })
      });
      if (res.ok) {
        setFeedbackMsg(language === 'ar' ? 'تم تحديث حالة الحظر بنجاح.' : 'User lock status updated.');
        loadAllAdminData();
      }
    } catch (err) {
      setErrorMsg('Error triggering backend block transaction.');
    }
  };

  const handleChangeRole = async (email: string, targetRole: 'admin' | 'user') => {
    setErrorMsg('');
    setFeedbackMsg('');
    try {
      const res = await fetch(`/api/admin/users/${encodeURIComponent(email)}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: targetRole })
      });
      if (res.ok) {
        setFeedbackMsg(language === 'ar' ? 'تم تغيير صلاحية العضوية.' : 'User role security level configured.');
        loadAllAdminData();
      }
    } catch (err) {
      setErrorMsg('Error writing database role updates.');
    }
  };

  const handleDeleteUser = async (email: string) => {
    if (email === currentUserEmail) {
      setErrorMsg(language === 'ar' ? 'غير مسموح بحذف حسابك الإداري الحالي!' : 'Self-deletion of active administrator is rejected!');
      return;
    }
    if (!confirm(language === 'ar' ? `هل أنت متأكد من حذف الحساب ${email}؟` : `Are you sure you want to completely remove user ${email}?`)) return;

    setErrorMsg('');
    setFeedbackMsg('');
    try {
      const res = await fetch(`/api/admin/users/${encodeURIComponent(email)}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        setFeedbackMsg(language === 'ar' ? 'تم إزالة الحساب نهائياً.' : 'User permanently erased.');
        loadAllAdminData();
      }
    } catch (err) {
      setErrorMsg('Database query failure during deletion.');
    }
  };

  // --- Listings Operations ---
  const handleApproveListing = async (id: string, name: string) => {
    setErrorMsg('');
    setFeedbackMsg('');
    try {
      const res = await fetch(`/api/admin/listings/${id}/approve`, {
        method: 'PUT'
      });
      if (res.ok) {
        setFeedbackMsg(language === 'ar' ? `تمت الموافقة على الإعلان "${name}" بنجاح.` : `Listing "${name}" approved successfully.`);
        loadAllAdminData();
      } else {
        setErrorMsg('Failed to approve listing.');
      }
    } catch (err) {
      setErrorMsg('Error invoking approve on core collection.');
    }
  };

  const handleDeleteListing = async (id: string, name: string) => {
    if (!confirm(language === 'ar' ? `هل أنت متأكد من إزالة الإعلان "${name}" نهائياً من الدليل؟` : `Are you sure you want to permanently remove "${name}" from directory?`)) return;

    setErrorMsg('');
    setFeedbackMsg('');
    try {
      const res = await fetch(`/api/admin/listings/${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        setFeedbackMsg(language === 'ar' ? 'تم حذف الإعلان بنجاح ' : 'Marketplace listing successfully cataloged for cleanup.');
        loadAllAdminData();
      }
    } catch (err) {
      setErrorMsg('Error invoking delete on core collection.');
    }
  };

  // --- Collections Operations ---
  const handleCreateCollection = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setFeedbackMsg('');
    if (!newColKey.trim() || !newColTitle.trim()) return;

    try {
      const res = await fetch('/api/admin/collections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: newColKey.trim(), title: newColTitle.trim(), description: newColDesc.trim() })
      });
      if (res.ok) {
        setFeedbackMsg(language === 'ar' ? 'تم إضافة الفئة الحيوية الجديدة.' : 'Custom folder dynamic collection inserted.');
        setNewColKey('');
        setNewColTitle('');
        setNewColDesc('');
        loadAllAdminData();
      } else {
        const err = await res.json();
        setErrorMsg(err.error || 'Failed to append collection catalog key.');
      }
    } catch (err) {
      setErrorMsg('Error inserting dynamic document directory.');
    }
  };

  // Save or edit a category attribute
  const handleSaveCategoryAttribute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedColKey) return;
    setErrorMsg('');
    setFeedbackMsg('');

    const currentCollection = collections.find(c => c.key === selectedColKey);
    if (!currentCollection) return;

    if (!attrKey.trim() || !attrLabel.trim()) {
      setErrorMsg(language === 'ar' ? 'يرجى ملء المفتاح والاسم!' : 'Please enter attribute key and label!');
      return;
    }

    const cleanKey = attrKey.trim().toLowerCase();
    const cleanLabel = attrLabel.trim();
    const optionsArray = attrType === 'select'
      ? attrOptions.split(',').map(s => s.trim()).filter(Boolean)
      : undefined;

    const newAttribute: CategoryAttribute = {
      key: cleanKey,
      label: cleanLabel,
      type: attrType,
      options: optionsArray,
      required: attrRequired
    };

    let attributesList = [...(currentCollection.attributes || [])];

    if (editingAttrKey) {
      // Editing Mode
      attributesList = attributesList.map(a => a.key === editingAttrKey ? newAttribute : a);
    } else {
      // Add Mode
      if (attributesList.some(a => a.key === cleanKey)) {
        setErrorMsg(language === 'ar' ? 'هذه الخاصية موجودة بالفعل!' : 'An attribute with this key already exists!');
        return;
      }
      attributesList.push(newAttribute);
    }

    try {
      const res = await fetch(`/api/admin/collections/${selectedColKey}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ attributes: attributesList })
      });
      if (res.ok) {
        setFeedbackMsg(language === 'ar' ? 'تم حفظ المواصفات بنجاح!' : 'Attributes updated successfully!');
        setEditingAttrKey(null);
        setAttrKey('');
        setAttrLabel('');
        setAttrType('text');
        setAttrOptions('');
        setAttrRequired(false);
        
        // Reload categories list to refresh UI
        const cRes = await fetch('/api/admin/collections');
        if (cRes.ok) setCollections(await cRes.json());
      } else {
        const err = await res.json();
        setErrorMsg(err.error || 'Failed to update category attributes.');
      }
    } catch (err) {
      setErrorMsg('Error sending attribute updates.');
    }
  };

  // Delete a category attribute
  const handleDeleteCategoryAttribute = async (attributeKeyToDelete: string) => {
    if (!selectedColKey) return;
    const currentCollection = collections.find(c => c.key === selectedColKey);
    if (!currentCollection) return;

    if (!confirm(language === 'ar' ? `هل أنت متأكد من حذف هذه الخاصية؟` : `Are you sure you want to remove this attribute?`)) return;

    setErrorMsg('');
    setFeedbackMsg('');

    const attributesList = (currentCollection.attributes || []).filter(a => a.key !== attributeKeyToDelete);

    try {
      const res = await fetch(`/api/admin/collections/${selectedColKey}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ attributes: attributesList })
      });
      if (res.ok) {
        setFeedbackMsg(language === 'ar' ? 'تم حذف الخاصية بنجاح' : 'Attribute removed successfully.');
        
        // Reload categories
        const cRes = await fetch('/api/admin/collections');
        if (cRes.ok) setCollections(await cRes.json());
      } else {
        const err = await res.json();
        setErrorMsg(err.error || 'Failed to delete attribute.');
      }
    } catch (err) {
      setErrorMsg('Error processing attribute deletion.');
    }
  };

  const startEditAttribute = (attr: CategoryAttribute) => {
    setEditingAttrKey(attr.key);
    setAttrKey(attr.key);
    setAttrLabel(attr.label);
    setAttrType(attr.type);
    setAttrOptions(attr.options ? attr.options.join(', ') : '');
    setAttrRequired(!!attr.required);
  };

  const cancelEditAttribute = () => {
    setEditingAttrKey(null);
    setAttrKey('');
    setAttrLabel('');
    setAttrType('text');
    setAttrOptions('');
    setAttrRequired(false);
  };

  // --- Settings Operation ---
  const handleUpdateSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;
    setErrorMsg('');
    setFeedbackMsg('');

    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });
      if (res.ok) {
        setFeedbackMsg(language === 'ar' ? 'تم حفظ التعديلات وتطبيقها بنجاح!' : 'Secure marketplace configurations synchronised on disk!');
        setSettings(await res.json());
      }
    } catch (err) {
      setErrorMsg('Failed writing server-side configs.');
    }
  };

  // --- Mailing & Contact Feature Operations ---
  const handleSendCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSendingMail(true);
    setErrorMsg('');
    setFeedbackMsg('');

    try {
      const res = await fetch('/api/admin/send-campaign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campaignName,
          subject: mailSubject,
          bodyInput: mailBodyInput,
          targetRecipient,
          generateWithAI,
          aiPrompt
        })
      });

      if (res.ok) {
        const data = await res.json();
        setFeedbackMsg(language === 'ar'
          ? `تم إرسال الحملة الإعلانية بنجاح لـ ${data.count} مستخدم! ${data.isAiGenerated ? 'تم الإنشاء بذكاء عبر جمناي' : ''}`
          : `Campaign dispatches complete for ${data.count} recipient(s)! ${data.isAiGenerated ? 'Generative smart draft was successfully injected.' : ''}`
        );
        // Refresh local outbox lists
        const mRes = await fetch('/api/admin/emails');
        if (mRes.ok) setMailHistory(await mRes.json());
      } else {
        const err = await res.json();
        setErrorMsg(err.error || 'Failed to dispatch mailing campaigns.');
      }
    } catch (err) {
      setErrorMsg('Mailing trigger server failure.');
    } finally {
      setIsSendingMail(false);
    }
  };

  const handleTriggerAutoEmails = async () => {
    setIsSendingMail(true);
    setErrorMsg('');
    setFeedbackMsg('');

    try {
      const res = await fetch('/api/admin/trigger-auto-emails', {
        method: 'POST'
      });

      if (res.ok) {
        const data = await res.json();
        setFeedbackMsg(language === 'ar'
          ? `مسح تلقائي مكتمل للتحليلات! تم إرسال ${data.count} رسالة مطابقة وتوصية ذكية بناءً على سجلات البحث.`
          : `Search matched scanning completed successfully! Automated matching generated and sent ${data.count} recommendation(s).`
        );
        // Refresh local outbox lists
        const mRes = await fetch('/api/admin/emails');
        if (mRes.ok) setMailHistory(await mRes.json());
      } else {
        const err = await res.json();
        setErrorMsg(err.error || 'Failed to process automated search matches.');
      }
    } catch (err) {
      setErrorMsg('Auto-matching crawler offline request failure.');
    } finally {
      setIsSendingMail(false);
    }
  };

  return (
    <div id="admin-analytics-view" className="space-y-6">
      
      {/* Admin Title Banner */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 relative overflow-hidden border border-slate-800 shadow-xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl -mr-16 -mt-16" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-amber-500/10 rounded-full blur-2xl -ml-16 -mb-16" />
        
        <div className="relative flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 bg-emerald-600 text-white rounded font-mono font-bold text-[9px] uppercase tracking-wider">
                {language === 'ar' ? 'مرخص كمسؤول' : 'Level: Super Administrator'}
              </span>
              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping" />
            </div>
            <h1 className="text-2xl font-black tracking-tight font-sans">
              {language === 'ar' ? 'لوحة التحكم الإدارية الأمنة' : 'Secure Marketplace Admin Console'}
            </h1>
            <p className="text-xs text-slate-350 font-medium">
              {language === 'ar' 
                ? `مشرف النظام النشط: ${currentUserEmail} • السيطرة على المعاملات والسجلات بأمان` 
                : `Signed in as ${currentUserEmail} • Server-isolated monitoring & compliance console`}
            </p>
          </div>

          <button
            id="admin-exit-btn"
            onClick={onExit}
            className="px-4 py-2 bg-white/10 hover:bg-white/15 border border-white/20 hover:border-white/30 rounded-xl text-white text-xs font-bold font-sans cursor-pointer transition-all shrink-0"
          >
            {language === 'ar' ? '← العودة للمتجر' : '← Exit to Marketplace'}
          </button>
        </div>
      </div>

      {/* Admin Tabs Buttons Row */}
      <div className="bg-white p-3 rounded-2xl border border-slate-100 shadow-xs flex flex-wrap gap-2 items-center justify-between">
        <div className="flex flex-wrap gap-1.5" id="admin-layout-buttons-panel">
          <button
            id="admin-tab-users"
            onClick={() => setActiveTab('users')}
            className={`px-3 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'users' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>{language === 'ar' ? 'المستخدمين' : 'Users'}</span>
          </button>

          <button
            id="admin-tab-listings"
            onClick={() => setActiveTab('listings')}
            className={`px-3 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'listings' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Coins className="w-3.5 h-3.5" />
            <span>{language === 'ar' ? 'الإعلانات' : 'Listings'}</span>
          </button>

          <button
            id="admin-tab-collections"
            onClick={() => setActiveTab('collections')}
            className={`px-3 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'collections' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>{language === 'ar' ? 'المجموعات بالفئات' : 'Collections'}</span>
          </button>

          <button
            id="admin-tab-settings"
            onClick={() => setActiveTab('settings')}
            className={`px-3 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'settings' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Settings className="w-3.5 h-3.5" />
            <span>{language === 'ar' ? 'إعدادات النظام' : 'Settings'}</span>
          </button>

          <button
            id="admin-tab-earnings"
            onClick={() => setActiveTab('earnings')}
            className={`px-3 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'earnings' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>{language === 'ar' ? 'منصة الأرباح والرسوم' : 'Earnings'}</span>
          </button>

          <button
            id="admin-tab-mailing"
            onClick={() => setActiveTab('mailing')}
            className={`px-3 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'mailing' ? 'bg-slate-900 text-white shadow-sm font-black ring-1 ring-slate-800' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Mail className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
            <span>{language === 'ar' ? 'حملات البريد والاتصال' : 'Mailing & Contact'}</span>
          </button>
        </div>

        {/* Sync Trigger button */}
        <button
          onClick={loadAllAdminData}
          disabled={isLoading}
          className="p-2 text-slate-450 hover:text-slate-700 bg-slate-50 border border-slate-100/80 rounded-xl hover:bg-slate-100 disabled:opacity-50 transition-all shrink-0 cursor-pointer"
          title="Refresh statistics"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Notifications and Alerts Alerts */}
      {feedbackMsg && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-100 text-emerald-800 text-xs font-bold rounded-xl flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
          <span>{feedbackMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-3.5 bg-rose-50 border border-rose-100 text-rose-800 text-xs font-bold rounded-xl flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Core Dynamic Content Workspace */}
      <div className="min-h-[400px]">
        
        {/* Tab 1: Users Directory */}
        {activeTab === 'users' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left form slot: Add user profile */}
            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs space-y-4 h-fit">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">{language === 'ar' ? 'تسجيل مستخدم جديد' : 'Provision User Profile'}</h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {language === 'ar' ? 'قم بإنشاء مستخدم جديد في النظام مع تعيين صلاحياته الإدارية.' : 'Assign directory permission level and login credentials secure.'}
                </p>
              </div>

              <form onSubmit={handleCreateUser} className="space-y-3">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">{language === 'ar' ? 'الاسم بالكامل' : 'Full Name'}</span>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Johan Thorne"
                    value={newUserName}
                    onChange={(e) => setNewUserName(e.target.value)}
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white text-slate-800 font-semibold"
                  />
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">{language === 'ar' ? 'عنوان البريد الإلكتروني' : 'Email Address'}</span>
                  <input
                    type="email"
                    required
                    placeholder="name@example.com"
                    value={newUserEmail}
                    onChange={(e) => setNewUserEmail(e.target.value)}
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white text-slate-700 font-mono font-bold"
                  />
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">{language === 'ar' ? 'صلاحيات الحساب' : 'Account Type & Role'}</span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setNewUserRole('user')}
                      className={`flex-1 py-2 text-xs font-bold rounded-lg border cursor-pointer ${
                        newUserRole === 'user' ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-slate-200'
                      }`}
                    >
                      User
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewUserRole('admin')}
                      className={`flex-1 py-2 text-xs font-bold rounded-lg border cursor-pointer flex items-center justify-center gap-1 ${
                        newUserRole === 'admin' ? 'bg-amber-600 text-white border-amber-600' : 'bg-white text-slate-600 border-slate-200'
                      }`}
                    >
                      <Shield className="w-3 h-3" />
                      <span>Admin</span>
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-slate-950 text-white font-extrabold text-[11px] uppercase tracking-wider rounded-xl hover:bg-slate-900 transition-all cursor-pointer flex items-center justify-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{language === 'ar' ? 'أضف مستخدم جديد' : 'Provision Account'}</span>
                </button>
              </form>
            </div>

            {/* Right main spreadsheet list: Users */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden lg:col-span-2">
              <div className="p-4 border-b border-slate-50 bg-slate-50/50 flex justify-between items-center">
                <span className="text-xs font-black text-slate-500 uppercase tracking-wider">{language === 'ar' ? 'دليل الحسابات المسجلة' : 'Registered Users Registry'}</span>
                <span className="px-2 py-0.5 bg-slate-200 text-slate-700 rounded-full font-mono text-[10px] font-bold">{users.length} item(s)</span>
              </div>

              {isLoading && users.length === 0 ? (
                <div className="p-12 text-center text-xs font-bold text-slate-400 tracking-widest uppercase animate-pulse">
                  Querying database rows...
                </div>
              ) : users.length === 0 ? (
                <div className="p-12 text-center text-xs text-slate-400 font-medium">
                  No accounts stored.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-slate-100/50 border-b border-slate-150 text-[10px] font-bold text-slate-400 uppercase">
                        <th className="p-3">{language === 'ar' ? 'المستخدم' : 'Profile'}</th>
                        <th className="p-3">{language === 'ar' ? 'صلاحية الحساب' : 'Role Security'}</th>
                        <th className="p-3">{language === 'ar' ? 'تاريخ الانضمام' : 'Registered'}</th>
                        <th className="p-3 text-center">{language === 'ar' ? 'التحكم' : 'Operations'}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {users.map((usr) => (
                        <tr 
                          key={usr.email} 
                          className={`hover:bg-slate-50/50 transition-colors ${usr.isBlocked ? 'bg-rose-50/20' : ''}`}
                        >
                          <td className="p-3 max-w-[200px]">
                            <div className="truncate">
                              <span className="font-bold text-slate-850 block">{usr.name}</span>
                              <span className="font-mono text-[11px] text-slate-450 block truncate">{usr.email}</span>
                            </div>
                          </td>
                          <td className="p-3">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-extrabold ${
                              usr.role === 'admin' 
                                ? 'bg-amber-100 text-amber-800 border border-amber-200/50' 
                                : 'bg-slate-100 text-slate-700'
                            }`}>
                              {usr.role === 'admin' && <Shield className="w-2.5 h-2.5 text-amber-600" />}
                              <span>{usr.role.toUpperCase()}</span>
                            </span>
                          </td>
                          <td className="p-3 font-mono text-[11px] text-slate-400">
                            {new Date(usr.createdAt).toLocaleDateString()}
                          </td>
                          <td className="p-3">
                            <div className="flex items-center justify-center gap-1.5">
                              {/* Toggle block/unblock */}
                              <button
                                onClick={() => handleToggleBlock(usr.email, usr.isBlocked)}
                                className={`p-1.5 rounded-lg cursor-pointer ${
                                  usr.isBlocked 
                                    ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200' 
                                    : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
                                }`}
                                title={usr.isBlocked ? 'Unblock Account' : 'Block / Suspend Account'}
                              >
                                {usr.isBlocked ? (
                                  <UserCheck className="w-3.5 h-3.5" />
                                ) : (
                                  <UserX className="w-3.5 h-3.5" />
                                )}
                              </button>

                              {/* Toggle Role admin vs user */}
                              <button
                                onClick={() => handleChangeRole(usr.email, usr.role === 'admin' ? 'user' : 'admin')}
                                className="p-1.5 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-lg border border-slate-200 cursor-pointer text-[10px] font-bold"
                                title="Toggle Role Permission"
                              >
                                {usr.role === 'admin' ? 'Demote' : 'Promote'}
                              </button>

                              {/* Trash Delete user */}
                              <button
                                onClick={() => handleDeleteUser(usr.email)}
                                className="p-1.5 hover:bg-rose-100 text-rose-600 rounded-lg cursor-pointer"
                                title="Delete user"
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
              )}
            </div>
          </div>
        )}

        {/* Tab 2: Listings Oversight */}
        {activeTab === 'listings' && (
          <div className="space-y-6">
            
            {/* Key Listings Statistics & Performance Metrics Section */}
            <div className="bg-slate-900 text-white rounded-3xl p-6 border border-slate-800 shadow-xl space-y-5">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 bg-amber-500/10 text-amber-400 rounded-full font-black text-[9px] uppercase tracking-wider">
                      {language === 'ar' ? 'تحليلات الأداء والإيرادات' : 'Performance Analytics'}
                    </span>
                  </div>
                  <h3 className="text-base font-black tracking-tight flex items-center gap-2 mt-1">
                    <TrendingUp className="w-5 h-5 text-amber-500" />
                    <span>{language === 'ar' ? 'إحصائيات إيرادات وحجوزات الإعلانات' : 'Listing Revenue & Booking Statistics'}</span>
                  </h3>
                  <p className="text-xs text-slate-400 max-w-xl">
                    {language === 'ar' 
                      ? 'مؤشرات أداء مجمعة تقارن حجم المبيعات الحقيقي، ومستويات الاشتراكات الكلية وسجل المعاملات لكل إعلان فردي.' 
                      : 'Aggregated analytics comparing real booking volumes, service gross value, and cumulative platform transactions across verified and pending directory lists.'}
                  </p>
                </div>
                
                {/* Reset/Sync button */}
                <button
                  onClick={loadAllAdminData}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-slate-600 text-slate-300 hover:text-white rounded-xl text-[10px] font-bold cursor-pointer transition-all flex items-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-amber-400" />
                  <span>{language === 'ar' ? 'تحديث البيانات' : 'Refresh Metrics'}</span>
                </button>
              </div>

              {/* Aggregated Bento Summary Deck */}
              {(() => {
                const computed = listings.map(l => {
                  const listingBookings = (earnings?.bookingsList || []).filter((b: any) => b.listingId === l.id);
                  const listingTransactions = (earnings?.transactionsList || []).filter((tx: any) => tx.listingId === l.id);
                  const bookingsCount = listingBookings.length;
                  const revenueGmv = listingBookings
                    .filter((b: any) => b.status === 'confirmed')
                    .reduce((sum: number, b: any) => sum + (b.pricePaid || 0), 0);
                  const txnGmv = listingTransactions
                    .filter((t: any) => t.status === 'success')
                    .reduce((sum: number, t: any) => sum + (t.amount || 0), 0);
                  const totalRevenue = Math.max(revenueGmv, txnGmv);
                  return { ...l, bookingsCount, totalRevenue };
                });

                const totalAllBookings = computed.reduce((sum, item) => sum + item.bookingsCount, 0);
                const totalAllRevenue = computed.reduce((sum, item) => sum + item.totalRevenue, 0);
                const approvedCount = computed.filter(item => item.approvalStatus === 'approved').length;
                const pendingCount = computed.filter(item => item.approvalStatus === 'pending').length;
                
                const topListing = computed.length > 0
                  ? [...computed].sort((a, b) => b.totalRevenue - a.totalRevenue)[0]
                  : null;

                return (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      {/* Stat 1: Managed Database */}
                      <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-800/80 space-y-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">{language === 'ar' ? 'مجموع الكتالوج' : 'Managed Catalog'}</span>
                        <div className="flex items-baseline gap-2">
                          <span className="text-xl font-bold font-mono text-white">{computed.length}</span>
                          <span className="text-[10px] font-semibold text-slate-400">
                            ({approvedCount} OK / {pendingCount} Pending)
                          </span>
                        </div>
                      </div>

                      {/* Stat 2: Total Bookings */}
                      <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-800/80 space-y-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">{language === 'ar' ? 'إجمالي الحجوزات' : 'Aggregated Bookings'}</span>
                        <div className="flex items-baseline gap-2">
                          <span className="text-xl font-bold font-mono text-white">{totalAllBookings}</span>
                          <span className="text-[10px] font-medium text-emerald-400">
                            {totalAllBookings > 0 ? '✓ Orders tracked' : 'No records yet'}
                          </span>
                        </div>
                      </div>

                      {/* Stat 3: Total Gmv Value */}
                      <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-800/80 space-y-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">{language === 'ar' ? 'الناتج المجمع مبيعات' : 'Cumulative Revenue Volume'}</span>
                        <div className="flex items-baseline gap-1">
                          <span className="text-xl font-bold font-mono text-emerald-400">${totalAllRevenue.toLocaleString()}</span>
                          <span className="text-[10px] text-slate-400 font-bold">USD</span>
                        </div>
                      </div>

                      {/* Stat 4: Top Earner */}
                      <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-800/80 space-y-1 truncate">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">{language === 'ar' ? 'العرض الأكثر دخلاً' : 'Star Performer'}</span>
                        {topListing && topListing.totalRevenue > 0 ? (
                          <div className="text-left overflow-hidden text-ellipsis">
                            <span className="text-xs font-black block text-amber-400 truncate" title={topListing.title}>{topListing.title}</span>
                            <span className="text-[10px] font-mono text-slate-300 font-bold">
                              ${topListing.totalRevenue.toLocaleString()} ({topListing.bookingsCount} orders)
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs font-semibold text-slate-500 block">No revenue recorded</span>
                        )}
                      </div>
                    </div>

                    {/* Listing-by-listing Detailed Revenue & Growth Grid */}
                    <div className="bg-slate-800/30 rounded-2xl border border-slate-800/60 overflow-hidden">
                      <div className="p-3 border-b border-slate-800/80 bg-slate-900/40 flex items-center justify-between">
                        <span className="text-[10px] font-extrabold text-slate-300 uppercase tracking-widest flex items-center gap-1.5">
                          <Coins className="w-3.5 h-3.5 text-amber-500" />
                          <span>{language === 'ar' ? 'إحصائيات الإيرادات لكل إعلان فردي' : 'Breakdown Metrics For Each Listing'}</span>
                        </span>
                        <span className="text-[9px] px-2 py-0.5 bg-slate-805 text-slate-300 rounded font-mono">
                          {computed.length} {language === 'ar' ? 'مسجل كلياً' : 'Total lists indexed'}
                        </span>
                      </div>
                      
                      <div className="p-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[290px] overflow-y-auto">
                        {computed.map(l => (
                          <div key={`stat-card-${l.id}`} className="bg-slate-900/80 border border-slate-800 hover:border-slate-700 p-3 rounded-xl flex items-center justify-between gap-2.5 transition-all">
                            <div className="flex items-center gap-2 truncate">
                              <div className="w-8 h-8 rounded-lg overflow-hidden shrink-0 border border-slate-800 bg-slate-950">
                                <img src={l.image} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                              </div>
                              <div className="truncate">
                                <span className="text-xs font-extrabold text-slate-100 block truncate" title={l.title}>{l.title}</span>
                                <span className="text-[9px] text-slate-400 block font-mono">ID: {l.id}</span>
                              </div>
                            </div>

                            <div className="text-right shrink-0">
                              <div className="text-xs font-black text-emerald-400 font-mono">
                                ${l.totalRevenue.toLocaleString()}
                              </div>
                              <div className="text-[9.5px] font-bold text-slate-400">
                                {l.bookingsCount} {l.bookingsCount === 1 ? 'booking' : 'bookings'}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>

            {/* Standard Catalog oversight table & Approval actions list */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden">
              <div className="p-4 border-b border-slate-50 bg-slate-50/50 flex justify-between items-center">
                <div>
                  <span className="text-xs font-black text-slate-500 uppercase tracking-wider">{language === 'ar' ? 'إدارة محتوى الكتالوج ومراقبة الإعلانات' : 'Active Catalog Listing Operations'}</span>
                  <p className="text-[10px] text-slate-400 mt-0.5">{language === 'ar' ? 'راقب الإعلانات الفعالة، احذف العروض المخالفة لسياسة المتجر أو قم بالمراجعة.' : 'Supervise the catalog database directly to prevent abuse or bad list offers.'}</p>
                </div>
                <span className="px-2 py-0.5 bg-slate-900 text-amber-400 rounded-md font-mono text-[10px] font-black">{listings.length} items</span>
              </div>

            {isLoading && listings.length === 0 ? (
              <div className="p-12 text-center text-xs font-bold text-slate-400 tracking-widest uppercase animate-pulse">
                Synchronizing listing items...
              </div>
            ) : listings.length === 0 ? (
              <div className="p-12 text-center text-xs text-slate-400 font-medium">
                No catalog listings stored.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-slate-100/50 border-b border-slate-150 text-[10px] font-bold text-slate-400 uppercase">
                      <th className="p-3">{language === 'ar' ? 'الإعلان والمعاينة' : 'Item details'}</th>
                      <th className="p-3">{language === 'ar' ? 'الفئة والموقع' : 'Domain & Region'}</th>
                      <th className="p-3">{language === 'ar' ? 'السعر (دولار)' : 'Price'}</th>
                      <th className="p-3">{language === 'ar' ? 'المالك والمزود' : 'Owner / Email'}</th>
                      <th className="p-3 text-center">{language === 'ar' ? 'خيارات' : 'Action'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {listings.map((l) => (
                      <tr key={l.id} className="hover:bg-slate-50/40 transition-colors">
                        <td className="p-3">
                          <div className="flex items-center gap-2.5">
                            <div className="w-10 h-8 rounded-lg overflow-hidden shrink-0 border border-slate-200 bg-slate-100">
                              <img src={l.image} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                            </div>
                            <div className="truncate max-w-[260px]">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="font-extrabold text-slate-800 truncate" title={l.title}>{l.title}</span>
                                {l.approvalStatus === 'pending' ? (
                                  <span className="px-1.5 py-0.5 bg-amber-100 text-amber-800 rounded font-black text-[9px] uppercase tracking-wider">
                                    {language === 'ar' ? 'معلق' : 'Pending'}
                                  </span>
                                ) : (
                                  <span className="px-1.5 py-0.5 bg-emerald-50 text-emerald-700 rounded font-black text-[9px] uppercase tracking-wider">
                                    {language === 'ar' ? 'مقبول' : 'Approved'}
                                  </span>
                                )}
                              </div>
                              <span className="text-[10px] text-amber-600 font-semibold uppercase">{l.actionType}</span>
                            </div>
                          </div>
                        </td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-[10px] font-bold mb-1 inline-block capitalize">{l.category}</span>
                          <span className="text-[10px] text-slate-450 block truncate">{l.location}</span>
                        </td>
                        <td className="p-3 font-mono font-bold text-slate-800 text-xs">
                          ${l.price.toLocaleString()}
                        </td>
                        <td className="p-3 text-slate-600 font-medium font-mono text-[11px]">
                          {l.ownerName} <span className="text-slate-400">({l.ownerId})</span>
                        </td>
                        <td className="p-3">
                          <div className="flex justify-center gap-2">
                            {l.approvalStatus === 'pending' && (
                              <button
                                onClick={() => handleApproveListing(l.id, l.title)}
                                className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 hover:text-emerald-800 rounded-lg border border-emerald-200 hover:border-emerald-300 cursor-pointer flex items-center justify-center gap-1 font-bold text-[10px]"
                                title="Approve Listing"
                              >
                                <Check className="w-3.5 h-3.5" />
                                <span>{language === 'ar' ? 'موافقة' : 'Approve'}</span>
                              </button>
                            )}
                            <button
                              onClick={() => handleDeleteListing(l.id, l.title)}
                              className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg border border-rose-150 cursor-pointer flex items-center justify-center gap-1 font-bold text-[10px]"
                              title="Delete listing item"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>{language === 'ar' ? 'حذف' : 'Remove'}</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          </div>
        )}

        {/* Tab 3: Collections / Category Manager */}
        {activeTab === 'collections' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left Box: Create Collection */}
            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs space-y-4 h-fit">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">{language === 'ar' ? 'إضافة مجموعة جديدة' : 'Add Custom Collection'}</h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {language === 'ar' 
                    ? 'أدخل معرفاً فريداً للفئة لتوسيع خيارات البحث والتصنيف داخل السوق.' 
                    : 'Extend directory categorization structure dynamically by adding new listings category indices.'}
                </p>
              </div>

              <form onSubmit={handleCreateCollection} className="space-y-3">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">{language === 'ar' ? 'معرف الفئة الفريد (مفتاح البحث)' : 'Unique Group Key (Lowercase URL)'}</span>
                  <input
                    type="text"
                    required
                    placeholder="e.g. yachts, consultations"
                    value={newColKey}
                    onChange={(e) => setNewColKey(e.target.value)}
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white text-slate-800 font-mono font-bold"
                  />
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">{language === 'ar' ? 'اسم الفئة الظاهر' : 'Display Group Name'}</span>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Luxury Yachts & Ships"
                    value={newColTitle}
                    onChange={(e) => setNewColTitle(e.target.value)}
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white text-slate-800 font-semibold"
                  />
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">{language === 'ar' ? 'وصف الفئة المختصر' : 'Short Core Description'}</span>
                  <textarea
                    rows={2}
                    placeholder="e.g. Rent or purchase luxury cruises and electric superyachts around Europe."
                    value={newColDesc}
                    onChange={(e) => setNewColDesc(e.target.value)}
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white text-slate-705"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-slate-950 text-white font-extrabold text-[11px] uppercase tracking-wider rounded-xl hover:bg-slate-900 transition-all cursor-pointer flex items-center justify-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{language === 'ar' ? 'إضافة للشبكة' : 'Append Category'}</span>
                </button>
              </form>
            </div>

            {/* Right Panel: Category Cards and Attribute Manager */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Category selector grid */}
              <div className="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden">
                <div className="p-4 border-b border-slate-50 bg-slate-50/50 flex justify-between items-center">
                  <div>
                    <span className="text-xs font-black text-slate-550 uppercase tracking-wider">{language === 'ar' ? 'الفئات والمجموعات الحالية في الدليل' : 'Active Root Marketplace Categories'}</span>
                    <p className="text-[10px] text-slate-400 mt-0.5">{language === 'ar' ? 'اختر فئة لتعديل وإدارة خصائصها ومواصفاتها المحددة.' : 'Click any category to edit or manage its custom schema attributes.'}</p>
                  </div>
                  <span className="px-2 py-0.5 bg-slate-900 text-amber-400 rounded-md font-mono text-[10px] font-black">{collections.length} {language === 'ar' ? 'فئات' : 'classes'}</span>
                </div>

                <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                  {collections.map((col) => {
                    const isSelected = selectedColKey === col.key;
                    const attrCount = col.attributes?.length || 0;
                    return (
                      <button
                        key={col.key}
                        onClick={() => {
                          setSelectedColKey(col.key);
                          cancelEditAttribute(); // reset form
                        }}
                        type="button"
                        className={`text-left p-4.5 rounded-2xl border transition-all relative cursor-pointer w-full group ${
                          isSelected 
                            ? 'bg-amber-50/40 border-amber-300 ring-2 ring-amber-500/10' 
                            : 'bg-slate-50 hover:bg-slate-100/50 border-slate-150'
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <span className="px-2 py-0.5 bg-slate-900 text-slate-200 rounded text-[9px] font-bold uppercase tracking-wider font-mono">{col.key}</span>
                          <span className="px-2 py-0.5 bg-slate-200/60 text-slate-600 rounded-md text-[9px] font-extrabold font-mono">
                            {attrCount} {attrCount === 1 ? 'attribute' : 'attributes'}
                          </span>
                        </div>
                        <div className="mt-2">
                          <h4 className="font-extrabold text-slate-800 text-sm flex items-center gap-1.5">
                            <Layers className="w-3.5 h-3.5 text-slate-400" />
                            <span>{col.title}</span>
                          </h4>
                          <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                            {col.description}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Attributes editor for selected category */}
              {selectedColKey && (() => {
                const selectedCol = collections.find(c => c.key === selectedColKey);
                if (!selectedCol) return null;
                const attrs = selectedCol.attributes || [];

                return (
                  <div className="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden grid grid-cols-1 md:grid-cols-5 divide-y md:divide-y-0 md:divide-x divide-slate-150">
                    
                    {/* Attributes List */}
                    <div className="p-5 md:col-span-3 space-y-4">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="px-2 py-0.5 bg-amber-500 text-amber-950 rounded text-[9px] font-black uppercase tracking-wider">
                            {selectedCol.title}
                          </span>
                          <span className="text-xs font-bold text-slate-700">{language === 'ar' ? 'قائمة المواصفات' : 'Attribute Schema'}</span>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          {language === 'ar' ? 'الخصائص والمواصفات المعرفة لهذه الفئة حالياً:' : 'Current property fields configured for this category type:'}
                        </p>
                      </div>

                      {attrs.length === 0 ? (
                        <div className="p-6 text-center border-2 border-dashed border-slate-100 rounded-2xl">
                          <span className="text-xs text-slate-450 font-bold block">
                            {language === 'ar' ? 'لا توجد مواصفات معرفة حالياً.' : 'No dynamic attributes declared yet for this class.'}
                          </span>
                        </div>
                      ) : (
                        <div className="space-y-2.5 max-h-[400px] overflow-y-auto pr-1">
                          {attrs.map((attr) => (
                            <div key={`attr-item-${attr.key}`} className="p-3 bg-slate-55 rounded-xl border border-slate-150/60 hover:border-slate-350 transition-all flex justify-between items-start gap-2.5">
                              <div>
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="text-xs font-black text-slate-800">{attr.label}</span>
                                  <span className="px-1.5 py-0.2 bg-slate-200 text-slate-650 rounded font-mono text-[9px] font-bold">{attr.key}</span>
                                  {attr.required && (
                                    <span className="px-1 bg-rose-100 text-rose-700 text-[8px] font-black rounded uppercase">
                                      {language === 'ar' ? 'إجباري' : 'Required'}
                                    </span>
                                  )}
                                </div>
                                <div className="text-[10px] text-slate-450 mt-1 flex items-center gap-1">
                                  <span className="font-bold">{language === 'ar' ? 'النوع:' : 'Type:'}</span>
                                  <span className="font-mono text-slate-600 bg-slate-100 px-1 rounded">{attr.type}</span>
                                  {attr.options && attr.options.length > 0 && (
                                    <span className="truncate max-w-[150px]" title={attr.options.join(', ')}>
                                      ({attr.options.join(', ')})
                                    </span>
                                  )}
                                </div>
                              </div>

                              <div className="flex items-center gap-1 shrink-0 bg-white p-0.5 rounded-lg border border-slate-100">
                                <button
                                  onClick={() => startEditAttribute(attr)}
                                  className="p-1 text-slate-500 hover:text-slate-850 hover:bg-slate-50 rounded cursor-pointer transition-colors"
                                  title="Edit attribute details"
                                >
                                  <Settings className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDeleteCategoryAttribute(attr.key)}
                                  className="p-1 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded cursor-pointer transition-colors"
                                  title="Delete attribute"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Manage Attribute block */}
                    <div className="p-5 md:col-span-2 bg-slate-50/50">
                      <form onSubmit={handleSaveCategoryAttribute} className="space-y-3.5">
                        <div className="border-b border-slate-100 pb-2">
                          <h4 className="text-xs font-extrabold text-slate-800 flex items-center gap-1 mt-0.5">
                            <Plus className="w-3.5 h-3.5 text-amber-500" />
                            <span>
                              {editingAttrKey 
                                ? (language === 'ar' ? 'تعديل الخاصية الحالية' : 'Modify Property') 
                                : (language === 'ar' ? 'إضافة خاصية جديدة' : 'Add Dynamic Attribute')
                              }
                            </span>
                          </h4>
                        </div>

                        {/* Attribute database Key / lookup name */}
                        <div className="space-y-1">
                          <span className="text-[9.5px] font-extrabold text-slate-450 uppercase tracking-wide block">
                            {language === 'ar' ? 'مفتاح الخاصية (فريد بالإنجليزية)' : 'Database Key (Lowercase ASCII)'}
                          </span>
                          <input
                            type="text"
                            required
                            disabled={!!editingAttrKey}
                            placeholder="e.g. mileage, screen_size"
                            value={attrKey}
                            onChange={(e) => setAttrKey(e.target.value)}
                            className="w-full text-xs p-2 bg-white border border-slate-200 rounded-xl focus:bg-white text-slate-800 font-mono font-bold disabled:bg-slate-100 disabled:text-slate-400"
                          />
                        </div>

                        {/* Attribute Display Label / Name shown to user */}
                        <div className="space-y-1">
                          <span className="text-[9.5px] font-extrabold text-slate-450 uppercase tracking-wide block">
                            {language === 'ar' ? 'اسم الخاصية الظاهر للمستخدم' : 'Display User Label'}
                          </span>
                          <input
                            type="text"
                            required
                            placeholder="e.g. Mileage (KM) or Screentype"
                            value={attrLabel}
                            onChange={(e) => setAttrLabel(e.target.value)}
                            className="w-full text-xs p-2 bg-white border border-slate-200 rounded-xl focus:bg-white text-slate-800 font-semibold"
                          />
                        </div>

                        {/* Attribute Field Type */}
                        <div className="space-y-1">
                          <span className="text-[9.5px] font-extrabold text-slate-450 uppercase tracking-wide block">
                            {language === 'ar' ? 'نوع الحقل الإدخالي' : 'UI Input Type'}
                          </span>
                          <select
                            value={attrType}
                            onChange={(e) => setAttrType(e.target.value as any)}
                            className="w-full text-xs p-2 rounded-xl border border-slate-200 bg-white font-bold text-slate-700 focus:ring-0"
                          >
                            <option value="text">Text / String</option>
                            <option value="number">Number / Integer</option>
                            <option value="select">Dropdown Menu (Select)</option>
                            <option value="boolean">Boolean Switch (Yes/No)</option>
                          </select>
                        </div>

                        {/* Comma-separated options if type = select */}
                        {attrType === 'select' && (
                          <div className="space-y-1 bg-white p-3 rounded-xl border border-dashed border-slate-200">
                            <span className="text-[9.5px] font-extrabold text-slate-450 uppercase tracking-wide block">
                              {language === 'ar' ? 'الخيارات المتاحة (مفصولة بفاصلة)' : 'Dropdown Options (Comma Separated)'}
                            </span>
                            <input
                              type="text"
                              required
                              placeholder="e.g. New, Used, Refurbished"
                              value={attrOptions}
                              onChange={(e) => setAttrOptions(e.target.value)}
                              className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
                            />
                            <p className="text-[9px] text-slate-400">
                              {language === 'ar' ? 'مثال: جديد, مستعمل, مجدد' : 'Provide choices separated by commas.'}
                            </p>
                          </div>
                        )}

                        {/* Required toggle */}
                        <div className="flex items-center justify-between bg-white p-2.5 rounded-xl border border-slate-150">
                          <span className="text-[10px] font-extrabold text-slate-500 uppercase">
                            {language === 'ar' ? 'حقل إجباري وملزم؟' : 'Required Field'}
                          </span>
                          <button
                            type="button"
                            onClick={() => setAttrRequired(!attrRequired)}
                            className={`w-10 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors ${
                              attrRequired ? 'bg-amber-500' : 'bg-slate-350'
                            }`}
                          >
                            <div
                              className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                                attrRequired ? 'translate-x-4' : 'translate-x-0'
                              }`}
                            />
                          </button>
                        </div>

                        {/* Form CTAs */}
                        <div className="flex gap-2 pt-1">
                          <button
                            type="submit"
                            className="flex-1 py-2 bg-slate-900 text-white hover:bg-slate-800 text-[10px] font-black uppercase tracking-wider rounded-xl cursor-pointer"
                          >
                            {editingAttrKey 
                              ? (language === 'ar' ? 'حفظ التعديل' : 'Update Attr') 
                              : (language === 'ar' ? 'إضافة الحقل' : 'Add Attr')
                            }
                          </button>
                          {editingAttrKey && (
                            <button
                              type="button"
                              onClick={cancelEditAttribute}
                              className="px-3 py-2 bg-slate-200 text-slate-700 hover:bg-slate-300 text-[10px] font-black uppercase rounded-xl cursor-pointer"
                            >
                              Cancel
                            </button>
                          )}
                        </div>
                      </form>
                    </div>

                  </div>
                );
              })()}
            </div>
          </div>
        )}

        {/* Tab 4: System Configurations & Settings */}
        {activeTab === 'settings' && (
          <div className="max-w-2xl mx-auto bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden">
            <div className="p-5 border-b border-slate-50 bg-slate-50/50">
              <h3 className="font-bold text-slate-900 text-sm">{language === 'ar' ? 'ضبط معايير الخادم والسوق' : 'Global Settings & Business Constants'}</h3>
              <p className="text-[10px] text-slate-400 mt-0.5">{language === 'ar' ? 'قم بتعديل قيم النظام مثل رسوم المعاملات وحماية المعاملات وبثها فوراً.' : 'Securely write system parameters, platform values or turn sandbox modules on.'}</p>
            </div>

            {settings ? (
              <form onSubmit={handleUpdateSettings} className="p-6 space-y-5">
                
                {/* Platform fee component */}
                <div className="space-y-2 bg-slate-50 p-4 rounded-2xl border border-slate-150 relative">
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="text-xs font-black text-slate-800 block">{language === 'ar' ? 'نسبة عمولة المنصة' : 'Platform Escrow Fee Rate'}</span>
                      <span className="text-[10px] text-slate-450 block">{language === 'ar' ? 'يتم اقتطاعها تلقائياً من كل صفقة checkout حيوية.' : 'Subtracted as direct revenue from confirmed buyer checkouts.'}</span>
                    </div>
                    <div className="flex items-center gap-1 bg-white px-3 py-1.5 rounded-xl border border-slate-200 font-mono text-sm font-black text-slate-900 shadow-2xs">
                      <span>{settings.platformFeePercentage}</span>
                      <Percent className="w-3.5 h-3.5 text-slate-400" />
                    </div>
                  </div>
                  
                  <div className="pt-2 flex items-center gap-3">
                    <input
                      type="range"
                      min="1"
                      max="30"
                      value={settings.platformFeePercentage}
                      onChange={(e) => setSettings({ ...settings, platformFeePercentage: Number(e.target.value) })}
                      className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-slate-900"
                    />
                    <span className="text-[10px] font-extrabold text-slate-400 uppercase font-sans">30% Max</span>
                  </div>
                </div>

                {/* Option 2: Currency Settings */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">{language === 'ar' ? 'عملة المتجر الافتراضية' : 'Primary Settlement Currency'}</span>
                    <select
                      value={settings.systemCurrency}
                      onChange={(e) => setSettings({ ...settings, systemCurrency: e.target.value })}
                      className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 font-bold"
                    >
                      <option value="USD">USD ($)</option>
                      <option value="GBP">GBP (£)</option>
                      <option value="EUR">EUR (€)</option>
                      <option value="SAR">SAR (ر.س)</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">{language === 'ar' ? 'سماح بحجوزات الزوار' : 'Guest Bookings Module'}</span>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setSettings({ ...settings, allowGuestBookings: true })}
                        className={`flex-1 py-2 text-xs font-bold rounded-lg border cursor-pointer ${
                          settings.allowGuestBookings ? 'bg-slate-900 text-white' : 'bg-white text-slate-600 border-slate-200'
                        }`}
                      >
                        Enable
                      </button>
                      <button
                        type="button"
                        onClick={() => setSettings({ ...settings, allowGuestBookings: false })}
                        className={`flex-1 py-2 text-xs font-bold rounded-lg border cursor-pointer ${
                          !settings.allowGuestBookings ? 'bg-slate-900 text-white' : 'bg-white text-slate-600 border-slate-200'
                        }`}
                      >
                        Disable
                      </button>
                    </div>
                  </div>
                </div>

                {/* Switch toggles for protection modules */}
                <div className="divide-y divide-slate-100 border-t border-b border-slate-100 py-2">
                  <div className="flex justify-between items-center py-3">
                    <div>
                      <span className="text-xs font-black text-slate-800 block">{language === 'ar' ? 'حماية الضمان المشددة (Escrow)' : 'Escrow Fraud Shield Protection'}</span>
                      <span className="text-[10px] text-slate-400 block">{language === 'ar' ? 'حجز مستندات الدفع والتحقق قبل الصرف.' : 'Hold buyer payment securely inside virtual sandboxed vault until release.'}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSettings({ ...settings, escrowProtection: !settings.escrowProtection })}
                      className={`px-3 py-1 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
                        settings.escrowProtection ? 'bg-emerald-500 text-white border-emerald-500' : 'bg-slate-100 text-slate-500 border-slate-200'
                      }`}
                    >
                      {settings.escrowProtection ? 'ON' : 'OFF'}
                    </button>
                  </div>

                  <div className="flex justify-between items-center py-3">
                    <div>
                      <span className="text-xs font-black text-slate-800 block">{language === 'ar' ? 'وضع الصيانة للمنصة' : 'Directory System Maintenance Mode'}</span>
                      <span className="text-[10px] text-slate-400 block">{language === 'ar' ? 'قفل الخادم وترجيع صفحة صيانة مخصصة.' : 'Restrict checkout routing for maintenance updates.'}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSettings({ ...settings, maintenanceMode: !settings.maintenanceMode })}
                      className={`px-3 py-1 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
                        settings.maintenanceMode ? 'bg-amber-500 text-white border-amber-500' : 'bg-slate-100 text-slate-500 border-slate-200'
                      }`}
                    >
                      {settings.maintenanceMode ? 'ON (Locked)' : 'OFF (Live)'}
                    </button>
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-slate-900 border border-slate-950 hover:bg-slate-800 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 cursor-pointer shadow-sm"
                  >
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span>{language === 'ar' ? 'حفظ وتطبيق الخيارات' : 'Apply Configuration'}</span>
                  </button>
                </div>

              </form>
            ) : (
              <div className="p-12 text-center text-xs font-sans font-bold text-slate-400 animate-pulse uppercase">
                Loading parameters...
              </div>
            )}
          </div>
        )}

        {/* Tab 5: Dynamic Earnings Statistics & Reports */}
        {activeTab === 'earnings' && (
          <div className="space-y-6">
            
            {/* KPI Cards Row */}
            {earnings ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  
                  {/* GMV */}
                  <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-3xs relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-3 text-slate-100 pointer-events-none">
                      <DollarSign className="w-14 h-14" />
                    </div>
                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">{language === 'ar' ? 'حجم المبيعات الإجمالي (GMV)' : 'Gross Volume GMV'}</span>
                    <span className="text-xl font-black text-slate-900 font-mono block mt-1">${earnings.totalGmv.toLocaleString()}</span>
                    <div className="flex items-center gap-1 text-[10px] text-slate-450 mt-1.5 font-medium">
                      <span className="px-1 py-0.5 bg-emerald-50 text-emerald-700 font-bold rounded">+15.8%</span>
                      <span>{language === 'ar' ? 'خلال هذا الشهر الآمن' : 'processed this cycle'}</span>
                    </div>
                  </div>

                  {/* Revenue / Escrow fee */}
                  <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-3xs relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-3 text-slate-100 pointer-events-none">
                      <Coins className="w-14 h-14" />
                    </div>
                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">{language === 'ar' ? 'أرباح عمولة المنصة المخزنة' : 'Platform Commissions'}</span>
                    <span className="text-xl font-black text-emerald-700 font-mono block mt-1">${earnings.totalRevenue.toLocaleString()}</span>
                    <div className="flex items-center gap-1 text-[10px] mt-1.5 font-semibold text-slate-500">
                      <span>{language === 'ar' ? 'بمعدل اقتطاع ' : 'Rate setting: '}</span>
                      <span className="px-1.5 py-0.5 bg-slate-900 text-amber-400 rounded font-bold font-mono">{earnings.platformFeePercentage}%</span>
                    </div>
                  </div>

                  {/* Confirmed Orders */}
                  <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-3xs">
                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">{language === 'ar' ? 'فواتير الصفقات الناجحة' : 'Settled Bookings'}</span>
                    <span className="text-xl font-black text-slate-850 block mt-1">{earnings.activeBookingsCount} order(s)</span>
                    <div className="flex items-center gap-1.5 text-[10px] text-emerald-600 font-bold mt-1.5">
                      <span>✓ 100% Secure Checkout SSL</span>
                    </div>
                  </div>

                  {/* Cancelled checkout orders */}
                  <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-3xs">
                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">{language === 'ar' ? 'الصفقات الملغاة' : 'Cancellations'}</span>
                    <span className="text-xl font-black text-rose-700 block mt-1">{earnings.cancelledBookingsCount} item(s)</span>
                    <div className="flex items-center gap-1 text-[10px] text-slate-400 mt-1.5 font-medium">
                      <span>Refunded through network</span>
                    </div>
                  </div>

                </div>

                {/* Earnings timeline chart (SVG crafted perfectly under additional guidelines) */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  
                  {/* Revenue Trend SVG Chart */}
                  <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs lg:col-span-2 space-y-4">
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">{language === 'ar' ? 'منحنى نمو أرباح عمولات المنصة لعام 2026' : 'Monthly Performance Trend (2026)'}</h4>
                      <p className="text-[10px] text-slate-400">{language === 'ar' ? 'مستند على حجم المعاملات المكتملة وعمولة Escrow.' : 'Calculated automatically based on transaction volume and direct commission fee rate.'}</p>
                    </div>

                    {/* Pure, responsive SVG Graph */}
                    <div className="w-full h-48 bg-slate-50 border border-slate-100 rounded-xl p-3 flex flex-col justify-between relative overflow-hidden">
                      <div className="absolute top-2 right-2 flex items-center gap-3 text-[9px] font-bold text-slate-400 uppercase">
                        <div className="flex items-center gap-1">
                          <div className="w-2.5 h-1.5 bg-slate-900 rounded-xs" />
                          <span>Sales Volume</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <div className="w-2.5 h-1.5 bg-emerald-500 rounded-xs" />
                          <span>Platform Fee</span>
                        </div>
                      </div>

                      <div className="flex-1 w-full flex items-end justify-between relative">
                        {/* Mesh grid background indicator */}
                        <div className="absolute inset-0 flex flex-col justify-between pr-8 pointer-events-none opacity-40">
                          <div className="border-b border-dashed border-slate-200 w-full" />
                          <div className="border-b border-dashed border-slate-200 w-full" />
                          <div className="border-b border-dashed border-slate-200 w-full" />
                        </div>

                        {/* Stoppoints visual map */}
                        {earnings.timelineData.map((pt, idx) => {
                          const percentageOfFullSales = Math.min((pt.sales / 30000) * 100, 100);
                          const percentageOfFullProfit = Math.min((pt.profit / 4500) * 100, 100);
                          
                          return (
                            <div key={idx} className="flex-1 flex flex-col items-center justify-end h-full z-10 group relative px-1">
                              
                              {/* Hover numeric tooltip banner */}
                              <div className="absolute -top-1 opacity-0 group-hover:opacity-100 bg-slate-900 text-white text-[8px] font-mono p-1 rounded transition-opacity shadow-xs z-50 pointer-events-none text-center">
                                Vol: ${pt.sales.toLocaleString()} <br />
                                Fee: ${pt.profit.toFixed(1)}
                              </div>

                              <div className="w-full flex items-end justify-center gap-1 max-w-[40px] h-[75%]">
                                {/* Sales volume column block */}
                                <div 
                                  style={{ height: `${Math.max(percentageOfFullSales, 8)}%` }} 
                                  className="w-3 bg-slate-900 group-hover:bg-amber-400 rounded-t-xs transition-all" 
                                />
                                {/* Profit fee column block */}
                                <div 
                                  style={{ height: `${Math.max(percentageOfFullProfit, 6)}%` }} 
                                  className="w-3 bg-emerald-500 rounded-t-xs transition-all" 
                                />
                              </div>

                              <span className="text-[9px] font-bold text-slate-400 mt-2 font-mono">{pt.name}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Right: Payment transactions registry ledger */}
                  <div className="bg-white rounded-2xl border border-slate-100 shadow-xs flex flex-col h-[280px]">
                    <div className="p-3 border-b border-slate-50 bg-slate-50/50 flex justify-between items-center shrink-0">
                      <span className="text-[10px] font-extrabold uppercase text-slate-500 tracking-wider">Payments Ledger Logs</span>
                      <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-800 rounded text-[8px] font-bold">LIVE TRANSACTION CAPTURE</span>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-2">
                      {earnings.transactionsList && earnings.transactionsList.length > 0 ? (
                        earnings.transactionsList.map((tx: any) => (
                          <div key={tx.id} className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between text-[11px] gap-2">
                            <div className="truncate">
                              <span className="font-extrabold text-slate-900 block truncate max-w-[130px] leading-tight" title={tx.listingTitle}>
                                {tx.listingTitle}
                              </span>
                              <span className="font-mono text-[9px] text-slate-400 block mt-0.5">
                                Tx: {tx.id} • Buyer: {tx.buyerEmail.split('@')[0]}
                              </span>
                            </div>
                            <div className="text-right shrink-0">
                              <span className="font-mono font-black text-emerald-600 block">${tx.amount}</span>
                              <span className="text-[8px] font-mono text-slate-400 uppercase">{new Date(tx.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-12 text-[11px] text-slate-400 font-medium">
                          No transactions completed yet.
                        </div>
                      )}
                    </div>
                  </div>

                </div>
              </>
            ) : (
              <div className="p-16 text-center text-xs text-slate-400 animate-pulse uppercase font-sans font-bold tracking-widest">
                Computing transaction logs...
              </div>
            )}

          </div>
        )}

        {/* Mailing & Contact Marketing Campaigns Management Panel */}
        {activeTab === 'mailing' && (
          <div id="mailing-workspace" className="space-y-6">
            
            {/* Split controls grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Campaign creation card */}
              <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.015)] space-y-4">
                <div className="flex items-center gap-2 pb-3 border-b border-slate-50">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-600">
                    <Send className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-sm font-black text-slate-900 tracking-tight">
                      {language === 'ar' ? 'إرسال حملة بريدية للمستخدمين' : 'Dispatch Email Campaign'}
                    </h2>
                    <p className="text-[10px] text-slate-400">
                      {language === 'ar' ? 'أرسل عروض ترويجية يدوية وتحديثات هامة لبريد جميع أو مستخدم محدد.' : 'Create administrative campaign dispatches list of selective buyers/hosts.'}
                    </p>
                  </div>
                </div>

                <form onSubmit={handleSendCampaign} className="space-y-3.5">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
                        {language === 'ar' ? 'اسم الحملة (داخلي)' : 'Campaign Name (Internal)'}
                      </label>
                      <input
                        type="text"
                        value={campaignName}
                        onChange={(e) => setCampaignName(e.target.value)}
                        required
                        className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-slate-400 focus:bg-white"
                        placeholder="e.g. Weekend Spring Update"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
                        {language === 'ar' ? 'المستلم المستهدف' : 'Target Recipient'}
                      </label>
                      <select
                        value={targetRecipient}
                        onChange={(e) => setTargetRecipient(e.target.value)}
                        className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-slate-400 focus:bg-white"
                      >
                        <option value="all">{language === 'ar' ? 'جميع المستخدمين المسجلين' : 'All Platform Users'}</option>
                        {users.map(u => (
                          <option key={u.id} value={u.email}>{u.name || u.email} ({u.role})</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
                      {language === 'ar' ? 'عنوان الرسالة' : 'Email Subject Line'}
                    </label>
                    <input
                      type="text"
                      value={mailSubject}
                      onChange={(e) => setMailSubject(e.target.value)}
                      required
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-slate-400 focus:bg-white"
                      placeholder="e.g. Verified luxury options curated for you"
                    />
                  </div>

                  {/* Gemini Smart Assistant Toggle */}
                  <div className="p-3 bg-amber-500/5 rounded-2xl border border-amber-500/10 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-amber-600 animate-pulse" />
                        <span className="text-xs font-bold text-slate-800">
                          {language === 'ar' ? 'مساعد الكتابة الذكي جمناي' : 'Gemini AI Copywriting Assistant'}
                        </span>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={generateWithAI} 
                          onChange={(e) => setGenerateWithAI(e.target.checked)} 
                          className="sr-only peer" 
                        />
                        <div className="w-8 h-4 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-amber-500"></div>
                      </label>
                    </div>

                    {generateWithAI ? (
                      <div>
                        <p className="text-[9px] text-amber-700 font-medium mb-1.5 leading-tight">
                          {language === 'ar' ? 'يدعم جمناي توليد رسائل بريدية ترويجية متقنة بناءً على موضوع فرعي.' : 'Gemini models will auto-generate copy matching your topic perfectly.'}
                        </p>
                        <input
                          type="text"
                          value={aiPrompt}
                          onChange={(e) => setAiPrompt(e.target.value)}
                          className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:border-amber-400"
                          placeholder="e.g. Write an update welcoming users and promoting summer listings..."
                        />
                      </div>
                    ) : (
                      <p className="text-[9px] text-amber-800/80">
                        {language === 'ar' ? 'تعديل النص يدوياً مفعّل حالياً.' : 'Writing manually. Switch on Gemini AI to automatically generate rich marketing copies.'}
                      </p>
                    )}
                  </div>

                  {!generateWithAI && (
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-slate-450 mb-1">
                        {language === 'ar' ? 'محتوى الرسالة يدوياً' : 'Manual Email Body Content'}
                      </label>
                      <textarea
                        value={mailBodyInput}
                        onChange={(e) => setMailBodyInput(e.target.value)}
                        rows={4}
                        required
                        className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-slate-400 focus:bg-white font-sans text-slate-700"
                        placeholder="Write your email body here..."
                      />
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isSendingMail}
                    className="w-full py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-all cursor-pointer shadow-md disabled:opacity-50 flex items-center justify-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>
                      {isSendingMail 
                        ? (language === 'ar' ? 'جاري الإرسال والتوليد...' : 'Dispatching Campaign...') 
                        : (language === 'ar' ? 'إرسال الحملة الإعلانية' : 'Send Active Campaign')
                      }
                    </span>
                  </button>
                </form>

              </div>

              {/* Search History Analytics & Auto Matcher Card */}
              <div className="space-y-6">
                
                {/* Auto Match Machine */}
                <div className="bg-gradient-to-br from-slate-900 to-slate-950 text-white p-6 rounded-3xl border border-slate-850 shadow-xl space-y-4 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl" />
                  
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                      <Sparkles className="w-4 h-4 animate-bounce" />
                    </div>
                    <div>
                      <h2 className="text-sm font-black tracking-tight text-white leading-tight">
                        {language === 'ar' ? 'محرك المطابقة التلقائي للاتصال' : 'Auto-Matching Contact Engine'}
                      </h2>
                      <span className="text-[10px] font-mono text-emerald-400 font-semibold block mt-0.5">
                        {language === 'ar' ? 'يعتمد على سجل بحث المستخدمين' : 'Trigger emails based on user search history'}
                      </span>
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-300 leading-relaxed font-normal">
                    {language === 'ar' 
                      ? 'يقوم المحرك بمسح سجلات بحث المستخدمين تلقائياً ومقارنتها بالإعلانات الفعالة، ثم إرسال توصيات مخصصة بذكاء لزيادة نسب المبيعات.' 
                      : 'Scan historic user search terms, compare values dynamically to verified live listings, and send personalized recommendations directly.'
                    }
                  </p>

                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={handleTriggerAutoEmails}
                      disabled={isSendingMail}
                      className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold rounded-xl transition-all shadow-md cursor-pointer disabled:opacity-40 flex items-center justify-center gap-1.5"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isSendingMail ? 'animate-spin' : ''}`} />
                      <span>
                        {language === 'ar' ? 'تشغيل المسح وإرسال المطابقات فوراً' : 'Run Scan & Send Matches'}
                      </span>
                    </button>
                  </div>
                </div>

                {/* Live search queries log */}
                <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.015)] space-y-3">
                  <div className="flex justify-between items-center pb-2 border-b border-slate-50">
                    <div className="flex items-center gap-1.5">
                      <History className="w-4 h-4 text-slate-400" />
                      <span className="text-xs font-black text-slate-900">{language === 'ar' ? 'آخر كلمات البحث والاهتمامات' : 'Live User Search Log'}</span>
                    </div>
                    <span className="text-[9px] px-1.5 py-0.5 bg-slate-100 rounded-md font-mono font-bold text-slate-500">
                      {searchLog.length} {language === 'ar' ? 'عملية مسجلة' : 'queries tracked'}
                    </span>
                  </div>

                  <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
                    {searchLog.length > 0 ? (
                      searchLog.map((sh: any) => (
                        <div key={sh.id} className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between text-[11px] hover:bg-slate-100/50 transition-colors">
                          <div className="truncate pr-2 text-left">
                            <span className="font-mono text-[9px] text-slate-400 block truncate leading-none mb-1">
                              {sh.userEmail}
                            </span>
                            <span className="font-bold text-slate-900 text-xs">
                              &ldquo;{sh.query}&rdquo;
                            </span>
                          </div>
                          <div className="text-right shrink-0 flex flex-col items-end">
                            <span className="px-1.5 py-0.5 bg-slate-200/60 rounded text-[9px] uppercase font-bold text-slate-600">
                              {sh.category}
                            </span>
                            <span className="text-[8px] text-slate-400 mt-1 font-mono">
                              {new Date(sh.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-12 text-[11px] text-slate-400 font-medium font-sans">
                        {language === 'ar' ? 'لا توجد عمليات بحث مسجلة حالياً.' : 'No search actions recorded yet.'}
                      </div>
                    )}
                  </div>
                </div>

              </div>

            </div>

            {/* Email Outbox history */}
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.015)] space-y-4">
              <div className="flex justify-between items-center pb-3 border-b border-slate-50">
                <div className="flex items-center gap-1.5">
                  <Mail className="w-4 h-4 text-amber-500" />
                  <span className="text-xs font-black text-slate-900">
                    {language === 'ar' ? 'أرشيف رسائل البريد المرسلة' : 'Campaign Dispatch History & Outbox Log'}
                  </span>
                </div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">
                  {mailHistory.length} {language === 'ar' ? 'رسالة مرسلة' : 'logged posts'}
                </span>
              </div>

              <div className="space-y-2.5 max-h-[440px] overflow-y-auto pr-2">
                {mailHistory.length > 0 ? (
                  mailHistory.map((mail: any) => (
                    <div key={mail.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-2 hover:border-slate-350 transition-all text-left">
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-black text-xs text-slate-900 uppercase">
                              {mail.campaignName}
                            </span>
                            <span className={`px-2 py-0.5 rounded text-[8px] font-extrabold uppercase ${
                              mail.triggerType === 'auto-update' 
                                ? 'bg-emerald-100 text-emerald-800' 
                                : 'bg-amber-100 text-amber-800'
                            }`}>
                              {mail.triggerType === 'auto-update' 
                                ? (language === 'ar' ? 'مطابقة تلقائية' : 'Auto Search Match') 
                                : (language === 'ar' ? 'حملة تسويقية' : 'Marketing Campaign')
                              }
                            </span>
                          </div>
                          <span className="text-[11px] leading-tight text-slate-600 block">
                            <span className="font-bold text-slate-700">{language === 'ar' ? 'العنوان:' : 'Subject:'}</span> {mail.subject}
                          </span>
                        </div>
                        <div className="text-left sm:text-right shrink-0">
                          <span className="text-[10px] block font-semibold text-slate-500 font-mono">
                            {mail.recipientEmail}
                          </span>
                          <span className="text-[8px] font-mono text-slate-400 block mt-0.5">
                            {new Date(mail.createdAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                          </span>
                        </div>
                      </div>

                      <div className="p-3 bg-white rounded-xl border border-slate-150 text-[11px] text-slate-600 whitespace-pre-line leading-relaxed font-sans max-h-32 overflow-y-auto shadow-inner">
                        {mail.body}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-16 text-xs text-slate-400 font-medium font-sans">
                    {language === 'ar' ? 'لا توجد حملات مرسلة حتى الآن.' : 'Administrative outbox is currently empty.'}
                  </div>
                )}
              </div>
            </div>

          </div>
        )}

      </div>

    </div>
  );
}
