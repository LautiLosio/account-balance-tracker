import { LoadingSpinner } from '@/components/ui/loading-spinner';

export default function AppLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <LoadingSpinner />
    </div>
  );
}
