import { useState, KeyboardEvent } from 'react';
import { Plus, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TagSelectorProps {
  availableTags: string[];
  selectedTags: string[];
  onToggle: (tag: string) => void;
  maxSelectable?: number;
}

export default function TagSelector({
  availableTags,
  selectedTags,
  onToggle,
  maxSelectable,
}: TagSelectorProps) {
  const [customInput, setCustomInput] = useState('');
  const [showInput, setShowInput] = useState(false);

  const isSelected = (tag: string) => selectedTags.includes(tag);
  const canAddMore = !maxSelectable || selectedTags.length < maxSelectable;

  const handleAddCustom = () => {
    const trimmed = customInput.trim();
    if (trimmed && !isSelected(trimmed) && canAddMore) {
      onToggle(trimmed);
      setCustomInput('');
      setShowInput(false);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddCustom();
    } else if (e.key === 'Escape') {
      setShowInput(false);
      setCustomInput('');
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {availableTags.map((tag) => {
          const selected = isSelected(tag);
          const disabled = !selected && !canAddMore;

          return (
            <button
              key={tag}
              onClick={() => !disabled && onToggle(tag)}
              className={cn(
                'chip',
                selected && 'chip-active',
                disabled && 'opacity-50 cursor-not-allowed hover:border-neutral-200 hover:text-neutral-500 hover:bg-transparent'
              )}
            >
              {selected && <X className="w-3.5 h-3.5 mr-1" />}
              {tag}
            </button>
          );
        })}

        {canAddMore && !showInput && (
          <button
            onClick={() => setShowInput(true)}
            className="chip flex items-center gap-1 border-dashed"
          >
            <Plus className="w-4 h-4" />
            <span>自定义</span>
          </button>
        )}

        {showInput && (
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={customInput}
              onChange={(e) => setCustomInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="输入标签..."
              className="input-base py-1.5 px-3 text-sm w-32"
              autoFocus
            />
            <button
              onClick={handleAddCustom}
              disabled={!customInput.trim()}
              className="btn-ghost text-primary-600 hover:bg-primary-50 disabled:opacity-50"
            >
              添加
            </button>
            <button
              onClick={() => {
                setShowInput(false);
                setCustomInput('');
              }}
              className="btn-ghost text-neutral-500 hover:bg-neutral-100"
            >
              取消
            </button>
          </div>
        )}
      </div>

      {maxSelectable && (
        <p className="text-xs text-neutral-400">
          已选择 {selectedTags.length} / {maxSelectable} 个标签
        </p>
      )}
    </div>
  );
}
