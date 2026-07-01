import React, { useState, useRef } from "react";
import { CATEGORY_MAP, CategoryKey, Transaction } from "../types";
import { Upload, Sparkles, Calendar, Tag, FileText, Check, Loader2, DollarSign, ArrowUpCircle, ArrowDownCircle, Keyboard } from "lucide-react";

interface TransactionFormProps {
  onSave: (transactionData: Omit<Transaction, "id" | "createdAt">) => Promise<void>;
  onCancel?: () => void;
  initialData?: Transaction | null;
  defaultMethod?: "manual" | "scan";
}

export default function TransactionForm({ onSave, onCancel, initialData, defaultMethod = "manual" }: TransactionFormProps) {
  const [type, setType] = useState<"income" | "expense">(initialData?.type || "expense");
  const [amount, setAmount] = useState<string>(initialData?.amount?.toString() || "");
  const [category, setCategory] = useState<string>(initialData?.category || "Food");
  const [date, setDate] = useState<string>(initialData?.date || new Date().toISOString().split("T")[0]);
  const [description, setDescription] = useState<string>(initialData?.description || "");
  
  const [inputMethod, setInputMethod] = useState<"manual" | "scan">(
    initialData ? "manual" : defaultMethod
  );
  
  // Image scanning states
  const [scanning, setScanning] = useState(false);
  const [scanSuccess, setScanSuccess] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageFile = async (file: File) => {
    if (!file) return;

    // Validate if it is indeed an image
    if (!file.type.startsWith("image/")) {
      setScanError("กรุณาเลือกไฟล์รูปภาพเท่านั้น");
      return;
    }

    setScanning(true);
    setScanSuccess(false);
    setScanError(null);

    try {
      // Read file to base64
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onloadend = async () => {
        const base64String = reader.result as string;
        // Strip out the base64 prefix
        const base64Data = base64String.split(",")[1];
        
        // Post to our server endpoint
        const response = await fetch("/api/parse-receipt", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            base64: base64Data,
            mimeType: file.type
          })
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to scan receipt");
        }

        const data = await response.json();
        
        // Auto-fill values with extracted data
        if (data.type) setType(data.type);
        if (data.amount) setAmount(data.amount.toString());
        if (data.category && CATEGORY_MAP[data.category as CategoryKey]) {
          setCategory(data.category);
        } else {
          setCategory("Others");
        }
        if (data.date) setDate(data.date);
        if (data.description) setDescription(data.description);

        setScanSuccess(true);
        setTimeout(() => setScanSuccess(false), 5000); // Clear success message after 5 seconds
      };
    } catch (err: any) {
      console.error(err);
      setScanError("ไม่สามารถวิเคราะห์รูปภาพได้ กรุณาลองใหม่อีกครั้งหรือกรอกข้อมูลด้วยตนเอง");
    } finally {
      setScanning(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleImageFile(e.dataTransfer.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      alert("กรุณาระบุจำนวนเงินที่ถูกต้อง");
      return;
    }

    if (!description.trim()) {
      alert("กรุณาระบุรายละเอียดรายการ");
      return;
    }

    try {
      await onSave({
        type,
        amount: parsedAmount,
        category,
        date,
        description: description.trim()
      });
      
      // Reset form if it is an addition
      if (!initialData) {
        setAmount("");
        setDescription("");
        setScanSuccess(false);
      }
    } catch (err) {
      console.error("Save error:", err);
      alert("เกิดข้อผิดพลาดในการบันทึกข้อมูล");
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-md border border-slate-100 p-6">
      <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
        <span>{initialData ? "แก้ไขรายการ" : "เพิ่มรายการใหม่"}</span>
        {!initialData && (
          <span className="text-xs bg-emerald-50 text-emerald-600 border border-emerald-100 px-2 py-0.5 rounded-full font-normal flex items-center gap-1">
            <Sparkles className="w-3 h-3" /> แนะนำ: สแกนสลิปอัจฉริยะ
          </span>
        )}
      </h3>

      {/* Input Method Switcher (Only for new transactions) */}
      {!initialData && (
        <div className="mb-6">
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
            วิธีการบันทึกข้อมูล
          </label>
          <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-xl border border-slate-200">
            <button
              type="button"
              onClick={() => setInputMethod("manual")}
              className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition-all duration-200 cursor-pointer ${
                inputMethod === "manual"
                  ? "bg-white text-indigo-600 shadow-sm"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <Keyboard className="w-3.5 h-3.5" />
              <span>กรอกข้อมูลเอง (ไม่มีใบเสร็จ)</span>
            </button>
            <button
              type="button"
              onClick={() => setInputMethod("scan")}
              className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition-all duration-200 cursor-pointer ${
                inputMethod === "scan"
                  ? "bg-white text-indigo-600 shadow-sm"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>สแกนใบเสร็จ/สลิปด้วย AI</span>
            </button>
          </div>
        </div>
      )}

      {/* AI Image Auto-fill Import Section (Only for new transactions in scan mode) */}
      {!initialData && inputMethod === "scan" && (
        <div className="mb-6">
          <div
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all duration-200 ${
              scanning
                ? "border-emerald-500 bg-emerald-50/20"
                : scanSuccess
                ? "border-emerald-500 bg-emerald-50/10"
                : "border-slate-200 hover:border-slate-300 hover:bg-slate-50/50"
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={(e) => e.target.files?.[0] && handleImageFile(e.target.files[0])}
              accept="image/*"
              className="hidden"
            />
            
            {scanning ? (
              <div className="flex flex-col items-center justify-center py-2">
                <Loader2 className="w-8 h-8 text-emerald-500 animate-spin mb-2" />
                <p className="text-sm font-medium text-emerald-700">กำลังวิเคราะห์สลิป/ใบเสร็จ...</p>
                <p className="text-xs text-slate-400 mt-1">วิเคราะห์ข้อมูลและแยกแยะประเภทอัตโนมัติด้วย AI</p>
              </div>
            ) : scanSuccess ? (
              <div className="flex flex-col items-center justify-center py-2">
                <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mb-2">
                  <Check className="w-5 h-5" />
                </div>
                <p className="text-sm font-medium text-emerald-700">นำเข้าข้อมูลสำเร็จ!</p>
                <p className="text-xs text-slate-500 mt-1">กรุณาตรวจสอบข้อมูลด้านล่างและกดบันทึก</p>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center">
                <div className="w-10 h-10 rounded-xl bg-slate-50 text-slate-500 flex items-center justify-center mb-2">
                  <Upload className="w-5 h-5" />
                </div>
                <p className="text-sm font-medium text-slate-700">
                  <span className="text-emerald-600 font-semibold">อัปโหลดสลิป/รูปใบเสร็จ</span> หรือลากไฟล์มาวางที่นี่
                </p>
                <p className="text-xs text-slate-400 mt-1">AI จะกรอกรายละเอียด จำนวนเงิน วันที่ และหมวดหมู่ให้โดยอัตโนมัติ</p>
              </div>
            )}
          </div>

          {scanError && (
            <div className="text-xs text-red-500 bg-red-50 border border-red-100 rounded-lg p-2.5 mt-2">
              {scanError}
            </div>
          )}
        </div>
      )}

      {/* Manual Input Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Type Toggle */}
        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
            ประเภทรายการ
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => {
                setType("expense");
                // Select first expense category if currently on Salary (which is an income category)
                if (category === "Salary") setCategory("Food");
              }}
              className={`flex items-center justify-center gap-2 py-3 rounded-xl font-medium border text-sm transition-all duration-200 cursor-pointer ${
                type === "expense"
                  ? "border-red-500 bg-red-50 text-red-700 shadow-sm"
                  : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
              }`}
            >
              <ArrowDownCircle className="w-4 h-4" />
              <span>รายจ่าย</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setType("income");
                setCategory("Salary");
              }}
              className={`flex items-center justify-center gap-2 py-3 rounded-xl font-medium border text-sm transition-all duration-200 cursor-pointer ${
                type === "income"
                  ? "border-emerald-500 bg-emerald-50 text-emerald-700 shadow-sm"
                  : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
              }`}
            >
              <ArrowUpCircle className="w-4 h-4" />
              <span>รายรับ</span>
            </button>
          </div>
        </div>

        {/* Amount Input */}
        <div>
          <label htmlFor="amount-input" className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
            จำนวนเงิน (บาท)
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium text-sm">฿</span>
            <input
              id="amount-input"
              type="number"
              step="any"
              min="0"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-lg font-bold text-slate-800"
              required
            />
          </div>
        </div>

        {/* Category Selector */}
        <div>
          <label htmlFor="category-select" className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
            หมวดหมู่
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
              <Tag className="w-4 h-4" />
            </span>
            <select
              id="category-select"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm text-slate-700 bg-white appearance-none cursor-pointer"
            >
              {Object.entries(CATEGORY_MAP)
                .filter(([key]) => {
                  if (type === "income") {
                    return key === "Salary" || key === "Others";
                  } else {
                    return key !== "Salary";
                  }
                })
                .map(([key, value]) => (
                  <option key={key} value={key}>
                    {value.label}
                  </option>
                ))}
            </select>
          </div>
        </div>

        {/* Date Selector */}
        <div>
          <label htmlFor="date-input" className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
            วันที่ทำรายการ
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
              <Calendar className="w-4 h-4" />
            </span>
            <input
              id="date-input"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm text-slate-700"
              required
            />
          </div>
        </div>

        {/* Description Input */}
        <div>
          <label htmlFor="description-input" className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
            รายละเอียด / บันทึกความจำ
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
              <FileText className="w-4 h-4" />
            </span>
            <input
              id="description-input"
              type="text"
              placeholder="ระบุรายละเอียด เช่น ค่าข้าวเช้า, เงินเดือนออก"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm text-slate-700"
              required
            />
          </div>
        </div>

        {/* Save and Cancel buttons */}
        <div className="flex gap-3 pt-4">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 text-slate-600 font-medium text-sm hover:bg-slate-50 cursor-pointer"
            >
              ยกเลิก
            </button>
          )}
          <button
            type="submit"
            className="flex-1 py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm transition-colors cursor-pointer"
          >
            บันทึก
          </button>
        </div>
      </form>
    </div>
  );
}
