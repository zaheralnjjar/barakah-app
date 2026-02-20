import { CreateTrackerDTO } from "@/types/tracking";

export interface TrackerBundle {
    id: string;
    name: string;
    description: string;
    trackers: (CreateTrackerDTO & { id?: string })[]; // id is optional, just for keying if needed
}

export const TRACKER_BUNDLES: TrackerBundle[] = [
    {
        id: "ramadan",
        name: "باقة رمضان 🌙",
        description: "مجموعة متكاملة لشهر رمضان: صلاة، تراويح، قرآن، صدقة، ماء.",
        trackers: [
            { name: "الصلوات الخمس", type: "checklist", icon: "🕌", color: "#10B981", settings: { options: "الفجر\nالظهر\nالعصر\nالمغرب\nالعشاء" } },
            { name: "التراويح/القيام", type: "boolean", icon: "🌙", color: "#8B5CF6", settings: {} },
            { name: "قراءة القرآن", type: "numeric", icon: "📖", color: "#F59E0B", settings: { unit: "صفحة", goal: "20" } }, // stored as strings in DTO usually, converted later? check types
            { name: "شرب الماء", type: "numeric", icon: "💧", color: "#3B82F6", settings: { unit: "لتر", goal: "2", step: "0.25" } },
            { name: "الصدقة اليومية", type: "boolean", icon: "🤲", color: "#EF4444", settings: {} }
        ]
    },
    {
        id: "health",
        name: "باقة الصحة والرياضة 💪",
        description: "ابدأ رحلة صحية: رياضة، ماء، نوم، أكل صحي.",
        trackers: [
            { name: "تمرين رياضي", type: "time", icon: "🏋️", color: "#EF4444", settings: { goal: "30" } },
            { name: "شرب الماء", type: "numeric", icon: "💧", color: "#3B82F6", settings: { unit: "كوب", goal: "8" } },
            { name: "ساعات النوم", type: "numeric", icon: "😴", color: "#6366F1", settings: { unit: "ساعة", goal: "7" } },
            { name: "وجبات صحية", type: "scale", icon: "🥗", color: "#10B981", settings: { min: "1", max: "10" } }
        ]
    },
    {
        id: "productivity",
        name: "باقة الإنتاجية 🚀",
        description: "ركز على أهدافك: عمل عميق، قراءة، تعلم.",
        trackers: [
            { name: "عمل عميق", type: "time", icon: "💻", color: "#F43F5E", settings: { goal: "120" } },
            { name: "قراءة", type: "numeric", icon: "📚", color: "#F59E0B", settings: { unit: "صفحة", goal: "10" } },
            { name: "تعلم مهارة", type: "time", icon: "🧠", color: "#8B5CF6", settings: { goal: "30" } }
        ]
    }
];
