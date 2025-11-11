'use client';

import { motion } from 'framer-motion';
import type { SessionMode } from '@/types';
import type { ReactNode } from 'react';

interface ModeCardProps {
  mode: SessionMode;
  title: string;
  description: string;
  icon: ReactNode;
  selected: boolean;
  onClick: () => void;
}

export function ModeCard({ mode, title, description, icon, selected, onClick }: ModeCardProps) {
  return (
    <motion.button
      onClick={onClick}
      className={`
        relative p-6 rounded-xl border-2 text-left transition-all
        ${selected
          ? 'border-purple-custom bg-purple-custom/5 shadow-lg'
          : 'border-gray-200 dark:border-gray-800 hover:border-purple-custom/50 bg-white dark:bg-[#0A0A0A]'
        }
      `}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Selection Indicator */}
      {selected && (
        <motion.div
          className="absolute top-4 right-4 w-6 h-6 rounded-full bg-purple-custom flex items-center justify-center"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        >
          <svg
            className="w-4 h-4 text-white"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path d="M5 13l4 4L19 7" />
          </svg>
        </motion.div>
      )}

      {/* Icon */}
      <div className={`
        mb-4 p-3 rounded-lg inline-flex transition-colors
        ${selected
          ? 'bg-purple-custom/20 text-purple-custom'
          : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
        }
      `}>
        {icon}
      </div>

      {/* Title */}
      <div className="flex items-center gap-2 mb-2">
        <h3 className={`
          text-xl font-bold
          ${selected ? 'text-purple-custom' : 'text-gray-900 dark:text-white'}
        `}>
          {title}
        </h3>
        {mode === 'focused-quiz' && (
          <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-purple-custom/10 text-purple-custom border border-purple-custom/20">
            Beta
          </span>
        )}
      </div>

      {/* Description */}
      <p className="text-sm text-gray-600 dark:text-gray-400">
        {description}
      </p>
    </motion.button>
  );
}
