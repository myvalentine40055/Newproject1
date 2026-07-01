export interface Transaction {
  id: string;
  type: "income" | "expense";
  amount: number;
  category: string;
  date: string; // YYYY-MM-DD
  description: string;
  createdAt: string; // ISO string
}

export type CategoryKey = "Food" | "Transport" | "Salary" | "Utilities" | "Shopping" | "Entertainment" | "Others";

export interface CategoryConfig {
  label: string;
  icon: string;
  color: string;
  bgColor: string;
  borderColor: string;
}

export const CATEGORY_MAP: Record<CategoryKey, CategoryConfig> = {
  Salary: {
    label: "เงินเดือน / รายได้",
    icon: "Briefcase",
    color: "#22c55e", // green-500
    bgColor: "bg-green-50 text-green-700",
    borderColor: "border-green-200"
  },
  Food: {
    label: "อาหารและเครื่องดื่ม",
    icon: "Utensils",
    color: "#ef4444", // red-500
    bgColor: "bg-red-50 text-red-700",
    borderColor: "border-red-200"
  },
  Transport: {
    label: "การเดินทาง / คมนาคม",
    icon: "Car",
    color: "#3b82f6", // blue-500
    bgColor: "bg-blue-50 text-blue-700",
    borderColor: "border-blue-200"
  },
  Utilities: {
    label: "สาธารณูปโภค / บิลต่างๆ",
    icon: "Zap",
    color: "#f59e0b", // amber-500
    bgColor: "bg-amber-50 text-amber-700",
    borderColor: "border-amber-200"
  },
  Shopping: {
    label: "ช้อปปิ้ง / ซื้อของ",
    icon: "ShoppingBag",
    color: "#ec4899", // pink-500
    bgColor: "bg-pink-50 text-pink-700",
    borderColor: "border-pink-200"
  },
  Entertainment: {
    label: "ท่องเที่ยว / ความบันเทิง",
    icon: "Film",
    color: "#8b5cf6", // purple-500
    bgColor: "bg-purple-50 text-purple-700",
    borderColor: "border-purple-200"
  },
  Others: {
    label: "อื่นๆ",
    icon: "MoreHorizontal",
    color: "#6b7280", // gray-500
    bgColor: "bg-gray-50 text-gray-700",
    borderColor: "border-gray-200"
  }
};
