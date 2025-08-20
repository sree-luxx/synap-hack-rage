import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, User, Zap, Eye, EyeOff, UserCheck } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card } from '../../components/ui/Card';
import { useAuth } from '../../contexts/AuthContext';
import { User as UserType } from '../../types';

export const Register: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'participant' as UserType['role']
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const { register, isLoading } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    try {
      await register(formData.email, formData.password, formData.name, formData.role);
      navigate('/dashboard');
    } catch (err) {
      const message = (err as Error)?.message || 'Registration failed. Please try again.';
      setError(message);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

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
            <span className="text-3xl font-orbitron font-bold neon-text">SynapHack</span>
          </div>
          <h1 className="text-2xl font-orbitron font-bold text-white mb-2">Join the Revolution</h1>
          <p className="text-gray-400">Create your account and start building</p>
        </div>

        <Card>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-900/20 border border-red-500 rounded-lg p-3 text-red-400 text-sm">
                {error}
              </div>
            )}

            <Input
              type="text"
              name="name"
              label="Full Name"
              icon={<User className="w-4 h-4" />}
              value={formData.name}
              onChange={handleChange}
              required
              autoComplete="name"
            />

            <Input
              type="email"
              name="email"
              label="Email Address"
              icon={<Mail className="w-4 h-4" />}
              value={formData.email}
              onChange={handleChange}
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
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
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
                name="password"
                label="Password"
                icon={<Lock className="w-4 h-4" />}
                value={formData.password}
                onChange={handleChange}
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
                name="confirmPassword"
                label="Confirm Password"
                icon={<Lock className="w-4 h-4" />}
                value={formData.confirmPassword}
                onChange={handleChange}
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
              <input type="checkbox" className="mr-3 mt-1 rounded border-gray-700 bg-black text-neon-purple" required />
              <span className="text-sm text-gray-300">
                I agree to the{' '}
                <Link to="/terms" className="text-neon-purple hover:text-neon-purple-dark">
                  Terms of Service
                </Link>
                {' '}and{' '}
                <Link to="/privacy" className="text-neon-purple hover:text-neon-purple-dark">
                  Privacy Policy
                </Link>
              </span>
            </div>

            <Button type="submit" className="w-full" isLoading={isLoading}>
              Create Account
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-700" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-black text-gray-400">Or continue with</span>
              </div>
            </div>

            <Button type="button" variant="outline" className="w-full">
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-400">
              Already have an account?{' '}
              <Link to="/login" className="text-neon-purple hover:text-neon-purple-dark font-medium">
                Sign in
              </Link>
            </p>
          </div>
        </Card>
      </motion.div>
    </div>
  );
};