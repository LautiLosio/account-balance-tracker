import { Loader2 } from 'lucide-react';

type LoadingSpinnerProps = {
  className?: string;
};

export function LoadingSpinner({ className }: LoadingSpinnerProps) {
  return (
    <div className={`flex h-full w-full items-center justify-center ${className ?? ''}`}>
      <Loader2 className="h-8 w-8 animate-spin" />
    </div>
  );
}
