import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import {
    Smartphone, Watch, Wifi, Bluetooth, Usb, Share2, Upload, Download,
    FileText, AppWindow, Send, RefreshCw, Link, QrCode, HardDrive,
    Laptop, Box, Plus, Trash2, Check, Copy, Grid, List as ListIcon,
    Folder, Image as ImageIcon, Music, Video, File, ArrowLeft, Search,
    MoreVertical, Eye, Calendar, Clock, ChevronRight, Home, X
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';

// --- Types ---
interface ConnectedDevice {
    id: string;
    name: string;
    type: 'phone' | 'watch' | 'tablet' | 'desktop';
    connection: 'wifi' | 'bluetooth' | 'adb';
    status: 'connected' | 'offline' | 'syncing';
    ip?: string;
    battery?: number;
    storageUsed?: string;
    storageTotal?: string;
}

interface FileSystemItem {
    id: string;
    name: string;
    type: 'folder' | 'image' | 'video' | 'audio' | 'pdf' | 'doc' | 'archive' | 'unknown';
    size: number; // in bytes
    modifiedAt: string;
    path: string;
    parentId: string | null;
}

// --- Mock Data ---
const DEVICES_MOCK: ConnectedDevice[] = [
    { id: '1', name: 'Galaxy Watch 6', type: 'watch', connection: 'bluetooth', status: 'connected', battery: 78, storageUsed: '4.2 GB', storageTotal: '16 GB' },
    { id: '2', name: 'Pixel 8 Pro', type: 'phone', connection: 'wifi', status: 'connected', ip: '192.168.1.105', battery: 92, storageUsed: '64 GB', storageTotal: '128 GB' },
];

// --- Mock Data (Initial State) ---
const INITIAL_FILES_MOCK: FileSystemItem[] = [
    // Root Folders
    { id: 'f1', name: 'DCIM', type: 'folder', size: 0, modifiedAt: '2024-01-01T10:00:00', path: '/DCIM', parentId: 'root' },
    { id: 'f2', name: 'Documents', type: 'folder', size: 0, modifiedAt: '2024-01-02T15:30:00', path: '/Documents', parentId: 'root' },
    { id: 'f3', name: 'Downloads', type: 'folder', size: 0, modifiedAt: '2024-01-03T09:20:00', path: '/Downloads', parentId: 'root' },
    // DCIM Items
    { id: 'p1', name: 'Camera', type: 'folder', size: 0, modifiedAt: '2024-01-01T10:00:00', path: '/DCIM/Camera', parentId: 'f1' },
    { id: 'i1', name: 'IMG_20240101.jpg', type: 'image', size: 4500000, modifiedAt: '2024-01-01T10:05:00', path: '/DCIM/Camera/IMG_20240101.jpg', parentId: 'p1' },
];

const formatSize = (bytes: number) => {
    if (bytes === 0 || bytes === null || isNaN(bytes)) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat(((bytes || 0) / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ar-SA', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
};

// --- Sub-components ---
const FileIcon = ({ type, className = "w-6 h-6" }: { type: string, className?: string }) => {
    switch (type) {
        case 'folder': return <Folder className={`${className} text-blue-500 fill-blue-500/20`} />;
        case 'image': return <ImageIcon className={`${className} text-purple-500`} />;
        case 'video': return <Video className={`${className} text-red-500`} />;
        case 'audio': return <Music className={`${className} text-pink-500`} />;
        case 'pdf': return <FileText className={`${className} text-red-600`} />;
        case 'archive': return <Box className={`${className} text-yellow-600`} />;
        case 'doc': return <FileText className={`${className} text-blue-400`} />;
        default: return <File className={`${className} text-gray-400`} />;
    }
};

const ConnectivityManager = () => {
    const { toast } = useToast();
    const [devices, setDevices] = useState<ConnectedDevice[]>(DEVICES_MOCK);
    const [selectedDevice, setSelectedDevice] = useState<string | null>(null);
    const [mainView, setMainView] = useState<'files' | 'apps' | 'sync'>('files');

    // File Browser State
    const [files, setFiles] = useState<FileSystemItem[]>(() => {
        const saved = localStorage.getItem('baraka_files_fs');
        return saved ? JSON.parse(saved) : INITIAL_FILES_MOCK;
    });

    useEffect(() => {
        localStorage.setItem('baraka_files_fs', JSON.stringify(files));
    }, [files]);

    // File Browser State
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
    const [sortBy, setSortBy] = useState<'name' | 'date' | 'size'>('name');
    const [currentPath, setCurrentPath] = useState<string>('/');
    const [currentFolderId, setCurrentFolderId] = useState<string>('root');
    const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [fileHistory, setFileHistory] = useState<{ id: string, path: string }[]>([{ id: 'root', path: '/' }]);
    const [previewFile, setPreviewFile] = useState<FileSystemItem | null>(null);
    const [importData, setImportData] = useState<any>(null);

    // Device Discovery & APK State
    const [showAddDeviceDialog, setShowAddDeviceDialog] = useState(false);
    const [isScanning, setIsScanning] = useState(false);
    const [discoveredDevices, setDiscoveredDevices] = useState<{ id: string, name: string, type: 'phone' | 'watch' | 'headset', connection: string }[]>([]);
    const [installingApk, setInstallingApk] = useState(false);
    const [installedApps, setInstalledApps] = useState<{ id: number, name: string, pkg: string, ver: string }[]>([
        { id: 1, name: 'Application 1', pkg: 'com.example.app1', ver: 'v1.1.0' },
        { id: 2, name: 'Application 2', pkg: 'com.example.app2', ver: 'v1.2.0' },
    ]);

    // Sync State
    const [shareCode, setShareCode] = useState('');

    // --- Logic ---
    // --- Logic ---
    const visibleFiles = files.filter(f => {
        if (searchQuery) return f.name.toLowerCase().includes(searchQuery.toLowerCase());
        return f.parentId === currentFolderId;
    }).sort((a, b) => {
        if (a.type === 'folder' && b.type !== 'folder') return -1;
        if (a.type !== 'folder' && b.type === 'folder') return 1;
        switch (sortBy) {
            case 'size': return b.size - a.size;
            case 'date': return new Date(b.modifiedAt).getTime() - new Date(a.modifiedAt).getTime();
            default: return a.name.localeCompare(b.name);
        }
    });

    const handleNavigate = (folderId: string, folderName: string) => {
        if (folderId === 'root') {
            setCurrentFolderId('root');
            setCurrentPath('/');
            setFileHistory([{ id: 'root', path: '/' }]);
            return;
        }
        const folder = files.find(f => f.id === folderId);
        if (folder) {
            setCurrentFolderId(folderId);
            setCurrentPath(folder.path);
            setFileHistory(prev => {
                const index = prev.findIndex(h => h.id === folderId);
                if (index !== -1) return prev.slice(0, index + 1);
                return [...prev, { id: folderId, path: folder.path }];
            });
        }
    };

    const handleBack = () => {
        if (fileHistory.length > 1) {
            const newHistory = [...fileHistory];
            newHistory.pop();
            const prev = newHistory[newHistory.length - 1];
            setCurrentFolderId(prev.id);
            setCurrentPath(prev.path);
            setFileHistory(newHistory);
        }
    };

    const toggleSelection = (id: string, multi: boolean) => {
        if (multi) {
            setSelectedFiles(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
        } else {
            setSelectedFiles(prev => prev.includes(id) && prev.length === 1 ? [] : [id]);
        }
    };

    const handleCreateFolder = () => {
        const name = prompt('اسم المجلد الجديد:');
        if (name && name.trim()) {
            const newFolder: FileSystemItem = {
                id: crypto.randomUUID(),
                name: name.trim(),
                type: 'folder',
                size: 0,
                modifiedAt: new Date().toISOString(),
                path: currentPath === '/' ? `/${name}` : `${currentPath}/${name}`,
                parentId: currentFolderId
            };
            setFiles([...files, newFolder]);
            toast({ title: '✅ تم إنشاء المجلد', description: name });
        }
    };

    const handleUploadFile = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const uploaded = Array.from(e.target.files).map(file => ({
                id: crypto.randomUUID(),
                name: file.name,
                type: file.type.startsWith('image') ? 'image' : file.type.startsWith('video') ? 'video' : 'unknown',
                size: file.size,
                modifiedAt: new Date().toISOString(),
                path: currentPath === '/' ? `/${file.name}` : `${currentPath}/${file.name}`,
                parentId: currentFolderId
            } as FileSystemItem));

            setFiles([...files, ...uploaded]);
            toast({ title: '✅ تم رفع الملفات', description: `تمت إضافة ${uploaded.length} ملف` });
        }
    };

    const handleDeleteSelected = () => {
        if (confirm(`هل أنت متأكد من حذف ${selectedFiles.length} عنصر؟`)) {
            setFiles(files.filter(f => !selectedFiles.includes(f.id)));
            setSelectedFiles([]);
            toast({ title: '🗑️ تم الحذف' });
        }
    };

    const handleShareContext = () => {
        const code = Math.random().toString(36).substring(2, 8).toUpperCase();
        setShareCode(code);
    };

    const handleExportData = async () => {
        toast({ title: 'جاري التصدير...', description: 'يتم تجميع البيانات' });
        try {
            // LocalStorage Data
            const routines = JSON.parse(localStorage.getItem('baraka_routines') || '[]');
            const goals = JSON.parse(localStorage.getItem('baraka_financial_goals') || '[]');
            const customLocations = JSON.parse(localStorage.getItem('baraka_custom_locations') || '[]');

            // Supabase Data (Appointments) - Fetching logic
            const { data: { user } } = await supabase.auth.getUser();
            let appointments = [];
            if (user) {
                const { data } = await supabase.from('appointments').select('*').eq('user_id', user.id);
                if (data) appointments = data;
            }

            const exportBundle = {
                version: 1,
                timestamp: new Date().toISOString(),
                type: 'barakah_export',
                data: {
                    routines,
                    goals,
                    customLocations,
                    appointments
                }
            };

            // Download
            const blob = new Blob([JSON.stringify(exportBundle, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `barakah_export_${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            toast({ title: '✅ تم التصدير بنجاح' });
        } catch (e) {
            console.error(e);
            toast({ title: 'خطأ في التصدير', variant: 'destructive' });
        }
    };

    const handleImportData = async (file: File) => {
        try {
            const text = await file.text();
            const json = JSON.parse(text);
            if (json.type !== 'barakah_export') {
                toast({ title: 'ملف غير صالح', description: 'هذا الملف ليس ملف بيانات بركة', variant: 'destructive' });
                return;
            }
            setImportData(json.data);
        } catch (e) {
            toast({ title: 'خطأ في قراءة الملف', variant: 'destructive' });
        }
    };

    const handleApplyImport = () => {
        if (!importData) return;

        try {
            // Apply localStorage items
            if (importData.routines) localStorage.setItem('baraka_routines', JSON.stringify(importData.routines));
            if (importData.goals) localStorage.setItem('baraka_financial_goals', JSON.stringify(importData.goals));
            if (importData.customLocations) localStorage.setItem('baraka_custom_locations', JSON.stringify(importData.customLocations));

            // Refresh Events
            window.dispatchEvent(new CustomEvent('routines-updated'));

            toast({ title: '✅ تم استيراد البيانات', description: 'تم تحديث النظام بالبيانات الجديدة' });
            setImportData(null);
        } catch (e) {
            console.error(e);
            toast({ title: 'خطأ في الاستيراد', variant: 'destructive' });
        }
    };

    const handleAddDevice = (name: string, type: 'phone' | 'watch' | 'tablet' | 'desktop', ip: string) => {
        const newDevice: ConnectedDevice = {
            id: crypto.randomUUID(),
            name,
            type,
            connection: ip ? 'wifi' : 'bluetooth',
            status: 'connected',
            ip,
            battery: 100,
            storageUsed: '0 GB',
            storageTotal: 'Unknown'
        };
        setDevices(prev => [...prev, newDevice]);
        setSelectedDevice(newDevice.id);
        setMainView('files');
        setShowAddDeviceDialog(false);
        toast({ title: '✅ تم إضافة الجهاز', description: `تم حفظ ${name} بنجاح` });
    };



    const handleInstallApk = (file: File) => {
        if (!file.name.endsWith('.apk')) {
            toast({ title: 'ملف غير صالح', description: 'يرجى اختيار ملف APK', variant: 'destructive' });
            return;
        }
        setInstallingApk(true);
        toast({ title: 'جاري التثبيت...', description: `يتم تثبيت ${file.name}` });

        // Simulate installation
        setTimeout(() => {
            const newApp = {
                id: Date.now(),
                name: file.name.replace('.apk', ''),
                pkg: `com.barakah.app.${Date.now()}`,
                ver: 'v1.0.0'
            };
            setInstalledApps(prev => [...prev, newApp]);
            setInstallingApk(false);
            toast({ title: '✅ تم التثبيت بنجاح', description: `تم تثبيت ${file.name} على الجهاز` });
        }, 3000);
    };

    return (
        <div className="flex h-[80vh] bg-white rounded-lg overflow-hidden border">
            {/* Sidebar */}
            <div className="w-64 bg-gray-50 border-l flex flex-col">
                <div className="p-4 border-b bg-white/50 backdrop-blur">
                    <h3 className="font-bold text-gray-700 mb-4 px-2">الأجهزة المتصلة</h3>
                    <div className="space-y-2">
                        {devices.map(device => (
                            <div
                                key={device.id}
                                onClick={() => setSelectedDevice(device.id)}
                                className={`p-3 rounded-lg cursor-pointer transition-all flex items-center gap-3 ${selectedDevice === device.id ? 'bg-indigo-100 text-indigo-700 ring-1 ring-indigo-200' : ''}`}
                            >
                                {device.type === 'phone' ? <Smartphone className="w-5 h-5" /> :
                                    device.type === 'watch' ? <Watch className="w-5 h-5 ml-0.5" /> : <Laptop className="w-5 h-5" />}
                                <div className="flex-1 overflow-hidden">
                                    <div className="font-medium text-sm truncate">{device.name}</div>
                                    <div className="flex items-center gap-2 text-[10px] opacity-70">
                                        <Badge variant={device.status === 'connected' ? 'default' : 'secondary'} className="h-4 px-1 text-[9px]">
                                            {device.connection}
                                        </Badge>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        className="w-full mt-4 border-dashed text-gray-500"
                        onClick={() => setShowAddDeviceDialog(true)}
                    >
                        <Plus className="w-4 h-4 ml-2" /> إضافة جهاز
                    </Button>
                </div>

                <div className="p-4 flex-1 overflow-y-auto">
                    <h3 className="font-bold text-gray-500 text-xs mb-3 px-2">إدارة النظام</h3>
                    <nav className="space-y-1">
                        <button
                            onClick={() => setMainView('files')}
                            className={`w-full flex items-center gap-3 px-3 py-2 text-sm rounded-md transition-colors ${mainView === 'files' ? 'bg-blue-100 text-blue-700 font-medium' : 'text-gray-600'}`}
                        >
                            <Folder className="w-4 h-4" /> مدير الملفات
                        </button>
                        <button
                            onClick={() => setMainView('apps')}
                            className={`w-full flex items-center gap-3 px-3 py-2 text-sm rounded-md transition-colors ${mainView === 'apps' ? 'bg-purple-100 text-purple-700 font-medium' : 'text-gray-600'}`}
                        >
                            <AppWindow className="w-4 h-4" /> التطبيقات المثبتة
                        </button>
                        <button
                            onClick={() => setMainView('sync')}
                            className={`w-full flex items-center gap-3 px-3 py-2 text-sm rounded-md transition-colors ${mainView === 'sync' ? 'bg-emerald-100 text-emerald-700 font-medium' : 'text-gray-600'}`}
                        >
                            <RefreshCw className="w-4 h-4" /> المزامنة والربط
                        </button>
                    </nav>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col bg-white">

                {/* View: File Manager */}
                {mainView === 'files' && (
                    <>
                        <div className="h-14 border-b flex items-center justify-between px-4 bg-white sticky top-0 z-10">
                            <div className="flex items-center gap-2 flex-1">
                                <Button variant="ghost" size="icon" disabled={fileHistory.length <= 1} onClick={handleBack}>
                                    <ArrowLeft className="w-5 h-5 text-gray-600" />
                                </Button>
                                {selectedDevice && (
                                    <Badge variant="secondary" className="hidden sm:flex items-center gap-1 text-indigo-600 bg-indigo-50 border-indigo-100 whitespace-nowrap ml-2">
                                        <Smartphone className="w-3 h-3" />
                                        {devices.find(d => d.id === selectedDevice)?.name}
                                    </Badge>
                                )}
                                <div className="flex items-center bg-gray-100 rounded-md px-3 py-1.5 text-sm text-gray-600 flex-1 max-w-xl">
                                    <span className="text-gray-400 mr-2"><Home className="w-4 h-4" /></span>
                                    <div className="flex items-center gap-1 overflow-hidden" dir="ltr">
                                        {fileHistory.map((h, i) => (
                                            <React.Fragment key={h.id}>
                                                {i > 0 && <span className="text-gray-400">/</span>}
                                                <button onClick={() => handleNavigate(h.id, '')} className={`truncate ${i === fileHistory.length - 1 ? 'font-bold text-gray-900' : ''}`}>
                                                    {h.path.split('/').pop() || 'الجذر'}
                                                </button>
                                            </React.Fragment>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="relative">
                                    <Button variant="outline" size="sm" className="gap-2 h-8">
                                        <Upload className="w-4 h-4" /> رفع
                                    </Button>
                                    <input type="file" multiple className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleUploadFile} />
                                </div>
                                <Button variant="outline" size="sm" onClick={handleCreateFolder} className="gap-2 h-8">
                                    <Plus className="w-4 h-4" /> مجلد
                                </Button>
                                {selectedFiles.length > 0 && (
                                    <Button variant="destructive" size="sm" onClick={handleDeleteSelected} className="gap-2 h-8">
                                        <Trash2 className="w-4 h-4" /> حذف ({selectedFiles.length})
                                    </Button>
                                )}
                                <div className="w-px h-6 bg-gray-200 mx-2" />
                                <Button variant="ghost" size="sm" onClick={() => setViewMode('list')} className={viewMode === 'list' ? 'bg-gray-100' : ''}><ListIcon className="w-4 h-4" /></Button>
                                <Button variant="ghost" size="sm" onClick={() => setViewMode('grid')} className={viewMode === 'grid' ? 'bg-gray-100' : ''}><Grid className="w-4 h-4" /></Button>
                            </div>
                        </div>

                        {!selectedDevice ? (
                            <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
                                <Smartphone className="w-16 h-16 mb-4 opacity-20" />
                                <p className="text-lg font-medium">اختر جهازاً لاستعراض ملفاته</p>
                            </div>
                        ) : (
                            <ScrollArea className="flex-1 bg-white p-4">
                                {viewMode === 'grid' ? (
                                    <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-4">
                                        {visibleFiles.map(file => (
                                            <div
                                                key={file.id}
                                                onClick={() => toggleSelection(file.id, false)}
                                                onDoubleClick={() => file.type === 'folder' ? handleNavigate(file.id, file.name) : setPreviewFile(file)}
                                                className={`group p-4 rounded-xl border flex flex-col items-center text-center gap-3 cursor-pointer ${selectedFiles.includes(file.id) ? 'border-blue-500 bg-blue-50' : ''}`}
                                            >
                                                <FileIcon type={file.type} className="w-12 h-12" />
                                                <div className="text-sm font-medium truncate w-full" dir="ltr">{file.name}</div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <table className="w-full text-sm text-right">
                                        <thead className="bg-gray-50 text-gray-500"><tr><th className="p-3">الاسم</th><th className="p-3">الحجم</th><th className="p-3">التاريخ</th></tr></thead>
                                        <tbody>
                                            {visibleFiles.map(file => (
                                                <tr key={file.id}
                                                    onClick={() => toggleSelection(file.id, false)}
                                                    onDoubleClick={() => file.type === 'folder' ? handleNavigate(file.id, file.name) : setPreviewFile(file)}
                                                    className={`cursor-pointer ${selectedFiles.includes(file.id) ? 'bg-blue-50' : ''}`}
                                                >
                                                    <td className="p-3 flex items-center gap-3"><FileIcon type={file.type} className="w-5 h-5" /><span dir="ltr">{file.name}</span></td>
                                                    <td className="p-3 dir-ltr text-gray-500">{file.type === 'folder' ? '-' : formatSize(file.size)}</td>
                                                    <td className="p-3 dir-ltr text-gray-500">{formatDate(file.modifiedAt)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}
                            </ScrollArea>
                        )}
                    </>
                )}

                {/* View: Apps */}
                {mainView === 'apps' && (
                    !selectedDevice ? (
                        <div className="flex-1 flex flex-col items-center justify-center text-gray-400 h-full mt-20">
                            <Smartphone className="w-16 h-16 mb-4 opacity-20" />
                            <p className="text-lg font-medium">اختر جهازاً لإدارة التطبيقات</p>
                        </div>
                    ) : (
                        <div className="p-6 space-y-6">
                            <div className="flex items-center justify-between">
                                <h2 className="text-xl font-bold flex items-center gap-2"><AppWindow className="w-6 h-6 text-purple-600" /> إدارة التطبيقات</h2>
                                <div className="relative">
                                    <Button disabled={installingApk} className="bg-purple-600 hover:bg-purple-700">
                                        {installingApk ? <RefreshCw className="w-4 h-4 ml-2 animate-spin" /> : <Upload className="w-4 h-4 ml-2" />}
                                        {installingApk ? 'جاري التثبيت...' : 'تثبيت APK'}
                                    </Button>
                                    <input
                                        type="file"
                                        accept=".apk"
                                        className="absolute inset-0 opacity-0 cursor-pointer"
                                        onChange={(e) => {
                                            if (e.target.files?.[0]) handleInstallApk(e.target.files[0]);
                                            e.target.value = '';
                                        }}
                                        disabled={installingApk}
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {installedApps.map(app => (
                                    <div key={app.id} className="flex items-center p-3 border rounded-lg bg-gray-50 transition-colors">
                                        <div className="w-10 h-10 min-w-10 bg-purple-100 rounded-lg flex items-center justify-center mr-3"><Box className="w-5 h-5 text-purple-600" /></div>
                                        <div className="flex-1 overflow-hidden">
                                            <h4 className="font-bold text-sm truncate">{app.name}</h4>
                                            <p className="text-xs text-gray-500 truncate">{app.pkg} • {app.ver}</p>
                                        </div>
                                        <Button variant="ghost" size="sm" className="text-red-500" onClick={() => {
                                            setInstalledApps(prev => prev.filter(a => a.id !== app.id));
                                            toast({ title: 'تم الحذف', description: `تم إزالة ${app.name}` });
                                        }}>حذف</Button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )
                )}

                {/* View: Sync */}
                {mainView === 'sync' && (
                    <div className="p-6 space-y-6 flex flex-col items-center justify-center h-full overflow-y-auto">
                        <div className="bg-emerald-50 p-8 rounded-full mb-6 relative group">
                            <RefreshCw className="w-16 h-16 text-emerald-500 animate-pulse" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-800">مركز المزامنة</h2>
                        <p className="text-gray-500 max-w-md text-center mb-6">شارك بياناتك، إعداداتك، وأوضاعك مع الأجهزة الأخرى عبر الشبكة أو ملفات النسخ الاحتياطي.</p>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-xl">
                            {/* Share Code Card */}
                            <Card className="border-2 border-emerald-100 bg-emerald-50/30">
                                <CardHeader>
                                    <CardTitle className="text-base flex items-center gap-2"><QrCode className="w-4 h-4" /> المشاركة السريعة</CardTitle>
                                    <CardDescription>إنشاء رمز للربط المباشر</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    {shareCode ? (
                                        <div className="text-center space-y-2">
                                            <div className="text-2xl font-mono font-bold tracking-widest text-emerald-600 bg-white p-2 rounded border border-emerald-200">{shareCode}</div>
                                            <Button variant="outline" size="sm" className="w-full" onClick={() => { navigator.clipboard.writeText(shareCode); toast({ title: 'تم النسخ' }); }}>
                                                <Copy className="w-3 h-3 ml-2" /> نسخ
                                            </Button>
                                        </div>
                                    ) : (
                                        <Button className="w-full bg-emerald-600 hover:bg-emerald-700" onClick={handleShareContext}>إنشاء رمز</Button>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Backup/Restore Card */}
                            <Card className="border-2 border-blue-100 bg-blue-50/30">
                                <CardHeader>
                                    <CardTitle className="text-base flex items-center gap-2"><HardDrive className="w-4 h-4" /> النسخ الاحتياطي</CardTitle>
                                    <CardDescription>تصدير واستيراد البيانات (JSON)</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-2">
                                    <Button variant="outline" className="w-full justify-start" onClick={handleExportData}>
                                        <Download className="w-4 h-4 ml-2 text-blue-500" /> تصدير كافة البيانات
                                    </Button>
                                    <div className="relative">
                                        <Button variant="outline" className="w-full justify-start">
                                            <Upload className="w-4 h-4 ml-2 text-orange-500" /> استيراد ملف JSON
                                        </Button>
                                        <input
                                            type="file"
                                            accept=".json"
                                            className="absolute inset-0 opacity-0 cursor-pointer"
                                            onChange={(e) => {
                                                const file = e.target.files?.[0];
                                                if (file) handleImportData(file);
                                                e.target.value = ''; // Reset
                                            }}
                                        />
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                )}

                {/* File Preview Dialog */}
                <Dialog open={!!previewFile} onOpenChange={(o) => !o && setPreviewFile(null)}>
                    <DialogContent className="max-w-3xl h-[80vh] flex flex-col">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2" dir="ltr">
                                <FileIcon type={previewFile?.type || 'unknown'} className="w-5 h-5" />
                                {previewFile?.name}
                            </DialogTitle>
                        </DialogHeader>
                        <div className="flex-1 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden border">
                            {previewFile?.type === 'image' ? (
                                <div className="text-gray-400 flex flex-col items-center">
                                    <ImageIcon className="w-16 h-16 mb-2 opacity-50" />
                                    <span>Image Preview</span>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center text-gray-400">
                                    <FileIcon type={previewFile?.type || 'unknown'} className="w-24 h-24 mb-4 opacity-20" />
                                    <p>معاينة الملف غير متوفرة</p>
                                    <p className="text-xs opacity-50 mt-1">{formatSize(previewFile?.size || 0)} • {previewFile && formatDate(previewFile.modifiedAt)}</p>
                                </div>
                            )}
                        </div>
                        <div className="flex justify-between items-center bg-gray-50 p-2 rounded-lg">
                            <div className="text-xs text-gray-500 px-2" dir="ltr">{previewFile?.path}</div>
                            <div className="flex gap-2">
                                <Button variant="outline" size="sm" onClick={() => setPreviewFile(null)}>إغلاق</Button>
                                <Button size="sm"><Download className="w-4 h-4 ml-2" /> فتح</Button>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>

                {/* Import Preview Dialog */}
                <Dialog open={!!importData} onOpenChange={(o) => !o && setImportData(null)}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>📥 استيراد بيانات</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                            <p className="text-sm text-gray-600">تم العثور على البيانات التالية في ملف النسخة الاحتياطية. هل ترغب في استيرادها؟</p>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-3 bg-indigo-50 rounded border border-indigo-100">
                                    <div className="text-xs text-gray-500">الأوضاع الدائمة</div>
                                    <div className="text-xl font-bold text-indigo-700">{importData?.routines?.length || 0}</div>
                                </div>
                                <div className="p-3 bg-emerald-50 rounded border border-emerald-100">
                                    <div className="text-xs text-gray-500">الأهداف المالية</div>
                                    <div className="text-xl font-bold text-emerald-700">{importData?.goals?.length || 0}</div>
                                </div>
                                <div className="p-3 bg-amber-50 rounded border border-amber-100">
                                    <div className="text-xs text-gray-500">المواقع المخصصة</div>
                                    <div className="text-xl font-bold text-amber-700">{importData?.customLocations?.length || 0}</div>
                                </div>
                                <div className="p-3 bg-blue-50 rounded border border-blue-100">
                                    <div className="text-xs text-gray-500">المواعيد</div>
                                    <div className="text-xl font-bold text-blue-700">{importData?.appointments?.length || 0}</div>
                                </div>
                            </div>
                            <div className="text-xs text-red-500 mt-2">
                                * ملاحظة: سيتم استبدال البيانات الحالية (الأوضاع، الأهداف، المواقع) بالبيانات المستوردة.
                            </div>
                        </div>
                        <div className="flex justify-end gap-2 mt-4">
                            <Button variant="outline" onClick={() => setImportData(null)}>إلغاء</Button>
                            <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={handleApplyImport}>
                                <Check className="w-4 h-4 ml-2" /> تأكيد الاستيراد
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>

                {/* Add Device Dialog */}
                <Dialog open={showAddDeviceDialog} onOpenChange={setShowAddDeviceDialog}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>إضافة جهاز يدوياً</DialogTitle>
                            <CardDescription>أدخل بيانات الجهاز للاتصال المباشر</CardDescription>
                        </DialogHeader>
                        <form
                            className="space-y-4 mt-4"
                            onSubmit={(e) => {
                                e.preventDefault();
                                const formData = new FormData(e.currentTarget);
                                handleAddDevice(
                                    formData.get('name') as string,
                                    formData.get('type') as any,
                                    formData.get('ip') as string
                                );
                            }}
                        >
                            <div className="space-y-2">
                                <label className="text-sm font-medium">اسم الجهاز</label>
                                <Input name="name" placeholder="مثال: هاتفي الشخصي" required />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">نوع الجهاز</label>
                                <Select name="type" defaultValue="phone">
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="phone">هاتف ذكي</SelectItem>
                                        <SelectItem value="watch">ساعة ذكية</SelectItem>
                                        <SelectItem value="tablet">جهاز لوحي</SelectItem>
                                        <SelectItem value="desktop">كمبيوتر</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">عنوان الشبكة ( اختياري لـ Bluetooth)</label>
                                <Input name="ip" placeholder="192.168.1.x أو اتركه فارغاً" />
                            </div>
                            <Button type="submit" className="w-full">حفظ واتصال</Button>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    );
};

export default ConnectivityManager;
