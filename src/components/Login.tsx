import React, { useState } from 'react';
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  updateProfile
} from 'firebase/auth';
import { auth } from '../lib/firebase';
import { LogIn, Mail, Lock, UserPlus, AlertCircle, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleGoogleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error: any) {
      if (error.code !== 'auth/popup-closed-by-user') {
        setError("حدث خطأ أثناء تسجيل الدخول بحساب جوجل.");
      }
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isSignUp) {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        // We need to pass the displayName down? Actually AuthProvider sets `user.displayName || "New User"`.
        // We should update the auth Profile immediately
        await updateProfile(userCredential.user, { displayName });
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (error: any) {
      console.error("Auth error:", error);
      let arabicError = 'حدث خطأ ما، يرجى المحاولة مرة أخرى.';
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        arabicError = 'لم نتمكن من التحقق من البيانات. راجع البريد أو كلمة المرور.';
      } else if (error.code === 'auth/email-already-in-use') {
        arabicError = 'هذا البريد الإلكتروني مسجل بالفعل. يرجى تسجيل الدخول.';
        setIsSignUp(false); // Switch to login immediately
      } else if (error.code === 'auth/weak-password') {
        arabicError = 'كلمة المرور ضعيفة جداً.';
      } else if (error.code === 'auth/invalid-email') {
        arabicError = 'البريد الإلكتروني غير صحيح.';
      } else if (error.code === 'auth/operation-not-allowed') {
        arabicError = 'تسجيل الدخول بالبريد وكلمة المرور غير مفعل في Firebase.';
      } else {
        // Fallback error message (includes actual message for debugging)
        arabicError = `حدث خطأ: ${error.message}`;
      }
      setError(arabicError);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex flex-col items-center justify-center p-6 w-full h-full overflow-hidden bg-[#F7F5F2]">
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_80%_10%,rgba(142,122,174,0.12),transparent_30%),radial-gradient(circle_at_10%_90%,rgba(143,169,199,0.14),transparent_30%)]" />
      <div className="absolute top-10 right-10 w-40 h-40 rounded-full bg-[#8E7AAE]/10 blur-3xl tebyan-breathe" />
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-md bg-[#FAF9F6]/82 backdrop-blur-2xl overflow-hidden rounded-[34px] border border-[#8E7AAE]/15 shadow-[0_24px_90px_rgba(24,34,49,0.10)]"
      >
        <div className="p-6 md:p-10 space-y-6 md:space-y-8">
          <div className="text-center space-y-1 md:space-y-2">
            <h1 className="text-xl md:text-3xl font-black text-[#182231] tracking-tight">
              {isSignUp ? 'إنشاء حساب جديد' : 'ادخل إلى مساحة الفهم والقرار'}
            </h1>
            <div className="mx-auto w-12 h-12 rounded-2xl bg-[#8E7AAE]/10 text-[#6E5F8E] flex items-center justify-center mb-3 border border-[#8E7AAE]/15 tebyan-breathe">
              <Sparkles className="w-5 h-5" />
            </div>
            <p className="text-[#64788D] font-medium tracking-wide text-xs md:text-sm">
              مختبر فكر راقٍ للفهم، التحليل، والحسم
            </p>
          </div>

          <form onSubmit={handleEmailAuth} className="space-y-3 md:space-y-4">
            {isSignUp && (
              <div className="space-y-1.5 md:space-y-2">
                <label className="text-[11px] md:text-[13px] font-bold text-[#64788D] mr-2 uppercase tracking-wide">الاسم</label>
                <div className="relative">
                  <UserPlus className="absolute right-3 md:right-4 top-1/2 -translate-y-1/2 text-[#7C8796] w-4 h-4 md:w-5 h-5 pointer-events-none" />
                  <input 
                    type="text"
                    required={isSignUp}
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full pr-11 md:pr-14 pl-4 py-3 md:py-4 bg-white/70 border border-[#8FA9C7]/20 rounded-2xl focus:border-[#8E7AAE]/55 focus:ring-2 focus:ring-[#8E7AAE]/10 outline-none transition-all font-semibold text-sm md:text-base"
                    placeholder="محمد عبدالله"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1.5 md:space-y-2">
              <label className="text-[11px] md:text-[13px] font-bold text-[#64788D] mr-2 uppercase tracking-wide">البريد الإلكتروني</label>
              <div className="relative">
                <Mail className="absolute right-3 md:right-4 top-1/2 -translate-y-1/2 text-[#7C8796] w-4 h-4 md:w-5 h-5 pointer-events-none" />
                <input 
                  type="email"
                  required
                  dir="ltr"
                  value={email}
                  onChange={(e) => setEmail(e.target.value.replace(/[^a-zA-Z0-9@._+-\s]/g, '').replace(/\s/g, ''))}
                  className="w-full pr-11 md:pr-14 pl-4 py-3 md:py-4 bg-white/70 border border-[#8FA9C7]/20 rounded-2xl focus:border-[#8E7AAE]/55 focus:ring-2 focus:ring-[#8E7AAE]/10 outline-none transition-all font-medium text-sm md:text-base text-left placeholder:text-[#7C8796]"
                  placeholder="name@example.com"
                />
              </div>
            </div>

            <div className="space-y-1.5 md:space-y-2">
              <label className="text-[11px] md:text-[13px] font-bold text-[#64788D] mr-2 uppercase tracking-wide">كلمة المرور</label>
              <div className="relative">
                <Lock className="absolute right-3 md:right-4 top-1/2 -translate-y-1/2 text-[#7C8796] w-4 h-4 md:w-5 h-5 pointer-events-none" />
                <input 
                  type="password"
                  required
                  dir="ltr"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pr-11 md:pr-14 pl-4 py-3 md:py-4 bg-white/70 border border-[#8FA9C7]/20 rounded-2xl focus:border-[#8E7AAE]/55 focus:ring-2 focus:ring-[#8E7AAE]/10 outline-none transition-all font-semibold text-sm md:text-base text-left"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <AnimatePresence mode="wait">
              {error && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex items-center gap-2 text-rose-700 bg-rose-50/80 p-3 md:p-4 rounded-xl text-xs md:text-sm font-bold border border-rose-100"
                >
                  <AlertCircle className="w-3.5 h-3.5 md:w-4 h-4 shrink-0" />
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            <button 
              type="submit"
              disabled={loading}
              className="w-full py-3.5 md:py-4 bg-[#8E7AAE] hover:bg-[#7F6AA4] text-white rounded-[16px] font-bold shadow-[0_16px_40px_rgba(142,122,174,0.18)] transition-all flex items-center justify-center gap-2 md:gap-3 disabled:bg-zinc-300 text-sm md:text-base"
            >
              {loading ? (
                <div className="w-5 h-5 md:w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>
                  {isSignUp ? <UserPlus className="w-4 h-4 md:w-5 h-5" /> : <LogIn className="w-4 h-4 md:w-5 h-5" />}
                  {isSignUp ? 'إنشاء الحساب' : 'دخول'}
                </>
              )}
            </button>
          </form>

          <div className="relative flex items-center gap-4 py-1">
            <div className="h-px bg-zinc-100 flex-1"></div>
            <span className="text-[#7C8796] font-bold text-[10px] md:text-xs uppercase tracking-widest">أو</span>
            <div className="h-px bg-zinc-100 flex-1"></div>
          </div>

          <div className="flex flex-col gap-3 mb-2 md:mb-6">
            <button 
              onClick={handleGoogleLogin}
              className="w-full py-3.5 md:py-4 bg-white/85 border border-[#8FA9C7]/20 hover:bg-white text-[#182231] rounded-[16px] font-bold shadow-[0_2px_8px_rgba(0,0,0,0.03)] transition-all flex items-center justify-center gap-2 md:gap-3 text-sm md:text-base"
            >
              <svg viewBox="0 0 24 24" width="24" height="24" xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 md:w-6 md:h-6 shrink-0">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              تسجيل الدخول باستخدام جوجل
            </button>

          </div>

          <div className="text-center pb-2">
            <button 
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError(null);
              }}
              className="text-[#182231] font-semibold text-sm md:text-base hover:underline transition-all"
            >
              {isSignUp ? 'لديك حساب بالفعل؟ سجل دخولك' : 'لا تملك حساباً؟ أنشئ حساباً جديداً'}
            </button>
          </div>

        </div>
      </motion.div>
    </div>
  );
}
