
import React, { useState } from 'react';
import { db } from '../services/db';
import { Button, Input, Card } from '../components/UI';
import { useNavigate, Link } from 'react-router-dom';
import { AdvocateAnimation } from '../components/AdvocateAnimation';
import { UserRole } from '../types';

export const Signup: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    mobile: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    // Fixed: Await the Promise returned by getUsers()
    const users = await db.getUsers();
    const existing = users.find(u => u.email.toLowerCase() === formData.email.trim().toLowerCase());
    if (existing) {
      setError('An account with this email already exists.');
      setIsSubmitting(false);
      return;
    }

    // Fixed: Ensure the timeout callback is also async and awaits addUser
    setTimeout(async () => {
      // Added missing experience_level property to satisfy User interface requirements
      await db.addUser({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        mobile: formData.mobile,
        role: UserRole.EMPLOYEE,
        is_active: true,
        daily_lead_target: 10,
        experience_level: 'new',
        skills: []
      });
      navigate('/login');
    }, 800);
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-white">
      <div className="hidden md:flex flex-1 bg-indigo-600 p-12 flex-col justify-between text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl opacity-50"></div>
        
        <div className="relative z-10">
          <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center font-bold text-4xl mb-8">L</div>
          <h1 className="text-5xl font-extrabold mb-4 leading-tight font-poppins tracking-tighter">Join the<br/>Counsel</h1>
          <p className="text-indigo-100 text-xl max-w-md font-medium">Create your internal employee account</p>
        </div>

        <AdvocateAnimation 
          isTyping={isTyping} 
          isTypingPassword={formData.password.length > 0} 
          showPassword={showPassword} 
        />

        <div className="relative z-10 text-indigo-200 text-xs font-bold uppercase tracking-widest">
          Secured Internal Registration
        </div>
      </div>
      
      <div className="flex-1 bg-gray-50 flex items-center justify-center p-8">
        <Card className="max-w-md w-full p-8 md:p-12 border-none shadow-2xl rounded-[40px] bg-white">
          <div className="mb-10 text-center">
            <h2 className="text-3xl font-black text-gray-900 mb-2 font-poppins">New Account</h2>
            <p className="text-gray-400 font-bold uppercase text-[10px] tracking-[0.2em]">Employee Registration</p>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Full Name"
              placeholder="e.g. Ramesh Kumar"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              onFocus={() => setIsTyping(true)}
              onBlur={() => setIsTyping(false)}
              required
              className="rounded-2xl h-14"
            />
            <Input
              label="Work Email"
              type="email"
              placeholder="ramesh@legalsuccess.in"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              onFocus={() => setIsTyping(true)}
              onBlur={() => setIsTyping(false)}
              required
              className="rounded-2xl h-14"
            />
            <Input
              label="Mobile No."
              placeholder="98765XXXXX"
              value={formData.mobile}
              onChange={(e) => setFormData({...formData, mobile: e.target.value})}
              onFocus={() => setIsTyping(true)}
              onBlur={() => setIsTyping(false)}
              required
              className="rounded-2xl h-14"
            />
            
            <div className="relative">
              <Input
                label="Set Password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                required
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
            
            <Button type="submit" className="w-full py-4 mt-4 text-sm font-black uppercase tracking-widest rounded-2xl shadow-xl bg-indigo-600 hover:bg-indigo-700 transition-all" disabled={isSubmitting}>
              {isSubmitting ? 'Registering...' : 'Create Account'}
            </Button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-gray-400 text-sm">Already a member? <Link to="/login" className="text-indigo-600 font-bold hover:underline">Sign in</Link></p>
          </div>
        </Card>
      </div>
    </div>
  );
};
