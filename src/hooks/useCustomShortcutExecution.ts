/**
 * useCustomShortcutExecution.ts
 * Execution engine for custom shortcuts with support for:
 * - Standard actions
 * - Macros (sequential action execution)
 * - URL shortcuts
 * - Contact shortcuts (call/WhatsApp)
 */

import { useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import type { CustomShortcut } from '@/types/shortcuts';

interface UseCustomShortcutExecutionProps {
    executeAction: (actionId: string) => Promise<void>;
}

export const useCustomShortcutExecution = ({ executeAction }: UseCustomShortcutExecutionProps) => {
    const { toast } = useToast();

    /**
     * Execute a macro (sequence of actions with delay)
     */
    const executeMacro = useCallback(async (actionIds: string[]) => {
        for (const actionId of actionIds) {
            await executeAction(actionId);
            // Small delay between macro actions
            await new Promise(resolve => setTimeout(resolve, 100));
        }
    }, [executeAction]);

    /**
     * Open a URL in new tab
     */
    const executeUrl = useCallback((url: string) => {
        if (!url) {
            toast({ title: '❌ خطأ', description: 'الرابط فارغ', variant: 'destructive' });
            return;
        }
        // Ensure URL has protocol
        const formattedUrl = url.startsWith('http') ? url : `https://${url}`;
        window.open(formattedUrl, '_blank');
        toast({ title: '🔗 تم فتح الرابط' });
    }, [toast]);

    /**
     * Call a contact
     */
    const executeCall = useCallback((phone: string, name?: string) => {
        if (!phone) {
            toast({ title: '❌ خطأ', description: 'رقم الهاتف فارغ', variant: 'destructive' });
            return;
        }
        // Clean phone number
        const cleanPhone = phone.replace(/\s+/g, '');
        window.open(`tel:${cleanPhone}`, '_self');
        toast({ title: `📞 جاري الاتصال بـ ${name || cleanPhone}` });
    }, [toast]);

    /**
     * Open WhatsApp chat
     */
    const executeWhatsApp = useCallback((phone: string, name?: string) => {
        if (!phone) {
            toast({ title: '❌ خطأ', description: 'رقم الهاتف فارغ', variant: 'destructive' });
            return;
        }
        // Clean phone number (remove + and spaces)
        const cleanPhone = phone.replace(/[\s+\-()]/g, '');
        window.open(`https://wa.me/${cleanPhone}`, '_blank');
        toast({ title: `💬 واتساب: ${name || cleanPhone}` });
    }, [toast]);

    /**
     * Main execution function for custom shortcuts
     */
    const executeCustomShortcut = useCallback(async (
        shortcut: CustomShortcut,
        isLongPress: boolean = false
    ) => {
        // Haptic feedback
        if (navigator.vibrate && isLongPress) {
            navigator.vibrate(50);
        }

        const { shortcut_type } = shortcut;

        switch (shortcut_type) {
            case 'action':
                const actionId = isLongPress
                    ? shortcut.long_press_action_id
                    : shortcut.click_action_id;

                if (actionId) {
                    await executeAction(actionId);
                } else if (!isLongPress) {
                    // If click action is empty, try long press action
                    if (shortcut.long_press_action_id) {
                        await executeAction(shortcut.long_press_action_id);
                    } else {
                        toast({ title: '⚠️ لم يتم تحديد وظيفة' });
                    }
                }
                break;

            case 'macro':
                const macro = isLongPress
                    ? shortcut.long_press_macro
                    : shortcut.click_macro;

                if (macro && macro.length > 0) {
                    toast({ title: '⚡ جاري تنفيذ السلسلة...' });
                    await executeMacro(macro);
                    toast({ title: '✅ اكتملت السلسلة' });
                } else {
                    toast({ title: '⚠️ السلسلة فارغة' });
                }
                break;

            case 'url':
                if (shortcut.url) {
                    executeUrl(shortcut.url);
                }
                break;

            case 'contact':
                if (isLongPress) {
                    // Long press = WhatsApp
                    executeWhatsApp(shortcut.contact_phone || '', shortcut.contact_name);
                } else {
                    // Click = Phone call
                    executeCall(shortcut.contact_phone || '', shortcut.contact_name);
                }
                break;

            default:
                toast({ title: '⚠️ نوع اختصار غير معروف' });
        }
    }, [executeAction, executeMacro, executeUrl, executeCall, executeWhatsApp, toast]);

    return {
        executeCustomShortcut,
        executeMacro,
        executeUrl,
        executeCall,
        executeWhatsApp
    };
};
