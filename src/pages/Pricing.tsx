import { useState, useMemo, useCallback, useEffect } from "react";
import { Search, Edit2, Trash2, Loader2, RefreshCw, Plus, X } from "lucide-react";
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

import { API_BASE_URL as BASE_URL } from "@/config/api";

// --- Configuration ---
const API_BASE_URL = `${BASE_URL}/pricing`;
const SERVICES_API_URL = `${BASE_URL}/services`;
const ITEMS_PER_PAGE_OPTIONS = [5, 10, 25, 50];

// --- Interfaces ---
interface PricingPlan {
  id: number;
  category: string;
  plan_name: string;
  price: number;
  features: string[]; // Frontend handles this as array
  is_featured: boolean;
  serviceIds: number[];
  created_at: string;
}

interface PricingFormData {
  category: string;
  plan_name: string;
  price: string;
  features: string[];
  is_featured: boolean;
  serviceIds: number[];
}

const Pricing = () => {
  const [plans, setPlans] = useState<PricingPlan[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  // --- Form State ---
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const initialForm: PricingFormData = {
    category: "",
    plan_name: "",
    price: "",
    features: [""],
    is_featured: false,
    serviceIds: [],
  };

  const [formData, setFormData] = useState<PricingFormData>(initialForm);

  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(ITEMS_PER_PAGE_OPTIONS[1]);

  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // --- API Calls ---

  const fetchPlans = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(API_BASE_URL);
      if (!response.ok) throw new Error("Failed to fetch");
      const result = await response.json();
      setPlans(result.data || []);
    } catch (err) {
      setError("Failed to load pricing plans.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchServices = useCallback(async () => {
    try {
      const response = await fetch(SERVICES_API_URL);
      if (!response.ok) return;
      const result = await response.json();
      setServices(result.data || []);
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => { 
    fetchPlans(); 
    fetchServices();
  }, [fetchPlans, fetchServices]);

  // --- Feature Array Handlers ---
  const handleAddFeature = () => {
    setFormData(prev => ({ ...prev, features: [...prev.features, ""] }));
  };

  const handleRemoveFeature = (index: number) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== index)
    }));
  };

  const handleFeatureChange = (index: number, value: string) => {
    const newFeatures = [...formData.features];
    newFeatures[index] = value;
    setFormData(prev => ({ ...prev, features: newFeatures }));
  };

  // --- CRUD Handlers ---

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);

    const method = editingId ? 'PUT' : 'POST';
    const url = editingId ? `${API_BASE_URL}/update/${editingId}` : `${API_BASE_URL}/create`;

    try {
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          features: formData.features.filter(f => f.trim() !== "") // Clean empty strings
        }),
      });

      if (!response.ok) throw new Error("Operation failed");

      toast.success(editingId ? "Plan updated!" : "Plan created!");
      setIsCreateOpen(false);
      setIsEditOpen(false);
      setEditingId(null);
      setFormData(initialForm);
      fetchPlans();
    } catch (err) {
      toast.error("Something went wrong.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleEditOpen = (plan: PricingPlan) => {
    setEditingId(plan.id);
    setFormData({
      category: plan.category,
      plan_name: plan.plan_name,
      price: String(plan.price),
      features: plan.features.length > 0 ? plan.features : [""],
      is_featured: plan.is_featured,
      serviceIds: plan.serviceIds || [],
    });
    setIsEditOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Delete this plan?")) return;
    try {
      await fetch(`${API_BASE_URL}/delete/${id}`, { method: 'DELETE' });
      toast.success("Deleted successfully");
      fetchPlans();
    } catch (err) {
      toast.error("Delete failed");
    }
  };

  // --- Table Logic ---
  const filteredPlans = useMemo(() => {
    return plans.filter(p => p.plan_name.toLowerCase().includes(searchTerm.toLowerCase()) || p.category.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [plans, searchTerm]);

  const paginatedPlans = filteredPlans.slice((currentPage - 1) * perPage, currentPage * perPage);
  const totalPages = Math.ceil(filteredPlans.length / perPage);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-muted-foreground mb-1">Pricing › List</div>
            <h1 className="text-3xl font-bold">Pricing Table</h1>
          </div>
          <Button onClick={() => { setEditingId(null); setFormData(initialForm); setIsCreateOpen(true); }} className="bg-primary">
            <Plus className="h-4 w-4 mr-2" /> New Plan
          </Button>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="rounded-lg border border-border bg-card">
          <div className="border-b border-border p-4 flex justify-between items-center">
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search category or plan..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 bg-background"
              />
            </div>
            <Button variant="outline" size="icon" onClick={fetchPlans} disabled={isLoading}>
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>

          <div className="overflow-x-auto min-h-[300px]">
            {isLoading ? (
              <div className="flex justify-center items-center h-[300px]"><Loader2 className="animate-spin" /></div>
            ) : (
              <table className="w-full">
                <thead className="border-b border-border bg-muted/50 text-sm font-medium">
                  <tr>
                    <th className="p-4 text-left">Featured</th>
                    <th className="p-4 text-left">Category</th>
                    <th className="p-4 text-left">Plan Name</th>
                    <th className="p-4 text-left">Price</th>
                    <th className="p-4 text-left">Features</th>
                    <th className="p-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedPlans.map((plan) => (
                    <tr key={plan.id} className="border-b border-border hover:bg-muted/30">
                      <td className="p-4">
                        <Switch checked={plan.is_featured} disabled />
                      </td>
                      <td className="p-4 text-sm font-semibold">{plan.category}</td>
                      <td className="p-4 text-sm">{plan.plan_name}</td>
                      <td className="p-4 text-sm font-bold text-primary">${plan.price}</td>
                      <td className="p-4 text-sm text-muted-foreground">
                        {plan.features.length} features
                      </td>
                      <td className="p-4 flex items-center space-x-2">
                        <Button variant="ghost" size="sm" className="text-primary" onClick={() => handleEditOpen(plan)}>
                          <Edit2 className="h-4 w-4 mr-1" /> Edit
                        </Button>
                        <Button variant="ghost" size="sm" className="text-destructive" onClick={() => handleDelete(plan.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* --- Upsert Dialog --- */}
      <Dialog open={isCreateOpen || isEditOpen} onOpenChange={(val) => { setIsCreateOpen(val); setIsEditOpen(val); }}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Edit Pricing Plan' : 'Create Pricing Plan'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4 py-4">
            <div className="flex items-center space-x-2">
              <Switch 
                id="isFeatured" 
                checked={formData.is_featured} 
                onCheckedChange={(val) => setFormData(prev => ({ ...prev, is_featured: val }))} 
              />
              <Label htmlFor="isFeatured">Featured (Red Highlight)</Label>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Category</Label>
                <Input 
                  placeholder="e.g. WORDPRESS" 
                  value={formData.category} 
                  onChange={e => setFormData(prev => ({ ...prev, category: e.target.value.toUpperCase() }))}
                  required 
                />
              </div>
              <div className="space-y-2">
                <Label>Plan Name</Label>
                <Input 
                  placeholder="e.g. Starter Plan" 
                  value={formData.plan_name} 
                  onChange={e => setFormData(prev => ({ ...prev, plan_name: e.target.value }))}
                  required 
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Price ($)</Label>
              <Input 
                type="number" 
                value={formData.price} 
                onChange={e => setFormData(prev => ({ ...prev, price: e.target.value }))}
                required 
              />
            </div>

            <div className="space-y-2 border border-border p-3 rounded-md bg-muted/10">
              <Label className="block mb-2 font-semibold">Linked Services</Label>
              <div className="max-h-40 overflow-y-auto space-y-2">
                {services.length === 0 && <span className="text-sm text-muted-foreground">No services found.</span>}
                {services.map(service => (
                  <div key={service.id} className="flex items-center space-x-2">
                    <Checkbox 
                      id={`service-${service.id}`} 
                      checked={formData.serviceIds.includes(service.id)}
                      onCheckedChange={(checked) => {
                        setFormData(prev => {
                          const newIds = checked 
                            ? [...prev.serviceIds, service.id] 
                            : prev.serviceIds.filter(id => id !== service.id);
                          return { ...prev, serviceIds: newIds };
                        });
                      }}
                    />
                    <Label htmlFor={`service-${service.id}`} className="cursor-pointer text-sm font-normal">
                      {service.name}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <Label className="flex justify-between items-center">
                Features 
                <Button type="button" variant="outline" size="sm" onClick={handleAddFeature}>
                   <Plus className="h-3 w-3 mr-1" /> Add Feature
                </Button>
              </Label>
              {formData.features.map((feature, idx) => (
                <div key={idx} className="flex items-center space-x-2">
                  <Input 
                    placeholder="e.g. 100% SEO friendly" 
                    value={feature} 
                    onChange={e => handleFeatureChange(idx, e.target.value)} 
                  />
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => handleRemoveFeature(idx)}
                    className="text-destructive"
                    disabled={formData.features.length === 1}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>

            <DialogFooter className="pt-4">
              <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
              <Button type="submit" disabled={isProcessing}>
                {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editingId ? "Update Plan" : "Create Plan"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default Pricing;