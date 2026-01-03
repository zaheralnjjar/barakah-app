import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
    Users, BookOpen, Calendar as CalendarIcon, CheckCircle2,
    Search, Plus, ChevronRight, User, Phone, MapPin,
    GraduationCap, Clock, Award, MoreVertical, FileText,
    MessageCircle, Download, Share2, Printer, History, Flag,
    Filter, ArrowUpDown, Check, Settings, Copy, Edit, FileInput, Trash2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Checkbox } from '@/components/ui/checkbox';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import * as XLSX from 'xlsx';

// --- Types ---
interface Student {
    id: string;
    fullName: string;
    arabicName?: string;
    status: 'active' | 'inactive' | 'graduated';
    level: 'beginner' | 'elementary' | 'intermediate' | 'advanced';
    lastVisit: string;
    progress: number;
    phone: string;
    conversionDate: string;
    nationality: string;
    gender: 'male' | 'female';
    birthDate?: string;
    availableDays?: string[];
    occupation?: string;
    education?: string;
    witnessSheikh?: string;
    nationalId?: string;
    address?: string;
    notes?: string;
    currentStage?: number; // 1, 2, or 3
    assignedSheikh?: string;
}

interface CommunicationLog {
    id: string;
    studentId: string;
    date: string;
    type: 'whatsapp' | 'call' | 'sms' | 'email' | 'visit';
    direction: 'sent' | 'received';
    content: string;
    notes?: string;
    sheikhName?: string;
}

interface Material {
    id: string;
    name: string;
    type: 'book' | 'video' | 'audio' | 'document' | 'link';
    category: 'عقيدة' | 'فقه' | 'قرآن' | 'سيرة' | 'أخلاق';
    url?: string;
}

interface StudentMaterial {
    id: string;
    studentId: string;
    materialId: string;
    dateGiven: string;
    completed: boolean;
    completionDate?: string;
    notes?: string;
}

interface Lesson {
    id: string;
    studentId: string;
    date: string;
    time: string;
    topic: string;
    teacher: string;
    duration: number;
    notes?: string;
    attended: boolean | null; // null = not yet
    location?: string;
}

interface Exam {
    id: string;
    studentId: string;
    type: 'oral' | 'written' | 'practical';
    subject: string;
    date: string;
    score?: number;
    maxScore: number;
    passed: boolean;
    notes?: string;
}

interface StudyStageItem {
    id: string;
    name: string;
    description: string;
    completed: boolean;
}

interface StudyStage {
    id: number;
    name: string;
    description: string;
    duration: string;
    items: StudyStageItem[];
}

interface StudyProtocol {
    stages: StudyStage[];
}

interface MessageTemplates {
    welcome: string;
    reminder: string;
}

interface Appointment {
    id: string;
    studentId: string;
    date: string;
    time: string;
    studentName: string;
    type: string;
    status: 'scheduled' | 'completed' | 'cancelled';
    notes?: string;
}

// --- Storage Keys ---
const STORAGE_KEYS = {
    STUDENTS: 'newmuslims_students',
    APPOINTMENTS: 'newmuslims_appointments',
    COMMUNICATIONS: 'newmuslims_communications',
    MATERIALS: 'newmuslims_materials',
    STUDENT_MATERIALS: 'newmuslims_student_materials',
    LESSONS: 'newmuslims_lessons',
    EXAMS: 'newmuslims_exams',
    PROTOCOL: 'newmuslims_protocol',
    TEMPLATES: 'newmuslims_templates',
};

// --- Default Study Protocol ---
const DEFAULT_PROTOCOL: StudyProtocol = {
    stages: [
        {
            id: 1,
            name: 'المرحلة الأولى: التأسيس',
            description: 'ترسيخ الشهادتين وتعلم أساسيات الطهارة والصلاة',
            duration: 'شهر 1-2',
            items: [
                { id: '1-1', name: 'نطق الشهادتين', description: 'فهم معنى الشهادتين ونطقهما', completed: false },
                { id: '1-2', name: 'معنى التوحيد', description: 'فهم أساسيات العقيدة', completed: false },
                { id: '1-3', name: 'تعلم الوضوء', description: 'إتقان الوضوء عملياً', completed: false },
                { id: '1-4', name: 'حفظ الفاتحة', description: 'حفظ سورة الفاتحة مع التجويد الأساسي', completed: false },
                { id: '1-5', name: 'تعلم الصلاة', description: 'معرفة أركان الصلاة وكيفيتها', completed: false },
            ]
        },
        {
            id: 2,
            name: 'المرحلة الثانية: البناء',
            description: 'إتقان الصلاة وحفظ سور إضافية ومقدمة في الفقه',
            duration: 'شهر 3-4',
            items: [
                { id: '2-1', name: 'إتقان الصلاة', description: 'أداء الصلوات الخمس بشكل صحيح', completed: false },
                { id: '2-2', name: 'حفظ قصار السور', description: 'الإخلاص، الفلق، الناس', completed: false },
                { id: '2-3', name: 'أذكار الصباح والمساء', description: 'حفظ الأذكار الأساسية', completed: false },
                { id: '2-4', name: 'فقه الصيام', description: 'أحكام الصيام ومبطلاته', completed: false },
                { id: '2-5', name: 'صلاة الجمعة', description: 'أحكام وآداب صلاة الجمعة', completed: false },
            ]
        },
        {
            id: 3,
            name: 'المرحلة الثالثة: التمكين',
            description: 'حفظ جزء عم ودراسة السيرة والتخرج',
            duration: 'شهر 5-6',
            items: [
                { id: '3-1', name: 'حفظ جزء عم', description: 'حفظ السور من الناس إلى النبأ', completed: false },
                { id: '3-2', name: 'السيرة النبوية', description: 'دراسة حياة النبي ﷺ', completed: false },
                { id: '3-3', name: 'فقه الزكاة', description: 'أحكام الزكاة ومصارفها', completed: false },
                { id: '3-4', name: 'الآداب الإسلامية', description: 'أخلاق المسلم ومعاملاته', completed: false },
                { id: '3-5', name: 'اختبار التخرج', description: 'اختبار شامل للتخرج', completed: false },
            ]
        }
    ]
};

const DEFAULT_TEMPLATES: MessageTemplates = {
    welcome: "السلام عليكم {name}! نرحب بك في مركز رعاية المهتدين. نحن هنا لخدمتك.",
    reminder: "السلام عليكم {name}. تذكير: لديك موعد درس غداً. ننتظرك!"
};

// --- Default Materials Library ---
const DEFAULT_MATERIALS: Material[] = [
    { id: 'm1', name: 'كتيب أركان الإسلام', type: 'book', category: 'عقيدة' },
    { id: 'm2', name: 'فيديو تعلم الوضوء', type: 'video', category: 'فقه', url: 'https://youtube.com' },
    { id: 'm3', name: 'تطبيق حفظ القرآن', type: 'link', category: 'قرآن', url: 'https://quran.com' },
    { id: 'm4', name: 'السيرة النبوية المختصرة', type: 'book', category: 'سيرة' },
    { id: 'm5', name: 'محاضرة الأخلاق الإسلامية', type: 'audio', category: 'أخلاق' },
];


// --- Mock Data ---
const MOCK_STUDENTS: Student[] = [
    { id: '1', fullName: 'Ahmed Mohammed', arabicName: 'أحمد محمد', status: 'active', level: 'elementary', lastVisit: 'اليوم', progress: 80, phone: '5511999999999', conversionDate: '2024-03-15', nationality: 'البرازيل', gender: 'male', birthDate: '1990-01-01', availableDays: ['الجمعة', 'السبت'], occupation: 'Engineer', education: 'University', witnessSheikh: 'Sheikh Ali', nationalId: '123456789' },
    { id: '2', fullName: 'Sarah Silva', arabicName: 'سارة', status: 'active', level: 'beginner', lastVisit: 'منذ 3 أيام', progress: 45, phone: '5511888888888', conversionDate: '2024-05-20', nationality: 'البرازيل', gender: 'female', birthDate: '1995-05-05', availableDays: ['الأحد'], occupation: 'Teacher', education: 'College', witnessSheikh: 'Sheikh Omar', nationalId: '987654321' },
    { id: '3', fullName: 'John Doe', arabicName: 'يحيى', status: 'graduated', level: 'advanced', lastVisit: 'منذ أسبوع', progress: 100, phone: '15550192', conversionDate: '2023-01-10', nationality: 'الولايات المتحدة', gender: 'male', birthDate: '1985-11-20', availableDays: ['all'], occupation: 'Developer', education: 'Masters', witnessSheikh: 'Sheikh Khalid', nationalId: '1122334455' }
];

const MOCK_APPOINTMENTS: Appointment[] = [
    { id: '1', studentId: '1', date: '2024-01-04', time: '16:30', studentName: 'أحمد محمد', type: 'درس قرآن', status: 'scheduled' },
    { id: '2', studentId: '2', date: '2024-01-05', time: '17:00', studentName: 'سارة', type: 'شرح الوضوء', status: 'scheduled' },
];

const ATTENDANCE_DATA = [
    { name: 'السبت', count: 12 },
    { name: 'الأحد', count: 8 },
    { name: 'الاثنين', count: 15 },
    { name: 'الثلاثاء', count: 10 },
    { name: 'الأربعاء', count: 20 },
    { name: 'الخميس', count: 18 },
    { name: 'الجمعة', count: 45 },
];

const STATUS_DATA = [
    { name: 'نشط', value: 23, color: '#10B981' }, // Emerald
    { name: 'خريج', value: 12, color: '#F59E0B' }, // Amber
    { name: 'غير نشط', value: 10, color: '#6B7280' }, // Gray
];

