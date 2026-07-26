"use client";
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import collegeImg from '../../image/PSNA college.png';
import * as XLSX from 'xlsx';

import { StudentDetailModal } from './StudentDetailModal';
import { normalizeBranchToAbbreviation } from '@/lib/branch-mapping';

// ─── Types ────────────────────────────────────────────────────────────────────
export interface Application {
  id: string; initials: string; name: string; status: string; date: string;
  statusText: string; statusBg: string; statusBorder: string;
  department?: string; dob?: string; mobile?: string;
  fatherName?: string; motherName?: string;
  extendedDays?: number;
  completionStatus?: 'Partial' | 'Complete' | 'Not Started';
  isLocked?: boolean;
  formOpenedAt?: string;
  submitTime?: string; age?: string; guardian?: string; caste?: string;
  residentialStatus?: string; speciallyAbled?: string; admissionYear?: string;
  hscBoard?: string; gqMqNumber?: string; gqMqType?: string; schoolLocation?: string;
  civicStatus?: string; emisNo?: string; relativesInCollege?: string; hearAboutPSNA?: string;
  fatherOccupation?: string; fatherIncome?: string; fatherMobile?: string;
  motherOccupation?: string; motherIncome?: string; motherMobile?: string;
  address?: string; district?: string; state?: string; motherTongue?: string;
  nationality?: string; religion?: string; studiedTN?: string; govtSchool?: string;
  batch?: string; cutoff?: string; pcmTarget?: string; physicsMark?: string;
  chemistryMark?: string; mathsMark?: string;
}


const BAR_COLORS = [
  'from-[#18281e] to-[#2d4a35]', 'from-[#fea619] to-[#f9c35a]', 'from-[#3b5e8a] to-[#5b8ec0]',
  'from-[#18281e] to-[#4a7e5a]', 'from-[#8a3b3b] to-[#c05b5b]', 'from-[#3b7a8a] to-[#5bbfc0]',
  'from-[#6b448a] to-[#a07ac0]', 'from-[#44718a] to-[#72a7c0]', 'from-[#2a6b4a] to-[#5aab7a]',
  'from-[#8a6b2a] to-[#c0a06a]', 'from-[#18281e] to-[#516356]',
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function useCountUp(target: number, duration = 1000) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    let cur = 0;
    const step = Math.max(1, Math.ceil(target / (duration / 16)));
    const t = setInterval(() => { cur = Math.min(cur + step, target); setValue(cur); if (cur >= target) clearInterval(t); }, 16);
    return () => clearInterval(t);
  }, [target, duration]);
  return value;
}

function StatusBadge({ status }: { status: string }) {
  const cfg = status === 'Approved'
    ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
    : status === 'In Review'
      ? 'bg-amber-50 border-amber-200 text-amber-700'
      : 'bg-red-50 border-red-200 text-red-700';
  const dot = status === 'Approved' ? 'bg-emerald-500' : status === 'In Review' ? 'bg-amber-500' : 'bg-red-500';
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[10px] font-bold ${cfg}`}>
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${dot}`} />
      {status}
    </span>
  );
}

// ─── MetricCard ───────────────────────────────────────────────────────────────
function MetricCard({ icon, label, value, sub, theme }: {
  icon: string; label: string; value: number | string; sub?: string;
  theme: 'dark' | 'amber' | 'green' | 'red' | 'white';
}) {
  const numVal = typeof value === 'number' ? value : 0;
  const counted = useCountUp(numVal);
  const display = typeof value === 'string' ? value : counted.toLocaleString();

  const themes = {
    dark: { wrap: 'bg-[#18281e] text-white', icon: 'bg-white/15 text-white', sub: 'text-white/50', dec: 'bg-white' },
    amber: { wrap: 'bg-[#fea619] text-[#18281e]', icon: 'bg-[#18281e]/10 text-[#18281e]', sub: 'text-[#18281e]/60', dec: 'bg-[#18281e]' },
    green: { wrap: 'bg-[#dcfce7] text-[#14532d]', icon: 'bg-[#14532d]/10 text-[#14532d]', sub: 'text-[#14532d]/60', dec: 'bg-[#14532d]' },
    red: { wrap: 'bg-[#fee2e2] text-red-800', icon: 'bg-red-800/10 text-red-800', sub: 'text-red-800/60', dec: 'bg-red-800' },
    white: { wrap: 'bg-white border border-[#e5e2e1] text-[#18281e]', icon: 'bg-[#f0eded] text-[#18281e]', sub: 'text-[#737873]', dec: 'bg-[#18281e]' },
  };
  const t = themes[theme];

  return (
    <div className={`relative rounded-2xl p-5 flex flex-col gap-3 hover:-translate-y-0.5 transition-transform duration-200 shadow-sm overflow-hidden ${t.wrap}`}>
      <div className="flex items-center justify-between">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 z-10 ${t.icon}`}>
          <span className="material-symbols-outlined text-[20px] leading-none">{icon}</span>
        </div>
        <span className={`text-[9px] font-black uppercase tracking-[0.14em] z-10 ${t.sub}`}>{label}</span>
      </div>
      <div className="h-2" />
      <div className="z-10">
        <p className="font-headline text-3xl font-black leading-none tracking-tight">{display}</p>
        {sub && <p className={`text-[10px] font-medium mt-1.5 ${t.sub}`}>{sub}</p>}
      </div>
      <div className={`absolute -bottom-5 -right-5 w-20 h-20 rounded-full opacity-[0.06] ${t.dec}`} />
    </div>
  );
}

// ─── ExcelPathSettings Component ──────────────────────────────────────────────
function ExcelPathSettings() {
  const [excelPath, setExcelPath] = useState('');
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadExcelPath = async () => {
      try {
        const res = await fetch('/api/admin/settings', {
          credentials: 'include',
        });
        if (res.ok) {
          const data = await res.json();
          setExcelPath(data.excel_export_path || '');
        }
      } catch (e) {
        console.error('Error loading excel path:', e);
      }
    };
    loadExcelPath();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!excelPath.trim()) {
      setMsg('Please enter a valid path');
      return;
    }
    setLoading(true);
    setMsg('');
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ excel_export_path: excelPath.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMsg(data.error || 'Failed to save path');
        return;
      }
      setMsg('✅ Excel export path saved successfully!');
    } catch {
      setMsg('Network error');
    } finally {
      setLoading(false);
    }
  };

  const inputCls = 'w-full h-10 px-4 bg-white border border-[#e5e2e1] rounded-xl text-sm text-[#18281e] placeholder:text-[#b0b0a8] outline-none focus:ring-2 focus:ring-[#18281e]/15 focus:border-[#18281e]/30 transition-all';
  const labelCls = 'block text-[9px] font-bold uppercase tracking-[0.14em] text-[#434844] mb-1.5';

  return (
    <form className="space-y-3" onSubmit={handleSave}>
      <div>
        <label className={labelCls}>Export Directory Path</label>
        <input 
          type="text" 
          value={excelPath} 
          onChange={e => setExcelPath(e.target.value)}
          className={inputCls} 
          placeholder="e.g., C:\Reports or /home/user/Reports"
        />
        <p className="text-[9px] text-[#737873] mt-2">The Excel files will be saved to this folder on your server. Use absolute path.</p>
      </div>
      {msg && (
        <p className={`text-xs font-semibold ${msg.startsWith('✅') ? 'text-emerald-600' : 'text-red-600'}`}>{msg}</p>
      )}
      <button type="submit" disabled={loading} className="w-full py-2.5 bg-[#3b82f6] text-white text-sm font-bold rounded-xl hover:bg-[#1e40af] transition-colors disabled:opacity-60">
        {loading ? 'Saving…' : '✅ Save Excel Path'}
      </button>
    </form>
  );
}

// ─── YouTubeVideoSettings Component ───────────────────────────────────────────
function YouTubeVideoSettings() {
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchVideoSettings = async () => {
    try {
      const res = await fetch('/api/settings', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setYoutubeUrl(data.tutorial_youtube_url || data.tutorial_video_url || '');
      }
    } catch (e) {
      console.error('Error loading YouTube video setting:', e);
    }
  };

  useEffect(() => {
    fetchVideoSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!youtubeUrl.trim()) {
      setMsg('Please enter a valid YouTube video URL');
      return;
    }
    setLoading(true);
    setMsg('');
    try {
      const res = await fetch('/api/admin/settings/youtube', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ youtube_url: youtubeUrl.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMsg(data.error || 'Failed to save YouTube URL');
        return;
      }
      setMsg('✅ YouTube Tutorial Video link saved successfully!');
    } catch {
      setMsg('Network error.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSave} className="space-y-3">
      <div>
        <label className="block text-[9px] font-bold uppercase tracking-[0.14em] text-[#434844] mb-1.5">
          YouTube Video URL / Link
        </label>
        <div className="relative">
          <input
            type="url"
            value={youtubeUrl}
            onChange={(e) => setYoutubeUrl(e.target.value)}
            className="w-full h-10 pl-9 pr-4 bg-white border border-[#e5e2e1] rounded-xl text-sm text-[#18281e] placeholder:text-[#b0b0a8] outline-none focus:ring-2 focus:ring-[#18281e]/15 transition-all"
            placeholder="e.g. https://www.youtube.com/watch?v=VIDEO_ID or https://youtu.be/VIDEO_ID"
          />
          <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-[18px] text-red-600">
            play_circle
          </span>
        </div>
        <p className="text-[9px] text-[#737873] mt-1">
          Paste any YouTube video link. When students click the Tutorial Video button in the registration form, it will open and play this YouTube video directly.
        </p>
      </div>

      {msg && (
        <p className={`text-xs font-semibold ${msg.startsWith('✅') ? 'text-emerald-600' : 'text-red-600'}`}>
          {msg}
        </p>
      )}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 py-2.5 bg-[#18281e] text-white text-sm font-bold rounded-xl hover:bg-[#2d4a35] transition-colors disabled:opacity-60 flex items-center justify-center gap-1.5"
        >
          {loading ? 'Saving…' : '✅ Save YouTube Video Link'}
        </button>
        {youtubeUrl && (
          <a
            href={youtubeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2.5 bg-red-50 border border-red-200 text-red-600 text-xs font-bold rounded-xl hover:bg-red-100 transition-colors flex items-center gap-1"
          >
            <span className="material-symbols-outlined text-[16px]">open_in_new</span>
            Test Link
          </a>
        )}
      </div>
    </form>
  );
}

// ─── HostelImagesSettings Component ───────────────────────────────────────────
function HostelImagesSettings() {
  const [category, setCategory] = useState<'two_sharing_ac' | 'two_sharing_non_ac' | 'four_sharing_non_ac'>('two_sharing_ac');
  const [images, setImages] = useState<Record<string, string[]>>({
    two_sharing_ac: [],
    two_sharing_non_ac: [],
    four_sharing_non_ac: [],
  });
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchHostelImages = async () => {
    try {
      const res = await fetch('/api/settings/hostel-images', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setImages(data);
      }
    } catch (e) {
      console.error('Error loading hostel images:', e);
    }
  };

  useEffect(() => {
    fetchHostelImages();
  }, []);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (!file.type.startsWith('image/')) {
        setMsg('Please select a valid image file.');
        return;
      }

      setLoading(true);
      setMsg('');

      try {
        const formData = new FormData();
        formData.append('category', category);
        formData.append('image', file);

        const res = await fetch('/api/admin/settings/hostel-images', {
          method: 'POST',
          credentials: 'include',
          body: formData,
        });

        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          setMsg(data.error || 'Failed to upload image.');
          return;
        }

        setMsg('✅ Image uploaded successfully!');
        setImages(prev => ({
          ...prev,
          [category]: data.images
        }));
      } catch {
        setMsg('Network error.');
      } finally {
        setLoading(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    }
  };

  const handleDelete = async (imageUrl: string) => {
    if (!confirm('Are you sure you want to delete this hostel image?')) {
      return;
    }
    setLoading(true);
    setMsg('');
    try {
      const res = await fetch('/api/admin/settings/hostel-images', {
        method: 'DELETE',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category, imageUrl }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMsg(data.error || 'Failed to delete image.');
        return;
      }
      setMsg('✅ Image deleted successfully.');
      setImages(prev => ({
        ...prev,
        [category]: data.images
      }));
    } catch {
      setMsg('Network error.');
    } finally {
      setLoading(false);
    }
  };

  const currentCategoryImages = images[category] || [];

  return (
    <div className="space-y-4">
      {/* Category Tabs */}
      <div>
        <label className="block text-[9px] font-bold uppercase tracking-[0.14em] text-[#434844] mb-2">
          Select Hostel Category
        </label>
        <div className="grid grid-cols-1 gap-1.5 sm:flex sm:flex-wrap">
          {(
            [
              { name: 'Two Sharing A/C', slug: 'two_sharing_ac' },
              { name: 'Two Sharing Non A/C', slug: 'two_sharing_non_ac' },
              { name: 'Four Sharing Non A/C', slug: 'four_sharing_non_ac' },
            ] as const
          ).map((c) => (
            <button
              key={c.slug}
              type="button"
              onClick={() => {
                setCategory(c.slug);
                setMsg('');
              }}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                category === c.slug
                  ? 'bg-[#18281e] text-white shadow-sm'
                  : 'bg-white border border-[#e5e2e1] text-[#737873] hover:bg-[#f0eded]'
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of uploaded images */}
      <div>
        <span className="text-[10px] font-bold uppercase tracking-wider text-[#434844] block mb-2">
          Uploaded Images ({currentCategoryImages.length} / 10)
        </span>
        
        {currentCategoryImages.length > 0 ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {currentCategoryImages.map((imgUrl, index) => (
              <div key={index} className="group relative aspect-video rounded-xl bg-gray-100 overflow-hidden border border-gray-200 shadow-sm">
                <img
                  src={imgUrl}
                  alt={`Hostel Image ${index + 1}`}
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => handleDelete(imgUrl)}
                  disabled={loading}
                  className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white"
                >
                  <span className="material-symbols-outlined text-[24px] text-red-500 bg-white rounded-full p-1.5 hover:scale-110 transition-transform">
                    delete
                  </span>
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6 bg-white border border-dashed border-[#e5e2e1] rounded-2xl">
            <span className="material-symbols-outlined text-[32px] text-[#737873] mb-1">
              photo_library
            </span>
            <p className="text-xs text-[#737873]">No images uploaded yet.</p>
          </div>
        )}
      </div>

      {/* Image Upload Area */}
      {currentCategoryImages.length < 10 && (
        <div>
          <label className="block text-[9px] font-bold uppercase tracking-[0.14em] text-[#434844] mb-1.5">
            Upload Image
          </label>
          <div
            onClick={() => !loading && fileInputRef.current?.click()}
            className={`border-2 border-dashed border-[#e5e2e1] hover:border-[#18281e]/30 rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer bg-white transition-all group ${
              loading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              className="hidden"
              disabled={loading}
            />
            <span className="material-symbols-outlined text-[32px] text-[#737873] group-hover:text-[#18281e] transition-colors mb-2">
              cloud_upload
            </span>
            <p className="text-xs font-bold text-[#18281e]">
              {loading ? 'Uploading...' : 'Click to select and upload image'}
            </p>
            <p className="text-[9px] text-[#737873] mt-1">
              Supports PNG, JPG, JPEG. Max 10 images total.
            </p>
          </div>
        </div>
      )}

      {currentCategoryImages.length >= 10 && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-2">
          <span className="material-symbols-outlined text-[20px] text-amber-600">info</span>
          <p className="text-xs text-amber-800 font-medium">
            Maximum limit of 10 images has been reached for this category.
          </p>
        </div>
      )}

      {msg && (
        <p className={`text-xs font-semibold ${msg.startsWith('✅') ? 'text-emerald-600' : 'text-red-600'}`}>
          {msg}
        </p>
      )}
    </div>
  );
}

