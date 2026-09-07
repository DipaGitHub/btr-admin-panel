import { useState, useMemo, useCallback, useEffect } from "react";
import { Search, Edit2, Trash2, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import AdminLayout from "@/components/layout/AdminLayout"; 
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DialogClose } from "@radix-ui/react-dialog";
import { toast } from 'sonner'; 
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Switch } from "@/components/ui/switch"; 
import { Progress } from "@/components/ui/progress"; 

// --- Configuration ---
import { API_BASE_URL as GLOBAL_API_URL, SERVER_URL as GLOBAL_SERVER_URL } from "@/config/api";
const API_BASE_URL = `${GLOBAL_API_URL}/banners`;
const ITEMS_PER_PAGE_OPTIONS = [5, 10, 25, 50];

// --- Interfaces ---
interface BannerSubtitle {
    subtitle: string;
    description: string;
}

interface Banner {
  id: number;
  title: string;
  image_url: string; 
  is_mobile_enabled: boolean; 
  subtitles: string;
  created_at: string; 
}

interface ApiBannerResponse {
    status: number;
    message: string;
    data: Banner[];
    total: number;
}

interface BannerFormData {
    title: string;
    image: File | null;
    enableMobileDevice: boolean;
    subtitles: BannerSubtitle[];
    // For edit form:
    existingImageUrl?: string; 
}

const Banners = () => {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  
  // --- Create State ---
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createFormData, setCreateFormData] = useState<BannerFormData>({
    title: "",
    image: null,
    enableMobileDevice: false,
    subtitles: [],
  });
  
  // --- Edit State ---
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingBannerId, setEditingBannerId] = useState<number | null>(null);
  const [editFormData, setEditFormData] = useState<BannerFormData>({
    title: "",
    image: null,
    enableMobileDevice: false,
    subtitles: [],
    existingImageUrl: "",
  });

  const addSubtitleCreate = () => setCreateFormData(prev => ({ ...prev, subtitles: [...prev.subtitles, { subtitle: '', description: '' }] }));
  const updateSubtitleCreate = (index: number, field: keyof BannerSubtitle, value: string) => {
      const newSubtitles = [...createFormData.subtitles];
      newSubtitles[index][field] = value;
      setCreateFormData(prev => ({ ...prev, subtitles: newSubtitles }));
  };
  const removeSubtitleCreate = (index: number) => setCreateFormData(prev => ({ ...prev, subtitles: prev.subtitles.filter((_, i) => i !== index) }));

  const addSubtitleEdit = () => setEditFormData(prev => ({ ...prev, subtitles: [...prev.subtitles, { subtitle: '', description: '' }] }));
  const updateSubtitleEdit = (index: number, field: keyof BannerSubtitle, value: string) => {
      const newSubtitles = [...editFormData.subtitles];
      newSubtitles[index][field] = value;
      setEditFormData(prev => ({ ...prev, subtitles: newSubtitles }));
  };
  const removeSubtitleEdit = (index: number) => setEditFormData(prev => ({ ...prev, subtitles: prev.subtitles.filter((_, i) => i !== index) }));

  const [selectedBannerIds, setSelectedBannerIds] = useState<number[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(ITEMS_PER_PAGE_OPTIONS[1]); 
  
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false); // Used for both create and update
  const [error, setError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0); 

