'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement Firebase Auth Login
    console.log('Login attempt:', email);
    router.push('/admin/dashboard');
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-50">
      <div className="card w-full max-w-md p-8 animate-fadeIn">
        <div className="text-center mb-8">
          <h1 className="h2 text-primary-600 mb-2">Saloon Manager</h1>
          <p className="text-muted">Sign in to manage your salon</p>
        </div>

        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              type="email"
              className="input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@example.com"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Password</label>
            <input
              type="password"
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>
          <button type="submit" className="btn btn-primary w-full mt-2">
            Sign In
          </button>
        </form>
      </div>
    </div>
  );
}