// ─── AccountSettingsModal ─────────────────────────────────────────────────────
function AccountSettingsModal({ onClose, onUsernameChanged }: { onClose: () => void; onUsernameChanged?: (u: string) => void }) {
  const [uForm, setUForm] = useState({ currentPwd: '', newUsername: '' });
  const [pForm, setPForm] = useState({ currentPwd: '', newPwd: '', confirmPwd: '' });
  const [uMsg, setUMsg] = useState('');
  const [pMsg, setPMsg] = useState('');
  const [uLoading, setULoading] = useState(false);
  const [pLoading, setPLoading] = useState(false);

  const handleUsernameSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uForm.currentPwd || !uForm.newUsername) { setUMsg('All fields are required.'); return; }
    setULoading(true);
    setUMsg('');
    try {
      const res = await fetch('/api/admin/account', {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'username', currentPassword: uForm.currentPwd, newUsername: uForm.newUsername.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setUMsg(data.error || 'Update failed.');
        return;
      }
      setUMsg('✅ Username updated successfully!');
      onUsernameChanged?.(uForm.newUsername.trim());
      setUForm({ currentPwd: '', newUsername: '' });
    } catch {
      setUMsg('Network error.');
    } finally {
      setULoading(false);
    }
  };
  const handlePasswordSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pForm.currentPwd || !pForm.newPwd || !pForm.confirmPwd) { setPMsg('All fields are required.'); return; }
    if (pForm.newPwd !== pForm.confirmPwd) { setPMsg('New passwords do not match.'); return; }
    setPLoading(true);
    setPMsg('');
    try {
      const res = await fetch('/api/admin/account', {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'password', currentPassword: pForm.currentPwd, newPassword: pForm.newPwd }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setPMsg(data.error || 'Update failed.');
        return;
      }
      setPMsg('✅ Password updated successfully!');
      setPForm({ currentPwd: '', newPwd: '', confirmPwd: '' });
    } catch {
      setPMsg('Network error.');
    } finally {
      setPLoading(false);
    }
  };

  const inputCls = 'w-full h-10 px-4 bg-[#f8f6f4] border border-[#e5e2e1] rounded-xl text-sm text-[#18281e] placeholder:text-[#b0b0a8] outline-none focus:ring-2 focus:ring-[#18281e]/15 focus:border-[#18281e]/30 transition-all';
  const labelCls = 'block text-[9px] font-bold uppercase tracking-[0.14em] text-[#434844] mb-1.5';

  return (
    <div className="fixed inset-0 z-[200] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#f0eded] bg-[#fafaf9]">
          <div>
            <h2 className="font-headline text-base font-bold text-[#18281e]">Account Settings</h2>
            <p className="text-[10px] text-[#737873] mt-0.5">Manage your credentials</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-[#f0eded] text-[#737873] hover:text-red-600 transition-colors">
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Change Username */}
          <div className="bg-[#f8f6f4] rounded-2xl p-5">
            <h3 className="font-headline text-sm font-bold text-[#18281e] mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px] text-[#516356]">manage_accounts</span>
              Change Username
            </h3>
            <form className="space-y-3" onSubmit={handleUsernameSave}>
              <div>
                <label className={labelCls}>Current Password <span className="text-red-500">(Required)</span></label>
                <input type="password" value={uForm.currentPwd} onChange={e => setUForm(p => ({ ...p, currentPwd: e.target.value }))}
                  className={inputCls} placeholder="Enter current password" />
              </div>
              <div>
                <label className={labelCls}>New Username</label>
                <input type="text" value={uForm.newUsername} onChange={e => setUForm(p => ({ ...p, newUsername: e.target.value }))}
                  className={inputCls} placeholder="Enter new username" />
              </div>
              {uMsg && (
                <p className={`text-xs font-semibold ${uMsg.startsWith('✅') ? 'text-emerald-600' : 'text-red-600'}`}>{uMsg}</p>
              )}
              <button type="submit" disabled={uLoading} className="w-full py-2.5 bg-[#18281e] text-white text-sm font-bold rounded-xl hover:bg-[#2d4a35] transition-colors disabled:opacity-60">
                {uLoading ? 'Updating…' : '✅ Update Username'}
              </button>
            </form>
          </div>
          {/* Change Password */}
          <div className="bg-[#f8f6f4] rounded-2xl p-5">
            <h3 className="font-headline text-sm font-bold text-[#18281e] mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px] text-[#516356]">lock</span>
              Change Password
            </h3>
            <form className="space-y-3" onSubmit={handlePasswordSave}>
              <div>
                <label className={labelCls}>Current Password <span className="text-red-500">(Required)</span></label>
                <input type="password" value={pForm.currentPwd} onChange={e => setPForm(p => ({ ...p, currentPwd: e.target.value }))}
                  className={inputCls} placeholder="Enter current password" />
              </div>
              <div>
                <label className={labelCls}>New Password</label>
                <input type="password" value={pForm.newPwd} onChange={e => setPForm(p => ({ ...p, newPwd: e.target.value }))}
                  className={inputCls} placeholder="Enter new password" />
              </div>
              <div>
                <label className={labelCls}>Confirm New Password</label>
                <input type="password" value={pForm.confirmPwd} onChange={e => setPForm(p => ({ ...p, confirmPwd: e.target.value }))}
                  className={inputCls} placeholder="Confirm new password" />
              </div>
              {pMsg && (
                <p className={`text-xs font-semibold ${pMsg.startsWith('✅') ? 'text-emerald-600' : 'text-red-600'}`}>{pMsg}</p>
              )}
              <button type="submit" disabled={pLoading} className="w-full py-2.5 bg-[#18281e] text-white text-sm font-bold rounded-xl hover:bg-[#2d4a35] transition-colors disabled:opacity-60">
                {pLoading ? 'Updating…' : '✅ Update Password'}
              </button>
            </form>
          </div>
          {/* Excel Export Path */}
          <div className="bg-[#f8f6f4] rounded-2xl p-5">
            <h3 className="font-headline text-sm font-bold text-[#18281e] mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px] text-[#516356]">table_chart</span>
              Excel Export Path
            </h3>
            <ExcelPathSettings />
          </div>
          {/* Tutorial Video Settings */}
          <div className="bg-[#f8f6f4] rounded-2xl p-5">
            <h3 className="font-headline text-sm font-bold text-[#18281e] mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px] text-red-600">play_circle</span>
              YouTube Tutorial Video Settings
            </h3>
            <YouTubeVideoSettings />
          </div>
          {/* Hostel Images Settings */}
          <div className="bg-[#f8f6f4] rounded-2xl p-5">
            <h3 className="font-headline text-sm font-bold text-[#18281e] mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px] text-[#516356]">bed</span>
              Hostel Images
            </h3>
            <HostelImagesSettings />
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'applications' | 'reports' | 'studentsManagement' | 'idCards'>('dashboard');
  const [isDownloadingIdCards, setIsDownloadingIdCards] = useState(false);
  const [smCategory, setSmCategory] = useState<'Complete' | 'Partial'>('Complete');
  const [smSearchQuery, setSmSearchQuery] = useState('');
  const [showOpenedFormModal, setShowOpenedFormModal] = useState(false);
  const [smViewApp, setSmViewApp] = useState<Application | null>(null);
  const [exportModalType, setExportModalType] = useState<'PDF' | 'Excel' | null>(null);
  const [exportModalApp, setExportModalApp] = useState<Application | null>(null);
  const [activeSection, setActiveSection] = useState<'dept' | 'completion' | 'students' | 'recent'>('dept');
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showAccountSettings, setShowAccountSettings] = useState(false);
  const [applications, setApplications] = useState<Application[]>([]);
  const [dashboardMetrics, setDashboardMetrics] = useState<{
    totalStudents: number;
    finishedForms: number;
    notSubmitted: number;
    partiallyFilled: number;
    notStarted: number;
    completionRate: number;
    asOf?: string;
  } | null>(null);
  const [adminUsername, setAdminUsername] = useState('');
  const [authChecked, setAuthChecked] = useState(false);
  const [formData, setFormData] = useState({ id: '', name: '', department: '', dob: '', fatherMobile: '', fatherName: '', motherName: '' });
  // Department management
  const [customDepts, setCustomDepts] = useState<{ short: string; full: string }[]>([]);
  const [newDeptShort, setNewDeptShort] = useState('');
  const [newDeptFull, setNewDeptFull] = useState('');
  const [deptMsg, setDeptMsg] = useState('');
  const [showDeptPanel, setShowDeptPanel] = useState(false);
  // Extend Time & Edit
  const [isEditing, setIsEditing] = useState(false);

  // Dashboard Header Modals
  const [dashboardModal, setDashboardModal] = useState<'download' | 'print' | null>(null);

  // Custom Analytics States
  const [reportSearchQuery, setReportSearchQuery] = useState('');
  const [reportYear, setReportYear] = useState<'This Year' | 'Last Year'>('This Year');
  const [exportOverviewActive, setExportOverviewActive] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [extendModalApp, setExtendModalApp] = useState<Application | null>(null);
  const [extendDaysInput, setExtendDaysInput] = useState<number>(3);
  const [appSearchQuery, setAppSearchQuery] = useState('');
  const [deleteModalApp, setDeleteModalApp] = useState<Application | null>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [batchModal, setBatchModal] = useState<'exporting' | 'confirm_restart' | 'restarting' | null>(null);
  const [smRefreshing, setSmRefreshing] = useState(false);
  const [pollingEnabled, setPollingEnabled] = useState(true);
  const handleExportCertificates = () => {
    const link = document.createElement('a');
    link.href = '/api/admin/export-certificates';
    link.download = 'all_student_certificates.zip';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Bulk Upload state
  const [bulkUploadModal, setBulkUploadModal] = useState<{
    show: boolean;
    step: 'preview' | 'uploading' | 'results';
    parsedStudents?: any[];
    invalidRows?: any[];
    deptCounts?: Record<string, number>;
    results?: any;
  }>({show: false, step: 'preview'});
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExcelUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setBulkUploadModal({show: true, step: 'uploading'});

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });
      
      const parsedStudents: any[] = [];
      const invalidRows: any[] = [];
      const deptCounts: Record<string, number> = {};
      
      for (const sheetName of workbook.SheetNames) {
        // Skip irrelevant sheets like "DISCONTINUED", "7.5 LIST", "ABSTRACT"
        const normalizedName = sheetName.toUpperCase().trim();
        if (normalizedName.includes('DISC') || normalizedName.includes('7.5') || normalizedName.includes('ABSTRACT')) {
          continue;
        }

        const worksheet = workbook.Sheets[sheetName];
        const rows: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });
        
        if (rows.length === 0) continue;

        let headerRowIndex = -1;
        for (let i = 0; i < Math.min(10, rows.length); i++) {
          const rowStr = (rows[i] || []).map(c => String(c)).join(' ').toLowerCase();
          if ((rowStr.includes('appl') || rowStr.includes('application') || rowStr.includes('id') || rowStr.includes('reg') || rowStr.includes('roll')) && (rowStr.includes('name') || rowStr.includes('student'))) {
            headerRowIndex = i;
            break;
          }
        }
        
        if (headerRowIndex === -1 && rows.length > 0) {
          for (let i = 0; i < Math.min(5, rows.length); i++) {
            const rowStr = (rows[i] || []).map(c => String(c)).join(' ').toLowerCase();
            if (rowStr.includes('name') || rowStr.includes('student') || rowStr.includes('appl')) {
              headerRowIndex = i;
              break;
            }
          }
        }

        if (headerRowIndex === -1) continue;

        const headers = rows[headerRowIndex].map(h => String(h).toLowerCase().replace(/\s+/g, ' '));
        
        for (let i = headerRowIndex + 1; i < rows.length; i++) {
          const row = rows[i];
          if (!row || !row.some(c => String(c).trim() !== '')) continue;
          
          const getVal = (possibleKeys: string[]) => {
            const index = headers.findIndex(h => possibleKeys.some(pk => h.includes(pk)));
            return index !== -1 ? String(row[index]).trim() : '';
          };
          
          let dob = getVal(['dob', 'date of birth', 'birth', 'date_of_birth']);
          if (!isNaN(Number(dob)) && dob.trim() !== '') {
            const num = Number(dob);
            if (num > 25569) {
               const date = new Date(Math.round((num - 25569) * 86400 * 1000));
               dob = date.toISOString().split('T')[0];
            }
          } else if (typeof dob === 'string') {
            dob = dob.trim();
            if (dob.includes('.')) {
              const parts = dob.split('.');
              if (parts.length === 3) {
                dob = parts[0].length === 4 ? `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}` : `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
              }
            } else if (dob.includes('-')) {
              const parts = dob.split('-');
              if (parts.length === 3 && parts[0].length === 2) {
                dob = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
              }
            } else if (dob.includes('/')) {
              const parts = dob.split('/');
              if (parts.length === 3) {
                dob = parts[0].length === 4 ? `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}` : `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
              }
            }
          }

          const cleanPhone = (val: string) => {
             if (!val) return '';
             const match = val.match(/\d{10}/);
             return match ? match[0] : val.replace(/[^0-9]/g, '').slice(0, 10);
          };

          const colBranch = getVal(['academic branch', 'academic_branch', 'department', 'dept', 'branch', 'course']);
          const rawSheet = sheetName.toUpperCase().trim();
          const fallbackBranch = (rawSheet.startsWith('SHEET') || rawSheet === 'CSV' || rawSheet === 'DATA')
            ? (file.name.replace(/\.[^/.]+$/, "").toUpperCase().trim() || 'GENERAL')
            : rawSheet;
          const academic_branch = normalizeBranchToAbbreviation(colBranch ? colBranch : fallbackBranch);

          const student = {
            application_number: getVal(['app', 'id', 'application number', 'appl']),
            full_name: getVal(['name of the student', 'name', 'full name']),
            date_of_birth: dob,
            academic_branch: academic_branch,
            father_name: getVal(['father', 'father name']),
            mother_name: getVal(['mother', 'mother name']),
            father_mobile_number: cleanPhone(getVal(['parent contact', 'father mobile', 'father contact'])),
            mobile_number: cleanPhone(getVal(['student contact', 'mobile number', 'mobile', 'phone', 'phone number', 'contact']))
          };
          if (!student.date_of_birth || student.date_of_birth === 'NaN-NaN-NaN' || student.date_of_birth === 'undefined') {
            student.date_of_birth = '';
          }
          const missingFields = [];
          if (!student.application_number) missingFields.push('App No');
          if (!student.full_name) missingFields.push('Name');
          if (!student.mobile_number && !student.father_mobile_number) missingFields.push('Phone');
          
          if (missingFields.length === 0) {
            parsedStudents.push(student);
            deptCounts[student.academic_branch] = (deptCounts[student.academic_branch] || 0) + 1;
          } else {
            invalidRows.push({
               ...student,
               reason: `Missing: ${missingFields.join(', ')}`,
               rawRow: `App No: ${student.application_number || '—'} | Name: ${student.full_name || '—'} | DOB: ${student.date_of_birth || '—'} | Phone: ${student.mobile_number || student.father_mobile_number || '—'}`
            });
          }
        }
      }
      
      setBulkUploadModal({
        show: true,
        step: 'preview',
        parsedStudents,
        invalidRows,
        deptCounts
      });
      
    } catch (err: any) {
      setBulkUploadModal({show: true, step: 'results', results: { error: err.message }});
    }
    
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const confirmBulkUpload = async () => {
    if (!bulkUploadModal.parsedStudents || bulkUploadModal.parsedStudents.length === 0) {
      setBulkUploadModal({show: false, step: 'preview'});
      return;
    }
    setBulkUploadModal(p => ({ ...p, step: 'uploading' }));

    try {
      const res = await fetch('/api/admin/bulk-upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ students: bulkUploadModal.parsedStudents })
      });
      
      const resultData = await res.json();
      
      if (res.ok) {
        setBulkUploadModal(p => ({...p, step: 'results', results: resultData.results}));
        loadApplications();
      } else {
        setBulkUploadModal(p => ({...p, step: 'results', results: { error: resultData.error }}));
      }
    } catch (err: any) {
      setBulkUploadModal(p => ({...p, step: 'results', results: { error: err.message }}));
    }
  };

  const loadApplications = useCallback(async () => {
    const res = await fetch(`/api/students?t=${Date.now()}`, {
      credentials: 'include',
      cache: 'no-store',
    });
    if (res.status === 401) {
      // Stop background polling if auth is gone to prevent endless 401 loops.
      setPollingEnabled(false);
      return;
    }
    const data = await res.json().catch(() => ({}));
    if (data.students) {
      console.log('Loaded students data:', data.students);
      setApplications(data.students);
    }
  }, []);

  const loadDepartments = useCallback(async () => {
    const res = await fetch('/api/departments', { credentials: 'include' });
    if (!res.ok) return;
    const data = await res.json().catch(() => ({}));
    if (data.departments) setCustomDepts(data.departments);
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const me = await fetch('/api/me', { credentials: 'include' });
        if (me.status !== 200) {
          window.location.href = '/';
          return;
        }
        const body = await me.json().catch(() => ({}));
        if (body.role !== 'admin') {
          window.location.href = '/';
          return;
        }
        setAdminUsername(body.username || '');
        setAuthChecked(true);
        await Promise.all([loadApplications(), loadDepartments()]);
      } catch (e) {
        console.error('Error during auth check:', e);
        setAuthChecked(true);
      }
    })();
  }, [loadApplications, loadDepartments]);

  const loadDashboardMetrics = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/dashboard-metrics?t=${Date.now()}`, {
        credentials: 'include',
        cache: 'no-store',
      });
      if (res.status === 401) {
        setPollingEnabled(false);
        return;
      }
      if (!res.ok) return;
      const data = await res.json().catch(() => null);
      if (!data) return;
      setDashboardMetrics({
        totalStudents: Number(data.totalStudents ?? 0),
        finishedForms: Number(data.finishedForms ?? 0),
        notSubmitted: Number(data.notSubmitted ?? 0),
        partiallyFilled: Number(data.partiallyFilled ?? 0),
        notStarted: Number(data.notStarted ?? 0),
        completionRate: Number(data.completionRate ?? 0),
        asOf: data.asOf,
      });
    } catch (error) {
      console.warn('Failed to load dashboard metrics, retrying on next tick...', error);
    }
  }, []);

  useEffect(() => {
    if (!authChecked || !pollingEnabled) return;
    void loadDashboardMetrics();
    const t = window.setInterval(() => void loadDashboardMetrics(), 5000);
    return () => window.clearInterval(t);
  }, [authChecked, pollingEnabled, loadDashboardMetrics]);

  // Keep the students list fresh so "Partial → Complete" moves without manual refresh.
  useEffect(() => {
    if (!authChecked || !pollingEnabled) return;
    const t = window.setInterval(() => void loadApplications(), 5000);
    return () => window.clearInterval(t);
  }, [authChecked, pollingEnabled, loadApplications]);

  useEffect(() => {
    if (!document.getElementById('dotlottie-script')) {
      const script = document.createElement('script');
      script.id = 'dotlottie-script';
      script.src = 'https://unpkg.com/@dotlottie/player-component@2.7.12/dist/dotlottie-player.mjs';
      script.type = 'module';
      document.head.appendChild(script);
    }
  }, []);

  // ─── Smart Export System ──────────────────────────────────────────────────────
  
  const EXPORT_STORAGE_KEY = 'student_export_history';
  
  // Get stored export data from localStorage
  const getStoredExportData = () => {
    try {
      const stored = localStorage.getItem(EXPORT_STORAGE_KEY);
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  };

  // Save export data to localStorage
  const saveStoredExportData = (data: Record<string, any>) => {
    try {
      localStorage.setItem(EXPORT_STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      console.error('Error saving export data:', e);
    }
  };

  // Convert application to export row
  const appToExportRow = (app: Application) => ({
    // Basic Information
    'Application Number': app.id || '-',
    'Full Name': app.name || '-',
    'Department': app.department || '-',
    
    // Contact Information
    'Mobile Number': app.mobile || '-',
    'Father Mobile': app.fatherMobile || app.mobile || '-',
    'Mother Mobile': app.motherMobile || '-',
    'Address': app.address || '-',
    'District': app.district || '-',
    'State': app.state || '-',
    
    // Personal Information
    'Date of Birth': app.dob || '-',
    'Age': app.age || '-',
    'Caste': app.caste || '-',
    'Religion': app.religion || '-',
    'Mother Tongue': app.motherTongue || '-',
    'Nationality': app.nationality || '-',
    'Civic Status': app.civicStatus || '-',
    'Residential Status': app.residentialStatus || '-',
    'Specially Abled': app.speciallyAbled || '-',
    
    // Family Information
    'Father Name': app.fatherName || '-',
    'Father Occupation': app.fatherOccupation || '-',
    'Father Income': app.fatherIncome || '-',
    'Mother Name': app.motherName || '-',
    'Mother Occupation': app.motherOccupation || '-',
    'Mother Income': app.motherIncome || '-',
    'Guardian': app.guardian || '-',
    'Relatives in College': app.relativesInCollege || '-',
    
    // Educational Information
    'HSC Board': app.hscBoard || '-',
    'GQ/MQ Number': app.gqMqNumber || '-',
    'GQ/MQ Type': app.gqMqType || '-',
    'School Location': app.schoolLocation || '-',
    'EMIS No': app.emisNo || '-',
    'Studied in TN': app.studiedTN || '-',
    'Govt School': app.govtSchool || '-',
    'Batch': app.batch || '-',
    'Admission Year': app.admissionYear || '-',
    'Cutoff': app.cutoff || '-',
    
    // Academic Scores
    'PCM Target': app.pcmTarget || '-',
    'Physics Mark': app.physicsMark || '-',
    'Chemistry Mark': app.chemistryMark || '-',
    'Maths Mark': app.mathsMark || '-',
    
    // Application Status
    'Completion Status': app.completionStatus || '-',
    'Status': app.status || 'In Review',
    'Is Locked': app.isLocked ? 'Yes' : 'No',
    'Extended Days': app.extendedDays || 0,
    'Date Submitted': app.date || app.submitTime || '-',
    'How Heard About PSNA': app.hearAboutPSNA || '-',
    
    '_studentId': app.id, // Hidden field for tracking
  });

  // Smart export with duplicate prevention and update support
  const smartExportStudents = async (appsToExport: Application[], isArchive = false, forceBrowserDownload = false) => {
    if (appsToExport.length === 0) {
      alert('No student details available to download.');
      return false;
    }

    // Get stored export data
    const storedData = getStoredExportData();
    
    // Group apps by department
    const deptMap = new Map<string, Application[]>();
    appsToExport.forEach(app => {
      const dept = app.department || 'Unknown';
      if (!deptMap.has(dept)) deptMap.set(dept, []);
      deptMap.get(dept)!.push(app);
    });

    // Create workbook with department sheets
    const wb = XLSX.utils.book_new();

    deptMap.forEach((deptApps, deptName) => {
      // Get stored data for this department
      const storedDeptData = storedData[deptName] || [];
      
      // Create a map of stored students by ID for easy lookup
      const storedMap = new Map<string, any>();
      storedDeptData.forEach((row: any) => {
        storedMap.set(row._studentId || row['Application Number'], row);
      });

      // Merge: update existing students and add new ones
      const mergedData: any[] = [];
      const addedIds = new Set<string>();

      // First add/update with new exports
      deptApps.forEach(app => {
        const exportRow = appToExportRow(app);
        mergedData.push(exportRow);
        addedIds.add(app.id);
      });

      // Then add stored students that weren't in this export
      storedDeptData.forEach((storedRow: any) => {
        const studentId = storedRow._studentId || storedRow['Application Number'];
        if (!addedIds.has(studentId)) {
          mergedData.push(storedRow);
        }
      });

      // Create sheet with merged data
      const ws = XLSX.utils.json_to_sheet(mergedData);
      
      // Hide the _studentId column
      const colsWidth = Object.keys(mergedData[0] || {}).map(key => ({
        wch: key === '_studentId' ? 0 : 18
      }));
      ws['!cols'] = colsWidth;
      
      // Add sheet to workbook
      let safeDeptName = deptName.replace(/[\\/?*[\]:]/g, ' ').substring(0, 31);
      XLSX.utils.book_append_sheet(wb, ws, safeDeptName);

      // Update stored data for this department
      storedData[deptName] = mergedData;
    });

    // Save updated data to localStorage
    saveStoredExportData(storedData);

    // Check if custom path is configured
    console.log('=== STARTING EXCEL EXPORT ===');
    console.log('Students to export:', appsToExport.length);
    
    try {
      console.log('Fetching settings from /api/admin/settings...');
      const settingsRes = await fetch('/api/admin/settings', {
        credentials: 'include',
      });
      
      console.log('Settings response status:', settingsRes.status);
      
      if (settingsRes.ok && !forceBrowserDownload) {
        const settings = await settingsRes.json();
        console.log('Settings retrieved:', settings);
        console.log('Excel export path setting:', settings.excel_export_path);
        
        if (settings.excel_export_path && settings.excel_export_path.trim()) {
          console.log('Custom path found, attempting server-side export...');
          
          // Use custom path via API
          const students = appsToExport.map(app => ({
            id: app.id,
            name: app.name,
            department: app.department || 'Unknown',
            mobile: app.mobile,
            dob: app.dob,
            fatherName: app.fatherName,
            motherName: app.motherName,
            date: app.date,
            status: app.status,
          }));

          console.log('Prepared students data:', students.length, 'students');
          console.log('Calling /api/admin/export-excel...');
          
          const exportRes = await fetch('/api/admin/export-excel', {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ students, useCustomPath: true }),
          });

          console.log('Export API response status:', exportRes.status);
          
          const result = await exportRes.json();
          console.log('Export API response:', result);

          if (exportRes.ok) {
            console.log('✅ Export successful!');
            console.log('File path:', result.filepath);
            console.log('File size:', result.fileSize, 'bytes');
            console.log('Sheets created:', result.sheetsCreated);
            console.log('=== EXPORT COMPLETED SUCCESSFULLY ===');
            
            alert(`✅ Successfully exported!\n\nPath: ${result.filepath}\nFile size: ${(result.fileSize / 1024).toFixed(2)} KB\nSheets created: ${result.sheetsCreated}`);
            return true;
          } else {
            console.error('❌ Export API returned error');
            const errorMsg = result.error || 'Unknown error occurred';
            const errorType = result.errorType || 'Unknown';
            const errorCode = result.errorCode || 'N/A';
            const details = result.details || {};
            
            console.error('Export error details:', {
              error: errorMsg,
              errorType,
              errorCode,
              details,
              path: result.path
            });
            
            console.log('Falling back to browser download...');
            
            alert(`❌ Export to custom path failed:\n\nError: ${errorMsg}\nError Code: ${errorCode}\nPath: ${result.path || 'unknown'}\n\nTroubleshooting:\n1. Verify path exists: ${result.path}\n2. Check write permissions\n3. Ensure disk has space\n4. Check server logs for details\n\nFalling back to browser download...`);
            
            // Fallback: Browser download
            const activeSession = `${new Date().getFullYear()} – ${new Date().getFullYear() + 4}`;
            XLSX.writeFile(wb, `Student_Records_${activeSession}${isArchive ? '_Restart_Backup' : ''}.xlsx`);
            return false;
          }
        } else {
          console.log('No custom path configured, using browser download');
        }
      } else {
        console.error('Failed to fetch settings, status:', settingsRes.status);
      }
    } catch (error) {
      console.error('Error in export process:', error);
    }

    // Fallback: Browser download (no custom path configured)
    console.log('Performing browser download fallback...');
    const activeSession = `${new Date().getFullYear()} – ${new Date().getFullYear() + 4}`;
    const filename = `Student_Records_${activeSession}${isArchive ? '_Restart_Backup' : ''}.xlsx`;
    console.log('Downloading as:', filename);
    XLSX.writeFile(wb, filename);
    
    alert(`Successfully exported ${appsToExport.length} student(s) to Excel!`);
    return true;
  };

  const exportToExcelCore = async (isArchive = false, forceBrowserDownload = false) => {
    const completeApps = applications.filter(a => a.completionStatus === 'Complete');
    return smartExportStudents(completeApps, isArchive, forceBrowserDownload);
  };

  // Export individual student
  const exportSingleStudent = async (app: Application) => {
    await smartExportStudents([app], false);
  };

  const handleExportToExcel = async () => {
    const completeApps = applications.filter(a => a.completionStatus === 'Complete');
    if (completeApps.length === 0) {
      alert("No student details available to download.");
      return;
    }
    setBatchModal('exporting');
    setTimeout(async () => {
      await exportToExcelCore();
      setBatchModal(null);
    }, 2000);
  };

  const handleRefreshStudentManagement = async () => {
    setSmRefreshing(true);
    try {
      setPollingEnabled(true);
      await Promise.all([loadApplications(), loadDashboardMetrics()]);
    } finally {
      setSmRefreshing(false);
    }
  };

  const handleDownloadServerExcelExports = async () => {
    if (applications.length === 0) {
      alert("No student details available to download.");
      return;
    }
    try {
      const res = await fetch('/api/admin/excel-exports/download', {
        credentials: 'include',
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        alert(err.error || 'No student details available to download.');
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Excel_Exports_${new Date().toISOString().slice(0, 10)}.zip`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
      alert('No student details available to download.');
    }
  };

  const handleArchiveBatch = () => {
    setBatchModal('confirm_restart');
  };

  const executeRestart = () => {
    setBatchModal('restarting');
    setTimeout(async () => {
      await exportToExcelCore(true, true);
      await fetch('/api/students/restart-session', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirm: true }),
      });
      if (typeof window !== 'undefined') {
        localStorage.removeItem('psna_excel_export_data');
      }
      await loadApplications();
      setBatchModal(null);
    }, 2500);
  };

  const profileRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const h = (e: MouseEvent) => { if (profileRef.current && !profileRef.current.contains(e.target as Node)) setIsProfileOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(p => ({ ...p, [name]: value }));
  };

  const handleSave = async () => {
    if (!formData.name.trim()) return;
    if (!isEditing && !formData.id.trim()) {
      alert('Application number is required.');
      return;
    }
    if (!formData.dob || !formData.department) {
      alert('Date of birth and academic branch are required.');
      return;
    }

    if (isEditing && editingId) {
      const res = await fetch('/api/students', {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          application_number: editingId,
          full_name: formData.name,
          date_of_birth: formData.dob,
          academic_branch: formData.department,
          father_name: formData.fatherName,
          mother_name: formData.motherName,
          father_mobile_number: formData.fatherMobile,
        }),
      });
      const err = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(err.error || 'Could not update student.');
        return;
      }
    } else {
      const res = await fetch('/api/students', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          application_number: formData.id.trim(),
          full_name: formData.name,
          date_of_birth: formData.dob,
          academic_branch: formData.department,
          father_name: formData.fatherName,
          mother_name: formData.motherName,
          father_mobile_number: formData.fatherMobile,
        }),
      });
      const err = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(err.error || 'Could not save student.');
        return;
      }
    }
    await loadApplications();
    handleDiscard();
  };

  const handleDiscard = () => { setFormData({ id: '', name: '', department: '', dob: '', fatherMobile: '', fatherName: '', motherName: '' }); setIsEditing(false); setEditingId(null); };

  const handleEdit = (app: Application) => {
    setFormData({
      id: app.id,
      name: app.name,
      department: app.department || '',
      dob: app.dob || '',
      fatherMobile: app.fatherMobile || '',
      fatherName: app.fatherName || '',
      motherName: app.motherName || '',
    });
    setIsEditing(true);
    setEditingId(app.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteRequest = (app: Application) => {
    setDeleteModalApp(app);
    setDeleteConfirmText('');
  };

  const handleConfirmDelete = async () => {
    if (deleteConfirmText !== 'DELETE') return;
    if (deleteModalApp) {
      await fetch('/api/students', {
        method: 'DELETE',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ application_number: deleteModalApp.id }),
      });
      if (editingId === deleteModalApp.id) {
        handleDiscard();
      }
      await loadApplications();
    }
    setDeleteModalApp(null);
    setDeleteConfirmText('');
  };

  const handleExtendSave = async () => {
    if (!extendModalApp) return;
    await fetch('/api/students', {
      method: 'PATCH',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ application_number: extendModalApp.id, extended_days: extendDaysInput }),
    });
    await loadApplications();
    setExtendModalApp(null);
  };

  const handleAddDept = async () => {
    if (!newDeptShort.trim() || !newDeptFull.trim()) { setDeptMsg('Both fields are required.'); return; }
    if (customDepts.some(d => d.short.toLowerCase() === newDeptShort.trim().toLowerCase())) { setDeptMsg('Department code already exists.'); return; }
    const res = await fetch('/api/departments', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ short: newDeptShort.trim(), full: newDeptFull.trim() }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setDeptMsg(data.error || 'Could not add department.');
      return;
    }
    setCustomDepts(prev => [...prev, { short: newDeptShort.trim().toUpperCase(), full: newDeptFull.trim() }]);
    setNewDeptShort(''); setNewDeptFull('');
    setDeptMsg('✅ Department added successfully!');
    setTimeout(() => setDeptMsg(''), 3000);
  };

  const handleRemoveDept = async (short: string) => {
    await fetch('/api/departments', {
      method: 'DELETE',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ short }),
    });
    setCustomDepts(prev => prev.filter(d => d.short !== short));
  };

  const handleLogout = async () => {
    await fetch('/api/logout', {
      method: 'POST',
      credentials: 'include',
      headers: { 'x-session-kind': 'admin' },
    });
    window.location.href = '/';
  };

  const deptStats = useMemo(() => {
    const map = new Map<string, { students: number; completed: number; pending: number }>();
    for (const a of applications) {
      const name = a.department || 'Unknown';
      const cur = map.get(name) || { students: 0, completed: 0, pending: 0 };
      cur.students += 1;
      // Check if form is completed
      if (a.completionStatus === 'Complete') {
        cur.completed += 1;
      } else {
        cur.pending += 1;
      }
      map.set(name, cur);
    }
    return Array.from(map.entries()).map(([name, v]) => ({
      name,
      short: name.replace(/[^A-Za-z0-9]/g, '').substring(0, 6).toUpperCase() || 'DEPT',
      students: v.students,
      completed: v.completed,
      pending: v.pending,
    })).sort((a, b) => b.students - a.students);
  }, [applications]);

  const totalStudents = dashboardMetrics?.totalStudents ?? applications.length;
  const totalCompleted = dashboardMetrics?.finishedForms ?? applications.filter(a => a.completionStatus === 'Complete').length;
  const totalPending = dashboardMetrics?.notSubmitted ?? applications.filter(a => a.completionStatus !== 'Complete').length;
  const completionRate =
    dashboardMetrics?.completionRate ??
    (totalStudents ? Math.round((totalCompleted / totalStudents) * 100) : 0);
  const totalForms = applications.length;
  const avgDocs = totalStudents ? (totalCompleted / totalStudents).toFixed(1) : '0';
  const docUploadRate = totalForms ? Math.round((totalCompleted / totalForms) * 100) : 0;

  const approvedN = applications.filter(a => a.status === 'Approved').length;
  const inReviewN = applications.filter(a => a.status === 'In Review').length;
  const actionN = applications.filter(a => a.status === 'Action Needed').length;
  const pieDone = totalStudents ? Math.round((approvedN / totalStudents) * 100) : 0;
  const piePending = totalStudents ? Math.round((inReviewN / totalStudents) * 100) : 0;
  const pieReview = Math.max(0, totalStudents ? Math.round((actionN / totalStudents) * 100) : 0);

  const handleDashboardDownload = async () => {
    setDashboardModal('download');
    try {
      const res = await fetch('/api/admin/dashboard-report/pdf', { credentials: 'include' });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        alert(err.error || 'Failed to generate dashboard PDF.');
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Dashboard_Report_${new Date().toISOString().slice(0, 10)}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } finally {
      setDashboardModal(null);
    }
  };

  const handleExportOverview = async () => {
    setExportOverviewActive(true);
    try {
      const res = await fetch('/api/admin/dashboard-report/pdf', { credentials: 'include' });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        alert(err.error || 'Failed to generate overview PDF.');
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Institution_Overview_${new Date().toISOString().slice(0, 10)}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } finally {
      setExportOverviewActive(false);
    }
  };

  const handleDashboardPrint = () => {
    const m = dashboardMetrics;
    const safe = (v: any) =>
      String(v ?? '').replace(/[<>&"]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;' }[c] as string));

    const win = window.open('', '_blank', 'noopener,noreferrer,width=900,height=700');
    if (!win) {
      alert('Pop-up blocked. Please allow pop-ups to print the report.');
      return;
    }

    const now = new Date();
    const year = now.getFullYear();
    const session = `${year} – ${year + 4}`;

    win.document.open();
    win.document.write(`<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>Dashboard Report</title>
    <style>
      body { font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif; margin: 24px; color: #111827; }
      h1 { margin: 0 0 4px; font-size: 20px; }
      .sub { color: #6b7280; font-size: 12px; margin-bottom: 16px; }
      .grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; margin: 16px 0 20px; }
      .card { border: 1px solid #e5e7eb; border-radius: 12px; padding: 12px 14px; }
      .label { font-size: 11px; color: #6b7280; text-transform: uppercase; letter-spacing: .08em; font-weight: 700; }
      .value { font-size: 24px; font-weight: 800; margin-top: 6px; }
      .small { font-size: 12px; color: #374151; margin-top: 6px; }
      table { width: 100%; border-collapse: collapse; margin-top: 10px; }
      th, td { border: 1px solid #e5e7eb; padding: 8px 10px; font-size: 12px; }
      th { background: #f9fafb; text-align: left; }
      @media print { body { margin: 10mm; } }
    </style>
  </head>
  <body>
    <h1>Dashboard Report</h1>
    <div class="sub">Academic session: ${safe(session)} • Generated: ${safe(now.toLocaleString())}${m?.asOf ? ` • Data as of: ${safe(new Date(m.asOf).toLocaleString())}` : ''}</div>
    <div class="grid">
      <div class="card"><div class="label">Total Registrations</div><div class="value">${safe(totalStudents)}</div><div class="small">All departments</div></div>
      <div class="card"><div class="label">Finished Forms</div><div class="value">${safe(m?.finishedForms ?? totalCompleted)}</div><div class="small">Fully submitted</div></div>
      <div class="card"><div class="label">Not Submitted</div><div class="value">${safe(m?.notSubmitted ?? totalPending)}</div><div class="small">Yet to submit</div></div>
      <div class="card"><div class="label">Partially Filled</div><div class="value">${safe(m?.partiallyFilled ?? '-')}</div><div class="small">Saved draft only</div></div>
      <div class="card"><div class="label">Not Started</div><div class="value">${safe(m?.notStarted ?? '-')}</div><div class="small">No draft, no submit</div></div>
      <div class="card"><div class="label">Completion Rate</div><div class="value">${safe(m?.completionRate ?? completionRate)}%</div><div class="small">Finished / Total</div></div>
    </div>

    <h2 style="font-size:14px;margin:0 0 8px;">Department analytics</h2>
    <table>
      <thead>
        <tr><th>Department</th><th>Students</th><th>Completed</th><th>Pending</th></tr>
      </thead>
      <tbody>
        ${deptStats.map(d => `<tr><td>${safe(d.name)}</td><td>${safe(d.students)}</td><td>${safe(d.completed)}</td><td>${safe(d.pending)}</td></tr>`).join('')}
      </tbody>
    </table>
    <script>
      window.focus();
      window.print();
      window.onafterprint = () => window.close();
    </script>
  </body>
</html>`);
    win.document.close();
  };

  const navItems = [
    { key: 'dashboard', icon: 'dashboard', label: 'Dashboard' },
    { key: 'applications', icon: 'description', label: 'Applications' },
    { key: 'studentsManagement', icon: 'groups', label: 'Student\'s Management' },
    { key: 'reports', icon: 'analytics', label: 'Reports' },
    { key: 'idCards', icon: 'badge', label: 'ID Cards' },
  ] as const;
  const handleDownloadIdCards = async () => {
    setIsDownloadingIdCards(true);
    try {
      const res = await fetch('/api/admin/id-cards-export');
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        alert(errData.error || 'No student details available to download.');
        return;
      }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ID_Cards_Data_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
    } catch (err) {
      alert('No student details available to download.');
      console.error(err);
    } finally {
      setIsDownloadingIdCards(false);
    }
  };


  const handleToggleLock = async (appId: string, isCurrentlyLocked: boolean) => {
    const nextLockState = !isCurrentlyLocked;
    const res = await fetch('/api/students/toggle-lock', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ application_number: appId, lock: nextLockState }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      alert(data.error || 'Failed to update lock status');
      return;
    }
    await loadApplications();
  };

  const handleExportClick = (type: 'PDF' | 'Excel', app: Application) => {
    setExportModalType(type);
    setExportModalApp(app);
  };

  // Handle PDF export
  const exportPDF = async (app: Application) => {
    try {
      const res = await fetch('/api/admin/export-pdf', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ applicationNumber: app.id }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${app.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (e: any) {
      console.error('PDF export failed:', e);
      alert('Failed to export PDF: ' + e.message);
    }
  };

  // Handle exports (PDF or Excel)
  useEffect(() => {
    if (!exportModalApp || !exportModalType) return;

    const performExport = async () => {
      if (exportModalType === 'PDF') {
        await exportPDF(exportModalApp);
      } else if (exportModalType === 'Excel') {
        await exportSingleStudent(exportModalApp);
      }

      // Close modal after 2 seconds
      const timer = setTimeout(() => {
        setExportModalType(null);
        setExportModalApp(null);
      }, 2000);

      return () => clearTimeout(timer);
    };

    performExport();
  }, [exportModalApp, exportModalType]);

  const handleSaveModalUpdates = async (updatedApp: Application) => {
    try {
      const payload: any = {
        application_number: updatedApp.id,
        full_name: updatedApp.name,
        date_of_birth: updatedApp.dob,
        academic_branch: updatedApp.department,
        father_name: updatedApp.fatherName,
        mother_name: updatedApp.motherName,
        father_mobile_number: updatedApp.fatherMobile,
        mobile_number: updatedApp.mobile,
      };

      // Add all additional fields
      const additionalFields = [
        // Additional Information
        'aadhar_number', 'student_age', 'student_gender',
        // Contact & Guardian
        'guardian_name', 'student_email', 'permanent_address', 'permanent_city', 'permanent_state',
        // Father Information
        'father_occupation', 'father_income',
        // Mother Information  
        'mother_occupation', 'mother_income', 'mother_mobile',
        // Personal Details
        'mother_tongue', 'nationality', 'caste', 'religion', 'residential_status',
        'day_scholar_need_bus', 'bus_district', 'bus_area', 'nearby_bus_stop',
        'student_specially_abled', 'tn_study', 'govt_school',
        // Academic Information
        'admission_date', 'admission_year', 'board_studied', 'admission_batch', 
        'mark_cutoff', 'pcm_target', 'mark_physics', 'mark_chemistry', 'mark_maths',
        // Other Information
        'admission_allotment_number', 'admission_category', 'emis_number', 'civic_status',
        'school_location', 'relative_name', 'hear_about_psna',
        // Class-wise information (VI-XII)
        'school_VI_year_passing', 'school_VI_name', 'school_VI_category', 'school_VI_medium', 'school_VI_block', 'school_VI_score',
        'school_VII_year_passing', 'school_VII_name', 'school_VII_category', 'school_VII_medium', 'school_VII_block', 'school_VII_score',
        'school_VIII_year_passing', 'school_VIII_name', 'school_VIII_category', 'school_VIII_medium', 'school_VIII_block', 'school_VIII_score',
        'school_IX_year_passing', 'school_IX_name', 'school_IX_category', 'school_IX_medium', 'school_IX_block', 'school_IX_score',
        'school_X_year_passing', 'school_X_name', 'school_X_category', 'school_X_medium', 'school_X_block', 'school_X_score',
        'school_XI_year_passing', 'school_XI_name', 'school_XI_category', 'school_XI_medium', 'school_XI_block', 'school_XI_score',
        'school_XII_year_passing', 'school_XII_name', 'school_XII_category', 'school_XII_medium', 'school_XII_block', 'school_XII_score',
      ];

      additionalFields.forEach(field => {
        if ((updatedApp as any)[field] != null) {
          payload[field] = (updatedApp as any)[field];
        }
      });

      console.log('Sending update payload:', payload);
      
      const res = await fetch('/api/students', {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      
      const data = await res.json().catch(() => ({}));
      console.log('Update response:', res.status, data);
      
      if (res.ok) {
        console.log('Update successful, reloading applications...');
        await loadApplications();
        setSmViewApp(null);
      } else {
        alert(data.error || 'Failed to update student');
        console.error('Update error:', data);
      }
    } catch (error) {
      console.error('Error updating student:', error);
      alert('Error updating student');
    }
  };

  const deptsChart = useMemo(() => {
    const map = new Map<string, number>();
    for (const a of applications) {
      const k = a.department || 'Unknown';
      map.set(k, (map.get(k) || 0) + 1);
    }
    const entries = Array.from(map.entries()).map(([key, count]) => ({
      name: key.length > 16 ? key.slice(0, 14) + '…' : key,
      key,
      base: count,
    })).sort((a, b) => b.base - a.base);
    return entries.length ? entries : [{ name: 'No data', key: '_', base: 0 }];
  }, [applications]);

  const filteredApps = applications.filter(a =>
    a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const appTabFilteredApps = applications.filter(a =>
    a.name.toLowerCase().includes(appSearchQuery.toLowerCase()) ||
    a.id.toLowerCase().includes(appSearchQuery.toLowerCase())
  );

  const smFilteredApps = applications.filter((a) => {
    if (a.completionStatus !== smCategory) return false;
    if (!smSearchQuery.trim()) return true;
    const q = smSearchQuery.toLowerCase();
    return a.id.toLowerCase().includes(q) || a.name.toLowerCase().includes(q);
  });

  const openedFormStudents = applications.filter((a) => a.formOpenedAt);

  if (!authChecked) {
    return (
      <div className="min-h-screen bg-[#f8f6f4] flex items-center justify-center text-[#18281e]">
        <p className="text-sm font-semibold tracking-wide">Loading admin portal…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f6f4] text-[#18281e] antialiased overflow-x-hidden flex flex-col"
      style={{ fontFamily: 'Inter,-apple-system,BlinkMacSystemFont,sans-serif' }}>
      <style dangerouslySetInnerHTML={{
        __html: `
        .font-headline{font-family:'Manrope',sans-serif}
        .material-symbols-outlined{font-variation-settings:'FILL' 0,'wght' 400,'GRAD' 0,'opsz' 24;vertical-align:middle}
        .mso-fill{font-variation-settings:'FILL' 1,'wght' 400,'GRAD' 0,'opsz' 24}
        .glass{background:rgba(252,249,248,0.85);backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px)}
        .sidebar-link{transition:all .15s ease}
        .sidebar-link.active{background:#18281e;color:#fff;box-shadow:0 4px 14px rgba(24,40,30,.22)}
        .sidebar-link:not(.active):hover{background:#f0eded}
        @keyframes fadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
        .fade-up{animation:fadeUp .4s ease both}
        @keyframes barIn{from{transform:scaleX(0)}to{transform:scaleX(1)}}
        .bar-enter{animation:barIn .6s cubic-bezier(.25,.46,.45,.94) both;transform-origin:left}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:.45}}
        .pulse-dot{animation:pulse 2s ease-in-out infinite}
        @keyframes modalIn{from{opacity:0;transform:scale(.95)}to{opacity:1;transform:scale(1)}}
        .modal-card{animation:modalIn .25s ease both}
        .modal-backdrop{animation:fadeUp .2s ease both}
        .section-tab{padding:14px 0;font-size:11px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:#737873;border-bottom:2px solid transparent;white-space:nowrap;transition:all .15s ease;flex-shrink:0}
        .section-tab:hover{color:#18281e}
        .active-tab{color:#18281e;border-bottom-color:#18281e}
        @keyframes floatY{0%,100%{transform:translateY(0px)}50%{transform:translateY(-5px)}}
        .float-anim{animation:floatY 3.5s ease-in-out infinite}
        @keyframes floatY2{0%,100%{transform:translateY(0px)}50%{transform:translateY(-7px)}}
        .float-anim2{animation:floatY2 4.5s ease-in-out infinite}
        @keyframes shimmerSlide{0%{transform:translateX(-100%)}100%{transform:translateX(200%)}}
        .session-shimmer::after{content:'';position:absolute;inset:0;background:linear-gradient(105deg,transparent 40%,rgba(255,255,255,0.13) 50%,transparent 60%);animation:shimmerSlide 3s ease-in-out infinite}
        @keyframes glowPulse{0%,100%{box-shadow:0 0 12px 2px rgba(254,166,25,0.25)}50%{box-shadow:0 0 22px 6px rgba(254,166,25,0.45)}}
        .glow-pulse{animation:glowPulse 2.5s ease-in-out infinite}
        @keyframes badgeIn{from{opacity:0;transform:scale(.8) translateY(6px)}to{opacity:1;transform:scale(1) translateY(0)}}
        .badge-in{animation:badgeIn .5s cubic-bezier(.34,1.56,.64,1) both}
      `}} />

      {/* ════════════════════════════════════════════════════════════
          TOP APP BAR
      ════════════════════════════════════════════════════════════ */}
      <header className="fixed top-0 w-full z-50 glass border-b border-[#e5e2e1] flex items-center justify-between p-6 h-auto min-h-[96px]">
        {/* Left: hamburger + logo + name */}
        <div className="flex items-center gap-3 min-w-0">
          <button className="md:hidden p-2 rounded-xl hover:bg-[#f0eded] transition-colors flex-shrink-0"
            onClick={() => setIsMobileSidebarOpen(true)}>
            <span className="material-symbols-outlined text-[22px]">menu</span>
          </button>
          <img src="/psna.png" alt="PSNA Logo" className="h-[52px] md:h-[60px] w-auto object-contain flex-shrink-0" />
          <div className="hidden lg:flex flex-col justify-center min-w-0 pl-1 mt-1">
            <h1 className="text-[18px] md:text-[22px] font-black tracking-tighter text-[#033626] leading-none mb-0.5" style={{ fontFamily: '"Arial", sans-serif' }}>
              PSNA
            </h1>
            <h2 className="text-[10px] md:text-[11px] font-bold text-[#033626] uppercase tracking-[0.02em] leading-none mt-0.5">
              COLLEGE OF ENGINEERING & TECHNOLOGY
            </h2>
            <span className="text-[9px] font-bold text-[#033626] tracking-wide mt-1 leading-none drop-shadow-sm">
              (An Autonomous Institution)
            </span>
            <div className="h-[1.5px] w-[250px] bg-[#033626] mt-1 mb-1" />
            <span className="text-[8px] font-extrabold text-[#033626] tracking-wider uppercase leading-none drop-shadow-sm">
              AICTE | Anna University | NBA | NAAC A++
            </span>
          </div>
        </div>

        {/* Right: search + profile */}
        <div className="flex items-center gap-3 flex-shrink-0">
          {activeTab === 'dashboard' && (
            <div className="relative hidden lg:block">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[17px] text-[#737873]">search</span>
              <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                className="h-9 w-52 pl-9 pr-3 bg-[#f0eded] rounded-xl text-sm text-[#18281e] placeholder:text-[#737873] outline-none focus:ring-2 focus:ring-[#18281e]/15 transition-all"
                placeholder="Search…" />
            </div>
          )}
          <div className="relative" ref={profileRef}>
            <button onClick={() => setIsProfileOpen(p => !p)}
              className="flex items-center gap-2 pl-1 pr-3 py-1.5 rounded-xl hover:bg-[#f0eded] transition-colors">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#18281e] to-[#516356] flex items-center justify-center text-white font-bold text-sm flex-shrink-0">A</div>
              <div className="hidden md:flex flex-col leading-none">
                <span className="text-xs font-bold text-[#18281e]">Admin</span>
                <span className="text-[9px] text-[#737873] mt-0.5">Institutional</span>
              </div>
              <span className="material-symbols-outlined text-[16px] text-[#737873] hidden md:block"
                style={{ transform: isProfileOpen ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }}>expand_more</span>
            </button>

            {isProfileOpen && (
              <div className="absolute top-[calc(100%+6px)] right-0 w-52 bg-white rounded-2xl shadow-2xl border border-[#e5e2e1] overflow-hidden z-[100]">
                <div className="px-4 py-3 border-b border-[#f0eded]">
                  <p className="text-sm font-bold text-[#18281e]">Admin Account</p>
                  <p className="text-[10px] text-[#737873] mt-0.5 font-mono">{adminUsername || 'admin'}</p>
                </div>
                <button
                  onClick={() => { setIsProfileOpen(false); setShowAccountSettings(true); }}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm font-semibold text-[#18281e] hover:bg-[#f0eded] transition-colors">
                  <span className="material-symbols-outlined text-[18px] text-[#737873]">manage_accounts</span>Account Settings
                </button>
                <div className="h-px bg-[#f0eded]" />
                <button onClick={handleLogout}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50 transition-colors">
                  <span className="material-symbols-outlined text-[18px]">logout</span>Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ════════════════════════════════════════════════════════════
          BODY
      ════════════════════════════════════════════════════════════ */}
      <div className="flex flex-1 pt-[96px]">
        {isMobileSidebarOpen && (
          <div className="fixed inset-0 bg-black/30 backdrop-blur-[2px] z-30 md:hidden"
            onClick={() => setIsMobileSidebarOpen(false)} />
        )}

        {/* ── SIDEBAR ── */}
        <aside className={`
          ${isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0
          fixed md:sticky top-[96px] left-0 h-[calc(100vh-96px)]
          w-64 bg-white border-r border-[#e5e2e1] flex flex-col p-4 z-40
          shadow-2xl md:shadow-none transition-transform duration-300 ease-out
        `}>
          <button className="md:hidden absolute top-3 right-3 p-1.5 rounded-full hover:bg-[#f0eded]"
            onClick={() => setIsMobileSidebarOpen(false)}>
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>

          <div className="mt-2 mb-1" />

          <nav className="flex flex-col gap-1">
            {navItems.map(item => (
              <button key={item.key} onClick={() => { setActiveTab(item.key); setIsMobileSidebarOpen(false); }}
                className={`sidebar-link w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold ${activeTab === item.key ? 'active' : 'text-[#434844]'}`}>
                <span className={`material-symbols-outlined text-[20px] ${activeTab === item.key ? 'mso-fill text-[#b8e6c8]' : 'text-[#737873]'}`}>{item.icon}</span>
                {item.label}
                {activeTab === item.key && <span className="ml-auto w-2 h-2 rounded-full bg-[#fea619] pulse-dot" />}
              </button>
            ))}
          </nav>

          <div className="mt-auto pt-4 border-t border-[#f0eded]">
            {/* ── Premium Animated Academic Year Badge ── */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#18281e] via-[#22382a] to-[#0f1e14] p-4 shadow-lg glow-pulse session-shimmer badge-in float-anim">
              {/* Decorative blobs */}
              <div className="absolute -top-4 -right-4 w-16 h-16 rounded-full bg-[#fea619]/25 float-anim2 blur-[2px]" />
              <div className="absolute -bottom-5 -left-5 w-14 h-14 rounded-full bg-white/8 float-anim" />
              <div className="absolute top-2 right-12 w-2 h-2 rounded-full bg-[#fea619]/60 float-anim2" />
              {/* Content */}
              <div className="relative z-10">
                <div className="flex items-center gap-1.5 mb-2.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#fea619] pulse-dot flex-shrink-0" />
                  <p className="text-[8px] font-black uppercase tracking-[0.22em] text-white/40">Active Session</p>
                </div>
                <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-[#b8e6c8] mb-1">Academic Year</p>
                <p className="font-headline text-base font-black text-white leading-none tracking-tight">
                  {(() => { const y = new Date().getFullYear(); return `${y} – ${y + 4}`; })()}
                </p>
                <div className="mt-3 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[11px] text-[#fea619]">school</span>
                  <p className="text-[8px] font-semibold text-white/40">PSNA College of Engineering</p>
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* ── MAIN ── */}
        <main className="flex-1 min-w-0 p-5 md:p-8 overflow-y-auto">

          {/* ████████  DASHBOARD TAB  ████████ */}
          {activeTab === 'dashboard' && (
            <div className="fade-up max-w-7xl mx-auto pb-12 space-y-7">

              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h1 className="font-headline text-2xl font-extrabold text-[#18281e]">Dashboard Overview</h1>
                  <p className="text-xs text-[#737873] mt-1">Admin Portal</p>
                </div>
                <div className="flex items-center gap-2.5 flex-shrink-0">
                  <button onClick={handleDashboardDownload} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#18281e] text-white text-xs font-bold hover:bg-[#2d4a35] transition-colors shadow-sm">
                    <span className="material-symbols-outlined text-[16px]">download</span>Download Report
                  </button>
                  <button onClick={handleDashboardPrint} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-[#e5e2e1] text-[#18281e] text-xs font-bold hover:bg-[#f0eded] transition-colors shadow-sm">
                    <span className="material-symbols-outlined text-[16px]">print</span>Print Report
                  </button>
                </div>
              </div>

              {/* Metric Cards */}
              <section className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
                <MetricCard icon="how_to_reg" label="Total Registrations" value={totalStudents} sub="All departments" theme="dark" />
                <MetricCard icon="task_alt" label="Finished Forms" value={dashboardMetrics?.finishedForms ?? totalCompleted} sub="Fully submitted" theme="green" />
                <MetricCard icon="pending_actions" label="Not Submitted" value={dashboardMetrics?.notSubmitted ?? totalPending} sub="Yet to submit" theme="white" />
                <MetricCard icon="edit_note" label="Partially Filled" value={dashboardMetrics?.partiallyFilled ?? 0} sub="Saved draft only" theme="white" />
                <MetricCard icon="hourglass_empty" label="Not Started" value={dashboardMetrics?.notStarted ?? 0} sub="No draft / no submit" theme="white" />
                <MetricCard icon="verified" label="Completion Rate" value={`${completionRate}%`} sub="Overall progress" theme="amber" />
              </section>

              {/* Divider */}
              <div className="flex items-center gap-4">
                <div className="h-px flex-1 bg-[#e5e2e1]" />
                <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#737873] px-1">Department Analytics</span>
                <div className="h-px flex-1 bg-[#e5e2e1]" />
              </div>

              {/* Analytics Card with inner tabs */}
              <div className="bg-white rounded-3xl border border-[#e5e2e1] shadow-sm overflow-hidden">
                <div className="flex border-b border-[#f0eded] px-8 overflow-x-auto gap-10 bg-[#fafaf9]">
                  {([
                    { key: 'dept', label: 'Department-wise Analytics' },
                    { key: 'completion', label: 'Completion Rate' },
                    { key: 'students', label: 'Students per Dept.' },
                    { key: 'recent', label: 'Recent Submissions' },
                  ] as const).map(s => (
                    <button key={s.key} onClick={() => setActiveSection(s.key)}
                      className={`section-tab ${activeSection === s.key ? 'active-tab' : ''}`}>
                      {s.label}
                    </button>
                  ))}
                </div>

                {/* Dept-wise Analytics */}
                {activeSection === 'dept' && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left min-w-[580px]">
                      <thead>
                        <tr className="border-b border-[#f0eded]">
                          <th className="py-3.5 px-5 text-[10px] font-black uppercase tracking-[0.12em] text-[#737873] bg-[#fafaf9] w-16">S.No</th>
                          <th className="py-3.5 px-5 text-[10px] font-black uppercase tracking-[0.12em] text-[#737873] bg-[#fafaf9]">Department</th>
                          <th className="py-3.5 px-5 text-[10px] font-black uppercase tracking-[0.12em] text-[#737873] bg-[#fafaf9] text-center">No. of Students</th>
                          <th className="py-3.5 px-5 text-[10px] font-black uppercase tracking-[0.12em] text-[#737873] bg-[#fafaf9] text-center">Documents</th>
                          <th className="py-3.5 px-5 text-[10px] font-black uppercase tracking-[0.12em] text-[#737873] bg-[#fafaf9] w-48">Progress</th>
                        </tr>
                      </thead>
                      <tbody>
                        {deptStats.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="py-12 text-center text-sm text-[#737873] font-medium">
                              No department data yet. Enroll a student in Applications to see analytics.
                            </td>
                          </tr>
                        ) : (
                          deptStats.map((d, i) => {
                            const pct = d.students ? Math.round((d.completed / d.students) * 100) : 0;
                            return (
                              <tr key={d.name} className="border-b border-[#f0eded] last:border-0 hover:bg-[#fafaf9] transition-colors group">
                                <td className="py-4 px-5 text-[11px] font-bold text-[#b0b0a8]">{String(i + 1).padStart(2, '0')}</td>
                                <td className="py-4 px-5">
                                  <div className="flex items-center gap-3">
                                    <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${BAR_COLORS[i % BAR_COLORS.length]} flex items-center justify-center flex-shrink-0 shadow-sm`}>
                                      <span className="text-white text-[9px] font-black leading-tight">{d.short.substring(0, 2)}</span>
                                    </div>
                                    <span className="text-sm font-semibold text-[#18281e]">{d.name}</span>
                                  </div>
                                </td>
                                <td className="py-4 px-5 text-center font-headline text-sm font-black text-[#18281e]">{d.students}</td>
                                <td className="py-4 px-5 text-center">
                                  <span className="text-sm font-bold text-[#18281e]">{d.completed}</span>
                                  <span className="text-[10px] text-[#737873] ml-1">/ {d.students}</span>
                                </td>
                                <td className="py-4 px-5">
                                  <div className="flex items-center gap-2.5">
                                    <div className="flex-1 h-2 rounded-full bg-[#f0eded] overflow-hidden min-w-[60px]">
                                      <div className={`h-full bg-gradient-to-r ${BAR_COLORS[i % BAR_COLORS.length]} bar-enter rounded-full`}
                                        style={{ width: `${pct}%`, animationDelay: `${i * 45}ms` }} />
                                    </div>
                                    <span className="text-[11px] font-bold text-[#18281e] w-8 text-right flex-shrink-0">{pct}%</span>
                                  </div>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Completion Rate */}
                {activeSection === 'completion' && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left min-w-[640px]">
                      <thead>
                        <tr className="border-b border-[#f0eded]">
                          {['Department', 'Students', 'Completion Rate', 'Pending', 'Status'].map((h, i) => (
                            <th key={h} className={`py-3.5 px-5 text-[10px] font-black uppercase tracking-[0.12em] text-[#737873] bg-[#fafaf9] ${i >= 1 ? 'text-center' : ''}`}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {deptStats.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="py-12 text-center text-sm text-[#737873] font-medium">No data yet.</td>
                          </tr>
                        ) : (
                          deptStats.map((d, i) => {
                            const pct = d.students ? Math.round((d.completed / d.students) * 100) : 0;
                            const [sLabel, sStyle] = pct >= 90
                              ? ['Excellent', 'bg-emerald-50 border-emerald-200 text-emerald-700']
                              : pct >= 75 ? ['Good', 'bg-blue-50 border-blue-200 text-blue-700']
                                : pct >= 60 ? ['Average', 'bg-amber-50 border-amber-200 text-amber-700']
                                  : ['Poor', 'bg-red-50 border-red-200 text-red-700'];
                            return (
                              <tr key={d.name} className="border-b border-[#f0eded] last:border-0 hover:bg-[#fafaf9] transition-colors">
                                <td className="py-4 px-5 text-sm font-semibold text-[#18281e]">{d.name}</td>
                                <td className="py-4 px-5 text-center font-bold text-sm text-[#18281e]">{d.students}</td>
                                <td className="py-4 px-5">
                                  <div className="flex items-center justify-center gap-2.5">
                                    <div className="w-28 h-2 rounded-full bg-[#f0eded] overflow-hidden">
                                      <div className={`h-full bg-gradient-to-r ${BAR_COLORS[i % BAR_COLORS.length]} bar-enter rounded-full`}
                                        style={{ width: `${pct}%`, animationDelay: `${i * 40}ms` }} />
                                    </div>
                                    <span className="text-sm font-black text-[#18281e] w-10 flex-shrink-0">{pct}%</span>
                                  </div>
                                </td>
                                <td className="py-4 px-5 text-center text-sm font-bold text-red-600">{d.pending}</td>
                                <td className="py-4 px-5 text-center">
                                  <span className={`inline-flex px-2.5 py-1 rounded-full border text-[10px] font-bold ${sStyle}`}>{sLabel}</span>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Students per Dept */}
                {activeSection === 'students' && (
                  <div className="p-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {deptStats.length === 0 ? (
                      <p className="col-span-full text-center text-sm text-[#737873] py-8">No students per department yet.</p>
                    ) : (
                      deptStats.map((d, i) => {
                        const maxS = deptStats[0]?.students || 1;
                        const pct = Math.round((d.students / maxS) * 100);
                        return (
                          <div key={d.name} className="flex items-center gap-3 p-4 rounded-2xl bg-[#f8f6f4] border border-[#e5e2e1] hover:shadow-sm hover:border-[#c3c8c2] transition-all">
                            <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${BAR_COLORS[i % BAR_COLORS.length]} flex items-center justify-center flex-shrink-0 shadow-sm`}>
                              <span className="text-white text-[9px] font-black text-center leading-tight">{d.short}</span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-bold text-[#18281e] truncate">{d.name}</p>
                              <div className="flex items-center gap-2 mt-1.5">
                                <div className="flex-1 h-1.5 rounded-full bg-[#e5e2e1] overflow-hidden">
                                  <div className={`h-full bg-gradient-to-r ${BAR_COLORS[i % BAR_COLORS.length]} bar-enter rounded-full`}
                                    style={{ width: `${pct}%`, animationDelay: `${i * 45}ms` }} />
                                </div>
                                <span className="font-headline text-sm font-black text-[#18281e] flex-shrink-0">{d.students}</span>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                )}

                {/* Recent Submissions */}
                {activeSection === 'recent' && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left min-w-[560px]">
                      <thead>
                        <tr className="border-b border-[#f0eded]">
                          {['Date', 'Student', 'Department', 'Status'].map(h => (
                            <th key={h} className="py-3.5 px-5 text-[10px] font-black uppercase tracking-[0.12em] text-[#737873] bg-[#fafaf9]">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {applications.length === 0 ? (
                          <tr>
                            <td colSpan={4} className="py-12 text-center text-sm text-[#737873] font-medium">No submissions yet.</td>
                          </tr>
                        ) : (
                          applications.slice(0, 12).map((app) => (
                            <tr key={app.id} className="border-b border-[#f0eded] last:border-0 hover:bg-[#fafaf9] transition-colors">
                              <td className="py-4 px-5 text-xs font-medium text-[#737873] whitespace-nowrap">{app.date}</td>
                              <td className="py-4 px-5">
                                <div className="flex items-center gap-2.5">
                                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#18281e] to-[#516356] flex items-center justify-center text-white font-bold text-[10px] flex-shrink-0">
                                    {app.initials}
                                  </div>
                                  <span className="text-sm font-semibold text-[#18281e] whitespace-nowrap">{app.name}</span>
                                </div>
                              </td>
                              <td className="py-4 px-5 text-sm text-[#434844]">{app.department || '—'}</td>
                              <td className="py-4 px-5"><StatusBadge status={app.status} /></td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Bottom row: Pie chart + Key metrics */}
              <div className="grid grid-cols-1 lg:grid-cols-8 gap-5">
                {/* Pie chart */}
                <div className="lg:col-span-3 bg-white rounded-3xl border border-[#e5e2e1] shadow-sm p-6 flex flex-col items-center gap-5">
                  <div className="w-full">
                    <p className="font-headline text-sm font-bold text-[#18281e] mb-0.5">Completion Overview</p>
                    <p className="text-[10px] text-[#737873]">Document submission status across departments</p>
                  </div>
                  <div className="relative w-36 h-36 flex-shrink-0">
                    <svg viewBox="0 0 42 42" className="-rotate-90 w-full h-full drop-shadow">
                      <circle cx="21" cy="21" r="15.9155" fill="transparent" stroke="#f0eded" strokeWidth="5.5" />
                      <circle cx="21" cy="21" r="15.9155" fill="transparent" stroke="#18281e" strokeWidth="5.5"
                        strokeDasharray={`${pieDone} ${100 - pieDone}`} strokeDashoffset="0" />
                      <circle cx="21" cy="21" r="15.9155" fill="transparent" stroke="#fea619" strokeWidth="5.5"
                        strokeDasharray={`${piePending} ${100 - piePending}`} strokeDashoffset={`-${pieDone}`} />
                      <circle cx="21" cy="21" r="15.9155" fill="transparent" stroke="#ef4444" strokeWidth="5.5"
                        strokeDasharray={`${pieReview} ${100 - pieReview}`} strokeDashoffset={`-${pieDone + piePending}`} />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="font-headline text-xl font-black text-[#18281e] leading-none">{completionRate}%</span>
                      <span className="text-[9px] text-[#737873] font-bold mt-0.5">Complete</span>
                    </div>
                  </div>
                  <div className="flex-1 w-full space-y-2.5">
                    {[
                      { label: 'Completed', val: pieDone, color: 'bg-[#18281e]' },
                      { label: 'Pending', val: piePending, color: 'bg-[#fea619]' },
                      { label: 'In Review', val: pieReview, color: 'bg-red-500' },
                    ].map(r => (
                      <div key={r.label} className="flex items-center gap-2.5 p-2.5 rounded-xl hover:bg-[#fafaf9] transition-colors">
                        <div className={`w-3 h-3 rounded-full ${r.color} flex-shrink-0`} />
                        <span className="text-xs font-semibold text-[#434844] flex-1">{r.label}</span>
                        <span className="font-headline text-sm font-black text-[#18281e]">{r.val}%</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Key metrics */}
                <div className="lg:col-span-5 grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {[
                    { label: 'Avg. Completion Rate', value: `${completionRate}%`, icon: 'trending_up', iconBg: 'bg-[#dcfce7]', iconColor: 'text-[#14532d]', valColor: 'text-[#14532d]', barColor: 'bg-[#18281e]', barW: completionRate },
                    { label: 'Document Upload Rate', value: `${docUploadRate}%`, icon: 'upload_file', iconBg: 'bg-[#fef3c7]', iconColor: 'text-amber-700', valColor: 'text-amber-700', barColor: 'bg-[#fea619]', barW: docUploadRate },
                    { label: 'Avg. Docs / Student', value: avgDocs, icon: 'folder_copy', iconBg: 'bg-[#ede9fe]', iconColor: 'text-violet-700', valColor: 'text-violet-700', barColor: 'bg-violet-500', barW: Math.min(parseFloat(avgDocs) * 100, 100) },
                  ].map(m => (
                    <div key={m.label} className="bg-white rounded-3xl border border-[#e5e2e1] shadow-sm p-5 flex flex-col gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${m.iconBg}`}>
                        <span className={`material-symbols-outlined text-[20px] ${m.iconColor}`}>{m.icon}</span>
                      </div>
                      <div>
                        <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-[#737873]">{m.label}</p>
                        <p className={`font-headline text-3xl font-black mt-1 ${m.valColor} leading-none`}>{m.value}</p>
                      </div>
                      <div className="h-1.5 rounded-full bg-[#f0eded] overflow-hidden">
                        <div className={`h-full ${m.barColor} rounded-full bar-enter`} style={{ width: `${m.barW}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

          {/* ████████  APPLICATIONS TAB  ████████ */}
          {activeTab === 'applications' && (
            <div className="fade-up max-w-5xl mx-auto pb-16">

              {/* Page Header */}
              <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-5">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#737873] mb-2">Admission Management</p>
                  <h1 className="font-headline text-4xl font-extrabold text-[#18281e] leading-tight mb-3">
                    Student Admission
                  </h1>
                  <p className="text-[#737873] text-sm leading-relaxed">
                    Register a new scholar into the institutional database. Ensure all credentials mirror official documentation.
                  </p>
                </div>
                <div>
                  <input type="file" ref={fileInputRef} className="hidden" accept=".xlsx, .xls, .csv" onChange={handleExcelUpload} />
                  <button type="button" onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 px-5 py-3 bg-[#18281e] text-white text-sm font-bold rounded-xl hover:bg-[#2d4a35] active:scale-[0.98] transition-all shadow-md shrink-0">
                    <span className="material-symbols-outlined text-[20px]">upload_file</span>
                    Bulk Upload (Excel / CSV)
                  </button>
                </div>
              </div>

              {/* Bento Grid */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-5">

                {/* LEFT: 8-col form cards */}
                <div className="md:col-span-8 space-y-5">

                  {/* Personal Information */}
                  <div className="bg-white rounded-2xl border border-[#e5e2e1] shadow-sm p-7">
                    <h3 className="font-headline text-base font-bold text-[#18281e] mb-6 flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-[#f0eded] flex items-center justify-center">
                        <span className="material-symbols-outlined text-[16px] text-[#18281e]">person</span>
                      </div>
                      Personal Information
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[9px] font-bold text-[#434844] uppercase tracking-[0.13em]">Application Number</label>
                        <input name="id" value={formData.id} onChange={handleInputChange} type="text" readOnly={isEditing}
                          className="w-full h-11 px-4 bg-[#f8f6f4] border border-transparent rounded-[12px] text-sm text-[#18281e] font-mono placeholder:text-[#b0b0a8] outline-none focus:bg-white focus:border-black focus:ring-[3px] focus:ring-black/10 focus:shadow-[0_8px_30px_rgba(0,0,0,0.12)] transition-all read-only:opacity-80"
                          placeholder="e.g. APP-2024-001" />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[9px] font-bold text-[#434844] uppercase tracking-[0.13em]">Full Legal Name <span className="text-red-500">*</span></label>
                        <input name="name" value={formData.name} onChange={handleInputChange} type="text" required
                          className="w-full h-11 px-4 bg-[#f8f6f4] border border-transparent rounded-[12px] text-sm text-[#18281e] font-medium placeholder:text-[#b0b0a8] outline-none focus:bg-white focus:border-black focus:ring-[3px] focus:ring-black/10 focus:shadow-[0_8px_30px_rgba(0,0,0,0.12)] transition-all"
                          placeholder="As per official documents" />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[9px] font-bold text-[#434844] uppercase tracking-[0.13em]">Date of Birth</label>
                        <input name="dob" value={formData.dob} onChange={handleInputChange} type="date"
                          className="w-full h-11 px-4 bg-[#f8f6f4] border border-transparent rounded-[12px] text-sm text-[#18281e] font-medium outline-none focus:bg-white focus:border-black focus:ring-[3px] focus:ring-black/10 focus:shadow-[0_8px_30px_rgba(0,0,0,0.12)] cursor-pointer transition-all" />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[9px] font-bold text-[#434844] uppercase tracking-[0.13em]">Academic Branch</label>
                        <select name="department" value={formData.department} onChange={handleInputChange}
                          className="w-full h-11 pl-4 pr-10 bg-[#f8f6f4] border border-transparent rounded-[12px] text-sm text-[#18281e] font-medium outline-none focus:bg-white focus:border-black focus:ring-[3px] focus:ring-black/10 focus:shadow-[0_8px_30px_rgba(0,0,0,0.12)] appearance-none cursor-pointer transition-all">
                          <option value="">Select Branch</option>
                          {[
                            ['AI&DS', 'Artificial Intelligence and Data Science'],
                            ['AI&ML', 'Artificial Intelligence and Machine Learning'],
                            ['BME', 'Bio Medical Engineering'],
                            ['CIVIL', 'Civil Engineering'],
                            ['CS&BS', 'Computer Science Business System'],
                            ['CSE', 'Computer Science and Engineering'],
                            ['CYBER', 'Cyber Security'],
                            ['ECE', 'Electronics and Communication Engineering'],
                            ['EEE', 'Electrical and Electronics Engineering'],
                            ['IT', 'Information Technology'],
                            ['MECH', 'Mechanical Engineering'],
                            ['VLSI', 'VLSI Design'],
                            ...customDepts.map(d => [d.short, d.full]),
                          ].map(([short, full]) => (
                            <option key={short} value={short}>{short} — {full}</option>
                          ))}
                        </select>
                      </div>
                      {/* Father Name & Mother Name */}
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[9px] font-bold text-[#434844] uppercase tracking-[0.13em]">Father&apos;s Name</label>
                        <input name="fatherName" value={formData.fatherName} onChange={handleInputChange} type="text"
                          className="w-full h-11 px-4 bg-[#f8f6f4] border border-transparent rounded-[12px] text-sm text-[#18281e] font-medium placeholder:text-[#b0b0a8] outline-none focus:bg-white focus:border-black focus:ring-[3px] focus:ring-black/10 focus:shadow-[0_8px_30px_rgba(0,0,0,0.12)] transition-all"
                          placeholder="Father's full name" />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[9px] font-bold text-[#434844] uppercase tracking-[0.13em]">Mother&apos;s Name</label>
                        <input name="motherName" value={formData.motherName} onChange={handleInputChange} type="text"
                          className="w-full h-11 px-4 bg-[#f8f6f4] border border-transparent rounded-[12px] text-sm text-[#18281e] font-medium placeholder:text-[#b0b0a8] outline-none focus:bg-white focus:border-black focus:ring-[3px] focus:ring-black/10 focus:shadow-[0_8px_30px_rgba(0,0,0,0.12)] transition-all"
                          placeholder="Mother's full name" />
                      </div>
                    </div>
                  </div>

                  {/* ── Department Settings Panel ── */}
                  <div className="bg-white rounded-2xl border border-[#e5e2e1] shadow-sm overflow-hidden">
                    <button
                      onClick={() => setShowDeptPanel(p => !p)}
                      className="w-full flex items-center justify-between px-7 py-4 hover:bg-[#fafaf9] transition-colors"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-[#18281e] flex items-center justify-center">
                          <span className="material-symbols-outlined text-[15px] text-[#b8e6c8]">settings</span>
                        </div>
                        <div className="text-left">
                          <p className="text-sm font-bold text-[#18281e]">Department Settings</p>
                          <p className="text-[9px] text-[#737873] font-medium uppercase tracking-wide">Manage available departments</p>
                        </div>
                      </div>
                      <span className="material-symbols-outlined text-[20px] text-[#737873] transition-transform duration-200"
                        style={{ transform: showDeptPanel ? 'rotate(180deg)' : 'none' }}>expand_more</span>
                    </button>

                    {showDeptPanel && (
                      <div className="px-7 pb-6 space-y-5 border-t border-[#f0eded]">
                        {/* Add new dept */}
                        <div className="pt-5">
                          <p className="text-[9px] font-black uppercase tracking-[0.16em] text-[#737873] mb-3">Add New Department</p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="flex flex-col gap-1.5">
                              <label className="text-[9px] font-bold text-[#434844] uppercase tracking-[0.12em]">Short Code <span className="text-red-500">*</span></label>
                              <input value={newDeptShort} onChange={e => setNewDeptShort(e.target.value)}
                                className="h-10 px-3.5 bg-[#f8f6f4] border border-[#e5e2e1] rounded-xl text-sm text-[#18281e] font-mono placeholder:text-[#b0b0a8] outline-none focus:ring-2 focus:ring-[#18281e]/20 transition-all"
                                placeholder="e.g. ECE" maxLength={8} />
                            </div>
                            <div className="flex flex-col gap-1.5">
                              <label className="text-[9px] font-bold text-[#434844] uppercase tracking-[0.12em]">Full Department Name <span className="text-red-500">*</span></label>
                              <input value={newDeptFull} onChange={e => setNewDeptFull(e.target.value)}
                                className="h-10 px-3.5 bg-[#f8f6f4] border border-[#e5e2e1] rounded-xl text-sm text-[#18281e] placeholder:text-[#b0b0a8] outline-none focus:ring-2 focus:ring-[#18281e]/20 transition-all"
                                placeholder="e.g. Electronics & Communication" />
                            </div>
                          </div>
                          {deptMsg && (
                            <p className={`text-xs font-semibold mt-2 ${deptMsg.startsWith('✅') ? 'text-emerald-600' : 'text-red-600'}`}>{deptMsg}</p>
                          )}
                          <button onClick={handleAddDept}
                            className="mt-3 flex items-center gap-2 px-5 py-2.5 bg-[#18281e] text-white text-xs font-bold rounded-xl hover:bg-[#2d4a35] active:scale-[0.98] transition-all shadow-sm">
                            <span className="material-symbols-outlined text-[15px]">add_circle</span>Add Department
                          </button>
                        </div>

                        {/* Default depts */}
                        <div>
                          <p className="text-[9px] font-black uppercase tracking-[0.16em] text-[#737873] mb-3">Default Departments</p>
                          <div className="flex flex-wrap gap-2">
                            {[['AIDS', 'AI & Data Science'], ['AIML', 'AI & Machine Learning'], ['BME', 'Bio Medical Engg.'], ['CIVIL', 'Civil Engineering'], ['CSBS', 'CS Business System'], ['CS', 'Computer Science'], ['CYS', 'Cyber Security'], ['ECE', 'Electronics & Communication'], ['EEE', 'Electrical Engineering'], ['IT', 'Information Technology'], ['MECH', 'Mechanical Engineering'], ['VLSI', 'VLSI Design']].map(([sh, fl]) => (
                              <span key={sh} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#f8f6f4] border border-[#e5e2e1] text-[10px] font-bold text-[#434844]">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#18281e]" />{sh}
                                <span className="text-[#b0b0a8] font-normal hidden sm:inline">— {fl}</span>
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* Custom depts */}
                        {customDepts.length > 0 && (
                          <div>
                            <p className="text-[9px] font-black uppercase tracking-[0.16em] text-[#737873] mb-3">Custom Departments</p>
                            <div className="flex flex-wrap gap-2">
                              {customDepts.map(d => (
                                <span key={d.short} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-[10px] font-bold text-emerald-800">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />{d.short}
                                  <span className="text-emerald-600 font-normal hidden sm:inline">— {d.full}</span>
                                  <button onClick={() => handleRemoveDept(d.short)}
                                    className="ml-1 w-4 h-4 rounded-full bg-red-100 hover:bg-red-200 text-red-600 flex items-center justify-center transition-colors">
                                    <span className="material-symbols-outlined text-[11px]">close</span>
                                  </button>
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                </div>

                {/* RIGHT: 4-col sidebar cards */}
                <div className="md:col-span-4 space-y-5">

                  {/* Curator's Note */}
                  <div className="bg-white rounded-2xl border border-[#e5e2e1] shadow-sm p-5 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-[#18281e] to-[#516356] rounded-l-2xl" />
                    <div className="pl-3">
                      <div className="flex items-center gap-2.5 mb-3">
                        <div className="w-8 h-8 rounded-xl bg-[#f0eded] flex items-center justify-center flex-shrink-0">
                          <span className="material-symbols-outlined text-[17px] text-[#18281e]" style={{ fontVariationSettings: "'FILL' 1" }}>auto_stories</span>
                        </div>
                        <p className="text-xs font-black text-[#18281e] tracking-tight">Administrator&apos;s Note</p>
                      </div>
                      <p className="text-[11px] text-[#434844] leading-relaxed">
                        Submitting this form will automatically generate an{' '}
                        <span className="font-bold text-[#18281e]">institutional ID</span> and create a dedicated student portal account. Please verify all data against the{' '}
                        <span className="font-bold text-[#fea619]">original academic transcripts</span>.
                      </p>
                    </div>
                  </div>

                  {/* Direct Contact — dark card */}
                  <div className="bg-[#18281e] text-white rounded-2xl p-6 relative overflow-hidden">
                    <div className="absolute -top-6 -right-6 w-20 h-20 rounded-full bg-white/5" />
                    <div className="absolute -bottom-8 -left-8 w-24 h-24 rounded-full bg-white/5" />
                    <div className="relative z-10">
                      <h3 className="text-[10px] font-black uppercase tracking-[0.16em] mb-5 flex items-center gap-2 text-[#b8e6c8]">
                        <span className="material-symbols-outlined text-[14px]">call</span>
                        Direct Contact
                      </h3>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[9px] font-bold uppercase tracking-[0.12em] text-white/50">Contact Number</label>
                        <input name="fatherMobile" value={formData.fatherMobile} onChange={handleInputChange} type="tel"
                          className="w-full h-10 px-3.5 bg-white/10 border-0 rounded-xl text-sm text-white placeholder:text-white/30 outline-none focus:ring-2 focus:ring-[#fea619]/40 transition-all"
                          placeholder="+91 00000 00000" />
                      </div>
                    </div>
                  </div>

                  {/* Save Action — amber card */}
                  <div className="bg-[#fef3c7] rounded-2xl p-6 relative overflow-hidden border border-[#fea619]/20">
                    <div className="absolute -bottom-6 -right-6 w-20 h-20 rounded-full bg-[#fea619] opacity-20" />
                    <div className="relative z-10">
                      <p className="text-[#734d00] text-xs font-medium leading-relaxed mb-5">
                        Finalize the student record to update the institutional database.
                      </p>
                      <button onClick={handleSave}
                        className="w-full py-3 px-5 bg-gradient-to-br from-[#18281e] to-[#2d4a35] text-white font-bold rounded-xl shadow-lg hover:shadow-xl active:scale-[0.98] transition-all flex items-center justify-center gap-2 text-sm">
                        <span className="material-symbols-outlined text-[18px]">save</span>
                        {isEditing ? 'Update Student' : 'Save Student'}
                      </button>
                      <button onClick={handleDiscard}
                        className="w-full mt-2.5 py-2.5 px-5 bg-transparent text-red-700 font-semibold rounded-xl hover:bg-red-50 active:scale-[0.98] transition-all flex items-center justify-center gap-2 text-xs border border-red-200">
                        <span className="material-symbols-outlined text-[14px]">delete</span>
                        Discard
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent Curations Table */}
              <div className="mt-10">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-5 gap-3">
                  <h2 className="font-headline text-xl font-bold text-[#18281e]">Recent Students</h2>
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[17px] text-[#737873]">search</span>
                      <input value={appSearchQuery} onChange={e => setAppSearchQuery(e.target.value)}
                        className="h-9 w-64 pl-9 pr-3 bg-white border border-[#e5e2e1] rounded-xl text-sm text-[#18281e] placeholder:text-[#737873] outline-none focus:ring-2 focus:ring-[#18281e]/15 transition-all shadow-sm"
                        placeholder="Search student by name or ID…" />
                    </div>
                    <button onClick={() => setShowModal(true)}
                      className="text-[10px] font-bold text-[#fea619] uppercase tracking-widest hover:text-[#18281e] transition-colors flex items-center gap-1 shrink-0">
                      View All Records <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                    </button>
                  </div>
                </div>
                <div className="bg-white rounded-[20px] border-2 border-[#e5e2e1] shadow-[0_8px_30px_rgba(0,0,0,0.04)] overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left min-w-[620px]">
                      <thead>
                        <tr className="bg-[#f8f6f4] border-b border-[#f0eded]">
                          <th className="px-6 py-4 text-[9px] font-black text-[#737873] uppercase tracking-[0.14em]">Student</th>
                          <th className="px-6 py-4 text-[9px] font-black text-[#737873] uppercase tracking-[0.14em]">Application</th>
                          <th className="px-6 py-4 text-[9px] font-black text-[#737873] uppercase tracking-[0.14em]">Branch</th>
                          <th className="px-6 py-4 text-[9px] font-black text-[#737873] uppercase tracking-[0.14em]">Date / Timeline</th>
                          <th className="px-6 py-4 text-[9px] font-black text-[#737873] uppercase tracking-[0.14em] text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#f0eded]">
                        {appTabFilteredApps.map((app, idx) => {
                          const branchMap: Record<string, string> = {
                            'Computer Science': 'CSE', 'Information Technology': 'IT',
                            'Mechanical Engineering': 'MECH', 'Artificial Intelligence and Machine Learning': 'AI&ML',
                            'Computer Science Business System': 'CS&BS', 'Artificial Intelligence and Data Science': 'AI&DS',
                            'Electrical Engineering': 'EEE', 'Civil Engineering': 'CIVIL',
                            'Bio Medical Engineering': 'BME', 'VLSI Design': 'VLSI', 'Cyber Security': 'CYBER',
                            'Electronics and Communication': 'ECE', 'Computer Science and Engineering': 'CSE',
                            'Electronics and Communication Engineering': 'ECE', 'Electrical and Electronics Engineering': 'EEE'
                          };
                          const branch = branchMap[app.department || ''] || app.department || '—';
                          const bcList = ['bg-[#d4e7d8] text-[#18281e]', 'bg-[#fef3c7] text-[#734d00]', 'bg-[#ede9fe] text-violet-800', 'bg-[#fee2e2] text-red-800', 'bg-[#dbeafe] text-blue-800'];
                          const bc = bcList[idx % bcList.length];
                          return (
                            <tr key={idx} className="hover:bg-[#fafaf9] transition-colors">
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-2.5">
                                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#18281e] to-[#516356] text-white flex items-center justify-center font-bold text-[10px] flex-shrink-0">{app.initials}</div>
                                  <span className="text-sm font-semibold text-[#18281e]">{app.name}</span>
                                </div>
                              </td>
                              <td className="px-6 py-4 font-mono text-xs text-[#737873]">{app.id}</td>
                              <td className="px-6 py-4">
                                <span className={`px-2.5 py-1 text-[10px] font-bold rounded-lg ${bc}`}>{branch}</span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className="text-xs text-[#737873] font-medium block">{app.date}</span>
                                {app.extendedDays && app.extendedDays > 0 ? (
                                  <div className="mt-1 flex items-center gap-1 text-[10px] font-bold text-[#fea619]">
                                    <span className="material-symbols-outlined text-[13px]">schedule</span>
                                    +{app.extendedDays} Days Extended
                                  </div>
                                ) : null}
                              </td>
                              <td className="px-6 py-4 text-right">
                                <div className="flex items-center justify-end gap-2">
                                  <button onClick={() => handleEdit(app)} className="p-1.5 rounded-lg hover:bg-[#f0eded] text-[#737873] hover:text-[#18281e] transition-colors" title="Edit Student">
                                    <span className="material-symbols-outlined text-[16px]">edit</span>
                                  </button>
                                  <button onClick={() => { setExtendModalApp(app); setExtendDaysInput(3); }} className="p-1.5 rounded-lg hover:bg-amber-50 text-amber-500 hover:text-amber-700 transition-colors" title="Extend Timeline">
                                    <span className="material-symbols-outlined text-[16px]">more_time</span>
                                  </button>
                                  <button onClick={() => handleDeleteRequest(app)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 hover:text-red-700 transition-colors" title="Delete Student">
                                    <span className="material-symbols-outlined text-[16px]">delete</span>
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
              </div>

            </div>
          )}

          {/* ████████  SAAS REPORTS TAB  ████████ */}
          {activeTab === 'reports' && (
            <div className="fade-up max-w-[1400px] mx-auto pb-12 space-y-8 animate-in fade-in zoom-in-[0.98] duration-500">

              {/* Top Header & Filters Area */}
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-5 bg-white p-6 sm:p-8 rounded-[28px] border border-[#e5e2e1] shadow-sm">
                <div>
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#f0eded] text-[#18281e] text-[10px] font-black uppercase tracking-[0.18em] mb-4">
                    <span className="material-symbols-outlined text-[14px] text-[#fea619]">monitoring</span>
                    Analytics Dashboard
                  </div>
                  <h1 className="font-headline text-3xl sm:text-4xl font-extrabold text-[#18281e] leading-tight">Institutional <span className="text-[#3b8a53]">Metrics</span></h1>
                  <p className="text-sm text-[#737873] mt-2 max-w-2xl border-l-2 border-[#fea619] pl-3 leading-relaxed font-medium">Comprehensive breakdown of department growth, enrollment volumes, and statistical analytics for professional administration oversight.</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="hidden sm:flex items-center bg-[#f8f6f4] border border-[#e5e2e1] rounded-xl p-1 shadow-inner relative">
                    <div className={`absolute top-1 bottom-1 w-[calc(50%-4px)] bg-white rounded-lg shadow-sm transition-transform duration-300 ${reportYear === 'This Year' ? 'translate-x-0' : 'translate-x-full'}`}></div>
                    <button onClick={() => setReportYear('This Year')} className={`px-5 py-2.5 rounded-lg text-xs font-bold relative z-10 transition-colors ${reportYear === 'This Year' ? 'text-[#18281e]' : 'text-[#737873] hover:text-[#18281e]'}`}>This Year</button>
                    <button onClick={() => setReportYear('Last Year')} className={`px-5 py-2.5 rounded-lg text-xs font-bold relative z-10 transition-colors ${reportYear === 'Last Year' ? 'text-[#18281e]' : 'text-[#737873] hover:text-[#18281e]'}`}>Last Year</button>
                  </div>
                  <button onClick={handleExportOverview} className="h-11 px-5 flex items-center gap-2 bg-[#18281e] hover:bg-[#2d4a35] text-white rounded-xl text-xs font-bold transition-all shadow-[0_8px_20px_rgba(24,40,30,0.15)] hover:-translate-y-0.5">
                    <span className="material-symbols-outlined text-[18px]">download</span> <span className="hidden sm:inline">Export Overview</span>
                  </button>
                </div>
              </div>

              {/* KPI Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {[
                  { title: 'Total Enrollments', value: applications.length.toLocaleString(), trend: `${deptStats.length} dept(s)`, trendUp: true, icon: 'groups', color: 'bg-emerald-50 text-emerald-600', border: 'border-emerald-100' },
                  { title: 'Approved Records', value: approvedN.toLocaleString(), trend: `${completionRate}% rate`, trendUp: completionRate >= 50, icon: 'verified', color: 'bg-rose-50 text-rose-600', border: 'border-rose-100' }
                ].map((kpi, idx) => (
                  <div key={idx} className="bg-white rounded-[24px] p-6 border border-[#e5e2e1] shadow-[0_4px_20px_rgba(0,0,0,0.02)] hover:shadow-[0_12px_40px_rgba(0,0,0,0.08)] transition-all duration-300 relative overflow-hidden group">
                    <div className={`absolute -right-8 -top-8 w-32 h-32 rounded-full opacity-[0.4] group-hover:opacity-[0.8] transition-opacity blur-2xl ${kpi.color.split(' ')[0]}`}></div>
                    <div className="flex items-start justify-between mb-5 relative z-10">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border ${kpi.border} ${kpi.color}`}>
                        <span className="material-symbols-outlined text-[24px]">{kpi.icon}</span>
                      </div>
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-black shadow-sm ${kpi.trendUp ? 'bg-[#dcfce7] text-[#14532d]' : 'bg-[#fee2e2] text-[#991b1b]'}`}>
                        <span className="material-symbols-outlined text-[12px]">{kpi.trendUp ? 'arrow_upward' : 'arrow_downward'}</span> {kpi.trend}
                      </span>
                    </div>
                    <div className="relative z-10">
                      <h3 className="text-4xl font-headline font-black text-[#18281e] tracking-tight">{kpi.value}</h3>
                      <p className="text-[11px] font-black text-[#737873] uppercase tracking-[0.15em] mt-1.5">{kpi.title}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Department Statistics Section */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                {/* SaaS Analytics Graph Block */}
                <div className="lg:col-span-8 bg-white rounded-[28px] border border-[#e5e2e1] shadow-sm p-7 sm:p-9 flex flex-col h-[520px]">
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <h2 className="font-headline text-xl font-extrabold text-[#18281e] flex items-center gap-2">
                        <span className="material-symbols-outlined text-[#3b8a53] text-[22px]">bar_chart</span>
                        Department Volumes Overview
                      </h2>
                      <p className="text-xs text-[#737873] mt-1 font-semibold">Active enrollments benchmarked across 10 major technical domains.</p>
                    </div>
                    <button className="hidden sm:flex px-4 py-2 bg-[#f8f6f4] rounded-lg text-xs font-bold text-[#18281e] items-center gap-1 border border-[#e5e2e1] hover:bg-white hover:shadow-sm transition-all">
                      <span className="material-symbols-outlined text-[16px]">filter_list</span> Filters
                    </button>
                  </div>

                  <div className="relative flex-1">
                    {/* Y-Axis Grid Lines */}
                    <div className="absolute left-0 top-0 bottom-8 right-0 flex flex-col justify-between pointer-events-none z-0">
                      {[600, 480, 360, 240, 120, 0].map(v => (
                        <div key={v} className="flex items-center w-full">
                          <span className="w-8 text-[10px] font-black text-[#b0b0a8] text-right mr-3">{v}</span>
                          <div className="flex-1 border-t border-dashed border-[#e5e2e1]"></div>
                        </div>
                      ))}
                    </div>

                    {/* Bars */}
                    <div className="absolute inset-0 ml-11 left-0 right-0 bottom-8 flex items-end justify-between px-2 sm:px-6 z-10">
                      {deptsChart.map((dept, i) => {
                        const count = dept.base;
                        const maxC = Math.max(1, ...deptsChart.map((d) => d.base));
                        const pct = Math.min((count / maxC) * 100, 100);
                        return (
                          <div key={dept.key} className="flex flex-col items-center justify-end h-full w-[8%] max-w-[40px] group relative">
                            {/* Detailed Hover Tooltip */}
                            <div className="opacity-0 group-hover:opacity-100 absolute bottom-[calc(100%+10px)] left-1/2 -translate-x-1/2 bg-white border border-[#e5e2e1] shadow-[0_12px_30px_rgba(0,0,0,0.12)] rounded-xl py-2 px-3 z-30 pointer-events-none transition-all duration-200 min-w-[140px] transform group-hover:-translate-y-2 translate-y-0">
                              <p className="text-[10px] font-black text-[#737873] uppercase tracking-wider mb-1 truncate">{dept.name}</p>
                              <div className="flex items-end gap-2">
                                <span className="font-headline text-lg font-black text-[#18281e] leading-none">{count}</span>
                                <span className="text-[10px] font-bold text-emerald-600 mb-0.5">Students</span>
                              </div>
                            </div>
                            {/* Graphic Bar */}
                            <div className={`w-full rounded-t-xl bg-gradient-to-t ${BAR_COLORS[i % BAR_COLORS.length]} transition-all duration-700 ease-out cursor-pointer hover:opacity-80 hover:w-[110%] group-hover:shadow-[0_0_20px_rgba(0,0,0,0.1)] relative overflow-hidden`}
                              style={{ height: `${pct}%`, animationDelay: `${i * 45}ms` }}>
                              <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* X-Axis Labels */}
                    <div className="absolute left-11 right-0 bottom-0 flex justify-between px-2 sm:px-6 z-20 h-8 pt-2">
                      {deptsChart.map((d, i) => (
                        <div key={d.key + i} className="flex flex-col items-center w-[8%] max-w-[40px]">
                          <span className="text-[9px] sm:text-[10px] font-black text-[#737873] uppercase tracking-tighter truncate max-w-full" title={d.name}>{d.name.substring(0, 4)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Right Side Growth Tracking Details */}
                <div className="lg:col-span-4 bg-[#fafaf9] rounded-[28px] border border-[#e5e2e1] shadow-sm flex flex-col h-[520px] overflow-hidden">
                  <div className="p-6 sm:p-8 bg-white border-b border-[#e5e2e1]">
                    <h2 className="font-headline text-lg font-extrabold text-[#18281e] flex items-center gap-2 leading-none">
                      <span className="material-symbols-outlined text-[20px] text-[#fea619]">troubleshoot</span>
                      Department Growth Tracking
                    </h2>
                    <p className="text-[11px] font-semibold text-[#737873] mb-4 mt-2">Annual YoY enrollment progression stats & targeted completion rates for major divisions.</p>

                    <div className="relative">
                      <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[16px] text-[#b0b0a8]">search</span>
                      <input type="text" value={reportSearchQuery} onChange={e => setReportSearchQuery(e.target.value)} placeholder="Search departments..." className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-[#f8f6f4] border border-[#e5e2e1] text-xs font-semibold focus:outline-none focus:border-[#18281e] transition-all" />
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
                    {deptsChart.filter(d => d.name.toLowerCase().includes(reportSearchQuery.toLowerCase())).length === 0 ? (
                      <div className="text-center py-12 text-[#737873] text-sm">No departments found.</div>
                    ) : (
                      deptsChart.filter(d => d.name.toLowerCase().includes(reportSearchQuery.toLowerCase())).map((dept, i) => {
                        const count = dept.base;
                        const growth = dept.base ? ((count / dept.base) * 100 - 100).toFixed(1) : '0';
                        const activeTarget = dept.base ? Math.min(100, Math.round((count / Math.max(1, ...deptsChart.map((x) => x.base))) * 100)) : 0;

                        return (
                          <div key={dept.key} className="group bg-white p-4 rounded-[16px] border border-[#f0eded] hover:border-[#18281e]/20 hover:shadow-md transition-all duration-300">
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <h4 className="text-sm font-black text-[#18281e] leading-tight flex items-center gap-1.5">
                                  <span className={`w-2.5 h-2.5 rounded-full bg-gradient-to-br ${BAR_COLORS[i % BAR_COLORS.length]}`}></span>
                                  {dept.name}
                                </h4>
                                <p className="text-[10px] font-bold text-[#737873] uppercase tracking-wider mt-0.5 ml-4">Total: {count} Students</p>
                              </div>
                              <span className="inline-flex items-center text-[10px] font-black px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-600 border border-emerald-100">
                                <span className="material-symbols-outlined text-[11px] mr-0.5">trending_up</span>
                                {Number(growth) >= 0 ? '+' : ''}{growth}%
                              </span>
                            </div>

                            <div className="mt-4">
                              <div className="flex justify-between text-[9px] font-black uppercase text-[#737873] mb-1.5 px-0.5">
                                <span>Admissions Target</span>
                                <span>{activeTarget}%</span>
                              </div>
                              <div className="w-full bg-[#f0eded] h-1.5 rounded-full overflow-hidden">
                                <div className={`h-full bg-gradient-to-r ${BAR_COLORS[i % BAR_COLORS.length]} transition-all duration-1000 ease-in-out`} style={{ width: `${activeTarget}%` }}></div>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* ████████  STUDENT'S MANAGEMENT TAB  ████████ */}
          {activeTab === 'studentsManagement' && (
            <div className="fade-up max-w-7xl mx-auto pb-12 space-y-7">
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-10">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#737873] mb-2">Student Directory</p>
                  <h1 className="font-headline text-4xl font-extrabold text-[#18281e] leading-tight mb-3">
                    Student's <span className="text-[#fea619]">Management</span>
                  </h1>
                  <p className="text-[#737873] text-sm leading-relaxed max-w-2xl">
                    Filter students by their application status. View detailed information, export reports, and lock completed applications.
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={handleRefreshStudentManagement}
                    disabled={smRefreshing}
                    className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#f8f6f4] border border-[#e5e2e1] text-[#18281e] font-bold text-sm hover:bg-white transition-colors shadow-sm disabled:opacity-60"
                  >
                    <span className="material-symbols-outlined text-[18px]">{smRefreshing ? 'hourglass_top' : 'refresh'}</span>
                    {smRefreshing ? 'Refreshing...' : 'Refresh'}
                  </button>
                  <button onClick={handleDownloadServerExcelExports} className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-white border border-[#e5e2e1] text-[#18281e] font-bold text-sm hover:bg-[#f8f6f4] transition-colors shadow-sm">
                    <span className="material-symbols-outlined text-[18px]">download</span>
                    Excel Download
                  </button>
                  <button onClick={handleArchiveBatch} className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#cd3232] text-white font-bold text-sm hover:bg-[#a52a2a] transition-colors shadow-sm">
                    <span className="material-symbols-outlined text-[18px]">archive</span>
                    Restart
                  </button>
                </div>
              </div>

              {/* Toggle Buttons */}
              <div className="flex bg-[#f8f6f4]/60 backdrop-blur-xl p-2 rounded-[24px] w-fit mb-8 gap-3 border border-white/80 shadow-[0_8px_30px_rgba(0,0,0,0.04)] relative z-10">
                <button
                  onClick={() => setSmCategory('Complete')}
                  className={`px-8 py-3.5 rounded-2xl text-sm font-black transition-all duration-500 flex items-center gap-2 ${smCategory === 'Complete' ? 'bg-white text-[#18281e] shadow-[0_8px_20px_rgba(0,0,0,0.06)] scale-105 border border-[#e5e2e1]/50' : 'text-[#737873] hover:text-[#18281e] hover:bg-white/50 border border-transparent'}`}>
                  {smCategory === 'Complete' && <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>}
                  Completely Filled Forms
                </button>
                <div className="w-px h-8 bg-[#e5e2e1] my-auto"></div>
                <button
                  onClick={() => setSmCategory('Partial')}
                  className={`px-8 py-3.5 rounded-2xl text-sm font-black transition-all duration-500 flex items-center gap-2 ${smCategory === 'Partial' ? 'bg-white text-[#18281e] shadow-[0_8px_20px_rgba(0,0,0,0.06)] scale-105 border border-[#e5e2e1]/50' : 'text-[#737873] hover:text-[#18281e] hover:bg-white/50 border border-transparent'}`}>
                  {smCategory === 'Partial' && <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>}
                  Partially Filled Forms
                </button>
              </div>

              <div className="mb-5 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
                <div className="relative w-full sm:max-w-md">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[17px] text-[#737873]">search</span>
                  <input
                    value={smSearchQuery}
                    onChange={(e) => setSmSearchQuery(e.target.value)}
                    className="h-11 w-full pl-9 pr-3 bg-white border border-[#e5e2e1] rounded-xl text-sm text-[#18281e] placeholder:text-[#737873] outline-none focus:ring-2 focus:ring-[#18281e]/15 transition-all"
                    placeholder="Search by application number or student name"
                  />
                </div>
                <button
                  onClick={() => setShowOpenedFormModal(true)}
                  className="h-11 px-5 flex items-center justify-center gap-2 bg-white border border-[#e5e2e1] hover:bg-[#f8f6f4] text-[#18281e] rounded-xl text-xs font-bold transition-all shadow-sm"
                >
                  <span className="material-symbols-outlined text-[18px]">visibility</span>
                  View Student Opened Form
                </button>
              </div>

              <div className="bg-white rounded-[20px] border-2 border-[#e5e2e1] shadow-[0_8px_30px_rgba(0,0,0,0.04)] overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left min-w-[900px]">
                    <thead className="bg-[#fafaf9] border-b border-[#e5e2e1]">
                      <tr>
                        {['Application', 'Student Name', 'Branch', 'Submitted', 'Status', 'Actions'].map(th => (
                          <th key={th} className="px-6 py-4 text-[10px] font-black text-[#737873] uppercase tracking-[0.14em]">{th}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#f0eded]">
                      {smFilteredApps.map((app, idx) => (
                        <tr key={idx} className="hover:bg-[#fafaf9] transition-colors">
                          <td className="px-6 py-4 font-mono text-xs text-[#516356] font-semibold">{app.id}</td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#18281e] to-[#516356] text-white flex items-center justify-center font-bold text-[11px] flex-shrink-0">
                                {app.initials}
                              </div>
                              <span className="text-sm font-bold text-[#18281e]">{app.name}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm font-semibold text-[#434844]">{app.department || '—'}</td>
                          <td className="px-6 py-4">
                            <div className="flex flex-col">
                              <span className="text-[13px] font-bold text-[#18281e]">{app.date}</span>
                              <span className="text-[10px] font-semibold text-[#737873]">{app.submitTime || '10:45 AM'}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-bold rounded-lg ${app.completionStatus === 'Complete' ? 'bg-[#dcfce7] text-[#14532d]' : 'bg-[#fef3c7] text-[#734d00]'}`}>
                              {app.completionStatus === 'Complete' ? <span className="material-symbols-outlined text-[12px]">check_circle</span> : <span className="material-symbols-outlined text-[12px]">schedule</span>}
                              {app.completionStatus || 'Complete'}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <button onClick={() => setSmViewApp(app)} className="relative flex items-center justify-center w-9 h-9 rounded-full bg-white hover:bg-[#f0eded] text-[#18281e] shadow-sm transition-all duration-300 border border-[#e5e2e1]" title="View Details">
                                <span className="material-symbols-outlined text-[16px]">visibility</span>
                              </button>
                              <button onClick={() => handleExportClick('PDF', app)} className="relative flex items-center justify-center w-9 h-9 rounded-full bg-white hover:bg-rose-50 text-red-500 shadow-sm transition-all duration-300 border border-[#e5e2e1] hover:border-red-200" title="Download PDF">
                                <span className="material-symbols-outlined text-[16px]">picture_as_pdf</span>
                              </button>
                              <button onClick={() => {
                                const link = document.createElement('a');
                                link.href = `/api/admin/documents/bulk-download?studentId=${app.id}`;
                                link.download = `student_${app.id}_documents.zip`;
                                document.body.appendChild(link);
                                link.click();
                                document.body.removeChild(link);
                              }} className="relative flex items-center justify-center w-9 h-9 rounded-full bg-white hover:bg-blue-50 text-blue-500 shadow-sm transition-all duration-300 border border-[#e5e2e1] hover:border-blue-200" title="Download All Documents">
                                <span className="material-symbols-outlined text-[16px]">folder_zip</span>
                              </button>
                              <button onClick={() => handleToggleLock(app.id, !!app.isLocked)} className={`relative flex items-center justify-center w-10 h-10 rounded-[14px] shadow-md transition-all duration-500 overflow-hidden group/lock ${app.isLocked ? 'bg-gradient-to-br from-red-500 to-rose-600 text-white shadow-[0_8px_20px_rgba(225,29,72,0.35)] border border-red-400' : 'bg-white hover:bg-emerald-50 text-[#737873] hover:text-emerald-600 border border-[#e5e2e1] hover:border-emerald-200'}`} title={app.isLocked ? "Unlock Record" : "Lock Record"}>
                                <span className={`material-symbols-outlined text-[18px] relative z-10 transition-transform duration-500 ${app.isLocked ? 'scale-[1.15]' : 'scale-100'}`}>{app.isLocked ? 'lock' : 'lock_open'}</span>
                              </button>
                              <button onClick={() => handleDeleteRequest(app)} className="relative flex items-center justify-center w-9 h-9 rounded-full bg-white hover:bg-red-500 text-red-500 hover:text-white shadow-sm transition-all duration-300 border border-[#e5e2e1] hover:border-red-500" title="Delete">
                                <span className="material-symbols-outlined text-[16px]">delete</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {smFilteredApps.length === 0 && (
                        <tr>
                          <td colSpan={6} className="py-12 text-center text-sm text-[#737873]">
                            No {smCategory.toLowerCase()} applications found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ID CARDS TAB */}
          {activeTab === 'idCards' && (
            <div className="fade-up max-w-[1400px] mx-auto pb-12 space-y-8 animate-in fade-in zoom-in-[0.98] duration-500">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    <span className="material-symbols-outlined text-indigo-600">badge</span>
                    ID Card Data Export
                  </h1>
                  <p className="text-sm text-gray-500 mt-1 font-medium">Download department-wise Excel sheets for ID card generation.</p>
                </div>
                <button
                  onClick={handleDownloadIdCards}
                  disabled={isDownloadingIdCards}
                  className="flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 text-white font-bold rounded-xl shadow-md shadow-indigo-200 hover:bg-indigo-700 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-indigo-300 transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  <span className="material-symbols-outlined text-[20px]">
                    {isDownloadingIdCards ? 'hourglass_empty' : 'download'}
                  </span>
                  {isDownloadingIdCards ? 'Generating...' : 'Download ID Cards Data'}
                </button>
              </div>

              <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm">
                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <span className="material-symbols-outlined text-emerald-500">info</span>
                  What's included in the export?
                </h3>
                <ul className="list-disc pl-5 space-y-2 text-gray-600">
                  <li><strong>Separate Sheets:</strong> Each department (Course) will have its own sheet in the Excel file.</li>
                  <li><strong>Standard Columns:</strong> Name, Course, Batch, Date of Birth, Blood Group, Father's Name, Address, Contact No.</li>
                  <li><strong>Combined Fields:</strong> The address automatically combines the Door No, Street, City, State, and Pincode fields from the student's application.</li>
                </ul>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Student View Details Modal */}
      {smViewApp && <StudentDetailModal app={smViewApp} onClose={() => setSmViewApp(null)} onSave={handleSaveModalUpdates} onPromoteDraft={loadApplications} />}

      {/* Opened Form Students Modal */}
      {showOpenedFormModal && (
        <div className="fixed inset-0 z-[240] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowOpenedFormModal(false)}>
          <div className="bg-white rounded-3xl w-full max-w-3xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#f0eded] bg-[#fafaf9]">
              <div>
                <h2 className="font-headline text-lg font-bold text-[#18281e]">Students Who Opened Form</h2>
                <p className="text-[10px] text-[#737873] mt-0.5">Shows students who opened the form after login.</p>
              </div>
              <button onClick={() => setShowOpenedFormModal(false)} className="p-2 rounded-full hover:bg-[#f0eded] text-[#737873] hover:text-red-600 transition-colors">
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>
            <div className="overflow-auto flex-1">
              <table className="w-full text-left min-w-[560px]">
                <thead className="sticky top-0 bg-white z-10">
                  <tr className="border-b border-[#f0eded]">
                    {['Application No.', 'Student Name', 'Opened At'].map((h) => (
                      <th key={h} className="py-3 px-5 text-[10px] font-black uppercase tracking-[0.12em] text-[#737873] bg-[#fafaf9]">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {openedFormStudents.map((app) => (
                    <tr key={`opened-${app.id}`} className="hover:bg-[#fafaf9] border-b border-[#f0eded] last:border-0 transition-colors">
                      <td className="py-3.5 px-5 font-mono text-xs text-[#516356] font-semibold">{app.id}</td>
                      <td className="py-3.5 px-5 text-sm font-bold text-[#18281e]">{app.name}</td>
                      <td className="py-3.5 px-5 text-sm font-semibold text-[#434844]">
                        {app.formOpenedAt ? new Date(app.formOpenedAt).toLocaleString() : '—'}
                      </td>
                    </tr>
                  ))}
                  {openedFormStudents.length === 0 && (
                    <tr>
                      <td colSpan={3} className="py-12 text-center text-sm text-[#737873]">
                        No students have opened the form yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Export Confirmation Glassmorphism Modal */}
      {exportModalApp && exportModalType && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-xl transition-all" onClick={() => setExportModalApp(null)}></div>

          <div className="relative z-10 w-full max-w-sm rounded-[32px] bg-white/70 backdrop-blur-[24px] border border-white/80 shadow-[0_20px_60px_rgba(0,0,0,0.15)] overflow-hidden scale-100 animate-in fade-in zoom-in-95 duration-300" onClick={e => e.stopPropagation()}>
            <div className="p-8 text-center">
              <div className={`mx-auto w-20 h-20 rounded-full flex items-center justify-center mb-6 shadow-inner ${exportModalType === 'PDF' ? 'bg-gradient-to-tr from-white to-red-50 border-[6px] border-white' : 'bg-gradient-to-tr from-white to-emerald-50 border-[6px] border-white'}`}>
                <span className={`material-symbols-outlined text-[36px] ${exportModalType === 'PDF' ? 'text-red-500' : 'text-emerald-600'} animate-bounce`}>{exportModalType === 'PDF' ? 'picture_as_pdf' : 'table_view'}</span>
              </div>

              <h2 className="font-headline text-2xl font-extrabold text-[#18281e] mb-2 leading-tight">Exporting {exportModalType}</h2>
              <p className="text-sm text-[#434844] leading-relaxed mb-8">
                Your file for <span className="font-bold text-[#18281e]">{exportModalApp.name}</span> (<span className="font-mono text-[11px]">{exportModalApp.id}</span>) is being generated securely.
              </p>

              <div className="max-w-[200px] mx-auto w-full h-2 bg-[#f0eded] rounded-full overflow-hidden mb-8 shadow-inner relative">
                <div className={`absolute top-0 bottom-0 left-0 right-0 rounded-full animate-[progress_1.5s_ease-in-out_infinite] ${exportModalType === 'PDF' ? 'bg-gradient-to-r from-red-400 to-red-600' : 'bg-gradient-to-r from-emerald-400 to-emerald-600'}`} style={{ transformOrigin: 'left' }}></div>
              </div>

              <button onClick={() => { setExportModalType(null); setExportModalApp(null); }} className="py-3 px-10 rounded-2xl bg-white border border-[#e5e2e1] text-[#737873] text-sm font-bold hover:bg-[#f8f6f4] hover:text-[#18281e] transition-all shadow-sm">
                Cancel Process
              </button>
            </div>
          </div>
        </div>
      )}

      {/* All Applications Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 modal-backdrop" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-3xl w-full max-w-5xl max-h-[88vh] flex flex-col shadow-2xl modal-card" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#f0eded] bg-[#fafaf9] rounded-t-3xl flex-shrink-0">
              <div>
                <h2 className="font-headline text-lg font-bold text-[#18281e]">Application Database</h2>
                <p className="text-[10px] text-[#737873] font-medium mt-0.5">Full records of all registered students.</p>
              </div>
              <button onClick={() => setShowModal(false)} className="p-2 rounded-full hover:bg-[#f0eded] text-[#737873] hover:text-red-600 transition-colors">
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>
            <div className="overflow-auto flex-1">
              <table className="w-full text-left min-w-[680px]">
                <thead className="sticky top-0 bg-white z-10">
                  <tr className="border-b border-[#f0eded]">
                    {['App No.', 'Candidate', 'Department', 'Contact / DOB', 'Status', 'Actions'].map(h => (
                      <th key={h} className="py-3 px-5 text-[10px] font-black uppercase tracking-[0.12em] text-[#737873] bg-[#fafaf9]">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {applications.map((app, idx) => (
                    <tr key={idx} className="hover:bg-[#fafaf9] border-b border-[#f0eded] last:border-0 transition-colors">
                      <td className="py-3.5 px-5 font-mono text-xs text-[#516356] font-semibold">{app.id}</td>
                      <td className="py-3.5 px-5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#18281e] to-[#516356] text-white font-bold text-sm flex items-center justify-center flex-shrink-0">{app.initials}</div>
                          <div>
                            <p className="font-bold text-[#18281e] text-sm">{app.name}</p>
                            <p className="text-[10px] text-[#737873]">Applied: {app.date}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-5 text-sm font-semibold text-[#18281e]">{app.department || '—'}</td>
                      <td className="py-3.5 px-5">
                        <p className="text-sm font-semibold text-[#18281e]">{app.mobile || '—'}</p>
                        <p className="text-[10px] text-[#737873]">{app.dob || '—'}</p>
                      </td>
                      <td className="py-3.5 px-5"><StatusBadge status={app.status} /></td>
                      <td className="py-3.5 px-5">
                        <div className="flex items-center gap-2">
                          <button onClick={() => { setShowModal(false); handleEdit(app); setActiveTab('applications'); }} className="p-1.5 rounded-lg hover:bg-[#f0eded] text-[#737873] hover:text-[#18281e] transition-colors" title="Edit Student">
                            <span className="material-symbols-outlined text-[16px]">edit</span>
                          </button>
                          <button onClick={() => { setShowModal(false); handleDeleteRequest(app); }} className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 hover:text-red-700 transition-colors" title="Delete Student">
                            <span className="material-symbols-outlined text-[16px]">delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-6 py-3.5 border-t border-[#f0eded] bg-[#fafaf9] rounded-b-3xl flex-shrink-0 flex items-center justify-between">
              <span className="text-xs font-medium text-[#737873]">{applications.length} records</span>
              <button onClick={() => setShowModal(false)} className="px-5 py-2 rounded-xl bg-[#18281e] text-white text-xs font-bold hover:bg-[#2d4a35] transition-colors">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Extend Time Modal */}
      {extendModalApp && (
        <div className="fixed inset-0 z-[110] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 modal-backdrop" onClick={() => setExtendModalApp(null)}>
          <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl modal-card overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#f0eded] bg-[#fafaf9]">
              <div>
                <h2 className="font-headline text-base font-bold text-[#18281e]">Extend Timeline</h2>
                <p className="text-[10px] text-[#737873] mt-0.5">For {extendModalApp.name}</p>
              </div>
              <button onClick={() => setExtendModalApp(null)} className="p-2 rounded-full hover:bg-[#f0eded] text-[#737873] hover:text-red-600 transition-colors">
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[9px] font-bold text-[#434844] uppercase tracking-[0.13em]">Number of Days to Extend</label>
                <input type="number" value={extendDaysInput} onChange={e => setExtendDaysInput(Number(e.target.value))}
                  min={1} max={30}
                  className="w-full h-10 px-3.5 bg-[#f8f6f4] border border-[#e5e2e1] rounded-xl text-sm text-[#18281e] outline-none focus:ring-2 focus:ring-[#18281e]/20 transition-all" />
              </div>
              <p className="text-[10px] text-[#737873] leading-relaxed">
                This will grant the student an additional {extendDaysInput} days to complete and submit their enrollment documents.
              </p>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setExtendModalApp(null)} className="flex-1 py-2.5 rounded-xl bg-[#f0eded] text-[#434844] text-xs font-bold hover:bg-[#e5e2e1] transition-colors">Cancel</button>
                <button onClick={handleExtendSave} className="flex-1 py-2.5 rounded-xl bg-[#fea619] text-[#18281e] text-xs font-bold hover:bg-[#f9c35a] transition-colors shadow-sm">Confirm Extension</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Glassmorphism Modal */}
      {deleteModalApp && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setDeleteModalApp(null)}></div>

          <div className="relative z-10 w-full max-w-sm rounded-[24px] bg-white/60 backdrop-blur-[24px] border border-white/60 shadow-[0_8px_32px_rgba(0,0,0,0.12)] overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="p-7">
              <div className="w-12 h-12 rounded-full bg-red-100/80 border border-red-200 flex items-center justify-center mb-4 shadow-sm">
                <span className="material-symbols-outlined text-[24px] text-red-600">delete_forever</span>
              </div>

              <h2 className="font-headline text-xl font-extrabold text-[#18281e] mb-2 leading-tight">Delete Student<br />Record?</h2>
              <p className="text-sm text-[#434844] leading-relaxed mb-6">
                This action cannot be undone. This will permanently remove the application for <span className="font-bold text-[#18281e]">{deleteModalApp.name}</span> (<span className="font-mono text-xs">{deleteModalApp.id}</span>).
              </p>

              <div className="mb-6">
                <label className="text-[10px] font-bold text-[#434844] uppercase tracking-[0.13em] block mb-2">
                  Type <span className="text-red-600 select-all font-black">DELETE</span> to confirm
                </label>
                <input
                  type="text"
                  value={deleteConfirmText}
                  onChange={e => setDeleteConfirmText(e.target.value)}
                  className="w-full h-11 px-4 bg-white/60 backdrop-blur-md border border-white/80 rounded-xl text-sm font-semibold text-[#18281e] placeholder:text-[#a0a09a] outline-none focus:ring-2 focus:ring-red-500/30 transition-all shadow-inner"
                  placeholder="Type DELETE..."
                  autoComplete="off"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteModalApp(null)}
                  className="flex-1 py-3 rounded-xl bg-white/70 backdrop-blur-md border border-white/80 text-[#434844] text-xs font-bold hover:bg-white/90 transition-all shadow-sm">
                  Cancel
                </button>
                <button
                  onClick={handleConfirmDelete}
                  disabled={deleteConfirmText !== 'DELETE'}
                  className={`flex-1 py-3 rounded-xl text-white text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1.5 ${deleteConfirmText === 'DELETE' ? 'bg-red-600 hover:bg-red-700 shadow-[0_4px_14px_rgba(220,38,38,0.3)]' : 'bg-red-300 cursor-not-allowed opacity-70'}`}>
                  <span className="material-symbols-outlined text-[16px]">check_circle</span>
                  Confirm
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Account Settings Modal */}
      {showAccountSettings && (
        <AccountSettingsModal
          onClose={() => setShowAccountSettings(false)}
          onUsernameChanged={(u) => setAdminUsername(u)}
        />
      )}
      {/* Export Overview Glassmorphism Modal */}
      {exportOverviewActive && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-xl transition-all" onClick={() => setExportOverviewActive(false)}></div>

          <div className="relative z-10 w-full max-w-md rounded-[32px] bg-white/70 backdrop-blur-[24px] border border-white/80 shadow-[0_20px_60px_rgba(0,0,0,0.15)] overflow-hidden scale-100 animate-in fade-in zoom-in-95 duration-300">
            <div className="p-8 text-center">
              <div className="mx-auto w-24 h-24 rounded-full flex items-center justify-center mb-6 shadow-inner bg-gradient-to-tr from-white to-blue-50 border-[6px] border-white">
                <span className="material-symbols-outlined text-[40px] text-blue-600 animate-bounce">downloading</span>
              </div>

              <h2 className="font-headline text-2xl font-extrabold text-[#18281e] mb-2 leading-tight">Exporting Overview</h2>
              <p className="text-sm text-[#434844] leading-relaxed mb-6 font-medium">
                Generating PDF analytics report for <span className="font-bold text-[#18281e]">Institution Metrics ({reportYear})</span>.
              </p>

              <div className="max-w-[240px] mx-auto w-full h-2.5 bg-[#f0eded] rounded-full overflow-hidden mb-8 shadow-inner relative">
                <div className="absolute top-0 bottom-0 left-0 right-0 rounded-full bg-gradient-to-r from-blue-400 to-indigo-600 animate-[progress_1.5s_ease-in-out_infinite]" style={{ transformOrigin: 'left' }}></div>
              </div>

              <button onClick={() => setExportOverviewActive(false)} className="py-3 px-10 rounded-2xl bg-white border border-[#e5e2e1] text-[#737873] text-sm font-bold hover:bg-[#f8f6f4] hover:text-[#18281e] transition-all shadow-sm">
                Run in Background
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dashboard Download & Print Modals */}
      {dashboardModal && (
        <div className="fixed inset-0 z-[400] flex items-center justify-center p-4">
          <style>{`
            @keyframes paper-plane-fly {
              0% { transform: translate(-30px, 30px) scale(0.8) rotate(-15deg); opacity: 0; }
              20% { opacity: 1; }
              80% { opacity: 1; }
              100% { transform: translate(30px, -30px) scale(1.2) rotate(15deg); opacity: 0; }
            }
          `}</style>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-[12px] transition-all" onClick={() => setDashboardModal(null)}></div>

          <div className="relative z-10 w-full max-w-sm rounded-[32px] bg-white/60 backdrop-blur-[32px] border border-white/60 shadow-[0_24px_80px_rgba(0,0,0,0.15)] overflow-hidden scale-100 animate-in fade-in zoom-in-[0.95] duration-400">
            <div className="p-8 text-center">

              {dashboardModal === 'download' ? (
                <div className="mx-auto w-24 h-24 rounded-full flex items-center justify-center mb-6 shadow-[inset_0_4px_12px_rgba(0,0,0,0.05)] bg-gradient-to-br from-white to-[#f0eded] border border-white relative overflow-hidden">
                  <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-emerald-100/50 to-transparent"></div>
                  <span className="material-symbols-outlined text-[40px] text-emerald-600 relative z-10 animate-bounce">browser_updated</span>
                </div>
              ) : (
                <div className="mx-auto w-24 h-24 rounded-full flex items-center justify-center mb-6 shadow-[inset_0_4px_12px_rgba(0,0,0,0.05)] bg-gradient-to-br from-white to-[#f0eded] border border-white relative overflow-hidden">
                  <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-blue-100/50 to-transparent"></div>
                  <span className="material-symbols-outlined text-[44px] text-blue-600 relative z-10" style={{ animation: 'paper-plane-fly 2s ease-in-out infinite' }}>send</span>
                </div>
              )}

              <h2 className="font-headline text-2xl font-extrabold text-[#18281e] mb-2 leading-tight">
                {dashboardModal === 'download' ? 'Downloading Report' : 'Printing Report'}
              </h2>
              <p className="text-sm text-[#737873] leading-relaxed mb-8 font-medium">
                {dashboardModal === 'download'
                  ? "Your comprehensive dashboard analytics package is being generated and saved securely."
                  : "Connecting to secure local gateway. Your report has been dispatched to the printer queue."}
              </p>

              <div className="max-w-[200px] mx-auto w-full h-1.5 bg-[#e5e2e1] rounded-full overflow-hidden mb-8 shadow-inner relative">
                <div className={`absolute top-0 bottom-0 left-0 right-0 rounded-full animate-[progress_1.8s_ease-in-out_infinite] ${dashboardModal === 'download' ? 'bg-gradient-to-r from-emerald-400 to-emerald-600' : 'bg-gradient-to-r from-blue-400 to-indigo-600'}`} style={{ transformOrigin: 'left' }}></div>
              </div>

              <button onClick={() => setDashboardModal(null)} className="py-2.5 px-8 rounded-[16px] bg-white border border-[#e5e2e1] text-[#737873] text-sm font-bold hover:bg-[#f8f6f4] hover:text-[#18281e] transition-all shadow-sm">
                Dismiss Process
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Batch Export & Restart Glassmorphism Modals */}

      {/* Bulk Upload Modal */}
      {bulkUploadModal.show && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-[16px] transition-all" onClick={() => bulkUploadModal.step !== 'uploading' && setBulkUploadModal({show: false, step: 'preview'})}></div>
          <div className="relative z-10 w-full max-w-2xl rounded-[32px] bg-white border border-[#e5e2e1] shadow-[0_24px_80px_rgba(0,0,0,0.2)] overflow-hidden animate-in fade-in zoom-in-[0.95] duration-400 max-h-[85vh] flex flex-col">
            
            {/* Header */}
            <div className="p-8 text-center flex-shrink-0 border-b border-[#f0eded] bg-[#fafaf9]">
              <div className="mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4 bg-emerald-50 text-emerald-600">
                <span className={`material-symbols-outlined text-[32px] ${bulkUploadModal.step === 'uploading' ? 'animate-spin' : ''}`}>
                  {bulkUploadModal.step === 'uploading' ? 'sync' : bulkUploadModal.step === 'preview' ? 'table_view' : 'cloud_done'}
                </span>
              </div>
              <h2 className="font-headline text-2xl font-extrabold text-[#18281e] mb-2 leading-tight">
                {bulkUploadModal.step === 'uploading' ? 'Uploading & Processing...' : bulkUploadModal.step === 'preview' ? 'Upload Preview' : 'Upload Complete'}
              </h2>
            </div>

            {/* Content Area */}
            <div className="p-8 overflow-y-auto">
              
              {/* PREVIEW STEP */}
              {bulkUploadModal.step === 'preview' && (
                <div className="space-y-6">
                  <div className="bg-[#f8f6f4] rounded-2xl p-6 border border-[#e5e2e1]">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-headline text-sm font-bold text-[#18281e]">Valid Students to Upload</h3>
                      <span className="bg-emerald-100 text-emerald-700 font-bold px-3 py-1 rounded-full text-xs">{bulkUploadModal.parsedStudents?.length || 0} Total</span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {Object.entries(bulkUploadModal.deptCounts || {}).map(([dept, count]) => (
                        <div key={dept} className="bg-white rounded-xl p-3 border border-[#e5e2e1] flex justify-between items-center shadow-sm">
                          <span className="font-bold text-[#18281e] text-xs">{dept}</span>
                          <span className="text-[#737873] text-[10px] font-bold bg-[#f0eded] px-2 py-0.5 rounded-full">{count}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {bulkUploadModal.invalidRows && bulkUploadModal.invalidRows.length > 0 && (
                    <div className="bg-red-50 rounded-2xl p-6 border border-red-100">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-headline text-sm font-bold text-red-800">Invalid / Skipped Rows</h3>
                        <span className="bg-red-200 text-red-800 font-bold px-3 py-1 rounded-full text-xs">{bulkUploadModal.invalidRows.length} Rows</span>
                      </div>
                      <p className="text-xs text-red-700 mb-3">These rows will NOT be uploaded due to missing Application Number or Name.</p>
                      <div className="max-h-40 overflow-y-auto space-y-2 pr-2">
                        {bulkUploadModal.invalidRows.map((row, i) => (
                          <div key={i} className="bg-white rounded-lg p-3 border border-red-100 shadow-sm">
                            <p className="text-[10px] font-bold text-red-600 uppercase mb-1">{row.reason} <span className="text-[#737873] font-medium ml-2">Sheet: {row.academic_branch}</span></p>
                            <p className="text-xs text-[#434844] font-mono truncate" title={row.rawRow}>{row.rawRow || 'Empty Row'}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex gap-4 mt-8">
                    <button onClick={() => setBulkUploadModal({show: false, step: 'preview'})} className="flex-1 py-3 rounded-2xl bg-[#f0eded] text-[#434844] text-sm font-bold hover:bg-[#e5e2e1] transition-colors">
                      Cancel
                    </button>
                    <button onClick={confirmBulkUpload} disabled={!bulkUploadModal.parsedStudents?.length} className="flex-1 py-3 rounded-2xl bg-[#18281e] text-white text-sm font-bold hover:bg-[#2d4a35] transition-colors disabled:opacity-50">
                      Confirm & Upload
                    </button>
                  </div>
                </div>
              )}

              {/* RESULTS STEP */}
              {bulkUploadModal.step === 'results' && bulkUploadModal.results && (
                <div>
                  {bulkUploadModal.results.error ? (
                    <div className="p-4 rounded-2xl bg-red-50 text-red-700 text-sm font-medium border border-red-200">
                      {bulkUploadModal.results.error}
                    </div>
                  ) : (
                    <div className="space-y-6 text-left">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-emerald-50 rounded-2xl p-4 border border-emerald-100 flex flex-col items-center justify-center text-center">
                          <span className="text-4xl font-black text-emerald-600">{bulkUploadModal.results.success}</span>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 mt-1">Successfully Imported</span>
                        </div>
                        <div className="bg-red-50 rounded-2xl p-4 border border-red-100 flex flex-col items-center justify-center text-center">
                          <span className="text-4xl font-black text-red-600">{bulkUploadModal.results.failed}</span>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-red-800 mt-1">Failed / Duplicates</span>
                        </div>
                      </div>
                      {bulkUploadModal.results.errors && bulkUploadModal.results.errors.length > 0 && (
                        <div className="mt-6">
                          <p className="text-[11px] font-bold uppercase tracking-wider text-[#737873] mb-3">Error Details</p>
                          <div className="bg-[#f8f6f4] rounded-2xl p-4 border border-[#e5e2e1] max-h-40 overflow-y-auto space-y-2">
                            {bulkUploadModal.results.errors.map((err: string, i: number) => (
                              <p key={i} className="text-xs text-[#434844] py-1 border-b border-[#e5e2e1] last:border-0">{err}</p>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  <button onClick={() => setBulkUploadModal({show: false, step: 'preview'})} className="w-full mt-8 py-3 rounded-2xl bg-[#18281e] text-white text-sm font-bold hover:bg-[#2d4a35] transition-colors shadow-sm">
                    Close & Refresh
                  </button>
                </div>
              )}

            </div>
          </div>
        </div>
      )}
      {batchModal && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-[16px] transition-all" onClick={() => batchModal === 'confirm_restart' && setBatchModal(null)}></div>

          <div className="relative z-10 w-full max-w-md rounded-[32px] bg-white/70 backdrop-blur-[32px] border border-white/60 shadow-[0_24px_80px_rgba(0,0,0,0.2)] overflow-hidden scale-100 animate-in fade-in zoom-in-[0.95] duration-400">
            <div className="p-8 text-center">

              {batchModal === 'exporting' && (
                <>
                  <div className="mx-auto w-24 h-24 rounded-[28px] flex items-center justify-center mb-6 shadow-[inset_0_4px_12px_rgba(0,0,0,0.05)] bg-gradient-to-br from-white to-[#e8f5e9] border border-white relative overflow-hidden group">
                    <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-[#2d4a35]/20 to-transparent pointer-events-none"></div>
                    <div className="w-24 h-24 relative z-10 scale-[1.3] group-hover:scale-[1.35] transition-transform duration-500" dangerouslySetInnerHTML={{ __html: `<dotlottie-player src="https://assets-v2.lottiefiles.com/a/6ac0c17e-1152-11ee-a821-83824ddc0ded/xgwoCRLud8.lottie" background="transparent" speed="1" style="width: 100%; height: 100%;" loop autoplay></dotlottie-player>` }} />
                  </div>
                  <h2 className="font-headline text-2xl font-extrabold text-[#18281e] mb-2 leading-tight">Exporting to Excel</h2>
                  <p className="text-sm text-[#434844] leading-relaxed mb-8 font-medium">Department wise mapping initiated. Collecting structural records.</p>
                  <div className="max-w-[200px] mx-auto w-full h-1.5 bg-[#e5e2e1] rounded-full overflow-hidden mb-8 shadow-inner relative">
                    <div className="absolute top-0 bottom-0 left-0 right-0 rounded-full animate-[progress_1.5s_ease-in-out_infinite] bg-gradient-to-r from-[#2d4a35] to-[#4a7e5a]" style={{ transformOrigin: 'left' }}></div>
                  </div>
                </>
              )}

              {batchModal === 'confirm_restart' && (
                <>
                  <div className="mx-auto w-24 h-24 rounded-full flex items-center justify-center mb-6 shadow-[inset_0_4px_12px_rgba(0,0,0,0.05)] bg-gradient-to-br from-white to-red-50 border border-white relative overflow-hidden">
                    <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-red-500/20 to-transparent"></div>
                    <span className="material-symbols-outlined text-[44px] text-[#cd3232] relative z-10">warning</span>
                  </div>
                  <h2 className="font-headline text-2xl font-extrabold text-[#18281e] mb-2 leading-tight">Batch Reset Protocol</h2>
                  <p className="text-sm text-[#434844] leading-relaxed mb-8 font-medium">Are you sure you want to export the 4-year batch records and restart? This will safely archive and <strong className="text-red-600">wipe all completed forms</strong> to hold new student records.</p>
                  <div className="flex gap-3">
                    <button onClick={() => setBatchModal(null)} className="flex-1 py-3 rounded-2xl bg-white border border-[#e5e2e1] hover:bg-[#f8f6f4] text-[#434844] text-xs font-bold transition-all shadow-sm">Cancel</button>
                    <button onClick={executeRestart} className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-[#cd3232] to-[#b02a2a] hover:from-[#b02a2a] hover:to-[#8b2222] text-white text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2">
                      <span className="material-symbols-outlined text-[18px]">restart_alt</span> Confirm Reset
                    </button>
                  </div>
                </>
              )}

              {batchModal === 'restarting' && (
                <>
                  <div className="mx-auto w-24 h-24 rounded-[28px] flex items-center justify-center mb-6 shadow-[inset_0_4px_12px_rgba(0,0,0,0.05)] bg-gradient-to-br from-white to-red-50 border border-white relative overflow-hidden group">
                    <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-red-500/20 to-transparent pointer-events-none"></div>
                    <div className="w-24 h-24 relative z-10 scale-[1.3] group-hover:scale-[1.35] transition-transform duration-500" dangerouslySetInnerHTML={{ __html: `<dotlottie-player src="https://assets-v2.lottiefiles.com/a/efa8af20-1178-11ee-b716-6bca9b1479fa/JE3LQkzffn.lottie" background="transparent" speed="1" style="width: 100%; height: 100%;" loop autoplay></dotlottie-player>` }} />
                  </div>
                  <h2 className="font-headline text-2xl font-extrabold text-[#18281e] mb-2 leading-tight">Archiving Batch</h2>
                  <p className="text-sm text-[#434844] leading-relaxed mb-8 font-medium">Downloading final archive and clearing system securely. Please wait.</p>
                  <div className="max-w-[200px] mx-auto w-full h-1.5 bg-[#e5e2e1] rounded-full overflow-hidden mb-8 shadow-inner relative">
                    <div className="absolute top-0 bottom-0 left-0 right-0 rounded-full animate-[progress_1.5s_ease-in-out_infinite] bg-gradient-to-r from-[#cd3232] to-[#a52a2a]" style={{ transformOrigin: 'left' }}></div>
                  </div>
                </>
              )}

            </div>
          </div>
        </div>
      )}

    </div>
  );
}
