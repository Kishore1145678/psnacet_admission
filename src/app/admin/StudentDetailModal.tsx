import React, { useEffect, useState } from 'react';
import { Application } from './page';
import { normalizeBranchToAbbreviation } from '@/lib/branch-mapping';

export function StudentDetailModal({ app, onClose, onSave, onPromoteDraft }: { app: Application; onClose: () => void; onSave: (app: Application) => void; onPromoteDraft?: () => void }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<Application>(app);
  const [submittedPayload, setSubmittedPayload] = useState<any | null>(null);
  const [payloadLoading, setPayloadLoading] = useState(false);
  const [uploadedDocuments, setUploadedDocuments] = useState<any[]>([]);
  const [docsLoading, setDocsLoading] = useState(false);

  // Update editData when app changes
  useEffect(() => {
    setEditData(app);
    setIsEditing(false);
  }, [app.id]);

  if (!app) return null;

  const viewModel: Record<string, any> = {
    ...(submittedPayload?.prefill || {}),
    ...(submittedPayload || {}),
    ...(app as any),
    student_mobile: (app as any)?.mobile ?? submittedPayload?.student_mobile ?? submittedPayload?.prefill?.mobile_number ?? '',
    father_mobile: (app as any)?.fatherMobile ?? submittedPayload?.father_mobile ?? submittedPayload?.prefill?.father_mobile_number ?? '',
    father_name: (app as any)?.fatherName ?? submittedPayload?.father_name ?? submittedPayload?.prefill?.father_name ?? '',
    mother_name: (app as any)?.motherName ?? submittedPayload?.mother_name ?? submittedPayload?.prefill?.mother_name ?? '',
    student_name: (app as any)?.name ?? submittedPayload?.student_name ?? submittedPayload?.prefill?.full_name ?? '',
    student_branch: (app as any)?.department ?? submittedPayload?.student_branch ?? submittedPayload?.prefill?.academic_branch ?? '',
    student_dob: (app as any)?.dob ?? submittedPayload?.student_dob ?? submittedPayload?.prefill?.date_of_birth ?? '',
    student_gender: (app as any)?.student_gender ?? submittedPayload?.student_gender ?? submittedPayload?.prefill?.student_gender ?? '',
    aadhar_number:
      (app as any)?.aadhar_number ??
      (app as any)?.student_aadhaar ??
      submittedPayload?.aadhar_number ??
      submittedPayload?.student_aadhaar ??
      submittedPayload?.prefill?.aadhar_number ??
      '',
  };

  const buildEditData = (): Application => ({
    ...(submittedPayload?.prefill || {}),
    ...(submittedPayload || {}),
    ...(app as any),
    student_mobile: (app as any)?.mobile ?? submittedPayload?.student_mobile ?? submittedPayload?.prefill?.mobile_number ?? '',
    father_mobile: (app as any)?.fatherMobile ?? submittedPayload?.father_mobile ?? submittedPayload?.prefill?.father_mobile_number ?? '',
    father_name: (app as any)?.fatherName ?? submittedPayload?.father_name ?? submittedPayload?.prefill?.father_name ?? '',
    mother_name: (app as any)?.motherName ?? submittedPayload?.mother_name ?? submittedPayload?.prefill?.mother_name ?? '',
    student_name: (app as any)?.name ?? submittedPayload?.student_name ?? submittedPayload?.prefill?.full_name ?? '',
    student_branch: (app as any)?.department ?? submittedPayload?.student_branch ?? submittedPayload?.prefill?.academic_branch ?? '',
    student_dob: (app as any)?.dob ?? submittedPayload?.student_dob ?? submittedPayload?.prefill?.date_of_birth ?? '',
    student_gender: (app as any)?.student_gender ?? submittedPayload?.student_gender ?? submittedPayload?.prefill?.student_gender ?? '',
    aadhar_number:
      (app as any)?.aadhar_number ??
      (app as any)?.student_aadhaar ??
      submittedPayload?.aadhar_number ??
      submittedPayload?.student_aadhaar ??
      submittedPayload?.prefill?.aadhar_number ??
      '',
  } as Application);

  useEffect(() => {
    if (!isEditing) {
      setEditData(buildEditData());
    }
  }, [submittedPayload, app.id, isEditing]);

  useEffect(() => {
    let cancelled = false;
    setPayloadLoading(true);
    fetch(`/api/admin/forms/latest?applicationNumber=${encodeURIComponent(app.id)}`, {
      credentials: 'include',
    })
      .then(async (r) => {
        if (!r.ok) return null;
        return r.json();
      })
      .then((data) => {
        if (cancelled) return;
        setSubmittedPayload(data?.payload ?? null);
      })
      .catch(() => {
        if (!cancelled) setSubmittedPayload(null);
      })
      .finally(() => {
        if (!cancelled) setPayloadLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [app.id]);

  // Load uploaded documents for this student
  useEffect(() => {
    let cancelled = false;
    setDocsLoading(true);
    fetch(`/api/admin/documents?studentId=${app.id}`, {
      credentials: 'include',
    })
      .then(async (r) => {
        if (!r.ok) return { documents: [] };
        return r.json();
      })
      .then((data) => {
        if (!cancelled) setUploadedDocuments(data?.documents ?? []);
      })
      .catch(() => {
        if (!cancelled) setUploadedDocuments([]);
      })
      .finally(() => {
        if (!cancelled) setDocsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [app.id]);

  const handleDeleteDocument = async (docId: number) => {
    if (!confirm('Delete this document?')) return;
    try {
      const res = await fetch(`/api/admin/documents?id=${docId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (res.ok) {
        setUploadedDocuments((prev) => prev.filter((d) => d.id !== docId));
      }
    } catch (e) {
      console.error('Delete failed:', e);
    }
  };

  const handleDownloadDocument = (doc: any) => {
    const link = document.createElement('a');
    link.href = `/api/documents/download?fileKey=${encodeURIComponent(doc.file_key)}`;
    link.download = doc.file_name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleBulkDownload = () => {
    const link = document.createElement('a');
    link.href = `/api/admin/documents/bulk-download?studentId=${app.id}`;
    link.download = `student_${app.id}_documents.zip`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleUploadDocument = async (file: File, category: string) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('category', category);

    try {
      const res = await fetch('/api/admin/documents/upload?studentId=' + app.id, {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });

      if (res.ok) {
        // Reload documents after upload
        fetch(`/api/admin/documents?studentId=${app.id}`, {
          credentials: 'include',
        })
          .then(async (r) => {
            if (!r.ok) return { documents: [] };
            return r.json();
          })
          .then((data) => {
            setUploadedDocuments(data?.documents ?? []);
          })
          .catch(() => {
            setUploadedDocuments([]);
          });
      }
    } catch (e) {
      console.error('Upload failed:', e);
    }
  };

  const isImageFile = (fileName: string) => {
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
    return imageExtensions.some(ext => fileName.toLowerCase().endsWith(ext));
  };

  const getFileIcon = (type: string) => {
    if (type.includes('pdf')) return 'picture_as_pdf';
    if (type.includes('word') || type.includes('document')) return 'description';
    if (type.includes('sheet') || type.includes('excel')) return 'table_chart';
    if (type.includes('image')) return 'image';
    return 'insert_drive_file';
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setEditData({ ...(editData as any), [e.target.name]: e.target.value } as Application);
  };

  const handleSave = () => {
    const normalized: Application = {
      ...editData,
      name: (editData as any).student_name ?? editData.name ?? viewModel.student_name ?? app.name,
      department: (editData as any).student_branch ?? editData.department ?? viewModel.student_branch ?? app.department,
      dob: (editData as any).student_dob ?? editData.dob ?? viewModel.student_dob ?? app.dob,
      fatherName: (editData as any).father_name ?? editData.fatherName ?? viewModel.father_name ?? app.fatherName,
      motherName: (editData as any).mother_name ?? editData.motherName ?? viewModel.mother_name ?? app.motherName,
      fatherMobile: (editData as any).father_mobile ?? (editData as any).fatherMobile ?? viewModel.father_mobile ?? app.fatherMobile,
      mobile: (editData as any).student_mobile ?? editData.mobile ?? viewModel.student_mobile ?? app.mobile,
      // Additional fields - explicitly include gender
      ...(editData as any),
    } as any;
    (normalized as any).student_gender = (editData as any).student_gender ?? viewModel.student_gender ?? (app as any).student_gender ?? '';
    console.log('Saving normalized data:', normalized);
    onSave(normalized);
    setIsEditing(false);
  };

  const handlePromoteDraft = async () => {
    if (!confirm('Promote this draft to completed form?')) return;
    try {
      // Fetch the draft form ID
      const draftRes = await fetch(`/api/admin/forms/draft?studentId=${app.id}`, {
        credentials: 'include',
      });
      if (!draftRes.ok) {
        alert('No draft form found');
        return;
      }
      const draftData = await draftRes.json();
      if (!draftData.draft) {
        alert('No draft form found');
        return;
      }

      // Promote the draft
      const promoteRes = await fetch('/api/admin/forms/promote', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ formId: draftData.draft.id }),
      });

      if (promoteRes.ok) {
        alert('Draft promoted to completed form successfully');
        // Close the modal and trigger refresh
        onPromoteDraft?.();
        onClose();
      } else {
        alert('Failed to promote draft');
      }
    } catch (error) {
      console.error('Error promoting draft:', error);
      alert('Error promoting draft');
    }
  };

  const sectionLabelCls = "text-[9px] font-bold text-[#737873] uppercase tracking-[0.14em] mb-1.5 block";
  const sectionValueCls = "text-sm font-semibold text-[#18281e]";
  const inputCls = "w-full h-9 px-3 bg-[#f8f6f4] border border-[#e5e2e1] rounded-lg text-sm text-[#18281e] outline-none focus:ring-2 focus:ring-[#18281e]/20 transition-all font-semibold";

  const renderField = (label: string, name: string, placeholder = '—') => (
    <div>
      <label className={sectionLabelCls}>{label}</label>
      {isEditing ? (
        <input name={name} value={((editData as any)[name] as string) ?? (viewModel[name] as string) ?? ''} onChange={handleChange} className={inputCls} placeholder={placeholder} />
      ) : (
        <p className={sectionValueCls}>{(viewModel[name] as string) || placeholder}</p>
      )}
    </div>
  );

  const renderClassField = (c: string, field: string, placeholder: string, isSmall = false) => (
    isEditing ? (
      <input name={`school_${c}_${field}`} value={(editData[`school_${c}_${field}` as keyof Application] as string) ?? (viewModel[`school_${c}_${field}` as string] as string) ?? ''} onChange={handleChange} className={`h-8 px-2 bg-white border border-[#e5e2e1] rounded-md text-xs font-semibold text-[#18281e] outline-none focus:ring-1 focus:ring-[#18281e]/30 shadow-inner ${isSmall ? 'w-16' : 'w-full min-w-[80px]'}`} placeholder={placeholder} />
    ) : (
      (viewModel[`school_${c}_${field}` as string] as string) || placeholder
    )
  );



  return (
    <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-md flex items-center justify-center p-4 sm:p-6" onClick={onClose}>
      <div className="bg-[#fafaf9] rounded-[28px] w-full max-w-5xl h-full max-h-[92vh] flex flex-col shadow-[0_20px_60px_rgba(0,0,0,0.2)] overflow-hidden transition-all duration-300 transform scale-100 animate-in fade-in zoom-in-95" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-8 py-5 border-b border-[#e5e2e1] bg-white sticky top-0 z-20 flex-shrink-0 relative overflow-hidden">
          {/* Subtle gradient accent */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#18281e] via-[#3b8a53] to-[#fea619]" />
          
          <div>
            <h2 className="font-headline text-2xl font-black text-[#18281e] flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#18281e] to-[#516356] text-white flex items-center justify-center font-bold text-sm shadow-sm">
                {app.initials || 'ST'}
              </div>
              {app.name}
            </h2>
            <div className="text-xs font-semibold text-[#737873] mt-2 flex items-center gap-3">
              <span className="font-mono bg-[#f0eded] px-2 py-0.5 rounded-md text-[#18281e] shadow-inner">{app.id}</span>
              <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">school</span> {normalizeBranchToAbbreviation(app.department || '') || 'Unknown Branch'}</span>
              <span className={`px-2 py-0.5 rounded-md font-bold shadow-sm ${app.completionStatus === 'Complete' ? 'bg-[#dcfce7] text-[#14532d]' : 'bg-[#fef3c7] text-[#734d00]'}`}>
                {app.completionStatus || 'Complete'} Document
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {!isEditing && (
              <>
                <button
                  onClick={() => {
                    setEditData(buildEditData());
                    setIsEditing(true);
                  }}
                  className="px-5 py-2.5 rounded-xl bg-[#18281e] text-white hover:bg-[#2d4a35] text-xs font-bold transition-all shadow-md hover:shadow-lg flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-[16px]">edit</span> Edit Details
                </button>
                {app.completionStatus === 'Partial' && (
                  <button onClick={handlePromoteDraft} className="px-5 py-2.5 rounded-xl bg-[#10b981] text-white hover:bg-[#059669] text-xs font-bold transition-all shadow-md hover:shadow-lg flex items-center gap-2">
                    <span className="material-symbols-outlined text-[16px]">check_circle</span> Promote to Completed
                  </button>
                )}
              </>
            )}
            {isEditing && (
              <div className="flex items-center gap-2 animate-in slide-in-from-right-4 fade-in duration-300">
                <button onClick={() => { setIsEditing(false); setEditData(buildEditData()); }} className="px-5 py-2.5 rounded-xl bg-white border border-[#e5e2e1] hover:bg-[#f8f6f4] text-[#434844] text-xs font-bold transition-all">
                  Cancel
                </button>
                <button onClick={handleSave} className="px-5 py-2.5 rounded-xl bg-[#fea619] text-[#18281e] hover:bg-[#f9c35a] text-xs font-bold transition-all shadow-md hover:-translate-y-0.5 flex items-center gap-2">
                  <span className="material-symbols-outlined text-[16px]">save</span> Save Changes
                </button>
              </div>
            )}
            <div className="w-px h-8 bg-[#e5e2e1] mx-1"></div>
            <button onClick={onClose} className="p-2.5 rounded-xl bg-[#f8f6f4] hover:bg-red-50 hover:text-red-600 text-[#737873] transition-all shadow-inner hover:shadow-none">
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-auto p-8 space-y-8 bg-[#fafaf9]">
          
          {app.isLocked && (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm">
                <span className="material-symbols-outlined text-red-500">lock</span>
              </div>
              <div>
                <p className="text-sm font-bold text-red-800">Record Locked</p>
                <p className="text-xs font-medium text-red-600/80">This application is locked by an administrator and cannot be edited without unlocking first.</p>
              </div>
            </div>
          )}

          {/* Basic Info */}
          <section className="bg-white rounded-[20px] shadow-sm p-7 border border-[#f0eded] relative overflow-hidden transition-all duration-300 hover:shadow-md">
            <div className="absolute top-0 left-0 w-1.5 h-full bg-[#18281e]" />
            <h3 className="font-headline text-sm font-bold text-[#18281e] mb-6 uppercase tracking-[0.15em] flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">person</span> Basic Information
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-7">
              {renderField('Student Name', 'student_name')}
              {renderField('Branch', 'student_branch')}
              {renderField('Age', 'student_age')}
              {renderField('Date of Birth', 'student_dob')}
              <div>
                <label className={sectionLabelCls}>Gender</label>
                {isEditing ? (
                  <select name="student_gender" value={((editData as any).student_gender as string) ?? (viewModel.student_gender as string) ?? ''} onChange={handleChange} className={inputCls}>
                    <option value="">Select</option>
                    <option>Male</option>
                    <option>Female</option>
                    <option>Other</option>
                  </select>
                ) : <p className={sectionValueCls}>{(viewModel.student_gender as string) || '—'}</p>}
              </div>
            </div>
            <div className="mt-6 pt-6 border-t border-[#f0eded]">
              <h4 className="font-headline text-xs font-bold text-[#18281e] mb-4 uppercase tracking-[0.15em]">Additional Information</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-7">
                {renderField('Aadhar Number', 'aadhar_number')}
              </div>
            </div>
          </section>

          {/* Parents Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <section className="bg-white rounded-[20px] p-7 shadow-sm border border-[#f0eded] transition-all hover:shadow-md">
              <h3 className="font-headline text-sm font-bold text-[#3b5e8a] mb-6 uppercase tracking-[0.15em] flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px]">man</span> Father's Information
              </h3>
              <div className="grid grid-cols-2 gap-6">
                {renderField('Father Name', 'father_name')}
                {renderField('Occupation Type', 'father_occupation_type')}
                {renderField('Occupation', 'father_occupation')}
                {renderField('Annual Income', 'father_income')}
                {renderField('Contact Number', 'father_mobile')}
              </div>
            </section>
            <section className="bg-white rounded-[20px] p-7 shadow-sm border border-[#f0eded] transition-all hover:shadow-md">
              <h3 className="font-headline text-sm font-bold text-[#8a3b5c] mb-6 uppercase tracking-[0.15em] flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px]">woman</span> Mother's Information
              </h3>
              <div className="grid grid-cols-2 gap-6">
                {renderField('Mother Name', 'mother_name')}
                {renderField('Occupation Type', 'mother_occupation_type')}
                {renderField('Occupation', 'mother_occupation')}
                {renderField('Annual Income', 'mother_income')}
                {renderField('Mobile', 'mother_mobile')}
              </div>
            </section>
          </div>

          {/* Contact & Address Details */}
          <section className="bg-white rounded-[20px] shadow-sm overflow-hidden border border-[#f0eded]">
            <div className="flex flex-col md:flex-row">
              <div className="p-7 flex-1 border-b md:border-b-0 md:border-r border-[#f0eded]">
                <h3 className="font-headline text-sm font-bold text-[#18281e] mb-6 uppercase tracking-[0.15em] flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px]">contact_phone</span> Contact & Address
                </h3>
                <div className="grid grid-cols-2 gap-6 mb-7">
                  {renderField('Student Mobile', 'student_mobile')}
                  {renderField('Student Email', 'student_email')}
                  {renderField('Guardian Name', 'guardian_name')}
                </div>
                <div className="space-y-5">
                  {renderField('Permanent Address', 'permanent_address')}
                  <div className="grid grid-cols-2 gap-6">
                    {renderField('District', 'permanent_city')}
                    {renderField('State', 'permanent_state')}
                  </div>
                  {renderField('Communication Address', 'communication_address')}
                  <div className="grid grid-cols-2 gap-6">
                    {renderField('Communication City', 'communication_city')}
                    {renderField('Communication State', 'communication_state')}
                  </div>
                </div>
              </div>
              <div className="p-7 flex-1 bg-gradient-to-br from-transparent to-[#f8f6f4]/50">
                <h3 className="font-headline text-sm font-bold text-[#18281e] mb-6 uppercase tracking-[0.15em] flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px]">fingerprint</span> Personal Details
                </h3>
                <div className="grid grid-cols-2 gap-6">
                  {renderField('Mother Tongue', 'mother_tongue')}
                  {renderField('Nationality', 'nationality')}
                  {renderField('Caste', 'caste')}
                  {renderField('Religion', 'religion')}
                  {renderField('Residential Status', 'residential_status')}
                  {renderField('Specially Abled', 'student_specially_abled')}
                  {renderField('Studied VIII-XII in TN', 'tn_study')}
                  {renderField('Govt School VI-XII', 'govt_school')}
                </div>
              </div>
            </div>
          </section>

          {/* Academic Info & Other Info Row */}
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
            <section className="xl:col-span-7 bg-white rounded-[20px] shadow-sm p-7 border border-[#f0eded] relative overflow-hidden transition-all hover:shadow-md">
              <div className="absolute top-0 left-0 w-1.5 h-full bg-[#fea619]" />
              <h3 className="font-headline text-sm font-bold text-[#18281e] mb-6 uppercase tracking-[0.15em] flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px]">school</span> Academic Information
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
                {renderField('Admission Date', 'admission_date')}
                {renderField('Admission Year', 'admission_year')}
                {renderField('HSC Board', 'board_studied')}
                {renderField('Batch', 'admission_batch')}
                {renderField('Cut off Mark', 'mark_cutoff')}
                {renderField('PCM Target', 'pcm_target')}
                {renderField('XII Physics', 'mark_physics')}
                {renderField('XII Chemistry', 'mark_chemistry')}
                {renderField('XII Maths', 'mark_maths')}
              </div>
            </section>

            <section className="xl:col-span-5 bg-white rounded-[20px] shadow-sm p-7 border border-[#f0eded] transition-all hover:shadow-md">
              <h3 className="font-headline text-sm font-bold text-[#18281e] mb-6 uppercase tracking-[0.15em] flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px]">info</span> Other Information
              </h3>
              <div className="grid grid-cols-2 gap-5">
                {renderField('GQ/MQ Number', 'admission_allotment_number')}
                {renderField('Quota Type (GQ/MQ)', 'admission_category')}
                {renderField('EMIS No', 'emis_number')}
                {renderField('Civic Status', 'civic_status')}
                {renderField('School Location', 'school_location')}
                {renderField('Relatives in College', 'relative_name')}
                <div className="col-span-2">
                  {renderField('How do you know PSNA', 'hear_about_psna')}
                </div>
              </div>
            </section>
          </div>

          {/* School Details */}
          <section className="bg-white rounded-[20px] shadow-sm overflow-hidden border border-[#f0eded]">
            <div className="bg-[#f8f6f4] px-7 py-5 border-b border-[#e5e2e1]">
              <h3 className="font-headline text-sm font-bold text-[#18281e] uppercase tracking-[0.15em] flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px]">account_balance</span> School Details - Class-wise Information
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-white">
                    {['Class', 'Year', 'School', 'Category', 'Medium', 'Block', 'Score %'].map(th => (
                      <th key={th} className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.13em] text-[#737873] border-b border-[#f0eded]">{th}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f0eded]">
                  {['VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'].map((c, i) => (
                    <tr key={c} className="hover:bg-[#fafaf9] transition-colors">
                      <td className="px-6 py-4 font-black text-sm text-[#18281e]">Class {c}</td>
                      <td className="px-6 py-4 text-sm font-semibold text-[#434844]">
                          {renderClassField(c, 'year_passing', '—', true)}
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold text-[#434844]">
                        <div className="w-40 sm:w-auto truncate">
                          {renderClassField(c, 'name', '—')}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-xs font-semibold text-[#737873]">
                        {renderClassField(c, 'category', '—')}
                      </td>
                      <td className="px-6 py-4 text-xs font-semibold text-[#737873]">
                        {renderClassField(c, 'medium', '—')}
                      </td>
                      <td className="px-6 py-4 text-xs font-semibold text-[#737873]">
                        {renderClassField(c, 'block', '—')}
                      </td>
                      <td className="px-6 py-4 text-sm font-black text-[#18281e]">
                        {renderClassField(c, 'score', '—', true)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Uploaded Documents */}
          <section className="bg-white rounded-[20px] shadow-sm p-7 border border-[#f0eded] border-t-8 border-t-[#3b8a53] relative">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
              <div>
                <h3 className="font-headline text-lg font-bold text-[#18281e] flex items-center gap-2">
                  <span className="material-symbols-outlined text-[20px]">folder_special</span>
                  Uploaded Documents
                </h3>
                <p className="text-xs font-semibold text-[#737873] mt-1">Student uploaded files for each required document category.</p>
              </div>
              {uploadedDocuments.length > 0 && (
                <button
                  onClick={handleBulkDownload}
                  className="px-4 py-2 bg-gradient-to-r from-[#3b8a53] to-[#2d6640] hover:from-[#2d6640] hover:to-[#205032] text-white text-xs font-bold rounded-lg transition-all flex items-center gap-2 shadow-sm hover:shadow-md"
                >
                  <span className="material-symbols-outlined text-[16px]">download_folder</span>
                  Download All
                </button>
              )}
            </div>

            {docsLoading ? (
              <div className="flex items-center justify-center py-8">
                <p className="text-sm text-[#737873]">Loading documents...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {['Aadhar Card', '10th Marksheet', '11th Marksheet', '12th Marksheet', 'TC Certificate', 'Community Certificate', 'Income Certificate', 'Allotment Order', 'First Graduate Certificate (if applicable)', 'Migration Certificate (for CBSE/Other State)', 'Special Reservation Certificate (if applicable)'].map((category) => {
                  const categoryDocs = uploadedDocuments.filter(d => d.document_category === category);
                  return (
                    <div key={category} className="bg-gradient-to-b from-white to-[#fafaf9] rounded-2xl border border-[#e5e2e1] p-4 shadow-sm hover:shadow-md hover:border-[#3b8a53]/50 transition-all">
                      <h4 className="text-xs font-black text-[#3b8a53] uppercase tracking-wider mb-3">{category}</h4>
                      
                      <label className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg bg-[#18281e] text-white text-xs font-bold cursor-pointer hover:bg-[#2d4a35] transition-all mb-3 shadow-sm">
                        <span className="material-symbols-outlined text-[16px]">cloud_upload</span>
                        <span>Upload</span>
                        <input
                          type="file"
                          accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif"
                          onChange={(e) => {
                            if (e.target.files?.[0]) {
                              handleUploadDocument(e.target.files[0], category);
                            }
                          }}
                          className="hidden"
                        />
                      </label>

                      <div className="space-y-2">
                        {categoryDocs.length > 0 ? (
                          categoryDocs.map((doc) => (
                            <div key={doc.id} className="bg-white rounded-lg border border-[#e5e2e1] p-3 hover:border-[#3b8a53] transition-all">
                              <div className="flex items-start gap-2">
                                {isImageFile(doc.file_name) ? (
                                  <div className="w-10 h-10 rounded-lg bg-[#f0eded] flex-shrink-0 overflow-hidden">
                                    <img 
                                      src={`/api/documents/download?fileKey=${encodeURIComponent(doc.file_key)}`}
                                      alt={doc.file_name}
                                      className="w-full h-full object-cover"
                                    />
                                  </div>
                                ) : (
                                  <div className="w-10 h-10 rounded-lg bg-[#f0eded] flex items-center justify-center flex-shrink-0">
                                    <span className="material-symbols-outlined text-[#3b8a53] text-[18px]">{getFileIcon(doc.file_type)}</span>
                                  </div>
                                )}
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-semibold text-[#18281e] truncate">{doc.file_name}</p>
                                  <p className="text-[10px] text-[#737873]">{(doc.file_size / 1024).toFixed(1)} KB</p>
                                </div>
                              </div>
                              <div className="flex gap-1 mt-2">
                                <button
                                  onClick={() => handleDownloadDocument(doc)}
                                  className="flex-1 py-1.5 bg-white border border-[#e5e2e1] hover:bg-[#f8f6f4] rounded text-[10px] font-bold text-[#3b8a53] transition-all flex items-center justify-center gap-1"
                                  title="Download"
                                >
                                  <span className="material-symbols-outlined text-[12px]">download</span>
                                </button>
                                <button
                                  onClick={() => handleDeleteDocument(doc.id)}
                                  className="py-1.5 px-2 bg-red-50 border border-red-200 hover:bg-red-100 rounded text-[10px] font-bold text-red-600 transition-all"
                                  title="Delete"
                                >
                                  <span className="material-symbols-outlined text-[12px]">close</span>
                                </button>
                              </div>
                            </div>
                          ))
                        ) : (
                          <p className="text-center text-[#737873] text-[11px] py-4">No files</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>



          {/* Full User Form Payload - REMOVED */}

        </div>
      </div>
    </div>
  );
}
