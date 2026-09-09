import { useState, useMemo, useCallback, useEffect } from "react";
import { Search, Edit2, Trash2, Loader2, RefreshCw, ImagePlus } from "lucide-react";
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
import { Progress } from "@/components/ui/progress";
import { SERVER_URL, API_BASE_URL as BASE_API } from "@/config/api";

// --- Configuration ---
const API_BASE_URL = `${BASE_API}/logo-carousel`;
const ITEMS_PER_PAGE_OPTIONS = [5, 10, 25, 50];

// --- Interfaces ---
interface Logo {
  id: number;
  title: string;
  image_url: string;
  created_at: string;
}

interface ApiLogoResponse {
  status: number;
  data: Logo[];
}

interface LogoFormData {
  title: string;
  image: File | null;
  existingImageUrl?: string;
}

const LogoCarousel = () => {
  const [logos, setLogos] = useState<Logo[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  // --- Create/Edit State ---
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [formData, setFormData] = useState<LogoFormData>({
    title: "",
    image: null,
    existingImageUrl: "",
  });

  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(ITEMS_PER_PAGE_OPTIONS[1]);

  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // --- API Calls ---

  const fetchLogos = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(API_BASE_URL);
      if (!response.ok) throw new Error(`Error: ${response.status}`);

      const result: ApiLogoResponse = await response.json();
      setLogos(result.data || []);
    } catch (err) {
      setError("Failed to fetch logos.");
      setLogos([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLogos();
  }, [fetchLogos]);

  const handleAction = async (mode: 'create' | 'update') => {
    if (!formData.title || (mode === 'create' && !formData.image)) {
      toast.error("Title and Image are required.");
      return;
    }

    setIsProcessing(true);
    const data = new FormData();
    data.append('title', formData.title);
    if (formData.image) data.append('image', formData.image);

    try {
      const url = mode === 'create' ? `${API_BASE_URL}/create` : `${API_BASE_URL}/update/${editingId}`;
      const method = mode === 'create' ? 'POST' : 'PUT';

      const response = await fetch(url, { method, body: data });

      if (!response.ok) throw new Error("Operation failed");

      toast.success(`Logo ${mode === 'create' ? 'added' : 'updated'} successfully!`);
      setIsCreateOpen(false);
      setIsEditOpen(false);
      setFormData({ title: "", image: null });
      fetchLogos();
    } catch (err) {
      toast.error("Failed to save logo.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Delete this logo?")) return;
    setIsProcessing(true);
    try {
      const response = await fetch(`${API_BASE_URL}/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error();
      toast.success("Logo deleted");
      fetchLogos();
    } catch (err) {
      toast.error("Delete failed");
    } finally {
      setIsProcessing(false);
    }
  };

  // --- Filter & Pagination ---
  const filteredLogos = useMemo(() => {
    return logos.filter((l) => l.title.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [logos, searchTerm]);

  const totalPages = Math.ceil(filteredLogos.length / perPage);
  const paginatedLogos = filteredLogos.slice((currentPage - 1) * perPage, currentPage * perPage);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-muted-foreground mb-1">Logo Carousel › List</div>
            <h1 className="text-3xl font-bold">Partner Logos</h1>
          </div>
          <Button onClick={() => {
            setFormData({ title: "", image: null });
            setIsCreateOpen(true);
          }} className="bg-primary">
            <ImagePlus className="w-4 h-4 mr-2" /> Add Logo
          </Button>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="rounded-lg border border-border bg-card">
          <div className="p-4 border-b flex justify-between items-center gap-4">
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search logos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button variant="outline" size="icon" onClick={fetchLogos} disabled={isLoading}>
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>

          <div className="overflow-x-auto min-h-[300px]">
            {isLoading ? (
              <div className="flex justify-center items-center h-[300px]"><Loader2 className="animate-spin" /></div>
            ) : (
              <table className="w-full">
                <thead className="bg-muted/50 border-b">
                  <tr>
                    <th className="p-4 text-left text-sm font-medium">Image</th>
                    <th className="p-4 text-left text-sm font-medium">Title</th>
                    <th className="p-4 text-left text-sm font-medium">Added On</th>
                    <th className="p-4 text-right text-sm font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedLogos.map((logo) => (
                    <tr key={logo.id} className="border-b hover:bg-muted/30 transition-colors">
                      <td className="p-4">
                        <div className="h-12 w-24 rounded border bg-white p-1 flex items-center justify-center overflow-hidden">
                          <img
                            src={`${SERVER_URL}` + (logo.image_url)}
                            alt={logo.title}
                            className="object-contain max-h-full max-w-full"
                          />
                        </div>
                      </td>
                      <td className="p-4 font-medium">{logo.title}</td>
                      <td className="p-4 text-sm text-muted-foreground">
                        {new Date(logo.created_at).toLocaleDateString()}
                      </td>
                      <td className="p-4 text-right">
                        <Button variant="ghost" size="sm" onClick={() => {
                          setEditingId(logo.id);
                          setFormData({ title: logo.title, image: null, existingImageUrl: logo.image_url });
                          setIsEditOpen(true);
                        }}>
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="text-destructive" onClick={() => handleDelete(logo.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Pagination */}
          <div className="p-4 flex items-center justify-between border-t">
            <p className="text-sm text-muted-foreground">Total {filteredLogos.length} logos</p>
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                  />
                </PaginationItem>
                <PaginationItem>
                  <PaginationNext
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        </div>
      </div>

      {/* --- Dialogs --- */}
      <Dialog open={isCreateOpen || isEditOpen} onOpenChange={(open) => { setIsCreateOpen(open); setIsEditOpen(open); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isCreateOpen ? "Add New Logo" : "Edit Logo"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Logo Title</Label>
              <Input
                value={formData.title}
                onChange={e => setFormData({ ...formData, title: e.target.value })}
                placeholder="Company Name"
              />
            </div>
            <div className="space-y-2">
              <Label>Logo File (PNG/SVG preferred)</Label>
              {formData.existingImageUrl && !formData.image && (
                <div className="mb-2 p-2 border rounded w-fit bg-muted/40 flex items-center justify-center">
                  <img src={`${SERVER_URL}` + (formData.existingImageUrl)} className="h-10 object-contain max-w-[120px]" alt="Logo preview" />
                </div>
              )}
              <Input
                type="file"
                accept="image/*"
                onChange={e => setFormData({ ...formData, image: e.target.files?.[0] || null })}
              />
            </div>
            {isProcessing && <Progress value={70} className="h-1" />}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsCreateOpen(false); setIsEditOpen(false); }}>Cancel</Button>
            <Button onClick={() => handleAction(isCreateOpen ? 'create' : 'update')} disabled={isProcessing}>
              {isProcessing ? "Processing..." : "Save Logo"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default LogoCarousel;