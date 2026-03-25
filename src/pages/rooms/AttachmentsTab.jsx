import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { TabsContent } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/components/ui/use-toast';
import { Paperclip, Download, Search, UploadCloud, RefreshCw, X, FileText, Image, File } from 'lucide-react';
import * as forumAttachmentService from '@/services/forumAttachmentService';
import * as topicService from '@/services/topicService';
import { getAccessToken } from '@/services/api';
import { useBootstrapSession } from '../../services/authHooks';

// Constants
const ITEMS_PER_PAGE = 20;

// Utility functions
const formatDate = (value) => {
  if (!value) return '-';
  try {
    const date = new Date(value);
    if (isNaN(date.getTime())) return value;
    return date.toLocaleDateString('id-ID', { 
      day: '2-digit', 
      month: 'short', 
      year: 'numeric' 
    });
  } catch {
    return value;
  }
};

const formatFileSize = (bytes) => {
  if (!bytes && bytes !== 0) return '-';
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let unitIndex = 0;
  
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  
  return `${size.toFixed(1)} ${units[unitIndex]}`;
};

// Fungsi untuk mendapatkan icon berdasarkan tipe file
const getFileIcon = (filename) => {
  const extension = filename?.split('.').pop()?.toLowerCase();
  
  if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(extension)) {
    return <Image className="h-4 w-4 text-blue-500" />;
  } else if (extension === 'pdf') {
    return <FileText className="h-4 w-4 text-red-500" />;
  } else if (['doc', 'docx'].includes(extension)) {
    return <FileText className="h-4 w-4 text-blue-700" />;
  } else if (['xls', 'xlsx'].includes(extension)) {
    return <FileText className="h-4 w-4 text-green-600" />;
  }
  return <File className="h-4 w-4 text-gray-500" />;
};

// Fungsi untuk mendapatkan nama file yang benar
const resolveFilename = (document) => {
  // Coba semua kemungkinan field yang mungkin berisi nama file
  const filename = document?.original_filename || 
                   document?.display_name ||
                   document?.filename ||
                   document?.original_name ||
                   document?.name || 
                   document?.file_name || 
                   document?.originalFile ||
                   document?.originalName ||
                   'Lampiran';
  
  return filename;
};

// Skeleton Component
const DocumentSkeleton = () => (
  <div className="space-y-2">
    {Array.from({ length: 4 }).map((_, idx) => (
      <div key={idx} className="border rounded-md p-4">
        <div className="flex items-center gap-3">
          <Skeleton className="h-8 w-8 rounded" />
          <div className="flex-1">
            <Skeleton className="h-5 w-3/4 mb-2" />
            <Skeleton className="h-4 w-1/4" />
          </div>
        </div>
      </div>
    ))}
  </div>
);

// Empty State Component
const EmptyState = () => (
  <div className="text-center py-12">
    <Paperclip className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
    <p className="text-sm text-muted-foreground">
      Belum ada dokumen yang diunggah.
    </p>
    <p className="text-xs text-muted-foreground mt-1">
      Klik tombol Upload untuk menambahkan dokumen
    </p>
  </div>
);

// Error State Component
const ErrorState = ({ message, onRetry }) => (
  <div className="text-center py-8">
    <p className="text-sm text-rose-600 mb-3">{message}</p>
    <Button variant="outline" size="sm" onClick={onRetry}>
      <RefreshCw className="h-3 w-3 mr-2" />
      Coba Lagi
    </Button>
  </div>
);

// Pagination Component
const Pagination = ({ currentPage, lastPage, onPageChange, isLoading }) => {
  return (
    <div className="flex items-center justify-between pt-4 text-xs text-muted-foreground border-t">
      <span>
        Halaman {currentPage} dari {lastPage || 1}
      </span>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1 || isLoading}
        >
          Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= (lastPage || 1) || isLoading}
        >
          Next
        </Button>
      </div>
    </div>
  );
};

