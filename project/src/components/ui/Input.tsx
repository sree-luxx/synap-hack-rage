import React, { forwardRef } from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
  roleColor?: 'purple' | 'blue' | 'green' | 'orange';
}

export const Input = forwardRef<HTMLInputElement, InputProps>(({
  label,
  error,
  icon,
  roleColor = 'purple',
  className = '',
  ...props
}, ref) => {
  const getFocusClasses = () => {
    const colorMap = {
      purple: 'focus:border-neon-purple focus:shadow-[0_0_10px_rgba(195,0,255,0.5)]',
      blue: 'focus:border-neon-blue focus:shadow-[0_0_10px_rgba(0,209,255,0.5)]',
      green: 'focus:border-neon-green focus:shadow-[0_0_10px_rgba(0,255,136,0.5)]',
      orange: 'focus:border-neon-orange focus:shadow-[0_0_10px_rgba(255,136,0,0.5)]'
    };
    return colorMap[roleColor];
  };

  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-sm font-medium text-gray-300">
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
            {icon}
          </div>
        )}
        <input
          ref={ref}
          className={`neon-input w-full px-4 py-2.5 text-white rounded-lg ${
            icon ? 'pl-10' : ''
          } ${error ? 'border-red-500' : ''} ${getFocusClasses()} ${className}`}
          {...props}
        />
      </div>
      {error && (
        <p className="text-red-400 text-sm">{error}</p>
      )}
    </div>
  );
});

Input.displayName = 'Input';