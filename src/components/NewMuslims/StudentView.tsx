import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    BookOpen, Calendar, CheckCircle2, Clock, GraduationCap,
    User, FileText, Award, MessageSquare, Phone, LogOut
} from 'lucide-react';
import { useHidayaTranslation } from '@/hooks/useHidayaTranslation';
import { supabase } from '@/integrations/supabase/client';

interface StudentViewProps {
    userEmail: string;
    onLogout: () => void;
}

const StudentView: React.FC<StudentViewProps> = ({ userEmail, onLogout }) => {
    const { t, language, isRTL } = useHidayaTranslation();
    const [activeTab, setActiveTab] = useState('progress');
    const [studentData, setStudentData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Fetch student data based on email
        const fetchStudentData = async () => {
            try {
                // For demo, create mock student data
                // In production, this would fetch from Supabase based on email
                setStudentData({
                    id: '1',
                    name: 'طالب تجريبي',
                    email: userEmail,
                    conversionDate: '2024-01-15',
                    status: 'active',
                    progress: 65,
                    stage: 'building',
                    completedLessons: 12,
                    totalLessons: 18,
                    upcomingAppointments: [
                        { id: 1, title: t('study_plan'), date: '2026-01-10', time: '10:00' },
                        { id: 2, title: t('appointments_label'), date: '2026-01-12', time: '14:00' }
                    ],
                    recentCommunications: [
                        { id: 1, type: 'whatsapp', date: '2026-01-07', note: 'Follow up on progress' },
                        { id: 2, type: 'call', date: '2026-01-05', note: 'Weekly check-in' }
                    ]
                });
            } catch (error) {
                console.error('Error fetching student data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchStudentData();
    }, [userEmail, t]);

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-emerald-600">{t('loading')}</p>
                </div>
            </div>
        );
    }

    return (
        <div className={`min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 pb-20`} dir={isRTL ? 'rtl' : 'ltr'}>
            {/* Header */}
            <header className="bg-gradient-to-r from-green-600 to-emerald-600 text-white p-4 shadow-lg">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                            <User className="w-6 h-6" />
                        </div>
                        <div>
                            <h1 className="font-bold text-lg">{t('hidaya')}</h1>
                            <p className="text-sm text-emerald-100">{userEmail}</p>
                        </div>
                    </div>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="text-white hover:bg-white/20"
                        onClick={onLogout}
                    >
                        <LogOut className="w-5 h-5" />
                    </Button>
                </div>
            </header>

            <div className="p-4 space-y-4">
                {/* Progress Card */}
                <Card className="bg-white shadow-sm">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <GraduationCap className="w-5 h-5 text-emerald-600" />
                            {t('my_progress')}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600">{t('study_plan')}</span>
                                <Badge className="bg-emerald-100 text-emerald-700">
                                    {studentData?.completedLessons}/{studentData?.totalLessons}
                                </Badge>
                            </div>
                            <Progress value={studentData?.progress || 0} className="h-3" />
                            <div className="grid grid-cols-3 gap-3 mt-4">
                                <div className="text-center p-3 bg-emerald-50 rounded-lg">
                                    <BookOpen className="w-6 h-6 mx-auto text-emerald-600 mb-1" />
                                    <p className="text-2xl font-bold text-emerald-700">{studentData?.completedLessons}</p>
                                    <p className="text-xs text-gray-500">{t('lessons')}</p>
                                </div>
                                <div className="text-center p-3 bg-blue-50 rounded-lg">
                                    <Calendar className="w-6 h-6 mx-auto text-blue-600 mb-1" />
                                    <p className="text-2xl font-bold text-blue-700">{studentData?.upcomingAppointments?.length}</p>
                                    <p className="text-xs text-gray-500">{t('appointments_label')}</p>
                                </div>
                                <div className="text-center p-3 bg-purple-50 rounded-lg">
                                    <CheckCircle2 className="w-6 h-6 mx-auto text-purple-600 mb-1" />
                                    <p className="text-2xl font-bold text-purple-700">{studentData?.progress}%</p>
                                    <p className="text-xs text-gray-500">{t('progress')}</p>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Tabs for different sections */}
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid grid-cols-3 w-full">
                        <TabsTrigger value="progress" className="text-xs">
                            📚 {t('my_study_plan')}
                        </TabsTrigger>
                        <TabsTrigger value="appointments" className="text-xs">
                            📅 {t('my_appointments')}
                        </TabsTrigger>
                        <TabsTrigger value="messages" className="text-xs">
                            💬 {t('communications_log')}
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="progress" className="mt-4">
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm">{t('my_study_plan')}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    {[1, 2, 3, 4, 5].map((lesson) => (
                                        <div key={lesson} className={`flex items-center gap-3 p-3 rounded-lg ${lesson <= 3 ? 'bg-emerald-50' : 'bg-gray-50'}`}>
                                            {lesson <= 3 ? (
                                                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                                            ) : (
                                                <Clock className="w-5 h-5 text-gray-400" />
                                            )}
                                            <div className="flex-1">
                                                <p className={`font-medium ${lesson <= 3 ? 'text-emerald-700' : 'text-gray-600'}`}>
                                                    {t('lessons')} {lesson}
                                                </p>
                                            </div>
                                            {lesson <= 3 && (
                                                <Badge variant="outline" className="text-emerald-600 border-emerald-200">
                                                    ✓
                                                </Badge>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="appointments" className="mt-4">
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm">{t('my_appointments')}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {studentData?.upcomingAppointments?.map((apt: any) => (
                                    <div key={apt.id} className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg mb-2">
                                        <Calendar className="w-5 h-5 text-blue-600" />
                                        <div className="flex-1">
                                            <p className="font-medium text-blue-700">{apt.title}</p>
                                            <p className="text-sm text-gray-500">{apt.date} - {apt.time}</p>
                                        </div>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="messages" className="mt-4">
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm">{t('communications_log')}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {studentData?.recentCommunications?.map((comm: any) => (
                                    <div key={comm.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg mb-2">
                                        {comm.type === 'whatsapp' ? (
                                            <MessageSquare className="w-5 h-5 text-green-600" />
                                        ) : (
                                            <Phone className="w-5 h-5 text-blue-600" />
                                        )}
                                        <div className="flex-1">
                                            <p className="font-medium">{comm.note}</p>
                                            <p className="text-sm text-gray-500">{comm.date}</p>
                                        </div>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>

                {/* Certificate Button (if graduated) */}
                {studentData?.status === 'graduated' && (
                    <Card className="bg-gradient-to-r from-amber-50 to-yellow-50 border-amber-200">
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <Award className="w-10 h-10 text-amber-600" />
                                <div className="flex-1">
                                    <p className="font-bold text-amber-800">{t('certificate_title')}</p>
                                    <p className="text-sm text-amber-600">{t('download')}</p>
                                </div>
                                <Button size="sm" className="bg-amber-600 hover:bg-amber-700">
                                    <FileText className="w-4 h-4" />
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
};

export default StudentView;
