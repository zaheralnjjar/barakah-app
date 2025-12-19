import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function normalizeNumbers(input: string): string {
  if (!input) return input;
  const arabicToEnglishMap: { [key: string]: string } = {
    '٠': '0', '١': '1', '٢': '2', '٣': '3', '٤': '4',
    '٥': '5', '٦': '6', '٧': '7', '٨': '8', '٩': '9'
  };
  return input.replace(/[٠-٩]/g, match => arabicToEnglishMap[match]);
}

export function formatNumberToLocale(num: number | string, locale: 'en' | 'ar' = 'ar'): string {
  if (num === null || num === undefined) return '';
  return num.toString().replace(/\d/g, d => {
    if (locale === 'ar') {
      const englishToArabicMap: { [key: string]: string } = {
        '0': '٠', '1': '١', '2': '٢', '3': '٣', '4': '٤',
        '5': '٥', '6': '٦', '7': '٧', '8': '٨', '9': '٩'
      };
      return englishToArabicMap[d];
    }
    return d;
  });
}
