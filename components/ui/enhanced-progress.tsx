'use client';

import * as React from 'react';
import * as ProgressPrimitive from '@radix-ui/react-progress';
import { cn } from '@/lib/utils';

interface EnhancedProgressProps extends React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root> {
  value?: number;
  status?: 'on_schedule' | 'ahead' | 'behind' | 'at_risk';
  updating?: boolean;
  showLabel?: boolean;
}

const EnhancedProgress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  EnhancedProgressProps
>(({ className, value = 0, status, updating = false, showLabel = false, ...props }, ref) => {
  // Get color based on status
  const getStatusColor = () => {
    switch (status) {
      case 'ahead': return 'bg-green-500';
      case 'on_schedule': return 'bg-blue-500';
      case 'behind': return 'bg-amber-500';
      case 'at_risk': return 'bg-red-500';
      default: return 'bg-primary';
    }
  };

  return (
    <div className={cn("w-full", updating && "updating")}>
      <ProgressPrimitive.Root
        ref={ref}
        className={cn(
          'relative h-4 w-full overflow-hidden rounded-full bg-secondary',
          className
        )}
        {...props}
      >
        <ProgressPrimitive.Indicator
          className={cn("h-full w-full flex-1 transition-all", getStatusColor())}
          style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
        />
      </ProgressPrimitive.Root>
      {showLabel && (
        <div className="flex justify-between mt-1 text-xs">
          <span className={cn(
            "font-medium",
            status === 'ahead' && "text-green-600",
            status === 'on_schedule' && "text-blue-600",
            status === 'behind' && "text-amber-600",
            status === 'at_risk' && "text-red-600"
          )}>
            {value}%
          </span>
          {status && (
            <span className={cn(
              "capitalize",
              status === 'ahead' && "text-green-600",
              status === 'on_schedule' && "text-blue-600",
              status === 'behind' && "text-amber-600",
              status === 'at_risk' && "text-red-600"
            )}>
              {status.replace('_', ' ')}
            </span>
          )}
        </div>
      )}
    </div>
  );
});

EnhancedProgress.displayName = 'EnhancedProgress';

export { EnhancedProgress };
