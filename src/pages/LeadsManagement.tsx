import { useState, useMemo, useCallback, useEffect } from "react";
import { Search, Trash2, Loader2, RefreshCw, Eye, Download } from "lucide-react";
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
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

// --- Configuration ---
import { API_BASE_URL as GLOBAL_API_URL, SERVER_URL as GLOBAL_SERVER_URL } from "@/config/api";
const API_BASE_URL = `${GLOBAL_API_URL}/leads`;
const ITEMS_PER_PAGE_OPTIONS = [5, 10, 25, 50];

// --- Interfaces ---
export interface Lead {
  id: number;
  name: string;
  email: string;
  phone: string;
  service: string;
  pricing_plan: string | null;
  source: "header" | "service_details" | "Chat Assistant" | string;
  created_at: string;
  chat_transcript?: string | null;
}

interface ApiLeadsResponse {
  status: number;
  message?: string;
  data: Lead[];
  total?: number;
}

const LeadsManagement = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [activeTab, setActiveTab] = useState<string>("header");
  const [searchTerm, setSearchTerm] = useState("");

  // --- View Details Dialog State ---
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

  // --- Selection & Pagination State ---
  const [selectedLeadIds, setSelectedLeadIds] = useState<number[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(ITEMS_PER_PAGE_OPTIONS[1]);

  // --- Async Status States ---
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // --- Fetch Leads ---
  const fetchLeads = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const url = `${API_BASE_URL}?search=${encodeURIComponent(searchTerm)}`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: ApiLeadsResponse = await response.json();
      const fetchedData = result.data || [];

      setLeads(fetchedData);
    } catch (err) {
      console.error("Error fetching leads:", err);
      setError("Failed to fetch leads. Please check your network or try again.");
      setLeads([]);
    } finally {
      setIsLoading(false);
    }
  }, [searchTerm]);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  // Reset tab-dependent pagination state on tab switch
  const handleTabChange = (val: string) => {
    setActiveTab(val);
    setCurrentPage(1);
    setSelectedLeadIds([]);
  };

  // --- Filtering & Tab Data Separation ---
  const tabFilteredLeads = useMemo(() => {
    return leads.filter((lead) => {
      let matchesTab = false;
      if (activeTab === "header") matchesTab = lead.source === "header";
      else if (activeTab === "service_details") matchesTab = lead.source === "service_details";
      else if (activeTab === "chat_assistant") matchesTab = lead.source === "Chat Assistant";

      const searchLower = searchTerm.toLowerCase();
      const matchesSearch =
        lead.name.toLowerCase().includes(searchLower) ||
        lead.email.toLowerCase().includes(searchLower) ||
        lead.phone.toLowerCase().includes(searchLower) ||
        lead.service.toLowerCase().includes(searchLower) ||
        (lead.pricing_plan && lead.pricing_plan.toLowerCase().includes(searchLower));

      return matchesTab && matchesSearch;
    });
  }, [leads, activeTab, searchTerm]);

  // --- Pagination Calculations ---
  const totalPages = Math.ceil(tabFilteredLeads.length / perPage);
  const startIndex = (currentPage - 1) * perPage;
  const endIndex = startIndex + perPage;
  const paginatedLeads = tabFilteredLeads.slice(startIndex, endIndex);

  // --- Selection Logic ---
  const isAllSelected =
    paginatedLeads.length > 0 &&
    paginatedLeads.every((lead) => selectedLeadIds.includes(lead.id));

  const isIndeterminate =
    paginatedLeads.some((lead) => selectedLeadIds.includes(lead.id)) &&
    !isAllSelected;

  const handleSelectAll = () => {
    if (isAllSelected) {
      const idsToDeselect = paginatedLeads.map((l) => l.id);
      setSelectedLeadIds((prev) =>
        prev.filter((id) => !idsToDeselect.includes(id))
      );
    } else {
      const idsToSelect = paginatedLeads.map((l) => l.id);
      setSelectedLeadIds((prev) =>
        Array.from(new Set([...prev, ...idsToSelect]))
      );
    }
  };

  const handleSelectLead = (id: number, checked: boolean) => {
    setSelectedLeadIds((prev) =>
      checked ? [...prev, id] : prev.filter((leadId) => leadId !== id)
    );
  };

  const handleDeselectAll = () => {
    setSelectedLeadIds([]);
  };

  // --- Delete Handler ---
  const handleDeleteSelected = useCallback(
    async (idsToDelete: number[] = selectedLeadIds) => {
      if (idsToDelete.length === 0) return;

      if (
        !window.confirm(
          `Are you sure you want to delete ${idsToDelete.length} lead(s)?`
        )
      ) {
        return;
      }

      setIsProcessing(true);
      try {
        const response = await fetch(`${API_BASE_URL}/delete-multiple`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ ids: idsToDelete }),
        });

        if (!response.ok) {
          const errorResult = await response.json();
          throw new Error(
            errorResult.error || `Failed with status: ${response.status}`
          );
        }

        const result = await response.json();
        toast.success(
          result.message ||
            `${idsToDelete.length} lead(s) deleted successfully.`
        );

        setSelectedLeadIds((prev) =>
          prev.filter((id) => !idsToDelete.includes(id))
        );
        await fetchLeads();
      } catch (err) {
        console.error("Error deleting leads:", err);
        const message =
          err instanceof Error ? err.message : "Failed to delete leads.";
        toast.error(message);
      } finally {
        setIsProcessing(false);
      }
    },
    [selectedLeadIds, fetchLeads]
  );

  // --- Export to CSV Handler ---
  const handleExportCSV = () => {
    if (tabFilteredLeads.length === 0) {
      toast.error("No leads available to export.");
      return;
    }

    const headers = ["ID", "Name", "Email", "Phone", "Service", "Pricing Plan", "Source", "Date"];
    const rows = tabFilteredLeads.map((lead) => [
      lead.id,
      `"${lead.name.replace(/"/g, '""')}"`,
      `"${lead.email.replace(/"/g, '""')}"`,
      `"${lead.phone.replace(/"/g, '""')}"`,
      `"${lead.service.replace(/"/g, '""')}"`,
      `"${(lead.pricing_plan || "N/A").replace(/"/g, '""')}"`,
      lead.source,
      new Date(lead.created_at).toISOString(),
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `leads_${activeTab}_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // --- Pagination Handlers ---
  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handlePerPageChange = (value: string) => {
    const newPerPage = parseInt(value, 10);
    setPerPage(newPerPage);
    setCurrentPage(1);
  };

  const handleViewLead = (lead: Lead) => {
    setSelectedLead(lead);
    setIsViewOpen(true);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-muted-foreground mb-1">
              Dashboard › Leads
            </div>
            <h1 className="text-3xl font-bold">Leads Management</h1>
          </div>
          <Button
            onClick={handleExportCSV}
            variant="outline"
            className="flex items-center gap-2"
            disabled={isLoading || tabFilteredLeads.length === 0}
          >
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Main Content Card with Tabs */}
        <Tabs
          value={activeTab}
          onValueChange={handleTabChange}
          className="w-full"
        >
          <div className="flex items-center justify-between mb-4">
            <TabsList className="grid grid-cols-3 w-[540px]">
              <TabsTrigger value="header" className="relative">
                Header Leads
                <Badge variant="secondary" className="ml-2 bg-muted text-xs">
                  {leads.filter((l) => l.source === "header").length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="service_details" className="relative">
                Service Details
                <Badge variant="secondary" className="ml-2 bg-muted text-xs">
                  {leads.filter((l) => l.source === "service_details").length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="chat_assistant" className="relative">
                🤖 BTR Bot
                <Badge variant="secondary" className="ml-2 bg-primary/20 text-primary text-xs">
                  {leads.filter((l) => l.source === "Chat Assistant").length}
                </Badge>
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="rounded-lg border border-border bg-card">
            {/* Search & Bulk Actions Bar */}
            <div className="border-b border-border p-4 flex justify-between items-center gap-4 flex-wrap">
              <div className="flex items-center space-x-2 flex-1 max-w-sm">
                <div className="relative w-full">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search name, email, phone, service..."
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="pl-9 bg-background"
                    disabled={isProcessing}
                  />
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={fetchLeads}
                  disabled={isLoading || isProcessing}
                >
                  <RefreshCw
                    className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
                  />
                </Button>
              </div>

              <div className="flex items-center space-x-2">
                {selectedLeadIds.length > 0 && (
                  <>
                    <span className="text-sm text-primary font-medium mr-2">
                      {selectedLeadIds.length} selected
                    </span>
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
                      onClick={() => handleDeleteSelected(selectedLeadIds)}
                      disabled={isProcessing}
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Delete Selected
                    </Button>
                  </>
                )}
              </div>
            </div>

            {/* Table Rendering */}
            <TabsContent value={activeTab} className="m-0">
              <div className="overflow-x-auto min-h-[350px]">
                {isLoading ? (
                  <div className="flex justify-center items-center h-[350px]">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <span className="ml-2">Loading Leads...</span>
                  </div>
                ) : paginatedLeads.length === 0 ? (
                  <div className="flex justify-center items-center h-[350px]">
                    <p className="text-muted-foreground">
                      No leads found for this source.
                    </p>
                  </div>
                ) : (
                  <table className="w-full">
                    <thead className="border-b border-border bg-muted/50">
                      <tr>
                        <th className="p-4 text-left w-10">
                          <Checkbox
                            checked={isAllSelected}
                            onCheckedChange={handleSelectAll}
                            {...(isIndeterminate && {
                              checked: "indeterminate" as const,
                            })}
                            disabled={isProcessing}
                          />
                        </th>
                        <th className="p-4 text-left text-sm font-medium">Name</th>
                        <th className="p-4 text-left text-sm font-medium">Email</th>
                        <th className="p-4 text-left text-sm font-medium">Phone</th>
                        <th className="p-4 text-left text-sm font-medium">Service</th>
                        {(activeTab === "service_details" || activeTab === "chat_assistant") && (
                          <th className="p-4 text-left text-sm font-medium">
                            Plan
                          </th>
                        )}
                        <th className="p-4 text-left text-sm font-medium">
                          Received Date
                        </th>
                        <th className="p-4 text-right text-sm font-medium">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedLeads.map((lead) => (
                        <tr
                          key={lead.id}
                          className="border-b border-border hover:bg-muted/30 transition-colors"
                        >
                          <td className="p-4">
                            <Checkbox
                              checked={selectedLeadIds.includes(lead.id)}
                              onCheckedChange={(checked) =>
                                handleSelectLead(lead.id, checked as boolean)
                              }
                              disabled={isProcessing}
                            />
                          </td>
                          <td className="p-4 text-sm font-medium">{lead.name}</td>
                          <td className="p-4 text-sm text-muted-foreground">
                            {lead.email}
                          </td>
                          <td className="p-4 text-sm text-muted-foreground">
                            {lead.phone}
                          </td>
                          <td className="p-4 text-sm">
                            <Badge variant="outline">{lead.service}</Badge>
                          </td>
                          {(activeTab === "service_details" || activeTab === "chat_assistant") && (
                            <td className="p-4 text-sm">
                              {lead.pricing_plan ? (
                                <Badge className="bg-primary/10 text-primary border-primary/20 hover:bg-primary/20">
                                  {lead.pricing_plan}
                                </Badge>
                              ) : (
                                <span className="text-muted-foreground text-xs">
                                  N/A
                                </span>
                              )}
                            </td>
                          )}
                          <td className="p-4 text-sm text-muted-foreground">
                            {new Date(lead.created_at).toLocaleDateString(
                              undefined,
                              {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                              }
                            )}
                          </td>
                          <td className="p-4 flex items-center justify-end space-x-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-primary hover:bg-primary/10"
                              onClick={() => handleViewLead(lead)}
                              disabled={isProcessing}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              View
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-destructive hover:bg-destructive/10"
                              onClick={() => handleDeleteSelected([lead.id])}
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
            </TabsContent>

            {/* Pagination Footer */}
            <div className="p-4 flex items-center justify-between border-t border-border">
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
                    {ITEMS_PER_PAGE_OPTIONS.map((num) => (
                      <SelectItem key={num} value={String(num)}>
                        {num}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-4">
                <span className="text-sm text-muted-foreground">
                  {tabFilteredLeads.length === 0
                    ? "0 records"
                    : `Showing ${startIndex + 1}-${Math.min(
                        endIndex,
                        tabFilteredLeads.length
                      )} of ${tabFilteredLeads.length} records`}
                </span>

                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        onClick={() => handlePageChange(currentPage - 1)}
                        className={
                          currentPage === 1 ||
                          totalPages === 0 ||
                          isProcessing
                            ? "pointer-events-none opacity-50"
                            : "cursor-pointer"
                        }
                      />
                    </PaginationItem>

                    {totalPages > 0 &&
                      Array.from({ length: totalPages }, (_, i) => i + 1).map(
                        (page) => (
                          <PaginationItem key={page}>
                            <PaginationLink
                              onClick={() => handlePageChange(page)}
                              isActive={page === currentPage}
                              className={
                                isProcessing
                                  ? "pointer-events-none opacity-50"
                                  : "cursor-pointer"
                              }
                            >
                              {page}
                            </PaginationLink>
                          </PaginationItem>
                        )
                      )}

                    <PaginationItem>
                      <PaginationNext
                        onClick={() => handlePageChange(currentPage + 1)}
                        className={
                          currentPage === totalPages ||
                          totalPages === 0 ||
                          isProcessing
                            ? "pointer-events-none opacity-50"
                            : "cursor-pointer"
                        }
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            </div>
          </div>
        </Tabs>
      </div>

      {/* --- View Lead Details Modal --- */}
      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="sm:max-w-[560px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              Lead Information
              {selectedLead?.source === "Chat Assistant" && (
                <Badge className="bg-primary/20 text-primary border-primary/30">🤖 BTR Bot</Badge>
              )}
            </DialogTitle>
          </DialogHeader>

          {selectedLead && (
            <div className="space-y-3 py-2 text-sm">
              <div className="grid grid-cols-3 gap-2 border-b border-border pb-2">
                <span className="font-semibold text-muted-foreground">Source:</span>
                <span className="col-span-2">
                  <Badge variant="secondary" className="capitalize">
                    {selectedLead.source.replace("_", " ")}
                  </Badge>
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 border-b border-border pb-2">
                <span className="font-semibold text-muted-foreground">Name:</span>
                <span className="col-span-2 font-medium">{selectedLead.name}</span>
              </div>

              <div className="grid grid-cols-3 gap-2 border-b border-border pb-2">
                <span className="font-semibold text-muted-foreground">Email:</span>
                <a href={`mailto:${selectedLead.email}`} className="col-span-2 text-primary underline">
                  {selectedLead.email}
                </a>
              </div>

              <div className="grid grid-cols-3 gap-2 border-b border-border pb-2">
                <span className="font-semibold text-muted-foreground">Phone:</span>
                <a href={`tel:${selectedLead.phone}`} className="col-span-2 text-primary underline">
                  {selectedLead.phone}
                </a>
              </div>

              <div className="grid grid-cols-3 gap-2 border-b border-border pb-2">
                <span className="font-semibold text-muted-foreground">Service:</span>
                <span className="col-span-2 font-medium">{selectedLead.service}</span>
              </div>

              {selectedLead.pricing_plan && (
                <div className="grid grid-cols-3 gap-2 border-b border-border pb-2">
                  <span className="font-semibold text-muted-foreground">Pricing Plan:</span>
                  <span className="col-span-2 font-medium">{selectedLead.pricing_plan}</span>
                </div>
              )}

              <div className="grid grid-cols-3 gap-2 border-b border-border pb-2">
                <span className="font-semibold text-muted-foreground">Submitted At:</span>
                <span className="col-span-2">{new Date(selectedLead.created_at).toLocaleString()}</span>
              </div>

              {/* Chat Transcript Section */}
              {selectedLead.source === "Chat Assistant" && selectedLead.chat_transcript && (() => {
                let transcript: {from: string; text: string}[] = [];
                try { transcript = JSON.parse(selectedLead.chat_transcript); } catch {}
                return transcript.length > 0 ? (
                  <div className="border-t border-border pt-3">
                    <p className="font-semibold text-muted-foreground mb-2">💬 Chat Transcript</p>
                    <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                      {transcript.map((msg, i) => (
                        <div key={i} className={`flex gap-2 ${msg.from === 'user' ? 'justify-end' : 'justify-start'}`}>
                          <div className={`px-3 py-2 rounded-lg text-xs max-w-[80%] ${
                            msg.from === 'user'
                              ? 'bg-primary/20 text-primary-foreground'
                              : 'bg-muted text-muted-foreground'
                          }`}>
                            <span className="font-medium capitalize mr-1">{msg.from === 'bot' ? '🤖' : '👤'}</span>
                            {msg.text}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null;
              })()}
            </div>
          )}

          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Close</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default LeadsManagement;