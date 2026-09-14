import React, { useState, useEffect, useCallback } from 'react';
import AdminLayout from '../components/layout/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  Search,
  RefreshCw,
  Eye,
  Bot,
  User,
  Sparkles,
  Flame,
  Thermometer,
  Snowflake,
  Clock,
  PhoneCall,
  Briefcase,
  DollarSign,
  Calendar,
  Mail,
  Phone
} from 'lucide-react';
import { toast } from 'sonner';
import { API_BASE_URL } from '../config/api';

interface AIConversation {
  id: number;
  session_id: string;
  status: 'active' | 'completed' | 'handoff_requested' | 'archived';
  user_name: string | null;
  user_email: string | null;
  user_phone: string | null;
  company_name: string | null;
  business_type: string | null;
  project_type: string | null;
  project_description: string | null;
  budget_range: string | null;
  timeline: string | null;
  preferred_contact_method: string | null;
  detected_service: string | null;
  intent: string | null;
  lead_score: number;
  lead_status: 'cold' | 'warm' | 'hot';
  ai_summary: string | null;
  created_at: string;
  updated_at: string;
  message_count?: number;
  last_message?: string;
}

interface AIMessage {
  id: number;
  role: 'user' | 'assistant' | 'model' | 'tool';
  content: string;
  tool_name: string | null;
  created_at: string;
}

