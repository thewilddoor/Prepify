'use client';

import { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import type { FocusedQuizConfig } from '@/types';

interface FocusedQuizConfigFormProps {
  onSubmit: (config: FocusedQuizConfig) => void;
  onBack: () => void;
  initialConfig?: FocusedQuizConfig;
}

const DEFAULT_CONFIG: FocusedQuizConfig = {
  mode: 'focused-quiz',
  questionCount: 10,
  difficulty: 'match',
};

export function FocusedQuizConfigForm({ onSubmit, onBack, initialConfig }: FocusedQuizConfigFormProps) {
  const [config, setConfig] = useState<FocusedQuizConfig>(initialConfig || DEFAULT_CONFIG);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(config);
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-3xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Configure Your Focused Quiz</CardTitle>
          <CardDescription>
            The AI will analyze your graded work to identify wrong answers and generate targeted practice questions
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Info Box */}
          <div className="bg-purple-custom/10 border border-purple-custom/30 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <svg
                className="h-5 w-5 text-purple-custom mt-0.5 flex-shrink-0"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="text-sm">
                <p className="font-medium text-purple-custom mb-1">How it works:</p>
                <ul className="text-gray-600 dark:text-gray-400 space-y-1">
                  <li>• AI identifies incorrect answers by looking for red marks, X&apos;s, and corrections</li>
                  <li>• Determines which concepts you struggled with</li>
                  <li>• Generates {config.questionCount} targeted questions to help you master those areas</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Question Count */}
          <div className="space-y-2">
            <label htmlFor="questionCount" className="block text-sm font-medium">
              Number of Questions: {config.questionCount}
            </label>
            <input
              type="range"
              id="questionCount"
              min="5"
              max="15"
              value={config.questionCount}
              onChange={(e) => setConfig({ ...config, questionCount: parseInt(e.target.value) })}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-purple-custom"
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>5</span>
              <span>10</span>
              <span>15</span>
            </div>
          </div>

          {/* Difficulty */}
          <div className="space-y-2">
            <label htmlFor="difficulty" className="block text-sm font-medium">
              Difficulty Level: {config.difficulty === 'easier' ? 'Easier' : config.difficulty === 'match' ? 'Match Original' : 'Harder'}
            </label>
            <input
              type="range"
              id="difficulty"
              min="0"
              max="2"
              step="1"
              value={config.difficulty === 'easier' ? 0 : config.difficulty === 'match' ? 1 : 2}
              onChange={(e) => {
                const value = parseInt(e.target.value);
                const difficulty = value === 0 ? 'easier' : value === 1 ? 'match' : 'harder';
                setConfig({ ...config, difficulty });
              }}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-purple-custom"
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>Easier</span>
              <span>Match Original</span>
              <span>Harder</span>
            </div>
          </div>

          {/* Curriculum (Optional) */}
          <div className="space-y-2">
            <label htmlFor="curriculum" className="block text-sm font-medium">
              Curriculum (Optional)
            </label>
            <input
              type="text"
              id="curriculum"
              value={config.curriculum || ''}
              onChange={(e) => setConfig({ ...config, curriculum: e.target.value })}
              placeholder="e.g., AP Biology, IB Math HL, Common Core Algebra"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-custom focus:border-transparent"
            />
            <p className="text-xs text-gray-500">
              Specify the curriculum or course to align question style and expectations.
            </p>
          </div>

          {/* Grade Level (Optional) */}
          <div className="space-y-2">
            <label htmlFor="gradeLevel" className="block text-sm font-medium">
              Grade Level (Optional)
            </label>
            <select
              id="gradeLevel"
              value={config.gradeLevel || ''}
              onChange={(e) => setConfig({ ...config, gradeLevel: e.target.value })}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-custom focus:border-transparent cursor-pointer"
            >
              <option value="">Select grade level...</option>
              <option value="Elementary">Elementary School</option>
              <option value="Middle School">Middle School</option>
              <option value="High School">High School</option>
              <option value="College">College/University</option>
              <option value="Graduate">Graduate School</option>
            </select>
            <p className="text-xs text-gray-500">
              Select the appropriate grade level for this quiz.
            </p>
          </div>

          {/* Additional Instructions (Optional) */}
          <div className="space-y-2">
            <label htmlFor="additionalInstructions" className="block text-sm font-medium">
              Additional Instructions (Optional)
            </label>
            <textarea
              id="additionalInstructions"
              value={config.additionalInstructions || ''}
              onChange={(e) => setConfig({ ...config, additionalInstructions: e.target.value })}
              placeholder="Any other specific requirements or preferences for the quiz..."
              className="w-full min-h-[80px] p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-custom focus:border-transparent resize-y"
            />
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex justify-between items-center">
        <Button
          type="button"
          variant="outline"
          onClick={onBack}
        >
          ← Back to Edit Files
        </Button>
        <Button type="submit" className="px-8">
          Generate Focused Quiz
        </Button>
      </div>
    </form>
  );
}
