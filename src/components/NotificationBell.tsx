import React, { useState, useEffect } from 'react';
import { Bell, X, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Notification {
    id: string;
    title: string;
    message: string;
    timestamp: string;
    read: boolean;
    type: 'info' | 'warning' | 'success' | 'alert';
}

export const NotificationBell = () => {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);

    // Load notifications locally (simulated)
    useEffect(() => {
        const loadNotifications = () => {
            const stored = localStorage.getItem('baraka_notifications');
            if (stored) {
                const parsed = JSON.parse(stored);
                setNotifications(parsed);
                setUnreadCount(parsed.filter((n: Notification) => !n.read).length);
            } else {
                // Mock data for demo if empty
                const mock: Notification[] = [
                    { id: '1', title: 'مرحباً بك', message: 'تطبيق بركة جاهز لمساعدتك', timestamp: new Date().toISOString(), read: false, type: 'info' },
                    { id: '2', title: 'صلاة العصر', message: 'باقي 15 دقيقة على الأذان', timestamp: new Date(Date.now() - 3600000).toISOString(), read: false, type: 'alert' }
                ];
                setNotifications(mock);
                localStorage.setItem('baraka_notifications', JSON.stringify(mock));
                setUnreadCount(2);
            }
        };

        loadNotifications();
        // Update every minute
        const interval = setInterval(loadNotifications, 60000);
        return () => clearInterval(interval);
    }, []);

    const markAsRead = (id: string) => {
        const updated = notifications.map(n => n.id === id ? { ...n, read: true } : n);
        setNotifications(updated);
        setUnreadCount(updated.filter(n => !n.read).length);
        localStorage.setItem('baraka_notifications', JSON.stringify(updated));
    };

    const clearAll = () => {
        setNotifications([]);
        setUnreadCount(0);
        localStorage.removeItem('baraka_notifications');
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <div className="relative">
                    <Button variant="ghost" size="icon" className="h-10 w-10 bg-white/10 hover:bg-white/20 text-white rounded-full">
                        <Bell className="w-5 h-5" />
                    </Button>
                    {unreadCount > 0 && (
                        <span className="absolute top-0 right-0 h-4 w-4 bg-red-500 rounded-full text-[10px] text-white flex items-center justify-center border-2 border-emerald-600">
                            {unreadCount}
                        </span>
                    )}
                </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80 max-h-[400px] overflow-y-auto z-[200]">
                <div className="flex items-center justify-between p-2 border-b">
                    <span className="font-bold text-sm arabic-title">الإشعارات ({notifications.length})</span>
                    <Button variant="ghost" size="sm" onClick={clearAll} className="text-xs text-red-500 h-6">
                        مسح الكل
                    </Button>
                </div>
                {notifications.length === 0 ? (
                    <div className="p-8 text-center text-gray-400">
                        <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm arabic-body">لا توجد إشعارات جديدة</p>
                    </div>
                ) : (
                    <div className="py-1">
                        {notifications.map((notification) => (
                            <div
                                key={notification.id}
                                className={`p-3 border-b last:border-b-0 hover:bg-gray-50 flex gap-3 ${notification.read ? 'opacity-60' : 'bg-blue-50/50'}`}
                            >
                                <div className={`w-2 h-2 mt-2 rounded-full shrink-0 ${notification.type === 'alert' ? 'bg-red-500' :
                                        notification.type === 'success' ? 'bg-green-500' :
                                            notification.type === 'warning' ? 'bg-amber-500' : 'bg-blue-500'
                                    }`} />
                                <div className="flex-1 space-y-1">
                                    <div className="flex items-start justify-between">
                                        <p className="font-bold text-sm arabic-body">{notification.title}</p>
                                        <span className="text-[10px] text-gray-400">
                                            {new Date(notification.timestamp).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                    <p className="text-xs text-gray-600 leading-relaxed">{notification.message}</p>
                                    {!notification.read && (
                                        <button
                                            onClick={() => markAsRead(notification.id)}
                                            className="text-[10px] text-blue-600 hover:underline mt-1"
                                        >
                                            تحديد كمقروء
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    );
};
