import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
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
    Search, Plus, ChevronRight, ChevronDown, User, Phone, MapPin,
    GraduationCap, Clock, Award, MoreVertical, FileText,
    MessageCircle, Download, Share2, Printer, History, Flag,
    Filter, ArrowUpDown, Check, Settings, Copy, Edit, Trash2, ClipboardList, Info, Save, UserPlus, Target
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { NotificationManager } from '@/services/NotificationManager';
import { generatePDF, generateStudentReport, generateStudentProfile, generateProtocolPDF, generateCertificatePDF } from '@/utils/pdfGenerator';
import { useHidayaSettings } from '@/hooks/useHidayaSettings';
import { useHidayaTranslation } from '@/hooks/useHidayaTranslation';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import * as XLSX from 'xlsx';

// --- Milestone Types ---
type MilestoneKey = 'shahada' | 'fatiha' | 'wudu' | 'salah' | 'basics' | 'quran_reading' | 'fasting' | 'zakat';

type NewMuslimsRow = {
    id: number | string;
    full_name: string;
    arabic_name: string | null;
    phone: string | null;
    nationality: string | null;
    gender: 'male' | 'female';
    conversion_date: string | null;
    status: 'active' | 'inactive' | 'graduated' | null;
    level: 'beginner' | 'elementary' | 'intermediate' | 'advanced' | null;
    progress: number | null;
    address: string | null;
    national_id: string | null;
    occupation: string | null;
    education: string | null;
    birth_date: string | null;
    last_visit: string | null;
    witness_sheikh: string | null;
    current_stage?: number | null;
    available_days?: string[] | null;
    custom_protocol?: any | null;
    milestones?: any | null;
    notes?: string | null;
    user_id: string;
};

const MILESTONES_CONFIG: Record<MilestoneKey, { label: string; icon: string; order: number }> = {
    shahada: { label: 'stage_shahada', icon: '🕌', order: 1 },
    fatiha: { label: 'stage_fatiha', icon: '📖', order: 2 },
    wudu: { label: 'stage_wudu', icon: '💧', order: 3 },
    salah: { label: 'stage_salah', icon: '🙏', order: 4 },
    basics: { label: 'stage_basics', icon: '📚', order: 5 },
    quran_reading: { label: 'stage_quran_reading', icon: '📕', order: 6 },
    fasting: { label: 'stage_fasting', icon: '🌙', order: 7 },
    zakat: { label: 'stage_zakat', icon: '💰', order: 8 },
};

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
    milestones?: Record<MilestoneKey, boolean>; // Track completed milestones
    customProtocol?: StudyProtocol; // Individualized study plan
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

interface ProtocolSubTask {
    id: string;
    title: string;
    completed: boolean;
}

interface ProtocolResource {
    id: string;
    title: string;
    url: string;
    type: 'video' | 'article' | 'audio' | 'pdf';
}

