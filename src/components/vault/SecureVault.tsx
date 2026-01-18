import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import {
    Shield, FileText, Key, Plus, Trash2, Eye, EyeOff, Copy,
    CreditCard, Car, BookOpen, IdCard, Calendar, AlertTriangle,
    Lock, Unlock, Search, ExternalLink
} from 'lucide-react';
import { format, differenceInDays, parseISO } from 'date-fns';
import { ar } from 'date-fns/locale';

// Interfaces
interface SecureDocument {
    id: string;
    type: 'passport' | 'residence' | 'license' | 'card' | 'id' | 'other';
    title: string;
    documentNumber?: string;
    issueDate?: string;
    expiryDate?: string;
    imageUrl?: string;
    notes?: string;
}

interface PasswordEntry {
    id: string;
    siteName: string;
    siteUrl?: string;
    username: string;
    password: string;
    category: 'social' | 'banking' | 'work' | 'shopping' | 'email' | 'other';
    notes?: string;
}

const DOCUMENT_TYPES = [
    { value: 'passport', label: 'جواز السفر', icon: BookOpen },
    { value: 'residence', label: 'الإقامة', icon: IdCard },
    { value: 'license', label: 'رخصة القيادة', icon: Car },
    { value: 'card', label: 'بطاقة', icon: CreditCard },
    { value: 'id', label: 'بطاقة هوية', icon: IdCard },
    { value: 'other', label: 'أخرى', icon: FileText }
];

const PASSWORD_CATEGORIES = [
    { value: 'social', label: 'شبكات اجتماعية' },
    { value: 'banking', label: 'بنوك ومالية' },
    { value: 'work', label: 'عمل' },
    { value: 'shopping', label: 'تسوق' },
    { value: 'email', label: 'بريد إلكتروني' },
    { value: 'other', label: 'أخرى' }
];