// --- API Calls (using fetch) ---

  const fetchBanners = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const url = `${API_BASE_URL}?search=${encodeURIComponent(searchTerm)}`;
      const response = await fetch(url);

      if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result: ApiBannerResponse = await response.json();
      // Ensure currentPage doesn't exceed new total pages after fetching
      const newTotalPages = Math.ceil((result.data?.length || 0) / perPage);
      if (currentPage > newTotalPages && newTotalPages > 0) {
          setCurrentPage(newTotalPages);
      } else if (newTotalPages === 0) {
          setCurrentPage(1);
      }
      setBanners(result.data || []); 
    } catch (err) {
      console.error("Error fetching banners:", err);
      setError("Failed to fetch banners. Check console for details.");
      setBanners([]); 
    } finally {
      setIsLoading(false);
    }
  }, [searchTerm, currentPage, perPage]); 

  useEffect(() => {
    fetchBanners();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchBanners]);

  // --- API Handlers ---

  const handleCreate = async () => {
    if (!createFormData.title || !createFormData.image) {
      toast.error("Title and Image are required.");
      return;
    }

    setIsProcessing(true);
    setError(null);
    setUploadProgress(0); 

    const formData = new FormData();
    formData.append('title', createFormData.title);
    formData.append('image', createFormData.image);
    formData.append('enableMobileDevice', String(createFormData.enableMobileDevice)); 
    formData.append('subtitles', JSON.stringify(createFormData.subtitles));

    try {
        const response = await fetch(`${API_BASE_URL}/create`, {
            method: 'POST',
            body: formData, 
        });

        if (!response.ok) {
            const errorResult = await response.json();
            throw new Error(errorResult.error || `Failed with status: ${response.status}`);
        }
        
        setUploadProgress(100); 

        toast.success("Banner created successfully!");
        
        setIsCreateOpen(false);
        setCreateFormData({ title: "", image: null, enableMobileDevice: false, subtitles: [] });
        
        await fetchBanners(); 
        
    } catch (err) {
        console.error('Error creating banner:', err);
        const message = err instanceof Error ? err.message : "Failed to create banner.";
        toast.error(message);
    } finally {
        setIsProcessing(false);
        setUploadProgress(0);
    }
  };

  const handleUpdate = async () => {
    if (!editingBannerId || !editFormData.title) {
        toast.error("Title is required for update.");
        return;
    }
    
    setIsProcessing(true);
    setError(null);
    setUploadProgress(0); 

    const formData = new FormData();
    formData.append('title', editFormData.title);
    // Only append image if a new one was selected
    if (editFormData.image) {
        formData.append('image', editFormData.image);
    }
    formData.append('enableMobileDevice', String(editFormData.enableMobileDevice)); 
    formData.append('subtitles', JSON.stringify(editFormData.subtitles));

    try {
        const response = await fetch(`${API_BASE_URL}/update/${editingBannerId}`, {
            method: 'PUT',
            body: formData, 
        });

        if (!response.ok) {
            const errorResult = await response.json();
            throw new Error(errorResult.error || `Failed with status: ${response.status}`);
        }
        
        setUploadProgress(100); 

        toast.success("Banner updated successfully!");
        
        setIsEditOpen(false);
        
        await fetchBanners(); 
        
    } catch (err) {
        console.error('Error updating banner:', err);
        const message = err instanceof Error ? err.message : "Failed to update banner.";
        toast.error(message);
    } finally {
        setIsProcessing(false);
        setUploadProgress(0);
    }
  };
  
  const handleEditOpen = useCallback(async (id: number) => {
    setIsProcessing(true);
    setEditingBannerId(id);
    setEditFormData({ title: "", image: null, enableMobileDevice: false, existingImageUrl: "" });

    try {
        const response = await fetch(`${API_BASE_URL}/${id}`);

        if (!response.ok) {
            const errorResult = await response.json();
            throw new Error(errorResult.error || `Failed to fetch banner data.`);
        }
        
        const result = await response.json();
        const banner: Banner = result.data;

        let parsedSubtitles = [];
        try {
            parsedSubtitles = banner.subtitles ? JSON.parse(banner.subtitles) : [];
        } catch (e) {
            console.error("Failed to parse subtitles", e);
        }

        setEditFormData({
            title: banner.title,
            image: null, // Always start with no new image selected
            enableMobileDevice: banner.is_mobile_enabled,
            subtitles: parsedSubtitles,
            existingImageUrl: banner.image_url,
        });

        setIsEditOpen(true);

    } catch (err) {
        console.error('Error opening edit modal:', err);
        const message = err instanceof Error ? err.message : "Failed to load banner for editing.";
        toast.error(message);
    } finally {
        setIsProcessing(false);
    }

  }, []); // Depend on nothing for stability

  // The other handlers (delete, toggle, etc.) remain the same...
  const handleDeleteSelected = useCallback(async (idsToDelete: number[] = selectedBannerIds) => {
    if (idsToDelete.length === 0) return;

    if (!window.confirm(`Are you sure you want to delete ${idsToDelete.length} banner(s)?`)) {
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/delete-multiple`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ ids: idsToDelete }),
        });

        if (!response.ok) {
            const errorResult = await response.json();
            throw new Error(errorResult.error || `Failed with status: ${response.status}`);
        }
        
        const result = await response.json();
        toast.success(result.message || `${idsToDelete.length} banner(s) deleted successfully.`);
        
        setSelectedBannerIds([]);
        await fetchBanners();

    } catch (err) {
        console.error('Error deleting multiple banners:', err);
        const message = err instanceof Error ? err.message : "Failed to delete banners.";
        toast.error(message);
    }
  }, [selectedBannerIds, fetchBanners]);
  
  const handleToggleMobile = async (id: number, currentStatus: boolean) => {
      try {
          const response = await fetch(`${API_BASE_URL}/toggle-mobile/${id}`, {
              method: 'PATCH',
          });
          
          if (!response.ok) {
              const errorResult = await response.json();
              throw new Error(errorResult.error || `Failed with status: ${response.status}`);
          }
          
          toast.success(`Mobile status set to ${!currentStatus ? 'enabled' : 'disabled'}.`);
          
          setBanners(prev => prev.map(b => 
              b.id === id ? { ...b, is_mobile_enabled: !currentStatus } : b
          ));

      } catch (err) {
          console.error('Error toggling mobile status:', err);
          const message = err instanceof Error ? err.message : "Failed to toggle mobile status.";
          toast.error(message);
      }
  };

// --- Filtering & Pagination Logic ---
  
  const filteredBanners = useMemo(() => {
    return banners.filter((banner) =>
        banner.title.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [banners, searchTerm]);


  const totalPages = Math.ceil(filteredBanners.length / perPage);
  const startIndex = (currentPage - 1) * perPage;
  const endIndex = startIndex + perPage;

  const paginatedBanners = filteredBanners.slice(startIndex, endIndex);

// --- Selection, Pagination & File Handlers ---
  
  // (Selection logic remains untouched)
  const isAllSelected = paginatedBanners.length > 0 && paginatedBanners.every(
    (banner) => selectedBannerIds.includes(banner.id)
  );
  
  const isIndeterminate = paginatedBanners.some(
    (banner) => selectedBannerIds.includes(banner.id)
  ) && !isAllSelected;

  const handleSelectAll = () => {
    if (isAllSelected) {
      const idsToDeselect = paginatedBanners.map(b => b.id);
      setSelectedBannerIds(prev => prev.filter(id => !idsToDeselect.includes(id)));
    } else {
      const idsToSelect = paginatedBanners.map(b => b.id);
      setSelectedBannerIds(prev => Array.from(new Set([...prev, ...idsToSelect])));
    }
  };

  const handleSelectBanner = (id: number, checked: boolean) => {
    setSelectedBannerIds((prev) =>
      checked ? [...prev, id] : prev.filter((bannerId) => bannerId !== id)
    );
  };
  
  const handleDeselectAll = () => {
    setSelectedBannerIds([]);
  }

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  }
  
  const handlePerPageChange = (value: string) => {
    const newPerPage = parseInt(value, 10);
    setPerPage(newPerPage);
    setCurrentPage(1); 
  }
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, isEdit: boolean = false) => {
    const file = e.target.files ? e.target.files[0] : null;
    if (file) {
        if (file.size > 1048576) { 
            toast.error("File size exceeds the 1MB limit.");
            e.target.value = ''; 
            if (isEdit) setEditFormData(prev => ({ ...prev, image: null }));
            else setCreateFormData(prev => ({ ...prev, image: null }));
            return;
        }
        if (isEdit) setEditFormData(prev => ({ ...prev, image: file }));
        else setCreateFormData(prev => ({ ...prev, image: file }));
    }
  };


  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header (No changes here) */}
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-muted-foreground mb-1">
              Banners › List
            </div>
            <h1 className="text-3xl font-bold">Banners</h1>
          </div>
          <Button onClick={() => setIsCreateOpen(true)} className="bg-primary" disabled={isProcessing}>
            New banner
          </Button>
        </div>
        
        {/* Error Alert (No changes here) */}
        {error && (
            <Alert variant="destructive">
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
            </Alert>
        )}
        
        {/* Content Card */}
        <div className="rounded-lg border border-border bg-card">
          {/* Search & Bulk Actions (Minor change for processing status) */}
          <div className="border-b border-border p-4 flex justify-between items-center">
            <div className="flex items-center space-x-2">
                <div className="relative w-full max-w-sm">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search titles..."
                    value={searchTerm}
                    onChange={(e) => {
                        setSearchTerm(e.target.value);
                        setCurrentPage(1); 
                    }}
                    className="pl-9 bg-background"
                    disabled={isProcessing}
                  />
                </div>
                <Button variant="outline" size="icon" onClick={fetchBanners} disabled={isLoading || isProcessing}>
                    <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                </Button>
            </div>
            
            <div className="flex items-center space-x-2">
              {selectedBannerIds.length > 0 && (
                <div className="text-sm text-primary font-medium mr-2">
                  {selectedBannerIds.length} record(s) selected
                </div>
              )}
              {selectedBannerIds.length > 0 && (
                <>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={handleDeselectAll}
                    disabled={isProcessing}
                  >
                    Deselect All
                  </Button>
                  <Button 
                    variant="destructive" 
                    size="sm" 
                    onClick={() => handleDeleteSelected(selectedBannerIds)}
                    disabled={isProcessing}
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Delete All
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto min-h-[300px]">
            {isLoading ? (
                <div className="flex justify-center items-center h-[300px]">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <span className="ml-2">Loading Banners...</span>
                </div>
            ) : paginatedBanners.length === 0 ? (
                <div className="flex justify-center items-center h-[300px]">
                    <p className="text-muted-foreground">No banners found.</p>
                </div>
            ) : (
                <table className="w-full">
                  <thead className="border-b border-border bg-muted/50">
                    <tr>
                      <th className="p-4 text-left w-10">
                        <Checkbox
                            checked={isAllSelected}
                            onCheckedChange={handleSelectAll}
                            {...(isIndeterminate && { checked: 'indeterminate' as const })}
                            disabled={isProcessing}
                        />
                      </th>
                      <th className="p-4 text-left text-sm font-medium">
                        Enable Mobile Device
                      </th>
                      <th className="p-4 text-left text-sm font-medium">Image</th>
                      <th className="p-4 text-left text-sm font-medium">Title</th>
                      <th className="p-4 text-left text-sm font-medium">
                        Created At
                      </th>
                      <th className="p-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedBanners.map((banner) => (
                      <tr key={banner.id} className="border-b border-border hover:bg-muted/30">
                        <td className="p-4">
                          <Checkbox
                            checked={selectedBannerIds.includes(banner.id)}
                            onCheckedChange={(checked) =>
                              handleSelectBanner(banner.id, checked as boolean)
                            }
                            disabled={isProcessing}
                          />
                        </td>
                        <td className="p-4">
                            <Switch 
                                checked={banner.is_mobile_enabled} 
                                onCheckedChange={() => handleToggleMobile(banner.id, banner.is_mobile_enabled)}
                                disabled={isProcessing}
                            />
                        </td>
                        <td className="p-4">
                            <div className="h-10 w-16 overflow-hidden rounded-md border bg-muted flex items-center justify-center">
                                <img 
                                    src={`${API_BASE_URL.replace('/api/banners', '')}${banner.image_url}`} 
                                    alt={banner.title} 
                                    className="object-cover w-full h-full"
                                    onError={(e) => {
                                        (e.target as HTMLImageElement).onerror = null; 
                                        (e.target as HTMLImageElement).style.display = 'none';
                                    }}
                                />
                            </div>
                        </td>
                        <td className="p-4 text-sm font-medium">{banner.title}</td>
                        <td className="p-4 text-sm text-muted-foreground">
                          {new Date(banner.created_at).toLocaleDateString()}
                        </td>
                        <td className="p-4 flex items-center space-x-2">
                          {/* --- EDIT BUTTON --- */}
                          <Button 
                              variant="ghost" 
                              size="sm" 
                              className="text-primary"
                              onClick={() => handleEditOpen(banner.id)}
                              disabled={isProcessing}
                          >
                            <Edit2 className="h-4 w-4 mr-1" />
                            Edit
                          </Button>
                          <Button 
                              variant="ghost" 
                              size="sm" 
                              className="text-destructive hover:bg-destructive/10"
                              onClick={() => handleDeleteSelected([banner.id])}
                              disabled={isProcessing}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
            )}
          </div>
          
          {/* Pagination Footer (No major changes) */}
          <div className="p-4 flex items-center justify-between">
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <span>Rows per page:</span>
                <Select
                    value={String(perPage)}
                    onValueChange={handlePerPageChange}
                    disabled={isLoading || isProcessing}
                >
                    <SelectTrigger className="w-[70px] h-8">
                        <SelectValue placeholder={perPage} />
                    </SelectTrigger>
                    <SelectContent>
                        {ITEMS_PER_PAGE_OPTIONS.map(num => (
                            <SelectItem key={num} value={String(num)}>{num}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
            
            <div className="flex items-center space-x-4">
                <span className="text-sm text-muted-foreground">
                    {filteredBanners.length === 0 
                        ? "0 records"
                        : `Showing ${startIndex + 1}-${Math.min(endIndex, filteredBanners.length)} of ${filteredBanners.length} records`
                    }
                </span>
                
                <Pagination>
                    <PaginationContent>
                        <PaginationItem>
                            <PaginationPrevious 
                                onClick={() => handlePageChange(currentPage - 1)}
                                className={currentPage === 1 || totalPages === 0 || isProcessing ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                            />
                        </PaginationItem>
                        
                        {totalPages > 0 && Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                            <PaginationItem key={page}>
                                <PaginationLink 
                                    onClick={() => handlePageChange(page)}
                                    isActive={page === currentPage}
                                    className={isProcessing ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                                >
                                    {page}
                                </PaginationLink>
                            </PaginationItem>
                        ))}
                        
                        <PaginationItem>
                            <PaginationNext 
                                onClick={() => handlePageChange(currentPage + 1)}
                                className={currentPage === totalPages || totalPages === 0 || isProcessing ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                            />
                        </PaginationItem>
                    </PaginationContent>
                </Pagination>
            </div>
          </div>
        </div>
      </div>

      {/* --- CREATE Banner Dialog (Unchanged) --- */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create banner</DialogTitle>
          </DialogHeader>
          <form className="space-y-6 py-4" onSubmit={(e) => { e.preventDefault(); handleCreate(); }}>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="enableMobileCreate"
                checked={createFormData.enableMobileDevice}
                onCheckedChange={(checked) => 
                    setCreateFormData(prev => ({ ...prev, enableMobileDevice: checked as boolean }))
                }
                disabled={isProcessing}
              />
              <Label htmlFor="enableMobileCreate">Enable Mobile Device</Label>
            </div>
            <div className="space-y-2">
              <Label htmlFor="titleCreate">
                Title 1 (Static Heading)<span className="text-destructive">*</span>
              </Label>
              <Input
                id="titleCreate"
                placeholder="e.g. Helping businesses turn"
                value={createFormData.title}
                onChange={(e) => setCreateFormData(prev => ({ ...prev, title: e.target.value }))}
                disabled={isProcessing}
                required
              />
            </div>
            
            <div className="space-y-2 border-t pt-4 mt-4">
              <div className="flex items-center justify-between">
                <Label>Dynamic Subtitles (Title 2 + Description)</Label>
                <Button type="button" variant="outline" size="sm" onClick={addSubtitleCreate} disabled={isProcessing}>
                    + Add Subtitle
                </Button>
              </div>
              
              {createFormData.subtitles.map((sub, idx) => (
                  <div key={idx} className="p-3 border rounded-md relative bg-muted/20 space-y-3 mt-2">
                      <Button 
                          type="button" 
                          variant="ghost" 
                          size="sm" 
                          className="absolute top-2 right-2 text-destructive h-6 w-6 p-0" 
                          onClick={() => removeSubtitleCreate(idx)}
                      >
                          <Trash2 className="h-4 w-4" />
                      </Button>
                      <div className="space-y-1 pr-8">
                          <Label className="text-xs">Subtitle {idx + 1} (Animated)</Label>
                          <Input 
                              placeholder="e.g. lorem ipsum"
                              value={sub.subtitle}
                              onChange={(e) => updateSubtitleCreate(idx, 'subtitle', e.target.value)}
                              required
                          />
                      </div>
                      <div className="space-y-1">
                          <Label className="text-xs">Description</Label>
                          <textarea 
                              className="flex min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                              placeholder="We create digital experiences..."
                              value={sub.description}
                              onChange={(e) => updateSubtitleCreate(idx, 'description', e.target.value)}
                              required
                          />
                      </div>
                  </div>
              ))}
              {createFormData.subtitles.length === 0 && (
                  <p className="text-sm text-muted-foreground italic text-center py-2">No subtitles added. Hero will only show Title 1.</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="image-upload-create">
                Image (Max File Size is 1MB)<span className="text-destructive">*</span>
              </Label>
              <Input
                  id="image-upload-create"
                  type="file"
                  accept=".jpg,.jpeg,.png,.gif,.webp"
                  onChange={(e) => handleFileChange(e, false)}
                  className="cursor-pointer"
                  disabled={isProcessing}
                  required={!createFormData.image}
              />
              {createFormData.image && (
                  <p className="text-sm text-muted-foreground pt-1">
                      File selected: **{createFormData.image.name}**
                  </p>
              )}
            </div>
            
            {isProcessing && (
                <div className="space-y-2">
                    <Label>{uploadProgress === 100 ? 'Finishing Up...' : 'Processing...'}</Label>
                    <Progress value={uploadProgress > 0 ? 100 : 50} className="h-2" />
                </div>
            )}
            
          <DialogFooter className="gap-2 pt-4">
            <DialogClose asChild>
                <Button variant="outline" disabled={isProcessing}>
                  Cancel
                </Button>
            </DialogClose>
            <Button 
                type="submit" 
                className="bg-primary" 
                disabled={isProcessing || !createFormData.title || !createFormData.image}
            >
              {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Create'}
            </Button>
          </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      
      {/* --- EDIT Banner Dialog (NEW) --- */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Banner: {editingBannerId}</DialogTitle>
          </DialogHeader>
          {isProcessing && editingBannerId ? (
            <div className="flex justify-center items-center h-[200px]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-2">Loading data...</span>
            </div>
          ) : (
            <form className="space-y-6 py-4" onSubmit={(e) => { e.preventDefault(); handleUpdate(); }}>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="enableMobileEdit"
                  checked={editFormData.enableMobileDevice}
                  onCheckedChange={(checked) => 
                      setEditFormData(prev => ({ ...prev, enableMobileDevice: checked as boolean }))
                  }
                  disabled={isProcessing}
                />
                <Label htmlFor="enableMobileEdit">Enable Mobile Device</Label>
              </div>
              <div className="space-y-2">
                <Label htmlFor="titleEdit">
                  Title 1 (Static Heading)<span className="text-destructive">*</span>
                </Label>
                <Input
                  id="titleEdit"
                  placeholder="e.g. Helping businesses turn"
                  value={editFormData.title}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, title: e.target.value }))}
                  disabled={isProcessing}
                  required
                />
              </div>

            <div className="space-y-2 border-t pt-4 mt-4">
              <div className="flex items-center justify-between">
                <Label>Dynamic Subtitles (Title 2 + Description)</Label>
                <Button type="button" variant="outline" size="sm" onClick={addSubtitleEdit} disabled={isProcessing}>
                    + Add Subtitle
                </Button>
              </div>
              
              {editFormData.subtitles.map((sub, idx) => (
                  <div key={idx} className="p-3 border rounded-md relative bg-muted/20 space-y-3 mt-2">
                      <Button 
                          type="button" 
                          variant="ghost" 
                          size="sm" 
                          className="absolute top-2 right-2 text-destructive h-6 w-6 p-0" 
                          onClick={() => removeSubtitleEdit(idx)}
                      >
                          <Trash2 className="h-4 w-4" />
                      </Button>
                      <div className="space-y-1 pr-8">
                          <Label className="text-xs">Subtitle {idx + 1} (Animated)</Label>
                          <Input 
                              placeholder="e.g. lorem ipsum"
                              value={sub.subtitle}
                              onChange={(e) => updateSubtitleEdit(idx, 'subtitle', e.target.value)}
                              required
                          />
                      </div>
                      <div className="space-y-1">
                          <Label className="text-xs">Description</Label>
                          <textarea 
                              className="flex min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                              placeholder="We create digital experiences..."
                              value={sub.description}
                              onChange={(e) => updateSubtitleEdit(idx, 'description', e.target.value)}
                              required
                          />
                      </div>
                  </div>
              ))}
              {editFormData.subtitles.length === 0 && (
                  <p className="text-sm text-muted-foreground italic text-center py-2">No subtitles added. Hero will only show Title 1.</p>
              )}
            </div>
              <div className="space-y-2">
                <Label htmlFor="image-upload-edit">
                  Image (Max File Size is 1MB)
                </Label>
                {editFormData.existingImageUrl && !editFormData.image && (
                    <div className="flex items-center space-x-4">
                        <span className="text-sm text-muted-foreground">Current Image:</span>
                        <div className="h-10 w-16 rounded-md border bg-muted overflow-hidden">
                            <img 
                                src={`${API_BASE_URL.replace('/api/banners', '')}${editFormData.existingImageUrl}`} 
                                alt="Current Banner" 
                                className="object-cover w-full h-full"
                            />
                        </div>
                    </div>
                )}
                <Input
                    id="image-upload-edit"
                    type="file"
                    accept=".jpg,.jpeg,.png,.gif,.webp"
                    onChange={(e) => handleFileChange(e, true)}
                    className="cursor-pointer"
                    disabled={isProcessing}
                />
                {(editFormData.image || editFormData.existingImageUrl) && (
                    <p className="text-sm text-muted-foreground pt-1">
                        {editFormData.image ? `New file selected: **${editFormData.image.name}**` : "No new file selected."}
                    </p>
                )}
              </div>
              
              {isProcessing && (
                  <div className="space-y-2">
                      <Label>{uploadProgress === 100 ? 'Finishing Up...' : 'Updating...'}</Label>
                      <Progress value={uploadProgress > 0 ? 100 : 50} className="h-2" />
                  </div>
              )}

            <DialogFooter className="gap-2 pt-4">
              <DialogClose asChild>
                  <Button variant="outline" disabled={isProcessing}>
                    Cancel
                  </Button>
              </DialogClose>
              <Button 
                  type="submit" 
                  className="bg-primary" 
                  disabled={isProcessing || !editFormData.title}
              >
                {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Save Changes'}
              </Button>
            </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default Banners;