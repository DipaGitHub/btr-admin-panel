import React, { useEffect, useState } from 'react';
import AdminLayout from '../components/layout/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Trash2, Plus, ToggleLeft, ToggleRight, ChevronDown, ChevronRight, MessageSquare, Edit3, Check } from 'lucide-react';

import { API_BASE_URL } from '../config/api';

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
  const [services, setServices] = useState<Service[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [expandedServiceId, setExpandedServiceId] = useState<number | null>(null);
  const [newQuestion, setNewQuestion] = useState('');
  const [loading, setLoading] = useState(true);
  // For editing chat_label inline
  const [editingLabelId, setEditingLabelId] = useState<number | null>(null);
  const [labelDraft, setLabelDraft] = useState('');

  const fetchConfig = () => {
    setLoading(true);
    fetch(`${API_BASE_URL}/chat/admin/config`)
      .then(res => res.json())
      .then(data => {
        setServices(data.services || []);
        setQuestions(data.questions || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchConfig(); }, []);

  const handleToggle = (service: Service) => {
    fetch(`${API_BASE_URL}/chat/admin/topics/toggle`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ service_id: service.id })
    }).then(() => fetchConfig());
  };

  const handleSaveLabel = (service: Service) => {
    fetch(`${API_BASE_URL}/chat/admin/topics/label`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ service_id: service.id, chat_label: labelDraft.trim() || null })
    }).then(() => {
      setEditingLabelId(null);
      fetchConfig();
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
      fetchConfig();
    });
  };

  const handleDeleteQuestion = (id: number) => {
    fetch(`${API_BASE_URL}/chat/admin/questions/${id}`, { method: 'DELETE' })
      .then(() => fetchConfig());
  };

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Chat Assistant Configuration</h1>
          <p className="text-muted-foreground mt-1">
            Enable your services for the BTR Bot widget. Set a custom label (what users will see as the topic option) and configure the questions the bot will ask.
          </p>
        </div>

        <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg text-sm text-blue-400 space-y-1">
          <p><strong>How it works:</strong></p>
          <ol className="list-decimal list-inside space-y-1 ml-1">
            <li>Toggle a service <strong>ON</strong> to show it in the BTR Bot widget.</li>
            <li>Set a <strong>Chat Label</strong> — this is what users see (e.g. "I want to build a website" instead of "Web Development").</li>
            <li>Expand the service and add <strong>2–3 questions</strong> the bot will ask users one by one.</li>
            <li>After the questions, the bot automatically collects the user's contact details as a <strong>lead</strong>.</li>
          </ol>
        </div>

        {loading ? (
          <p className="text-muted-foreground">Loading services...</p>
        ) : (
          <div className="space-y-3">
            {services.map(service => {
              const isEnabled = !!(service.topic_id && service.chat_active);
              const isExpanded = expandedServiceId === service.id;
              const isEditingLabel = editingLabelId === service.id;
              const serviceQuestions = questions.filter(q => q.topic_id === service.topic_id);
              const displayLabel = service.chat_label || service.name;

              return (
                <div
                  key={service.id}
                  className={`border rounded-lg overflow-hidden transition-all ${
                    isEnabled ? 'border-primary/40 bg-primary/5' : 'border-border'
                  }`}
                >
                  {/* Service Row */}
                  <div className="flex items-center justify-between p-4 gap-3">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <MessageSquare className={`w-5 h-5 shrink-0 ${isEnabled ? 'text-primary' : 'text-muted-foreground'}`} />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm">{service.name}</p>
                        {isEnabled && (
                          <div className="flex items-center gap-1 mt-0.5">
                            {isEditingLabel ? (
                              <div className="flex items-center gap-1">
                                <Input
                                  autoFocus
                                  value={labelDraft}
                                  onChange={e => setLabelDraft(e.target.value)}
                                  placeholder={`e.g. I want to build a website`}
                                  className="h-6 text-xs py-0 px-2"
                                  onKeyDown={e => e.key === 'Enter' && handleSaveLabel(service)}
                                />
                                <button onClick={() => handleSaveLabel(service)} className="text-green-500 hover:text-green-400">
                                  <Check className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ) : (
                              <>
                                <span className="text-xs text-muted-foreground truncate">
                                  Label: <span className="text-foreground/80">{displayLabel}</span>
                                </span>
                                <button
                                  onClick={() => { setEditingLabelId(service.id); setLabelDraft(service.chat_label || ''); }}
                                  className="text-muted-foreground hover:text-foreground ml-1"
                                >
                                  <Edit3 className="w-3 h-3" />
                                </button>
                              </>
                            )}
                          </div>
                        )}
                        {isEnabled && (
                          <p className="text-xs text-muted-foreground mt-0.5">{serviceQuestions.length} question{serviceQuestions.length !== 1 ? 's' : ''} configured</p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => handleToggle(service)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                          isEnabled
                            ? 'bg-primary/20 text-primary hover:bg-primary/30'
                            : 'bg-muted text-muted-foreground hover:bg-muted/80'
                        }`}
                      >
                        {isEnabled ? <ToggleRight className="w-3.5 h-3.5" /> : <ToggleLeft className="w-3.5 h-3.5" />}
                        {isEnabled ? 'On' : 'Off'}
                      </button>
                      {isEnabled && (
                        <button
                          onClick={() => setExpandedServiceId(isExpanded ? null : service.id)}
                          className="p-1 rounded hover:bg-muted transition-colors"
                        >
                          {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Expanded Questions Panel */}
                  {isEnabled && isExpanded && (
                    <div className="border-t border-border bg-card px-4 pb-4 pt-3 space-y-3">
                      <p className="text-sm font-medium">
                        Bot questions for <span className="text-primary">"{displayLabel}"</span>:
                      </p>
                      <p className="text-xs text-muted-foreground">The bot will ask these one by one after the user selects this topic.</p>

                      {serviceQuestions.length === 0 && (
                        <p className="text-xs text-muted-foreground italic py-2">No questions yet. Add 2–3 questions below.</p>
                      )}

                      <div className="space-y-2">
                        {serviceQuestions.map((q, index) => (
                          <div key={q.id} className="flex items-start gap-2 group">
                            <span className="text-xs text-muted-foreground mt-2 w-5 shrink-0">{index + 1}.</span>
                            <p className="flex-1 text-sm bg-muted rounded px-3 py-2">{q.question_text}</p>
                            <button
                              onClick={() => handleDeleteQuestion(q.id)}
                              className="opacity-0 group-hover:opacity-100 p-1 mt-1 text-red-500 hover:text-red-400 transition-opacity"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>

                      <form onSubmit={(e) => handleAddQuestion(e, service.topic_id!)} className="flex gap-2 mt-2">
                        <Input
                          placeholder="e.g. What is your expected timeline for this project?"
                          value={newQuestion}
                          onChange={e => setNewQuestion(e.target.value)}
                          className="text-sm"
                          required
                        />
                        <Button type="submit" size="sm" className="shrink-0">
                          <Plus className="w-4 h-4 mr-1" /> Add
                        </Button>
                      </form>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
