import { Loader } from "lucide-react";

export function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center h-full w-full">
      <Loader className="h-8 w-8 animate-spin" />
    </div>
  );
}
