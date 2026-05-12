import React, { useState } from 'react';
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword 
} from 'firebase/auth';
import { auth } from '../lib/firebase';
import { LogIn, Mail, Lock, UserPlus, AlertCircle } from 'lucide-react';
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
      setError(error.message);
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
        import('firebase/auth').then(({ updateProfile }) => {
           updateProfile(userCredential.user, { displayName });
        });
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (error: any) {
      let arabicError = 'حدث خطأ ما، يرجى المحاولة مرة أخرى.';
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        arabicError = 'البريد الإلكتروني أو كلمة المرور غير صحيحة.';
      } else if (error.code === 'auth/email-already-in-use') {
        arabicError = 'هذا البريد الإلكتروني مسجل بالفعل. يرجى تسجيل الدخول.';
        setIsSignUp(false); // Switch to login immediately
      } else if (error.code === 'auth/weak-password') {
        arabicError = 'كلمة المرور ضعيفة جداً.';
      } else if (error.code === 'auth/invalid-email') {
        arabicError = 'البريد الإلكتروني غير صحيح.';
      }
      setError(arabicError);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-6 bg-white w-full h-full">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white overflow-hidden"
      >
        <div className="p-6 md:p-10 space-y-6 md:space-y-8">
          <div className="text-center space-y-1 md:space-y-2">
            <h1 className="text-xl md:text-3xl font-black text-black tracking-tight">
              {isSignUp ? 'إنشاء حساب جديد' : 'تسجيل الدخول'}
            </h1>
            <p className="text-zinc-500 font-medium tracking-wide text-xs md:text-sm">
              مرحباً بك/بِكِ في منصة تبيان
            </p>
          </div>

          <form onSubmit={handleEmailAuth} className="space-y-3 md:space-y-4">
            {isSignUp && (
              <div className="space-y-1.5 md:space-y-2">
                <label className="text-[11px] md:text-[13px] font-bold text-zinc-600 mr-2 uppercase tracking-wide">الاسم</label>
                <div className="relative">
                  <UserPlus className="absolute right-3 md:right-4 top-1/2 -translate-y-1/2 text-zinc-400 w-4 h-4 md:w-5 h-5 pointer-events-none" />
                  <input 
                    type="text"
                    required={isSignUp}
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full pr-11 md:pr-14 pl-4 py-3 md:py-4 bg-zinc-50 border border-zinc-200/50 rounded-2xl focus:border-black focus:ring-1 focus:ring-black outline-none transition-all font-semibold text-sm md:text-base"
                    placeholder="محمد عبدالله"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1.5 md:space-y-2">
              <label className="text-[11px] md:text-[13px] font-bold text-zinc-600 mr-2 uppercase tracking-wide">البريد الإلكتروني</label>
              <div className="relative">
                <Mail className="absolute right-3 md:right-4 top-1/2 -translate-y-1/2 text-zinc-400 w-4 h-4 md:w-5 h-5 pointer-events-none" />
                <input 
                  type="email"
                  required
                  dir="ltr"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pr-11 md:pr-14 pl-4 py-3 md:py-4 bg-zinc-50 border border-zinc-200/50 rounded-2xl focus:border-black focus:ring-1 focus:ring-black outline-none transition-all font-medium text-sm md:text-base text-left placeholder:text-zinc-400"
                  placeholder="name@example.com"
                />
              </div>
            </div>

            <div className="space-y-1.5 md:space-y-2">
              <label className="text-[11px] md:text-[13px] font-bold text-zinc-600 mr-2 uppercase tracking-wide">كلمة المرور</label>
              <div className="relative">
                <Lock className="absolute right-3 md:right-4 top-1/2 -translate-y-1/2 text-zinc-400 w-4 h-4 md:w-5 h-5 pointer-events-none" />
                <input 
                  type="password"
                  required
                  dir="ltr"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pr-11 md:pr-14 pl-4 py-3 md:py-4 bg-zinc-50 border border-zinc-200/50 rounded-2xl focus:border-black focus:ring-1 focus:ring-black outline-none transition-all font-semibold text-sm md:text-base text-left"
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
                  className="flex items-center gap-2 text-red-500 bg-red-50 p-3 md:p-4 rounded-xl text-xs md:text-sm font-bold border border-red-100"
                >
                  <AlertCircle className="w-3.5 h-3.5 md:w-4 h-4 shrink-0" />
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            <button 
              type="submit"
              disabled={loading}
              className="w-full py-3.5 md:py-4 bg-black hover:bg-zinc-800 text-white rounded-[16px] font-bold shadow-[0_4px_24px_rgba(0,0,0,0.1)] transition-all flex items-center justify-center gap-2 md:gap-3 disabled:bg-zinc-300 text-sm md:text-base"
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
            <span className="text-zinc-400 font-bold text-[10px] md:text-xs uppercase tracking-widest">أو</span>
            <div className="h-px bg-zinc-100 flex-1"></div>
          </div>

          <button 
            onClick={handleGoogleLogin}
            className="w-full py-3.5 md:py-4 bg-white border border-zinc-200/80 hover:bg-zinc-50 text-zinc-800 rounded-[16px] font-bold shadow-[0_2px_8px_rgba(0,0,0,0.03)] transition-all flex items-center justify-center gap-2 md:gap-3 mb-2 md:mb-6 text-sm md:text-base"
          >
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/pwa/google.svg" className="w-4 h-4 md:w-5 h-5" alt="Google" />
            تسجيل الدخول باستخدام جوجل
          </button>

          <div className="text-center pb-2">
            <button 
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError(null);
              }}
              className="text-black font-semibold text-sm md:text-base hover:underline transition-all"
            >
              {isSignUp ? 'لديك حساب بالفعل؟ سجل دخولك' : 'لا تملك حساباً؟ أنشئ حساباً جديداً'}
            </button>
          </div>

        </div>
      </motion.div>
    </div>
  );
}
