import React from 'react';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProfileRatingProps {
  rating: number;
  size?: 'sm' | 'md' | 'lg';
  showNumber?: boolean;
  className?: string;
}

const ProfileRating: React.FC<ProfileRatingProps> = ({
  rating,
  size = 'md',
  showNumber = true,
  className,
}) => {
  const sizes = { sm: 'w-3 h-3', md: 'w-4 h-4', lg: 'w-5 h-5' };
  const textSizes = { sm: 'text-xs', md: 'text-sm', lg: 'text-base' };

  const getRatingColor = (r: number) => {
    if (r >= 4) return 'text-yellow-400';
    if (r >= 3) return 'text-orange-400';
    if (r >= 2) return 'text-orange-500';
    return 'text-red-500';
  };

  return (
    <div className={cn('flex items-center gap-1', className)}>
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => {
          const filled = rating >= star;
          const partial = !filled && rating > star - 1;
          const fillPercent = partial ? Math.round((rating - (star - 1)) * 100) : 0;

          return (
            <div key={star} className="relative">
              <Star className={cn(sizes[size], 'text-muted')} fill="currentColor" />
              {(filled || partial) && (
                <div
                  className="absolute inset-0 overflow-hidden"
                  style={{ width: filled ? '100%' : `${fillPercent}%` }}
                >
                  <Star className={cn(sizes[size], getRatingColor(rating))} fill="currentColor" />
                </div>
              )}
            </div>
          );
        })}
      </div>
      {showNumber && (
        <span className={cn(textSizes[size], 'font-semibold', getRatingColor(rating))}>
          {rating.toFixed(1)}
        </span>
      )}
    </div>
  );
};

export default ProfileRating;
