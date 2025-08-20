import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  roleColor?: 'purple' | 'blue' | 'green' | 'orange';
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  roleColor = 'purple'
}) => {
  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl'
  };

  const getCloseButtonColor = () => {
    const colorMap = {
      purple: 'text-neon-purple hover:text-neon-purple-dark',
      blue: 'text-neon-blue hover:text-blue-400',
      green: 'text-neon-green hover:text-green-400',
      orange: 'text-neon-orange hover:text-orange-400'
    };
    return colorMap[roleColor];
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm"
            onClick={onClose}
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className={`relative w-full ${sizeClasses[size]} max-h-[90vh] overflow-y-auto scrollbar-neon`}
          >
            <div className={`neon-card-${roleColor} rounded-lg`}>
              {title && (
                <div className="flex items-center justify-between p-6 border-b border-gray-800">
                  <h2 className="text-xl font-orbitron font-bold text-white">{title}</h2>
                  <button
                    onClick={onClose}
                    className={`${getCloseButtonColor()} transition-colors`}
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              )}
              
              <div className={title ? 'p-6' : 'p-6'}>
                {children}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};