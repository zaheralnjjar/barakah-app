/**
 * Generate ICS calendar file for prayer times
 */
export const generatePrayerTimesICS = (prayerTimes: any, month: string = 'شهر') => {
    const icsContent = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//Barakah App//Prayer Times//AR',
        'CALSCALE:GREGORIAN',
        'METHOD:PUBLISH',
        'X-WR-CALNAME:أوقات الصلاة',
        'X-WR-TIMEZONE:America/Argentina/Buenos_Aires',
        'X-WR-CALDESC:أوقات الصلاة اليومية',
    ];

    // Prayer names mapping
    const prayerNames: Record<string, string> = {
        fajr: 'الفجر',
        sunrise: 'الشروق',
        dhuhr: 'الظهر',
        asr: 'العصر',
        maghrib: 'المغرب',
        isha: 'العشاء',
    };

    // Get today's date
    const today = new Date();

    // Generate events for each prayer for the next 30 days
    for (let day = 0; day < 30; day++) {
        const date = new Date(today);
        date.setDate(today.getDate() + day);

        Object.entries(prayerTimes).forEach(([prayer, time]) => {
            if (prayer === 'sunrise') return; // Skip sunrise as it's not a prayer

            const prayerName = prayerNames[prayer] || prayer;
            const [hours, minutes] = (time as string).split(':');

            // Create datetime for the prayer
            const prayerDateTime = new Date(date);
            prayerDateTime.setHours(parseInt(hours), parseInt(minutes), 0);

            // End time (15 minutes after start)
            const endDateTime = new Date(prayerDateTime);
            endDateTime.setMinutes(prayerDateTime.getMinutes() + 15);

            // Format dates for ICS (YYYYMMDDTHHMMSS)
            const formatICSDate = (d: Date) => {
                const year = d.getFullYear();
                const month = String(d.getMonth() + 1).padStart(2, '0');
                const day = String(d.getDate()).padStart(2, '0');
                const hours = String(d.getHours()).padStart(2, '0');
                const minutes = String(d.getMinutes()).padStart(2, '0');
                const seconds = '00';
                return `${year}${month}${day}T${hours}${minutes}${seconds}`;
            };

            const uid = `prayer-${prayer}-${date.toISOString().split('T')[0]}@barakah.app`;

            icsContent.push(
                'BEGIN:VEVENT',
                `UID:${uid}`,
                `DTSTAMP:${formatICSDate(new Date())}`,
                `DTSTART:${formatICSDate(prayerDateTime)}`,
                `DTEND:${formatICSDate(endDateTime)}`,
                `SUMMARY:صلاة ${prayerName}`,
                `DESCRIPTION:وقت صلاة ${prayerName}`,
                'LOCATION:Buenos Aires, Argentina',
                'STATUS:CONFIRMED',
                'SEQUENCE:0',
                `CATEGORIES:صلاة,${prayerName}`,
                'BEGIN:VALARM',
                'TRIGGER:-PT10M', // 10 minutes before
                'DESCRIPTION:حان وقت الصلاة',
                'ACTION:DISPLAY',
                'END:VALARM',
                'END:VEVENT'
            );
        });
    }

    icsContent.push('END:VCALENDAR');

    // Create blob and download
    const blob = new Blob([icsContent.join('\r\n')], {
        type: 'text/calendar;charset=utf-8'
    });

    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `prayer-times-${new Date().toISOString().split('T')[0]}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
};
