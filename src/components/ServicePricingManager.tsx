import { useState, useMemo, useCallback, useEffect } from "react";
import { Search, Edit2, Trash2, Loader2, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { DialogClose } from "@radix-ui/react-dialog";
import { toast } from 'sonner';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Switch } from "@/components/ui/switch";
import { API_BASE_URL as BASE_URL } from "@/config/api";

const API_BASE_URL = `${BASE_URL}/pricing`;

interface PricingPlan {
  id: number;
  category: string;
  plan_name: string;
  price: number;
  features: string[];
  is_featured: boolean;
  created_at: string;
}

interface PricingFormData {
  category: string;
  plan_name: string;
  price: string;
  features: string[];
  is_featured: boolean;
}

interface ServicePricingManagerProps {
  serviceId: number;
  serviceName: string;
}

const ServicePricingManager: React.FC<ServicePricingManagerProps> = ({ serviceId, serviceName }) => {
  const [plans, setPlans] = useState<PricingPlan[]>([]);
  const [allPlans, setAllPlans] = useState<PricingPlan[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isLinkOpen, setIsLinkOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [selectedPlanToLink, setSelectedPlanToLink] = useState<string>("");

  const defaultCategory = serviceName ? serviceName.toUpperCase() : "";

  const initialForm: PricingFormData = {
    category: defaultCategory,
    plan_name: "",
    price: "",
    features: [""],
    is_featured: false,
  };

  const [formData, setFormData] = useState<PricingFormData>(initialForm);

  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPlans = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/service/${serviceId}`);
      if (!response.ok) throw new Error("Failed to fetch");
      const result = await response.json();
      setPlans(result.data || []);
    } catch (err) {
      setError("Failed to load pricing plans.");
    } finally {
      setIsLoading(false);
    }
  }, [serviceId]);

  const fetchAllPlans = useCallback(async () => {
    try {
      const response = await fetch(API_BASE_URL);
      if (!response.ok) return;
      const result = await response.json();
      setAllPlans(result.data || []);
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => { 
    if (serviceId) {
      fetchPlans(); 
      fetchAllPlans();
    }
  }, [fetchPlans, fetchAllPlans, serviceId]);

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
          category: defaultCategory, // Ensure category is always the service name
          features: formData.features.filter(f => f.trim() !== ""),
          serviceIds: [serviceId] // Automatically link to this service
        }),
      });

      if (!response.ok) throw new Error("Operation failed");

      toast.success(editingId ? "Plan updated!" : "Plan created!");
      setIsCreateOpen(false);
      setIsEditOpen(false);
      setEditingId(null);
      setFormData({ ...initialForm, category: defaultCategory });
      fetchPlans();
    } catch (err) {
      toast.error("Something went wrong.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleLinkExisting = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlanToLink) return;
    setIsProcessing(true);
    try {
      const response = await fetch(`${API_BASE_URL}/link`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ serviceId, pricingId: parseInt(selectedPlanToLink) })
      });
      if (!response.ok) throw new Error("Link failed");
      toast.success("Plan linked successfully!");
      setIsLinkOpen(false);
      setSelectedPlanToLink("");
      fetchPlans();
    } catch (err) {
      toast.error("Failed to link plan.");
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
    });
    setIsEditOpen(true);
  };

  const handleUnlink = async (id: number) => {
    if (!window.confirm("Unlink this plan from the current service?")) return;
    try {
      await fetch(`${API_BASE_URL}/unlink`, { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ serviceId, pricingId: id })
      });
      toast.success("Unlinked successfully");
      fetchPlans();
    } catch (err) {
      toast.error("Unlink failed");
    }
  };

  const filteredPlans = useMemo(() => {
    return plans.filter(p => p.plan_name.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [plans, searchTerm]);

  if (!serviceId) {
    return null; // Don't render if we don't know the service yet
  }

  return (
    <div className="mt-8 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-gray-800">Pricing Plans</h3>
        <div className="flex space-x-2">
          <Button 
            type="button"
            variant="outline"
            onClick={() => setIsLinkOpen(true)}
          >
            Link Existing Plan
          </Button>
          <Button 
            type="button"
            onClick={() => { 
              setEditingId(null); 
              setFormData({ ...initialForm, category: defaultCategory }); 
              setIsCreateOpen(true); 
            }} 
            className="bg-[#0c6e8e] hover:bg-[#085a73]"
          >
            <Plus className="h-4 w-4 mr-2" /> Add New Plan
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="rounded-lg border border-gray-200 bg-white overflow-hidden shadow-sm">
        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Search plans..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 bg-white"
            />
          </div>
        </div>

        <div className="overflow-x-auto min-h-[150px]">
          {isLoading ? (
            <div className="flex justify-center items-center h-[150px]"><Loader2 className="animate-spin text-gray-400" /></div>
          ) : filteredPlans.length === 0 ? (
            <div className="flex justify-center items-center h-[150px] text-gray-500">
              No pricing plans added for this service yet.
            </div>
          ) : (
            <table className="w-full">
              <thead className="border-b border-gray-200 bg-gray-50 text-xs font-medium text-gray-500 uppercase">
                <tr>
                  <th className="p-3 text-left">Featured</th>
                  <th className="p-3 text-left">Plan Name</th>
                  <th className="p-3 text-left">Price</th>
                  <th className="p-3 text-left">Features</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredPlans.map((plan) => (
                  <tr key={plan.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="p-3">
                      <Switch checked={plan.is_featured} disabled />
                    </td>
                    <td className="p-3 text-sm font-medium text-gray-900">{plan.plan_name}</td>
                    <td className="p-3 text-sm font-bold text-[#0c6e8e]">${plan.price}</td>
                    <td className="p-3 text-sm text-gray-500">
                      {plan.features.length} features
                    </td>
                    <td className="p-3 flex items-center justify-end space-x-2">
                      <Button type="button" variant="ghost" size="sm" className="text-blue-600 hover:text-blue-800 hover:bg-blue-50" onClick={() => handleEditOpen(plan)}>
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button type="button" variant="ghost" size="sm" className="text-red-600 hover:text-red-800 hover:bg-red-50" onClick={() => handleUnlink(plan.id)} title="Unlink from service">
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

      <Dialog open={isCreateOpen || isEditOpen} onOpenChange={(val) => { setIsCreateOpen(val); setIsEditOpen(val); }}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Edit Pricing Plan' : 'Add Pricing Plan'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4 py-4">
            <div className="flex items-center space-x-2 bg-gray-50 p-3 rounded-lg border border-gray-100">
              <Switch
                id="isFeatured"
                checked={formData.is_featured}
                onCheckedChange={(val) => setFormData(prev => ({ ...prev, is_featured: val }))}
              />
              <Label htmlFor="isFeatured" className="cursor-pointer">Highlight this plan (Featured)</Label>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Plan Name</Label>
                <Input
                  placeholder="e.g. Starter Plan"
                  value={formData.plan_name}
                  onChange={e => setFormData(prev => ({ ...prev, plan_name: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Price ($)</Label>
                <Input
                  type="number"
                  placeholder="e.g. 99"
                  value={formData.price}
                  onChange={e => setFormData(prev => ({ ...prev, price: e.target.value }))}
                  required
                />
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <Label className="flex justify-between items-center text-gray-700">
                Plan Features
                <Button type="button" variant="outline" size="sm" onClick={handleAddFeature} className="h-8">
                  <Plus className="h-3 w-3 mr-1" /> Add Feature
                </Button>
              </Label>
              <div className="space-y-2 max-h-[250px] overflow-y-auto pr-1">
                {formData.features.map((feature, idx) => (
                  <div key={idx} className="flex items-center space-x-2">
                    <Input
                      placeholder="e.g. 100% SEO friendly"
                      value={feature}
                      onChange={e => handleFeatureChange(idx, e.target.value)}
                      className="bg-gray-50"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveFeature(idx)}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50 shrink-0"
                      disabled={formData.features.length === 1}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            <DialogFooter className="pt-6">
              <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
              <Button type="submit" disabled={isProcessing} className="bg-[#0c6e8e] hover:bg-[#085a73]">
                {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editingId ? "Save Changes" : "Add Plan"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isLinkOpen} onOpenChange={setIsLinkOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Link Existing Pricing Plan</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleLinkExisting} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Select Plan</Label>
              <select 
                className="w-full border-gray-300 rounded-md p-2 border"
                value={selectedPlanToLink}
                onChange={(e) => setSelectedPlanToLink(e.target.value)}
                required
              >
                <option value="">-- Select a Plan --</option>
                {allPlans.filter(p => !plans.some(existing => existing.id === p.id)).map(p => (
                  <option key={p.id} value={p.id}>{p.plan_name} (${p.price})</option>
                ))}
              </select>
            </div>
            <DialogFooter>
              <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
              <Button type="submit" disabled={isProcessing || !selectedPlanToLink} className="bg-[#0c6e8e] hover:bg-[#085a73]">
                {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Link Plan
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ServicePricingManager;
