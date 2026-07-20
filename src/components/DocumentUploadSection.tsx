import React, { useEffect, useState } from 'react';

interface UploadedFile {
  id: number;
  name: string;
  size: number;
  type: string;
  uploaded_at: string;
  file_name: string;
  file_key: string;
}

const DOCUMENT_CATEGORIES = [
  'Aadhar Card',
  '10th Marksheet',
  '11th Marksheet',
  '12th Marksheet',
  'TC Certificate',
  'Community Certificate',
  'Income Certificate',
  'Allotment Order',
  'First Graduate Certificate (if applicable)',
  'Migration Certificate (for CBSE/Other State)',
  'Special Reservation Certificate (if applicable)',
];

export function DocumentUploadSection() {
  const [uploadedDocs, setUploadedDocs] = useState<{ [key: string]: UploadedFile[] }>({});
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/documents', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        const grouped: { [key: string]: UploadedFile[] } = {};
        DOCUMENT_CATEGORIES.forEach(cat => {
          grouped[cat] = [];
        });
        (data.documents || []).forEach((doc: any) => {
          if (!grouped[doc.document_category]) {
            grouped[doc.document_category] = [];
          }
          grouped[doc.document_category].push({
            id: doc.id,
            name: doc.file_name,
            size: doc.file_size,
            type: doc.file_type,
            uploaded_at: doc.uploaded_at,
            file_name: doc.file_name,
            file_key: doc.file_key,
          });
        });
        setUploadedDocs(grouped);
      }
    } catch (e) {
      console.error('Failed to load documents:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, category: string) => {
    const files = e.currentTarget.files;
    const inputElement = e.currentTarget;
    if (!files) return;

    setUploading(true);
    setMessage('');

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const formData = new FormData();
      formData.append('file', file);
      formData.append('category', category);

      try {
        const res = await fetch('/api/documents', {
          method: 'POST',
          credentials: 'include',
          body: formData,
        });

        if (res.ok) {
          setMessage(`${file.name} uploaded successfully`);
          await loadDocuments();
        } else {
          const error = await res.json();
          setMessage(`Failed to upload ${file.name}: ${error.error}`);
        }
      } catch (error) {
        setMessage(`Error uploading ${file.name}`);
      }
    }

    setUploading(false);
    if (inputElement) {
      inputElement.value = '';
    }

    // Clear message after 5 seconds
    setTimeout(() => setMessage(''), 5000);
  };

  const handleDelete = async (docId: number) => {
    if (!confirm('Delete this file?')) return;

    try {
      const res = await fetch(`/api/documents?id=${docId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (res.ok) {
        setMessage('File deleted');
        await loadDocuments();
      }
    } catch (error) {
      setMessage('Failed to delete file');
    }
  };

  const handleDownload = (doc: UploadedFile) => {
    const link = document.createElement('a');
    link.href = `/api/documents/download?fileKey=${encodeURIComponent(doc.file_key)}`;
    link.download = doc.file_name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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

  return (
    <div className="w-full max-w-6xl mx-auto p-6 bg-white rounded-2xl shadow-sm border border-[#f0eded] border-t-8 border-t-[#3b8a53]">
      <h3 className="font-headline text-lg font-bold text-[#18281e] mb-2 flex items-center gap-2">
        <span className="material-symbols-outlined text-[20px]">folder_special</span>
        Uploaded Documents
      </h3>
      <p className="text-sm text-[#737873] mb-6">
        Upload required documents. You can upload multiple files for each category. Image files will be displayed as thumbnails.
      </p>

      {message && (
        <div className={`mb-6 p-4 rounded-lg text-sm font-semibold ${
          message.includes('successfully') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
        }`}>
          {message}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {DOCUMENT_CATEGORIES.map((category) => (
          <div key={category} className="bg-gradient-to-b from-white to-[#fafaf9] rounded-2xl border border-[#e5e2e1] p-4 shadow-sm hover:shadow-md hover:border-[#3b8a53]/50 transition-all">
            <div className="flex items-start gap-2 mb-3">
              <span className="material-symbols-outlined text-[18px] text-[#18281e]">description</span>
              <h4 className="font-semibold text-sm text-[#18281e]">{category}</h4>
            </div>

            {/* Upload Button */}
            <label className="flex items-center justify-center gap-2 px-3 py-2.5 min-h-[44px] rounded-lg bg-[#18281e] text-white text-xs font-extrabold cursor-pointer hover:bg-[#2d4a35] active:scale-95 transition-all mb-3 shadow-sm hover:shadow-md">
              <span className="material-symbols-outlined text-[18px]">cloud_upload</span>
              <span>Upload Document</span>
              <input
                type="file"
                multiple
                accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif"
                onChange={(e) => handleFileUpload(e, category)}
                disabled={uploading}
                className="hidden"
              />
            </label>

            {/* Uploaded Files List */}
            <div className="space-y-2">
              {loading ? (
                <p className="text-center text-[#737873] text-[11px] py-3">Loading...</p>
              ) : (uploadedDocs[category] || []).length > 0 ? (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {(uploadedDocs[category] || []).map((doc) => (
                    <div key={doc.id} className="bg-white rounded-lg border border-[#e5e2e1] p-3 hover:border-[#3b8a53] hover:shadow-sm transition-all">
                      <div className="flex items-start gap-3">
                        {/* File Icon/Preview */}
                        <div className="flex-shrink-0">
                          {isImageFile(doc.file_name) ? (
                            <div className="w-12 h-12 rounded-lg bg-[#f0eded] flex items-center justify-center overflow-hidden">
                              <img 
                                src={`/api/documents/download?fileKey=${encodeURIComponent(doc.file_key)}`}
                                alt={doc.file_name}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          ) : (
                            <div className="w-12 h-12 rounded-lg bg-[#f0eded] flex items-center justify-center">
                              <span className="material-symbols-outlined text-[#3b8a53] text-[24px]">{getFileIcon(doc.type)}</span>
                            </div>
                          )}
                        </div>

                        {/* File Info */}
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-[#18281e] text-xs truncate">{doc.file_name}</p>
                          <p className="text-[#737873] text-[10px] mt-1">
                            {(doc.size / 1024).toFixed(1)} KB • {new Date(doc.uploaded_at).toLocaleDateString()}
                          </p>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-1 flex-shrink-0">
                          <button
                            onClick={() => handleDownload(doc)}
                            className="p-1.5 text-[#3b8a53] hover:bg-[#f0eded] rounded transition-colors"
                            title="Download"
                          >
                            <span className="material-symbols-outlined text-[16px]">download</span>
                          </button>
                          <button
                            onClick={() => handleDelete(doc.id)}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                            title="Delete"
                          >
                            <span className="material-symbols-outlined text-[16px]">close</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-[#737873] text-[11px] py-3">No files uploaded</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
