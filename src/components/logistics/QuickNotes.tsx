import React, { useRef, useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Share2, Trash2, Pencil, Plus, X, StickyNote, ChevronDown, Lock, Unlock, ShieldCheck } from 'lucide-react';
import { useQuickNotes, NoteData } from '@/hooks/useQuickNotes';
import { useSwipeGestures } from '@/hooks/useSwipeGestures';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useSecureNotes } from '@/hooks/useSecureNotes';

interface NoteItem {
    id: number;
    title: string;
    content: string;
    isSecure: boolean;
    createdAt: string;
}

interface NoteItemHeaderProps {
    note: NoteItem;
    onSelect: (note: NoteItem) => void;
    onToggleSecure: (id: number) => void;
    isSecureMode: boolean;
    onSecureToggle: () => void;
}

const NoteItemComponent: React.FC<NoteItemHeaderProps> = ({ note, onSelect, onToggleSecure, isSecureMode, onSecureToggle }) => {
    const itemRef = useRef<HTMLDivElement>(null);

    useSwipeGestures(
        {
            onSwipeRight: () => onToggleSecure(note.id),
        },
        { targetRef: itemRef, threshold: 50 }
    );

    return (
        <div
            ref={itemRef}
            className="bg-gradient-to-br from-amber-50 to-yellow-100 rounded-xl p-2 border border-amber-200 flex flex-col transition-transform active:scale-95 touch-pan-y"
        >
            {/* Note Icon & Title - Clickable for details */}
            <div
                onClick={() => {
                    if (note.isSecure && !isSecureMode) {
                        onSecureToggle();
                        return;
                    }
                    onSelect(note);
                }}
                className="flex items-center gap-2 cursor-pointer hover:bg-amber-100 rounded-lg p-1.5 -mx-1 transition-colors relative"
            >
                <div className="relative">
                    <StickyNote className={`w-6 h-6 shrink-0 ${note.isSecure ? 'text-indigo-600' : 'text-amber-600'}`} />
                    {note.isSecure && (
                        <div className="absolute -top-1 -left-1 bg-white rounded-full p-0.5 shadow-sm">
                            {isSecureMode ? <Unlock className="w-2.5 h-2.5 text-indigo-600" /> : <Lock className="w-2.5 h-2.5 text-gray-400" />}
                        </div>
                    )}
                </div>
                <p className={`text-xs font-medium line-clamp-2 leading-tight flex-1 ${note.isSecure && !isSecureMode ? 'filter blur-[1px] select-none text-gray-400' : 'text-gray-700'}`}>
                    {note.isSecure && !isSecureMode ? 'ملاحظة مؤمنة' : note.title}
                </p>
            </div>
        </div>
    );
};