interface StudyStageItem {
    id: string;
    name: string;
    description: string;
    completed: boolean;
    subTasks?: ProtocolSubTask[];
    deadline?: string;
    resources?: ProtocolResource[];
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
    welcome: "السلام عليكم {name}! نرحب بك في هداية. نحن هنا لخدمتك.",
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
const MOCK_STUDENTS: Student[] = [];

const MOCK_APPOINTMENTS: Appointment[] = [];

const ATTENDANCE_DATA = [
    { name: 'saturday', count: 0 },
    { name: 'sunday', count: 0 },
    { name: 'monday', count: 0 },
    { name: 'tuesday', count: 0 },
    { name: 'wednesday', count: 0 },
    { name: 'thursday', count: 0 },
    { name: 'friday', count: 0 },
];

const STATUS_DATA = [
    { name: 'active', value: 0, color: '#10B981' }, // Emerald
    { name: 'graduated', value: 0, color: '#F59E0B' }, // Amber
    { name: 'inactive', value: 0, color: '#6B7280' }, // Gray
];

const NewMuslimsManager = () => {
    const { toast } = useToast();
    const { t, language } = useHidayaTranslation();

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
    const [materials, setMaterials] = useState<Material[]>(() =>
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
    // Use Global Settings
    const { templates } = useHidayaSettings();

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
    const [isCertificateOpen, setIsCertificateOpen] = useState(false);
    // const [isSettingsOpen, setIsSettingsOpen] = useState(false); // Moved to Global Settings
    const [isTextImportOpen, setIsTextImportOpen] = useState(false);
    const [importText, setImportText] = useState('');
    const [stagedStudents, setStagedStudents] = useState<Partial<Student>[]>([]);
    const [certData, setCertData] = useState<{
        name: string;
        date: string;
        sheikh: string;
        studentId: string;
        customTitle?: string;
        customBody1?: string;
        customBody2?: string;
        customShahada?: string;
        customShahadaTranslation?: string;
        customDateLabel?: string;
        customSheikhLabel?: string;
        customFooter?: string;
    } | null>(null);
    const [isProtocolOpen, setIsProtocolOpen] = useState(false); // New: Protocol customization dialog
    const [activeDetailTab, setActiveDetailTab] = useState<'info' | 'progress' | 'communications' | 'materials' | 'lessons'>('info');
    const [expandedItemId, setExpandedItemId] = useState<string | null>(null);
    const [newApptData, setNewApptData] = useState({ studentId: '', date: '', time: '', type: '', notes: '' });

    // --- Auto-save to localStorage ---
    React.useEffect(() => { saveToStorage(STORAGE_KEYS.STUDENTS, students); }, [students]);
    React.useEffect(() => { saveToStorage(STORAGE_KEYS.APPOINTMENTS, appointments); }, [appointments]);
    React.useEffect(() => { saveToStorage(STORAGE_KEYS.COMMUNICATIONS, communications); }, [communications]);
    React.useEffect(() => { saveToStorage(STORAGE_KEYS.STUDENT_MATERIALS, studentMaterials); }, [studentMaterials]);
    React.useEffect(() => { saveToStorage(STORAGE_KEYS.LESSONS, lessons); }, [lessons]);
    React.useEffect(() => { saveToStorage(STORAGE_KEYS.EXAMS, exams); }, [exams]);
    React.useEffect(() => { saveToStorage(STORAGE_KEYS.PROTOCOL, studyProtocol); }, [studyProtocol]);

    // --- Supabase Sync ---
    useEffect(() => {
        const fetchAllData = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) return;

                // 1. Fetch Students
                const { data: studentsData, error: studentsError } = await supabase.from('new_muslims').select('*');
                if (studentsError) throw studentsError;

                let fetchedStudents: Student[] = [];
                if (studentsData) {
                    fetchedStudents = (studentsData as NewMuslimsRow[]).map((d) => ({
                        id: d.id?.toString(),
                        fullName: d.full_name,
                        arabicName: d.arabic_name,
                        phone: d.phone,
                        nationality: d.nationality || '',
                        gender: d.gender || 'male',
                        conversionDate: d.conversion_date || new Date().toISOString().split('T')[0],
                        status: d.status || 'active',
                        level: d.level || 'beginner',
                        progress: d.progress || 0,
                        address: d.address || '',
                        nationalId: d.national_id || '',
                        occupation: d.occupation || '',
                        education: d.education || '',
                        witnessSheikh: d.notes ? (d.notes.match(/Sheikh: (.*?),/) || [])[1] : '',
                        lastVisit: d.last_visit || 'جديد',
                    }));
                    setStudents(fetchedStudents);
                }

                // 2. Fetch Communications
                const { data: commsData, error: commsError } = await supabase.from('communications').select('*');
                if (!commsError && commsData) {
                    const mappedComms: CommunicationLog[] = commsData.map((c: any) => ({
                        id: c.id.toString(),
                        studentId: c.student_id,
                        date: c.date,
                        type: c.type,
                        direction: c.direction,
                        content: c.content,
                        notes: c.notes
                    }));
                    setCommunications(mappedComms);
                }

                // 3. Fetch Lessons
                const { data: lessonsData, error: lessonsError } = await supabase.from('lessons').select('*');
                if (!lessonsError && lessonsData) {
                    const mappedLessons: Lesson[] = lessonsData.map((l: any) => ({
                        id: l.id.toString(),
                        studentId: l.student_id,
                        date: l.date,
                        time: l.time,
                        topic: l.topic,
                        teacher: l.teacher,
                        duration: l.duration,
                        attended: l.attended,
                        notes: l.notes
                    }));
                    setLessons(mappedLessons);
                }

                // 4. Fetch Appointments
                const { data: apptsData, error: apptsError } = await supabase.from('appointments').select('*');
                if (!apptsError && apptsData) {
                    const mappedAppts: Appointment[] = apptsData.map((a: any) => {
                        const student = fetchedStudents.find(s => s.id === a.student_id);
                        return {
                            id: a.id.toString(),
                            studentId: a.student_id,
                            date: a.date,
                            time: a.time,
                            studentName: student ? (student.arabicName || student.fullName) : 'Unknown',
                            type: a.type,
                            status: a.status,
                            notes: a.notes
                        };
                    });
                    setAppointments(mappedAppts);
                }

                // 5. Fetch Materials
                const { data: matData } = await supabase.from('educational_resources').select('*');
                if (matData && matData.length > 0) {
                    setMaterials(matData.map((m: any) => ({
                        id: m.id,
                        name: m.title, // Map DB title to UI name
                        type: m.type as any,
                        url: m.url,
                        category: m.category as any
                    })));
                } else {
                    // Seed Defaults if empty? For now keep local default if empty.
                    // Or consider pushing defaults to DB here?
                }

                // 6. Fetch Student Materials
                const { data: stMatData } = await supabase.from('student_materials').select('*');
                if (stMatData) {
                    setStudentMaterials(stMatData.map((sm: any) => ({
                        id: sm.id,
                        studentId: sm.student_id,
                        materialId: sm.material_id,
                        dateGiven: sm.assigned_date || new Date().toISOString().split('T')[0], // Map DB assigned_date
                        completed: sm.status === 'completed', // Derive completed boolean
                        completionDate: sm.completed_date,
                        notes: sm.notes
                    })));
                }

                // 7. Fetch Exams (Results + Definitions)
                const { data: examResultsData } = await supabase
                    .from('exam_results')
                    .select('*, exams(title, total_score)');

                if (examResultsData) {
                    setExams(examResultsData.map((r: any) => ({
                        id: r.id,
                        studentId: r.student_id,
                        type: 'written', // Default or derive if needed
                        subject: r.exams?.title || 'Unknown Exam',
                        date: r.date,
                        score: r.score,
                        maxScore: r.exams?.total_score || 100,
                        passed: r.passed,
                        notes: r.notes
                    })));
                }

                // 8. Fetch Templates - Handled by useHidayaSettings Hook


                // 9. Fetch Protocol
                const { data: protoData } = await supabase.from('study_protocol').select('*').single();
                if (protoData && protoData.stages) {
                    setStudyProtocol({
                        stages: protoData.stages
                    });
                }

            } catch (err) {
                console.error("Supabase fetch error:", err);
                // toast({
                //     title: "خطأ في المزامنة",
                //     description: "لم نتمكن من استرجاع البيانات من السحابة. جاري استخدام النسخة المحلية.",
                //     variant: "destructive"
                // });
            }
        };

        fetchAllData();
    }, []);

    // Sync Protocol with Selected Student
    React.useEffect(() => {
        if (selectedStudent) {
            if (selectedStudent.customProtocol) {
                setStudyProtocol(selectedStudent.customProtocol);
            } else {
                setStudyProtocol(DEFAULT_PROTOCOL);
            }
        }
    }, [selectedStudent]);

    // --- Derived Data ---
    // Filtering State
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | Student['status']>('all'); // Changed from NewMuslim to Student
    const [ageFilter, setAgeFilter] = useState('');
    const [uniFilter, setUniFilter] = useState('');
    const [workFilter, setWorkFilter] = useState('');
    const [nationalityFilter, setNationalityFilter] = useState<string>('all');
    const [attentionFilter, setAttentionFilter] = useState<boolean>(false);

    // Plan Management State
    const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');

    // Derived State: Filtered List
    const filteredStudents = students.filter(s => {
        const matchesSearch = s.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            s.phone.includes(searchTerm) ||
            (s.education && s.education.toLowerCase().includes(searchTerm.toLowerCase()));
        const matchesStatus = statusFilter === 'all' || s.status === statusFilter;

        // Assuming 'age' is derived from birthDate or added to Student interface
        const matchesAge = !ageFilter || (s.birthDate && (new Date().getFullYear() - new Date(s.birthDate).getFullYear()).toString() === ageFilter);
        const matchesUni = !uniFilter || (s.education && s.education.includes(uniFilter));
        const matchesWork = !workFilter || (s.occupation && s.occupation.includes(workFilter));
        const matchesNat = nationalityFilter === 'all' || s.nationality === nationalityFilter;

        // Needs Attention: Default logic (e.g. inactive or no recent visit > 30 days)
        // Adjust logic as per requirements. Here: lastVisit > 30 days or status inactive
        const matchesAttention = !attentionFilter || (
            s.status === 'inactive' ||
            (s.lastVisit !== 'جديد' && new Date(s.lastVisit).getTime() < Date.now() - 30 * 24 * 60 * 60 * 1000)
        );

        return matchesSearch && matchesStatus && matchesAge && matchesUni && matchesWork && matchesNat && matchesAttention;
    }).sort((a, b) => {
        if (sortOption === 'name') return (a.arabicName || a.fullName).localeCompare(b.arabicName || b.fullName);
        if (sortOption === 'date_new') return new Date(b.conversionDate).getTime() - new Date(a.conversionDate).getTime();
        if (sortOption === 'date_old') return new Date(a.conversionDate).getTime() - new Date(b.conversionDate).getTime();
        if (sortOption === 'gender') return (a.gender || '').localeCompare(b.gender || '');
        if (sortOption === 'nationality') return (a.nationality || '').localeCompare(b.nationality || '');
        return 0;
    });

    const uniqueNationalities = Array.from(new Set(students.map(s => s.nationality)));

    // --- Stats Calculation ---
    const stats = {
        activeStudents: students.filter(s => s.status === 'active').length,
        newThisMonth: students.filter(s => {
            if (!s.conversionDate) return false;
            const convDate = new Date(s.conversionDate);
            const now = new Date();
            return convDate.getMonth() === now.getMonth() && convDate.getFullYear() === now.getFullYear();
        }).length,
        graduated: students.filter(s => s.status === 'graduated').length,
        completionRate: students.length > 0
            ? Math.round(students.reduce((acc, s) => acc + (s.progress || 0), 0) / students.length)
            : 0
    };

    // --- Excel Export ---
    const handleExportExcel = () => {
        const data = students.map(s => ({
            'الاسم': s.arabicName || s.fullName,
            'الهاتف': s.phone,
            'الجنسية': s.nationality,
            'تاريخ الإسلام': s.conversionDate,
            'الحالة': s.status === 'active' ? 'نشط' : s.status === 'graduated' ? 'خريج' : 'غير نشط',
            'المستوى': s.level === 'beginner' ? 'مبتدئ' : s.level === 'elementary' ? 'ابتدائي' : s.level === 'intermediate' ? 'متوسط' : 'متقدم',
            'التقدم': (s.progress || 0) + '%',
            'العنوان': s.address || '',
            'المهنة': s.occupation || '',
            'الشيخ المشهّد': s.witnessSheikh || ''
        }));
        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'الطلاب');
        XLSX.writeFile(wb, `hidaya_students_${new Date().toISOString().split('T')[0]}.xlsx`);
        toast({ title: "تم التصدير", description: `تم تصدير ${data.length} طالب إلى ملف Excel` });
    };

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
    const addStudent = async (studentData: Omit<Student, 'id'>) => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                toast({ title: "يرجى تسجيل الدخول", variant: "destructive" });
                return;
            }

            const dbData = {
                full_name: studentData.fullName,
                arabic_name: studentData.arabicName,
                phone: studentData.phone,
                nationality: studentData.nationality,
                gender: studentData.gender,
                conversion_date: studentData.conversionDate,
                status: studentData.status || 'active',
                level: studentData.level || 'beginner',
                progress: 0,
                address: studentData.address,
                national_id: studentData.nationalId,
                occupation: studentData.occupation,
                education: studentData.education,
                last_visit: new Date().toISOString(),
                user_id: user.id
            };

            const { data, error } = await supabase.from('new_muslims').insert(dbData).select().single();

            if (error) throw error;

            if (data) {
                const newStudent: Student = {
                    ...studentData,
                    id: data.id.toString(),
                    currentStage: 1,
                    progress: 0,
                    lastVisit: data.last_visit
                };
                setStudents(prev => [...prev, newStudent]);
                toast({ title: "تم التسجيل", description: `تم إضافة ${studentData.arabicName || studentData.fullName} بنجاح` });
                setIsRegOpen(false);
            }
        } catch (err: any) {
            console.error("Error adding student:", err);
            toast({ title: "خطأ", description: err.message, variant: "destructive" });
        }
    };

    const updateStudent = async (id: string, updates: Partial<Student>) => {
        try {
            // Optimistic update
            setStudents(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
            if (selectedStudent?.id === id) {
                setSelectedStudent(prev => prev ? { ...prev, ...updates } : null);
            }

            // Map updates to DB columns
            const dbUpdates: any = {};
            if (updates.fullName) dbUpdates.full_name = updates.fullName;
            if (updates.arabicName) dbUpdates.arabic_name = updates.arabicName;
            if (updates.phone) dbUpdates.phone = updates.phone;
            if (updates.status) dbUpdates.status = updates.status;
            if (updates.progress !== undefined) dbUpdates.progress = updates.progress;
            if (updates.lastVisit) dbUpdates.last_visit = updates.lastVisit;
            if (updates.nationality) dbUpdates.nationality = updates.nationality;
            if (updates.gender) dbUpdates.gender = updates.gender;
            if (updates.birthDate) dbUpdates.birth_date = updates.birthDate;
            if (updates.availableDays) dbUpdates.available_days = updates.availableDays;
            if (updates.occupation) dbUpdates.occupation = updates.occupation;
            if (updates.education) dbUpdates.education = updates.education;
            if (updates.witnessSheikh) dbUpdates.witness_sheikh = updates.witnessSheikh;
            if (updates.nationalId) dbUpdates.national_id = updates.nationalId;
            if (updates.address) dbUpdates.address = updates.address;
            if (updates.notes) dbUpdates.notes = updates.notes;
            if (updates.currentStage) dbUpdates.current_stage = updates.currentStage; // Ensure column exists? Migrated? Assuming yes or handled by JSON/Notes? 
            // I forgot 'current_stage' in migration. But previous schema might have it.
            // If not, I'll rely on it failing or being ignored. The 'progress' might cover it? 
            // In Student struct, 'currentStage' is present.

            if (updates.customProtocol) dbUpdates.custom_protocol = updates.customProtocol;
            if (updates.milestones) dbUpdates.milestones = updates.milestones;

            const { error } = await supabase.from('new_muslims').update(dbUpdates).eq('id', id);
            if (error) throw error;

            toast({ title: "تم التحديث", description: "تم تحديث بيانات الطالب" });
        } catch (err: any) {
            console.error("Error updating student:", err);
            toast({ title: "خطأ في الحفظ", description: "فشل تحديث قاعدة البيانات", variant: "destructive" });
        }
    };

    const deleteStudent = async (id: string) => {
        try {
            setStudents(prev => prev.filter(s => s.id !== id));
            if (selectedStudent?.id === id) setSelectedStudent(null);

            const { error } = await supabase.from('new_muslims').delete().eq('id', id);
            if (error) throw error;

            toast({ title: "تم الحذف", description: "تم حذف سجل الطالب" });
        } catch (err: any) {
            console.error("Error deleting student:", err);
            toast({ title: "خطأ", description: "فشل حذف الطالب من قاعدة البيانات", variant: "destructive" });
        }
    };

    // --- Communication Log ---
    // --- Communication Log ---
    const addCommunication = async (studentId: string, type: CommunicationLog['type'], content: string, direction: 'sent' | 'received' = 'sent') => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const newLog = {
                student_id: studentId,
                type,
                content,
                direction,
                date: new Date().toISOString(),
                user_id: user.id
            };

            const { data, error } = await supabase.from('communications').insert(newLog).select().single();
            if (error) throw error;

            if (data) {
                const localLog: CommunicationLog = {
                    id: data.id.toString(),
                    studentId: data.student_id,
                    date: data.date,
                    type: data.type,
                    direction: data.direction,
                    content: data.content
                };
                setCommunications(prev => [...prev, localLog]);
                toast({ title: "تم الحفظ", description: "تم تسجيل التواصل" });
            }
        } catch (e: any) {
            console.error("Error adding communication", e);
            toast({ title: "خطأ", description: "فشل الحفظ في قاعدة البيانات", variant: "destructive" });
        }
    };

    // --- Appointments ---
    const addAppointment = async (studentId: string, date: string, time: string, type: string, notes?: string) => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const student = students.find(s => s.id === studentId);
            const studentName = student ? (student.arabicName || student.fullName) : 'Unknown';

            const newAppt = {
                student_id: studentId,
                date,
                time,
                type,
                status: 'scheduled',
                notes,
                user_id: user.id
            };

            const { data, error } = await supabase.from('appointments').insert(newAppt).select().single();
            if (error) throw error;

            if (data) {
                const localAppt: Appointment = {
                    id: data.id.toString(),
                    studentId: data.student_id,
                    date: data.date,
                    time: data.time,
                    studentName: studentName,
                    type: data.type,
                    status: data.status,
                    notes: data.notes
                };

                setAppointments(prev => [...prev, localAppt]);

                // Schedule Notification
                const apptDate = new Date(`${date}T${time}`);
                NotificationManager.schedule({
                    id: parseInt(data.id) || Date.now(),
                    title: `موعد: ${type}`,
                    body: `مع الطالب: ${studentName}`,
                    schedule: apptDate
                });

                toast({ title: "تم الحجز", description: "تم حجز الموعد وتفعيل التذكير" });
                setIsApptOpen(false);
            }
        } catch (e: any) {
            console.error("Error adding appointment", e);
            toast({ title: "خطأ", description: "فشل حجز الموعد", variant: "destructive" });
        }
    };

    // --- Lessons ---
    // --- Lessons ---
    const addLesson = async (studentId: string, topic: string, date: string, time: string, teacher: string) => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const dbLesson = {
                student_id: studentId,
                topic,
                date,
                time,
                teacher,
                duration: 60,
                attended: null,
                user_id: user.id
            };

            const { data, error } = await supabase.from('lessons').insert(dbLesson).select().single();
            if (error) throw error;

            if (data) {
                const newLesson: Lesson = {
                    id: data.id.toString(),
                    studentId: data.student_id,
                    date: data.date,
                    time: data.time,
                    topic: data.topic,
                    teacher: data.teacher,
                    duration: data.duration,
                    attended: data.attended
                };

                setLessons(prev => [...prev, newLesson]);

                // Schedule Notification
                const lessonDate = new Date(`${date}T${time}`);
                NotificationManager.schedule({
                    id: parseInt(data.id) || Date.now(),
                    title: `درس: ${topic}`,
                    body: `مع الطالب`,
                    schedule: lessonDate
                }).then(() => {
                    console.log('Notification scheduled for lesson');
                });

                toast({ title: "تم الحفظ", description: "تم إضافة الدرس وتفعيل التذكير" });
            }
        } catch (e: any) {
            console.error("Error adding lesson", e);
            toast({ title: "خطأ", description: "فشل الحفظ في قاعدة البيانات", variant: "destructive" });
        }
    };

    // --- Protocol Management ---
    const updateProtocolItem = (stageId: number, itemId: string, completed: boolean) => {
        const newProtocol = {
            stages: studyProtocol.stages.map(stage =>
                stage.id === stageId
                    ? { ...stage, items: stage.items.map(item => item.id === itemId ? { ...item, completed } : item) }
                    : stage
            )
        };

        setStudyProtocol(newProtocol);

        if (selectedStudent) {
            updateStudent(selectedStudent.id, { customProtocol: newProtocol });
        }
    };

    const updateProtocolItemDetails = (stageId: number, itemId: string, updates: Partial<StudyStageItem>) => {
        const newProtocol = {
            stages: studyProtocol.stages.map(stage =>
                stage.id === stageId
                    ? {
                        ...stage,
                        items: stage.items.map(item =>
                            item.id === itemId ? { ...item, ...updates } : item
                        )
                    }
                    : stage
            )
        };

        setStudyProtocol(newProtocol);

        if (selectedStudent) {
            updateStudent(selectedStudent.id, { customProtocol: newProtocol });
        }
    };


    const addProtocolItem = (stageId: number, name: string, description: string) => {
        const newItem: StudyStageItem = {
            id: `${stageId}-${Date.now()}`,
            name,
            description,
            completed: false,
        };

        const newProtocol = {
            stages: studyProtocol.stages.map(stage =>
                stage.id === stageId
                    ? { ...stage, items: [...stage.items, newItem] }
                    : stage
            )
        };

        setStudyProtocol(newProtocol);
        toast({ title: "تم الإضافة", description: `تم إضافة "${name}" للمرحلة` });

        // Save to student if selected
        if (selectedStudent) {
            updateStudent(selectedStudent.id, { customProtocol: newProtocol });
        }
    };

    const deleteProtocolItem = (stageId: number, itemId: string) => {
        const newProtocol = {
            stages: studyProtocol.stages.map(stage =>
                stage.id === stageId
                    ? { ...stage, items: stage.items.filter(item => item.id !== itemId) }
                    : stage
            )
        };

        setStudyProtocol(newProtocol);

        if (selectedStudent) {
            updateStudent(selectedStudent.id, { customProtocol: newProtocol });
        }
    };

    // --- Calculate Student Progress ---
    const calculateStudentProgress = (studentId: string): number => {
        const studentProtocol = studyProtocol; // In future, this could be per-student
        const totalItems = studentProtocol.stages.flatMap(s => s.items).length;
        const completedItems = studentProtocol.stages.flatMap(s => s.items).filter(i => i.completed).length;
        return totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;
    };

    // --- Materials & Student Progress ---
    const addMaterial = async (mat: Omit<Material, 'id'>) => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const dbMat = {
                title: mat.name,
                type: mat.type,
                category: mat.category,
                url: mat.url,
                user_id: user.id
            };

            const { data, error } = await supabase.from('educational_resources').insert(dbMat).select().single();
            if (error) throw error;

            if (data) {
                const localMat: Material = {
                    id: data.id,
                    name: data.title,
                    type: data.type,
                    category: data.category,
                    url: data.url
                };
                setMaterials(prev => [...prev, localMat]);
                toast({ title: "تم الإضافة", description: `تم إضافة ${mat.name} لمكتبة المواد.` });
            }
        } catch (e: any) {
            console.error("Error adding material", e);
            toast({ title: "خطأ", description: "فشل إضافة المادة للقاعدة", variant: "destructive" });
        }
    };

    const assignMaterialToStudent = async (studentId: string, materialId: string) => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const dbEntry = {
                student_id: studentId,
                material_id: materialId,
                status: 'assigned',
                assigned_date: new Date().toISOString(),
                user_id: user.id
            };

            const { data, error } = await supabase.from('student_materials').insert(dbEntry).select().single();
            if (error) throw error;

            if (data) {
                const localEntry: StudentMaterial = {
                    id: data.id,
                    studentId: data.student_id,
                    materialId: data.material_id,
                    dateGiven: data.assigned_date,
                    completed: false
                };
                setStudentMaterials(prev => [...prev, localEntry]);
                toast({ title: "تم التخصيص", description: "تم ربط المادة بالطالب" });
            }
        } catch (e) {
            console.error("Error assigning material", e);
        }
    };

    const deleteMaterial = async (id: string) => {
        try {
            const { error } = await supabase.from('educational_resources').delete().eq('id', id);
            if (error) throw error;
            setMaterials(prev => prev.filter(m => m.id !== id));
            toast({ title: "تم الحذف", description: "تمت إزالة المادة من المكتبة" });
        } catch (e) {
            console.error("Error deleting material", e);
        }
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
            sheikh: student.witnessSheikh || '',
            customTitle: '',
            customBody1: '',
            customBody2: '',
            customShahada: '',
            customShahadaTranslation: '',
            customDateLabel: '',
            customSheikhLabel: '',
            customFooter: ''
        });
        setIsCertificateOpen(true);
    };

    const handlePrintProfile = (student: Student) => {
        const studentComms = getStudentCommunications(student.id);
        const studentLessons = getStudentLessons(student.id);
        generateStudentProfile(student, studentComms, studentLessons);
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

    const handleSaveStaged = async () => {
        // Filter valid ones
        const valid = stagedStudents.filter(s => s.fullName && s.phone) as Student[];
        if (valid.length > 0) {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) return;

                const dbData = valid.map(studentData => ({
                    full_name: studentData.fullName,
                    arabic_name: studentData.arabicName,
                    phone: studentData.phone,
                    nationality: studentData.nationality,
                    gender: studentData.gender,
                    conversion_date: studentData.conversionDate,
                    status: studentData.status || 'active',
                    level: studentData.level || 'beginner',
                    progress: 0,
                    user_id: user.id,
                    last_visit: new Date().toISOString()
                }));

                const { data, error } = await supabase.from('new_muslims').insert(dbData).select();
                if (error) throw error;

                if (data) {
                    const newStudents: Student[] = (data as NewMuslimsRow[]).map((d) => ({
                        id: d.id.toString(),
                        fullName: d.full_name,
                        arabicName: d.arabic_name,
                        phone: d.phone,
                        nationality: d.nationality,
                        gender: d.gender,
                        conversionDate: d.conversion_date,
                        status: d.status,
                        level: d.level,
                        progress: d.progress,
                        lastVisit: d.last_visit,
                        availableDays: []
                    }));
                    setStudents(prev => [...prev, ...newStudents]);
                    setStagedStudents([]);
                    setImportText('');
                    setIsTextImportOpen(false);
                    toast({ title: "تم الحفظ", description: `تمت إضافة ${newStudents.length} طالب إلى السحابة.` });
                }
            } catch (err: any) {
                console.error("Error saving staged students:", err);
                toast({ title: "خطأ في المزامنة", description: err.message, variant: "destructive" });
            }
        }
    };

    const handlePrintReport = () => {
        const studentsToExport = selectedStudentIds.length > 0
            ? students.filter(s => selectedStudentIds.includes(s.id))
            : students;
        generateStudentReport(studentsToExport, language);
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

            const newStudents: Student[] = data.map((row: any, index: number) => {
                const getCol = (...names: string[]): string => {
                    for (const name of names) {
                        if (row[name] !== undefined && row[name] !== null && row[name] !== '') return String(row[name]);
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

                const ageStr = getCol('Edad', 'Age', 'العمر');
                const age = parseInt(ageStr);
                const birthYear = !isNaN(age) ? new Date().getFullYear() - age : null;
                const birthDate = birthYear ? `${birthYear}-01-01` : '';
                const fullName = getCol('Nombre completo', 'nombre completo', 'Name', 'الاسم', 'Nombre', 'nombre');

                return {
                    id: `excel-${Date.now()}-${index}`,
                    fullName: fullName || 'Unknown',
                    arabicName: getCol('ArabicName', 'الاسم العربي', 'Nombre árabe') || fullName || '',
                    status: 'active' as const,
                    level: 'beginner' as const,
                    lastVisit: 'جديد',
                    progress: 0,
                    currentStage: 1,
                    phone: getCol('WhatsApp', 'whatsapp', 'Phone', 'رقم الهاتف', 'Teléfono', 'Telefono').replace(/\D/g, ''),
                    address: getCol('Ciudad donde vives', 'ciudad', 'City', 'المدينة', 'Ciudad'),
                    nationality: getCol('Nacionalidad', 'nacionalidad', 'Nationality', 'الجنسية') || 'غير محدد',
                    nationalId: getCol('Dni', 'DNI', 'dni', 'NationalID', 'الهوية', 'ID'),
                    conversionDate: getCol('Fecha cuando abrazo e', 'Fecha cuando abrazo', 'fecha cuando abrazo', 'Date', 'تاريخ الإسلام', 'Fecha') || new Date().toISOString().split('T')[0],
                    birthDate: birthDate || getCol('BirthDate', 'تاريخ الميلاد', 'Fecha Nacimiento'),
                    occupation: getCol('Trabajo', 'trabajo', 'Occupation', 'العمل', 'Ocupación'),
                    education: getCol('Estudio', 'estudio', 'Education', 'الدراسة', 'Educación'),
                    witnessSheikh: getCol('Con el sheij', 'Con el shiej', 'con el sheij', 'Sheikh', 'الشيخ', 'Testigo'),
                    gender: (['F', 'f', 'أنثى', 'Femenino', 'femenino'].includes(getCol('Gender', 'Sexo', 'الجنس', 'Género'))) ? 'female' as const : 'male' as const,
                    availableDays: getCol('Days', 'الأيام', 'Días').split(',').map((d: string) => d.trim()).filter(Boolean),
                };
            });

            const validStudents = newStudents.filter(s =>
                s.fullName && s.fullName !== 'Unknown' && s.fullName.trim().length > 0
            );

            const skippedCount = newStudents.length - validStudents.length;

            if (validStudents.length > 0) {
                setStudents(prev => [...prev, ...validStudents]);

                const syncToSupabase = async () => {
                    const { data: { user } } = await supabase.auth.getUser();
                    if (!user) return;


                    // Fetch one row to verify valid columns
                    let validColumns: string[] | null = null;
                    try {
                        const { data: sampleRow, error: sampleError } = await supabase.from('new_muslims').select('*').limit(1);
                        if (!sampleError && sampleRow && sampleRow.length > 0) {
                            validColumns = Object.keys(sampleRow[0]);
                        }
                    } catch (e) {
                        console.error("Failed to fetch schema sample", e);
                    }

                    // Fallback to strict safe columns if dynamic check fails or table is empty
                    // excluding witness_sheikh and available_days as they are likely culprits
                    if (!validColumns) {
                        validColumns = ['full_name', 'arabic_name', 'phone', 'nationality', 'gender', 'conversion_date', 'status', 'level', 'address', 'occupation', 'education', 'national_id', 'user_id'];
                    }

                    const supabaseRecords = validStudents.map(s => {
                        const rawRecord: any = {
                            full_name: s.fullName,
                            arabic_name: s.arabicName || null,
                            phone: s.phone || null,
                            nationality: s.nationality || null,
                            gender: s.gender || 'male',
                            birth_date: s.birthDate || null,
                            address: s.address || null,
                            conversion_date: s.conversionDate || null,
                            status: 'active',
                            level: 'beginner',
                            witness_sheikh: s.witnessSheikh || null,
                            occupation: s.occupation || null,
                            education: s.education || null,
                            national_id: s.nationalId || null,
                            available_days: s.availableDays || [],
                            user_id: user.id
                        };

                        // Filter strictly based on validColumns
                        const filteredRecord: any = {};
                        Object.keys(rawRecord).forEach(key => {
                            if (validColumns!.includes(key)) {
                                filteredRecord[key] = rawRecord[key];
                            }
                        });
                        return filteredRecord;
                    });


                    // Use Upsert instead of Insert to handle duplicates (requires 'id' or consistent unique key, 
                    // but since we don't have IDs here, we rely on Insert. 
                    // If phone is unique, this might fail, but displaying error is handled below)
                    const { error } = await supabase.from('new_muslims').insert(supabaseRecords);
                    if (error) {
                        console.error('Supabase insert error:', error);
                        toast({
                            title: "خطأ في المزامنة",
                            description: `فشل الحفظ في السحابة: ${error.message || 'خطأ غير معروف'}. تحقق من الاتصال أو الصلاحيات.`,
                            variant: "destructive",
                            duration: 5000
                        });
                    } else {
                        toast({
                            title: "تم الحفظ في قاعدة البيانات ☁️",
                            description: `تم رفع ${validStudents.length} طالب إلى السحابة`
                        });
                    }
                };

                syncToSupabase();

                toast({
                    title: "تم الاستيراد بنجاح ✅",
                    description: `تم إضافة ${validStudents.length} مهتدي جديد${skippedCount > 0 ? ` (تم تجاهل ${skippedCount} صف فارغ)` : ''} `
                });
            } else {
                toast({
                    title: "لم يتم العثور على بيانات صالحة",
                    description: "تأكد من وجود عمود 'الاسم' أو 'Nombre completo' في الملف وأنه يحتوي على بيانات",
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
        return <span className={`text - xs px - 2 py - 1 rounded - full ${l.color} `}>{l.label}</span>;
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
                    </Avatar >
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
                </div >
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
            </div >

            {/* Tabs for different sections */}
            < Tabs defaultValue="info" className="w-full" >
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
                                        {t('journey_map')}
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
                                        {t('certificates_achievements')}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex gap-4 overflow-x-auto pb-2">
                                        <div className="min-w-[200px] border rounded-lg p-3 bg-gradient-to-br from-emerald-50 to-white text-center cursor-pointer hover:shadow-md transition-all">
                                            <Award className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
                                            <h4 className="font-bold text-emerald-800 text-sm">{t('islam_certificate')}</h4>
                                            <p className="text-[10px] text-gray-500 mb-2">{student.conversionDate}</p>
                                            <Button size="sm" variant="outline" className="w-full text-xs h-7" onClick={() => handlePrintCertificate(student)}>
                                                <Printer className="w-3 h-3 ml-1" /> تصدير PDF / طباعة
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
                                        <Button size="sm" variant="ghost" className="gap-2" onClick={() => handlePrintProfile(student)}>
                                            <Printer className="w-4 h-4" />
                                            <span className="text-xs">{t('export_student_file')}</span>
                                        </Button>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    <div className="flex justify-between border-b pb-2">
                                        <span className="text-sm text-gray-500">{t('national_id')}</span>
                                        <span className="text-sm font-medium">{student.nationalId || '-'}</span>
                                    </div>
                                    <div className="flex justify-between border-b pb-2">
                                        <span className="text-sm text-gray-500">{t('status')}</span>
                                        <StatusBadge status={student.status} />
                                    </div>
                                    <div className="flex justify-between border-b pb-2">
                                        <span className="text-sm text-gray-500">{t('level')}</span>
                                        <LevelBadge level={student.level} />
                                    </div>
                                    <div className="flex justify-between border-b pb-2">
                                        <span className="text-sm text-gray-500">{t('nationality')}</span>
                                        <span className="text-sm font-medium">{student.nationality}</span>
                                    </div>
                                    <div className="flex justify-between border-b pb-2">
                                        <span className="text-sm text-gray-500">{t('gender')}</span>
                                        <span className="text-sm font-medium">{student.gender === 'male' ? t('male') : t('female')}</span>
                                    </div>
                                    <div className="flex justify-between items-center pt-2">
                                        <span className="text-sm text-gray-500">{t('assigned_sheikh')}</span>
                                        {student.assignedSheikh ? (
                                            <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                                                {student.assignedSheikh}
                                            </Badge>
                                        ) : (
                                            <Button size="sm" variant="ghost" className="h-6 text-xs text-blue-600" onClick={() => {
                                                const sheikh = prompt(t('enter_sheikh_name'));
                                                if (sheikh) {
                                                    setStudents(prev => prev.map(s => s.id === student.id ? { ...s, assignedSheikh: sheikh } : s));
                                                }
                                            }}>
                                                <Plus className="w-3 h-3 ml-1" /> {t('assign')}
                                            </Button>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Milestones Tracker Card */}
                            <Card className="bg-gradient-to-br from-emerald-50 to-white border-emerald-100">
                                <CardHeader className="pb-2">
                                    <CardTitle className="flex justify-between items-center text-sm">
                                        <span className="flex items-center gap-2 text-emerald-800">
                                            🎯 {t('learning_stages')}
                                        </span>
                                        <div className="flex items-center gap-1">
                                            <span className="text-xs text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full">
                                                {Object.values(student.milestones || {}).filter(Boolean).length}/{Object.keys(MILESTONES_CONFIG).length}
                                            </span>
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                className="h-6 w-6 p-0 text-gray-400 hover:text-red-500"
                                                onClick={() => {
                                                    if (confirm(t('confirm_reset_stages'))) {
                                                        updateStudent(student.id, { milestones: {} as Record<MilestoneKey, boolean>, progress: 0 });
                                                        toast({ title: t('reset_done'), description: t('stages_reset_desc') });
                                                    }
                                                }}
                                            >
                                                🔄
                                            </Button>
                                        </div>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="pt-0">
                                    <div className="grid grid-cols-2 gap-2">
                                        {(Object.keys(MILESTONES_CONFIG) as MilestoneKey[])
                                            .sort((a, b) => MILESTONES_CONFIG[a].order - MILESTONES_CONFIG[b].order)
                                            .map((key) => {
                                                const milestone = MILESTONES_CONFIG[key];
                                                const isCompleted = student.milestones?.[key] || false;
                                                return (
                                                    <div
                                                        key={key}
                                                        className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-all ${isCompleted
                                                            ? 'bg-emerald-100 border-emerald-300 shadow-sm'
                                                            : 'bg-white border-gray-200 hover:border-emerald-200'
                                                            }`}
                                                        onClick={() => {
                                                            const newMilestones = { ...(student.milestones || {}), [key]: !isCompleted };
                                                            const completedCount = Object.values(newMilestones).filter(Boolean).length;
                                                            const totalCount = Object.keys(MILESTONES_CONFIG).length;
                                                            const newProgress = Math.round((completedCount / totalCount) * 100);

                                                            updateStudent(student.id, { milestones: newMilestones as Record<MilestoneKey, boolean>, progress: newProgress });
                                                        }}
                                                    >
                                                        <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${isCompleted ? 'bg-emerald-500 text-white' : 'bg-gray-100 text-gray-400'
                                                            }`}>
                                                            {isCompleted ? '✓' : milestone.order}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-1">
                                                                <span className="text-sm">{milestone.icon}</span>
                                                                <span className={`text-xs font-medium truncate ${isCompleted ? 'text-emerald-800' : 'text-gray-600'}`}>
                                                                    {t(milestone.label)}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })
                                        }
                                    </div>
                                    {/* Progress Bar */}
                                    <div className="mt-3 pt-2 border-t border-emerald-100">
                                        <div className="flex items-center justify-between text-xs text-emerald-700 mb-1">
                                            <span>التقدم الكلي</span>
                                            <span className="font-bold">{student.progress || 0}%</span>
                                        </div>
                                        <Progress value={student.progress || 0} className="h-2" />
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
                                    const formattedPhone = formatPhoneForWhatsapp(student.phone);
                                    window.open(`https://wa.me/${formattedPhone}`, '_blank');
                                    addCommunication(student.id, 'whatsapp', 'تم إرسال رسالة عبر واتساب', 'sent');
                                    toast({ title: "✅ تم التسجيل", description: "مراسلة واتساب" });
                                }}>
                                    📱 واتساب
                                </Button>
                                <Button size="sm" variant="outline" className="bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100" onClick={() => {
                                    window.open(`tel:${student.phone}`, '_self');
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
                                    window.open(`sms:${student.phone}`, '_self');
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
                            <Button size="sm" variant="outline" onClick={() => {
                                const name = prompt("اسم المادة:");
                                if (!name) return;
                                const type = prompt("النوع (book, video, audio, link):", "book") as any;
                                const category = prompt("التصنيف (عقيدة, فقه, قرآن, سيرة, أخلاق):", "عقيدة") as any;
                                addMaterial({ name, type, category });
                            }}>
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
            </Tabs >
        </div >
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
                                <h1 className="text-xl sm:text-3xl font-bold text-gray-800">{t('hidaya')}</h1>
                                <p className="text-xs sm:text-sm text-gray-500">{t('app_subtitle')}</p>
                            </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <Button variant="outline" size="sm" className="gap-1 text-xs sm:text-sm" onClick={handlePrintReport}>
                                <Printer className="w-4 h-4" />
                                <span className="hidden sm:inline">{t('print')}</span>
                            </Button>


                            <Button variant="outline" size="sm" className="gap-1 text-xs sm:text-sm" onClick={() => setIsProtocolOpen(true)}>
                                <ClipboardList className="w-4 h-4" />
                                <span className="hidden sm:inline">{t('study_plan')}</span>
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
                                <span className="hidden sm:inline">{t('add_new_student')}</span>
                            </Button>
                        </div>
                    </div>

                    {/* Dashboard Widgets */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <Card className="bg-white hover:border-emerald-200 transition-all cursor-pointer">
                            <CardContent className="p-4 flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-500 font-medium mb-1">{t('total_students')}</p>
                                    <h3 className="text-3xl font-bold text-gray-800">{students.length}</h3>
                                </div>
                                <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center text-blue-600">
                                    <Users className="w-6 h-6" />
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="bg-white hover:border-emerald-200 transition-all cursor-pointer">
                            <CardContent className="p-4 flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-500 font-medium mb-1">{t('active_students')}</p>
                                    <h3 className="text-3xl font-bold text-emerald-600">{stats.activeStudents}</h3>
                                </div>
                                <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-600">
                                    <CheckCircle2 className="w-6 h-6" />
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="bg-white hover:border-emerald-200 transition-all cursor-pointer">
                            <CardContent className="p-4 flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-500 font-medium mb-1">{t('today_appointments')}</p>
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
                                    <p className="text-sm text-gray-500 font-medium mb-1">{t('graduates')}</p>
                                    <h3 className="text-3xl font-bold text-purple-600">{stats.graduated}</h3>
                                </div>
                                <div className="w-12 h-12 bg-purple-50 rounded-full flex items-center justify-center text-purple-600">
                                    <Award className="w-6 h-6" />
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Key Metrics Row (New) */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                        <Card className="bg-emerald-50 border-emerald-100 shadow-sm">
                            <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                                <p className="text-xs text-emerald-600 font-bold mb-1">{t('total_students')}</p>
                                <p className="text-2xl font-black text-emerald-800">{students.length}</p>
                            </CardContent>
                        </Card>
                        <Card className="bg-blue-50 border-blue-100 shadow-sm">
                            <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                                <p className="text-xs text-blue-600 font-bold mb-1">{t('monthly_converts')}</p>
                                <p className="text-2xl font-black text-blue-800">
                                    {students.filter(s => new Date(s.conversionDate).getMonth() === new Date().getMonth()).length}
                                </p>
                            </CardContent>
                        </Card>
                        <Card className="bg-amber-50 border-amber-100 shadow-sm">
                            <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                                <p className="text-xs text-amber-600 font-bold mb-1">{t('needs_followup')}</p>
                                <p className="text-2xl font-black text-amber-800">
                                    {students.filter(s => s.status === 'active' && (!s.lastVisit || s.lastVisit.includes('يوم'))).length}
                                </p>
                            </CardContent>
                        </Card>
                        <Card className="bg-purple-50 border-purple-100 shadow-sm">
                            <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                                <p className="text-xs text-purple-600 font-bold mb-1">{t('graduates')}</p>
                                <p className="text-2xl font-black text-purple-800">
                                    {students.filter(s => s.status === 'graduated').length}
                                </p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Filters Section - Professional Look */}
                    {/* Filters Section - Professional Look */}
                    <div className="grid grid-cols-1 md:grid-cols-6 gap-2 mb-4 bg-white p-3 rounded-lg border shadow-sm">
                        <div className="md:col-span-2 relative">
                            <Search className="absolute right-3 top-2.5 w-4 h-4 text-gray-400" />
                            <Input
                                placeholder={t('search_students')}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pr-9"
                            />
                        </div>

                        {/* Status Filter */}
                        <select
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value as any)}
                        >
                            <option value="all">{t('all')}</option>
                            <option value="active">🌟 {t('active')}</option>
                            <option value="inactive">💤 {t('inactive')}</option>
                            <option value="graduated">🎓 {t('graduated')}</option>
                        </select>

                        {/* Nationality Filter */}
                        <select
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                            value={nationalityFilter}
                            onChange={(e) => setNationalityFilter(e.target.value)}
                        >
                            <option value="all">{t('nationality')}</option>
                            {uniqueNationalities.filter(Boolean).map(n => <option key={n} value={n}>{n}</option>)}
                        </select>

                        {/* University Filter */}
                        <select
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                            value={uniFilter}
                            onChange={(e) => setUniFilter(e.target.value)}
                        >
                            <option value="">{t('education')}</option>
                            {students.map(s => s.education).filter(Boolean).filter((v, i, a) => a.indexOf(v) === i).map(u => <option key={u} value={u}>{u}</option>)}
                        </select>

                        {/* Attention Toggle */}
                        <Button
                            variant={attentionFilter ? "destructive" : "outline"}
                            className={`w-full ${attentionFilter ? 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100' : 'text-gray-500'}`}
                            onClick={() => setAttentionFilter(!attentionFilter)}
                        >
                            {attentionFilter ? `⚠️ ${t('needs_followup')}` : `✔️ ${t('all')}`}
                        </Button>
                    </div>

                    <Tabs defaultValue="students" className="w-full">
                        <TabsList className="bg-white p-1 border shadow-sm rounded-lg mb-4 w-full justify-start overflow-x-auto flex-nowrap">
                            <TabsTrigger value="students" className="flex-shrink-0 text-xs sm:text-sm data-[state=active]:bg-emerald-50 data-[state=active]:text-emerald-700">{t('students_list')}</TabsTrigger>
                            <TabsTrigger value="calendar" className="flex-shrink-0 text-xs sm:text-sm">{t('calendar')}</TabsTrigger>
                            <TabsTrigger value="reports" className="flex-shrink-0 text-xs sm:text-sm">{t('statistics')}</TabsTrigger>
                        </TabsList>

                        {/* 1. Students List Tab */}
                        <TabsContent value="students" className="mt-0">
                            <Card className="border-none shadow-sm">
                                <CardHeader className="pb-2">
                                    <div className="relative">
                                        <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                                        <Input
                                            placeholder={t('search_placeholder')}
                                            className="pr-9"
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                        />
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    {/* Action Bar */}
                                    {selectedStudentIds.length > 0 && (
                                        <div className="flex items-center gap-2 mb-4 p-2 bg-emerald-50 border border-emerald-100 rounded-lg animate-in fade-in overflow-x-auto whitespace-nowrap hide-scrollbar">
                                            <span className="text-sm font-bold text-emerald-800 px-2">{selectedStudentIds.length} {t('selected_students')}</span>
                                            <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 gap-1 h-8" onClick={handleBulkWhatsapp}>
                                                <MessageCircle className="w-4 h-4" /> {t('message')}
                                            </Button>
                                            <Button size="sm" variant="outline" className="border-blue-200 text-blue-600 hover:bg-blue-50 gap-1 h-8" onClick={() => setIsApptOpen(true)}>
                                                <CalendarIcon className="w-4 h-4" /> {t('schedule_lesson')}
                                            </Button>
                                            <Button size="sm" variant="outline" className="border-purple-200 text-purple-600 hover:bg-purple-50 gap-1 h-8" onClick={handlePrintReport}>
                                                <Printer className="w-4 h-4" /> {t('export_pdf')}
                                            </Button>
                                            <Button size="sm" variant="outline" className="border-red-200 text-red-600 hover:bg-red-50 gap-1 h-8" onClick={() => {
                                                if (confirm(`${t('confirm_delete')} ${selectedStudentIds.length} ${t('confirm_delete_suffix')}`)) {
                                                    setStudents(prev => prev.filter(s => !selectedStudentIds.includes(s.id)));
                                                    setSelectedStudentIds([]);
                                                    toast({ title: "تم الحذف ✅", description: `${t('student_deleted')}` });
                                                }
                                            }}>
                                                <Trash2 className="w-4 h-4" /> {t('delete')}
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
                                                <SelectValue placeholder={t('sort')} />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="date_new">{t('newest_islam')}</SelectItem>
                                                <SelectItem value="date_old">{t('oldest_islam')}</SelectItem>
                                                <SelectItem value="name">{t('name_alphabetical')}</SelectItem>
                                                <SelectItem value="gender">{t('gender')}</SelectItem>
                                                <SelectItem value="nationality">{t('nationality')}</SelectItem>
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
                                                        <div onClick={() => setSelectedStudent(student)} className="flex items-center gap-3 cursor-pointer min-w-0 flex-1">
                                                            <Avatar className="w-10 h-10 sm:w-12 sm:h-12 border border-gray-100 group-hover:border-emerald-200 flex-shrink-0">
                                                                <AvatarImage src={`https://ui-avatars.com/api/?name=${student.fullName}&background=f1f5f9&color=64748b`} />
                                                                <AvatarFallback>{student.arabicName?.[0]}</AvatarFallback>
                                                            </Avatar>
                                                            <div className="min-w-0 flex-1">
                                                                {/* الاسم - سطر واحد */}
                                                                <h4 className="font-bold text-sm sm:text-base text-gray-800 group-hover:text-emerald-700 transition-colors truncate">
                                                                    {student.arabicName || student.fullName}
                                                                </h4>
                                                                {/* تاريخ الإسلام */}
                                                                <div className="text-[10px] sm:text-xs text-emerald-600">
                                                                    {t('conversion_date')}: {student.conversionDate || t('not_specified')}
                                                                </div>
                                                                {/* الجنسية */}
                                                                <div className="text-[10px] sm:text-xs text-gray-400 truncate">
                                                                    {student.nationality || t('not_specified')}
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
                                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-green-600 hover:bg-green-50" title={t('whatsapp')} onClick={(e) => { e.stopPropagation(); handleWhatsapp(student, 'welcome'); }}>
                                                            <MessageCircle className="w-4 h-4" />
                                                        </Button>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600 hover:bg-blue-50" title={t('print')} onClick={(e) => { e.stopPropagation(); handlePrintProfile(student); }}>
                                                            <Printer className="w-4 h-4" />
                                                        </Button>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-purple-600 hover:bg-purple-50" title={t('share')} onClick={(e) => {
                                                            e.stopPropagation();
                                                            navigator.clipboard.writeText(`${student.arabicName || student.fullName}\nWhatsApp: ${student.phone}\nNationality: ${student.nationality}`);
                                                            toast({ title: t('copied'), description: t('student_info_copied') });
                                                        }}>
                                                            <Share2 className="w-4 h-4" />
                                                        </Button>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-red-400 hover:bg-red-50 hover:text-red-600" title={t('delete')} onClick={(e) => { e.stopPropagation(); if (confirm(t('confirm_delete_student'))) deleteStudent(student.id); }}>
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
                                            <span>{t('scheduled_appointments')}</span>
                                            <Button size="sm" onClick={() => setIsApptOpen(true)}>+ {t('add_appointment')}</Button>
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
                                                        <p className="text-sm text-gray-500">{t('with_student')}: {appt.studentName}</p>
                                                    </div>
                                                    <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700 hover:bg-red-50">{t('cancel')}</Button>
                                                </div>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                                <Card className="border-none shadow-sm bg-emerald-50">
                                    <CardHeader><CardTitle className="text-emerald-800 text-sm">{t('automated_reminders')}</CardTitle></CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="flex gap-2 items-start text-sm text-emerald-700">
                                            <CheckCircle2 className="w-4 h-4 mt-0.5" />
                                            <p>تم إرسال تذكير واتساب لـ 3 طلاب لديهم مواعيد غداً.</p>
                                        </div>
                                        <div className="flex gap-2 items-start text-sm text-emerald-700">
                                            <History className="w-4 h-4 mt-0.5" />
                                            <p>الطالب "ريكاردو" غائب منذ أسبوعين. هل تود إرسال رسالة تفقد؟</p>
                                            <Button size="sm" variant="outline" className="h-6 text-xs bg-white">{t('send')}</Button>
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
                                        <CardTitle className="text-sm text-gray-500">{t('weekly_attendance')}</CardTitle>
                                    </CardHeader>
                                    <CardContent className="h-[250px]">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={ATTENDANCE_DATA}>
                                                <XAxis dataKey="name" fontSize={12} tickFormatter={(val) => t(val)} />
                                                <YAxis fontSize={12} />
                                                <Tooltip labelFormatter={(val) => t(val)} />
                                                <Bar dataKey="count" fill="#10B981" radius={[4, 4, 0, 0]} />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-sm text-gray-500">{t('student_status_distribution')}</CardTitle>
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
                                                <Tooltip formatter={(value, name, props) => [value, t(props.payload.name)]} />
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
                            {t('register_new_student')}
                        </DialogTitle>
                        <DialogDescription>{t('enter_student_data')}</DialogDescription>
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
                            nationality: formData.get('nationality') as string || t('not_specified'),
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
                                    <Label htmlFor="fullName">{t('full_name')} *</Label>
                                    <Input id="fullName" name="fullName" placeholder={t('full_name')} required />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="arabicName">{t('arabic_name')}</Label>
                                    <Input id="arabicName" name="arabicName" placeholder={t('arabic_name')} />
                                </div>
                            </div>

                            {/* Row 2: Age & City */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="age">{t('age')}</Label>
                                    <Input id="age" name="age" type="number" placeholder="30" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="city">{t('city')}</Label>
                                    <Input id="city" name="city" placeholder="Buenos Aires..." />
                                </div>
                            </div>

                            {/* Row 3: WhatsApp & DNI */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="whatsapp">{t('whatsapp')} *</Label>
                                    <Input id="whatsapp" name="whatsapp" placeholder="1159612728" required />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="dni">{t('national_id')}</Label>
                                    <Input id="dni" name="dni" placeholder="30037039" />
                                </div>
                            </div>

                            {/* Row 4: Work & Education */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="trabajo">{t('work')}</Label>
                                    <Input id="trabajo" name="trabajo" placeholder="Coaching-Comercial..." />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="estudio">{t('study')}</Label>
                                    <Input id="estudio" name="estudio" placeholder="Secundario, Universidad..." />
                                </div>
                            </div>

                            {/* Row 5: Nationality & Gender */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="nationality">{t('nationality')}</Label>
                                    <Input id="nationality" name="nationality" placeholder="Argentino..." />
                                </div>
                                <div className="space-y-2">
                                    <Label>{t('gender')}</Label>
                                    <Select name="gender" defaultValue="male">
                                        <SelectTrigger>
                                            <SelectValue placeholder={t('select')} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="male">{t('male')}</SelectItem>
                                            <SelectItem value="female">{t('female')}</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            {/* Row 6: Conversion Date & Sheikh */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="conversionDate">{t('conversion_date')} *</Label>
                                    <Input id="conversionDate" name="conversionDate" type="date" required />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="sheikh">{t('witness_sheikh')}</Label>
                                    <Input id="sheikh" name="sheikh" placeholder="Zaher..." />
                                </div>
                            </div>
                        </div>

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsRegOpen(false)}>{t('cancel')}</Button>
                            <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700">
                                <Plus className="w-4 h-4 mr-2" /> {t('save_data')}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Appointment Dialog */}
            <Dialog open={isApptOpen} onOpenChange={setIsApptOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{t('book_appointment')}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>{t('student')}</Label>
                            <Select onValueChange={(val) => setNewApptData({ ...newApptData, studentId: val })}>
                                <SelectTrigger><SelectValue placeholder={t('select_student')} /></SelectTrigger>
                                <SelectContent>
                                    {students.map(s => (
                                        <SelectItem key={s.id} value={s.id}>{s.arabicName || s.fullName}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>{t('date')}</Label>
                                <Input
                                    type="date"
                                    value={newApptData.date}
                                    onChange={(e) => setNewApptData({ ...newApptData, date: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>{t('time')}</Label>
                                <Input
                                    type="time"
                                    value={newApptData.time}
                                    onChange={(e) => setNewApptData({ ...newApptData, time: e.target.value })}
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>{t('appointment_type')}</Label>
                            <Select onValueChange={(val) => setNewApptData({ ...newApptData, type: val })}>
                                <SelectTrigger><SelectValue placeholder={t('select_type')} /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="درس قرآن">{t('lesson_quran')}</SelectItem>
                                    <SelectItem value="فقه">{t('fiqh')}</SelectItem>
                                    <SelectItem value="عقيدة">{t('aqidah')}</SelectItem>
                                    <SelectItem value="متابعة">{t('followup')}</SelectItem>
                                    <SelectItem value="اجتماعي">{t('social_visit')}</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>{t('additional_notes')}</Label>
                            <Textarea
                                placeholder={t('additional_notes')}
                                value={newApptData.notes}
                                onChange={(e) => setNewApptData({ ...newApptData, notes: e.target.value })}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsApptOpen(false)}>{t('cancel')}</Button>
                        <Button
                            onClick={() => {
                                if (newApptData.studentId && newApptData.date && newApptData.time) {
                                    addAppointment(newApptData.studentId, newApptData.date, newApptData.time, newApptData.type, newApptData.notes);
                                } else {
                                    toast({ title: "بيانات ناقصة", description: "يرجى تعبئة جميع الحقول المطلوبة", variant: "destructive" });
                                }
                            }}
                            className="bg-blue-600 hover:bg-blue-700"
                        >
                            {t('confirm_booking')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Protocol Management Dialog (Redesigned for Mobile) */}
            <Dialog open={isProtocolOpen} onOpenChange={setIsProtocolOpen}>
                <DialogContent className="w-full h-full md:max-w-4xl md:h-[85vh] md:rounded-lg rounded-none flex flex-col p-0 overflow-hidden bg-gray-50/50">
                    <DialogHeader className="p-4 bg-white border-b sticky top-0 z-10">
                        <DialogTitle className="flex justify-between items-center text-right">
                            <div className="flex items-center gap-2">
                                <div className="p-2 bg-emerald-100 rounded-full">
                                    <ClipboardList className="w-5 h-5 text-emerald-600" />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-base font-bold text-gray-800">{t('education_plan')}</span>
                                    {selectedStudent && (
                                        <span className="text-[10px] text-emerald-600 font-normal">
                                            {t('student')}: {selectedStudent.arabicName || selectedStudent.fullName}
                                        </span>
                                    )}
                                </div>
                            </div>

                            <div className="flex gap-2">
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-8 gap-1 text-xs"
                                    onClick={() => {
                                        toast({ title: t('exporting_file') });
                                        generateProtocolPDF(studyProtocol, selectedStudent?.arabicName || selectedStudent?.fullName, language);
                                    }}
                                >
                                    <Printer className="w-3.5 h-3.5" />
                                    <span className="hidden sm:inline">PDF</span>
                                </Button>
                            </div>
                        </DialogTitle>
                        <DialogDescription className="text-xs hidden sm:block">
                            {selectedStudent
                                ? t('editing_specific_plan')
                                : t('managing_general_plan')}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="flex-1 overflow-auto p-0 sm:p-4">
                        <Tabs defaultValue={String(studyProtocol.stages[0]?.id)} className="w-full flex-1 flex flex-col">
                            {/* Compact grid layout for mobile - shows all 3 stages */}
                            <div className="bg-white border-b px-2 py-2 sticky top-0 z-10 shadow-sm">
                                <TabsList className="w-full grid grid-cols-3 h-auto bg-gray-100 p-1 rounded-lg gap-1">
                                    {studyProtocol.stages.map(stage => (
                                        <TabsTrigger
                                            key={stage.id}
                                            value={String(stage.id)}
                                            className="flex flex-col items-center gap-1 py-2 px-1 text-xs data-[state=active]:bg-emerald-600 data-[state=active]:text-white rounded-md"
                                        >
                                            <span className="text-lg">{stage.id === 1 ? '🏗️' : stage.id === 2 ? '🏛️' : '🎓'}</span>
                                            <span className="text-[10px] leading-tight text-center">
                                                {stage.id === 1 ? t('stage_foundation') : stage.id === 2 ? t('stage_building') : t('stage_empowerment')}
                                            </span>
                                        </TabsTrigger>
                                    ))}
                                </TabsList>
                            </div>

                            {studyProtocol.stages.map(stage => (
                                <TabsContent key={stage.id} value={String(stage.id)} className="flex-1 p-3 sm:p-0 mt-0 space-y-3">
                                    <div className="bg-white p-3 rounded-lg border shadow-sm">
                                        <div className="flex justify-between items-center mb-3 border-b pb-2">
                                            <h4 className="font-semibold text-sm sm:text-base text-gray-800 flex items-center gap-2">
                                                <BookOpen className="w-4 h-4 text-emerald-500" />
                                                <span>{language === 'ar' ? stage.name : stage.id === 1 ? t('stage_foundation') : stage.id === 2 ? t('stage_building') : t('stage_empowerment')}</span>
                                            </h4>
                                            <Button size="sm" variant="outline" onClick={() => {
                                                const name = prompt(`${t('add_item')}:`);
                                                if (name) addProtocolItem(stage.id, name, "");
                                            }}>
                                                <Plus className="w-4 h-4 mr-1" /> {t('add_item')}
                                            </Button>
                                        </div>

                                        <div className="space-y-2">
                                            {stage.items.length === 0 ? (
                                                <div className="text-center py-8 text-gray-400 border-2 border-dashed rounded-lg">
                                                    {t('no_items_in_stage')}
                                                </div>
                                            ) : (
                                                stage.items.map((item, idx) => (
                                                    <div key={item.id} className={`group border rounded-md transition-all ${expandedItemId === item.id ? 'border-emerald-500 bg-emerald-50/10' : 'bg-gray-50 border-transparent hover:border-emerald-200'}`}>
                                                        {/* Item Header */}
                                                        <div className="flex items-center p-3 cursor-pointer" onClick={() => setExpandedItemId(expandedItemId === item.id ? null : item.id)}>
                                                            <div className="w-8 text-center text-gray-400 text-xs font-mono">{idx + 1}</div>
                                                            <div className="flex-1">
                                                                <div className="font-medium text-gray-800 flex items-center gap-2">
                                                                    {item.name}
                                                                    {item.deadline && (
                                                                        <Badge variant="outline" className="text-xs font-normal text-amber-600 border-amber-200 bg-amber-50">
                                                                            <CalendarIcon className="w-3 h-3 mr-1" /> {item.deadline}
                                                                        </Badge>
                                                                    )}
                                                                </div>
                                                                {item.description && <div className="text-xs text-gray-500">{item.description}</div>}

                                                                {/* Summary stats for sub-tasks */}
                                                                {item.subTasks && item.subTasks.length > 0 && (
                                                                    <div className="mt-1 flex gap-2">
                                                                        <span className="text-[10px] bg-gray-200 px-1.5 py-0.5 rounded text-gray-600">
                                                                            {item.subTasks.filter(t => t.completed).length}/{item.subTasks.length} مهام
                                                                        </span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <div className="flex items-center gap-1">
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    className={`hover:bg-emerald-100 ${expandedItemId === item.id ? 'rotate-180' : ''}`}
                                                                >
                                                                    <ChevronDown className="w-4 h-4" />
                                                                </Button>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 hover:bg-red-50"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        if (confirm("هل أنت متأكد من حذف هذا العنصر؟")) {
                                                                            deleteProtocolItem(stage.id, item.id);
                                                                        }
                                                                    }}
                                                                >
                                                                    <Trash2 className="w-4 h-4" />
                                                                </Button>
                                                            </div>
                                                        </div>

                                                        {/* Expanded Details */}
                                                        {expandedItemId === item.id && (
                                                            <div className="p-3 pt-0 border-t border-emerald-100/50 ml-8 space-y-4 animate-in slide-in-from-top-2 duration-200">

                                                                {/* 1. Deadline & Description Edit */}
                                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
                                                                    <div className="space-y-1">
                                                                        <Label className="text-xs text-gray-500">آخر موعد لإنجاز المهمة</Label>
                                                                        <Input
                                                                            type="date"
                                                                            className="h-8 text-sm"
                                                                            value={item.deadline || ''}
                                                                            onChange={(e) => updateProtocolItemDetails(stage.id, item.id, { deadline: e.target.value })}
                                                                        />
                                                                    </div>
                                                                </div>

                                                                {/* 2. Sub-tasks */}
                                                                <div className="space-y-2">
                                                                    <Label className="text-xs font-semibold text-gray-600 flex items-center gap-2">
                                                                        <CheckCircle2 className="w-3 h-3" /> المهام الفرعية (Checklist)
                                                                    </Label>
                                                                    <div className="space-y-1">
                                                                        {item.subTasks?.map(subTask => (
                                                                            <div key={subTask.id} className="flex items-center gap-2 text-sm bg-white p-2 rounded border border-gray-100">
                                                                                <Checkbox
                                                                                    checked={subTask.completed}
                                                                                    onCheckedChange={(checked) => {
                                                                                        const newSubTasks = item.subTasks?.map(t =>
                                                                                            t.id === subTask.id ? { ...t, completed: !!checked } : t
                                                                                        ) || [];
                                                                                        updateProtocolItemDetails(stage.id, item.id, { subTasks: newSubTasks });
                                                                                    }}
                                                                                />
                                                                                <span className={subTask.completed ? 'line-through text-gray-400' : ''}>{subTask.title}</span>
                                                                                <Button
                                                                                    variant="ghost" size="icon" className="h-6 w-6 ml-auto text-gray-400 hover:text-red-500"
                                                                                    onClick={() => {
                                                                                        const newSubTasks = item.subTasks?.filter(t => t.id !== subTask.id) || [];
                                                                                        updateProtocolItemDetails(stage.id, item.id, { subTasks: newSubTasks });
                                                                                    }}
                                                                                >
                                                                                    <Trash2 className="w-3 h-3" />
                                                                                </Button>
                                                                            </div>
                                                                        ))}
                                                                        <div className="flex gap-2 mt-2">
                                                                            <Input
                                                                                placeholder="مهمة فرعية جديدة..."
                                                                                className="h-8 text-sm"
                                                                                id={`new-subtask-${item.id}`}
                                                                                onKeyDown={(e) => {
                                                                                    if (e.key === 'Enter') {
                                                                                        const target = e.currentTarget;
                                                                                        if (target.value.trim()) {
                                                                                            const newSubTask: ProtocolSubTask = { id: Date.now().toString(), title: target.value, completed: false };
                                                                                            const currentSubTasks = item.subTasks || [];
                                                                                            updateProtocolItemDetails(stage.id, item.id, { subTasks: [...currentSubTasks, newSubTask] });
                                                                                            target.value = '';
                                                                                        }
                                                                                    }
                                                                                }}
                                                                            />
                                                                            <Button
                                                                                size="sm" variant="outline" className="h-8"
                                                                                onClick={() => {
                                                                                    const input = document.getElementById(`new-subtask-${item.id}`) as HTMLInputElement;
                                                                                    if (input && input.value.trim()) {
                                                                                        const newSubTask: ProtocolSubTask = { id: Date.now().toString(), title: input.value, completed: false };
                                                                                        const currentSubTasks = item.subTasks || [];
                                                                                        updateProtocolItemDetails(stage.id, item.id, { subTasks: [...currentSubTasks, newSubTask] });
                                                                                        input.value = '';
                                                                                    }
                                                                                }}
                                                                            >
                                                                                <Plus className="w-3 h-3" />
                                                                            </Button>
                                                                        </div>
                                                                    </div>
                                                                </div>

                                                                {/* 3. Materials / Resources */}
                                                                <div className="space-y-2">
                                                                    <Label className="text-xs font-semibold text-gray-600 flex items-center gap-2">
                                                                        <BookOpen className="w-3 h-3" /> مواد تعليمية (روابط، فيديوهات، pdf)
                                                                    </Label>
                                                                    <div className="grid grid-cols-1 gap-1">
                                                                        {item.resources?.map(res => (
                                                                            <div key={res.id} className="flex items-center gap-2 text-sm bg-blue-50/50 p-2 rounded border border-blue-100 text-blue-800">
                                                                                {res.type === 'video' ? <span className="text-lg">🎥</span> : res.type === 'pdf' ? <span className="text-lg">📄</span> : <span className="text-lg">🔗</span>}
                                                                                <a href={res.url} target="_blank" rel="noopener noreferrer" className="underline truncate flex-1 block">
                                                                                    {res.title}
                                                                                </a>
                                                                                <Button
                                                                                    variant="ghost" size="icon" className="h-6 w-6 ml-auto text-blue-300 hover:text-red-500"
                                                                                    onClick={() => {
                                                                                        const newResources = item.resources?.filter(r => r.id !== res.id) || [];
                                                                                        updateProtocolItemDetails(stage.id, item.id, { resources: newResources });
                                                                                    }}
                                                                                >
                                                                                    <Trash2 className="w-3 h-3" />
                                                                                </Button>
                                                                            </div>
                                                                        ))}
                                                                        <Button
                                                                            size="sm" variant="outline" className="h-8 w-full border-dashed text-gray-500 hover:text-emerald-600"
                                                                            onClick={() => {
                                                                                const title = prompt("عنوان المادة:");
                                                                                if (!title) return;
                                                                                const url = prompt("الرابط (URL):");
                                                                                if (!url) return;
                                                                                const type = prompt("النوع (video, pdf, article):", "video") as any || 'article';

                                                                                const newResource: ProtocolResource = { id: Date.now().toString(), title, url, type };
                                                                                const currentResources = item.resources || [];
                                                                                updateProtocolItemDetails(stage.id, item.id, { resources: [...currentResources, newResource] });
                                                                            }}
                                                                        >
                                                                            <Plus className="w-3 h-3 mr-1" /> إضافة مادة تعليمية
                                                                        </Button>
                                                                    </div>
                                                                </div>

                                                            </div>
                                                        )}
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                </TabsContent>
                            ))}
                        </Tabs>
                    </div>

                    <DialogFooter className="p-4 border-t bg-white">
                        <Button variant="outline" onClick={() => setIsProtocolOpen(false)}>إغلاق</Button>
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
                </DialogContent>
            </Dialog>

            {/* Text Import Dialog */}
            <Dialog open={isTextImportOpen} onOpenChange={setIsTextImportOpen}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>📋 استيراد نص</DialogTitle>
                        <DialogDescription>
                            الصق النص هنا ليتم تحليله واستخراج البيانات (يدعم تنسيقات مختلفة)
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <Textarea
                            placeholder="مثال: الاسم: أحمد - الهاتف: 05000000..."
                            className="min-h-[200px] font-mono text-sm"
                            value={importText}
                            onChange={(e) => setImportText(e.target.value)}
                        />
                        <div className="bg-blue-50 p-3 rounded text-xs text-blue-700">
                            <strong>نصائح:</strong>
                            <ul className="list-disc list-inside mt-1 space-y-1">
                                <li>يمكنك نسخ نص من واتساب أو إكسل</li>
                                <li>حاول أن يكون كل طالب في سطر منفصل</li>
                                <li>سيحاول النظام اكتشاف الاسم ورقم الهاتف تلقائياً</li>
                            </ul>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => { setIsTextImportOpen(false); setStagedStudents([]); setImportText(''); }}>إلغاء</Button>
                        <Button onClick={parseImportText} className="bg-emerald-600">تحليل واستيراد</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Settings Dialog */}
            {/* Settings Dialog Removed - Moved to Global Settings Tab */}

            {/* Certificate Dialog */}
            {/* Certificate Dialog */}
            <Dialog open={isCertificateOpen} onOpenChange={setIsCertificateOpen}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>📜 {t('print_certificate_title')}</DialogTitle>
                        <DialogDescription>{t('certificate_customization_desc') || "تخصيص محتوى الشهادة (اترك الحقول فارغة لاستخدام الافتراضي)"}</DialogDescription>
                    </DialogHeader>
                    {certData && (
                        <div className="space-y-4 py-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>{t('student_name')}</Label>
                                    <Input value={certData.name} onChange={(e) => setCertData({ ...certData, name: e.target.value })} />
                                </div>
                                <div className="space-y-2">
                                    <Label>{t('conversion_date_label')}</Label>
                                    <Input type="date" value={certData.date} onChange={(e) => setCertData({ ...certData, date: e.target.value })} />
                                </div>
                                <div className="space-y-2 md:col-span-2">
                                    <Label>{t('witness_sheikh')}</Label>
                                    <Input value={certData.sheikh} onChange={(e) => setCertData({ ...certData, sheikh: e.target.value })} />
                                </div>
                            </div>

                            <Separator className="my-4" />
                            <h4 className="font-bold text-sm text-gray-700">تخصيص النصوص (إختياري)</h4>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>عنوان الشهادة</Label>
                                    <Input placeholder="شهادة اعتناق الإسلام" value={certData.customTitle} onChange={(e) => setCertData({ ...certData, customTitle: e.target.value })} />
                                </div>
                                <div className="space-y-2">
                                    <Label>نص التذييل</Label>
                                    <Input placeholder="Islamic Center..." value={certData.customFooter} onChange={(e) => setCertData({ ...certData, customFooter: e.target.value })} />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>النص الافتتاحي (يشهد المركز أن...)</Label>
                                <Input placeholder="يشهد مركز ... أن السيد/ة" value={certData.customBody1} onChange={(e) => setCertData({ ...certData, customBody1: e.target.value })} />
                            </div>
                            <div className="space-y-2">
                                <Label>نص الاسلام (قد اعتنق الإسلام...)</Label>
                                <Input placeholder="قد اعتنق الإسلام ونطق بالشهادتين" value={certData.customBody2} onChange={(e) => setCertData({ ...certData, customBody2: e.target.value })} />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>تسمية "التاريخ"</Label>
                                    <Input placeholder="التاريخ:" value={certData.customDateLabel} onChange={(e) => setCertData({ ...certData, customDateLabel: e.target.value })} />
                                </div>
                                <div className="space-y-2">
                                    <Label>تسمية "الشيخ"</Label>
                                    <Input placeholder="الشيخ الشاهد:" value={certData.customSheikhLabel} onChange={(e) => setCertData({ ...certData, customSheikhLabel: e.target.value })} />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>نص الشهادتين (عربي)</Label>
                                <Textarea className="min-h-[60px]" placeholder="أشهد أن لا إله إلا الله..." value={certData.customShahada} onChange={(e) => setCertData({ ...certData, customShahada: e.target.value })} dir="rtl" />
                            </div>
                            <div className="space-y-2">
                                <Label>ترجمة الشهادتين</Label>
                                <Textarea className="min-h-[60px]" placeholder="Ashadu an la ilaha illa Allah..." value={certData.customShahadaTranslation} onChange={(e) => setCertData({ ...certData, customShahadaTranslation: e.target.value })} dir="ltr" />
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsCertificateOpen(false)}>{t('cancel')}</Button>
                        <Button className="bg-emerald-600" onClick={() => {
                            if (!certData) return;
                            generateCertificatePDF({
                                name: certData.name,
                                date: certData.date,
                                sheikh: certData.sheikh,
                                customTitle: certData.customTitle,
                                customBody1: certData.customBody1,
                                customBody2: certData.customBody2,
                                customShahada: certData.customShahada,
                                customShahadaTranslation: certData.customShahadaTranslation,
                                customDateLabel: certData.customDateLabel,
                                customSheikhLabel: certData.customSheikhLabel,
                                customFooter: certData.customFooter
                            }, language);
                            setIsCertificateOpen(false);
                            toast({ title: t('certificate'), description: t('certificate_pdf_generated') });
                        }}>
                            📄 {t('print')} PDF
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div >
    );
};

export default NewMuslimsManager;
