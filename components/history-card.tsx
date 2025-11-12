'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Pencil, Trash2, FileText, Eye, Check, X } from 'lucide-react';
import { motion } from 'framer-motion';
import type { Session } from '@/types';
import { updateSessionTitle, deleteSession } from '@/lib/db';

interface HistoryCardProps {
  session: Session;
  onDelete: (id: string) => void;
  onUpdate: () => void;
}

export function HistoryCard({ session, onDelete, onUpdate }: HistoryCardProps) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState(session.title || '');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleSaveTitle = async () => {
    if (editedTitle.trim()) {
      await updateSessionTitle(session.id, editedTitle.trim());
      setIsEditing(false);
      onUpdate();
    }
  };

  const handleCancelEdit = () => {
    setEditedTitle(session.title || '');
    setIsEditing(false);
  };

  const handleDelete = async () => {
    await deleteSession(session.id);
    onDelete(session.id);
  };

  const handleView = () => {
    router.push(`/result/${session.id}`);
  };

  const formatDate = (timestamp?: number) => {
    if (!timestamp) return 'Unknown date';
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getModeLabel = (mode?: string) => {
    return mode === 'focused-quiz' ? 'Focused Quiz' : 'Study Guide';
  };

  const getDifficultyLabel = (difficulty?: string) => {
    if (!difficulty) return 'Match';
    return difficulty.charAt(0).toUpperCase() + difficulty.slice(1);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="relative overflow-hidden hover:shadow-lg transition-shadow group">
        <div className="p-6">
          {/* Header with Title */}
          <div className="mb-4">
            {isEditing ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={editedTitle}
                  onChange={(e) => setEditedTitle(e.target.value)}
                  className="flex-1 px-3 py-2 text-lg font-semibold border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-custom/50"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveTitle();
                    if (e.key === 'Escape') handleCancelEdit();
                  }}
                />
                <Button
                  size="sm"
                  onClick={handleSaveTitle}
                  className="bg-green-500 hover:bg-green-600"
                >
                  <Check className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleCancelEdit}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="flex items-start justify-between gap-2">
                <h3 className="text-lg font-semibold line-clamp-2 flex-1">
                  {session.title || 'Untitled Study Guide'}
                </h3>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setIsEditing(true)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Pencil className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>

          {/* Mode Badge */}
          <div className="mb-3">
            <span
              className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                session.mode === 'focused-quiz'
                  ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
                  : 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
              }`}
            >
              {getModeLabel(session.mode)}
            </span>
          </div>

          {/* Metadata */}
          <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400 mb-4">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              <span>Created: {formatDate(session.completedAt || session.timestamp)}</span>
            </div>
            {session.config && (
              <>
                <div>Questions: {session.config.questionCount}</div>
                <div>Difficulty: {getDifficultyLabel(session.config.difficulty)}</div>
                {session.config.curriculum && (
                  <div className="line-clamp-1">Subject: {session.config.curriculum}</div>
                )}
              </>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Button
              onClick={handleView}
              className="flex-1"
              size="sm"
            >
              <Eye className="h-4 w-4 mr-2" />
              View
            </Button>
            {showDeleteConfirm ? (
              <>
                <Button
                  onClick={handleDelete}
                  variant="destructive"
                  size="sm"
                  className="flex-1"
                >
                  Confirm Delete
                </Button>
                <Button
                  onClick={() => setShowDeleteConfirm(false)}
                  variant="outline"
                  size="sm"
                >
                  Cancel
                </Button>
              </>
            ) : (
              <Button
                onClick={() => setShowDeleteConfirm(true)}
                variant="outline"
                size="sm"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
