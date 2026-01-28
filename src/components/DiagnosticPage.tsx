/**
 * صفحة التشخيص - لفحص الاتصال بـ Supabase
 */

import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';

export const DiagnosticPage: React.FC = () => {
    const [results, setResults] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);

    const addResult = (msg: string) => {
        setResults(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
    };

    const runDiagnostics = async () => {
        setResults([]);
        setLoading(true);

        try {
            // 1. فحص المستخدم
            addResult('🔍 فحص المستخدم...');
            const { data: { user }, error: userError } = await supabase.auth.getUser();

            if (userError) {
                addResult(`❌ خطأ في جلب المستخدم: ${userError.message}`);
            } else if (!user) {
                addResult('⚠️ لا يوجد مستخدم مسجل! يجب تسجيل الدخول أولاً.');
            } else {
                addResult(`✅ المستخدم: ${user.email} (${user.id})`);
            }

            // 2. فحص جدول note_folders
            addResult('🔍 فحص جدول note_folders...');
            const { data: foldersData, error: foldersError } = await supabase
                .from('note_folders')
                .select('count')
                .limit(1);

            if (foldersError) {
                addResult(`❌ خطأ في جدول note_folders: ${foldersError.message}`);
                addResult(`   التفاصيل: ${foldersError.details || 'غير متوفر'}`);
                addResult(`   الكود: ${foldersError.code || 'غير متوفر'}`);
            } else {
                addResult('✅ جدول note_folders موجود ويمكن الوصول إليه');
            }

            // 3. فحص جدول quick_notes
            addResult('🔍 فحص جدول quick_notes...');
            const { data: notesData, error: notesError } = await supabase
                .from('quick_notes')
                .select('count')
                .limit(1);

            if (notesError) {
                addResult(`❌ خطأ في جدول quick_notes: ${notesError.message}`);
                addResult(`   التفاصيل: ${notesError.details || 'غير متوفر'}`);
            } else {
                addResult('✅ جدول quick_notes موجود ويمكن الوصول إليه');
            }

            // 4. فحص جداول الأدوية
            addResult('🔍 فحص جداول الأدوية...');
            const { error: medsError } = await supabase.from('medications').select('id').limit(1);
            if (medsError) {
                addResult(`❌ خطأ في جدول medications: ${medsError.message}`);
                addResult('💡 قد تحتاج لتشغيل كود SQL الخاص بالأدوية.');
            } else {
                addResult('✅ جدول medications موجود');
            }

            const { error: medLogsError } = await supabase.from('medication_logs').select('id').limit(1);
            if (medLogsError) {
                addResult(`❌ خطأ في جدول medication_logs: ${medLogsError.message}`);
            } else {
                addResult('✅ جدول medication_logs موجود');
            }

            // 5. محاولة إنشاء مجلد تجريبي
            if (user) {
                addResult('🔍 محاولة إنشاء مجلد تجريبي...');
                const { data: newFolder, error: createError } = await supabase
                    .from('note_folders')
                    .insert({
                        user_id: user.id,
                        name: 'مجلد تجريبي ' + Date.now(),
                        color: '#4ade80',
                        icon: 'folder',
                        order_index: 0,
                    })
                    .select()
                    .single();

                if (createError) {
                    addResult(`❌ فشل إنشاء المجلد: ${createError.message}`);
                    addResult(`   الكود: ${createError.code}`);
                    addResult(`   التفاصيل: ${createError.details || 'غير متوفر'}`);
                    addResult(`   التلميح: ${createError.hint || 'غير متوفر'}`);
                } else {
                    addResult(`✅ تم إنشاء المجلد بنجاح! ID: ${newFolder.id}`);

                    // حذف المجلد التجريبي
                    addResult('🔍 محاولة حذف المجلد التجريبي...');
                    const { error: deleteError } = await supabase
                        .from('note_folders')
                        .delete()
                        .eq('id', newFolder.id);

                    if (deleteError) {
                        addResult(`❌ فشل حذف المجلد: ${deleteError.message}`);
                    } else {
                        addResult('✅ تم حذف المجلد التجريبي بنجاح!');
                    }
                }
            }

            addResult('═══════════════════════════════════════');
            addResult('✅ انتهى التشخيص');

        } catch (error: any) {
            addResult(`❌ خطأ عام: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-8 max-w-4xl mx-auto" dir="rtl">
            <h1 className="text-2xl font-bold mb-6">🔧 صفحة التشخيص</h1>

            <Button
                onClick={runDiagnostics}
                disabled={loading}
                className="mb-6"
            >
                {loading ? 'جاري التشخيص...' : '🚀 بدء التشخيص'}
            </Button>

            <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm min-h-[400px] overflow-auto">
                {results.length === 0 ? (
                    <p className="text-gray-500">اضغط على "بدء التشخيص" لفحص الاتصال</p>
                ) : (
                    results.map((result, index) => (
                        <div key={index} className="mb-1">{result}</div>
                    ))
                )}
            </div>

            <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <h3 className="font-bold text-yellow-800 mb-2">⚠️ ملاحظات:</h3>
                <ul className="text-sm text-yellow-700 list-disc list-inside space-y-1">
                    <li>إذا ظهر "لا يوجد مستخدم مسجل" - تأكد من تسجيل الدخول</li>
                    <li>إذا ظهر خطأ "relation does not exist" - الجداول غير موجودة في Supabase</li>
                    <li>إذا ظهر خطأ "new row violates RLS" - مشكلة في صلاحيات RLS</li>
                </ul>
            </div>
        </div>
    );
};
