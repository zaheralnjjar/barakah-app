import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import {
  BookOpen,
  Clock,
  Star,
  Moon,
  Sun,
  Sunrise,
  Sunset,
  Upload
} from 'lucide-react';

const SpiritualGuide = () => {
  const [spiritualData, setSpiritualData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const { toast } = useToast();

  useEffect(() => {
    loadSpiritualData();
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const loadSpiritualData = async () => {
    try {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) return;

      const { data, error } = await supabase
        .from('spiritual_data_2025_12_18_18_42')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;
      setSpiritualData(data);
    } catch (error) {
      console.error('Error loading spiritual data:', error);
      toast({
        title: "خطأ في تحميل البيانات الروحية",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateQuranProgress = async (newProgress) => {
    try {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) return;

      const { error } = await supabase
        .from('spiritual_data_2025_12_18_18_42')
        .update({
          quran_progress: newProgress,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: "تم تحديث تقدم القرآن",
        description: `التقدم الحالي: ${newProgress}%`,
      });

      loadSpiritualData();
    } catch (error) {
      console.error('Error updating Quran progress:', error);
    }
  };

  // Default prayer times for Buenos Aires (approximate)
  const defaultPrayerTimes = {
    fajr: '05:30',
    sunrise: '06:45',
    dhuhr: '12:30',
    asr: '16:15',
    maghrib: '19:45',
    isha: '21:00'
  };

  const prayerTimes = spiritualData?.prayer_times || defaultPrayerTimes;

  const getPrayerIcon = (prayer) => {
    switch (prayer) {
      case 'fajr': return <Moon className="w-5 h-5" />;
      case 'sunrise': return <Sunrise className="w-5 h-5" />;
      case 'dhuhr': return <Sun className="w-5 h-5" />;
      case 'asr': return <Sun className="w-5 h-5" />;
      case 'maghrib': return <Sunset className="w-5 h-5" />;
      case 'isha': return <Star className="w-5 h-5" />;
      default: return <Clock className="w-5 h-5" />;
    }
  };

  const getPrayerName = (prayer) => {
    const names = {
      fajr: 'الفجر',
      sunrise: 'الشروق',
      dhuhr: 'الظهر',
      asr: 'العصر',
      maghrib: 'المغرب',
      isha: 'العشاء'
    };
    return names[prayer] || prayer;
  };

  const getNextPrayer = () => {
    const now = currentTime.getHours() * 60 + currentTime.getMinutes();
    const prayers = Object.entries(prayerTimes).map(([name, time]) => {
      const timeStr = String(time);
      const [hours, minutes] = timeStr.split(':').map(Number);
      return { name, time: hours * 60 + minutes, timeStr };
    });

    const nextPrayer = prayers.find(prayer => prayer.time > now) || prayers[0];
    return nextPrayer;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <span className="mr-3 arabic-body">جاري تحميل البيانات الروحية...</span>
      </div>
    );
  }

  const nextPrayer = getNextPrayer();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="w-20 h-20 bg-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
          <BookOpen className="w-10 h-10 text-white" />
        </div>
        <h1 className="text-3xl arabic-title text-primary mb-2">
          أحمد - المرشد الروحي
        </h1>
        <p className="arabic-body text-muted-foreground">
          أوقات الصلاة والأذكار
        </p>
      </div>

      {/* Current Time & Next Prayer */}
      <Card className="bg-gradient-to-r from-purple-50 to-blue-50">
        <CardHeader className="text-center">
          <CardTitle className="arabic-title text-2xl">
            {currentTime.toLocaleTimeString('ar-SA', {
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit'
            })}
          </CardTitle>
          <CardDescription className="arabic-body text-lg">
            بوينس آيرس، الأرجنتين
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            {getPrayerIcon(nextPrayer.name)}
            <span className="arabic-title text-xl text-primary">
              الصلاة القادمة: {getPrayerName(nextPrayer.name)}
            </span>
          </div>
          <Badge variant="secondary" className="text-lg px-4 py-2">
            {nextPrayer.timeStr}
          </Badge>
        </CardContent>
      </Card>

      {/* Prayer Times */}
      <Card>
        <CardHeader>
          <CardTitle className="arabic-title flex items-center justify-between">
            <span>أوقات الصلاة</span>
            {!spiritualData?.prayer_time_source && (
              <Button variant="outline" size="sm" className="arabic-body">
                <Upload className="w-4 h-4 ml-1" />
                رفع ملف الأوقات
              </Button>
            )}
          </CardTitle>
          {spiritualData?.prayer_time_source && (
            <CardDescription className="arabic-body">
              المصدر: {spiritualData.prayer_time_source}
            </CardDescription>
          )}
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {Object.entries(prayerTimes).map(([prayer, time]) => (
              <div
                key={prayer}
                className={`p-4 rounded-lg border text-center ${nextPrayer.name === prayer
                  ? 'bg-primary/10 border-primary/30'
                  : 'bg-gray-50 border-gray-200'
                  }`}
              >
                <div className="flex items-center justify-center mb-2">
                  {getPrayerIcon(prayer)}
                </div>
                <h3 className="arabic-title font-semibold mb-1">
                  {getPrayerName(prayer)}
                </h3>
                <p className="text-lg font-bold text-primary">
                  {time}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Islamic Calendar */}
      <Card>
        <CardHeader>
          <CardTitle className="arabic-title flex items-center">
            <Moon className="w-5 h-5 ml-2" />
            التقويم الهجري
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center">
            <p className="arabic-title text-2xl text-primary mb-2">
              {new Date().toLocaleDateString('ar-SA-u-ca-islamic')}
            </p>
            <p className="arabic-body text-muted-foreground">
              التاريخ الهجري التقريبي
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Fiqh Benefit */}
      <Card className="bg-primary/5 border-primary/20">
        <CardHeader>
          <CardTitle className="arabic-title text-primary text-lg">
            فائدة فقهية من الأستاذ وليد
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="arabic-body text-sm text-muted-foreground">
            "قال الله تعالى: 'وَأَقِيمُوا الصَّلَاةَ وَآتُوا الزَّكَاةَ' (البقرة: 43). إن المحافظة على أوقات الصلاة وتتبع تلاوة القرآن من أعظم العبادات، والمسلم في بلاد الغربة أحوج ما يكون إلى هذا التنظيم الروحي ليحافظ على صلته بالله تعالى وسط انشغالات الحياة."
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default SpiritualGuide;