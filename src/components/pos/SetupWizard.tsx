import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';
import { registerUser } from '@/lib/auth';
import { saveSettings } from '@/lib/db';
import { useAuth } from '@/contexts/AuthContext';
import { Store, User, Lock, Check, Eye, EyeOff, Info } from 'lucide-react';

export function SetupWizard() {
  const [step, setStep] = useState(1);
  const [storeName, setStoreName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const { toast } = useToast();
  const { refreshSetupStatus, login } = useAuth();

  const handleStoreSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!storeName.trim()) {
      toast({ title: 'Error', description: 'Please enter a store name', variant: 'destructive' });
      return;
    }
    setStep(2);
  };

  const handleAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username.trim() || !password.trim()) {
      toast({ title: 'Error', description: 'Please fill in all fields', variant: 'destructive' });
      return;
    }

    if (password !== confirmPassword) {
      toast({ title: 'Error', description: 'Passwords do not match', variant: 'destructive' });
      return;
    }

    if (password.length < 4) {
      toast({ title: 'Error', description: 'Password must be at least 4 characters', variant: 'destructive' });
      return;
    }

    // Check if password contains any word from username
    const usernameLower = username.toLowerCase();
    const passwordLower = password.toLowerCase();
    const usernameWords = usernameLower.split(/[\s_-]+/).filter(word => word.length > 2);
    
    for (const word of usernameWords) {
      if (passwordLower.includes(word)) {
        toast({ 
          title: 'Error', 
          description: 'Password cannot contain parts of your username', 
          variant: 'destructive' 
        });
        return;
      }
    }

    setIsSubmitting(true);
    try {
      await registerUser(username, password, 'admin');
      await saveSettings({
        id: 'app-settings',
        isSetupComplete: true,
        storeName: storeName.trim(),
      });
      await login(username, password);
      await refreshSetupStatus();
      setIsComplete(true);
      toast({ title: 'Success', description: 'Setup complete! Welcome and enjoy using the POS system.' });
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Setup failed',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center bg-primary text-primary-foreground rounded-full">
            <Store className="h-8 w-8" />
          </div>
          <CardTitle className="text-2xl">POS System Setup</CardTitle>
          <CardDescription>
            {isComplete ? 'All set! Your store is ready.' : step === 1 ? 'Configure your store' : 'Create admin account'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!isComplete && (
            <>
              {/* Progress indicator */}
              <div className="flex items-center justify-center gap-2 mb-8">
                <div className={`flex h-10 w-10 items-center justify-center border-2 ${step >= 1 ? 'bg-primary text-primary-foreground border-primary' : 'border-muted'}`}>
                  {step > 1 ? <Check className="h-5 w-5" /> : '1'}
                </div>
                <div className={`h-1 w-12 ${step >= 2 ? 'bg-primary' : 'bg-muted'}`} />
                <div className={`flex h-10 w-10 items-center justify-center border-2 ${step >= 2 ? 'bg-primary text-primary-foreground border-primary' : 'border-muted'}`}>
                  2
                </div>
              </div>

              {step === 1 ? (
                <form onSubmit={handleStoreSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="storeName" className="text-base">Store Name</Label>
                    <Input
                      id="storeName"
                      value={storeName}
                      onChange={(e) => setStoreName(e.target.value)}
                      placeholder="e.g., PC Parts & Accessories"
                      className="h-14 text-lg"
                      autoFocus
                    />
                  </div>
                  <Button type="submit" className="w-full h-14 text-lg">
                    Continue
                  </Button>
                </form>
              ) : (
                <form onSubmit={handleAdminSubmit} className="space-y-4">
                  <TooltipProvider>
                    <div className="space-y-2">
                      <Label htmlFor="username" className="text-base flex items-center gap-2">
                        <User className="h-4 w-4" /> Username
                      </Label>
                      <Input
                        id="username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="Admin username"
                        className="h-14 text-lg"
                        autoFocus
                      />
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <p className="text-sm text-muted-foreground flex items-center gap-1 cursor-help">
                            <Info className="h-3 w-3" />
                            Note: Username cannot be changed after setup
                          </p>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Username is tied to your session and authentication.<br />It cannot be modified to maintain security and data integrity.</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  </TooltipProvider>
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-base flex items-center gap-2">
                      <Lock className="h-4 w-4" /> Password
                    </Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Create password"
                        className="h-14 text-lg pr-12"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword" className="text-base">Confirm Password</Label>
                    <div className="relative">
                      <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Confirm password"
                        className="h-14 text-lg pr-12"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                  </div>
                  <div className="flex gap-3 pt-4">
                    <Button type="button" variant="outline" onClick={() => setStep(1)} className="flex-1 h-14 text-lg">
                      Back
                    </Button>
                    <Button type="submit" disabled={isSubmitting} className="flex-1 h-14 text-lg">
                      {isSubmitting ? 'Creating...' : 'Complete Setup'}
                    </Button>
                  </div>
                </form>
              )}
            </>
          )}

          {isComplete && (
            <div className="space-y-4 text-center">
              <div className="mx-auto h-16 w-16 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                <Check className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-semibold">Welcome to your POS system!</h3>
              <p className="text-muted-foreground">Setup is complete. You can close this window and start using the dashboard.</p>
              <Button className="w-full h-12" onClick={() => window.location.href = '/'}>
                Go to Dashboard
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
