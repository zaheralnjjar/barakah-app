import { Capacitor } from '@capacitor/core';

/**
 * Platform detection utilities
 */
export const isAndroid = () => Capacitor.getPlatform() === 'android';
export const isIOS = () => Capacitor.getPlatform() === 'ios';
export const isWeb = () => Capacitor.getPlatform() === 'web';
export const isMobile = () => isAndroid() || isIOS();
export const isNative = () => Capacitor.isNativePlatform();