const NewMuslimsManager = () => {
    const { toast } = useToast();

    // --- Helper: Load from localStorage ---
    const loadFromStorage = <T,>(key: string, defaultValue: T): T => {
        try {
            const stored = localStorage.getItem(key);
            return stored ? JSON.parse(stored) : defaultValue;
        } catch {
            return defaultValue;
        }
    };

    // --- Helper: Save to localStorage ---
    const saveToStorage = <T,>(key: string, value: T) => {
        try {
            localStorage.setItem(key, JSON.stringify(value));
        } catch (e) {
            console.error('Error saving to localStorage:', e);
        }
    };

    // --- Core State with localStorage ---
    const [students, setStudents] = useState<Student[]>(() =>
        loadFromStorage(STORAGE_KEYS.STUDENTS, MOCK_STUDENTS)
    );
    const [appointments, setAppointments] = useState<Appointment[]>(() =>
        loadFromStorage(STORAGE_KEYS.APPOINTMENTS, MOCK_APPOINTMENTS)
    );
    const [communications, setCommunications] = useState<CommunicationLog[]>(() =>
        loadFromStorage(STORAGE_KEYS.COMMUNICATIONS, [])
    );
    const [materials] = useState<Material[]>(() =>
        loadFromStorage(STORAGE_KEYS.MATERIALS, DEFAULT_MATERIALS)
    );
    const [studentMaterials, setStudentMaterials] = useState<StudentMaterial[]>(() =>
        loadFromStorage(STORAGE_KEYS.STUDENT_MATERIALS, [])
    );
    const [lessons, setLessons] = useState<Lesson[]>(() =>
        loadFromStorage(STORAGE_KEYS.LESSONS, [])
    );
    const [exams, setExams] = useState<Exam[]>(() =>
        loadFromStorage(STORAGE_KEYS.EXAMS, [])
    );
    const [studyProtocol, setStudyProtocol] = useState<StudyProtocol>(() =>
        loadFromStorage(STORAGE_KEYS.PROTOCOL, DEFAULT_PROTOCOL)
    );
    const [templates, setTemplates] = useState<MessageTemplates>(() =>
        loadFromStorage(STORAGE_KEYS.TEMPLATES, DEFAULT_TEMPLATES)
    );

    // --- UI State ---
    const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [isRegOpen, setIsRegOpen] = useState(false);
    const [isApptOpen, setIsApptOpen] = useState(false);
    const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
    const [filterNationality, setFilterNationality] = useState<string>('all');
    const [filterGender, setFilterGender] = useState<string>('all');
    const [sortOption, setSortOption] = useState<'name' | 'date_new' | 'date_old' | 'gender' | 'nationality'>('date_new');
    const [isBulkMessageOpen, setIsBulkMessageOpen] = useState(false);
    const [bulkMessageText, setBulkMessageText] = useState('');
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isTextImportOpen, setIsTextImportOpen] = useState(false);
    const [importText, setImportText] = useState('');
    const [stagedStudents, setStagedStudents] = useState<Partial<Student>[]>([]);
    const [isCertificateOpen, setIsCertificateOpen] = useState(false);
    const [certData, setCertData] = useState<{ name: string; date: string; sheikh: string; studentId: string } | null>(null);
    const [isProtocolOpen, setIsProtocolOpen] = useState(false); // New: Protocol customization dialog
    const [activeDetailTab, setActiveDetailTab] = useState<'info' | 'progress' | 'communications' | 'materials' | 'lessons'>('info');

    // --- Auto-save to localStorage ---
    React.useEffect(() => { saveToStorage(STORAGE_KEYS.STUDENTS, students); }, [students]);
    React.useEffect(() => { saveToStorage(STORAGE_KEYS.APPOINTMENTS, appointments); }, [appointments]);
    React.useEffect(() => { saveToStorage(STORAGE_KEYS.COMMUNICATIONS, communications); }, [communications]);
    React.useEffect(() => { saveToStorage(STORAGE_KEYS.STUDENT_MATERIALS, studentMaterials); }, [studentMaterials]);
    React.useEffect(() => { saveToStorage(STORAGE_KEYS.LESSONS, lessons); }, [lessons]);
    React.useEffect(() => { saveToStorage(STORAGE_KEYS.EXAMS, exams); }, [exams]);
    React.useEffect(() => { saveToStorage(STORAGE_KEYS.PROTOCOL, studyProtocol); }, [studyProtocol]);
    React.useEffect(() => { saveToStorage(STORAGE_KEYS.TEMPLATES, templates); }, [templates]);

    // --- Derived Data ---
    // --- Derived Data ---
    const filteredStudents = students.filter(s => {
        const matchesSearch = s.fullName.includes(searchQuery) || (s.arabicName?.includes(searchQuery) ?? false);
        const matchesNat = filterNationality === 'all' || s.nationality === filterNationality;
        const matchesGender = filterGender === 'all' || s.gender === filterGender;
        return matchesSearch && matchesNat && matchesGender;
    }).sort((a, b) => {
        if (sortOption === 'name') return (a.arabicName || a.fullName).localeCompare(b.arabicName || b.fullName);
        if (sortOption === 'date_new') return new Date(b.conversionDate).getTime() - new Date(a.conversionDate).getTime();
        if (sortOption === 'date_old') return new Date(a.conversionDate).getTime() - new Date(b.conversionDate).getTime();
        if (sortOption === 'gender') return (a.gender || '').localeCompare(b.gender || '');
        if (sortOption === 'nationality') return (a.nationality || '').localeCompare(b.nationality || '');
        return 0;
    });

    const uniqueNationalities = Array.from(new Set(students.map(s => s.nationality)));

    // --- Bulk Actions ---
    const toggleSelectStudent = (id: string) => {
        setSelectedStudentIds(prev =>
            prev.includes(id) ? prev.filter(sid => sid !== id) : [...prev, id]
        );
    };

    const toggleSelectAll = () => {
        if (selectedStudentIds.length === filteredStudents.length) setSelectedStudentIds([]);
        else setSelectedStudentIds(filteredStudents.map(s => s.id));
    };

    const handleBulkWhatsapp = () => {
        setIsBulkMessageOpen(true);
    };

    // --- Student CRUD ---
    const addStudent = (studentData: Omit<Student, 'id'>) => {
        const newStudent: Student = {
            ...studentData,
            id: `student-${Date.now()}`,
            currentStage: 1,
            progress: 0,
        };
        setStudents(prev => [...prev, newStudent]);
        toast({ title: "تم التسجيل", description: `تم إضافة ${studentData.arabicName || studentData.fullName} بنجاح` });
        setIsRegOpen(false);
    };

    const updateStudent = (id: string, updates: Partial<Student>) => {
        setStudents(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
        if (selectedStudent?.id === id) {
            setSelectedStudent(prev => prev ? { ...prev, ...updates } : null);
        }
        toast({ title: "تم التحديث", description: "تم تحديث بيانات الطالب" });
    };

    const deleteStudent = (id: string) => {
        setStudents(prev => prev.filter(s => s.id !== id));
        if (selectedStudent?.id === id) setSelectedStudent(null);
        toast({ title: "تم الحذف", description: "تم حذف الطالب من النظام" });
    };

    // --- Communication Log ---
    const addCommunication = (studentId: string, type: CommunicationLog['type'], content: string, direction: 'sent' | 'received' = 'sent') => {
        const newLog: CommunicationLog = {
            id: `comm-${Date.now()}`,
            studentId,
            date: new Date().toISOString(),
            type,
            direction,
            content,
        };
        setCommunications(prev => [...prev, newLog]);
    };

    // --- Lessons ---
    const addLesson = (studentId: string, topic: string, date: string, time: string, teacher: string) => {
        const newLesson: Lesson = {
            id: `lesson-${Date.now()}`,
            studentId,
            date,
            time,
            topic,
            teacher,
            duration: 60,
            attended: null,
        };
        setLessons(prev => [...prev, newLesson]);
        toast({ title: "تم الحفظ", description: "تم إضافة الدرس" });
    };

    // --- Protocol Management ---
    const updateProtocolItem = (stageId: number, itemId: string, completed: boolean) => {
        setStudyProtocol(prev => ({
            stages: prev.stages.map(stage =>
                stage.id === stageId
                    ? { ...stage, items: stage.items.map(item => item.id === itemId ? { ...item, completed } : item) }
                    : stage
            )
        }));
    };

    const addProtocolItem = (stageId: number, name: string, description: string) => {
        const newItem: StudyStageItem = {
            id: `${stageId}-${Date.now()}`,
            name,
            description,
            completed: false,
        };
        setStudyProtocol(prev => ({
            stages: prev.stages.map(stage =>
                stage.id === stageId
                    ? { ...stage, items: [...stage.items, newItem] }
                    : stage
            )
        }));
        toast({ title: "تم الإضافة", description: `تم إضافة "${name}" للمرحلة` });
    };

    const deleteProtocolItem = (stageId: number, itemId: string) => {
        setStudyProtocol(prev => ({
            stages: prev.stages.map(stage =>
                stage.id === stageId
                    ? { ...stage, items: stage.items.filter(item => item.id !== itemId) }
                    : stage
            )
        }));
    };

    // --- Calculate Student Progress ---
    const calculateStudentProgress = (studentId: string): number => {
        const studentProtocol = studyProtocol; // In future, this could be per-student
        const totalItems = studentProtocol.stages.flatMap(s => s.items).length;
        const completedItems = studentProtocol.stages.flatMap(s => s.items).filter(i => i.completed).length;
        return totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;
    };

    // --- Get Student Communications ---
    const getStudentCommunications = (studentId: string) => {
        return communications.filter(c => c.studentId === studentId).sort((a, b) =>
            new Date(b.date).getTime() - new Date(a.date).getTime()
        );
    };

    // --- Get Student Lessons ---
    const getStudentLessons = (studentId: string) => {
        return lessons.filter(l => l.studentId === studentId).sort((a, b) =>
            new Date(b.date).getTime() - new Date(a.date).getTime()
        );
    };


    // --- Actions ---
    // Format phone for WhatsApp - handles Argentina (+54) numbers
    const formatPhoneForWhatsapp = (phone: string): string => {
        let cleaned = phone.replace(/\D/g, '');
        // Remove leading zeros
        cleaned = cleaned.replace(/^0+/, '');
        // If starts with 005, remove leading 00
        if (cleaned.startsWith('005')) cleaned = cleaned.substring(2);
        // If starts with 549 (Argentina mobile) keep as is
        if (cleaned.startsWith('549')) return cleaned;
        // If starts with 54 (Argentina) add 9 for mobile
        if (cleaned.startsWith('54') && !cleaned.startsWith('549')) {
            return '549' + cleaned.substring(2);
        }
        // If starts with 11 (Buenos Aires), add 549
        if (cleaned.startsWith('11')) return '549' + cleaned;
        // Default: add 54 9 for Argentina
        if (cleaned.length >= 10 && !cleaned.startsWith('54')) {
            return '549' + cleaned;
        }
        return cleaned;
    };

    const handleWhatsapp = (student: Student, messageType: 'welcome' | 'reminder' | 'custom' = 'custom') => {
        let text = "";
        if (messageType === 'welcome') text = templates.welcome.replace('{name}', student.arabicName || student.fullName);
        else if (messageType === 'reminder') text = templates.reminder.replace('{name}', student.arabicName || student.fullName);

        const formattedPhone = formatPhoneForWhatsapp(student.phone);
        const url = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(text)}`;
        window.open(url, '_blank');
    };

    const handlePrintCertificate = (student: Student) => {
        setCertData({
            studentId: student.id,
            name: student.arabicName || student.fullName,
            date: student.conversionDate,
            sheikh: student.witnessSheikh || ''
        });
        setIsCertificateOpen(true);
    };

    const handlePrintProfile = (student: Student) => {
        // Logic to print individual profile with lesson plan
        const printWindow = window.open('', '_blank');
        if (printWindow) {
            const stageHtml = studyProtocol.stages.map((stage, idx) => `
                <div style="margin: 15px 0; padding: 15px; border: 1px solid #ddd; border-radius: 8px;">
                    <h3 style="color: ${idx === 0 ? '#10B981' : idx === 1 ? '#3B82F6' : '#8B5CF6'}; margin: 0 0 10px 0;">
                        المرحلة ${idx + 1}: ${stage.name}
                    </h3>
                    <ul style="margin: 0; padding-right: 20px;">
                        ${stage.items.map(item => `
                            <li style="margin: 5px 0;">
                                <span style="${item.completed ? 'text-decoration: line-through; color: #888;' : ''}">${item.name}</span>
                                ${item.completed ? ' ✓' : ' ☐'}
                            </li>
                        `).join('')}
                    </ul>
                </div>
            `).join('');

            const commsHtml = getStudentCommunications(student.id).slice(0, 5).map(comm => `
                <tr>
                    <td>${new Date(comm.date).toLocaleDateString('ar-SA')}</td>
                    <td>${comm.type === 'whatsapp' ? 'واتساب' : comm.type === 'call' ? 'مكالمة' : comm.type === 'visit' ? 'زيارة' : 'رسالة'}</td>
                    <td>${comm.content.substring(0, 50)}</td>
                </tr>
            `).join('');

            printWindow.document.write(`
                <html dir="rtl">
                <head>
                    <title>ملف الطالب - ${student.arabicName || student.fullName}</title>
                    <style>
                        body { font-family: 'Segoe UI', Tahoma, Arial, sans-serif; padding: 30px; max-width: 800px; margin: 0 auto; }
                        h1 { color: #10B981; border-bottom: 3px solid #10B981; padding-bottom: 10px; }
                        h2 { color: #374151; margin-top: 25px; }
                        .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
                        .info-item { padding: 8px 12px; background: #f3f4f6; border-radius: 6px; }
                        .info-label { font-size: 12px; color: #6b7280; }
                        .info-value { font-weight: bold; color: #1f2937; }
                        table { width: 100%; border-collapse: collapse; margin-top: 10px; }
                        th, td { border: 1px solid #e5e7eb; padding: 8px; text-align: right; }
                        th { background: #f9fafb; }
                        .footer { margin-top: 30px; text-align: center; color: #9ca3af; font-size: 12px; }
                    </style>
                </head>
                <body>
                    <h1>📋 ملف الطالب: ${student.arabicName || student.fullName}</h1>
                    
                    <h2>📝 المعلومات الأساسية</h2>
                    <div class="info-grid">
                        <div class="info-item"><div class="info-label">الاسم الكامل</div><div class="info-value">${student.fullName}</div></div>
                        <div class="info-item"><div class="info-label">الهوية / DNI</div><div class="info-value">${student.nationalId || '-'}</div></div>
                        <div class="info-item"><div class="info-label">واتساب</div><div class="info-value">${student.phone || '-'}</div></div>
                        <div class="info-item"><div class="info-label">الجنسية</div><div class="info-value">${student.nationality || '-'}</div></div>
                        <div class="info-item"><div class="info-label">تاريخ الإسلام</div><div class="info-value">${student.conversionDate}</div></div>
                        <div class="info-item"><div class="info-label">الشيخ الشاهد</div><div class="info-value">${student.witnessSheikh || '-'}</div></div>
                        <div class="info-item"><div class="info-label">العمل</div><div class="info-value">${student.occupation || '-'}</div></div>
                        <div class="info-item"><div class="info-label">الدراسة</div><div class="info-value">${student.education || '-'}</div></div>
                    </div>

                    <h2>📚 خطة الدروس (البروتوكول التعليمي)</h2>
                    ${stageHtml}

                    <h2>💬 آخر المراسلات</h2>
                    ${commsHtml.length > 0 ? `
                        <table>
                            <thead><tr><th>التاريخ</th><th>النوع</th><th>المحتوى</th></tr></thead>
                            <tbody>${commsHtml}</tbody>
                        </table>
                    ` : '<p style="color: #9ca3af;">لا توجد مراسلات مسجلة</p>'}

                    <div class="footer">
                        <p>تم الطباعة بتاريخ: ${new Date().toLocaleDateString('ar-SA')}</p>
                        <p>نظام بركة - مركز رعاية المهتدين</p>
                    </div>
                </body>
                </html>
            `);
            printWindow.document.close();
            printWindow.print();
        }
    };

    // --- Text Import Logic ---
    const parseImportText = () => {
        // Simple parser: looks for lines with text (name) and numbers (phone)
        const lines = importText.split('\n').filter(l => l.trim().length > 0);
        const parsed: Partial<Student>[] = lines.map((line, idx) => {
            // Extract phone (digits > 7)
            const phoneMatch = line.match(/[\d\+\s-]{8,}/);
            const phone = phoneMatch ? phoneMatch[0].trim() : '';
            // Extract name (rest of string)
            const name = line.replace(phone, '').trim().replace(/[:\-\,]/g, '');

            return {
                id: `staged-${idx}`,
                fullName: name,
                arabicName: name, // Default to same
                phone: phone,
                status: 'active',
                level: 'beginner',
                progress: 0,
                conversionDate: new Date().toISOString().split('T')[0],
                nationality: '',
                gender: 'male' // Default
            };
        });
        setStagedStudents(parsed);
    };

    const handleSaveStaged = () => {
        // Filter valid ones
        const valid = stagedStudents.filter(s => s.fullName && s.phone) as Student[];
        if (valid.length > 0) {
            setStudents(prev => [...prev, ...valid]);
            setStagedStudents([]);
            setImportText('');
            setIsTextImportOpen(false);
            toast({ title: "تم الحفظ", description: `تمت إضافة ${valid.length} طالب.` });
        }
    };

    const handlePrintReport = () => {
        // Export all students to printable PDF table
        const printWindow = window.open('', '_blank');
        if (printWindow) {
            const studentsToExport = selectedStudentIds.length > 0
                ? students.filter(s => selectedStudentIds.includes(s.id))
                : students;

            const tableRows = studentsToExport.map((s, idx) => `
                <tr>
                    <td>${idx + 1}</td>
                    <td>${s.fullName || '-'}</td>
                    <td>${s.arabicName || '-'}</td>
                    <td dir="ltr">${s.phone || '-'}</td>
                    <td>${s.nationality || '-'}</td>
                    <td>${s.nationalId || '-'}</td>
                    <td>${s.address || '-'}</td>
                    <td>${s.occupation || '-'}</td>
                    <td>${s.conversionDate || '-'}</td>
                    <td>${s.witnessSheikh || '-'}</td>
                </tr>
            `).join('');

            printWindow.document.write(`
                <html dir="rtl">
                <head>
                    <title>قائمة المهتدين الجدد - ${new Date().toLocaleDateString('ar-SA')}</title>
                    <style>
                        body { font-family: 'Segoe UI', Tahoma, Arial, sans-serif; padding: 20px; }
                        h1 { color: #10B981; text-align: center; margin-bottom: 5px; }
                        .subtitle { text-align: center; color: #6b7280; margin-bottom: 20px; }
                        table { width: 100%; border-collapse: collapse; font-size: 11px; }
                        th { background: #10B981; color: white; padding: 8px 4px; text-align: right; }
                        td { border: 1px solid #e5e7eb; padding: 6px 4px; }
                        tr:nth-child(even) { background: #f9fafb; }
                        .footer { margin-top: 20px; text-align: center; color: #9ca3af; font-size: 11px; }
                        @media print { 
                            body { padding: 10px; } 
                            table { font-size: 9px; }
                            th, td { padding: 4px 2px; }
                        }
                    </style>
                </head>
                <body>
                    <h1>📋 قائمة المهتدين الجدد</h1>
                    <div class="subtitle">إجمالي: ${studentsToExport.length} طالب | تاريخ التصدير: ${new Date().toLocaleDateString('ar-SA')}</div>
                    
                    <table>
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>الاسم الكامل</th>
                                <th>الاسم العربي</th>
                                <th>واتساب</th>
                                <th>الجنسية</th>
                                <th>الهوية/DNI</th>
                                <th>المدينة</th>
                                <th>العمل</th>
                                <th>تاريخ الإسلام</th>
                                <th>الشيخ</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${tableRows}
                        </tbody>
                    </table>

                    <div class="footer">
                        <p>نظام بركة - مركز رعاية المهتدين</p>
                    </div>
                </body>
                </html>
            `);
            printWindow.document.close();
            printWindow.print();

            toast({
                title: "تم فتح نافذة الطباعة ✅",
                description: `جاهز لطباعة ${studentsToExport.length} طالب`
            });
        }
    };

    // --- Excel Import ---
    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (evt) => {
            const bstr = evt.target?.result;
            const wb = XLSX.read(bstr, { type: 'binary' });
            const wsname = wb.SheetNames[0];
            const ws = wb.Sheets[wsname];
            const data = XLSX.utils.sheet_to_json(ws);

            // Map Excel data to Student interface
            // Supports user's Spanish columns: Nombre completo, Edad, Ciudad donde vives, WhatsApp, Trabajo, Estudio, Dni, Nacionalidad, Fecha cuando abrazo, Con el sheij
            const newStudents: Student[] = data.map((row: any, index: number) => {
                // Helper function to find column value with flexible matching
                const getCol = (...names: string[]): string => {
                    for (const name of names) {
                        // Try exact match first
                        if (row[name] !== undefined && row[name] !== null && row[name] !== '') return String(row[name]);
                        // Try case-insensitive and trimmed match
                        const keys = Object.keys(row);
                        for (const key of keys) {
                            const cleanKey = key.trim().toLowerCase();
                            const cleanName = name.trim().toLowerCase();
                            if (cleanKey === cleanName || cleanKey.includes(cleanName) || cleanName.includes(cleanKey)) {
                                if (row[key] !== undefined && row[key] !== null && row[key] !== '') return String(row[key]);
                            }
                        }
                    }
                    return '';
                };

                // Calculate birth year from age if provided
                const ageStr = getCol('Edad', 'Age', 'العمر');
                const age = parseInt(ageStr);
                const birthYear = !isNaN(age) ? new Date().getFullYear() - age : null;
                const birthDate = birthYear ? `${birthYear}-01-01` : '';

                // Get full name - this is the main field
                const fullName = getCol('Nombre completo', 'nombre completo', 'Name', 'الاسم', 'Nombre', 'nombre');

                // Debug: log what we're getting
                console.log('Row keys:', Object.keys(row));
                console.log('Full name found:', fullName);

                return {
                    id: `excel-${Date.now()}-${index}`,
                    // Name mapping - use fullName for both if arabicName not found
                    fullName: fullName || 'Unknown',
                    arabicName: getCol('ArabicName', 'الاسم العربي', 'Nombre árabe') || fullName || '',
                    // Status defaults
                    status: 'active' as const,
                    level: 'beginner' as const,
                    lastVisit: 'جديد',
                    progress: 0,
                    currentStage: 1,
                    // Contact
                    phone: getCol('WhatsApp', 'whatsapp', 'Phone', 'رقم الهاتف', 'Teléfono', 'Telefono').replace(/\D/g, ''),
                    // Location
                    address: getCol('Ciudad donde vives', 'ciudad', 'City', 'المدينة', 'Ciudad'),
                    nationality: getCol('Nacionalidad', 'nacionalidad', 'Nationality', 'الجنسية') || 'غير محدد',
                    // Identity
                    nationalId: getCol('Dni', 'DNI', 'dni', 'NationalID', 'الهوية', 'ID'),
                    // Dates
                    conversionDate: getCol('Fecha cuando abrazo e', 'Fecha cuando abrazo', 'fecha cuando abrazo', 'Date', 'تاريخ الإسلام', 'Fecha') || new Date().toISOString().split('T')[0],
                    birthDate: birthDate || getCol('BirthDate', 'تاريخ الميلاد', 'Fecha Nacimiento'),
                    // Work & Education
                    occupation: getCol('Trabajo', 'trabajo', 'Occupation', 'العمل', 'Ocupación'),
                    education: getCol('Estudio', 'estudio', 'Education', 'الدراسة', 'Educación'),
                    // Sheikh
                    witnessSheikh: getCol('Con el sheij', 'Con el shiej', 'con el sheij', 'Sheikh', 'الشيخ', 'Testigo'),
                    // Gender (default to male if not specified)
                    gender: (['F', 'f', 'أنثى', 'Femenino', 'femenino'].includes(getCol('Gender', 'Sexo', 'الجنس', 'Género'))) ? 'female' as const : 'male' as const,
                    // Available days
                    availableDays: getCol('Days', 'الأيام', 'Días').split(',').map((d: string) => d.trim()).filter(Boolean),
                };
            });

            // Filter out empty/invalid students (no valid name)
            const validStudents = newStudents.filter(s =>
                s.fullName && s.fullName !== 'Unknown' && s.fullName.trim().length > 0
            );

            const skippedCount = newStudents.length - validStudents.length;

            if (validStudents.length > 0) {
                setStudents(prev => [...prev, ...validStudents]);
                toast({
                    title: "تم الاستيراد بنجاح ✅",
                    description: `تم إضافة ${validStudents.length} مهتدي جديد${skippedCount > 0 ? ` (تم تجاهل ${skippedCount} صف فارغ)` : ''}`
                });
            } else {
                toast({
                    title: "لم يتم العثور على بيانات صالحة",
                    description: "تأكد من وجود عمود 'Nombre completo' في الملف وأنه يحتوي على أسماء",
                    variant: "destructive"
                });
            }
        };
        reader.readAsBinaryString(file);
    };

    // --- Sub-Components ---
    const StatusBadge = ({ status }: { status: string }) => {
        switch (status) {
            case 'active': return <Badge className="bg-emerald-100 text-emerald-700">نشط 🟢</Badge>;
            case 'inactive': return <Badge className="bg-gray-100 text-gray-700">غير نشط ⚫</Badge>;
            case 'graduated': return <Badge className="bg-amber-100 text-amber-700">خريج 🎓</Badge>;
            default: return <Badge>غير محدد</Badge>;
        }
    };

    const LevelBadge = ({ level }: { level: string }) => {
        const levels: any = {
            'beginner': { label: 'مبتدئ', color: 'bg-blue-100 text-blue-700' },
            'elementary': { label: 'ابتدائي', color: 'bg-indigo-100 text-indigo-700' },
            'intermediate': { label: 'متوسط', color: 'bg-purple-100 text-purple-700' },
            'advanced': { label: 'متقدم', color: 'bg-rose-100 text-rose-700' },
        };
        const l = levels[level] || levels['beginner'];
        return <span className={`text-xs px-2 py-1 rounded-full ${l.color}`}>{l.label}</span>;
    };

    // --- Views ---
    const StudentDetailView = ({ student, onBack }: { student: Student, onBack: () => void }) => (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center gap-4 border-b pb-4">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={onBack}>
                        <ChevronRight className="w-5 h-5" />
                    </Button>
                    <Avatar className="w-16 h-16 border-2 border-emerald-100">
                        <AvatarImage src={`https://ui-avatars.com/api/?name=${student.fullName}&background=10B981&color=fff`} />
                        <AvatarFallback>{student.arabicName?.[0]}</AvatarFallback>
                    </Avatar>
                    <div>
                        <h2 className="text-xl sm:text-2xl font-bold text-gray-800">{student.arabicName}</h2>
                        <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm text-gray-500">
                            <span>{student.fullName}</span>
                            <span>•</span>
                            <span dir="ltr" className="flex items-center gap-1">
                                {student.phone}
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-6 w-6 p-0 text-blue-500 hover:text-blue-700 hover:bg-blue-50"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        const newPhone = prompt(`تعديل رقم الهاتف (أضف رمز البلد بدون +)\nمثال: 5491159612728\n\nالرقم الحالي:`, student.phone);
                                        if (newPhone && newPhone.trim()) {
                                            const cleaned = newPhone.replace(/\D/g, '');
                                            setStudents(prev => prev.map(s =>
                                                s.id === student.id ? { ...s, phone: cleaned } : s
                                            ));
                                            toast({ title: "تم التحديث", description: `الرقم الجديد: ${cleaned}` });
                                        }
                                    }}
                                >
                                    ✏️
                                </Button>
                            </span>
                        </div>
                    </div>
                </div>
                <div className="mr-auto flex flex-wrap gap-2">
                    <Button variant="outline" size="sm" className="text-green-600 border-green-200 hover:bg-green-50 text-xs sm:text-sm" onClick={() => handleWhatsapp(student)}>
                        <MessageCircle className="w-4 h-4 ml-1" /> <span className="hidden sm:inline">واتساب</span>
                    </Button>
                    <Button variant="outline" size="sm" className="text-xs sm:text-sm" onClick={() => handleWhatsapp(student, 'welcome')}>
                        👋 <span className="hidden sm:inline">ترحيب</span>
                    </Button>
                    <Button variant="outline" size="sm" className="text-xs sm:text-sm" onClick={() => handleWhatsapp(student, 'reminder')}>
                        🔔 <span className="hidden sm:inline">تذكير</span>
                    </Button>
                    <Button size="sm" onClick={() => setIsApptOpen(true)} className="bg-emerald-600 hover:bg-emerald-700 text-xs sm:text-sm">
                        <CalendarIcon className="w-4 h-4 ml-1" /> <span className="hidden sm:inline">حجز موعد</span>
                    </Button>
                </div>
            </div>

            {/* Tabs for different sections */}
            <Tabs defaultValue="info" className="w-full">
                <TabsList className="bg-white p-1 border shadow-sm rounded-lg mb-4 w-full justify-start overflow-x-auto">
                    <TabsTrigger value="info" className="data-[state=active]:bg-emerald-50 data-[state=active]:text-emerald-700">
                        📋 المعلومات
                    </TabsTrigger>
                    <TabsTrigger value="progress" className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700">
                        📈 التقدم
                    </TabsTrigger>
                    <TabsTrigger value="communications" className="data-[state=active]:bg-purple-50 data-[state=active]:text-purple-700">
                        💬 المراسلات ({getStudentCommunications(student.id).length})
                    </TabsTrigger>
                    <TabsTrigger value="materials" className="data-[state=active]:bg-amber-50 data-[state=active]:text-amber-700">
                        📚 المواد
                    </TabsTrigger>
                    <TabsTrigger value="lessons" className="data-[state=active]:bg-rose-50 data-[state=active]:text-rose-700">
                        📅 الدروس ({getStudentLessons(student.id).length})
                    </TabsTrigger>
                </TabsList>

                {/* Info Tab */}
                <TabsContent value="info" className="mt-0">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Right Column: Info & Journey */}
                        <div className="lg:col-span-2 space-y-6">
                            {/* Journey Map */}
                            <Card className="shadow-sm border-t-4 border-t-emerald-500">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Flag className="w-5 h-5 text-emerald-600" />
                                        رحلة الطالب (Journey Map)
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="relative border-r-2 border-dashed border-gray-200 mr-4 space-y-8 py-2">
                                        <div className="relative flex items-center mb-4">
                                            <div className="absolute -right-[9px] w-4 h-4 bg-emerald-500 rounded-full border-2 border-white shadow"></div>
                                            <div className="mr-6">
                                                <h4 className="font-bold text-gray-800">نطق الشهادة</h4>
                                                <p className="text-xs text-gray-500">{student.conversionDate}</p>
                                            </div>
                                        </div>
                                        <div className="relative flex items-center mb-4">
                                            <div className="absolute -right-[9px] w-4 h-4 bg-emerald-500 rounded-full border-2 border-white shadow"></div>
                                            <div className="mr-6">
                                                <h4 className="font-bold text-gray-800">تعلم الفاتحة</h4>
                                                <p className="text-xs text-green-600">اكتمل ✅</p>
                                            </div>
                                        </div>
                                        <div className="relative flex items-center mb-4">
                                            <div className="absolute -right-[9px] w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow"></div>
                                            <div className="mr-6">
                                                <h4 className="font-bold text-gray-800">دروس الطهارة والصلاة</h4>
                                                <div className="w-32 mt-1"><Progress value={75} className="h-1.5" /></div>
                                                <p className="text-xs text-blue-600 mt-1">جاري العمل (75%)</p>
                                            </div>
                                        </div>
                                        <div className="relative flex items-center">
                                            <div className="absolute -right-[9px] w-4 h-4 bg-gray-300 rounded-full border-2 border-white"></div>
                                            <div className="mr-6 opacity-50">
                                                <h4 className="font-bold text-gray-800">حفظ جزء عم</h4>
                                                <p className="text-xs text-gray-500">مرحلة قادمة</p>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>



                            {/* Certificates */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Award className="w-5 h-5 text-amber-500" />
                                        الشهادات والإنجازات
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex gap-4 overflow-x-auto pb-2">
                                        <div className="min-w-[200px] border rounded-lg p-3 bg-gradient-to-br from-emerald-50 to-white text-center cursor-pointer hover:shadow-md transition-all">
                                            <Award className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
                                            <h4 className="font-bold text-emerald-800 text-sm">شهادة الإسلام</h4>
                                            <p className="text-[10px] text-gray-500 mb-2">{student.conversionDate}</p>
                                            <Button size="sm" variant="outline" className="w-full text-xs h-7" onClick={() => handlePrintCertificate(student)}>
                                                <Printer className="w-3 h-3 ml-1" /> طباعة
                                            </Button>
                                            <Button size="sm" variant="ghost" className="w-full text-xs h-7 text-gray-400 mt-1">
                                                <Download className="w-3 h-3 ml-1" /> تحميل
                                            </Button>
                                        </div>
                                        <div className="min-w-[200px] border rounded-lg p-3 bg-gradient-to-br from-amber-50 to-white text-center cursor-pointer hover:border-amber-300 transition-all opacity-50 grayscale hover:grayscale-0">
                                            <Users className="w-8 h-8 text-amber-600 mx-auto mb-2" />
                                            <h4 className="font-bold text-amber-800 text-sm">إتمام المستوى الأول</h4>
                                            <p className="text-[10px] text-gray-500 mb-2">قريباً</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Left Column: Quick Stats & Info */}
                        <div className="space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex justify-between items-center text-sm text-gray-500">
                                        معلومات أساسية
                                        <Button size="sm" variant="ghost" onClick={() => handlePrintProfile(student)}><Printer className="w-4 h-4" /></Button>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    <div className="flex justify-between border-b pb-2">
                                        <span className="text-sm text-gray-500">رقم الهوية</span>
                                        <span className="text-sm font-medium">{student.nationalId || '-'}</span>
                                    </div>
                                    <div className="flex justify-between border-b pb-2">
                                        <span className="text-sm text-gray-500">التصنيف</span>
                                        <StatusBadge status={student.status} />
                                    </div>
                                    <div className="flex justify-between border-b pb-2">
                                        <span className="text-sm text-gray-500">المستوى</span>
                                        <LevelBadge level={student.level} />
                                    </div>
                                    <div className="flex justify-between border-b pb-2">
                                        <span className="text-sm text-gray-500">الجنسية</span>
                                        <span className="text-sm font-medium">{student.nationality}</span>
                                    </div>
                                    <div className="flex justify-between border-b pb-2">
                                        <span className="text-sm text-gray-500">الجنس</span>
                                        <span className="text-sm font-medium">{student.gender === 'male' ? 'ذكر' : 'أنثى'}</span>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="bg-blue-50 border-blue-100">
                                <CardHeader><CardTitle className="text-blue-800 text-sm">الموعد القادم</CardTitle></CardHeader>
                                <CardContent>
                                    <div className="flex items-center gap-3">
                                        <div className="bg-white p-2 rounded-lg shadow-sm">
                                            <CalendarIcon className="w-6 h-6 text-blue-600" />
                                        </div>
                                        <div>
                                            <div className="font-bold text-blue-900">غداً، 04:30 م</div>
                                            <div className="text-xs text-blue-600">درس فقه (الوضوء)</div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </TabsContent>

                {/* Progress Tab */}
                <TabsContent value="progress" className="mt-0">
                    <Card className="shadow-sm border-t-4 border-t-blue-500">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                📈 تقدم الطالب في البرنامج
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-6">
                                {studyProtocol.stages.map((stage, idx) => (
                                    <div key={stage.id} className="border rounded-lg p-4">
                                        <div className="flex items-center justify-between mb-3">
                                            <h4 className="font-bold text-lg">المرحلة {idx + 1}: {stage.name}</h4>
                                            <Badge variant="outline">{stage.items.filter(i => i.completed).length}/{stage.items.length}</Badge>
                                        </div>
                                        <div className="space-y-2">
                                            {stage.items.map(item => (
                                                <div key={item.id} className="flex items-center gap-3 p-2 bg-gray-50 rounded">
                                                    <Checkbox checked={item.completed} onCheckedChange={(checked) => updateProtocolItem(stage.id, item.id, !!checked)} />
                                                    <div className="flex-1">
                                                        <span className={item.completed ? 'line-through text-gray-400' : ''}>{item.name}</span>
                                                        {item.description && <p className="text-xs text-gray-500">{item.description}</p>}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Communications Tab */}
                <TabsContent value="communications" className="mt-0">
                    <Card className="shadow-sm border-t-4 border-t-purple-500">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                💬 سجل المراسلات
                            </CardTitle>
                            <CardDescription>سجّل جميع تواصلاتك مع الطالب</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {/* Quick Add Buttons */}
                            <div className="flex flex-wrap gap-2 p-3 bg-gray-50 rounded-lg">
                                <Button size="sm" variant="outline" className="bg-green-50 border-green-200 text-green-700 hover:bg-green-100" onClick={() => {
                                    addCommunication(student.id, 'whatsapp', 'تم إرسال رسالة عبر واتساب', 'sent');
                                    toast({ title: "✅ تم التسجيل", description: "مراسلة واتساب" });
                                }}>
                                    📱 واتساب
                                </Button>
                                <Button size="sm" variant="outline" className="bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100" onClick={() => {
                                    addCommunication(student.id, 'call', 'تم الاتصال هاتفياً', 'sent');
                                    toast({ title: "✅ تم التسجيل", description: "مكالمة هاتفية" });
                                }}>
                                    📞 مكالمة
                                </Button>
                                <Button size="sm" variant="outline" className="bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100" onClick={() => {
                                    addCommunication(student.id, 'visit', 'تمت زيارة الطالب', 'sent');
                                    toast({ title: "✅ تم التسجيل", description: "زيارة" });
                                }}>
                                    🏠 زيارة
                                </Button>
                                <Button size="sm" variant="outline" className="bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100" onClick={() => {
                                    addCommunication(student.id, 'sms', 'تم إرسال رسالة نصية', 'sent');
                                    toast({ title: "✅ تم التسجيل", description: "رسالة نصية" });
                                }}>
                                    📩 رسالة SMS
                                </Button>
                            </div>

                            {/* Communications List */}
                            {getStudentCommunications(student.id).length === 0 ? (
                                <div className="text-center py-8 text-gray-500">
                                    <MessageCircle className="w-12 h-12 mx-auto mb-2 opacity-30" />
                                    <p>لا توجد مراسلات مسجلة</p>
                                    <p className="text-xs">اضغط على أحد الأزرار أعلاه لتسجيل مراسلة</p>
                                </div>
                            ) : (
                                <ScrollArea className="h-[280px]">
                                    <div className="space-y-3">
                                        {getStudentCommunications(student.id).map(comm => (
                                            <div key={comm.id} className={`p-3 rounded-lg border ${comm.direction === 'sent' ? 'bg-emerald-50 border-emerald-200' : 'bg-blue-50 border-blue-200'}`}>
                                                <div className="flex items-center justify-between mb-1">
                                                    <Badge variant="outline" className="text-xs">
                                                        {comm.type === 'whatsapp' && '📱 واتساب'}
                                                        {comm.type === 'call' && '📞 مكالمة'}
                                                        {comm.type === 'visit' && '🏠 زيارة'}
                                                        {comm.type === 'sms' && '📩 رسالة'}
                                                    </Badge>
                                                    <span className="text-xs text-gray-500">{new Date(comm.date).toLocaleDateString('ar-SA')}</span>
                                                </div>
                                                <p className="text-sm">{comm.content}</p>
                                            </div>
                                        ))}
                                    </div>
                                </ScrollArea>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Materials Tab */}
                <TabsContent value="materials" className="mt-0">
                    <Card className="shadow-sm border-t-4 border-t-amber-500">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle className="flex items-center gap-2">
                                📚 المواد التعليمية
                            </CardTitle>
                            <Button size="sm" variant="outline">
                                <Plus className="w-4 h-4 mr-1" /> إضافة مادة
                            </Button>
                        </CardHeader>
                        <CardContent>
                            <div className="grid gap-3">
                                {materials.length === 0 ? (
                                    <div className="text-center py-8 text-gray-500">
                                        <BookOpen className="w-12 h-12 mx-auto mb-2 opacity-30" />
                                        <p>لا توجد مواد تعليمية</p>
                                    </div>
                                ) : (
                                    materials.slice(0, 6).map(mat => (
                                        <div key={mat.id} className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50">
                                            <div className={`p-2 rounded ${mat.type === 'video' ? 'bg-red-100' : mat.type === 'book' ? 'bg-blue-100' : 'bg-green-100'}`}>
                                                {mat.type === 'video' && '🎬'}
                                                {mat.type === 'book' && '📖'}
                                                {mat.type === 'link' && '🔗'}
                                            </div>
                                            <div className="flex-1">
                                                <h5 className="font-medium">{mat.name}</h5>
                                                <p className="text-xs text-gray-500">{mat.category}</p>
                                            </div>
                                            <Badge variant="outline" className="text-xs">{mat.type}</Badge>
                                        </div>
                                    ))
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Lessons Tab */}
                <TabsContent value="lessons" className="mt-0">
                    <Card className="shadow-sm border-t-4 border-t-rose-500">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle className="flex items-center gap-2">
                                📅 سجل الدروس
                            </CardTitle>
                            <Button size="sm" className="bg-rose-600 hover:bg-rose-700" onClick={() => setIsApptOpen(true)}>
                                <Plus className="w-4 h-4 mr-1" /> جدولة درس
                            </Button>
                        </CardHeader>
                        <CardContent>
                            {getStudentLessons(student.id).length === 0 ? (
                                <div className="text-center py-8 text-gray-500">
                                    <CalendarIcon className="w-12 h-12 mx-auto mb-2 opacity-30" />
                                    <p>لا توجد دروس مجدولة</p>
                                    <p className="text-xs">اضغط على زر الجدولة لإضافة درس جديد</p>
                                </div>
                            ) : (
                                <ScrollArea className="h-[300px]">
                                    <div className="space-y-3">
                                        {getStudentLessons(student.id).map(lesson => (
                                            <div key={lesson.id} className="flex items-center gap-4 p-3 border rounded-lg">
                                                <div className="bg-rose-100 p-2 rounded-lg text-center min-w-[60px]">
                                                    <div className="text-xs text-rose-600">{new Date(lesson.date).toLocaleDateString('ar-SA', { month: 'short' })}</div>
                                                    <div className="text-lg font-bold text-rose-700">{new Date(lesson.date).getDate()}</div>
                                                </div>
                                                <div className="flex-1">
                                                    <h5 className="font-medium">{lesson.topic}</h5>
                                                    <div className="flex items-center gap-2 text-xs text-gray-500">
                                                        <Clock className="w-3 h-3" /> {lesson.time}
                                                        <span>•</span>
                                                        <span>{lesson.duration} دقيقة</span>
                                                    </div>
                                                </div>
                                                {lesson.attended === null ? (
                                                    <Badge variant="outline">قادم</Badge>
                                                ) : lesson.attended ? (
                                                    <Badge className="bg-green-100 text-green-700">حضر ✓</Badge>
                                                ) : (
                                                    <Badge className="bg-red-100 text-red-700">غائب ✗</Badge>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </ScrollArea>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );



    return (
        <div className="bg-slate-50 min-h-[600px] p-6 rounded-xl" dir="rtl">
            {selectedStudent ? (
                <StudentDetailView student={selectedStudent} onBack={() => setSelectedStudent(null)} />
            ) : (
                <div className="space-y-6">
                    {/* Main Header */}
                    <div className="flex flex-col gap-4">
                        <div className="flex items-center gap-3">
                            <span className="bg-emerald-600 text-white p-2 rounded-xl shadow-lg shadow-emerald-200">
                                <Users className="w-6 h-6 sm:w-8 sm:h-8" />
                            </span>
                            <div>
                                <h1 className="text-xl sm:text-3xl font-bold text-gray-800">مركز رعاية المهتدين</h1>
                                <p className="text-xs sm:text-sm text-gray-500">الإدارة المتكاملة لشؤون المسلمين الجدد</p>
                            </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <Button variant="outline" size="sm" className="gap-1 text-xs sm:text-sm" onClick={handlePrintReport}>
                                <Printer className="w-4 h-4" />
                                <span className="hidden sm:inline">تقارير</span>
                            </Button>
                            <Button variant="outline" size="sm" className="gap-1 text-xs sm:text-sm" onClick={() => setIsSettingsOpen(true)}>
                                <Settings className="w-4 h-4" />
                                <span className="hidden sm:inline">الإعدادات</span>
                            </Button>
                            <Button variant="outline" size="sm" className="gap-1 text-xs sm:text-sm border-emerald-200 text-emerald-700 hover:bg-emerald-50" onClick={() => setIsTextImportOpen(true)}>
                                <FileText className="w-4 h-4" />
                                <span className="hidden sm:inline">استيراد نص</span>
                            </Button>
                            <div className="relative">
                                <Input
                                    type="file"
                                    accept=".xlsx, .xls"
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                    onChange={handleFileUpload}
                                />
                                <Button variant="outline" size="sm" className="gap-1 text-xs sm:text-sm border-emerald-200 text-emerald-700 hover:bg-emerald-50">
                                    <Download className="w-4 h-4" />
                                    <span className="hidden sm:inline">Excel</span>
                                </Button>
                            </div>
                            <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 gap-1 text-xs sm:text-sm" onClick={() => setIsRegOpen(true)}>
                                <Plus className="w-4 h-4" />
                                <span className="hidden sm:inline">تسجيل جديد</span>
                            </Button>
                        </div>
                    </div>

                    {/* Dashboard Widgets */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <Card className="bg-white hover:border-emerald-200 transition-all cursor-pointer">
                            <CardContent className="p-4 flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-500 font-medium mb-1">إجمالي الطلاب</p>
                                    <h3 className="text-3xl font-bold text-gray-800">45</h3>
                                </div>
                                <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center text-blue-600">
                                    <Users className="w-6 h-6" />
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="bg-white hover:border-emerald-200 transition-all cursor-pointer">
                            <CardContent className="p-4 flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-500 font-medium mb-1">الطلاب النشطين</p>
                                    <h3 className="text-3xl font-bold text-emerald-600">23</h3>
                                </div>
                                <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-600">
                                    <CheckCircle2 className="w-6 h-6" />
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="bg-white hover:border-emerald-200 transition-all cursor-pointer">
                            <CardContent className="p-4 flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-500 font-medium mb-1">مواعيد اليوم</p>
                                    <h3 className="text-3xl font-bold text-amber-600">8</h3>
                                </div>
                                <div className="w-12 h-12 bg-amber-50 rounded-full flex items-center justify-center text-amber-600">
                                    <Clock className="w-6 h-6" />
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="bg-white hover:border-emerald-200 transition-all cursor-pointer">
                            <CardContent className="p-4 flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-500 font-medium mb-1">الخريجين</p>
                                    <h3 className="text-3xl font-bold text-purple-600">12</h3>
                                </div>
                                <div className="w-12 h-12 bg-purple-50 rounded-full flex items-center justify-center text-purple-600">
                                    <Award className="w-6 h-6" />
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <Tabs defaultValue="students" className="w-full">
                        <TabsList className="bg-white p-1 border shadow-sm rounded-lg mb-4 w-full justify-start">
                            <TabsTrigger value="students" className="flex-1 max-w-[200px] data-[state=active]:bg-emerald-50 data-[state=active]:text-emerald-700">قائمة المهتدين</TabsTrigger>
                            <TabsTrigger value="calendar" className="flex-1 max-w-[200px]">التقويم والمواعيد</TabsTrigger>
                            <TabsTrigger value="reports" className="flex-1 max-w-[200px]">التقارير والإحصائيات</TabsTrigger>
                        </TabsList>

                        {/* 1. Students List Tab */}
                        <TabsContent value="students" className="mt-0">
                            <Card className="border-none shadow-sm">
                                <CardHeader className="pb-2">
                                    <div className="relative">
                                        <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                                        <Input
                                            placeholder="بحث بالاسم، الجنسية، أو رقم الهاتف..."
                                            className="pr-9"
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                        />
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    {/* Action Bar */}
                                    {selectedStudentIds.length > 0 && (
                                        <div className="flex items-center gap-2 mb-4 p-2 bg-emerald-50 border border-emerald-100 rounded-lg animate-in fade-in">
                                            <span className="text-sm font-bold text-emerald-800 px-2">{selectedStudentIds.length} طالب محدد</span>
                                            <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 gap-1 h-8" onClick={handleBulkWhatsapp}>
                                                <MessageCircle className="w-4 h-4" /> مراسلة
                                            </Button>
                                            <Button size="sm" variant="outline" className="border-blue-200 text-blue-600 hover:bg-blue-50 gap-1 h-8" onClick={() => setIsApptOpen(true)}>
                                                <CalendarIcon className="w-4 h-4" /> جدولة درس
                                            </Button>
                                            <Button size="sm" variant="outline" className="border-purple-200 text-purple-600 hover:bg-purple-50 gap-1 h-8" onClick={handlePrintReport}>
                                                <Printer className="w-4 h-4" /> تصدير PDF
                                            </Button>
                                            <Button size="sm" variant="outline" className="border-red-200 text-red-600 hover:bg-red-50 gap-1 h-8" onClick={() => {
                                                if (confirm(`هل تريد حذف ${selectedStudentIds.length} طالب محدد؟`)) {
                                                    setStudents(prev => prev.filter(s => !selectedStudentIds.includes(s.id)));
                                                    setSelectedStudentIds([]);
                                                    toast({ title: "تم الحذف ✅", description: `تم حذف ${selectedStudentIds.length} طالب` });
                                                }
                                            }}>
                                                <Trash2 className="w-4 h-4" /> حذف
                                            </Button>
                                            <Button size="sm" variant="ghost" className="text-gray-500 h-8" onClick={() => setSelectedStudentIds([])}>
                                                ✕
                                            </Button>
                                        </div>
                                    )}

                                    {/* Filters & Sort Toolbar */}
                                    <div className="flex flex-wrap gap-2 mb-4">
                                        <Select value={sortOption} onValueChange={(v: any) => setSortOption(v)}>
                                            <SelectTrigger className="w-[160px] h-9">
                                                <ArrowUpDown className="w-3 h-3 ml-2 text-gray-500" />
                                                <SelectValue placeholder="الترتيب" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="date_new">الأحدث إسلاماً</SelectItem>
                                                <SelectItem value="date_old">الأقدم إسلاماً</SelectItem>
                                                <SelectItem value="name">الاسم (أبجدي)</SelectItem>
                                                <SelectItem value="gender">الجنس</SelectItem>
                                                <SelectItem value="nationality">الجنسية</SelectItem>
                                            </SelectContent>
                                        </Select>

                                        <Select value={filterNationality} onValueChange={setFilterNationality}>
                                            <SelectTrigger className="w-[140px] h-9">
                                                <Filter className="w-3 h-3 ml-2 text-gray-500" />
                                                <SelectValue placeholder="الجنسية" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">الكل</SelectItem>
                                                {uniqueNationalities.map(n => <SelectItem key={n} value={n}>{n}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                        <Select value={filterGender} onValueChange={setFilterGender}>
                                            <SelectTrigger className="w-[130px] h-9">
                                                <Users className="w-3 h-3 ml-2 text-gray-500" />
                                                <SelectValue placeholder="الجنس" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">الكل</SelectItem>
                                                <SelectItem value="male">ذكور</SelectItem>
                                                <SelectItem value="female">إناث</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <Button variant="ghost" size="sm" className="h-9 px-2" onClick={toggleSelectAll}>
                                            {selectedStudentIds.length === filteredStudents.length ? 'إلغاء الكل' : 'تحديد الكل'}
                                        </Button>
                                    </div>

                                    <ScrollArea className="h-[400px] pr-4">
                                        <div className="space-y-3">
                                            {filteredStudents.map((student) => (
                                                <div
                                                    key={student.id}
                                                    className={`group flex items-center justify-between p-4 bg-white border rounded-xl hover:shadow-md transition-all ${selectedStudentIds.includes(student.id) ? 'border-emerald-500 bg-emerald-50/10' : 'border-gray-100 hover:border-emerald-300'}`}
                                                >
                                                    <div className="flex items-center gap-4">
                                                        <Checkbox
                                                            checked={selectedStudentIds.includes(student.id)}
                                                            onCheckedChange={() => toggleSelectStudent(student.id)}
                                                        />
                                                        <div onClick={() => setSelectedStudent(student)} className="flex items-center gap-4 cursor-pointer">
                                                            <Avatar className="w-12 h-12 border border-gray-100 group-hover:border-emerald-200">
                                                                <AvatarImage src={`https://ui-avatars.com/api/?name=${student.fullName}&background=f1f5f9&color=64748b`} />
                                                                <AvatarFallback>{student.arabicName?.[0]}</AvatarFallback>
                                                            </Avatar>
                                                            <div>
                                                                <div className="flex items-center gap-2">
                                                                    <h4 className="font-bold text-gray-800 group-hover:text-emerald-700 transition-colors">
                                                                        {student.arabicName}
                                                                    </h4>
                                                                    <span className="text-xs text-gray-400">({student.fullName})</span>
                                                                </div>
                                                                <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                                                                    <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {student.nationality}</span>
                                                                    <LevelBadge level={student.level} />
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        {/* Progress */}
                                                        <div className="text-center hidden sm:block mr-2">
                                                            <div className="flex items-center gap-2">
                                                                <Progress value={student.progress} className="w-16 h-1.5" />
                                                                <span className="text-xs font-bold text-emerald-600">{student.progress}%</span>
                                                            </div>
                                                        </div>
                                                        {/* Quick Actions */}
                                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-green-600 hover:bg-green-50" title="واتساب" onClick={(e) => { e.stopPropagation(); handleWhatsapp(student, 'welcome'); }}>
                                                            <MessageCircle className="w-4 h-4" />
                                                        </Button>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600 hover:bg-blue-50" title="طباعة" onClick={(e) => { e.stopPropagation(); handlePrintProfile(student); }}>
                                                            <Printer className="w-4 h-4" />
                                                        </Button>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-purple-600 hover:bg-purple-50" title="مشاركة" onClick={(e) => {
                                                            e.stopPropagation();
                                                            navigator.clipboard.writeText(`${student.arabicName || student.fullName}\nWhatsApp: ${student.phone}\nNationality: ${student.nationality}`);
                                                            toast({ title: "تم النسخ", description: "تم نسخ معلومات الطالب" });
                                                        }}>
                                                            <Share2 className="w-4 h-4" />
                                                        </Button>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-red-400 hover:bg-red-50 hover:text-red-600" title="حذف" onClick={(e) => { e.stopPropagation(); if (confirm('هل تريد حذف هذا الطالب؟')) deleteStudent(student.id); }}>
                                                            <Trash2 className="w-4 h-4" />
                                                        </Button>
                                                        <Button variant="ghost" size="icon" className="text-gray-400 group-hover:text-emerald-600" onClick={() => setSelectedStudent(student)}>
                                                            <ChevronRight className="w-5 h-5" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </ScrollArea>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* 2. Calendar Tab */}
                        <TabsContent value="calendar" className="mt-0">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <Card className="md:col-span-2 border-none shadow-sm">
                                    <CardHeader>
                                        <CardTitle className="flex justify-between items-center">
                                            <span>المواعيد المجدولة</span>
                                            <Button size="sm" onClick={() => setIsApptOpen(true)}>+ موعد جديد</Button>
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-3">
                                            {MOCK_APPOINTMENTS.map(appt => (
                                                <div key={appt.id} className="flex items-center p-4 bg-white border rounded-xl shadow-sm">
                                                    <div className="bg-blue-50 text-blue-600 p-3 rounded-lg text-center min-w-[60px]">
                                                        <div className="font-bold text-lg">{appt.time}</div>
                                                        <div className="text-[10px]">{appt.date}</div>
                                                    </div>
                                                    <div className="mr-4 flex-1">
                                                        <h4 className="font-bold text-gray-800">{appt.type}</h4>
                                                        <p className="text-sm text-gray-500">مع الطالب: {appt.studentName}</p>
                                                    </div>
                                                    <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700 hover:bg-red-50">إلغاء</Button>
                                                </div>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                                <Card className="border-none shadow-sm bg-emerald-50">
                                    <CardHeader><CardTitle className="text-emerald-800 text-sm">التذكيرات التلقائية</CardTitle></CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="flex gap-2 items-start text-sm text-emerald-700">
                                            <CheckCircle2 className="w-4 h-4 mt-0.5" />
                                            <p>تم إرسال تذكير واتساب لـ 3 طلاب لديهم مواعيد غداً.</p>
                                        </div>
                                        <div className="flex gap-2 items-start text-sm text-emerald-700">
                                            <History className="w-4 h-4 mt-0.5" />
                                            <p>الطالب "ريكاردو" غائب منذ أسبوعين. هل تود إرسال رسالة تفقد؟</p>
                                            <Button size="sm" variant="outline" className="h-6 text-xs bg-white">إرسال</Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </TabsContent>

                        {/* 3. Reports Tab */}
                        <TabsContent value="reports" className="mt-0">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-sm text-gray-500">الحضور الأسبوعي</CardTitle>
                                    </CardHeader>
                                    <CardContent className="h-[250px]">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={ATTENDANCE_DATA}>
                                                <XAxis dataKey="name" fontSize={12} />
                                                <YAxis fontSize={12} />
                                                <Tooltip />
                                                <Bar dataKey="count" fill="#10B981" radius={[4, 4, 0, 0]} />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-sm text-gray-500">توزيع الطلاب حسب الحالة</CardTitle>
                                    </CardHeader>
                                    <CardContent className="h-[250px] flex items-center justify-center">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie
                                                    data={STATUS_DATA}
                                                    cx="50%"
                                                    cy="50%"
                                                    innerRadius={60}
                                                    outerRadius={80}
                                                    paddingAngle={5}
                                                    dataKey="value"
                                                >
                                                    {STATUS_DATA.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                                    ))}
                                                </Pie>
                                                <Tooltip />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </CardContent>
                                </Card>
                            </div>
                        </TabsContent>
                    </Tabs>
                </div>
            )}

            {/* Registration Dialog */}
            {/* Registration Dialog - Functional Form */}
            <Dialog open={isRegOpen} onOpenChange={setIsRegOpen}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-2xl">
                            <User className="w-6 h-6 text-emerald-600" />
                            تسجيل مهتدي جديد / Nuevo Musulmán
                        </DialogTitle>
                        <DialogDescription>أدخل بيانات المسلم الجديد / Ingrese los datos</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={(e) => {
                        e.preventDefault();
                        const formData = new FormData(e.currentTarget);
                        const age = formData.get('age') as string;
                        const birthYear = age ? new Date().getFullYear() - parseInt(age) : null;

                        addStudent({
                            fullName: formData.get('fullName') as string || 'Unknown',
                            arabicName: formData.get('arabicName') as string || '',
                            phone: (formData.get('whatsapp') as string || '').replace(/\D/g, ''),
                            nationality: formData.get('nationality') as string || 'غير محدد',
                            nationalId: formData.get('dni') as string || '',
                            address: formData.get('city') as string || '',
                            occupation: formData.get('trabajo') as string || '',
                            education: formData.get('estudio') as string || '',
                            conversionDate: formData.get('conversionDate') as string || new Date().toISOString().split('T')[0],
                            witnessSheikh: formData.get('sheikh') as string || '',
                            gender: (formData.get('gender') as string || 'male') as 'male' | 'female',
                            birthDate: birthYear ? `${birthYear}-01-01` : '',
                            status: 'active',
                            level: 'beginner',
                            lastVisit: 'جديد',
                            progress: 0,
                            availableDays: [],
                        });
                    }}>
                        <div className="grid gap-4 py-4">
                            {/* Row 1: Names */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="fullName">الاسم الكامل / Nombre Completo *</Label>
                                    <Input id="fullName" name="fullName" placeholder="Nombre completo..." required />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="arabicName">الاسم العربي / Nombre Árabe</Label>
                                    <Input id="arabicName" name="arabicName" placeholder="عبدالله..." />
                                </div>
                            </div>

                            {/* Row 2: Age & City */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="age">العمر / Edad</Label>
                                    <Input id="age" name="age" type="number" placeholder="30" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="city">المدينة / Ciudad donde vives</Label>
                                    <Input id="city" name="city" placeholder="Buenos Aires..." />
                                </div>
                            </div>

                            {/* Row 3: WhatsApp & DNI */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="whatsapp">واتساب / WhatsApp *</Label>
                                    <Input id="whatsapp" name="whatsapp" placeholder="1159612728" required />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="dni">رقم الهوية / DNI</Label>
                                    <Input id="dni" name="dni" placeholder="30037039" />
                                </div>
                            </div>

                            {/* Row 4: Work & Education */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="trabajo">العمل / Trabajo</Label>
                                    <Input id="trabajo" name="trabajo" placeholder="Coaching-Comercial..." />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="estudio">الدراسة / Estudio</Label>
                                    <Input id="estudio" name="estudio" placeholder="Secundario, Universidad..." />
                                </div>
                            </div>

                            {/* Row 5: Nationality & Gender */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="nationality">الجنسية / Nacionalidad</Label>
                                    <Input id="nationality" name="nationality" placeholder="Argentino..." />
                                </div>
                                <div className="space-y-2">
                                    <Label>الجنس / Género</Label>
                                    <Select name="gender" defaultValue="male">
                                        <SelectTrigger>
                                            <SelectValue placeholder="اختر / Seleccionar" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="male">ذكر / Masculino</SelectItem>
                                            <SelectItem value="female">أنثى / Femenino</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            {/* Row 6: Conversion Date & Sheikh */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="conversionDate">تاريخ الإسلام / Fecha cuando abrazo *</Label>
                                    <Input id="conversionDate" name="conversionDate" type="date" required />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="sheikh">الشيخ الشاهد / Con el Sheij</Label>
                                    <Input id="sheikh" name="sheikh" placeholder="Zaher..." />
                                </div>
                            </div>
                        </div>

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsRegOpen(false)}>إلغاء / Cancelar</Button>
                            <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700">
                                <Plus className="w-4 h-4 mr-2" /> حفظ البيانات / Guardar
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Appointment Dialog */}
            <Dialog open={isApptOpen} onOpenChange={setIsApptOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>حجز موعد درس / متابعة</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>الطالب</Label>
                            <Select>
                                <SelectTrigger><SelectValue placeholder="اختر الطالب" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="1">أحمد محمد</SelectItem>
                                    <SelectItem value="2">سارة</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>التاريخ</Label>
                                <Input type="date" />
                            </div>
                            <div className="space-y-2">
                                <Label>الوقت</Label>
                                <Input type="time" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>نوع الموعد</Label>
                            <Select>
                                <SelectTrigger><SelectValue placeholder="اختر النوع" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="quran">درس قرآن</SelectItem>
                                    <SelectItem value="fiqh">فقه (وضوء/صلاة)</SelectItem>
                                    <SelectItem value="aqidah">عقيدة</SelectItem>
                                    <SelectItem value="followup">متابعة عامة</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button onClick={() => setIsApptOpen(false)} className="bg-blue-600">جدولة الموعد</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Bulk Message Dialog */}
            <Dialog open={isBulkMessageOpen} onOpenChange={setIsBulkMessageOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>مراسلة جماعية عبر واتساب</DialogTitle>
                        <DialogDescription>
                            قم بنسخ الرسالة ثم اضغط على زر الإرسال أمام كل طالب لفتح المحادثة.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>نص الرسالة</Label>
                            <Textarea
                                placeholder="اكتب رسالتك هنا..."
                                value={bulkMessageText}
                                onChange={(e) => setBulkMessageText(e.target.value)}
                            />
                        </div>
                        <ScrollArea className="h-[200px] border rounded-md p-2">
                            <div className="space-y-2">
                                {students.filter(s => selectedStudentIds.includes(s.id)).map(student => (
                                    <div key={student.id} className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm">
                                        <span>{student.arabicName || student.fullName}</span>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="h-7 text-xs border-green-200 text-green-700 hover:bg-green-50"
                                            onClick={() => {
                                                const formattedPhone = formatPhoneForWhatsapp(student.phone);
                                                const url = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(bulkMessageText)}`;
                                                window.open(url, '_blank');
                                            }}
                                        >
                                            إرسال <MessageCircle className="w-3 h-3 ml-1" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Text Import Dialog */}
            <Dialog open={isTextImportOpen} onOpenChange={setIsTextImportOpen}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>📋 استيراد نص</DialogTitle>
                        <DialogDescription>
                            الصق قائمة الأسماء والأرقام من WhatsApp أو أي مصدر آخر
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <Textarea
                            placeholder="مثال:\nأحمد محمد - 1159612728\nسارة أحمد: 1187654321\nمحمد علي 1123456789"
                            value={importText}
                            onChange={(e) => setImportText(e.target.value)}
                            className="min-h-[150px] text-sm"
                            dir="auto"
                        />
                        <Button onClick={parseImportText} variant="outline" className="w-full">
                            🔍 تحليل النص
                        </Button>
                        {stagedStudents.length > 0 && (
                            <div className="border rounded-lg p-3 space-y-2">
                                <p className="text-sm font-medium text-emerald-600">تم العثور على {stagedStudents.length} طالب:</p>
                                <ScrollArea className="h-[120px]">
                                    {stagedStudents.map((s, i) => (
                                        <div key={i} className="flex justify-between text-sm p-1 bg-gray-50 rounded mb-1">
                                            <span>{s.fullName}</span>
                                            <span dir="ltr" className="text-gray-500">{s.phone}</span>
                                        </div>
                                    ))}
                                </ScrollArea>
                            </div>
                        )}
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => { setIsTextImportOpen(false); setStagedStudents([]); setImportText(''); }}>إلغاء</Button>
                        <Button onClick={handleSaveStaged} disabled={stagedStudents.length === 0} className="bg-emerald-600">
                            حفظ {stagedStudents.length} طالب
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Settings Dialog */}
            <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>⚙️ إعدادات النظام</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-6 py-4">
                        <div className="space-y-3">
                            <h4 className="font-medium text-gray-700">📨 قوالب الرسائل</h4>
                            <div className="space-y-2">
                                <Label>رسالة الترحيب</Label>
                                <Textarea
                                    value={templates.welcome}
                                    onChange={(e) => setTemplates(prev => ({ ...prev, welcome: e.target.value }))}
                                    className="text-sm"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>رسالة التذكير</Label>
                                <Textarea
                                    value={templates.reminder}
                                    onChange={(e) => setTemplates(prev => ({ ...prev, reminder: e.target.value }))}
                                    className="text-sm"
                                />
                            </div>
                            <p className="text-xs text-gray-500">استخدم {'{name}'} لإدراج اسم الطالب تلقائياً</p>
                        </div>
                        <div className="space-y-3">
                            <h4 className="font-medium text-gray-700">🗑️ إدارة البيانات</h4>
                            <Button variant="destructive" size="sm" onClick={() => {
                                if (confirm('هل أنت متأكد من حذف جميع البيانات؟ لا يمكن التراجع!')) {
                                    setStudents([]);
                                    setCommunications([]);
                                    setLessons([]);
                                    setExams([]);
                                    toast({ title: "تم الحذف", description: "تم مسح جميع البيانات" });
                                }
                            }}>
                                🗑️ مسح جميع البيانات
                            </Button>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button onClick={() => setIsSettingsOpen(false)} className="bg-emerald-600">حفظ الإعدادات</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Certificate Dialog */}
            <Dialog open={isCertificateOpen} onOpenChange={setIsCertificateOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>📜 طباعة شهادة الإسلام</DialogTitle>
                    </DialogHeader>
                    {certData && (
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label>اسم المهتدي</Label>
                                <Input value={certData.name} onChange={(e) => setCertData({ ...certData, name: e.target.value })} />
                            </div>
                            <div className="space-y-2">
                                <Label>تاريخ إعلان الإسلام</Label>
                                <Input type="date" value={certData.date} onChange={(e) => setCertData({ ...certData, date: e.target.value })} />
                            </div>
                            <div className="space-y-2">
                                <Label>الشيخ الشاهد</Label>
                                <Input value={certData.sheikh} onChange={(e) => setCertData({ ...certData, sheikh: e.target.value })} />
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsCertificateOpen(false)}>إلغاء</Button>
                        <Button className="bg-emerald-600" onClick={() => {
                            if (!certData) return;
                            const printWindow = window.open('', '_blank');
                            if (printWindow) {
                                printWindow.document.write(`
                                    <html dir="rtl">
                                    <head>
                                        <title>شهادة إسلام - ${certData.name}</title>
                                        <style>
                                            @page { size: A4 landscape; margin: 0; }
                                            body { font-family: 'Traditional Arabic', 'Amiri', serif; margin: 0; padding: 40px; background: linear-gradient(135deg, #f5f7fa 0%, #e4e8eb 100%); min-height: 100vh; display: flex; align-items: center; justify-content: center; }
                                            .certificate { background: white; border: 8px double #10B981; padding: 60px; text-align: center; max-width: 800px; box-shadow: 0 10px 40px rgba(0,0,0,0.1); }
                                            .header { color: #10B981; font-size: 42px; font-weight: bold; margin-bottom: 10px; }
                                            .bismillah { font-size: 28px; color: #059669; margin-bottom: 30px; }
                                            .body-text { font-size: 22px; line-height: 2; color: #374151; margin: 30px 0; }
                                            .name { font-size: 36px; color: #10B981; font-weight: bold; margin: 20px 0; border-bottom: 2px solid #10B981; display: inline-block; padding: 0 30px 10px; }
                                            .details { display: flex; justify-content: space-around; margin-top: 50px; }
                                            .detail-item { text-align: center; }
                                            .detail-label { font-size: 14px; color: #6b7280; }
                                            .detail-value { font-size: 18px; font-weight: bold; color: #1f2937; margin-top: 5px; }
                                            .footer { margin-top: 50px; font-size: 14px; color: #9ca3af; }
                                            .verse { font-size: 18px; color: #059669; font-style: italic; margin-top: 30px; }
                                        </style>
                                    </head>
                                    <body>
                                        <div class="certificate">
                                            <div class="bismillah">بسم الله الرحمن الرحيم</div>
                                            <div class="header">🕌 شهادة إعلان الإسلام</div>
                                            <div class="body-text">
                                                يشهد مركز رعاية المهتدين أن
                                            </div>
                                            <div class="name">${certData.name}</div>
                                            <div class="body-text">
                                                قد نطق بالشهادتين وأعلن إسلامه<br>
                                                أشهد أن لا إله إلا الله وأشهد أن محمداً عبده ورسوله
                                            </div>
                                            <div class="details">
                                                <div class="detail-item">
                                                    <div class="detail-label">تاريخ الإسلام</div>
                                                    <div class="detail-value">${new Date(certData.date).toLocaleDateString('ar-SA', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
                                                </div>
                                                <div class="detail-item">
                                                    <div class="detail-label">الشيخ الشاهد</div>
                                                    <div class="detail-value">${certData.sheikh || 'غير محدد'}</div>
                                                </div>
                                            </div>
                                            <div class="verse">"إِنَّ الدِّينَ عِندَ اللَّهِ الْإِسْلَامُ"</div>
                                            <div class="footer">مركز رعاية المهتدين - نظام بركة</div>
                                        </div>
                                    </body>
                                    </html>
                                `);
                                printWindow.document.close();
                                printWindow.print();
                                setIsCertificateOpen(false);
                            }
                        }}>
                            🖨️ طباعة الشهادة
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default NewMuslimsManager;
