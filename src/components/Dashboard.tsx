import { useMemo, useState } from "react";
import { Transaction, CATEGORY_MAP, CategoryKey } from "../types";
import { ArrowUpRight, ArrowDownRight, Wallet, TrendingUp, PieChart as PieIcon, HelpCircle, FileSpreadsheet, Download, CalendarRange, CheckCircle2, AlertCircle } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Legend, PieChart, Pie, Cell } from "recharts";
import * as XLSX from "xlsx";

interface DashboardProps {
  transactions: Transaction[];
}

export default function Dashboard({ transactions }: DashboardProps) {
  const [exportMonths, setExportMonths] = useState(3);
  const [exportSuccess, setExportSuccess] = useState(false);
  const [exportError, setExportError] = useState("");

  const handleExportExcel = () => {
    try {
      setExportError("");
      setExportSuccess(false);

      // Get list of last N months relative to current date
      const currentDate = new Date();
      const cutoffMonths: string[] = [];
      for (let i = 0; i < exportMonths; i++) {
        const d = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
        const yearStr = d.getFullYear();
        const monthStr = String(d.getMonth() + 1).padStart(2, "0");
        cutoffMonths.push(`${yearStr}-${monthStr}`);
      }

      const filtered = transactions.filter((t) => {
        const tMonth = t.date.substring(0, 7); // "YYYY-MM"
        return cutoffMonths.includes(tMonth);
      });

      if (filtered.length === 0) {
        setExportError(`ไม่พบข้อมูลธุรกรรมในช่วง ${exportMonths} เดือนที่ผ่านมา`);
        return;
      }

      // 1. Prepare Sheet 1: Transactions
      const transactionRows = filtered.map((t, index) => {
        const categoryLabel = CATEGORY_MAP[t.category as CategoryKey]?.label || t.category;
        const typeLabel = t.type === "income" ? "รายรับ" : "รายจ่าย";
        return {
          "ลำดับ (No.)": index + 1,
          "วันที่ (Date)": t.date,
          "ประเภท (Type)": typeLabel,
          "หมวดหมู่ (Category)": categoryLabel,
          "จำนวนเงิน (THB)": t.amount,
          "รายละเอียด (Description)": t.description
        };
      });

      // 2. Prepare Sheet 2: Summary Report
      let totalIncome = 0;
      let totalExpense = 0;
      const categoryTotals: Record<string, { income: number; expense: number }> = {};

      filtered.forEach((t) => {
        if (t.type === "income") {
          totalIncome += t.amount;
        } else {
          totalExpense += t.amount;
        }

        const categoryLabel = CATEGORY_MAP[t.category as CategoryKey]?.label || t.category;
        if (!categoryTotals[categoryLabel]) {
          categoryTotals[categoryLabel] = { income: 0, expense: 0 };
        }
        if (t.type === "income") {
          categoryTotals[categoryLabel].income += t.amount;
        } else {
          categoryTotals[categoryLabel].expense += t.amount;
        }
      });

      const summaryRows = [
        { "หัวข้อสรุปภาพรวม (Summary)": "ผลรวมรายรับทั้งหมด", "ยอดเงิน (บาท)": totalIncome },
        { "หัวข้อสรุปภาพรวม (Summary)": "ผลรวมรายจ่ายทั้งหมด", "ยอดเงิน (บาท)": totalExpense },
        { "หัวข้อสรุปภาพรวม (Summary)": "ยอดคงเหลือสุทธิ (Net Balance)", "ยอดเงิน (บาท)": totalIncome - totalExpense },
        { "หัวข้อสรุปภาพรวม (Summary)": "", "ยอดเงิน (บาท)": "" }, // blank row
        { "หัวข้อสรุปภาพรวม (Summary)": "สรุปตามหมวดหมู่ (Category Breakdown)", "ยอดเงิน (บาท)": "" }
      ];

      Object.entries(categoryTotals).forEach(([catLabel, val]) => {
        if (val.income > 0) {
          summaryRows.push({
            "หัวข้อสรุปภาพรวม (Summary)": `${catLabel} (รายรับ)`,
            "ยอดเงิน (บาท)": val.income
          });
        }
        if (val.expense > 0) {
          summaryRows.push({
            "หัวข้อสรุปภาพรวม (Summary)": `${catLabel} (รายจ่าย)`,
            "ยอดเงิน (บาท)": val.expense
          });
        }
      });

      // 3. Prepare Sheet 0: Beautiful Monthly Comparative Dashboard Sheet
      const thaiMonths = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
      const sortedSelectedMonths = [...cutoffMonths].reverse();
      
      const monthlyDetails = sortedSelectedMonths.map((monthKey) => {
        let income = 0;
        let expense = 0;
        
        filtered.forEach((t) => {
          if (t.date.substring(0, 7) === monthKey) {
            if (t.type === "income") {
              income += t.amount;
            } else {
              expense += t.amount;
            }
          }
        });

        const [year, month] = monthKey.split("-");
        const monthIndex = parseInt(month, 10) - 1;
        const displayLabel = `${thaiMonths[monthIndex]} ${parseInt(year, 10) + 543}`;

        return {
          monthKey,
          label: displayLabel,
          income,
          expense,
          balance: income - expense
        };
      });

      const maxMonthlyVal = Math.max(...monthlyDetails.map(m => Math.max(m.income, m.expense)), 1);

      const dashboardRows: any[][] = [
        ["📊 แดชบอร์ดสรุปรายรับ - รายจ่าย รายเดือน (Smart Financial Dashboard)"],
        [`ช่วงเวลารายงาน: ย้อนหลัง ${exportMonths} เดือนล่าสุด (${monthlyDetails[0]?.label || ""} - ${monthlyDetails[monthlyDetails.length - 1]?.label || ""})`],
        [`ส่งออกเมื่อ: ${new Date().toLocaleString("th-TH")} | สกุลเงิน: บาท (THB)`],
        [""], // Spacer
        ["[ 1. สรุปยอดรวมภาพรวมการเงิน (Financial Overview KPI) ]"],
        ["ประเภทกระแสเงินสด", "ยอดรวมสุทธิ (บาท)", "สัดส่วน", "คำอธิบายรายละเอียด"],
        ["รายรับทั้งหมด (Total Income)", totalIncome, "100.0%", "รายรับทั้งหมดที่บันทึกไว้ในระบบตามช่วงเวลาที่เลือก"],
        ["รายจ่ายทั้งหมด (Total Expense)", totalExpense, `${totalIncome > 0 ? ((totalExpense / totalIncome) * 100).toFixed(1) : "0.0"}%`, "ยอดรวมค่าใช้จ่ายทั้งหมดและรายการถอนจ่ายเงิน"],
        ["ดุลเงินคงเหลือสุทธิ (Net Savings)", totalIncome - totalExpense, `${totalIncome > 0 ? (((totalIncome - totalExpense) / totalIncome) * 100).toFixed(1) : "0.0"}%`, "เงินคงเหลือออมสุทธิสะสม (รายรับหักลบรายจ่าย)"],
        [""], // Spacer
        ["[ 2. กราฟและตารางวิเคราะห์เปรียบเทียบ รายรับ vs รายจ่าย รายเดือน ]"],
        ["เดือน/ปี (Month)", "รายรับ (Income)", "รายจ่าย (Expense)", "คงเหลือสุทธิ (Net)", "สถานะดุลการเงิน", "สัดส่วนรายรับ (Green Chart)", "สัดส่วนรายจ่าย (Red Chart)"],
      ];

      // Add monthly data with color-coded Unicode comparison bars (similar to chart shown in screenshot)
      monthlyDetails.forEach((md) => {
        // Normalize block size (max 10 blocks)
        const incomeBlocks = Math.round((md.income / maxMonthlyVal) * 10);
        const expenseBlocks = Math.round((md.expense / maxMonthlyVal) * 10);
        
        const incomeBar = md.income > 0 ? "█".repeat(Math.max(1, incomeBlocks)) : "░";
        const expenseBar = md.expense > 0 ? "█".repeat(Math.max(1, expenseBlocks)) : "░";

        const statusStr = md.balance > 0 
          ? "🟢 เกินดุล (Surplus)" 
          : md.balance < 0 
            ? "🔴 ขาดดุล (Deficit)" 
            : "⚪ สมดุล (Balanced)";

        dashboardRows.push([
          md.label,
          md.income,
          md.expense,
          md.balance,
          statusStr,
          incomeBar,
          expenseBar
        ]);
      });

      // Insight savings recommendation block
      dashboardRows.push([""]);
      dashboardRows.push(["[ 3. แนะนำและวิเคราะห์ยอดการออมเงิน (Savings Insight Recommendation) ]"]);
      const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpense) / totalIncome) * 100 : 0;
      let insightMessage = "";
      if (savingsRate > 30) {
        insightMessage = "🌟 ยอดเยี่ยมยอดออมสูงมาก! คุณมีสัดส่วนออมเงินดีมากสูงกว่า 30% แนะนำจัดสรรเงินนี้ไปลงทุนเพื่อให้ผลตอบแทนงอกเงย";
      } else if (savingsRate > 10) {
        insightMessage = "👍 สุขภาพการเงินดี! สัดส่วนการออมอยู่ในระดับปลอดภัย 10%-30% แนะนำรักษาพฤติกรรมใช้จ่ายที่ดีนี้ไว้อย่างต่อเนื่อง";
      } else if (savingsRate >= 0) {
        insightMessage = "⚠️ พึงระวังเป็นพิเศษ! คุณมีเงินออมค่อนข้างน้อยต่ำกว่า 10% ควรเริ่มประเมินค่าใช้จ่ายที่ไม่จำเป็นเพื่อปรับปรุงยอดออม";
      } else {
        insightMessage = "🚨 ระดับวิกฤตทางการเงิน! คุณมีรายจ่ายรวมสูงเกินรายรับ แนะนำให้วางแผนตัดค่าใช้จ่ายฟุ่มเฟือยทั้งหมดโดยด่วน";
      }
      dashboardRows.push(["สุขภาพการเงินโดยรวม", `อัตราออมเงินเฉลี่ย ${savingsRate.toFixed(1)}%`, insightMessage, ""]);

      // Create workbook and append worksheets (Dashboard first!)
      const wb = XLSX.utils.book_new();
      const wsDashboard = XLSX.utils.aoa_to_sheet(dashboardRows);
      const wsTransactions = XLSX.utils.json_to_sheet(transactionRows);
      const wsSummary = XLSX.utils.json_to_sheet(summaryRows);

      // Apply gorgeous Excel conditional and native color formatting dynamically
      // 1. wsDashboard formatting
      for (const key in wsDashboard) {
        if (key[0] === "!") continue;
        const cell = wsDashboard[key];
        if (!cell) continue;

        const col = key.match(/[A-Z]+/)?.[0] || "";
        const row = parseInt(key.match(/\d+/)?.[0] || "0", 10);

        // KPI Summary (Row 7, 8, 9)
        if (col === "B" && row >= 7 && row <= 9) {
          if (row === 7) {
            cell.z = "[Green]฿#,##0;[Red]-฿#,##0;\"-\"";
          } else if (row === 8) {
            cell.z = "[Red]฿#,##0;[Red]-฿#,##0;\"-\"";
          } else if (row === 9) {
            cell.z = "[Green]฿#,##0;[Red]-฿#,##0;\"-\"";
          }
        }

        // Monthly breakdown (Rows starting from 13 down to 13 + monthlyDetails.length)
        const startRow = 13;
        const endRow = startRow + monthlyDetails.length - 1;
        if (row >= startRow && row <= endRow) {
          if (col === "B") {
            cell.z = "[Green]฿#,##0;[Red]-฿#,##0;\"-\"";
          } else if (col === "C") {
            cell.z = "[Red]฿#,##0;[Red]-฿#,##0;\"-\"";
          } else if (col === "D") {
            cell.z = "[Green]฿#,##0;[Red]-฿#,##0;\"-\"";
          } else if (col === "F") {
            // Native Green Color Formatting for Income Visual Bar!
            cell.z = "[Green]@";
          } else if (col === "G") {
            // Native Red Color Formatting for Expense Visual Bar!
            cell.z = "[Red]@";
          }
        }
      }

      // 2. wsTransactions formatting
      for (const key in wsTransactions) {
        if (key[0] === "!") continue;
        const cell = wsTransactions[key];
        if (!cell) continue;

        const col = key.match(/[A-Z]+/)?.[0] || "";
        const row = parseInt(key.match(/\d+/)?.[0] || "0", 10);

        if (col === "E" && row >= 2) {
          const typeCell = wsTransactions[`C${row}`];
          const typeText = typeCell ? String(typeCell.v) : "";
          if (typeText.includes("รายรับ")) {
            cell.z = "[Green]฿#,##0;[Red]-฿#,##0;\"0\"";
          } else {
            cell.z = "[Red]฿#,##0;[Red]-฿#,##0;\"0\"";
          }
        }
      }

      // 3. wsSummary formatting
      for (const key in wsSummary) {
        if (key[0] === "!") continue;
        const cell = wsSummary[key];
        if (!cell) continue;

        const col = key.match(/[A-Z]+/)?.[0] || "";
        const row = parseInt(key.match(/\d+/)?.[0] || "0", 10);

        if (col === "B" && row >= 2) {
          const labelCell = wsSummary[`A${row}`];
          const labelText = labelCell ? String(labelCell.v) : "";
          if (labelText.includes("รายรับ") || labelText.includes("คงเหลือ")) {
            cell.z = "[Green]฿#,##0;[Red]-฿#,##0;\"0\"";
          } else if (labelText.includes("รายจ่าย")) {
            cell.z = "[Red]฿#,##0;[Red]-฿#,##0;\"0\"";
          } else {
            cell.z = "฿#,##0;[Red]-฿#,##0;\"0\"";
          }
        }
      }

      // Configure Column widths to look exceptionally neat
      wsDashboard["!cols"] = [
        { wch: 28 }, // Month / Title
        { wch: 18 }, // Income / Values
        { wch: 18 }, // Expense / Ratio
        { wch: 18 }, // Net / Detail
        { wch: 22 }, // Status indicator
        { wch: 30 }, // Green Chart
        { wch: 30 }  // Red Chart
      ];
      wsTransactions["!cols"] = [
        { wch: 12 }, // ลำดับ
        { wch: 15 }, // วันที่
        { wch: 12 }, // ประเภท
        { wch: 22 }, // หมวดหมู่
        { wch: 18 }, // จำนวนเงิน
        { wch: 40 }  // รายละเอียด
      ];
      wsSummary["!cols"] = [
        { wch: 40 }, // หัวข้อสรุป
        { wch: 20 }  // ยอดเงิน
      ];

      // Add to Workbook (with the Dashboard sheet being the primary default visible tab)
      XLSX.utils.book_append_sheet(wb, wsDashboard, "📊 แดชบอร์ดรายเดือน");
      XLSX.utils.book_append_sheet(wb, wsTransactions, "รายการธุรกรรม");
      XLSX.utils.book_append_sheet(wb, wsSummary, "สรุปทางการเงิน");

      // Save file
      const fileName = `SmartWallet_Dashboard_Report_Last_${exportMonths}M_${new Date().toISOString().substring(0, 10)}.xlsx`;
      XLSX.writeFile(wb, fileName);

      setExportSuccess(true);
      setTimeout(() => setExportSuccess(false), 5000); // clear success msg after 5s
    } catch (err: any) {
      console.error(err);
      setExportError(err?.message || "เกิดข้อผิดพลาดขณะส่งออกไฟล์ Excel");
    }
  };

  // 1. Calculate main metrics
  const metrics = useMemo(() => {
    let totalIncome = 0;
    let totalExpense = 0;
    
    // Get current month in format YYYY-MM
    const currentMonthStr = new Date().toISOString().substring(0, 7);

    let monthlyIncome = 0;
    let monthlyExpense = 0;

    transactions.forEach((t) => {
      const isCurrentMonth = t.date.substring(0, 7) === currentMonthStr;

      if (t.type === "income") {
        totalIncome += t.amount;
        if (isCurrentMonth) monthlyIncome += t.amount;
      } else {
        totalExpense += t.amount;
        if (isCurrentMonth) monthlyExpense += t.amount;
      }
    });

    return {
      totalBalance: totalIncome - totalExpense,
      monthlyIncome,
      monthlyExpense,
      monthlyBalance: monthlyIncome - monthlyExpense
    };
  }, [transactions]);

  // 2. Format month-by-month historical data for the Bar Chart
  const barChartData = useMemo(() => {
    const monthlyGroups: Record<string, { income: number; expense: number }> = {};
    
    transactions.forEach((t) => {
      const monthKey = t.date.substring(0, 7); // "YYYY-MM"
      if (!monthlyGroups[monthKey]) {
        monthlyGroups[monthKey] = { income: 0, expense: 0 };
      }
      if (t.type === "income") {
        monthlyGroups[monthKey].income += t.amount;
      } else {
        monthlyGroups[monthKey].expense += t.amount;
      }
    });

    // Sort months chronologically
    const sortedMonths = Object.keys(monthlyGroups).sort();
    
    // Convert to readable formats for display (e.g. "ม.ค. 2026")
    const thaiMonths = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
    
    return sortedMonths.map((monthKey) => {
      const [year, month] = monthKey.split("-");
      const monthIndex = parseInt(month, 10) - 1;
      const displayLabel = `${thaiMonths[monthIndex]} ${parseInt(year, 10) + 543}`; // Convert to Buddhist Era year if desired, or just use monthKey
      
      return {
        month: displayLabel,
        rawMonth: monthKey,
        รายรับ: monthlyGroups[monthKey].income,
        รายจ่าย: monthlyGroups[monthKey].expense
      };
    }).slice(-6); // Limit to last 6 months
  }, [transactions]);

  // 3. Category breakdown data for Pie Chart (Expenses only, current month optionally or all-time)
  const pieChartData = useMemo(() => {
    const categoryGroups: Record<string, number> = {};
    
    transactions
      .filter((t) => t.type === "expense")
      .forEach((t) => {
        categoryGroups[t.category] = (categoryGroups[t.category] || 0) + t.amount;
      });

    return Object.entries(categoryGroups).map(([catKey, totalAmount]) => {
      const catConfig = CATEGORY_MAP[catKey as CategoryKey] || CATEGORY_MAP.Others;
      return {
        name: catConfig.label,
        value: totalAmount,
        color: catConfig.color
      };
    }).sort((a, b) => b.value - a.value);
  }, [transactions]);

  // Formatter helper for Currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("th-TH", {
      style: "currency",
      currency: "THB"
    }).format(value);
  };

  const currentMonthLabel = useMemo(() => {
    const thaiMonths = ["มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน", "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"];
    const now = new Date();
    return `${thaiMonths[now.getMonth()]} ${now.getFullYear() + 543}`;
  }, []);

  return (
    <div className="space-y-6">
      {/* Metrics Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Card 1: Balance */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                ยอดคงเหลือทั้งหมด
              </span>
              <h2 className="text-3xl font-bold text-slate-800 tracking-tight">
                {formatCurrency(metrics.totalBalance)}
              </h2>
            </div>
            <div className="w-12 h-12 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md">
              <Wallet className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2 text-xs font-medium text-emerald-600">
            <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded font-bold">+12.5%</span>
            <span className="text-slate-400">เมื่อเทียบกับเดือนก่อน</span>
          </div>
        </div>

        {/* Card 2: Current Month Income */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                รายรับ ({currentMonthLabel})
              </span>
              <h2 className="text-3xl font-bold text-emerald-600 tracking-tight">
                {formatCurrency(metrics.monthlyIncome)}
              </h2>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
              <ArrowUpRight className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-4">
            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
              <div className="bg-emerald-500 h-full rounded-full" style={{ width: metrics.monthlyIncome > 0 ? "75%" : "0%" }}></div>
            </div>
          </div>
        </div>

        {/* Card 3: Current Month Expense */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                รายจ่าย ({currentMonthLabel})
              </span>
              <h2 className="text-3xl font-bold text-rose-600 tracking-tight">
                {formatCurrency(metrics.monthlyExpense)}
              </h2>
            </div>
            <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-100">
              <ArrowDownRight className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-4">
            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
              <div 
                className="bg-rose-500 h-full rounded-full transition-all duration-300" 
                style={{ width: `${Math.min(100, (metrics.monthlyExpense / (metrics.monthlyIncome || 1)) * 100)}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* Export to Excel Section */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100 flex-shrink-0">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800 leading-tight">ส่งออกรายงานทางการเงิน (Export to Excel)</h3>
              <p className="text-xs text-slate-400 mt-1">ดาวน์โหลดบันทึกรายรับ-รายจ่าย ย้อนหลังสูงสุด 12 เดือน (เลือกจำนวนเดือนได้ตามใจชอบ)</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {/* Month selector */}
            <div className="flex items-center gap-2 border border-slate-200 rounded-xl px-3 py-2 bg-slate-50">
              <CalendarRange className="w-4 h-4 text-slate-400" />
              <span className="text-xs font-semibold text-slate-600">ช่วงเวลา:</span>
              <select
                value={exportMonths}
                onChange={(e) => {
                  setExportMonths(Number(e.target.value));
                  setExportError("");
                  setExportSuccess(false);
                }}
                className="text-xs font-bold text-slate-800 bg-transparent outline-none cursor-pointer pr-1 focus:ring-0"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((m) => (
                  <option key={m} value={m}>{m} เดือนล่าสุด</option>
                ))}
              </select>
            </div>

            {/* Export button */}
            <button
              onClick={handleExportExcel}
              className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-sm transition-all duration-150 cursor-pointer whitespace-nowrap"
            >
              <Download className="w-4 h-4" />
              <span>ดาวน์โหลดไฟล์ Excel</span>
            </button>
          </div>
        </div>

        {/* Status Messages */}
        {exportSuccess && (
          <div className="mt-3 flex items-center gap-2 text-xs text-emerald-600 font-semibold bg-emerald-50/50 border border-emerald-100 px-3 py-2 rounded-lg">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            <span>สร้างและดาวน์โหลดรายงาน Excel สำเร็จแล้ว! (มีรายละเอียดและสรุปรายประเภทแยกชีท)</span>
          </div>
        )}
        {exportError && (
          <div className="mt-3 flex items-center gap-2 text-xs text-rose-600 font-semibold bg-rose-50/50 border border-rose-100 px-3 py-2 rounded-lg">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{exportError}</span>
          </div>
        )}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Historical Monthly Trend */}
        <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm lg:col-span-3">
          <h3 className="text-sm font-semibold text-slate-800 mb-6 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-slate-500" />
            <span>แนวโน้มรายรับ-รายจ่าย (ย้อนหลัง 6 เดือน)</span>
          </h3>
          
          <div className="h-72 w-full">
            {barChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barChartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: "#64748b" }} />
                  <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "#64748b" }} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: "#0f172a", borderRadius: "12px", border: "none", color: "#fff" }}
                    labelStyle={{ fontWeight: "bold", marginBottom: "4px" }}
                    formatter={(value: number) => [formatCurrency(value), ""]}
                  />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: 12, paddingTop: 10 }} />
                  <Bar dataKey="รายรับ" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="รายจ่าย" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-2">
                <HelpCircle className="w-10 h-10 stroke-1" />
                <p className="text-xs">ยังไม่มีข้อมูลสำหรับแสดงแนวโน้มเปรียบเทียบรายเดือน</p>
              </div>
            )}
          </div>
        </div>

        {/* Expense Distribution Category Pie */}
        <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm lg:col-span-2 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-800 mb-6 flex items-center gap-2">
              <PieIcon className="w-4 h-4 text-slate-500" />
              <span>สัดส่วนค่าใช้จ่ายตามหมวดหมู่</span>
            </h3>

            <div className="h-56 w-full relative flex items-center justify-center">
              {pieChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {pieChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ backgroundColor: "#0f172a", borderRadius: "12px", border: "none", color: "#fff" }}
                      formatter={(value: number) => [formatCurrency(value), ""]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-2">
                  <HelpCircle className="w-10 h-10 stroke-1" />
                  <p className="text-xs">ยังไม่มีข้อมูลรายจ่ายสำหรับวิเคราะห์สัดส่วน</p>
                </div>
              )}
            </div>
          </div>

          {/* List category values */}
          {pieChartData.length > 0 && (
            <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
              {pieChartData.slice(0, 4).map((item, index) => (
                <div key={index} className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                  <span className="text-slate-600 truncate">{item.name}</span>
                  <span className="text-slate-400 ml-auto font-medium">
                    {formatCurrency(item.value)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
