import React, { useState } from 'react';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { UploadedDocument } from '../services/storage';
import {
  FolderOpen,
  Upload,
  Search,
  FileText,
  Trash2,
  Download,
  Eye,
  File,
  X,
  Plus,
  AlertCircle,
  FileCheck,
} from 'lucide-react';

interface MyDocumentsPageProps {
  documents: UploadedDocument[];
  onUpload: (doc: UploadedDocument) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onNotification: (msg: string) => void;
}

export const MyDocumentsPage: React.FC<MyDocumentsPageProps> = ({
  documents,
  onUpload,
  onDelete,
  onNotification,
}) => {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<UploadedDocument | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Form State
  const [uploadFileName, setUploadFileName] = useState('');
  const [uploadCategory, setUploadCategory] = useState('Education');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const categories = ['All', 'Education', 'Identity', 'Health', 'Vehicle', 'Other'];

  const filteredDocs = documents.filter((doc) => {
    const matchesSearch =
      doc.name.toLowerCase().includes(search.toLowerCase()) ||
      doc.category.toLowerCase().includes(search.toLowerCase());
    const matchesCat = selectedCategory === 'All' || doc.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  const handleFileChange = (file: File) => {
    setSelectedFile(file);
    if (!uploadFileName) {
      // default name without extension
      const nameWithoutExt = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
      setUploadFileName(nameWithoutExt);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleSaveUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      onNotification('Please select a file to upload.');
      return;
    }

    setIsUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const dataUrl = reader.result as string;
        const newDoc: UploadedDocument = {
          id: `up_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          name: uploadFileName.trim() || selectedFile.name,
          category: uploadCategory,
          fileSize: selectedFile.size,
          mimeType: selectedFile.type || 'application/octet-stream',
          dataUrl,
          createdAt: new Date().toISOString(),
        };

        await onUpload(newDoc);
        onNotification(`Successfully uploaded "${newDoc.name}".`);
        setIsUploadModalOpen(false);
        setSelectedFile(null);
        setUploadFileName('');
      };
      reader.readAsDataURL(selectedFile);
    } catch {
      onNotification('Failed to process file upload.');
    } finally {
      setIsUploading(false);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-xs font-medium text-slate-500 mb-1">
            <span>DigiLocker Services</span>
            <span>/</span>
            <span className="text-blue-700 font-semibold">My Documents</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
            My Documents (Self-Uploaded)
          </h1>
          <p className="text-sm text-slate-500 mt-1 max-w-2xl">
            Store scanned copies of personal documents, receipts, and certificates.
            All files remain stored locally on your device in your private client vault.
          </p>
        </div>

        <Button
          onClick={() => setIsUploadModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white gap-2 shadow-xs shrink-0"
        >
          <Upload className="size-4" />
          Upload Document
        </Button>
      </div>

      {/* Distinction Banner: DigiLocker Requirement */}
      <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-50 border border-amber-200/80 text-amber-900 text-xs">
        <AlertCircle className="size-4 text-amber-600 shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <span className="font-semibold text-amber-950">Self-Uploaded Documents vs. Issued Documents</span>
          <p className="text-amber-800 leading-relaxed">
            Documents uploaded here are for your personal reference and record-keeping. Unlike{' '}
            <span className="font-semibold text-amber-950">Issued Documents</span>, self-uploaded files
            are not cryptographically signed by institutional authorities and cannot be verified via SD-JWT.
          </p>
        </div>
      </div>

      {/* Search and Category Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                selectedCategory === cat
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="w-full sm:w-72 relative">
          <Search className="size-4 text-slate-400 absolute left-3 top-2.5" />
          <Input
            type="text"
            placeholder="Search by file name or category..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9 text-xs bg-white"
          />
        </div>
      </div>

      {/* Documents List / Grid */}
      {filteredDocs.length === 0 ? (
        <Card className="border-dashed border-2 border-slate-200 p-12 text-center bg-white rounded-2xl">
          <div className="size-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-3">
            <FolderOpen className="size-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900">No documents found</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            {search || selectedCategory !== 'All'
              ? 'No documents match your filter criteria.'
              : 'You have not uploaded any personal documents yet. Click below to add files.'}
          </p>
          <Button
            onClick={() => setIsUploadModalOpen(true)}
            size="sm"
            className="mt-4 bg-blue-600 hover:bg-blue-700 text-white gap-2"
          >
            <Plus className="size-4" />
            Upload Your First Document
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDocs.map((doc) => {
            const isImage = doc.mimeType.startsWith('image/');
            const isPdf = doc.mimeType.includes('pdf');

            return (
              <Card
                key={doc.id}
                className="bg-white border-slate-200 hover:shadow-md transition-shadow duration-150 rounded-xl overflow-hidden flex flex-col justify-between"
              >
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="size-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600 shrink-0">
                        {isPdf ? (
                          <FileText className="size-5 text-red-500" />
                        ) : isImage ? (
                          <File className="size-5 text-blue-500" />
                        ) : (
                          <FolderOpen className="size-5 text-slate-500" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-sm font-bold text-slate-900 truncate" title={doc.name}>
                          {doc.name}
                        </h4>
                        <div className="flex items-center gap-2 mt-0.5">
                          <Badge variant="secondary" className="text-[10px] py-0 px-1.5 font-normal">
                            {doc.category}
                          </Badge>
                          <span className="text-[11px] text-slate-400 font-mono">
                            {formatFileSize(doc.fileSize)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                    <span className="flex items-center gap-1 font-medium text-slate-500">
                      <FileCheck className="size-3 text-slate-400" />
                      Self-Uploaded
                    </span>
                    <span>{new Date(doc.createdAt).toLocaleDateString()}</span>
                  </div>
                </CardContent>

                <div className="px-4 py-2.5 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1">
                    {doc.dataUrl && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setPreviewDoc(doc)}
                        className="h-8 px-2 text-xs text-slate-600 hover:text-slate-900 gap-1"
                      >
                        <Eye className="size-3.5" />
                        Preview
                      </Button>
                    )}
                    {doc.dataUrl && (
                      <a
                        href={doc.dataUrl}
                        download={doc.name}
                        className="inline-flex items-center gap-1 h-8 px-2 text-xs font-medium text-slate-600 hover:text-slate-900 rounded-md hover:bg-slate-100 transition-colors"
                      >
                        <Download className="size-3.5" />
                        Download
                      </a>
                    )}
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setDeleteConfirmId(doc.id)}
                    className="h-8 px-2 text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Upload Modal */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-lg w-full p-6 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="size-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Upload className="size-4" />
                </div>
                <h3 className="text-base font-bold text-slate-900">Upload to Personal Vault</h3>
              </div>
              <button
                onClick={() => setIsUploadModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="size-4" />
              </button>
            </div>

            <form onSubmit={handleSaveUpload} className="space-y-4">
              {/* Drag and Drop Box */}
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
                  dragOver
                    ? 'border-blue-500 bg-blue-50/50'
                    : selectedFile
                    ? 'border-emerald-300 bg-emerald-50/30'
                    : 'border-slate-200 bg-slate-50/50 hover:bg-slate-50'
                }`}
                onClick={() => {
                  const input = document.getElementById('file-upload-input');
                  input?.click();
                }}
              >
                <input
                  id="file-upload-input"
                  type="file"
                  className="hidden"
                  accept=".pdf,.png,.jpg,.jpeg,.webp"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleFileChange(e.target.files[0]);
                    }
                  }}
                />
                <Upload className="size-8 mx-auto text-slate-400 mb-2" />
                {selectedFile ? (
                  <div>
                    <p className="text-xs font-bold text-emerald-700">{selectedFile.name}</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {formatFileSize(selectedFile.size)} &middot; Click to change file
                    </p>
                  </div>
                ) : (
                  <div>
                    <p className="text-xs font-semibold text-slate-700">
                      Click to choose a file or drag & drop here
                    </p>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Supports PDF, PNG, JPG, JPEG (Max 10MB)
                    </p>
                  </div>
                )}
              </div>

              {/* Document Name */}
              <div className="space-y-1.5">
                <Label htmlFor="doc-name" className="text-xs font-semibold text-slate-700">
                  Document Name
                </Label>
                <Input
                  id="doc-name"
                  type="text"
                  placeholder="e.g. 10th Marksheet, Rent Agreement"
                  value={uploadFileName}
                  onChange={(e) => setUploadFileName(e.target.value)}
                  className="text-xs h-9"
                  required
                />
              </div>

              {/* Document Category */}
              <div className="space-y-1.5">
                <Label htmlFor="doc-cat" className="text-xs font-semibold text-slate-700">
                  Document Category
                </Label>
                <select
                  id="doc-cat"
                  value={uploadCategory}
                  onChange={(e) => setUploadCategory(e.target.value)}
                  className="w-full h-9 rounded-lg border border-slate-200 bg-white px-3 text-xs text-slate-900 focus:outline-none focus:border-blue-500"
                >
                  <option value="Education">Education & Academic</option>
                  <option value="Identity">Identity & Citizenship</option>
                  <option value="Health">Health & Medical</option>
                  <option value="Vehicle">Transport & Vehicle</option>
                  <option value="Other">Other Personal Records</option>
                </select>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsUploadModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={!selectedFile || isUploading}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {isUploading ? 'Saving...' : 'Save to Vault'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[85vh] flex flex-col overflow-hidden shadow-2xl">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="font-bold text-sm text-slate-900">{previewDoc.name}</h3>
                <span className="text-[11px] text-slate-500">{previewDoc.category}</span>
              </div>
              <button
                onClick={() => setPreviewDoc(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="size-4" />
              </button>
            </div>
            <div className="p-6 overflow-auto flex-1 flex items-center justify-center bg-slate-100 min-h-[300px]">
              {previewDoc.mimeType.startsWith('image/') ? (
                <img
                  src={previewDoc.dataUrl}
                  alt={previewDoc.name}
                  className="max-h-[60vh] max-w-full object-contain rounded-lg shadow-sm"
                />
              ) : (
                <div className="text-center p-8 bg-white rounded-xl shadow-xs border border-slate-200 max-w-md">
                  <FileText className="size-12 text-red-500 mx-auto mb-3" />
                  <p className="font-bold text-slate-900 text-sm">{previewDoc.name}</p>
                  <p className="text-xs text-slate-500 mt-1">PDF Document ({formatFileSize(previewDoc.fileSize)})</p>
                  <a
                    href={previewDoc.dataUrl}
                    download={previewDoc.name}
                    className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 transition-colors shadow-xs"
                  >
                    <Download className="size-3.5" />
                    Download File
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-sm w-full p-5 space-y-4 shadow-xl border border-slate-200">
            <h4 className="font-bold text-slate-900 text-sm">Delete Document?</h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Are you sure you want to delete this document from your vault? This action cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={() => setDeleteConfirmId(null)}>
                Cancel
              </Button>
              <Button
                size="sm"
                className="bg-red-600 hover:bg-red-700 text-white"
                onClick={async () => {
                  await onDelete(deleteConfirmId);
                  setDeleteConfirmId(null);
                  onNotification('Document deleted from vault.');
                }}
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
