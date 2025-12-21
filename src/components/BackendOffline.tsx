import React from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircle, ServerOff } from 'lucide-react';

interface Props {
  onRetry?: () => void;
}

export function BackendOffline({ onRetry }: Props) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="max-w-md w-full bg-card border border-border rounded-3xl shadow-sm p-6 space-y-4 text-center">
        <div className="flex justify-center">
          <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
            <ServerOff className="h-6 w-6 text-muted-foreground" />
          </div>
        </div>
        <div>
          <h2 className="text-xl font-semibold">Backend Unavailable</h2>
          <p className="text-sm text-muted-foreground mt-2">
            We couldn't reach the server at <span className="font-mono">http://localhost:3000</span>. Make sure the backend
            is running and your network allows access.
          </p>
        </div>
        <div className="rounded-2xl border border-border bg-muted/60 p-3 text-left text-sm flex gap-2">
          <AlertCircle className="h-5 w-5 text-muted-foreground shrink-0" />
          <div>
            <p className="font-medium">How to start the backend</p>
            <p className="text-muted-foreground">From the server folder: <span className="font-mono">npm run start:dev</span></p>
          </div>
        </div>
        <div className="flex justify-center">
          <Button size="lg" onClick={onRetry} className="h-12 px-6">
            Retry Connection
          </Button>
        </div>
      </div>
    </div>
  );
}
