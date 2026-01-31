
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Button, Input, Card } from '../components/UI';
import { useNavigate, Link } from 'react-router-dom';
import { AdvocateAnimation } from '../components/AdvocateAnimation';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  
  const { user, login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  const handleSubmit = async (e?: React.FormEvent, manualEmail?: string, manualPass?: string) => {
    if (e) e.preventDefault();
    setError('');
    setIsSubmitting(true);
    
    const emailToUse = (manualEmail || email).trim();
    const passToUse = manualPass || password;
    
    setTimeout(async () => {
      const success = await login(emailToUse, passToUse);
      if (success) {
        navigate('/');
      } else {
        setError(`Invalid credentials for '${emailToUse}'.`);
        setIsSubmitting(false);
      }
    }, 600);
  };

  const quickLogin = (type: 'admin' | 'employee') => {
    const targetEmail = type === 'admin' ? 'info@legalsuccessindia.com' : 'rajesh@legalsuccess.in';
    const targetPass = type === 'admin' ? 'Legal@1997' : 'password123';
    setEmail(targetEmail);
    setPassword(targetPass);
    handleSubmit(undefined, targetEmail, targetPass);
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-white">
      {/* Interactive Advocate Animation Section */}
      <div className="hidden md:flex flex-1 bg-indigo-600 p-12 flex-col justify-between text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl opacity-50"></div>
        
        <div className="relative z-10">
          <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center font-bold text-4xl mb-8">L</div>
          <h1 className="text-5xl font-extrabold mb-4 leading-tight font-poppins tracking-tighter">Legal Success<br/>India</h1>
          <p className="text-indigo-100 text-xl max-w-md font-medium">Internal Management System</p>
        </div>

        <AdvocateAnimation 
          isTyping={isTyping} 
          isTypingPassword={password.length > 0} 
          showPassword={showPassword} 
        />

        <div className="relative z-10 text-indigo-200 text-xs font-bold uppercase tracking-widest">
          © 2024 Legal Success India Pvt Ltd.
        </div>
      </div>
      
      <div className="flex-1 bg-gray-50 flex items-center justify-center p-8">
        <Card className="max-w-md w-full p-8 md:p-12 border-none shadow-2xl rounded-[40px] bg-white">
          <div className="mb-10 text-center">
            <h2 className="text-3xl font-black text-gray-900 mb-2 font-poppins">Welcome Back</h2>
            <p className="text-gray-400 font-bold uppercase text-[10px] tracking-[0.2em]">Internal Access Portal</p>
          </div>
          
          <form onSubmit={(e) => handleSubmit(e)} className="space-y-6">
            <Input
              label="Email Address"
              type="email"
              placeholder="name@legalsuccessindia.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onFocus={() => setIsTyping(true)}
              onBlur={() => setIsTyping(false)}
              required
              disabled={isSubmitting}
              className="rounded-2xl h-14"
            />
            
            <div className="relative">
              <Input
                label="Password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isSubmitting}
                className="rounded-2xl h-14"
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-10 text-gray-400 hover:text-indigo-600 transition-colors"
              >
                {showPassword ? (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.882 9.882L5.173 5.173m13.654 13.654l-4.242-4.242m-4.739-4.74l4.243 4.243m2.784 2.784A10.002 10.002 0 0021.542 12c-1.274-4.057-5.064-7-9.542-7-1.274 0-2.483.221-3.606.623" /></svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268-2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                )}
              </button>
            </div>
            
            {error && (
              <div className="p-4 bg-rose-50 border border-rose-100 text-rose-600 text-[11px] font-black uppercase rounded-2xl animate-shake">
                {error}
              </div>
            )}
            
            <Button type="submit" className="w-full py-4 text-sm font-black uppercase tracking-widest rounded-2xl shadow-xl bg-indigo-600 hover:bg-indigo-700 transition-all" disabled={isSubmitting}>
              {isSubmitting ? 'Verifying...' : 'Sign In'}
            </Button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-gray-400 text-sm">Don't have an account? <Link to="/signup" className="text-indigo-600 font-bold hover:underline">Register here</Link></p>
          </div>

          <div className="mt-10">
            <div className="relative">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-100"></div></div>
              <div className="relative flex justify-center text-[8px] uppercase font-black tracking-[0.3em]"><span className="bg-white px-4 text-gray-300">Quick Access</span></div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3">
              <button onClick={() => quickLogin('admin')} className="p-3 rounded-2xl border border-gray-100 bg-gray-50 hover:bg-indigo-50 hover:border-indigo-100 transition-all group">
                <p className="text-[10px] font-black text-gray-400 group-hover:text-indigo-600 uppercase tracking-widest">Admin</p>
              </button>
              <button onClick={() => quickLogin('employee')} className="p-3 rounded-2xl border border-gray-100 bg-gray-50 hover:bg-indigo-50 hover:border-indigo-100 transition-all group">
                <p className="text-[10px] font-black text-gray-400 group-hover:text-indigo-600 uppercase tracking-widest">Employee</p>
              </button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
