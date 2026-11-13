import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { UserPlus, ArrowRight, ShieldCheck } from 'lucide-react';
import { getOrCreateHolderKey } from '../services/storage';

interface RegisterPageProps {
  onRegisterSuccess: (username: string) => void;
  onNavigate: (route: string) => void;
}

export const RegisterPage: React.FC<RegisterPageProps> = ({ onRegisterSuccess, onNavigate }) => {
  const [fullName, setFullName] = useState('');
  const [rollNumber, setRollNumber] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!fullName.trim() || !rollNumber.trim() || !password) {
      setError('Please fill in all required fields.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setIsLoading(true);
    try {
      // Ensure P-256 WebCrypto keypair is generated and stored in IndexedDB vault
      await getOrCreateHolderKey();
      localStorage.setItem('wallet_auth_user', rollNumber.trim());
      localStorage.setItem('wallet_user_name', fullName.trim());
      onRegisterSuccess(rollNumber.trim());
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-md border-zinc-200">
        <CardHeader className="space-y-1 text-center">
          <div className="mx-auto size-10 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-900 mb-2">
            <UserPlus className="size-5" />
          </div>
          <CardTitle className="text-xl">Create your wallet</CardTitle>
          <CardDescription>Initialize your hardware-backed cryptographic identity</CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && (
              <div className="p-3 rounded-md bg-red-50 border border-red-200 text-xs text-red-700">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                type="text"
                placeholder="e.g. Priya Sharma"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="rollNumber">Student Roll Number / Username</Label>
              <Input
                id="rollNumber"
                type="text"
                placeholder="e.g. 21CS042"
                value={rollNumber}
                onChange={(e) => setRollNumber(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="regPassword">Password</Label>
              <Input
                id="regPassword"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>

            <div className="p-3 rounded-md bg-zinc-50 border border-zinc-200 text-xs text-zinc-600 flex items-start gap-2">
              <ShieldCheck className="size-4 text-zinc-800 shrink-0 mt-0.5" />
              <span>
                A hardware-isolated ECDSA P-256 cryptographic key will be securely generated in your browser's IndexedDB.
              </span>
            </div>
          </CardContent>

          <CardFooter className="flex flex-col gap-3">
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Creating Vault...' : 'Create Account & Vault'}
              <ArrowRight className="size-4 ml-1" />
            </Button>

            <p className="text-center text-xs text-zinc-500 pt-1">
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => onNavigate('/login')}
                className="text-zinc-900 font-medium hover:underline"
              >
                Sign in
              </button>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};
