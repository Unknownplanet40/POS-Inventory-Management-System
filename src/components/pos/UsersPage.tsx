import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { getAllUsers, deleteUser, updateUser, reactivateUser, User } from '@/lib/db';
import { registerUser } from '@/lib/auth';
import { Plus, Trash2, Edit, User as UserIcon, Shield, ShieldCheck, Eye, EyeOff, Info, RotateCcw, Archive, RefreshCw } from 'lucide-react';

export function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [showArchived, setShowArchived] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<User | null>(null);
  const [showFormPassword, setShowFormPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    role: 'cashier' as 'admin' | 'cashier',
  });
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { toast } = useToast();
  const { session } = useAuth();
  const adminCount = users.filter(u => u.role === 'admin').length;

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    const allUsers = await getAllUsers();
    setUsers(allUsers.sort((a, b) => a.username.localeCompare(b.username)));
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadUsers();
    setIsRefreshing(false);
    toast({ title: 'Refreshed', description: 'User list updated' });
  };

  const resetForm = () => {
    setFormData({ username: '', password: '', confirmPassword: '', role: 'cashier' });
    setEditingUser(null);
  };

  const openDialog = (user?: User) => {
    if (user) {
      if (user.activeSessionToken && user.id !== session?.userId) {
        toast({ title: 'User online', description: 'Cannot edit a user who is currently online.', variant: 'destructive' });
        return;
      }
      setEditingUser(user);
      setFormData({
        username: user.username,
        password: '',
        confirmPassword: '',
        role: user.role,
      });
    } else {
      resetForm();
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const { username, password, role } = formData;
    
    if (!username.trim()) {
      toast({ title: 'Error', description: 'Username is required', variant: 'destructive' });
      return;
    }

    if (!editingUser && !password.trim()) {
      toast({ title: 'Error', description: 'Password is required', variant: 'destructive' });
      return;
    }

    if (editingUser && password.trim()) {
      if (password.length < 4) {
        toast({ title: 'Error', description: 'Password must be at least 4 characters', variant: 'destructive' });
        return;
      }
      if (password !== formData.confirmPassword) {
        toast({ title: 'Error', description: 'Passwords do not match', variant: 'destructive' });
        return;
      }
    }

    if (editingUser && editingUser.role === 'admin' && role === 'cashier' && adminCount === 1) {
      toast({ 
        title: 'Cannot downgrade', 
        description: 'The last admin cannot be downgraded to cashier. Create another admin first.', 
        variant: 'destructive' 
      });
      return;
    }

    try {
      if (editingUser) {
        await updateUser({ ...editingUser, role }, password.trim() ? password : undefined);
        toast({ title: 'Updated', description: password.trim() ? 'User role and password updated successfully' : 'User role updated successfully' });
      } else {
        await registerUser(username.trim(), password, role);
        toast({ title: 'Created', description: 'User created successfully' });
      }
      
      setIsDialogOpen(false);
      resetForm();
      loadUsers();
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to save user',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (user: User) => {
    if (user.id === session?.userId) {
      toast({ title: 'Error', description: 'Cannot archive your own account', variant: 'destructive' });
      return;
    }
    if (user.activeSessionToken) {
      toast({ title: 'User online', description: 'Cannot archive a user who is currently online.', variant: 'destructive' });
      return;
    }
    setShowDeleteConfirm(user);
  };

  const confirmDelete = async (user: User) => {
    try {
      await deleteUser(user.id);
      toast({ title: 'Archived', description: 'User has been archived successfully' });
      setShowDeleteConfirm(null);
      loadUsers();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to archive user', variant: 'destructive' });
    }
  };

  

  const handleReactivate = async (user: User) => {
    try {
      await reactivateUser(user.id);
      toast({ title: 'Reactivated', description: 'User has been reactivated successfully' });
      loadUsers();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to reactivate user', variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
          <h2 className="text-lg sm:text-xl font-semibold">
            {showArchived ? 'Archived Users' : 'Active Users'} ({users.filter(u => u.isActive === !showArchived).length})
          </h2>
          <Button 
            variant="outline" 
            className="h-10 rounded-xl text-sm sm:text-base" 
            onClick={() => setShowArchived(!showArchived)}
          >
            <span className="sm:hidden">{showArchived ? 'Active' : 'Archived'}</span>
            <span className="hidden sm:inline">{showArchived ? 'Show Active' : 'Show Archived'}</span>
            {showArchived ? <UserIcon className="h-4 w-4 ml-1 sm:ml-2" /> : <Archive className="h-4 w-4 ml-1 sm:ml-2" />}
          </Button>
          <Button 
            variant="outline" 
            className="h-10 rounded-xl text-sm sm:text-base" 
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
        </div>
        {!showArchived && (
          <Button className="h-10 rounded-xl text-sm sm:text-base" onClick={() => openDialog()}>
            <Plus className="h-5 w-5 mr-2" /> Add User
          </Button>
        )}
      </div>

      <p className="text-xs text-muted-foreground">Note: Online status may update with a short delay.</p>

      <div className="grid gap-3">
        {users.filter(u => u.isActive === !showArchived).map((user) => (
          <Card key={user.id} className="rounded-xl">
            <CardContent className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 flex-wrap">
              <div className={`flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-xl flex-shrink-0 ${user.role === 'admin' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                {user.role === 'admin' ? (
                  <ShieldCheck className="h-5 w-5 sm:h-6 sm:w-6" />
                ) : (
                  <UserIcon className="h-5 w-5 sm:h-6 sm:w-6" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center flex-wrap gap-1 sm:gap-2">
                  <h3 className="font-bold text-lg sm:text-xl truncate">{user.username}</h3>
                  <span className={`px-2 py-1 rounded-full text-[10px] sm:text-xs font-semibold ${user.activeSessionToken ? 'bg-green-100 text-green-700' : 'bg-muted text-muted-foreground'}`}>
                    {user.activeSessionToken ? 'Online' : 'Offline'}
                  </span>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center sm:gap-4 gap-1 mt-1 text-xs sm:text-sm">
                  <p className="text-muted-foreground capitalize flex items-center gap-1">
                    {user.role === 'admin' ? <Shield className="h-3 w-3" /> : null}
                    {user.role === 'admin' ? 'Administrator' : 'Cashier'}
                  </p>
                  <div className="text-muted-foreground">
                    Created: {new Date(user.createdAt).toLocaleDateString()}
                  </div>
                  <span className="text-muted-foreground break-words">
                    {user.lastLoginAt
                      ? `Last login: ${new Date(user.lastLoginAt).toLocaleDateString() == new Date().toLocaleDateString() ? 'Today at ' + new Date(user.lastLoginAt).toLocaleTimeString() : new Date(user.lastLoginAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}`
                      : 'Last login: Never'}
                  </span>
                </div>
              </div>
              <div className="flex gap-2 flex-wrap sm:flex-nowrap w-full sm:w-auto justify-end">
                {user.isActive ? (
                  <>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl"
                            onClick={() => openDialog(user)}
                            title="Edit"
                            disabled={!!user.activeSessionToken && user.id !== session?.userId}
                          >
                            <Edit className="h-4 w-4 sm:h-5 sm:w-5" />
                          </Button>
                        </TooltipTrigger>
                        {!!user.activeSessionToken && user.id !== session?.userId && (
                          <TooltipContent>
                            <p>User is online; editing is disabled.</p>
                          </TooltipContent>
                        )}
                      </Tooltip>
                    </TooltipProvider>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="destructive"
                            size="icon"
                            className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl"
                            onClick={() => handleDelete(user)}
                            disabled={user.id === session?.userId || !!user.activeSessionToken}
                            title="Archive"
                          >
                            <Archive className="h-4 w-4 sm:h-5 sm:w-5" />
                          </Button>
                        </TooltipTrigger>
                        {(user.id === session?.userId || !!user.activeSessionToken) && (
                          <TooltipContent>
                            <p>{user.id === session?.userId ? 'You cannot archive your own account.' : 'User is online; archiving is disabled.'}</p>
                          </TooltipContent>
                        )}
                      </Tooltip>
                    </TooltipProvider>
                  </>
                ) : (
                  <Button
                    variant="default"
                    className="h-10 sm:h-12 rounded-xl text-xs sm:text-sm flex-1 sm:flex-none"
                    onClick={() => handleReactivate(user)}
                  >
                    <RotateCcw className="h-4 w-4 sm:h-5 sm:w-5 mr-1 sm:mr-2" />
                    Reactivate
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-sm sm:max-w-md rounded-xl">
          <DialogHeader>
            <DialogTitle>{editingUser ? 'Edit User' : 'Add New User'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                placeholder="Enter username"
                className="h-14 text-lg rounded-xl"
                disabled={!!editingUser}
              />
              {!editingUser && (
                <div className="flex items-center gap-2">
                  <p className="text-xs text-amber-600">Warning: Username cannot be edited after creation</p>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-4 w-4 text-amber-600 cursor-help flex-shrink-0" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-xs">Username is a permanent identifier used in transaction records and system references. Changing it after creation would break historical data integrity.</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              )}
            </div>
            {!editingUser ? (
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showFormPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="Enter password"
                    className="h-14 text-lg pr-12 rounded-xl"
                  />
                  <button
                    type="button"
                    onClick={() => setShowFormPassword(!showFormPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showFormPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="new-password">New Password (optional)</Label>
                <div className="relative">
                  <Input
                    id="new-password"
                    type={showFormPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="Leave blank to keep current password"
                    className="h-14 text-lg pr-12 rounded-xl"
                  />
                  <button
                    type="button"
                    onClick={() => setShowFormPassword(!showFormPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showFormPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                <div className="relative mt-2">
                  <Input
                    id="confirm-password"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    placeholder="Confirm new password"
                    className="h-14 text-lg pr-12 rounded-xl"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                <p className="text-xs text-muted-foreground">Minimum 4 characters</p>
              </div>
            )}
            <div className="space-y-2">
              <Label>Role</Label>
              <Select 
                value={formData.role} 
                onValueChange={(value: 'admin' | 'cashier') => setFormData({ ...formData, role: value })}
                disabled={editingUser && editingUser.role === 'admin' && adminCount === 1}
              >
                <SelectTrigger className="h-14 text-lg rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cashier">Cashier</SelectItem>
                  <SelectItem value="admin">Administrator</SelectItem>
                </SelectContent>
              </Select>
              {editingUser && editingUser.role === 'admin' && adminCount === 1 && (
                <p className="text-xs text-amber-600 mt-1">Cannot downgrade the last admin. Create another admin first.</p>
              )}
            </div>
            <div className="flex gap-3 pt-4">
              <Button type="button" variant="outline" className="flex-1 h-14 rounded-xl" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="flex-1 h-14 rounded-xl">
                {editingUser ? 'Save Changes' : 'Create User'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Archive Confirmation Dialog */}
      <Dialog open={!!showDeleteConfirm} onOpenChange={() => setShowDeleteConfirm(null)}>
        <DialogContent className="max-w-sm sm:max-w-md rounded-xl">
          <DialogHeader>
            <DialogTitle>Archive User?</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Are you sure you want to archive the user <strong>"{showDeleteConfirm?.username}"</strong>? They will not be able to login, but you can reactivate them later from the archived users list.
            </p>
            <div className="flex gap-3">
              <Button 
                variant="outline" 
                className="flex-1 h-12 rounded-xl" 
                onClick={() => setShowDeleteConfirm(null)}
              >
                Cancel
              </Button>
              <Button 
                variant="destructive" 
                className="flex-1 h-12 rounded-xl" 
                onClick={() => showDeleteConfirm && confirmDelete(showDeleteConfirm)}
              >
                Archive User
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
}
