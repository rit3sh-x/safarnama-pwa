import {
    Utensils,
    Car,
    Bed,
    ShoppingBag,
    Plane,
    Train,
    Coffee,
    Film,
    Fuel,
    Ticket,
    Stethoscope,
    Receipt,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface ExpenseCategory {
    icon: LucideIcon;
    label: string;
    pattern: RegExp;
    color: string;
}

export const EXPENSE_CATEGORIES: ExpenseCategory[] = [
    {
        icon: Utensils,
        label: "Food",
        pattern:
            /food|dinner|lunch|breakfast|meal|restaurant|eat|biryani|pizza|burger|snack/i,
        color: "text-orange-500",
    },
    {
        icon: Coffee,
        label: "Drinks",
        pattern: /coffee|tea|chai|drink|juice|bar|beer|wine/i,
        color: "text-amber-700",
    },
    {
        icon: Car,
        label: "Cab",
        pattern: /cab|taxi|uber|ola|ride|auto|rickshaw/i,
        color: "text-blue-500",
    },
    {
        icon: Fuel,
        label: "Fuel",
        pattern: /fuel|petrol|diesel|gas|charging/i,
        color: "text-red-500",
    },
    {
        icon: Train,
        label: "Train",
        pattern: /train|metro|railway|rail/i,
        color: "text-green-600",
    },
    {
        icon: Plane,
        label: "Flight",
        pattern: /flight|fly|airport|airline|plane/i,
        color: "text-sky-500",
    },
    {
        icon: Bed,
        label: "Stay",
        pattern: /hotel|stay|hostel|airbnb|room|lodge|resort|accommodation/i,
        color: "text-purple-500",
    },
    {
        icon: ShoppingBag,
        label: "Shopping",
        pattern: /shop|buy|purchase|market|mall|souvenir/i,
        color: "text-pink-500",
    },
    {
        icon: Film,
        label: "Entertainment",
        pattern: /movie|film|show|concert|museum|park|activity|adventure|trek/i,
        color: "text-indigo-500",
    },
    {
        icon: Ticket,
        label: "Tickets",
        pattern: /ticket|entry|pass|booking|reservation/i,
        color: "text-teal-500",
    },
    {
        icon: Stethoscope,
        label: "Medical",
        pattern: /medical|medicine|doctor|pharmacy|health|hospital/i,
        color: "text-red-600",
    },
    {
        icon: Receipt,
        label: "Other",
        pattern: /.*/,
        color: "text-muted-foreground",
    },
];

export function getExpenseCategory(title: string) {
    return (
        EXPENSE_CATEGORIES.find((c) => c.pattern.test(title)) ??
        EXPENSE_CATEGORIES[EXPENSE_CATEGORIES.length - 1]
    );
}
