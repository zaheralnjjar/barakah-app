
export type FieldType = 'text' | 'textarea' | 'date' | 'time' | 'rating' | 'slider' | 'list' | 'header' |
    'number' | 'email' | 'phone' | 'url' |
    'select' | 'radio' | 'checkbox' | 'toggle' | 'color' |
    'signature' | 'image' | 'callout' | 'divider' | 'qrcode' | 'calculation' |
    'counter' | 'step_tracker';

export type FieldWidth = 'w-1/4' | 'w-1/3' | 'w-1/2' | 'w-2/3' | 'w-3/4' | 'w-full';
export type FieldHeight = 'h-auto' | 'h-20' | 'h-32' | 'h-48' | 'h-64' | 'h-96';

export interface ValidationRule {
    min?: number;
    max?: number;
    minLength?: number;
    maxLength?: number;
    pattern?: string;
    required?: boolean;
}

export interface FieldStyle {
    bold?: boolean;
    italic?: boolean;
    color?: string;
    fontSize?: 'sm' | 'md' | 'lg' | 'xl';
    align?: 'right' | 'center' | 'left';
    icon?: string;
}

export interface ConditionalLogic {
    action: 'show' | 'hide';
    whenField: string;
    equals: string | number | boolean;
}

export interface FormField {
    id: string;
    type: FieldType;
    label: string;
    placeholder?: string;
    min?: number;
    max?: number;
    options?: string[];
    width?: FieldWidth;
    height?: FieldHeight;
    required?: boolean;
    barColor?: string;
    calloutType?: 'info' | 'warning' | 'error' | 'success';
    validation?: ValidationRule;
    style?: FieldStyle;
    defaultValue?: any;
    logic?: ConditionalLogic;
    formula?: string;
    qrContent?: string;
    prefix?: string;
    suffix?: string;
    step?: number;
    helperText?: string;
    readOnly?: boolean;
    dateFormat?: string;
}

export interface OutputFieldSetting {
    fieldId: string;
    visible: boolean;
    order: number;
    customLabel?: string;
    displayStyle?: 'default' | 'highlight' | 'minimal' | 'badge';
}

export interface OutputConfig {
    showTitle: boolean;
    showDate: boolean;
    themeColor: string;
    layoutStyle: 'modern' | 'formal' | 'creative' | 'minimal';
    fieldSettings: OutputFieldSetting[];
    htmlTemplate?: string;
}

export interface DashboardConfig {
    enabled: boolean;
    widgets: any[]; // Simplified for brevity
}

export interface SmartTemplateConfig {
    fields: FormField[];
    outputConfig?: OutputConfig;
    dashboardConfig?: DashboardConfig;
    meta?: any;
    render?: (data: any) => string;
    resultConfig?: any;
}

export interface Template {
    id: string;
    name: string;
    description: string;
    content: string | SmartTemplateConfig;
    icon: any;
    defaultColor?: string;
    isCustom?: boolean;
    type?: 'simple' | 'smart' | 'smart-json';
    category?: string;
    isVisible?: boolean; // Added for visibility toggling
}
