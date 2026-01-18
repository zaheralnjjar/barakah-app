import { Capacitor } from '@capacitor/core';

/**
 * Hook to detect the current platform
 * @returns Platform information
 */
export const usePlatform = () => {
    const isNative = Capacitor.isNativePlatform();
    const platform = Capacitor.getPlatform(); // 'web', 'android', 'ios'

    return {
        isWeb: platform === 'web',
        isAndroid: platform === 'android',
        isIOS: platform === 'ios',
        isNative,
        platform
    };
};

/**
 * Check if running on Android
 */
export const isAndroid = (): boolean => {
    return Capacitor.getPlatform() === 'android';
};

/**
 * Check if running on Web
 */
export const isWeb = (): boolean => {
    return Capacitor.getPlatform() === 'web';
};

export default usePlatform;