// Main Component
export default function AttachmentsTab({ roomId }) {
  // Cek session
  const { isReady, isRefreshing } = useBootstrapSession();
  
  // State management
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ current_page: 1, last_page: 1 });
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [downloadLoading, setDownloadLoading] = useState({});
  const [downloadProgress, setDownloadProgress] = useState({});

  // Query params
  const queryParams = useMemo(() => ({
    per_page: ITEMS_PER_PAGE,
    page,
    search: search.trim() || undefined,
  }), [page, search]);

  // Load documents
  const loadDocuments = useCallback(async () => {
    if (!isReady) return;
    if (!roomId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const res = await forumAttachmentService.listForumAttachments(roomId, queryParams);
      setDocuments(res?.attachments ?? []);
      setPagination(res?.pagination ?? { current_page: 1, last_page: 1 });
    } catch (err) {
      const errorMessage = err?.response?.data?.message || err?.message || 'Gagal memuat lampiran.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [queryParams, isReady, roomId]);

  // Initial load
  useEffect(() => {
    if (isReady) {
      loadDocuments();
    }
  }, [loadDocuments, isReady]);

  // Handlers
  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    setPage(1);
  };

  const handleClearSearch = () => {
    setSearch('');
    setPage(1);
  };

  const handlePageChange = (newPage) => {
    setPage(newPage);
  };

  const handleFileChange = (e) => {
    setSelectedFile(e.target.files?.[0] || null);
    setUploadError(null);
  };

  const handleUpload = async () => {
    if (!selectedFile || uploading) return;
    
    setUploading(true);
    setUploadError(null);
    
    try {
      if (!roomId) {
        throw new Error('Forum ID tidak ditemukan')
      }
      await forumAttachmentService.uploadForumAttachment(roomId, selectedFile);
      setSelectedFile(null);
      
      // Reset file input
      const fileInput = document.querySelector('input[type="file"]');
      if (fileInput) fileInput.value = '';
      
      // Reload documents
      await loadDocuments();
      
      toast({
        title: 'Upload berhasil',
        description: 'Dokumen berhasil diunggah.',
      });
    } catch (err) {
      const errorMessage = err?.response?.data?.message || err?.message || 'Gagal mengunggah dokumen.';
      setUploadError(errorMessage);
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async (documentId, filename) => {
    // Cek token dulu
    const token = getAccessToken();
    if (!token) {
      alert('Sesi Anda telah berakhir. Silakan login kembali.');
      return;
    }

    setDownloadLoading(prev => ({ ...prev, [documentId]: true }));
    setDownloadProgress(prev => ({ ...prev, [documentId]: 0 }));
    
    try {
      // Gunakan fungsi download dari documentService
      const { blob, filename: serverFilename } = await topicService.downloadAttachment(documentId);
      setDownloadProgress(prev => ({ ...prev, [documentId]: 100 }));
      
      // Final filename
      const finalFilename = serverFilename || filename;
      
      // Buat URL object untuk blob
      const url = window.URL.createObjectURL(blob);
      
      // Buat link temporary
      const link = document.createElement('a');
      link.href = url;
      link.download = finalFilename;
      
      // Download file
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Cleanup URL object setelah delay
      setTimeout(() => {
        window.URL.revokeObjectURL(url);
      }, 100);
      
      
    } catch (error) {
      alert(error.message || 'Gagal mengunduh dokumen.');
    } finally {
      setDownloadLoading(prev => ({ ...prev, [documentId]: false }));
      setDownloadProgress(prev => ({ ...prev, [documentId]: 0 }));
    }
  };

  // Jika session sedang refresh, tampilkan loading
  if (isRefreshing) {
    return (
      <TabsContent value="attachments" className="mt-4">
        <Card>
          <CardContent className="py-8">
            <div className="text-center">
              <RefreshCw className="h-8 w-8 mx-auto animate-spin text-muted-foreground" />
              <p className="mt-2 text-sm text-muted-foreground">Memuat session...</p>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    );
  }

  // Render document list
  const renderDocumentList = () => {
    if (loading) return <DocumentSkeleton />;
    if (error) return <ErrorState message={error} onRetry={loadDocuments} />;
    if (documents.length === 0) return <EmptyState />;

    return (
      <div className="space-y-2">
        {documents.map((document) => {
          const filename = resolveFilename(document);
          const documentId = document.id;
          const isDownloading = downloadLoading[documentId];
          const progress = downloadProgress[documentId];
          const fileIcon = getFileIcon(filename);
          
          return (
            <div 
              key={document.id} 
              className="flex items-center justify-between text-sm border rounded-md px-4 py-3 hover:bg-gray-50 transition-colors group"
            >
              <div className="flex-1 min-w-0 flex items-center gap-3">
                {fileIcon}
                <div className="min-w-0">
                  <div className="font-medium text-slate-800 truncate pr-4" title={filename}>
                    {filename}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1 flex items-center gap-2">
                    <span>{formatDate(document.created_at)}</span>
                    <span>•</span>
                    <span>{formatFileSize(document.size_bytes || document.size)}</span>
                  </div>
                </div>
              </div>
              
              {documentId ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDownload(documentId, filename)}
                  disabled={isDownloading}
                  className="shrink-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50 min-w-25"
                >
                  {isDownloading ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      {progress ? `${Math.round(progress)}%` : '...'}
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </>
                  )}
                </Button>
              ) : (
                <span className="text-xs text-muted-foreground italic shrink-0">
                  File tidak tersedia
                </span>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <TabsContent value="attachments" className="mt-4">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upload Card */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <UploadCloud className="h-4 w-4" />
              Upload Dokumen
            </CardTitle>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="document-upload">Pilih File</Label>
              <Input
                id="document-upload"
                type="file"
                onChange={handleFileChange}
                accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
                disabled={uploading}
              />
              
              {selectedFile && (
                <div className="flex items-center justify-between text-xs p-2 bg-muted rounded-md">
                  <div className="truncate flex-1">
                    <span className="font-medium">{selectedFile.name}</span>
                    <span className="text-muted-foreground ml-2">
                      ({formatFileSize(selectedFile.size)})
                    </span>
                  </div>
                  <button
                    onClick={() => setSelectedFile(null)}
                    className="ml-2 text-muted-foreground hover:text-foreground"
                    disabled={uploading}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              )}
            </div>

            {uploadError && (
              <div className="text-xs text-rose-600 bg-rose-50 p-2 rounded-md">
                {uploadError}
              </div>
            )}

            <Button
              onClick={handleUpload}
              disabled={!selectedFile || uploading}
              className="w-full"
            >
              {uploading ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Mengunggah...
                </>
              ) : (
                'Upload Dokumen'
              )}
            </Button>

            <p className="text-xs text-muted-foreground text-center">
              Format: PDF, DOC, DOCX, XLS, XLSX, JPG, PNG (Max. 10MB)
            </p>
          </CardContent>
        </Card>

        {/* Documents List Card */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Paperclip className="h-4 w-4" />
                Daftar Lampiran
                {!loading && documents.length > 0 && (
                  <span className="ml-2 text-xs bg-muted px-2 py-0.5 rounded-full">
                    {documents.length}
                  </span>
                )}
              </CardTitle>
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={loadDocuments}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              {loading ? 'Memuat...' : 'Refresh'}
            </Button>
          </CardHeader>

          <CardContent>
            <div className="space-y-4">
              {/* Search Input */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={handleSearchChange}
                  placeholder="Cari dokumen berdasarkan nama..."
                  className="pl-9 pr-16"
                  disabled={loading}
                />
                
                {search && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-1/2 -translate-y-1/2 h-7 px-2 text-xs"
                    onClick={handleClearSearch}
                    disabled={loading}
                  >
                    <X className="h-3 w-3 mr-1" />
                    Clear
                  </Button>
                )}
              </div>

              {/* Documents List */}
              {renderDocumentList()}

              {/* Pagination */}
              {!loading && !error && documents.length > 0 && (
                <Pagination
                  currentPage={pagination.current_page}
                  lastPage={pagination.last_page}
                  onPageChange={handlePageChange}
                  isLoading={loading}
                />
              )}

              {/* Info message if no results for search */}
              {!loading && !error && search && documents.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-sm text-muted-foreground">
                    Tidak ada dokumen dengan nama "{search}"
                  </p>
                  <Button
                    variant="link"
                    size="sm"
                    onClick={handleClearSearch}
                    className="mt-2"
                  >
                    Clear search
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </TabsContent>
  );
}