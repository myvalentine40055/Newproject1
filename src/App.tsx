import { useState, useEffect } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { collection, query, onSnapshot, doc, addDoc, updateDoc, deleteDoc, orderBy } from "firebase/firestore";
import { auth, db, logout } from "./lib/firebase";
import LoginScreen from "./components/LoginScreen";
import TransactionForm from "./components/TransactionForm";
import Dashboard from "./components/Dashboard";
import TransactionList from "./components/TransactionList";
import { Transaction } from "./types";
import { 
  Wallet, 
  LogOut, 
  User as UserIcon, 
  PlusCircle, 
  Sparkles, 
  X, 
  Menu, 
  LayoutDashboard, 
  Receipt, 
  Settings, 
  Calendar,
  Layers
} from "lucide-react";

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [isMobileFormOpen, setIsMobileFormOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"dashboard" | "scanner">("dashboard");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // 1. Listen to Firebase Auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setAuthLoading(false);
    });
    return unsubscribe;
  }, []);

  // 2. Listen to User Transactions in Real-time from Firestore
  useEffect(() => {
    if (!user) {
      setTransactions([]);
      return;
    }

    const transactionsRef = collection(db, "users", user.uid, "transactions");
    const q = query(transactionsRef, orderBy("date", "desc"), orderBy("createdAt", "desc"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items: Transaction[] = [];
      snapshot.forEach((docSnap) => {
        items.push({
          id: docSnap.id,
          ...docSnap.data()
        } as Transaction);
      });
      setTransactions(items);
    }, (error) => {
      console.error("Error listening to transactions:", error);
    });

    return unsubscribe;
  }, [user]);

  // 3. Handle Save (Add/Edit) Transaction
  const handleSaveTransaction = async (data: Omit<Transaction, "id" | "createdAt">) => {
    if (!user) return;

    try {
      if (editingTransaction) {
        // Edit Mode
        const docRef = doc(db, "users", user.uid, "transactions", editingTransaction.id);
        await updateDoc(docRef, {
          ...data,
          updatedAt: new Date().toISOString()
        });
        setEditingTransaction(null);
      } else {
        // Add Mode
        const colRef = collection(db, "users", user.uid, "transactions");
        await addDoc(colRef, {
          ...data,
          createdAt: new Date().toISOString()
        });
      }
      setIsMobileFormOpen(false);
    } catch (error) {
      console.error("Error saving transaction:", error);
      throw error;
    }
  };

  // 4. Handle Delete Transaction
  const handleDeleteTransaction = async (id: string) => {
    if (!user) return;
    if (!confirm("คุณต้องการลบรายการนี้ใช่หรือไม่?")) return;

    try {
      const docRef = doc(db, "users", user.uid, "transactions", id);
      await deleteDoc(docRef);
      // If we are currently editing the deleted transaction, cancel editing
      if (editingTransaction?.id === id) {
        setEditingTransaction(null);
      }
    } catch (error) {
      console.error("Error deleting transaction:", error);
      alert("ไม่สามารถลบรายการได้ กรุณาลองใหม่อีกครั้ง");
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-medium text-slate-500">กำลังโหลดระบบ...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginScreen onLoginSuccess={(loggedInUser) => setUser(loggedInUser)} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col lg:flex-row text-slate-900 font-sans antialiased overflow-x-hidden">
      {/* Sidebar: Sticky on Desktop, overlay/slideout or top navigation bar on mobile */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-white flex flex-col justify-between shadow-xl transition-transform duration-300 transform 
        lg:relative lg:translate-x-0 ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:flex"}
      `}>
        {/* Sidebar Content */}
        <div className="flex flex-col h-full flex-1">
          {/* Sidebar Header */}
          <div className="h-16 flex items-center justify-between px-6 border-b border-slate-800 shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md">
                <Wallet className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-sm font-bold tracking-tight">Smart Wallet AI</h1>
                <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Income & Expense</p>
              </div>
            </div>
            {/* Close button for mobile menu */}
            <button 
              onClick={() => setIsMobileMenuOpen(false)} 
              className="lg:hidden p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Items */}
          <nav className="p-4 space-y-1.5 flex-1">
            <button
              onClick={() => {
                setActiveTab("dashboard");
                setIsMobileMenuOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-205 cursor-pointer ${
                activeTab === "dashboard"
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/15"
                  : "text-slate-400 hover:text-slate-100 hover:bg-slate-800/50"
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>แผงควบคุมหลัก</span>
            </button>

            <button
              onClick={() => {
                setActiveTab("scanner");
                setIsMobileMenuOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-205 cursor-pointer ${
                activeTab === "scanner"
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/15"
                  : "text-slate-400 hover:text-slate-100 hover:bg-slate-800/50"
              }`}
            >
              <Receipt className="w-4 h-4" />
              <span className="flex items-center gap-1.5">
                <span>สแกนใบเสร็จ</span>
                <span className="text-[9px] bg-indigo-500/30 text-indigo-300 font-bold px-1.5 py-0.5 rounded-full border border-indigo-500/20">AI</span>
              </span>
            </button>
          </nav>

          {/* User profile at bottom of sidebar */}
          <div className="p-4 border-t border-slate-800 bg-slate-950/40">
            <div className="flex items-center gap-3 mb-4">
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName || "User"}
                  className="w-10 h-10 rounded-full border border-slate-700"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-slate-800 text-slate-400 flex items-center justify-center border border-slate-700">
                  <UserIcon className="w-5 h-5" />
                </div>
              )}
              <div className="text-left overflow-hidden">
                <p className="text-xs font-semibold text-slate-200 leading-tight truncate">
                  {user.displayName || "ผู้ใช้งาน"}
                </p>
                <p className="text-[10px] text-slate-500 truncate">
                  {user.email}
                </p>
              </div>
            </div>

            <button
              onClick={logout}
              className="w-full py-2.5 px-4 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition-all flex items-center justify-center gap-2 text-xs font-semibold cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>ออกจากระบบ</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Backdrop for mobile menu */}
      {isMobileMenuOpen && (
        <div 
          onClick={() => setIsMobileMenuOpen(false)}
          className="fixed inset-0 z-45 bg-slate-900/60 backdrop-blur-xs lg:hidden"
        />
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Top Header Navigation */}
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-200 h-16 flex items-center justify-between px-6 shadow-xs shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="lg:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-50 active:bg-slate-100 border border-slate-200 cursor-pointer"
            >
              <Menu className="w-5 h-5" />
            </button>
            
            <h2 className="text-md font-bold text-slate-800 tracking-tight">
              {activeTab === "dashboard" ? "ภาพรวมทางการเงิน / Financial Dashboard" : "สแกนใบเสร็จ & นำเข้าข้อมูลด้วย AI"}
            </h2>
          </div>

          <div className="flex items-center gap-3 text-xs text-slate-500 font-medium">
            <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 rounded-lg text-slate-600 border border-slate-200">
              <Calendar className="w-3.5 h-3.5" />
              <span>{new Date().toLocaleDateString("th-TH", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</span>
            </div>
          </div>
        </header>

        {/* Content Body */}
        <main className="flex-1 p-4 md:p-8 max-w-7xl w-full mx-auto space-y-6">
          {activeTab === "dashboard" ? (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Form Section on Desktop */}
              <div className="lg:col-span-4 lg:sticky lg:top-20 space-y-4">
                <div className="hidden lg:block">
                  <TransactionForm
                    onSave={handleSaveTransaction}
                    onCancel={editingTransaction ? () => setEditingTransaction(null) : undefined}
                    initialData={editingTransaction}
                  />
                </div>

                {/* Mobile editing state widget */}
                {editingTransaction && !isMobileFormOpen && (
                  <div className="lg:hidden p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-center justify-between shadow-xs">
                    <div className="space-y-0.5">
                      <p className="text-xs font-bold text-amber-800">กำลังแก้ไขรายการ</p>
                      <p className="text-xs text-amber-600 truncate max-w-[200px]">{editingTransaction.description}</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setIsMobileFormOpen(true)}
                        className="px-3 py-1.5 text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white rounded-lg cursor-pointer"
                      >
                        เปิดฟอร์มแก้ไข
                      </button>
                      <button
                        onClick={() => setEditingTransaction(null)}
                        className="p-1.5 text-amber-800 hover:bg-amber-100 rounded-lg cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}

                {/* Promotional banner */}
                <div className="bg-gradient-to-tr from-slate-900 via-slate-850 to-indigo-950 text-white rounded-2xl p-5 shadow-sm overflow-hidden relative border border-slate-800">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-tr from-indigo-500/20 to-teal-400/20 rounded-full blur-xl transform translate-x-8 -translate-y-8"></div>
                  <div className="relative z-10 space-y-2">
                    <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-indigo-500/30 text-indigo-300 border border-indigo-500/30 text-[10px] font-bold">
                      <Sparkles className="w-3 h-3 animate-pulse" /> AI GENERATED
                    </div>
                    <h4 className="text-sm font-bold">สแกนใบเสร็จนำเข้าข้อมูล</h4>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      ถ่ายรูปหรืออัปโหลดรูปสลิปโอนเงินธนาคาร/ใบเสร็จ เพื่อให้ AI วิเคราะห์จำนวนเงิน วันที่ และประเภทบัญชีให้คุณอัตโนมัติ ไม่ต้องคีย์เอง!
                    </p>
                    <button
                      onClick={() => setActiveTab("scanner")}
                      className="mt-2 text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1 cursor-pointer bg-transparent border-none outline-none"
                    >
                      ลองใช้งานระบบสแกนเลย →
                    </button>
                  </div>
                </div>
              </div>

              {/* Dashboard metrics + List */}
              <div className="lg:col-span-8 space-y-6">
                <Dashboard transactions={transactions} />
                <TransactionList
                  transactions={transactions}
                  onDelete={handleDeleteTransaction}
                  onEdit={(t) => {
                    setEditingTransaction(t);
                    setIsMobileFormOpen(true);
                  }}
                />
              </div>
            </div>
          ) : (
            /* Dedicated Receipt Scanner View Tab */
            <div className="max-w-3xl mx-auto space-y-6">
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100">
                    <Receipt className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-800">ระบบสแกนใบเสร็จอัจฉริยะ (AI Receipt Scanner)</h3>
                    <p className="text-xs text-slate-500">วิเคราะห์ข้อมูลและแยกหมวดหมู่อัตโนมัติจากรูปสลิปโอนเงิน / ใบเสร็จ</p>
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-4">
                  <TransactionForm
                    onSave={handleSaveTransaction}
                    onCancel={() => setActiveTab("dashboard")}
                    initialData={editingTransaction}
                    defaultMethod="scan"
                  />
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Mobile Floating Action Button to Add / Open Form Modal */}
      <div className="lg:hidden fixed bottom-6 right-6 z-40">
        <button
          onClick={() => {
            setEditingTransaction(null);
            setIsMobileFormOpen(true);
          }}
          className="flex items-center gap-2 bg-indigo-600 text-white hover:bg-indigo-700 px-5 py-3 rounded-full font-semibold text-sm shadow-xl hover:shadow-2xl transition-all cursor-pointer"
        >
          <PlusCircle className="w-5 h-5" />
          <span>บันทึกรายการ</span>
        </button>
      </div>

      {/* Mobile Form Modal */}
      {isMobileFormOpen && (
        <div className="lg:hidden fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-t-3xl sm:rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden p-6 relative">
            <button
              onClick={() => {
                setIsMobileFormOpen(false);
                setEditingTransaction(null);
              }}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            
            <div className="mt-2">
              <TransactionForm
                onSave={handleSaveTransaction}
                onCancel={() => {
                  setIsMobileFormOpen(false);
                  setEditingTransaction(null);
                }}
                initialData={editingTransaction}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
