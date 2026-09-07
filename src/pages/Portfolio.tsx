import { useState, useEffect } from "react";
import { Search, Edit2, Plus, Trash2, Globe, ImageIcon, Loader2 } from "lucide-react"; // Added Loader2
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
import { Textarea } from "@/components/ui/textarea";
import AdminLayout from "@/components/layout/AdminLayout";
import { toast } from "sonner";

interface Portfolio {
  id: number;
  title: string;
  description: string;
  thumbnail_url: string;
  logo_url: string;
  project_url: string;
  created_at: string;
}

import { API_BASE_URL as GLOBAL_API_URL, SERVER_URL as GLOBAL_SERVER_URL } from "@/config/api";
const API_BASE_URL = `${GLOBAL_API_URL}`;
const IMAGE_BASE_URL = GLOBAL_SERVER_URL;

const PortfolioPage = () => {
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false); // New Loading State
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<Portfolio | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    project_url: "",
  });
  const [thumbnail, setThumbnail] = useState<File | null>(null);
  const [logo, setLogo] = useState<File | null>(null);

  // Fetch Data
  const fetchPortfolios = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/portfolio`);
      const result = await res.json();
      if (result.status === 200) setPortfolios(result.data);
    } catch (error) {
      toast.error("Failed to fetch portfolios");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPortfolios();
  }, []);

  // Handle Create/Update
  const handleSubmit = async () => {
    if (!formData.title || (!editItem && (!thumbnail || !logo))) {
      toast.error("Please fill required fields and upload images");
      return;
    }

    setIsSubmitting(true); // Start Loading

    const data = new FormData();
    data.append("title", formData.title);
    data.append("description", formData.description);
    data.append("project_url", formData.project_url);
    if (thumbnail) data.append("thumbnail", thumbnail);
    if (logo) data.append("logo", logo);

    const url = editItem 
      ? `${API_BASE_URL}/portfolio/update/${editItem.id}` 
      : `${API_BASE_URL}/portfolio/create`;
    
    const method = editItem ? "PUT" : "POST";

    try {
      const res = await fetch(url, { method, body: data });
      if (res.ok) {
        toast.success(editItem ? "Updated successfully" : "Created successfully");
        setIsDialogOpen(false);
        resetForm();
        fetchPortfolios();
      } else {
        toast.error("Failed to save portfolio");
      }
    } catch (error) {
      toast.error("Operation failed");
    } finally {
      setIsSubmitting(false); // Stop Loading
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure?")) return;
    try {
      await fetch(`${API_BASE_URL}/portfolio/delete/${id}`, { method: "DELETE" });
      toast.success("Deleted successfully");
      fetchPortfolios();
    } catch (error) {
      toast.error("Delete failed");
    }
  };

  const resetForm = () => {
    setFormData({ title: "", description: "", project_url: "" });
    setThumbnail(null);
    setLogo(null);
    setEditItem(null);
  };

  const openEdit = (item: Portfolio) => {
    setEditItem(item);
    setFormData({
      title: item.title,
      description: item.description || "",
      project_url: item.project_url || "",
    });
    setIsDialogOpen(true);
  };

  const filteredData = portfolios.filter((p) =>
    p.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-muted-foreground mb-1">Portfolio › List</div>
            <h1 className="text-3xl font-bold">Portfolio</h1>
          </div>
          <Button onClick={() => { resetForm(); setIsDialogOpen(true); }} className="bg-primary">
            <Plus className="mr-2 h-4 w-4" /> Add New Portfolio
          </Button>
        </div>

        {/* Search & Table */}
        <div className="rounded-lg border border-border bg-card">
          <div className="border-b border-border p-4">
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search portfolio..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 bg-background"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-border bg-muted/50 text-left">
                <tr>
                  <th className="p-4 w-10"><Checkbox /></th>
                  <th className="p-4 text-sm font-medium">Thumbnail</th>
                  <th className="p-4 text-sm font-medium">Logo</th>
                  <th className="p-4 text-sm font-medium">Portfolio Info</th>
                  <th className="p-4 text-sm font-medium">URL</th>
                  <th className="p-4 text-sm font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">Loading...</td></tr>
                ) : filteredData.map((item) => (
                  <tr key={item.id} className="border-b border-border hover:bg-muted/30">
                    <td className="p-4"><Checkbox /></td>
                    <td className="p-4">
                      <img 
                        src={`${IMAGE_BASE_URL}${item.thumbnail_url}`} 
                        className="h-12 w-20 object-cover rounded bg-muted" 
                        alt="thumb" 
                      />
                    </td>
                    <td className="p-4">
                      <img 
                        src={`${IMAGE_BASE_URL}${item.logo_url}`} 
                        className="h-10 w-10 object-contain rounded bg-white border" 
                        alt="logo" 
                      />
                    </td>
                    <td className="p-4">
                      <div className="font-medium text-sm">{item.title}</div>
                      <div className="text-xs text-muted-foreground line-clamp-1">{item.description}</div>
                    </td>
                    <td className="p-4">
                      {item.project_url && (
                        <a href={item.project_url} target="_blank" className="text-primary hover:underline flex items-center text-xs">
                          <Globe className="h-3 w-3 mr-1" /> View Link
                        </a>
                      )}
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="sm" onClick={() => openEdit(item)} className="text-primary">
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(item.id)} className="text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editItem ? "Edit Portfolio" : "Add New Portfolio"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2 col-span-2">
                <Label>Portfolio Title <span className="text-destructive">*</span></Label>
                <Input 
                  value={formData.title} 
                  onChange={(e) => setFormData({...formData, title: e.target.value})} 
                  placeholder="e.g. HealthCare Dashboard"
                />
              </div>
              <div className="space-y-2 col-span-2">
                <Label>Description</Label>
                <span className="text-[10px] text-muted-foreground ml-2">(Optional)</span>
                <Textarea 
                  value={formData.description} 
                  onChange={(e) => setFormData({...formData, description: e.target.value})} 
                  placeholder="Portfolio details..."
                />
              </div>
              <div className="space-y-2 col-span-2">
                <Label>Portfolio Link</Label>
                <Input 
                  value={formData.project_url} 
                  onChange={(e) => setFormData({...formData, project_url: e.target.value})} 
                  placeholder="https://..."
                />
              </div>

              {/* File Uploads */}
              <div className="space-y-2">
                <Label>Thumbnail Image</Label>
                <div 
                  className="border-2 border-dashed rounded-lg p-4 text-center hover:bg-muted/50 cursor-pointer"
                  onClick={() => document.getElementById('thumb-input')?.click()}
                >
                  <Input 
                    id="thumb-input" type="file" className="hidden" 
                    onChange={(e) => setThumbnail(e.target.files?.[0] || null)} 
                  />
                  <ImageIcon className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                  <span className="text-xs">{thumbnail ? thumbnail.name : "Select Thumbnail"}</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Client Logo</Label>
                <div 
                  className="border-2 border-dashed rounded-lg p-4 text-center hover:bg-muted/50 cursor-pointer"
                  onClick={() => document.getElementById('logo-input')?.click()}
                >
                  <Input 
                    id="logo-input" type="file" className="hidden" 
                    onChange={(e) => setLogo(e.target.files?.[0] || null)} 
                  />
                  <ImageIcon className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                  <span className="text-xs">{logo ? logo.name : "Select Logo"}</span>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} className="bg-primary min-w-[120px]" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                editItem ? "Update Portfolio" : "Create Portfolio"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default PortfolioPage;