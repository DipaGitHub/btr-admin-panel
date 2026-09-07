import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Label } from "../components/ui/label";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { Save, Loader2, Mail } from 'lucide-react';
import { useToast } from "../components/ui/use-toast";
import { API_BASE_URL } from '@/config/api';
import AdminLayout from '../components/layout/AdminLayout';

export default function EmailConfig() {
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    
    const [formData, setFormData] = useState({
        host: '',
        port: 465,
        username: '',
        password: '',
        receive_emails_at: ''
    });

    useEffect(() => {
        const fetchConfig = async () => {
            try {
                const res = await fetch(`${API_BASE_URL}/email-config`);
                const json = await res.json();
                if (json.data && Object.keys(json.data).length > 0) {
                    setFormData({
                        host: json.data.host || '',
                        port: json.data.port || 465,
                        username: json.data.username || '',
                        password: json.data.password || '',
                        receive_emails_at: json.data.receive_emails_at || ''
                    });
                }
            } catch (err) {
                console.error("Failed to fetch email config", err);
                toast({ title: "Error", description: "Failed to load email config.", variant: "destructive" });
            } finally {
                setIsLoading(false);
            }
        };
        fetchConfig();
    }, [toast]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            const res = await fetch(`${API_BASE_URL}/email-config`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            const json = await res.json();
            if (res.ok) {
                toast({ title: "Success", description: "Email configuration saved." });
            } else {
                throw new Error(json.error || 'Failed to save');
            }
        } catch (err: any) {
            console.error("Failed to save email config", err);
            toast({ title: "Error", description: err.message, variant: "destructive" });
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <AdminLayout>
                <div className="flex h-[200px] w-full items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout>
            <div className="space-y-6">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Email Configuration</h2>
                <p className="text-muted-foreground">Manage SMTP settings and notification receiver addresses.</p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Mail className="w-5 h-5"/> SMTP Settings</CardTitle>
                    <CardDescription>
                        Configure your SMTP server to send emails to clients and yourself. 
                        If not configured, the system will fall back to using <b>info@btrcommunication.com</b> as the receiver (but emails won't be sent without valid SMTP).
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSave} className="space-y-4 max-w-2xl">
                        
                        <div className="space-y-2 pt-2">
                            <Label htmlFor="receive_emails_at">Receive Lead Notifications At</Label>
                            <Input 
                                id="receive_emails_at"
                                type="email"
                                placeholder="admin@example.com (Fallback: info@btrcommunication.com)"
                                value={formData.receive_emails_at}
                                onChange={(e) => setFormData(prev => ({ ...prev, receive_emails_at: e.target.value }))}
                            />
                            <p className="text-xs text-muted-foreground">Where should contact form and chat leads be sent?</p>
                        </div>
                        
                        <div className="border-t pt-4 mt-6">
                            <h3 className="font-semibold mb-4 text-sm uppercase text-muted-foreground tracking-wider">Outgoing Server (SMTP)</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="host">Host</Label>
                                    <Input 
                                        id="host"
                                        placeholder="smtp.example.com"
                                        value={formData.host}
                                        onChange={(e) => setFormData(prev => ({ ...prev, host: e.target.value }))}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="port">Port</Label>
                                    <Input 
                                        id="port"
                                        type="number"
                                        placeholder="465"
                                        value={formData.port}
                                        onChange={(e) => setFormData(prev => ({ ...prev, port: parseInt(e.target.value) || 465 }))}
                                    />
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                                <div className="space-y-2">
                                    <Label htmlFor="username">SMTP Username</Label>
                                    <Input 
                                        id="username"
                                        placeholder="user@example.com"
                                        value={formData.username}
                                        onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="password">SMTP Password</Label>
                                    <Input 
                                        id="password"
                                        type="password"
                                        placeholder="••••••••"
                                        value={formData.password}
                                        onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="pt-4">
                            <Button type="submit" disabled={isSaving}>
                                {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                                Save Configuration
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
        </AdminLayout>
    );
}