export const QuickNotes = () => {
    const { notesHistory, saveNote, archiveNote, toggleSecure, deleteHistoryItem, restoreHistoryItem } = useQuickNotes();
    const { toast } = useToast();
    const [selectedNote, setSelectedNote] = useState<NoteItem | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [showAddNote, setShowAddNote] = useState(false);
    const [showAll, setShowAll] = useState(false);
    const [newNote, setNewNote] = useState({ title: '', content: '' });
    const [editNote, setEditNote] = useState({ title: '', content: '' });

    // Secure Notes Logic
    const { setPassword, verifyPassword, hasPassword, isVerifying } = useSecureNotes();
    const [isSecureMode, setIsSecureMode] = useState(false);
    const [showPasswordSetup, setShowPasswordSetup] = useState(false);
    const [showPasswordVerify, setShowPasswordVerify] = useState(false);
    const [passwordInput, setPasswordInput] = useState('');
    const [hasSecurePassword, setHasSecurePassword] = useState<boolean | null>(null);

    useEffect(() => {
        const checkPwd = async () => {
            const exists = await hasPassword();
            setHasSecurePassword(exists);
        };
        checkPwd();
    }, []);

    const handleSecureToggle = async () => {
        if (!isSecureMode) {
            if (!hasSecurePassword) {
                setShowPasswordSetup(true);
            } else {
                setShowPasswordVerify(true);
            }
        } else {
            setIsSecureMode(false);
        }
    };

    const handleSetupPassword = async () => {
        if (passwordInput.length < 4) {
            toast({ title: 'كلمة المرور يجب أن تكون 4 أرقام على الأقل', variant: 'destructive' });
            return;
        }
        const success = await setPassword(passwordInput);
        if (success) {
            setHasSecurePassword(true);
            setShowPasswordSetup(false);
            setIsSecureMode(true);
            setPasswordInput('');
        }
    };

    const handleVerifyPassword = async () => {
        const valid = await verifyPassword(passwordInput);
        if (valid) {
            setIsSecureMode(true);
            setShowPasswordVerify(false);
            setPasswordInput('');
        } else {
            toast({ title: 'كلمة المرور غير صحيحة', variant: 'destructive' });
        }
    };

    // Convert NoteData objects to NoteItem format
    const notes: NoteItem[] = notesHistory.map((note, idx) => {
        const lines = note.content.split('\n');
        return {
            id: idx,
            title: lines[0]?.substring(0, 30) || 'ملاحظة',
            content: note.content,
            isSecure: !!note.isSecure,
            createdAt: note.createdAt || new Date().toISOString()
        };
    });

    const displayedNotes = showAll ? notes : notes.slice(0, 6);

    const handleAddNote = () => {
        if (!newNote.content) {
            toast({ title: 'أدخل محتوى الملاحظة' });
            return;
        }
        const noteText = newNote.title ? `${newNote.title}\n${newNote.content}` : newNote.content;
        archiveNote(noteText, isSecureMode);
        setNewNote({ title: '', content: '' });
        setShowAddNote(false);
        toast({ title: 'تم حفظ الملاحظة ✓' });
    };

    const handleShare = async (note: NoteItem) => {
        if (note.isSecure && !isSecureMode) {
            handleSecureToggle();
            return;
        }
        if (navigator.share) {
            await navigator.share({ title: note.title, text: note.content });
        } else {
            await navigator.clipboard.writeText(note.content);
            toast({ title: 'تم النسخ' });
        }
    };

    const handleDelete = (idx: number) => {
        deleteHistoryItem(idx);
        setSelectedNote(null);
        toast({ title: 'تم الحذف' });
    };

    const handleShareAll = async () => {
        if (notes.length === 0) {
            toast({ title: 'لا توجد ملاحظات للمشاركة' });
            return;
        }

        let shareText = '📝 ملاحظاتي - تطبيق بركة\n';
        shareText += '━━━━━━━━━━━━━━━━━━━\n\n';

        notes.forEach((note, idx) => {
            if (note.isSecure && !isSecureMode) return;
            shareText += `📌 ${note.title}\n`;
            shareText += `${note.content}\n`;
            shareText += '\n─────────────────\n\n';
        });

        shareText += `\n✨ المجموع: ${notes.filter(n => !n.isSecure || isSecureMode).length} ملاحظة`;

        if (navigator.share) {
            try {
                await navigator.share({ title: 'ملاحظاتي', text: shareText });
            } catch (e) {
                await navigator.clipboard.writeText(shareText);
                toast({ title: 'تم نسخ جميع الملاحظات' });
            }
        } else {
            await navigator.clipboard.writeText(shareText);
            toast({ title: 'تم نسخ جميع الملاحظات' });
        }
    };

    return (
        <Card>
            <CardHeader className="pb-2">
                <CardTitle className="arabic-title text-base flex items-center justify-between">
                    <span className="flex items-center gap-2">📝 ملاحظات سريعة</span>
                    <div className="flex gap-1">
                        {notes.length > 0 && (
                            <Button
                                size="sm"
                                variant="outline"
                                className="h-8 gap-1"
                                onClick={handleShareAll}
                            >
                                <Share2 className="w-4 h-4" />
                            </Button>
                        )}
                        <Button
                            size="sm"
                            variant={isSecureMode ? "default" : "outline"}
                            className={`h-8 gap-1 ${isSecureMode ? 'bg-indigo-600 hover:bg-indigo-700 text-white' : ''}`}
                            onClick={handleSecureToggle}
                        >
                            {isSecureMode ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                            {isSecureMode ? 'وضع آمن' : 'تفعيل القفل'}
                        </Button>
                        <Button
                            size="sm"
                            className="h-8 gap-1 bg-emerald-600 hover:bg-emerald-700"
                            onClick={() => setShowAddNote(true)}
                        >
                            <Plus className="w-4 h-4" /> إضافة
                        </Button>
                    </div>
                </CardTitle>
                {notes.some(n => n.isSecure) && (
                    <p className="text-[10px] text-gray-500 text-right mt-1">💡 اسحب الملاحظة لليمين لقفلها/فتحها</p>
                )}
            </CardHeader>
            <CardContent>
                {/* 3x2 Icon Grid */}
                {notes.length > 0 ? (
                    <>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                            {displayedNotes.map((note, idx) => (
                                <NoteItemComponent
                                    key={idx}
                                    note={note}
                                    onSelect={setSelectedNote}
                                    onToggleSecure={toggleSecure}
                                    isSecureMode={isSecureMode}
                                    onSecureToggle={handleSecureToggle}
                                />
                            ))}
                        </div>

                        {/* Show All Button */}
                        {notes.length > 6 && !showAll && (
                            <Button
                                variant="ghost"
                                className="w-full mt-3 text-amber-600 hover:bg-amber-50"
                                onClick={() => setShowAll(true)}
                            >
                                <ChevronDown className="w-4 h-4 ml-1" />
                                عرض الكل ({notes.length})
                            </Button>
                        )}
                    </>
                ) : (
                    <div className="text-center py-8 text-gray-400">
                        <StickyNote className="w-12 h-12 mx-auto mb-2 opacity-50" />
                        <p>لا توجد ملاحظات محفوظة</p>
                    </div>
                )}

                {/* Note Detail Popup */}
                <Dialog open={!!selectedNote && !isEditing} onOpenChange={() => setSelectedNote(null)}>
                    <DialogContent className="max-w-md">
                        <DialogHeader>
                            <DialogTitle className="text-right">{selectedNote?.title}</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                            <div className="bg-gray-50 rounded-lg p-4 max-h-[300px] overflow-y-auto">
                                <p className="text-sm text-gray-700 whitespace-pre-wrap text-right">
                                    {selectedNote?.content}
                                </p>
                            </div>
                            <div className="flex justify-between gap-2">
                                <Button
                                    variant="outline"
                                    className="flex-1 gap-1"
                                    onClick={() => {
                                        if (selectedNote) {
                                            setEditNote({ title: selectedNote.title, content: selectedNote.content });
                                            setIsEditing(true);
                                        }
                                    }}
                                >
                                    <Pencil className="w-4 h-4" /> تعديل
                                </Button>
                                <Button
                                    variant="outline"
                                    className="flex-1 gap-1"
                                    onClick={() => selectedNote && handleShare(selectedNote)}
                                >
                                    <Share2 className="w-4 h-4" /> مشاركة
                                </Button>
                                <Button
                                    variant="outline"
                                    className="flex-1 gap-1 text-red-500 hover:text-red-600"
                                    onClick={() => selectedNote && handleDelete(selectedNote.id)}
                                >
                                    <Trash2 className="w-4 h-4" /> حذف
                                </Button>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>

                {/* Edit Dialog */}
                <Dialog open={isEditing} onOpenChange={() => setIsEditing(false)}>
                    <DialogContent className="max-w-md">
                        <DialogHeader>
                            <DialogTitle className="text-right">تعديل الملاحظة</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                            <Input
                                placeholder="العنوان (اختياري)"
                                value={editNote.title}
                                onChange={(e) => setEditNote({ ...editNote, title: e.target.value })}
                                className="text-right"
                            />
                            <Textarea
                                placeholder="محتوى الملاحظة..."
                                value={editNote.content}
                                onChange={(e) => setEditNote({ ...editNote, content: e.target.value })}
                                className="min-h-[150px] text-right"
                            />
                            <div className="flex gap-2">
                                <Button variant="outline" className="flex-1" onClick={() => setIsEditing(false)}>
                                    إلغاء
                                </Button>
                                <Button
                                    className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                                    onClick={() => {
                                        if (selectedNote) {
                                            deleteHistoryItem(selectedNote.id);
                                            const noteText = editNote.title ? `${editNote.title}\n${editNote.content}` : editNote.content;
                                            archiveNote(noteText, isSecureMode);
                                            setIsEditing(false);
                                            setSelectedNote(null);
                                            toast({ title: 'تم التعديل ✓' });
                                        }
                                    }}
                                >
                                    حفظ التعديلات
                                </Button>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>

                {/* Add Note Dialog */}
                <Dialog open={showAddNote} onOpenChange={setShowAddNote}>
                    <DialogContent className="max-w-md">
                        <DialogHeader>
                            <DialogTitle className="text-right">ملاحظة جديدة</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                            <Input
                                placeholder="العنوان (اختياري)"
                                value={newNote.title}
                                onChange={(e) => setNewNote({ ...newNote, title: e.target.value })}
                                className="text-right"
                            />
                            <Textarea
                                placeholder="اكتب ملاحظتك هنا..."
                                value={newNote.content}
                                onChange={(e) => setNewNote({ ...newNote, content: e.target.value })}
                                className="min-h-[150px] text-right"
                            />
                            <div className="flex gap-2">
                                <Button variant="outline" className="flex-1" onClick={() => setShowAddNote(false)}>
                                    إلغاء
                                </Button>
                                <Button className="flex-1 bg-emerald-600 hover:bg-emerald-700" onClick={handleAddNote}>
                                    <Plus className="w-4 h-4 ml-1" /> حفظ
                                </Button>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>

                {/* Password Setup Dialog */}
                <Dialog open={showPasswordSetup} onOpenChange={setShowPasswordSetup}>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle className="text-right flex items-center gap-2">
                                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                                إعداد كلمة مرور للملاحظات
                            </DialogTitle>
                        </DialogHeader>
                        <div className="py-4">
                            <p className="text-sm text-gray-500 mb-4 text-right">يرجى تعيين كلمة مرور لحماية ملاحظاتك السرية.</p>
                            <Input
                                type="password"
                                placeholder="كلمة المرور الجديدة"
                                value={passwordInput}
                                onChange={(e) => setPasswordInput(e.target.value)}
                                className="text-center text-lg tracking-widest"
                            />
                        </div>
                        <DialogFooter className="gap-2 sm:gap-0">
                            <Button variant="outline" onClick={() => setShowPasswordSetup(false)}>إلغاء</Button>
                            <Button onClick={handleSetupPassword} className="bg-emerald-600 transition-all hover:scale-105">حفظ كلمة المرور</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Password Verify Dialog */}
                <Dialog open={showPasswordVerify} onOpenChange={setShowPasswordVerify}>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle className="text-right flex items-center gap-2">
                                <Lock className="w-4 h-4 text-indigo-600" />
                                التحقق من الهوية
                            </DialogTitle>
                        </DialogHeader>
                        <div className="py-4">
                            <Input
                                type="password"
                                placeholder="أدخل كلمة المرور"
                                value={passwordInput}
                                onChange={(e) => setPasswordInput(e.target.value)}
                                className="text-center text-lg tracking-widest"
                                autoFocus
                                onKeyDown={(e) => e.key === 'Enter' && handleVerifyPassword()}
                            />
                        </div>
                        <DialogFooter>
                            <Button onClick={handleVerifyPassword} className="w-full bg-indigo-600" disabled={isVerifying}>
                                {isVerifying ? 'جاري التحقق...' : 'فتح القفل'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </CardContent>
        </Card>
    );
};
