import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, User, Zap, Eye, EyeOff, UserCheck } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card } from '../../components/ui/Card';
import { Tabs } from '../../components/ui/Tabs';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../hooks/useToast';
import { User as UserType } from '../../types';

export const Auth: React.FC = () => {
  const [activeTab, setActiveTab] = useState('login');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { login, register, isLoading, refreshSession } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Login form state
  const [loginData, setLoginData] = useState({
    email: '',
    password: '',
    rememberMe: false
  });
  const [loginError, setLoginError] = useState('');

  // Register form state
  const [registerData, setRegisterData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'participant' as UserType['role'],
    agreeToTerms: false
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    try {
      await login(loginData.email, loginData.password);
      toast.success('Welcome back!', 'Successfully logged in');
      navigate('/dashboard');
    } catch (err) {
      toast.error('Login failed', 'Invalid email or password');
      setLoginError('Incorrect email or password');
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (registerData.password !== registerData.confirmPassword) {
      toast.error('Password mismatch', 'Passwords do not match');
      return;
    }

    if (!registerData.agreeToTerms) {
      toast.error('Terms required', 'Please agree to the terms of service');
      return;
    }
    
    try {
      await register(registerData.email, registerData.password, registerData.name, registerData.role);
      toast.success('Account created!', 'Welcome to HackVerse');
      navigate('/dashboard');
    } catch (err) {
      toast.error('Registration failed', 'Please try again');
    }
  };

  const handleSocialLogin = async (provider: 'Google' | 'GitHub') => {
    // Start NextAuth OAuth flow
    const base = (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:3000';
    const callbackUrl = encodeURIComponent(window.location.origin + '/auth');
    const url = `${base}/api/auth/signin/${provider.toLowerCase()}?callbackUrl=${callbackUrl}`;
    // Use full-page redirect to ensure cookies are set on the API domain
    window.location.href = url;
  };

  const tabs = [
    { id: 'login', label: 'Login', icon: <User className="w-4 h-4" /> },
    { id: 'register', label: 'Register', icon: <UserCheck className="w-4 h-4" /> }
  ];

  return (
    <div className="min-h-screen bg-black gradient-bg flex items-center justify-center px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <div className="flex justify-center items-center space-x-2 mb-4">
            <Zap className="w-10 h-10 text-neon-purple" />
            <span className="text-3xl font-orbitron font-bold neon-text">HackVerse</span>
          </div>
          <h1 className="text-2xl font-orbitron font-bold text-white mb-2">
            {activeTab === 'login' ? 'Welcome Back' : 'Join the Revolution'}
          </h1>
          <p className="text-gray-400">
            {activeTab === 'login' ? 'Sign in to your account' : 'Create your account and start building'}
          </p>
        </div>

        <Card>
          <Tabs
            tabs={tabs}
            activeTab={activeTab}
            onTabChange={setActiveTab}
          />

          <div className="mt-6">
            {activeTab === 'login' ? (
              <form onSubmit={handleLogin} className="space-y-6">
                {loginError && (
                  <div
                    className="bg-red-900/20 border border-red-500 rounded-lg p-3 text-red-400 text-sm"
                    role="alert"
                    aria-live="assertive"
                  >
                    {loginError}
                  </div>
                )}
                <Input
                  type="email"
                  label="Email Address"
                  icon={<Mail className="w-4 h-4" />}
                  value={loginData.email}
                  onChange={(e) => { setLoginData(prev => ({ ...prev, email: e.target.value })); if (loginError) setLoginError(''); }}
                  required
                  autoComplete="email"
                />

                <div className="relative">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    label="Password"
                    icon={<Lock className="w-4 h-4" />}
                    value={loginData.password}
                    onChange={(e) => { setLoginData(prev => ({ ...prev, password: e.target.value })); if (loginError) setLoginError(''); }}
                    required
                    autoComplete="current-password"
                    error={loginError || undefined}
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-9 text-gray-400 hover:text-gray-300"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <label className="flex items-center">
                    <input 
                      type="checkbox" 
                      className="mr-2 rounded border-gray-700 bg-black text-neon-purple"
                      checked={loginData.rememberMe}
                      onChange={(e) => setLoginData(prev => ({ ...prev, rememberMe: e.target.checked }))}
                    />
                    <span className="text-sm text-gray-300">Remember me</span>
                  </label>
                  
                  <button 
                    type="button"
                    className="text-sm text-neon-purple hover:text-neon-purple-dark"
                    onClick={() => toast.info('Coming soon!', 'Password reset will be available soon')}
                  >
                    Forgot password?
                  </button>
                </div>

                <Button type="submit" className="w-full" isLoading={isLoading}>
                  Sign In
                </Button>
              </form>
            ) : (
              <form onSubmit={handleRegister} className="space-y-6">
                <Input
                  type="text"
                  label="Full Name"
                  icon={<User className="w-4 h-4" />}
                  value={registerData.name}
                  onChange={(e) => setRegisterData(prev => ({ ...prev, name: e.target.value }))}
                  required
                  autoComplete="name"
                />

                <Input
                  type="email"
                  label="Email Address"
                  icon={<Mail className="w-4 h-4" />}
                  value={registerData.email}
                  onChange={(e) => setRegisterData(prev => ({ ...prev, email: e.target.value }))}
                  required
                  autoComplete="email"
                />

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-300">
                    Role
                  </label>
                  <div className="relative">
                    <UserCheck className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <select
                      value={registerData.role}
                      onChange={(e) => setRegisterData(prev => ({ ...prev, role: e.target.value as UserType['role'] }))}
                      className="neon-input w-full pl-10 pr-4 py-2.5 text-white rounded-lg bg-black/90"
                      required
                    >
                      <option value="participant">Participant</option>
                      <option value="organizer">Organizer</option>
                      <option value="judge">Judge</option>
                    </select>
                  </div>
                </div>

                <div className="relative">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    label="Password"
                    icon={<Lock className="w-4 h-4" />}
                    value={registerData.password}
                    onChange={(e) => setRegisterData(prev => ({ ...prev, password: e.target.value }))}
                    required
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-9 text-gray-400 hover:text-gray-300"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                <div className="relative">
                  <Input
                    type={showConfirmPassword ? 'text' : 'password'}
                    label="Confirm Password"
                    icon={<Lock className="w-4 h-4" />}
                    value={registerData.confirmPassword}
                    onChange={(e) => setRegisterData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    required
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-9 text-gray-400 hover:text-gray-300"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                <div className="flex items-start">
                  <input 
                    type="checkbox" 
                    className="mr-3 mt-1 rounded border-gray-700 bg-black text-neon-purple"
                    checked={registerData.agreeToTerms}
                    onChange={(e) => setRegisterData(prev => ({ ...prev, agreeToTerms: e.target.checked }))}
                    required 
                  />
                  <span className="text-sm text-gray-300">
                    I agree to the{' '}
                    <button 
                      type="button"
                      className="text-neon-purple hover:text-neon-purple-dark"
                      onClick={() => toast.info('Coming soon!', 'Terms of service will be available soon')}
                    >
                      Terms of Service
                    </button>
                    {' '}and{' '}
                    <button 
                      type="button"
                      className="text-neon-purple hover:text-neon-purple-dark"
                      onClick={() => toast.info('Coming soon!', 'Privacy policy will be available soon')}
                    >
                      Privacy Policy
                    </button>
                  </span>
                </div>

                <Button type="submit" className="w-full" isLoading={isLoading}>
                  Create Account
                </Button>
              </form>
            )}

            <div className="relative mt-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-700" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-black text-gray-400">Or continue with</span>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3">
              <Button 
                type="button" 
                variant="outline" 
                className="w-full"
                onClick={() => handleSocialLogin('Google')}
              >
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Google
              </Button>
              
              <Button 
                type="button" 
                variant="outline" 
                className="w-full"
                onClick={() => handleSocialLogin('GitHub')}
              >
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                </svg>
                GitHub
              </Button>
            </div>
          </div>
        </Card>

        <div className="mt-8 text-center">
          <p className="text-xs text-gray-500">
            By signing {activeTab === 'login' ? 'in' : 'up'}, you agree to our{' '}
            <button 
              className="text-neon-purple hover:underline"
              onClick={() => toast.info('Coming soon!', 'Terms of service will be available soon')}
            >
              Terms of Service
            </button>
            {' '}and{' '}
            <button 
              className="text-neon-purple hover:underline"
              onClick={() => toast.info('Coming soon!', 'Privacy policy will be available soon')}
            >
              Privacy Policy
            </button>
          </p>
        </div>
      </motion.div>
    </div>
  );
};