import { useState, useMemo } from "react";
import { Transaction, CATEGORY_MAP, CategoryKey } from "../types";
import { 
  Utensils, 
  Car, 
  Zap, 
  Briefcase, 
  ShoppingBag, 
  Film, 
  MoreHorizontal, 
  Search, 
  Trash2, 
  Edit, 
  ArrowUpRight, 
  ArrowDownRight,
  Filter,
  TrendingDown
} from "lucide-react";

interface TransactionListProps {
  transactions: Transaction[];
  onDelete: (id: string) => Promise<void>;
  onEdit: (transaction: Transaction) => void;
}

// Icon mapper helper
const getCategoryIcon = (categoryKey: string) => {
  switch (categoryKey) {
    case "Salary":
      return <Briefcase className="w-5 h-5" />;
    case "Food":
      return <Utensils className="w-5 h-5" />;
    case "Transport":
      return <Car className="w-5 h-5" />;
    case "Utilities":
      return <Zap className="w-5 h-5" />;
    case "Shopping":
      return <ShoppingBag className="w-5 h-5" />;
    case "Entertainment":
      return <Film className="w-5 h-5" />;
    default:
      return <MoreHorizontal className="w-5 h-5" />;
  }
};

export default function TransactionList({ transactions, onDelete, onEdit }: TransactionListProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<"all" | "income" | "expense">("all");
  const [filterCategory, setFilterCategory] = useState<string>("all");

  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      // 1. Search term match
      const descMatch = t.description.toLowerCase().includes(searchTerm.toLowerCase());
      const catConfig = CATEGORY_MAP[t.category as CategoryKey];
      const catMatch = catConfig ? catConfig.label.toLowerCase().includes(searchTerm.toLowerCase()) : false;
      const searchMatch = descMatch || catMatch;

      // 2. Type filter match
      const typeMatch = filterType === "all" || t.type === filterType;

      // 3. Category filter match
      const categoryMatch = filterCategory === "all" || t.category === filterCategory;

      return searchMatch && typeMatch && categoryMatch;
    }).sort((a, b) => {
      // Sort by date descending, then by creation date if dates are equal
      if (a.date !== b.date) {
        return b.date.localeCompare(a.date);
      }
      return b.createdAt.localeCompare(a.createdAt);
    });
  }, [transactions, searchTerm, filterType, filterCategory]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("th-TH", {
      style: "currency",
      currency: "THB"
    }).format(value);
  };

  const formatThaiDate = (dateStr: string) => {
    const thaiMonthsShort = [
      "ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.",
      "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."
    ];
    try {
      const parts = dateStr.split("-");
      if (parts.length === 3) {
        const year = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1;
        const day = parseInt(parts[2], 10);
        return `${day} ${thaiMonthsShort[month]} ${year + 543}`;
      }
    } catch (e) {
      console.error(e);
    }
    return dateStr;
  };

  return (
    <div className="bg-white rounded-2xl shadow-md border border-slate-100 p-6 space-y-5">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
          <span>รายการบันทึกทั้งหมด</span>
          <span className="text-xs font-normal text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full">
            {filteredTransactions.length} รายการ
          </span>
        </h3>

        {/* Search Input */}
        <div className="relative md:w-72">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
            <Search className="w-4 h-4" />
          </span>
          <input
            type="text"
            placeholder="ค้นหาตามคำอธิบาย..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-slate-50"
          />
        </div>
      </div>

      {/* Filters Toolbar */}
      <div className="flex flex-wrap items-center gap-3 bg-slate-50/50 p-3 rounded-xl border border-slate-100">
        <div className="flex items-center gap-1.5 text-xs text-slate-500 mr-2">
          <Filter className="w-3.5 h-3.5" />
          <span className="font-medium">ตัวกรอง:</span>
        </div>

        {/* Type selector */}
        <div className="flex bg-white rounded-lg border border-slate-200 p-0.5 text-xs">
          <button
            onClick={() => setFilterType("all")}
            className={`px-3 py-1 rounded-md font-medium cursor-pointer transition-colors ${
              filterType === "all" ? "bg-indigo-600 text-white" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            ทั้งหมด
          </button>
          <button
            onClick={() => setFilterType("income")}
            className={`px-3 py-1 rounded-md font-medium cursor-pointer transition-colors ${
              filterType === "income" ? "bg-emerald-500 text-white" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            รายรับ
          </button>
          <button
            onClick={() => setFilterType("expense")}
            className={`px-3 py-1 rounded-md font-medium cursor-pointer transition-colors ${
              filterType === "expense" ? "bg-rose-500 text-white" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            รายจ่าย
          </button>
        </div>

        {/* Category selector */}
        <div className="relative">
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="bg-white rounded-lg border border-slate-200 py-1.5 pl-3 pr-8 text-xs font-medium text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none cursor-pointer"
          >
            <option value="all">ทุกหมวดหมู่</option>
            {Object.entries(CATEGORY_MAP).map(([key, val]) => (
              <option key={key} value={key}>
                {val.label}
              </option>
            ))}
          </select>
          <span className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-[10px]">▼</span>
        </div>
      </div>

      {/* List items */}
      <div className="divide-y divide-slate-100 max-h-[500px] overflow-y-auto pr-1">
        {filteredTransactions.length > 0 ? (
          filteredTransactions.map((t) => {
            const catConfig = CATEGORY_MAP[t.category as CategoryKey] || CATEGORY_MAP.Others;
            
            return (
              <div 
                key={t.id} 
                className="flex items-center justify-between py-4 group hover:bg-slate-50/30 px-2 rounded-xl transition-all duration-150"
              >
                {/* Left side: Category Icon & Details */}
                <div className="flex items-center gap-3.5">
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center border ${catConfig.bgColor} ${catConfig.borderColor} shadow-sm`}>
                    {getCategoryIcon(t.category)}
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-slate-800">
                      {t.description}
                    </h4>
                    <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-400">
                      <span>{catConfig.label}</span>
                      <span>•</span>
                      <span>{formatThaiDate(t.date)}</span>
                    </div>
                  </div>
                </div>

                {/* Right side: Amount and Actions */}
                <div className="flex items-center gap-5">
                  <div className="text-right">
                    <span className={`text-sm font-bold flex items-center justify-end gap-1 ${
                      t.type === "income" ? "text-emerald-600" : "text-red-600"
                    }`}>
                      {t.type === "income" ? "+" : "-"}
                      {formatCurrency(t.amount)}
                    </span>
                  </div>

                  {/* Actions buttons */}
                  <div className="flex items-center gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-150">
                    <button
                      onClick={() => onEdit(t)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer transition-colors"
                      title="แก้ไขรายการ"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onDelete(t.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 cursor-pointer transition-colors"
                      title="ลบรายการ"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-slate-400 space-y-2">
            <TrendingDown className="w-10 h-10 stroke-1" />
            <p className="text-sm">ไม่พบรายการบันทึกที่ตรงตามเงื่อนไข</p>
          </div>
        )}
      </div>
    </div>
  );
}
