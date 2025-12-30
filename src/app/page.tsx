'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Swords } from 'lucide-react';
import { signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';

// Shadcn UI Components
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const { user, role } = useAuth(); // ctxLoading artık gerekmediği için sildik.

  // Eğer kullanıcı zaten giriş yapmışsa yönlendir
  useEffect(() => {
    if (user && role) {
      if (role === 'super_admin') {
        router.push('/super-admin');
      } else {
        router.push('/admin/dashboard');
      }
    }
  }, [user, role, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      await signInWithEmailAndPassword(auth, email, password);
      // Yönlendirme useEffect içinde yapılacak
    } catch (err: any) {
      console.error(err);
      setError('Giriş başarısız. E-posta veya şifre hatalı.');
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      alert("Lütfen e-posta adresinizi girin.");
      return;
    }

    setIsLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      alert("Şifre sıfırlama bağlantısı e-posta adresinize gönderildi. Lütfen gelen kutunuzu (ve spam klasörünü) kontrol edin.");
    } catch (error: any) {
      console.error("Reset Error:", error);
      alert("Bağlantı gönderilemedi: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-slate-950">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-900 to-blue-950" />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Login Card */}
      <Card className="w-full max-w-md relative z-10 animate-fadeIn border-slate-700/50 bg-slate-900/60 backdrop-blur-xl">
        <CardHeader className="text-center pb-2">
          <div className="flex items-center justify-center gap-2 text-blue-500 mb-4">
            <Swords size={36} strokeWidth={2} />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight text-white">
            3CSCORE
          </CardTitle>
          <CardDescription className="text-slate-400">
            Salon yönetim paneline giriş yapın
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleLogin} className="space-y-5">
            {error && (
              <div className="p-3 text-sm bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">E-posta</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ornek@salon.com"
                required
                autoComplete="email"
                className="bg-black/20 border-slate-700"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Şifre</Label>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="link" type="button" className="p-0 h-auto text-xs text-blue-400 font-normal hover:text-blue-300">
                      Şifremi Unuttum?
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px] bg-slate-900 border-slate-800 text-white">
                    <DialogHeader>
                      <DialogTitle>Şifre Sıfırlama</DialogTitle>
                      <DialogDescription className="text-slate-400">
                        E-posta adresinizi girin, size şifre sıfırlama bağlantısı gönderelim.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 mt-2">
                      <div className="space-y-2">
                        <Label htmlFor="reset-email">E-posta</Label>
                        <Input
                          id="reset-email"
                          type="email"
                          placeholder="ornek@salon.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="bg-black/20 border-slate-700"
                        />
                      </div>
                      <Button onClick={handleForgotPassword} className="w-full bg-blue-600 hover:bg-blue-700 text-white" disabled={isLoading}>
                        {isLoading ? 'Gönderiliyor...' : 'Sıfırlama Bağlantısı Gönder'}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                autoComplete="current-password"
                className="bg-black/20 border-slate-700"
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              size="lg"
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Giriş yapılıyor...
                </span>
              ) : (
                'Giriş Yap'
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-slate-500">
              Hesabınız yok mu?{' '}
              <a href="#" className="text-blue-400 hover:text-blue-300 font-medium transition-colors">
                İletişime geçin
              </a>
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Footer */}
      <p className="absolute bottom-6 text-xs text-slate-600">
        © 2024 3CSCORE. Tüm hakları saklıdır.
      </p>
    </div>
  );
}
