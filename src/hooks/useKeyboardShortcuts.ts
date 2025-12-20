import { useEffect, useCallback } from 'react';
import { useHotkeys } from 'react-hotkeys-hook';
import { useToast } from '@/hooks/use-toast';

/**
 * Global Keyboard Shortcuts
 * Ctrl+K - Open search/command palette
 * Ctrl+N - New task
 * Ctrl+M - Open map
 * Ctrl+S - Sync now
 * Ctrl+/ - Show shortcuts help
 */
export const useKeyboardShortcuts = () => {
    const { toast } = useToast();

    // Ctrl+K - Command Palette (to be implemented)
    useHotkeys('ctrl+k, cmd+k', (e) => {
        e.preventDefault();
        toast({
            title: '⌨️ اختصارات لوحة المفاتيح',
            description: 'قريباً: لوحة الأوامر',
        });
    });

    // Ctrl+N - New Task
    useHotkeys('ctrl+n, cmd+n', (e) => {
        e.preventDefault();
        // Navigate to logistics tab
        const productivityTab = document.querySelector('[data-tab="productivity"]') as HTMLElement;
        if (productivityTab) {
            productivityTab.click();
            setTimeout(() => {
                const addButton = document.querySelector('[data-action="add-task"]') as HTMLElement;
                if (addButton) addButton.click();
            }, 100);
        }
    });

    // Ctrl+M - Open Map
    useHotkeys('ctrl+m, cmd+m', (e) => {
        e.preventDefault();
        const dashboardTab = document.querySelector('[data-tab="dashboard"]') as HTMLElement;
        if (dashboardTab) {
            dashboardTab.click();
            setTimeout(() => {
                const mapSection = document.getElementById('interactive-map');
                if (mapSection) {
                    mapSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }, 100);
        }
    });

    // Ctrl+S - Sync Now
    useHotkeys('ctrl+s, cmd+s', (e) => {
        e.preventDefault();
        const syncButton = document.querySelector('[data-action="sync-now"]') as HTMLElement;
        if (syncButton) {
            syncButton.click();
        } else {
            toast({
                title: '🔄 مزامنة',
                description: 'افتح الإعدادات للمزامنة',
            });
        }
    });

    // Ctrl+/ - Show help
    useHotkeys('ctrl+/, cmd+/', (e) => {
        e.preventDefault();
        toast({
            title: '⌨️ اختصارات لوحة المفاتيح',
            description: `
        Ctrl+K - بحث
        Ctrl+N - مهمة جديدة
        Ctrl+M - الخريطة
        Ctrl+S - مزامنة
        Ctrl+/ - المساعدة
      `,
            duration: 5000,
        });
    });

    useEffect(() => {
        // Show shortcuts hint on first load
        const hasSeenHint = localStorage.getItem('keyboard-shortcuts-hint-seen');
        if (!hasSeenHint) {
            setTimeout(() => {
                toast({
                    title: '💡 نصيحة',
                    description: 'اضغط Ctrl+/ لرؤية اختصارات لوحة المفاتيح',
                    duration: 7000,
                });
                localStorage.setItem('keyboard-shortcuts-hint-seen', 'true');
            }, 3000);
        }
    }, [toast]);
};
