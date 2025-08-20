import React from 'react';
import { motion } from 'framer-motion';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
  isLoading?: boolean;
  roleColor?: 'purple' | 'blue' | 'green' | 'orange';
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  children,
  isLoading = false,
  roleColor = 'purple',
  className = '',
  ...props
}) => {
  const baseClasses = 'font-semibold rounded-lg transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed';
  
  const getVariantClasses = () => {
    const colorMap = {
      purple: {
        primary: 'neon-button text-white hover:shadow-neon-glow',
        secondary: 'bg-gray-800 text-white border border-gray-700 hover:border-neon-purple hover:text-neon-purple',
        outline: 'bg-transparent text-neon-purple border border-neon-purple hover:bg-neon-purple hover:text-white',
        ghost: 'bg-transparent text-gray-300 hover:text-neon-purple hover:bg-gray-900'
      },
      blue: {
        primary: 'neon-button-blue text-white hover:shadow-neon-glow-blue',
        secondary: 'bg-gray-800 text-white border border-gray-700 hover:border-neon-blue hover:text-neon-blue',
        outline: 'bg-transparent text-neon-blue border border-neon-blue hover:bg-neon-blue hover:text-white',
        ghost: 'bg-transparent text-gray-300 hover:text-neon-blue hover:bg-gray-900'
      },
      green: {
        primary: 'neon-button-green text-white hover:shadow-neon-glow-green',
        secondary: 'bg-gray-800 text-white border border-gray-700 hover:border-neon-green hover:text-neon-green',
        outline: 'bg-transparent text-neon-green border border-neon-green hover:bg-neon-green hover:text-white',
        ghost: 'bg-transparent text-gray-300 hover:text-neon-green hover:bg-gray-900'
      },
      orange: {
        primary: 'neon-button-orange text-white hover:shadow-neon-glow-orange',
        secondary: 'bg-gray-800 text-white border border-gray-700 hover:border-neon-orange hover:text-neon-orange',
        outline: 'bg-transparent text-neon-orange border border-neon-orange hover:bg-neon-orange hover:text-white',
        ghost: 'bg-transparent text-gray-300 hover:text-neon-orange hover:bg-gray-900'
      }
    };
    
    return colorMap[roleColor][variant];
  };
  
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-6 py-2.5 text-base',
    lg: 'px-8 py-3 text-lg'
  };

  return (
    <motion.button
      whileHover={{ scale: variant === 'primary' ? 1.05 : 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={`${baseClasses} ${getVariantClasses()} ${sizeClasses[size]} ${className}`}
      disabled={isLoading}
      {...props}
    >
      {isLoading ? (
        <>
          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          Loading...
        </>
      ) : (
        children
      )}
    </motion.button>
  );
};