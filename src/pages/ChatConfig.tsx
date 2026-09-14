import React, { useEffect, useState } from 'react';
import AdminLayout from '../components/layout/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Trash2, Plus, ToggleLeft, ToggleRight, ChevronDown, ChevronRight,
  Bot, Save, Sparkles, Check, AlertCircle, RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';
import { API_BASE_URL } from '../config/api';

interface AISettings {
  is_active: boolean;
  bot_name: string;
  welcome_message: string;
  enable_lead_capture: boolean;
  enable_pricing_answers: boolean;
  enable_portfolio_answers: boolean;
  enable_faq_answers: boolean;
  enable_human_handoff: boolean;
  system_prompt_override: string;
}

interface Service {
  id: number;
  name: string;
  service_active: number;
  topic_id: number | null;
  chat_active: boolean | null;
  chat_label: string | null;
}

interface Question {
  id: number;
  topic_id: number;
  question_text: string;
}

export default function ChatConfig() {
  const [aiSettings, setAiSettings] = useState<AISettings>({
    is_active: true,
    bot_name: 'BTR AI Assistant',
    welcome_message: '👋 Welcome to BTR Communication! How can I assist you with your project today?',
    enable_lead_capture: true,
    enable_pricing_answers: true,
    enable_portfolio_answers: true,
    enable_faq_answers: true,
    enable_human_handoff: true,
    system_prompt_override: ''
  });

  const [savingSettings, setSavingSettings] = useState(false);
  const [loading, setLoading] = useState(true);

  // Legacy Topic & Question state
  const [services, setServices] = useState<Service[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [expandedServiceId, setExpandedServiceId] = useState<number | null>(null);
  const [newQuestion, setNewQuestion] = useState('');
  const [editingLabelId, setEditingLabelId] = useState<number | null>(null);
  const [labelDraft, setLabelDraft] = useState('');

  const fetchAllConfig = () => {
    setLoading(true);
    Promise.all([
      fetch(`${API_BASE_URL}/ai/admin/settings`).then(r => r.json()).catch(() => null),
      fetch(`${API_BASE_URL}/chat/admin/config`).then(r => r.json()).catch(() => null)
    ])
      .then(([aiRes, legacyRes]) => {
        if (aiRes?.settings) {
          setAiSettings({
            is_active: !!aiRes.settings.is_active,
            bot_name: aiRes.settings.bot_name || 'BTR AI Assistant',
            welcome_message: aiRes.settings.welcome_message || '',
            enable_lead_capture: !!aiRes.settings.enable_lead_capture,
            enable_pricing_answers: !!aiRes.settings.enable_pricing_answers,
            enable_portfolio_answers: !!aiRes.settings.enable_portfolio_answers,
            enable_faq_answers: !!aiRes.settings.enable_faq_answers,
            enable_human_handoff: !!aiRes.settings.enable_human_handoff,
            system_prompt_override: aiRes.settings.system_prompt_override || ''
          });
        }

        if (legacyRes) {
          setServices(legacyRes.services || []);
          setQuestions(legacyRes.questions || []);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchAllConfig();
  }, []);

  const handleSaveAISettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    try {
      const res = await fetch(`${API_BASE_URL}/ai/admin/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(aiSettings)
      });
      const data = await res.json();
      if (data.success) {
        toast.success("AI Assistant settings saved successfully!");
      } else {
        toast.error("Failed to save settings: " + (data.error || "Unknown error"));
      }
    } catch (err) {
      console.error(err);
      toast.error("Error connecting to server to save settings.");
    } finally {
      setSavingSettings(false);
    }
  };

  const handleToggleLegacy = (service: Service) => {
    fetch(`${API_BASE_URL}/chat/admin/topics/toggle`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ service_id: service.id })
    }).then(() => fetchAllConfig());
  };

  const handleSaveLabel = (service: Service) => {
    fetch(`${API_BASE_URL}/chat/admin/topics/label`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ service_id: service.id, chat_label: labelDraft.trim() || null })
    }).then(() => {
      setEditingLabelId(null);
      fetchAllConfig();
    });
  };

  const handleAddQuestion = (e: React.FormEvent, topicId: number) => {
    e.preventDefault();
    if (!newQuestion.trim()) return;
    fetch(`${API_BASE_URL}/chat/admin/questions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ topic_id: topicId, question_text: newQuestion })
    }).then(() => {
      setNewQuestion('');
      fetchAllConfig();
    });
  };

  const handleDeleteQuestion = (id: number) => {
    fetch(`${API_BASE_URL}/chat/admin/questions/${id}`, { method: 'DELETE' })
      .then(() => fetchAllConfig());
  };

  return (
    <AdminLayout>
      <div className="p-6 max-w-5xl space-y-8">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">AI Assistant Configuration</h1>
            <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-red-500/10 text-red-500 border border-red-500/20">
              <Sparkles size={11} /> Gemini Powered
            </span>
          </div>
          <p className="text-muted-foreground mt-1 text-sm">
            Configure how your BTR AI Sales & Support Assistant interacts with website visitors, answers questions, queries MySQL database tools, and qualifies leads.
          </p>
        </div>

        {/* AI Settings Form */}
        <form onSubmit={handleSaveAISettings} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Bot size={20} className="text-red-500" />
                  General Bot Settings
                </span>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="bot-status"
                    checked={aiSettings.is_active}
                    onCheckedChange={(val) => setAiSettings(prev => ({ ...prev, is_active: val }))}
                  />
                  <Label htmlFor="bot-status" className="font-normal text-sm cursor-pointer">
                    {aiSettings.is_active ? 'AI Assistant Active' : 'AI Assistant Offline'}
                  </Label>
                </div>
              </CardTitle>
              <CardDescription>
                Control identity, name, and introductory greeting seen by visitors.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="bot-name">Assistant Name</Label>
                  <Input
                    id="bot-name"
                    value={aiSettings.bot_name}
                    onChange={(e) => setAiSettings(prev => ({ ...prev, bot_name: e.target.value }))}
                    placeholder="e.g. BTR Bot"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="welcome-msg">Welcome Greeting Message</Label>
                <Textarea
                  id="welcome-msg"
                  rows={2}
                  value={aiSettings.welcome_message}
                  onChange={(e) => setAiSettings(prev => ({ ...prev, welcome_message: e.target.value }))}
                  placeholder="Greeting shown when a user opens the chat widget..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="system-override">System Instructions Override (Optional)</Label>
                <Textarea
                  id="system-override"
                  rows={3}
                  value={aiSettings.system_prompt_override}
                  onChange={(e) => setAiSettings(prev => ({ ...prev, system_prompt_override: e.target.value }))}
                  placeholder="Leave empty to use BTR's standard Zero-Hallucination system prompt..."
                />
              </div>
            </CardContent>
          </Card>

          {/* Feature Toggles */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">AI Tool & Knowledge Capabilities</CardTitle>
              <CardDescription>
                Enable or disable dynamic database tool queries for services, pricing, portfolio, and FAQ facts.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium text-sm">Lead Capture & Scoring</p>
                  <p className="text-xs text-muted-foreground">Extract customer requirements & save to leads table</p>
                </div>
                <Switch
                  checked={aiSettings.enable_lead_capture}
                  onCheckedChange={(val) => setAiSettings(p => ({ ...p, enable_lead_capture: val }))}
                />
              </div>

              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium text-sm">Pricing Answers</p>
                  <p className="text-xs text-muted-foreground">Query admin_pricing database dynamically</p>
                </div>
                <Switch
                  checked={aiSettings.enable_pricing_answers}
                  onCheckedChange={(val) => setAiSettings(p => ({ ...p, enable_pricing_answers: val }))}
                />
              </div>

              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium text-sm">Portfolio Showcase</p>
                  <p className="text-xs text-muted-foreground">Recommend case studies from admin_portfolio</p>
                </div>
                <Switch
                  checked={aiSettings.enable_portfolio_answers}
                  onCheckedChange={(val) => setAiSettings(p => ({ ...p, enable_portfolio_answers: val }))}
                />
              </div>

              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium text-sm">FAQ Answers</p>
                  <p className="text-xs text-muted-foreground">Query admin_faq database for company questions</p>
                </div>
                <Switch
                  checked={aiSettings.enable_faq_answers}
                  onCheckedChange={(val) => setAiSettings(p => ({ ...p, enable_faq_answers: val }))}
                />
              </div>

              <div className="flex items-center justify-between p-3 border rounded-lg md:col-span-2">
                <div>
                  <p className="font-medium text-sm">Human Agent Handoff</p>
                  <p className="text-xs text-muted-foreground">Notify staff via email when visitors request human assistance</p>
                </div>
                <Switch
                  checked={aiSettings.enable_human_handoff}
                  onCheckedChange={(val) => setAiSettings(p => ({ ...p, enable_human_handoff: val }))}
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button type="submit" disabled={savingSettings} className="gap-2">
              <Save size={16} />
              {savingSettings ? "Saving Settings..." : "Save AI Assistant Settings"}
            </Button>
          </div>
        </form>

        {/* Legacy / Topic Configuration for Starters */}
        <div className="pt-6 border-t">
          <div className="mb-4">
            <h2 className="text-lg font-semibold">Service Starter Labels (Optional)</h2>
            <p className="text-xs text-muted-foreground">
              Customize how active services and quick-starter topic chips appear in the widget.
            </p>
          </div>

          <div className="space-y-3">
            {services.map(service => {
              const isActive = !!service.chat_active;
              const serviceQuestions = questions.filter(q => q.topic_id === service.topic_id);
              const isExpanded = expandedServiceId === service.id;
              const isEditing = editingLabelId === service.id;

              return (
                <div
                  key={service.id}
                  className={`border rounded-lg transition-colors ${
                    isActive ? 'border-border bg-card' : 'border-border/40 bg-card/40 opacity-70'
                  }`}
                >
                  <div className="p-3 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => handleToggleLegacy(service)}
                      >
                        {isActive ? (
                          <ToggleRight className="h-6 w-6 text-green-500" />
                        ) : (
                          <ToggleLeft className="h-6 w-6 text-muted-foreground" />
                        )}
                      </Button>
                      <div>
                        <span className="font-medium text-sm">{service.name}</span>
                        {service.chat_label && (
                          <span className="ml-2 text-xs text-muted-foreground">
                            (Label: "{service.chat_label}")
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {isEditing ? (
                        <div className="flex items-center gap-1">
                          <Input
                            size={1}
                            className="h-8 text-xs w-48"
                            value={labelDraft}
                            onChange={e => setLabelDraft(e.target.value)}
                            placeholder={service.name}
                          />
                          <Button size="sm" className="h-8 px-2" onClick={() => handleSaveLabel(service)}>
                            <Check size={14} />
                          </Button>
                        </div>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 text-xs text-muted-foreground"
                          onClick={() => {
                            setEditingLabelId(service.id);
                            setLabelDraft(service.chat_label || service.name);
                          }}
                        >
                          Edit Label
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
