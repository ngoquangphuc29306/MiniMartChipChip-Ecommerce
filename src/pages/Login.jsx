import React, { useState, useRef, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Mail, Lock } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import ForgotPasswordDialog from '@/components/ForgotPasswordDialog';

const Login = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);
  const { signIn, signInWithGoogle, signInWithFacebook, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isLogin = location.pathname === '/login' || location.pathname === '/';

  // Hover/indicator state for animated pill movement
  const [hoveredTab, setHoveredTab] = useState(null);
  const tabLoginRef = useRef(null);
  const tabRegisterRef = useRef(null);
  const indicatorContainerRef = useRef(null);
  const [indicator, setIndicator] = useState({ left: 0, width: 0 });

  const updateIndicator = () => {
    const active = hoveredTab ?? (isLogin ? 'login' : 'register');
    const ref = active === 'login' ? tabLoginRef.current : tabRegisterRef.current;
    const container = indicatorContainerRef.current;
    if (ref && container) {
      const r = ref.getBoundingClientRect();
      const c = container.getBoundingClientRect();
      setIndicator({ left: r.left - c.left + 4, width: r.width - 8 });
    }
  };

  useEffect(() => {
    updateIndicator();
    const onResize = () => updateIndicator();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [hoveredTab, isLogin]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { error } = await signIn(formData.email, formData.password);
    if (!error) navigate('/');
  };

  const handleGoogleSignIn = async () => {
    await signInWithGoogle();
  };

  const handleFacebookSignIn = async () => {
    await signInWithFacebook();
  };

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  return (
    <div className="relative flex h-auto min-h-screen w-full flex-col bg-background dark:bg-black group-design-root overflow-x-hidden">
      <Helmet>
        <title>Đăng nhập - Minimart ChipChip</title>
      </Helmet>

      <div className="layout-container flex h-full grow flex-col">
        <div className="flex flex-1 justify-center items-center p-4 sm:p-6 md:p-8">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, ease: 'easeOut' }} className="flex flex-col lg:flex-row w-full max-w-6xl overflow-hidden rounded-[2rem] bg-card dark:bg-zinc-900 shadow-2xl border border-border">
            <div className="w-full lg:w-1/2 p-10 lg:p-12 bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/10 dark:to-orange-900/10 flex-col justify-center items-center hidden lg:flex">
              <div className="flex flex-col items-center text-center">
                <img
                  className="w-full max-w-sm rounded-lg shadow-lg"
                  alt="Illustration"
                  src="https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=1000&auto=format&fit=crop"
                  loading="lazy"
                />
                <h2 className="text-3xl font-display font-bold mt-8 text-foreground">Mua sắm tiện lợi cùng ChipChip</h2>
                <p className="mt-4 text-muted-foreground max-w-md">Hàng ngàn sản phẩm tươi ngon đang chờ bạn khám phá với giá tốt nhất thị trường.</p>
              </div>
            </div>

            <div className="w-full lg:w-1/2 p-8 sm:p-10 md:p-12 flex flex-col justify-center">
              <div className="layout-content-container flex flex-col w-full max-w-md mx-auto">
                <div className="flex justify-center mb-6">
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-16 rounded-2xl overflow-hidden shadow-sm bg-yellow-400 p-1">
                      <img src="https://horizons-cdn.hostinger.com/9ee84389-1925-41dd-a3e7-6d8a37fcb695/b9b4d3e3ba41b2e5db3158624a392a6e.png" alt="Minimart ChipChip Logo" className="w-full h-full object-cover rounded-xl" />
                    </div>
                  </div>
                </div>

                <h1 className="text-foreground tracking-tight text-[32px] font-bold leading-tight text-center pb-1">Chào mừng trở lại!</h1>
                <p className="text-muted-foreground text-base font-normal leading-normal pb-6 text-center">Đăng nhập để tiếp tục mua sắm.</p>

                <div className="flex w-full py-3 justify-center">
                  <div ref={indicatorContainerRef} className="relative flex h-12 items-center justify-center rounded-full bg-muted/40 p-1.5 shadow-sm border border-border">
                    {/* Animated indicator */}
                    <div
                      style={{ left: indicator.left, width: indicator.width, top: 6, height: 40 }}
                      className="absolute rounded-full bg-white dark:bg-zinc-800 shadow-md transform -translate-y-1 transition-all duration-300 pointer-events-none"
                    />

                    <label
                      ref={tabLoginRef}
                      onMouseEnter={() => setHoveredTab('login')}
                      onMouseLeave={() => setHoveredTab(null)}
                      onClick={() => navigate('/login')}
                      className={`relative z-20 flex cursor-pointer h-10 items-center justify-center overflow-hidden rounded-full px-6 text-sm font-medium leading-normal transition-all duration-300 ${isLogin ? 'text-foreground font-bold' : 'text-muted-foreground hover:text-foreground'}`}>
                      <span className="truncate">Đăng nhập</span>
                      <input defaultChecked name="auth-toggle" type="radio" className="invisible w-0" />
                    </label>

                    <label
                      ref={tabRegisterRef}
                      onMouseEnter={() => setHoveredTab('register')}
                      onMouseLeave={() => setHoveredTab(null)}
                      onClick={() => navigate('/register')}
                      className={`relative z-20 ml-3 flex cursor-pointer h-10 items-center justify-center overflow-hidden rounded-full px-6 text-sm font-medium leading-normal transition-all duration-300 ${!isLogin ? 'text-foreground font-bold' : 'text-muted-foreground hover:text-foreground'}`}>
                      <span className="truncate">Đăng ký</span>
                      <input name="auth-toggle" type="radio" className="invisible w-0" />
                    </label>
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-4">
                  <label className="flex flex-col w-full">
                    <p className="text-foreground text-base font-medium leading-normal pb-2">Email</p>
                    <input type="email" name="email" value={formData.email} onChange={handleChange} required placeholder="email@example.com" className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-xl text-foreground focus:outline-0 focus:ring-2 focus:ring-yellow-400/50 border border-border bg-muted/50 focus:bg-background h-14 placeholder:text-muted-foreground p-4 text-base font-normal leading-normal transition-all" />
                  </label>

                  <label className="flex flex-col w-full">
                    <p className="text-foreground text-base font-medium leading-normal pb-2">Mật khẩu</p>
                    <div className="relative flex w-full flex-1 items-stretch">
                      <input type={showPassword ? 'text' : 'password'} name="password" value={formData.password} onChange={handleChange} required placeholder="••••••••" className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-xl text-foreground focus:outline-0 focus:ring-2 focus:ring-yellow-400/50 border border-border bg-muted/50 focus:bg-background h-14 placeholder:text-muted-foreground p-4 text-base font-normal leading-normal pr-12 transition-all" />
                      <button type="button" onClick={() => setShowPassword(v => !v)} aria-pressed={showPassword} aria-label={showPassword ? 'Hide password' : 'Show password'} className="text-muted-foreground absolute inset-y-0 right-0 flex items-center justify-center px-4 hover:text-foreground">
                        {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                      </button>
                    </div>
                  </label>

                  <div className="flex justify-end pt-2">
                    <button type="button" className="text-sm font-medium text-yellow-600 dark:text-yellow-400 hover:underline" onClick={() => setIsForgotPasswordOpen(true)}>Quên mật khẩu?</button>
                  </div>

                  <div className="pt-4">
                    <Button type="submit" disabled={loading} className="flex w-full items-center justify-center rounded-xl bg-yellow-400 h-14 px-6 text-base font-bold text-white shadow-lg shadow-yellow-400/20 hover:bg-yellow-500 transform transition-all duration-200 hover:-translate-y-1">{loading ? 'Đang xử lý...' : 'Đăng nhập'}</Button>
                  </div>
                </form>

                <div className="flex items-center gap-4 py-6">
                  <hr className="flex-grow border-border" />
                  <p className="text-sm text-muted-foreground">Hoặc tiếp tục với</p>
                  <hr className="flex-grow border-border" />
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                  <button onClick={handleGoogleSignIn} disabled={loading} className="flex h-12 flex-1 items-center justify-center gap-3 rounded-xl border border-border bg-card hover:bg-muted px-4 text-sm font-medium text-foreground transition-colors disabled:opacity-50">
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg"><path d="M47.52 24.54C47.52 22.86 47.34 21.24 47.04 19.68H24V28.8H37.44C36.84 31.74 35.16 34.2 32.7 35.82V41.82H40.14C44.76 37.56 47.52 31.56 47.52 24.54Z" fill="#4285F4"></path><path d="M24 48C30.48 48 35.88 45.84 40.14 41.82L32.7 35.82C30.6 37.2 27.6 38.16 24 38.16C17.22 38.16 11.46 33.6 9.54 27.3H1.74V33.48C5.88 42.12 14.28 48 24 48Z" fill="#34A853"></path><path d="M9.54 27.3C9.18 26.16 9 24.96 9 23.7C9 22.44 9.18 21.24 9.54 20.1L1.74 13.92C0.6 16.32 0 18.9 0 21.6C0 24.3 0.6 26.88 1.74 29.28L9.54 27.3Z" fill="#FBBC05" transform="translate(0, 2.1)"></path><path d="M24 9.84C27.9 9.84 31.02 11.1 33.66 13.56L40.38 6.84C35.88 2.88 30.48 0 24 0C14.28 0 5.88 5.88 1.74 13.92L9.54 20.1C11.46 13.8 17.22 9.84 24 9.84Z" fill="#EA4335"></path></svg>
                    <span>{loading ? 'Đang xử lý...' : 'Google'}</span>
                  </button>
                  <button onClick={handleFacebookSignIn} disabled={loading} className="flex h-12 flex-1 items-center justify-center gap-3 rounded-xl border border-border bg-card hover:bg-muted px-4 text-sm font-medium text-foreground transition-colors disabled:opacity-50">
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M12 2C6.477 2 2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.879V14.89h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v7.028C18.343 21.128 22 16.991 22 12c0-5.523-4.477-10-10-10Z" fill="#1877F2"></path></svg>
                    <span>{loading ? 'Đang xử lý...' : 'Facebook'}</span>
                  </button>
                </div>

                <div className="pt-8 text-center">
                  <p className="text-xs text-muted-foreground">Bằng việc tiếp tục, bạn đồng ý với <a className="underline hover:text-yellow-600" href="#">Điều khoản dịch vụ</a> và <a className="underline hover:text-yellow-600" href="#">Chính sách bảo mật</a> của chúng tôi.</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
      <ForgotPasswordDialog isOpen={isForgotPasswordOpen} onOpenChange={setIsForgotPasswordOpen} />
    </div>
  );
};

const EyeIcon = () => (
  <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.46 12.02C3.73 7.96 7.52 5.02 12 5c4.48.02 8.27 2.96 9.54 7.02" />
  </svg>
);

const EyeOffIcon = () => (
  <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3l18 18" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.94 10.94a3 3 0 104.24 4.24" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.46 12.02C3.73 7.96 7.52 5.02 12 5c2.03-.01 3.95.66 5.54 1.84" />
  </svg>
);

export default Login;