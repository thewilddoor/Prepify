'use client';

import { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import type { StudyGuideConfig } from '@/types';

interface ConfigFormProps {
  onSubmit: (config: StudyGuideConfig) => void;
  onBack: () => void;
  initialConfig?: StudyGuideConfig;
}

const DEFAULT_CONFIG: StudyGuideConfig = {
  questionCount: 15,
  focusPoints: '',
  difficulty: 'match',
};

export function ConfigForm({ onSubmit, onBack, initialConfig }: ConfigFormProps) {
  const [config, setConfig] = useState<StudyGuideConfig>(initialConfig || DEFAULT_CONFIG);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(config);
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-3xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Configure Your Study Guide</CardTitle>
          <CardDescription>
            Customize the study guide generation to match your needs
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Question Count */}
          <div className="space-y-2">
            <label htmlFor="questionCount" className="block text-sm font-medium">
              Number of Questions: {config.questionCount}
            </label>
            <input
              type="range"
              id="questionCount"
              min="1"
              max="30"
              value={config.questionCount}
              onChange={(e) => setConfig({ ...config, questionCount: parseInt(e.target.value) })}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>1</span>
              <span>15</span>
              <span>30</span>
            </div>
          </div>

          {/* Focus Points */}
          <div className="space-y-2">
            <label htmlFor="focusPoints" className="block text-sm font-medium">
              Focus Points
            </label>
            <textarea
              id="focusPoints"
              value={config.focusPoints}
              onChange={(e) => setConfig({ ...config, focusPoints: e.target.value })}
              placeholder="Enter key topics or concepts to emphasize (e.g., Cell Division, Photosynthesis, Mitosis)"
              className="w-full min-h-[100px] p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y"
            />
            <p className="text-xs text-gray-500">
              Specify topics you want to focus on. At least 60% of questions will target these areas.
            </p>
          </div>

          {/* Difficulty */}
          <div className="space-y-2">
            <label className="block text-sm font-medium">Difficulty Level</label>
            <div className="flex gap-4">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  name="difficulty"
                  value="easier"
                  checked={config.difficulty === 'easier'}
                  onChange={(e) => setConfig({ ...config, difficulty: e.target.value as 'easier' | 'match' | 'harder' })}
                  className="w-4 h-4 text-blue-600 cursor-pointer"
                />
                <span className="text-sm">Easier</span>
              </label>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  name="difficulty"
                  value="match"
                  checked={config.difficulty === 'match'}
                  onChange={(e) => setConfig({ ...config, difficulty: e.target.value as 'easier' | 'match' | 'harder' })}
                  className="w-4 h-4 text-blue-600 cursor-pointer"
                />
                <span className="text-sm">Match Original</span>
              </label>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  name="difficulty"
                  value="harder"
                  checked={config.difficulty === 'harder'}
                  onChange={(e) => setConfig({ ...config, difficulty: e.target.value as 'easier' | 'match' | 'harder' })}
                  className="w-4 h-4 text-blue-600 cursor-pointer"
                />
                <span className="text-sm">Harder</span>
              </label>
            </div>
            <p className="text-xs text-gray-500">
              Choose how the difficulty should compare to your uploaded materials.
            </p>
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
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer"
            >
              <option value="">Select grade level...</option>
              <option value="Elementary">Elementary School</option>
              <option value="Middle School">Middle School</option>
              <option value="High School">High School</option>
              <option value="College">College/University</option>
              <option value="Graduate">Graduate School</option>
            </select>
            <p className="text-xs text-gray-500">
              Select the appropriate grade level for this study guide.
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
              placeholder="Any other specific requirements or preferences for the study guide..."
              className="w-full min-h-[80px] p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y"
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
          Generate Study Guide
        </Button>
      </div>
    </form>
  );
}
