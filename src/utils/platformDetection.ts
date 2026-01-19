import { Capacitor } from '@capacitor/core';

/**
 * Platform detection utility
 * Used to apply different behaviors for Android vs Web
 */

// Check if running on native platform (Android/iOS)
export const isNativePlatform = (): boolean => {
    return Capacitor.isNativePlatform();
};

// Check if running on Android specifically
export const isAndroid = (): boolean => {
    return Capacitor.getPlatform() === 'android';
};

// Check if running on iOS specifically
export const isIOS = (): boolean => {
    return Capacitor.getPlatform() === 'ios';
};

// Check if running on web
export const isWeb = (): boolean => {
    return Capacitor.getPlatform() === 'web';
};

// Check if academic section should be read-only
// Read-only on Android, full access on web
export const isAcademicReadOnly = (): boolean => {
    return isAndroid();
};

// Check if SmartBottomBar should be used
// SmartBottomBar on Android, original BottomNavBar on web
export const useSmartBottomBar = (): boolean => {
    return isAndroid();
};
