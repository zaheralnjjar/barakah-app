/**
 * Arabic/Hindi Numeral Conversion Utility
 * تحويل الأرقام العربية/الهندية إلى أرقام إنجليزية
 */

// Arabic-Indic numerals: ٠١٢٣٤٥٦٧٨٩
// Extended Arabic-Indic numerals (Farsi/Urdu): ۰۱۲۳۴۵۶۷۸۹

const arabicNumerals: Record<string, string> = {
    '٠': '0', '١': '1', '٢': '2', '٣': '3', '٤': '4',
    '٥': '5', '٦': '6', '٧': '7', '٨': '8', '٩': '9',
    // Extended Arabic-Indic (Farsi/Urdu)
    '۰': '0', '۱': '1', '۲': '2', '۳': '3', '۴': '4',
    '۵': '5', '۶': '6', '۷': '7', '۸': '8', '۹': '9'
};

/**
 * Converts Arabic/Hindi numerals to English numerals
 * @param input - The input string containing Arabic/Hindi numerals
 * @returns The string with all numerals converted to English
 */
export const convertArabicToEnglish = (input: string): string => {
    if (!input) return input;
    return input.split('').map(char => arabicNumerals[char] || char).join('');
};

/**
 * Parses a number string that may contain Arabic/Hindi numerals
 * @param input - The input string
 * @returns The parsed number or NaN if invalid
 */
export const parseArabicNumber = (input: string): number => {
    return parseFloat(convertArabicToEnglish(input));
};

/**
 * Input handler that converts Arabic numerals on the fly
 * Use this as onChange handler for input fields
 */
export const handleArabicInput = (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: (value: string) => void
) => {
    const converted = convertArabicToEnglish(e.target.value);
    setter(converted);
};

export default { convertArabicToEnglish, parseArabicNumber, handleArabicInput };
