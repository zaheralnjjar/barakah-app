
import { useState, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Save, Palette, Type, FileDown, Upload, Eye } from 'lucide-react';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { ThesisService } from '@/services/thesis/ThesisService';
import type { ThesisSettings } from '@/types/thesis';
import { DocxGenerator } from '@/services/thesis/DocxGenerator';
import { saveAs } from 'file-saver';

export default function ThesisSettings() {
    const [searchParams] = useSearchParams();
    const projectId = searchParams.get('project');
    const navigate = useNavigate();

    // Initial State Definition
    const [settings, setSettings] = useState<ThesisSettings>({
        formatting: {
            headings: { fontFamily: "Traditional Arabic", fontSize: 18, color: "#000000", isBold: true, alignment: 'right' },
            body: { fontFamily: "Traditional Arabic", fontSize: 16, color: "#000000", isBold: false, alignment: 'justify' },
            bodyLatin: { fontFamily: "Times New Roman", fontSize: 14, color: "#000000", isBold: false, alignment: 'justify' },
            footnotes: { fontFamily: "Traditional Arabic", fontSize: 12, color: "#333333", isBold: false, alignment: 'right' },
            page: { margins: { top: 2.54, bottom: 2.54, right: 3.17, left: 3.17 }, pageNumbering: true }
        },
        autoSave: true
    });
    const [loading, setLoading] = useState(true);

    // Form Section Component
    const FormattingSection = ({ title, section, onChange }: { title: string, section: any, onChange: (s: any) => void }) => (
        <div className="space-y-4 p-4 border rounded-lg bg-card/50">
            <h3 className="font-semibold text-lg border-b pb-2">{title}</h3>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-2">
                    <Label>نوع الخط</Label>
                    <Select value={section.fontFamily} onValueChange={(v) => onChange({ ...section, fontFamily: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="Traditional Arabic">Traditional Arabic</SelectItem>
                            <SelectItem value="Sakkal Majalla">Sakkal Majalla</SelectItem>
                            <SelectItem value="Amiri">Amiri</SelectItem>
                            <SelectItem value="Arial">Arial</SelectItem>
                            <SelectItem value="Times New Roman">Times New Roman</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label>الحجم (pt)</Label>
                    <Select value={String(section.fontSize)} onValueChange={(v) => onChange({ ...section, fontSize: parseInt(v) })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                            {[10, 12, 14, 16, 18, 20, 22, 24].map(s => <SelectItem key={s} value={String(s)}>{s}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label>المحاذاة</Label>
                    <Select value={section.alignment} onValueChange={(v) => onChange({ ...section, alignment: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="right">يمين</SelectItem>
                            <SelectItem value="center">توسط</SelectItem>
                            <SelectItem value="left">يسار</SelectItem>
                            <SelectItem value="justify">ضبط</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="flex items-center gap-4 pt-8">
                    <div className="flex items-center gap-2">
                        <Label>غامق</Label>
                        <Switch checked={section.isBold} onCheckedChange={(v) => onChange({ ...section, isBold: v })} />
                    </div>
                </div>
            </div>
            {/* Color Picker Simulation */}
            <div className="space-y-2">
                <Label>اللون</Label>
                <div className="flex gap-2">
                    {['#000000', '#333333', '#0000FF', '#FF0000', '#008000'].map(c => (
                        <div
                            key={c}
                            className={`w-8 h-8 rounded-full cursor-pointer border-2 ${section.color === c ? 'border-primary' : 'border-transparent'}`}
                            style={{ backgroundColor: c }}
                            onClick={() => onChange({ ...section, color: c })}
                        />
                    ))}
                </div>
            </div>
        </div>
    );

    // Load initial settings
    useState(() => {
        if (projectId) {
            ThesisService.getProjects().then(projects => {
                const p = projects.find(p => p.id === projectId);
                if (p && p.settings) {
                    // Merge existing settings with defaults to ensure structure exists
                    setSettings(prev => ({
                        ...prev,
                        ...p.settings,
                        formatting: { ...prev.formatting, ...(p.settings.formatting || {}) } // Deep merge formatting
                    }));
                }
                setLoading(false);
            });
        }
    });

    async function handleSave() {
        if (!projectId) return;
        try {
            await ThesisService.updateProject(projectId, {
                settings: settings
            });
            toast.success("تم حفظ الإعدادات بنجاح");
        } catch (e) {
            console.log(e);
            toast.error("فشل حفظ الإعدادات");
        }
    }

    // Generate Preview Document
    async function handlePreviewDocument() {
        try {
            toast.info("جاري إنشاء ملف المعاينة...");

            // Create a sample project and structure for preview
            const previewProject = {
                id: 'preview',
                name: 'ملف معاينة التنسيقات',
                user_id: '',
                settings: settings
            };

            const previewStructure = [
                {
                    id: '1',
                    project_id: 'preview',
                    type: 'chapter' as const,
                    title: 'الفصل الأول: عنوان تجريبي',
                    children: [
                        {
                            id: '1.1',
                            project_id: 'preview',
                            type: 'section' as const,
                            title: 'المبحث الأول: عنوان المبحث',
                            children: []
                        }
                    ]
                }
            ];

            const blob = await DocxGenerator.generateMasterDoc(previewProject, previewStructure);
            saveAs(blob, `معاينة_التنسيقات_${new Date().toLocaleDateString('ar-SA')}.docx`);
            toast.success("تم إنشاء ملف المعاينة ✓");
        } catch (e) {
            console.error(e);
            toast.error("فشل إنشاء ملف المعاينة");
        }
    }

    // Import settings from DOCX file (basic extraction)
    const fileInputRef = useRef<HTMLInputElement>(null);

    async function handleImportFromDocx(event: React.ChangeEvent<HTMLInputElement>) {
        const file = event.target.files?.[0];
        if (!file) return;

        try {
            toast.info("جاري تحليل الملف...");

            // Use JSZip to extract docx content
            const JSZip = (await import('jszip')).default;
            const zip = await JSZip.loadAsync(file);

            // Read styles.xml from docx
            const stylesXml = await zip.file('word/styles.xml')?.async('string');
            if (!stylesXml) {
                toast.error("لم يتم العثور على ملف الأنماط");
                return;
            }

            // Parse XML
            const parser = new DOMParser();
            const doc = parser.parseFromString(stylesXml, 'text/xml');

            // Extract font and size from Normal style
            const normalStyle = doc.querySelector('style[w\\:styleId="Normal"], style[styleId="Normal"]');
            let extractedFont = 'Traditional Arabic';
            let extractedSize = 16;

            // Try to find font info
            const fontElements = doc.querySelectorAll('rFonts');
            if (fontElements.length > 0) {
                const cs = fontElements[0].getAttribute('w:cs') || fontElements[0].getAttribute('cs');
                if (cs) extractedFont = cs;
            }

            // Try to find size
            const sizeElements = doc.querySelectorAll('sz');
            if (sizeElements.length > 0) {
                const val = sizeElements[0].getAttribute('w:val') || sizeElements[0].getAttribute('val');
                if (val) extractedSize = parseInt(val) / 2; // Convert half-points to points
            }

            // Update settings with extracted values
            setSettings(prev => ({
                ...prev,
                formatting: {
                    ...prev.formatting!,
                    body: {
                        ...prev.formatting!.body,
                        fontFamily: extractedFont,
                        fontSize: extractedSize
                    }
                }
            }));

            toast.success(`تم استخراج: خط ${extractedFont}، حجم ${extractedSize}`);

        } catch (e) {
            console.error(e);
            toast.error("فشل تحليل الملف - قد لا يكون ملف Word صالح");
        }

        // Reset file input
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    }


    if (loading) return <div className="p-8 text-center pt-20">جاري التحميل...</div>;
    if (!projectId) return <div className="p-8 text-center">يرجى اختيار مشروع</div>;

    return (
        <div className="min-h-screen bg-background text-foreground p-6" dir="rtl">
            <div className="max-w-4xl mx-auto space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <Button variant="ghost" className="mb-2 gap-2" onClick={() => navigate(`/thesis/dashboard?project=${projectId}`)}>
                            <ArrowLeft className="w-4 h-4" /> العودة
                        </Button>
                        <h1 className="text-3xl font-bold">إعدادات المشروع</h1>
                        <p className="text-muted-foreground">تخصيص المظهر، الطباعة، والتكامل</p>
                    </div>
                </div>

                <div className="grid gap-6">
                    <Card>
                        <CardHeader>
                            <div className="flex items-center gap-2">
                                <Palette className="w-5 h-5 text-primary" />
                                <CardTitle>تخصيص التنسيق (Word)</CardTitle>
                            </div>
                            <CardDescription>إعدادات الخطوط والألوان والهوامش للملفات المُصدرة</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <FormattingSection
                                title="العناوين الرئيسية (Headings)"
                                section={settings.formatting?.headings}
                                onChange={(s) => setSettings(prev => ({ ...prev, formatting: { ...prev.formatting!, headings: s } }))}
                            />
                            <FormattingSection
                                title="النص الرئيسي (Body)"
                                section={settings.formatting?.body}
                                onChange={(s) => setSettings(prev => ({ ...prev, formatting: { ...prev.formatting!, body: s } }))}
                            />
                            <FormattingSection
                                title="النص الأجنبي (Latin/Foreign)"
                                section={settings.formatting?.bodyLatin}
                                onChange={(s) => setSettings(prev => ({ ...prev, formatting: { ...prev.formatting!, bodyLatin: s } }))}
                            />
                            <FormattingSection
                                title="الحواشي (Footnotes)"
                                section={settings.formatting?.footnotes}
                                onChange={(s) => setSettings(prev => ({ ...prev, formatting: { ...prev.formatting!, footnotes: s } }))}
                            />

                            <div className="space-y-4 p-4 border rounded-lg bg-card/50">
                                <h3 className="font-semibold text-lg border-b pb-2">إعدادات الصفحة</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="flex items-center justify-between">
                                        <Label>ترقيم الصفحات</Label>
                                        <Switch
                                            checked={settings.formatting?.page.pageNumbering}
                                            onCheckedChange={(v) => setSettings(prev => ({ ...prev, formatting: { ...prev.formatting!, page: { ...prev.formatting!.page, pageNumbering: v } } }))}
                                        />
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Label>الهامش (سم)</Label>
                                        <Input
                                            type="number"
                                            value={settings.formatting?.page.margins.top}
                                            onChange={(e) => {
                                                const val = parseFloat(e.target.value);
                                                setSettings(prev => ({ ...prev, formatting: { ...prev.formatting!, page: { ...prev.formatting!.page, margins: { ...prev.formatting!.page.margins, top: val, bottom: val, left: val, right: val } } } }))
                                            }}
                                            className="w-20"
                                        />
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <div className="flex items-center gap-2">
                                <Save className="w-5 h-5 text-primary" />
                                <CardTitle>الحفظ والنسخ الاحتياطي</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label>الحفظ التلقائي</Label>
                                    <div className="text-sm text-muted-foreground">حفظ التغييرات تلقائياً عند التعديل</div>
                                </div>
                                <Switch
                                    checked={settings.autoSave}
                                    onCheckedChange={(val) => setSettings(prev => ({ ...prev, autoSave: val }))}
                                />
                            </div>

                            <div className="flex items-center justify-between pt-4 border-t">
                                <div className="space-y-0.5">
                                    <Label>نسخة احتياطية كاملة</Label>
                                    <div className="text-sm text-muted-foreground">تصدير جميع بيانات المشروع (JSON)</div>
                                </div>
                                <Button variant="outline" onClick={async () => {
                                    if (!projectId) return;
                                    try {
                                        toast.info("جاري تحضير النسخة الاحتياطية الكاملة...");
                                        const project = (await ThesisService.getProjects()).find(p => p.id === projectId);
                                        const structure = await ThesisService.getStructure(projectId);
                                        const tasks = await ThesisService.getTasks(projectId);
                                        const references = await ThesisService.getReferences(projectId);
                                        const milestones = await ThesisService.getMilestones(projectId);

                                        // Data Object
                                        const backupData = {
                                            version: "1.0",
                                            timestamp: new Date().toISOString(),
                                            project,
                                            structure,
                                            tasks,
                                            references,
                                            milestones
                                        };

                                        // Initializing Zip
                                        const JSZip = (await import('jszip')).default; // Dynamic import to avoid build errors if missing initially
                                        const zip = new JSZip();

                                        // 1. Add JSON Data
                                        zip.file("data.json", JSON.stringify(backupData, null, 2));

                                        // 2. Add Master Docx
                                        if (project && structure.length > 0) {
                                            try {
                                                const { DocxGenerator } = await import('@/services/thesis/DocxGenerator');
                                                const masterDocBlob = await DocxGenerator.generateMasterDoc(project, structure);
                                                zip.file(`${project.name}_Master.docx`, masterDocBlob);
                                            } catch (docxErr) {
                                                console.error("Failed to generate DOCX for backup", docxErr);
                                                // Continue without it or log warning
                                                zip.file("WARNING.txt", "Failed to generate Master DOCX: " + docxErr);
                                            }
                                        }

                                        // 3. Add Readme
                                        zip.file("README.txt", `Backup for Project: ${project?.name}\nDate: ${new Date().toLocaleString()}\n\nContains:\n- data.json: Full project metadata.\n- *.docx: Master Thesis Document.`);

                                        // Generate Zip Blob
                                        const content = await zip.generateAsync({ type: "blob" });

                                        saveAs(content, `FULL_BACKUP_${project?.name || 'thesis'}_${new Date().toISOString().slice(0, 10)}.zip`);
                                        toast.success("تم تحميل النسخة الاحتياطية (WinRAR/Zip)");
                                    } catch (e) {
                                        console.error(e);
                                        toast.error("فشل إنشاء النسخة الاحتياطية");
                                    }
                                }}>
                                    <Save className="w-4 h-4 ml-2" />
                                    تصدير بيانات المشروع
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <div className="flex items-center gap-2">
                                <Palette className="w-5 h-5 text-primary" />
                                <CardTitle>التخزين السحابي</CardTitle>
                            </div>
                            <CardDescription>ربط المشروع بخدمات التخزين السحابي</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className={`flex items-center justify-between p-4 border rounded-lg transition-colors ${settings.cloudSync?.google ? 'bg-blue-50 border-blue-200' : 'bg-gray-50'}`}>
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center border text-blue-500 font-bold">G</div>
                                    <div>
                                        <div className="font-medium">Google Drive</div>
                                        <div className="text-xs text-muted-foreground">{settings.cloudSync?.google ? 'متصل' : 'غير متصل'}</div>
                                    </div>
                                </div>
                                <Button
                                    variant={settings.cloudSync?.google ? "destructive" : "outline"}
                                    size="sm"
                                    onClick={() => setSettings(prev => ({ ...prev, cloudSync: { ...prev.cloudSync, google: !prev.cloudSync.google } }))}
                                >
                                    {settings.cloudSync?.google ? 'إلغاء الربط' : 'ربط الحساب'}
                                </Button>
                            </div>
                            <div className={`flex items-center justify-between p-4 border rounded-lg transition-colors ${settings.cloudSync?.onedrive ? 'bg-blue-50 border-blue-200' : 'bg-gray-50'}`}>
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center border text-blue-700 font-bold">O</div>
                                    <div>
                                        <div className="font-medium">OneDrive</div>
                                        <div className="text-xs text-muted-foreground">{settings.cloudSync?.onedrive ? 'متصل' : 'غير متصل'}</div>
                                    </div>
                                </div>
                                <Button
                                    variant={settings.cloudSync?.onedrive ? "destructive" : "outline"}
                                    size="sm"
                                    onClick={() => setSettings(prev => ({ ...prev, cloudSync: { ...prev.cloudSync, onedrive: !prev.cloudSync.onedrive } }))}
                                >
                                    {settings.cloudSync?.onedrive ? 'إلغاء الربط' : 'ربط الحساب'}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="flex justify-end gap-3 pb-8">
                        <Button size="lg" variant="outline" onClick={handlePreviewDocument} className="gap-2">
                            📄 معاينة التنسيق
                        </Button>
                        <Button size="lg" onClick={handleSave} className="gap-2">
                            <Save className="w-4 h-4" />
                            حفظ التغييرات
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
