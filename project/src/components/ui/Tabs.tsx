import React from 'react';
import { motion } from 'framer-motion';

interface Tab {
  id: string;
  label: string;
  icon?: React.ReactNode;
}

interface TabsProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  roleColor?: 'purple' | 'blue' | 'green' | 'orange';
}

export const Tabs: React.FC<TabsProps> = ({
  tabs,
  activeTab,
  onTabChange,
  roleColor = 'purple'
}) => {
  const getActiveClasses = () => {
    const colorMap = {
      purple: 'tab-active',
      blue: 'tab-active-blue',
      green: 'tab-active-green',
      orange: 'tab-active-orange'
    };
    return colorMap[roleColor];
  };

  return (
    <div className="border-b border-gray-800">
      <nav className="flex space-x-8">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-all duration-300 ${
              activeTab === tab.id
                ? getActiveClasses()
                : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300'
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
};