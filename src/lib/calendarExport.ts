/**
 * Export appointment to ICS (iCalendar) format
 * Compatible with Google Calendar, Apple Calendar, Outlook
 */
export const exportToCalendar = (appointment: {
    title: string;
    date: string; // YYYY-MM-DD
    time: string; // HH:MM
    location?: string;
    notes?: string;
    reminderMinutes?: number;
}) => {
    const { title, date, time, location, notes, reminderMinutes } = appointment;

    // Parse date and time
    const [year, month, day] = date.split('-');
    const [hour, minute] = time.split(':');

    // Create start date in UTC format
    const startDate = new Date(
        parseInt(year),
        parseInt(month) - 1,
        parseInt(day),
        parseInt(hour),
        parseInt(minute)
    );

    // End date (1 hour later)
    const endDate = new Date(startDate.getTime() + 60 * 60 * 1000);

    const formatDate = (d: Date) => {
        return d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    };

    // Create ICS content
    let icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Barakah App//NONSGML v1.0//EN
BEGIN:VEVENT
UID:${Date.now()}@barakah-app
DTSTAMP:${formatDate(new Date())}
DTSTART:${formatDate(startDate)}
DTEND:${formatDate(endDate)}
SUMMARY:${title}`;

    if (location) {
        icsContent += `\nLOCATION:${location}`;
    }

    if (notes) {
        icsContent += `\nDESCRIPTION:${notes.replace(/\n/g, '\\n')}`;
    }

    if (reminderMinutes) {
        icsContent += `\nBEGIN:VALARM
TRIGGER:-PT${reminderMinutes}M
ACTION:DISPLAY
DESCRIPTION:${title}
END:VALARM`;
    }

    icsContent += `\nEND:VEVENT
END:VCALENDAR`;

    // Create and download file
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${title.replace(/\s+/g, '-')}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
};

/**
 * Export multiple appointments to a single ICS file
 */
export const exportMultipleToCalendar = (
    appointments: Array<{
        title: string;
        date: string;
        time: string;
        location?: string;
        notes?: string;
        reminderMinutes?: number;
    }>
) => {
    let icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Barakah App//NONSGML v1.0//EN\n`;

    appointments.forEach((apt, index) => {
        const { title, date, time, location, notes, reminderMinutes } = apt;

        const [year, month, day] = date.split('-');
        const [hour, minute] = time.split(':');

        const startDate = new Date(
            parseInt(year),
            parseInt(month) - 1,
            parseInt(day),
            parseInt(hour),
            parseInt(minute)
        );

        const endDate = new Date(startDate.getTime() + 60 * 60 * 1000);

        const formatDate = (d: Date) => {
            return d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
        };

        icsContent += `BEGIN:VEVENT
UID:${Date.now()}-${index}@barakah-app
DTSTAMP:${formatDate(new Date())}
DTSTART:${formatDate(startDate)}
DTEND:${formatDate(endDate)}
SUMMARY:${title}`;

        if (location) {
            icsContent += `\nLOCATION:${location}`;
        }

        if (notes) {
            icsContent += `\nDESCRIPTION:${notes.replace(/\n/g, '\\n')}`;
        }

        if (reminderMinutes) {
            icsContent += `\nBEGIN:VALARM
TRIGGER:-PT${reminderMinutes}M
ACTION:DISPLAY
DESCRIPTION:${title}
END:VALARM`;
        }

        icsContent += `\nEND:VEVENT\n`;
    });

    icsContent += `END:VCALENDAR`;

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `appointments-${new Date().toISOString().split('T')[0]}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
};