const SecureVault: React.FC = () => {
    const { toast } = useToast();
    const [isUnlocked, setIsUnlocked] = useState(false);
    const [pin, setPin] = useState('');
    const [savedPin, setSavedPin] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState('documents');
    const [searchQuery, setSearchQuery] = useState('');

    // Documents state
    const [documents, setDocuments] = useState<SecureDocument[]>([]);
    const [showDocDialog, setShowDocDialog] = useState(false);
    const [editingDoc, setEditingDoc] = useState<SecureDocument | null>(null);
    const [newDoc, setNewDoc] = useState<Partial<SecureDocument>>({ type: 'passport' });

    // Passwords state
    const [passwords, setPasswords] = useState<PasswordEntry[]>([]);
    const [showPassDialog, setShowPassDialog] = useState(false);
    const [editingPass, setEditingPass] = useState<PasswordEntry | null>(null);
    const [newPass, setNewPass] = useState<Partial<PasswordEntry>>({ category: 'other' });
    const [visiblePasswords, setVisiblePasswords] = useState<Set<string>>(new Set());

    // Load saved PIN
    useEffect(() => {
        const stored = localStorage.getItem('baraka_vault_pin');
        setSavedPin(stored);
        if (!stored) setIsUnlocked(true); // First time, no PIN set
    }, []);

    // Load data when unlocked
    useEffect(() => {
        if (isUnlocked) {
            loadDocuments();
            loadPasswords();
        }
    }, [isUnlocked]);

    const loadDocuments = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data } = await supabase
                    .from('secure_documents')
                    .select('*')
                    .eq('user_id', user.id)
                    .order('created_at', { ascending: false });
                if (data) {
                    setDocuments(data.map(d => ({
                        id: d.id,
                        type: d.type,
                        title: d.title,
                        documentNumber: d.document_number,
                        issueDate: d.issue_date,
                        expiryDate: d.expiry_date,
                        imageUrl: d.image_url,
                        notes: d.notes
                    })));
                    localStorage.setItem('baraka_documents', JSON.stringify(data));
                }
            } else {
                const saved = localStorage.getItem('baraka_documents');
                if (saved) setDocuments(JSON.parse(saved));
            }
        } catch {
            const saved = localStorage.getItem('baraka_documents');
            if (saved) setDocuments(JSON.parse(saved));
        }
    };

    const loadPasswords = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data } = await supabase
                    .from('password_entries')
                    .select('*')
                    .eq('user_id', user.id)
                    .order('created_at', { ascending: false });
                if (data) {
                    setPasswords(data.map(p => ({
                        id: p.id,
                        siteName: p.site_name,
                        siteUrl: p.site_url,
                        username: p.username,
                        password: atob(p.password_encrypted), // Simple decode
                        category: p.category,
                        notes: p.notes
                    })));
                    localStorage.setItem('baraka_passwords', JSON.stringify(data));
                }
            } else {
                const saved = localStorage.getItem('baraka_passwords');
                if (saved) setPasswords(JSON.parse(saved));
            }
        } catch {
            const saved = localStorage.getItem('baraka_passwords');
            if (saved) setPasswords(JSON.parse(saved));
        }
    };

    const handleUnlock = () => {
        if (pin === savedPin) {
            setIsUnlocked(true);
            setPin('');
            toast({ title: 'تم فتح الخزنة ✅' });
        } else {
            toast({ title: 'رمز PIN غير صحيح', variant: 'destructive' });
        }
    };

    const handleSetPin = () => {
        if (pin.length >= 4) {
            localStorage.setItem('baraka_vault_pin', pin);
            setSavedPin(pin);
            setPin('');
            toast({ title: 'تم حفظ رمز PIN ✅' });
        } else {
            toast({ title: 'يجب أن يكون PIN 4 أرقام على الأقل', variant: 'destructive' });
        }
    };

    const handleLock = () => {
        setIsUnlocked(false);
        setPin('');
    };

    // Document CRUD
    const saveDocument = async () => {
        const doc: SecureDocument = {
            id: editingDoc?.id || crypto.randomUUID(),
            type: newDoc.type as any || 'other',
            title: newDoc.title || '',
            documentNumber: newDoc.documentNumber,
            issueDate: newDoc.issueDate,
            expiryDate: newDoc.expiryDate,
            imageUrl: newDoc.imageUrl,
            notes: newDoc.notes
        };

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                if (editingDoc) {
                    await supabase.from('secure_documents').update({
                        type: doc.type,
                        title: doc.title,
                        document_number: doc.documentNumber,
                        issue_date: doc.issueDate,
                        expiry_date: doc.expiryDate,
                        image_url: doc.imageUrl,
                        notes: doc.notes
                    }).eq('id', doc.id);
                } else {
                    await supabase.from('secure_documents').insert({
                        id: doc.id,
                        user_id: user.id,
                        type: doc.type,
                        title: doc.title,
                        document_number: doc.documentNumber,
                        issue_date: doc.issueDate,
                        expiry_date: doc.expiryDate,
                        image_url: doc.imageUrl,
                        notes: doc.notes
                    });
                }
            }
        } catch (e) {
            console.error(e);
        }

        if (editingDoc) {
            setDocuments(prev => prev.map(d => d.id === doc.id ? doc : d));
        } else {
            setDocuments(prev => [doc, ...prev]);
        }
        localStorage.setItem('baraka_documents', JSON.stringify(
            editingDoc ? documents.map(d => d.id === doc.id ? doc : d) : [doc, ...documents]
        ));

        setShowDocDialog(false);
        setEditingDoc(null);
        setNewDoc({ type: 'passport' });
        toast({ title: editingDoc ? 'تم تحديث المستند ✅' : 'تمت إضافة المستند ✅' });
    };

    const deleteDocument = async (id: string) => {
        try {
            await supabase.from('secure_documents').delete().eq('id', id);
        } catch { }
        setDocuments(prev => prev.filter(d => d.id !== id));
        localStorage.setItem('baraka_documents', JSON.stringify(documents.filter(d => d.id !== id)));
        toast({ title: 'تم حذف المستند' });
    };

    // Password CRUD
    const savePassword = async () => {
        const pass: PasswordEntry = {
            id: editingPass?.id || crypto.randomUUID(),
            siteName: newPass.siteName || '',
            siteUrl: newPass.siteUrl,
            username: newPass.username || '',
            password: newPass.password || '',
            category: newPass.category as any || 'other',
            notes: newPass.notes
        };

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                if (editingPass) {
                    await supabase.from('password_entries').update({
                        site_name: pass.siteName,
                        site_url: pass.siteUrl,
                        username: pass.username,
                        password_encrypted: btoa(pass.password),
                        category: pass.category,
                        notes: pass.notes
                    }).eq('id', pass.id);
                } else {
                    await supabase.from('password_entries').insert({
                        id: pass.id,
                        user_id: user.id,
                        site_name: pass.siteName,
                        site_url: pass.siteUrl,
                        username: pass.username,
                        password_encrypted: btoa(pass.password),
                        category: pass.category,
                        notes: pass.notes
                    });
                }
            }
        } catch (e) {
            console.error(e);
        }

        if (editingPass) {
            setPasswords(prev => prev.map(p => p.id === pass.id ? pass : p));
        } else {
            setPasswords(prev => [pass, ...prev]);
        }
        localStorage.setItem('baraka_passwords', JSON.stringify(
            editingPass ? passwords.map(p => p.id === pass.id ? pass : p) : [pass, ...passwords]
        ));

        setShowPassDialog(false);
        setEditingPass(null);
        setNewPass({ category: 'other' });
        toast({ title: editingPass ? 'تم تحديث كلمة السر ✅' : 'تمت إضافة كلمة السر ✅' });
    };

    const deletePassword = async (id: string) => {
        try {
            await supabase.from('password_entries').delete().eq('id', id);
        } catch { }
        setPasswords(prev => prev.filter(p => p.id !== id));
        localStorage.setItem('baraka_passwords', JSON.stringify(passwords.filter(p => p.id !== id)));
        toast({ title: 'تم حذف كلمة السر' });
    };

    const copyToClipboard = (text: string, label: string) => {
        navigator.clipboard.writeText(text);
        toast({ title: `تم نسخ ${label} ✅` });
    };

    const togglePasswordVisibility = (id: string) => {
        setVisiblePasswords(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const getExpiryStatus = (expiryDate?: string) => {
        if (!expiryDate) return null;
        const days = differenceInDays(parseISO(expiryDate), new Date());
        if (days < 0) return { color: 'text-red-500', label: 'منتهي الصلاحية' };
        if (days <= 30) return { color: 'text-orange-500', label: `ينتهي خلال ${days} يوم` };
        if (days <= 90) return { color: 'text-yellow-500', label: `ينتهي خلال ${days} يوم` };
        return { color: 'text-green-500', label: 'ساري' };
    };

    const filteredDocs = documents.filter(d =>
        d.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.documentNumber?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const filteredPasswords = passwords.filter(p =>
        p.siteName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.username.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Lock Screen
    if (!isUnlocked && savedPin) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 flex items-center justify-center p-4">
                <Card className="w-full max-w-sm bg-slate-800/50 border-slate-700">
                    <CardHeader className="text-center">
                        <Shield className="w-16 h-16 mx-auto text-emerald-400 mb-4" />
                        <CardTitle className="text-white text-xl">الخزنة الآمنة</CardTitle>
                        <p className="text-slate-400 text-sm">أدخل رمز PIN للفتح</p>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Input
                            type="password"
                            placeholder="••••"
                            value={pin}
                            onChange={e => setPin(e.target.value)}
                            className="text-center text-2xl tracking-widest bg-slate-700 border-slate-600 text-white"
                            maxLength={8}
                            onKeyDown={e => e.key === 'Enter' && handleUnlock()}
                        />
                        <Button onClick={handleUnlock} className="w-full bg-emerald-600 hover:bg-emerald-700">
                            <Unlock className="w-4 h-4 ml-2" />
                            فتح
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 p-4 pb-24">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <Shield className="w-8 h-8 text-emerald-400" />
                    <h1 className="text-2xl font-bold text-white">الخزنة الآمنة</h1>
                </div>
                <div className="flex gap-2">
                    {savedPin ? (
                        <Button variant="outline" size="sm" onClick={handleLock} className="border-slate-600 text-slate-300">
                            <Lock className="w-4 h-4" />
                        </Button>
                    ) : (
                        <div className="flex gap-2">
                            <Input
                                type="password"
                                placeholder="تعيين PIN"
                                value={pin}
                                onChange={e => setPin(e.target.value)}
                                className="w-24 bg-slate-700 border-slate-600 text-white text-sm"
                                maxLength={8}
                            />
                            <Button size="sm" onClick={handleSetPin} className="bg-emerald-600">
                                حفظ
                            </Button>
                        </div>
                    )}
                </div>
            </div>

            {/* Search */}
            <div className="relative mb-4">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                    placeholder="بحث..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="pr-10 bg-slate-800 border-slate-700 text-white"
                />
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
                <TabsList className="w-full bg-slate-800 border border-slate-700">
                    <TabsTrigger value="documents" className="flex-1 data-[state=active]:bg-emerald-600">
                        <FileText className="w-4 h-4 ml-2" />
                        المستندات
                    </TabsTrigger>
                    <TabsTrigger value="passwords" className="flex-1 data-[state=active]:bg-emerald-600">
                        <Key className="w-4 h-4 ml-2" />
                        كلمات السر
                    </TabsTrigger>
                </TabsList>

                {/* Documents Tab */}
                <TabsContent value="documents" className="space-y-4">
                    <Button
                        onClick={() => { setEditingDoc(null); setNewDoc({ type: 'passport' }); setShowDocDialog(true); }}
                        className="w-full bg-emerald-600 hover:bg-emerald-700"
                    >
                        <Plus className="w-4 h-4 ml-2" />
                        إضافة مستند
                    </Button>

                    {filteredDocs.length === 0 ? (
                        <Card className="bg-slate-800/50 border-slate-700">
                            <CardContent className="py-12 text-center text-slate-400">
                                <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                <p>لا توجد مستندات محفوظة</p>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="space-y-3">
                            {filteredDocs.map(doc => {
                                const DocIcon = DOCUMENT_TYPES.find(t => t.value === doc.type)?.icon || FileText;
                                const expiry = getExpiryStatus(doc.expiryDate);
                                return (
                                    <Card key={doc.id} className="bg-slate-800/50 border-slate-700">
                                        <CardContent className="p-4">
                                            <div className="flex items-start justify-between">
                                                <div className="flex items-start gap-3">
                                                    <div className="p-2 rounded-lg bg-slate-700">
                                                        <DocIcon className="w-5 h-5 text-emerald-400" />
                                                    </div>
                                                    <div>
                                                        <h3 className="font-semibold text-white">{doc.title}</h3>
                                                        {doc.documentNumber && (
                                                            <p className="text-sm text-slate-400">{doc.documentNumber}</p>
                                                        )}
                                                        {expiry && (
                                                            <div className={`flex items-center gap-1 text-xs mt-1 ${expiry.color}`}>
                                                                {expiry.color.includes('red') && <AlertTriangle className="w-3 h-3" />}
                                                                <Calendar className="w-3 h-3" />
                                                                <span>{expiry.label}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="flex gap-1">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => { setEditingDoc(doc); setNewDoc(doc); setShowDocDialog(true); }}
                                                        className="text-slate-400 hover:text-white"
                                                    >
                                                        تعديل
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => deleteDocument(doc.id)}
                                                        className="text-red-400 hover:text-red-300"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                );
                            })}
                        </div>
                    )}
                </TabsContent>

                {/* Passwords Tab */}
                <TabsContent value="passwords" className="space-y-4">
                    <Button
                        onClick={() => { setEditingPass(null); setNewPass({ category: 'other' }); setShowPassDialog(true); }}
                        className="w-full bg-emerald-600 hover:bg-emerald-700"
                    >
                        <Plus className="w-4 h-4 ml-2" />
                        إضافة كلمة سر
                    </Button>

                    {filteredPasswords.length === 0 ? (
                        <Card className="bg-slate-800/50 border-slate-700">
                            <CardContent className="py-12 text-center text-slate-400">
                                <Key className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                <p>لا توجد كلمات سر محفوظة</p>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="space-y-3">
                            {filteredPasswords.map(pass => (
                                <Card key={pass.id} className="bg-slate-800/50 border-slate-700">
                                    <CardContent className="p-4">
                                        <div className="flex items-start justify-between mb-3">
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <h3 className="font-semibold text-white">{pass.siteName}</h3>
                                                    {pass.siteUrl && (
                                                        <a href={pass.siteUrl} target="_blank" rel="noopener noreferrer">
                                                            <ExternalLink className="w-3 h-3 text-slate-400 hover:text-emerald-400" />
                                                        </a>
                                                    )}
                                                </div>
                                                <p className="text-sm text-slate-400">
                                                    {PASSWORD_CATEGORIES.find(c => c.value === pass.category)?.label}
                                                </p>
                                            </div>
                                            <div className="flex gap-1">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => { setEditingPass(pass); setNewPass(pass); setShowPassDialog(true); }}
                                                    className="text-slate-400 hover:text-white"
                                                >
                                                    تعديل
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => deletePassword(pass.id)}
                                                    className="text-red-400 hover:text-red-300"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </div>
                                        <div className="space-y-2 text-sm">
                                            <div className="flex items-center justify-between bg-slate-700/50 rounded p-2">
                                                <span className="text-slate-400">المستخدم:</span>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-white">{pass.username}</span>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => copyToClipboard(pass.username, 'اسم المستخدم')}
                                                        className="h-6 w-6 p-0 text-slate-400"
                                                    >
                                                        <Copy className="w-3 h-3" />
                                                    </Button>
                                                </div>
                                            </div>
                                            <div className="flex items-center justify-between bg-slate-700/50 rounded p-2">
                                                <span className="text-slate-400">كلمة السر:</span>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-white font-mono">
                                                        {visiblePasswords.has(pass.id) ? pass.password : '••••••••'}
                                                    </span>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => togglePasswordVisibility(pass.id)}
                                                        className="h-6 w-6 p-0 text-slate-400"
                                                    >
                                                        {visiblePasswords.has(pass.id) ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => copyToClipboard(pass.password, 'كلمة السر')}
                                                        className="h-6 w-6 p-0 text-slate-400"
                                                    >
                                                        <Copy className="w-3 h-3" />
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </TabsContent>
            </Tabs>

            {/* Document Dialog */}
            <Dialog open={showDocDialog} onOpenChange={setShowDocDialog}>
                <DialogContent className="bg-slate-800 border-slate-700 text-white max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{editingDoc ? 'تعديل المستند' : 'إضافة مستند جديد'}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>نوع المستند</Label>
                            <Select value={newDoc.type} onValueChange={v => setNewDoc(prev => ({ ...prev, type: v as any }))}>
                                <SelectTrigger className="bg-slate-700 border-slate-600">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-slate-700 border-slate-600">
                                    {DOCUMENT_TYPES.map(t => (
                                        <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>العنوان *</Label>
                            <Input
                                value={newDoc.title || ''}
                                onChange={e => setNewDoc(prev => ({ ...prev, title: e.target.value }))}
                                className="bg-slate-700 border-slate-600"
                                placeholder="مثال: جواز السفر السوري"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>رقم المستند</Label>
                            <Input
                                value={newDoc.documentNumber || ''}
                                onChange={e => setNewDoc(prev => ({ ...prev, documentNumber: e.target.value }))}
                                className="bg-slate-700 border-slate-600"
                                placeholder="رقم الجواز أو البطاقة"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>تاريخ الإصدار</Label>
                                <Input
                                    type="date"
                                    value={newDoc.issueDate || ''}
                                    onChange={e => setNewDoc(prev => ({ ...prev, issueDate: e.target.value }))}
                                    className="bg-slate-700 border-slate-600"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>تاريخ الانتهاء</Label>
                                <Input
                                    type="date"
                                    value={newDoc.expiryDate || ''}
                                    onChange={e => setNewDoc(prev => ({ ...prev, expiryDate: e.target.value }))}
                                    className="bg-slate-700 border-slate-600"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>ملاحظات</Label>
                            <Input
                                value={newDoc.notes || ''}
                                onChange={e => setNewDoc(prev => ({ ...prev, notes: e.target.value }))}
                                className="bg-slate-700 border-slate-600"
                                placeholder="ملاحظات إضافية..."
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowDocDialog(false)} className="border-slate-600">
                            إلغاء
                        </Button>
                        <Button onClick={saveDocument} className="bg-emerald-600 hover:bg-emerald-700" disabled={!newDoc.title}>
                            {editingDoc ? 'تحديث' : 'حفظ'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Password Dialog */}
            <Dialog open={showPassDialog} onOpenChange={setShowPassDialog}>
                <DialogContent className="bg-slate-800 border-slate-700 text-white max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{editingPass ? 'تعديل كلمة السر' : 'إضافة كلمة سر جديدة'}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>اسم الموقع *</Label>
                            <Input
                                value={newPass.siteName || ''}
                                onChange={e => setNewPass(prev => ({ ...prev, siteName: e.target.value }))}
                                className="bg-slate-700 border-slate-600"
                                placeholder="مثال: Facebook"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>رابط الموقع</Label>
                            <Input
                                value={newPass.siteUrl || ''}
                                onChange={e => setNewPass(prev => ({ ...prev, siteUrl: e.target.value }))}
                                className="bg-slate-700 border-slate-600"
                                placeholder="https://..."
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>التصنيف</Label>
                            <Select value={newPass.category} onValueChange={v => setNewPass(prev => ({ ...prev, category: v as any }))}>
                                <SelectTrigger className="bg-slate-700 border-slate-600">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-slate-700 border-slate-600">
                                    {PASSWORD_CATEGORIES.map(c => (
                                        <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>اسم المستخدم *</Label>
                            <Input
                                value={newPass.username || ''}
                                onChange={e => setNewPass(prev => ({ ...prev, username: e.target.value }))}
                                className="bg-slate-700 border-slate-600"
                                placeholder="البريد أو اسم المستخدم"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>كلمة السر *</Label>
                            <Input
                                type="password"
                                value={newPass.password || ''}
                                onChange={e => setNewPass(prev => ({ ...prev, password: e.target.value }))}
                                className="bg-slate-700 border-slate-600"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>ملاحظات</Label>
                            <Input
                                value={newPass.notes || ''}
                                onChange={e => setNewPass(prev => ({ ...prev, notes: e.target.value }))}
                                className="bg-slate-700 border-slate-600"
                                placeholder="ملاحظات إضافية..."
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowPassDialog(false)} className="border-slate-600">
                            إلغاء
                        </Button>
                        <Button
                            onClick={savePassword}
                            className="bg-emerald-600 hover:bg-emerald-700"
                            disabled={!newPass.siteName || !newPass.username || !newPass.password}
                        >
                            {editingPass ? 'تحديث' : 'حفظ'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default SecureVault;
