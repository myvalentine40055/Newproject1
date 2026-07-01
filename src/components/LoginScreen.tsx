import { loginWithGoogle } from "../lib/firebase";
import { Wallet, LogIn } from "lucide-react";
import { useState } from "react";

interface LoginScreenProps {
  onLoginSuccess: (user: any) => void;
}

export default function LoginScreen({ onLoginSuccess }: LoginScreenProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      const user = await loginWithGoogle();
      if (user) {
        onLoginSuccess(user);
      }
    } catch (err: any) {
      console.error(err);
      setError("เกิดข้อผิดพลาดในการเข้าสู่ระบบ กรุณาลองใหม่อีกครั้ง");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-100 p-8 text-center transition-all duration-300 hover:shadow-2xl">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-600 to-indigo-400 text-white shadow-lg mb-6">
          <Wallet className="w-8 h-8" />
        </div>
        
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight mb-2">
          Smart Wallet AI
        </h1>
        <p className="text-sm text-slate-500 mb-8 leading-relaxed">
          ระบบบันทึกรายรับรายจ่ายอัจฉริยะด้วยรูปภาพ/สลิปโอนเงิน<br />
          วิเคราะห์สลิปและบันทึกอัตโนมัติด้วย AI
        </p>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-100 text-sm text-red-600">
            {error}
          </div>
        )}

        <button
          onClick={handleLogin}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 py-3.5 px-6 rounded-xl bg-indigo-600 text-white font-medium hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 cursor-pointer shadow-md"
        >
          {loading ? (
            <span className="inline-block w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
          ) : (
            <>
              <LogIn className="w-5 h-5" />
              <span>เข้าสู่ระบบด้วย Google</span>
            </>
          )}
        </button>

        <div className="mt-8 text-xs text-slate-400">
          ข้อมูลของคุณจะถูกจัดเก็บอย่างปลอดภัยบนระบบฐานข้อมูลคลาวด์
        </div>
      </div>
    </div>
  );
}
