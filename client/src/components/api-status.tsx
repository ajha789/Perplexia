import { useQuery } from "@tanstack/react-query";
import { Key, CheckCircle, AlertCircle, Loader2 } from "lucide-react";

interface ApiKeyStatus {
  activeKey: number;
  keyStatuses: Array<{
    keyIndex: number;
    isActive: boolean;
    isExhausted: boolean;
  }>;
}

export function ApiStatus() {
  const { data, isLoading, isError } = useQuery<ApiKeyStatus>({
    queryKey: ["/api/keys/status"],
    refetchInterval: 30000,
  });

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-xs text-muted-foreground p-3 border-t border-sidebar-border">
        <Loader2 className="h-3 w-3 animate-spin" />
        <span>Checking API status...</span>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="flex items-center gap-2 text-xs text-muted-foreground p-3 border-t border-sidebar-border">
        <AlertCircle className="h-3 w-3 text-destructive" />
        <span>API status unavailable</span>
      </div>
    );
  }

  return (
    <div className="p-3 border-t border-sidebar-border">
      <div className="flex items-center gap-2 mb-2">
        <Key className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="text-xs font-medium text-muted-foreground">API Keys</span>
      </div>
      <div className="flex gap-2">
        {data.keyStatuses.map((key) => (
          <div
            key={key.keyIndex}
            className="flex items-center gap-1.5"
            title={`Key ${key.keyIndex}: ${key.isExhausted ? "Exhausted" : key.isActive ? "Active" : "Available"}`}
          >
            <div
              className={`h-2 w-2 rounded-full ${
                key.isExhausted
                  ? "bg-destructive"
                  : key.keyIndex === data.activeKey
                  ? "bg-status-online animate-pulse"
                  : "bg-muted-foreground/30"
              }`}
            />
            <span className="text-xs text-muted-foreground">
              {key.keyIndex}
            </span>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
        <CheckCircle className="h-3 w-3 text-status-online" />
        <span>Using Key {data.activeKey}</span>
      </div>
    </div>
  );
}