export default function AIConversations() {
  const [conversations, setConversations] = useState<AIConversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [leadStatusFilter, setLeadStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  // Stats
  const [stats, setStats] = useState({
    totalConversations: 0,
    hotLeads: 0,
    warmLeads: 0,
    handoffRequests: 0
  });

  // Modal Dialog Details State
  const [selectedConv, setSelectedConv] = useState<AIConversation | null>(null);
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [loadingTranscript, setLoadingTranscript] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const fetchStats = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/ai/admin/stats`);
      const data = await res.json();
      if (data.success) {
        setStats({
          totalConversations: data.totalConversations || 0,
          hotLeads: data.hotLeads || 0,
          warmLeads: data.warmLeads || 0,
          handoffRequests: data.handoffRequests || 0
        });
      }
    } catch (e) {
      console.error('Error fetching stats:', e);
    }
  };

  const fetchConversations = useCallback(async () => {
    setLoading(true);
    try {
      let url = `${API_BASE_URL}/ai/admin/conversations?page=${page}&limit=20`;
      if (searchTerm.trim()) url += `&search=${encodeURIComponent(searchTerm.trim())}`;
      if (statusFilter !== 'all') url += `&status=${statusFilter}`;
      if (leadStatusFilter !== 'all') url += `&lead_status=${leadStatusFilter}`;

      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setConversations(data.data || []);
        setTotal(data.total || 0);
      }
    } catch (err) {
      console.error('Error fetching conversations:', err);
      toast.error('Failed to load conversations.');
    } finally {
      setLoading(false);
    }
  }, [page, searchTerm, statusFilter, leadStatusFilter]);

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  const handleOpenDetail = async (conv: AIConversation) => {
    setSelectedConv(conv);
    setIsDetailOpen(true);
    setLoadingTranscript(true);

    try {
      const res = await fetch(`${API_BASE_URL}/ai/admin/conversations/${conv.id}`);
      const data = await res.json();
      if (data.success) {
        setSelectedConv(data.conversation);
        setMessages(data.messages || []);
      }
    } catch (err) {
      console.error('Error loading transcript:', err);
      toast.error('Failed to load full chat transcript.');
    } finally {
      setLoadingTranscript(false);
    }
  };

  const handleUpdateStatus = async (convId: number, newLeadStatus: string, newConvStatus?: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/ai/admin/conversations/${convId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lead_status: newLeadStatus,
          status: newConvStatus || selectedConv?.status
        })
      });

      const data = await res.json();
      if (data.success) {
        toast.success('Conversation updated.');
        if (selectedConv && selectedConv.id === convId) {
          setSelectedConv(prev => prev ? ({
            ...prev,
            lead_status: newLeadStatus as any,
            status: (newConvStatus || prev.status) as any
          }) : null);
        }
        fetchConversations();
        fetchStats();
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to update status.');
    }
  };

  const getLeadBadge = (status: string, score: number) => {
    switch (status) {
      case 'hot':
        return (
          <Badge className="bg-red-500/10 text-red-500 border border-red-500/20 gap-1 font-semibold">
            <Flame size={12} /> Hot ({score})
          </Badge>
        );
      case 'warm':
        return (
          <Badge className="bg-amber-500/10 text-amber-500 border border-amber-500/20 gap-1 font-semibold">
            <Thermometer size={12} /> Warm ({score})
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="text-muted-foreground gap-1">
            <Snowflake size={12} /> Cold ({score})
          </Badge>
        );
    }
  };

  const getConvStatusBadge = (status: string) => {
    switch (status) {
      case 'handoff_requested':
        return <Badge className="bg-purple-500/15 text-purple-400 border-purple-500/30">Handoff Requested</Badge>;
      case 'completed':
        return <Badge className="bg-green-500/15 text-green-400 border-green-500/30">Completed</Badge>;
      default:
        return <Badge variant="secondary">Active</Badge>;
    }
  };

  return (
    <AdminLayout>
      <div className="p-6 space-y-6 max-w-7xl">
        {/* Title Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold">AI Conversations & Leads</h1>
              <Badge className="bg-red-500/10 text-red-500 border-red-500/20">
                <Sparkles size={12} className="mr-1" /> Real-time Intel
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              View and manage natural language conversations between website visitors and the BTR AI Assistant.
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={() => { fetchConversations(); fetchStats(); }} className="gap-2">
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Refresh
          </Button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground font-medium">Total AI Chats</p>
              <h3 className="text-2xl font-bold mt-1">{stats.totalConversations}</h3>
            </CardContent>
          </Card>
          <Card className="border-red-500/20 bg-red-500/5">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <p className="text-xs text-red-400 font-medium">Hot Leads</p>
                <Flame size={16} className="text-red-500" />
              </div>
              <h3 className="text-2xl font-bold text-red-500 mt-1">{stats.hotLeads}</h3>
            </CardContent>
          </Card>
          <Card className="border-amber-500/20 bg-amber-500/5">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <p className="text-xs text-amber-400 font-medium">Warm Leads</p>
                <Thermometer size={16} className="text-amber-500" />
              </div>
              <h3 className="text-2xl font-bold text-amber-500 mt-1">{stats.warmLeads}</h3>
            </CardContent>
          </Card>
          <Card className="border-purple-500/20 bg-purple-500/5">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <p className="text-xs text-purple-400 font-medium">Handoffs Requested</p>
                <PhoneCall size={16} className="text-purple-400" />
              </div>
              <h3 className="text-2xl font-bold text-purple-400 mt-1">{stats.handoffRequests}</h3>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="relative w-full md:w-80">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search visitor, email, service, scope..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-9 h-9 text-sm"
            />
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <Select value={leadStatusFilter} onValueChange={setLeadStatusFilter}>
              <SelectTrigger className="w-[140px] h-9 text-sm">
                <SelectValue placeholder="Lead Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Leads</SelectItem>
                <SelectItem value="hot">🔥 Hot Leads</SelectItem>
                <SelectItem value="warm">⚡ Warm Leads</SelectItem>
                <SelectItem value="cold">❄️ Cold Leads</SelectItem>
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[160px] h-9 text-sm">
                <SelectValue placeholder="Chat Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Chat Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="handoff_requested">Handoff Requested</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Conversation List Table */}
        <div className="border rounded-lg overflow-hidden bg-card">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-muted/50 border-b text-xs text-muted-foreground uppercase font-medium">
                <tr>
                  <th className="px-4 py-3">Visitor</th>
                  <th className="px-4 py-3">Service / Intent</th>
                  <th className="px-4 py-3">Lead Score</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Messages</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {conversations.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                      {loading ? "Loading AI conversations..." : "No AI conversations found matching criteria."}
                    </td>
                  </tr>
                ) : (
                  conversations.map(conv => (
                    <tr key={conv.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-medium text-foreground">
                          {conv.user_name || 'Anonymous Visitor'}
                        </div>
                        <div className="text-xs text-muted-foreground flex items-center gap-2 mt-0.5">
                          {conv.user_email && <span>{conv.user_email}</span>}
                          {conv.user_phone && <span>• {conv.user_phone}</span>}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-foreground">
                          {conv.detected_service || 'General Inquiry'}
                        </div>
                        {conv.intent && (
                          <div className="text-xs text-muted-foreground">
                            Intent: {conv.intent}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {getLeadBadge(conv.lead_status, conv.lead_score)}
                      </td>
                      <td className="px-4 py-3">
                        {getConvStatusBadge(conv.status)}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {conv.message_count || 0} msgs
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {new Date(conv.created_at).toLocaleDateString()} {new Date(conv.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 gap-1 text-xs"
                          onClick={() => handleOpenDetail(conv)}
                        >
                          <Eye size={14} /> View Transcript
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Full Transcript & Lead Intel Modal */}
        <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0">
            <DialogHeader className="p-6 pb-4 border-b">
              <div className="flex items-center justify-between">
                <div>
                  <DialogTitle className="text-xl flex items-center gap-2">
                    <span>{selectedConv?.user_name || 'Anonymous Visitor'}</span>
                    {selectedConv && getLeadBadge(selectedConv.lead_status, selectedConv.lead_score)}
                  </DialogTitle>
                  <DialogDescription className="text-xs mt-1">
                    Session: {selectedConv?.session_id} • Started on {selectedConv && new Date(selectedConv.created_at).toLocaleString()}
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Extracted Intel Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="p-3 bg-muted/40 rounded-lg border text-xs space-y-1">
                  <div className="text-muted-foreground flex items-center gap-1 font-medium">
                    <User size={13} /> Contact Info
                  </div>
                  <p><strong>Name:</strong> {selectedConv?.user_name || 'N/A'}</p>
                  <p><strong>Email:</strong> {selectedConv?.user_email || 'N/A'}</p>
                  <p><strong>Phone:</strong> {selectedConv?.user_phone || 'N/A'}</p>
                </div>

                <div className="p-3 bg-muted/40 rounded-lg border text-xs space-y-1">
                  <div className="text-muted-foreground flex items-center gap-1 font-medium">
                    <Briefcase size={13} /> Scope & Service
                  </div>
                  <p><strong>Service:</strong> {selectedConv?.detected_service || 'N/A'}</p>
                  <p><strong>Company:</strong> {selectedConv?.company_name || 'N/A'}</p>
                  <p><strong>Timeline:</strong> {selectedConv?.timeline || 'N/A'}</p>
                </div>

                <div className="p-3 bg-muted/40 rounded-lg border text-xs space-y-1">
                  <div className="text-muted-foreground flex items-center gap-1 font-medium">
                    <DollarSign size={13} /> Commercial Details
                  </div>
                  <p><strong>Budget:</strong> {selectedConv?.budget_range || 'N/A'}</p>
                  <p><strong>Intent:</strong> {selectedConv?.intent || 'General'}</p>
                  <p><strong>Contact Method:</strong> {selectedConv?.preferred_contact_method || 'Email'}</p>
                </div>
              </div>

              {/* AI Summary */}
              {selectedConv?.ai_summary && (
                <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg text-xs space-y-1">
                  <p className="font-semibold text-blue-400 flex items-center gap-1">
                    <Sparkles size={13} /> AI Executive Summary:
                  </p>
                  <p className="text-blue-300">{selectedConv.ai_summary}</p>
                </div>
              )}

              {/* Chat Transcript */}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold">Conversation Transcript</h4>
                {loadingTranscript ? (
                  <div className="p-8 text-center text-muted-foreground text-sm">
                    Loading transcript...
                  </div>
                ) : (
                  <div className="space-y-3 p-4 bg-muted/20 border rounded-lg max-h-[350px] overflow-y-auto">
                    {messages.filter(m => m.role !== 'tool').map((m, idx) => (
                      <div
                        key={idx}
                        className={`flex gap-3 text-xs ${
                          m.role === 'user' ? 'justify-end' : 'justify-start'
                        }`}
                      >
                        {m.role !== 'user' && (
                          <div className="w-6 h-6 rounded-full bg-red-500/20 text-red-500 flex items-center justify-center shrink-0">
                            <Bot size={12} />
                          </div>
                        )}
                        <div
                          className={`max-w-[75%] p-3 rounded-xl ${
                            m.role === 'user'
                              ? 'bg-red-500 text-white rounded-br-none'
                              : 'bg-card border text-card-foreground rounded-bl-none'
                          }`}
                        >
                          <p className="whitespace-pre-wrap">{m.content}</p>
                          <span className="text-[10px] opacity-60 mt-1 block">
                            {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        {m.role === 'user' && (
                          <div className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-500 flex items-center justify-center shrink-0">
                            <User size={12} />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <DialogFooter className="p-4 border-t flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Change Status:</span>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs text-red-500 hover:text-red-600"
                  onClick={() => selectedConv && handleUpdateStatus(selectedConv.id, 'hot')}
                >
                  Mark Hot
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs text-amber-500 hover:text-amber-600"
                  onClick={() => selectedConv && handleUpdateStatus(selectedConv.id, 'warm')}
                >
                  Mark Warm
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs text-green-500 hover:text-green-600"
                  onClick={() => selectedConv && handleUpdateStatus(selectedConv.id, selectedConv.lead_status, 'completed')}
                >
                  Mark Completed
                </Button>
              </div>
              <Button variant="secondary" size="sm" onClick={() => setIsDetailOpen(false)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
