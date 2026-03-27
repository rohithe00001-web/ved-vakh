import React from 'react';
import { Bookmark } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RatingFlagProps {
  rating: number;
  size?: 'sm' | 'md' | 'lg';
  showPercent?: boolean;
  className?: string;
}

export function getRatingPercent(rating: number): number {
  return Math.round((rating / 5) * 100);
}

export function getRatingFlagColor(rating: number): 'green' | 'yellow' | 'red' {
  const percent = getRatingPercent(rating);
  if (percent >= 70) return 'green';
  if (percent >= 40) return 'yellow';
  return 'red';
}

const colorStyles = {
  green: 'text-emerald-500',
  yellow: 'text-yellow-500',
  red: 'text-red-500',
};

const bgStyles = {
  green: 'bg-emerald-500/15',
  yellow: 'bg-yellow-500/15',
  red: 'bg-red-500/15',
};

const sizes = { sm: 'w-3.5 h-3.5', md: 'w-4 h-4', lg: 'w-5 h-5' };
const textSizes = { sm: 'text-[10px]', md: 'text-xs', lg: 'text-sm' };

const RatingFlag: React.FC<RatingFlagProps> = ({ rating, size = 'md', showPercent = false, className }) => {
  const color = getRatingFlagColor(rating);
  const percent = getRatingPercent(rating);

  return (
    <div className={cn('inline-flex items-center gap-1', className)}>
      <div className={cn('rounded-full p-0.5', bgStyles[color])}>
        <Bookmark className={cn(sizes[size], colorStyles[color])} fill="currentColor" />
      </div>
      {showPercent && (
        <span className={cn(textSizes[size], 'font-semibold', colorStyles[color])}>
          {percent}%
        </span>
      )}
    </div>
  );
};

export default RatingFlag;
