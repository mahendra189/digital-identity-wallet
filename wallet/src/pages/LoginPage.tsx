import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Lock, ArrowRight } from 'lucide-react';

interface LoginPageProps {
  onLoginSuccess: (username: string) => void;
  onNavigate: (route: string) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess, onNavigate }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!username.trim() || !password) {
      setError('Please enter both username and password.');
      return;
    }

    setIsLoading(true);
    try {
      // Local demo auth simulation or backend login
      localStorage.setItem('wallet_auth_user', username.trim());
      onLoginSuccess(username.trim());
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoFill = () => {
    setUsername('student');
    setPassword('student123');
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-md border-zinc-200">
        <CardHeader className="space-y-1 text-center">
          <div className="mx-auto size-10 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-900 mb-2">
            <Lock className="size-5" />
          </div>
          <CardTitle className="text-xl">Sign in to your wallet</CardTitle>
          <CardDescription>Enter your credentials to access your local identity vault</CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && (
              <div className="p-3 rounded-md bg-red-50 border border-red-200 text-xs text-red-700">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="username">Username or Student Roll Number</Label>
              <Input
                id="username"
                type="text"
                placeholder="e.g. 21CS042 or student"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                required
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
              </div>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
            </div>
          </CardContent>

          <CardFooter className="flex flex-col gap-3">
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Signing in...' : 'Sign In'}
              <ArrowRight className="size-4 ml-1" />
            </Button>

            <div className="flex items-center justify-between w-full text-xs text-zinc-500 pt-2">
              <button
                type="button"
                onClick={handleDemoFill}
                className="text-zinc-600 hover:text-zinc-900 underline"
              >
                Fill demo credentials
              </button>

              <button
                type="button"
                onClick={() => onNavigate('/register')}
                className="text-zinc-900 font-medium hover:underline"
              >
                Create an account
              </button>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};
