import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Sparkles, Leaf, Wheat, Beef, Shield, WifiOff, Recycle, User as UserIcon, Lock, Loader2, AlertCircle, ArrowRight } from 'lucide-react';

export function LoginPage() {
  const { signIn, signUp } = useAuth();
  const [isSignUp, setIsSignUp] = useState(true);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const result = isSignUp
      ? signUp(firstName, lastName, password)
      : signIn(firstName, lastName, password);

    if (result.error) {
      setError(result.error);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-grove-800 via-grove-900 to-earth-900 text-white">
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-20 left-10 h-32 w-32 rounded-full bg-grove-400 blur-3xl" />
        <div className="absolute bottom-20 right-10 h-40 w-40 rounded-full bg-harvest-400 blur-3xl" />
        <div className="absolute top-1/2 right-1/4 h-24 w-24 rounded-full bg-sky-400 blur-3xl" />
      </div>

      <div className="relative flex-1 flex flex-col items-center justify-center px-6 py-8">
        {/* Logo */}
        <div className="mb-6 flex items-center gap-3 animate-slide-up">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15 backdrop-blur ring-1 ring-white/20">
            <svg viewBox="0 0 64 64" className="h-9 w-9 text-grove-300" fill="currentColor">
              <path d="M32 14c-7 8-7 18 0 26 7-8 7-18 0-26z" opacity="0.8" />
              <path d="M32 14c-4 5-5 11-5 16 0 4 1 7 5 10 4-3 5-6 5-10 0-5-1-11-5-16z" opacity="0.6" />
              <path d="M20 40c2-2 5-2 7 0s5 2 7 0 5-2 7 0c1 1 1 3 0 4-2 2-5 2-7 0s-5-2-7 0-5 2-7 0c-1-1-1-3 0-4z" />
              <circle cx="32" cy="46" r="3" />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-bold">AgroSinergia</h1>
            <p className="text-grove-300 font-semibold tracking-wide">360</p>
          </div>
        </div>

        {/* Tagline */}
        <div className="text-center mb-6 animate-slide-up" style={{ animationDelay: '80ms' }}>
          <h2 className="font-serif text-xl sm:text-2xl font-bold text-balance max-w-md">
            Agricultura de precision y economia circular
          </h2>
          <p className="mt-2 text-sm text-grove-200 max-w-sm">
            Gestiona cafe, arroz y ganaderia desde un solo lugar. Con asistente IA integrado.
          </p>
        </div>

        {/* Feature cards */}
        <div className="grid grid-cols-3 gap-3 mb-6 max-w-md w-full animate-slide-up" style={{ animationDelay: '160ms' }}>
          <FeatureCard icon={<Leaf className="h-5 w-5" />} label="Cafe" desc="Diagnostico IA" color="text-harvest-300" />
          <FeatureCard icon={<Wheat className="h-5 w-5" />} label="Arroz" desc="SIPAS + Riego" color="text-sky-300" />
          <FeatureCard icon={<Beef className="h-5 w-5" />} label="Ganado" desc="Trazabilidad" color="text-clay-300" />
        </div>

        {/* Benefits */}
        <div className="flex flex-wrap gap-3 justify-center mb-6 max-w-md animate-fade-in" style={{ animationDelay: '240ms' }}>
          <Benefit icon={<WifiOff className="h-3.5 w-3.5" />} text="Funciona sin internet" />
          <Benefit icon={<Shield className="h-3.5 w-3.5" />} text="Datos privados" />
          <Benefit icon={<Recycle className="h-3.5 w-3.5" />} text="Economia circular" />
          <Benefit icon={<Sparkles className="h-3.5 w-3.5" />} text="Asistente IA" />
        </div>

        {/* Error */}
        {error && (
          <div className="w-full max-w-sm mb-4 rounded-xl bg-clay-500/20 border border-clay-400/30 px-4 py-3 flex items-start gap-2 animate-slide-down">
            <AlertCircle className="h-4 w-4 text-clay-300 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-clay-100">{error}</p>
          </div>
        )}

        {/* Auth form */}
        <div className="w-full max-w-sm animate-slide-up" style={{ animationDelay: '320ms' }}>
          <div className="rounded-2xl bg-white/10 backdrop-blur ring-1 ring-white/15 p-5 space-y-3">
            <div className="text-center mb-2">
              <h3 className="text-lg font-bold">{isSignUp ? 'Crear cuenta' : 'Iniciar sesion'}</h3>
              <p className="text-xs text-grove-300 mt-0.5">
                {isSignUp ? 'Registra tus datos para empezar' : 'Accede con tu nombre y contrasena'}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="relative">
                  <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-grove-300" />
                  <input
                    type="text"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Nombre"
                    className="w-full rounded-xl bg-white/10 border border-white/20 text-white placeholder:text-grove-300 px-9 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-grove-400"
                  />
                </div>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Apellidos"
                    className="w-full rounded-xl bg-white/10 border border-white/20 text-white placeholder:text-grove-300 px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-grove-400"
                  />
                </div>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-grove-300" />
                <input
                  type="password"
                  required
                  minLength={4}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Contrasena (minimo 4 caracteres)"
                  className="w-full rounded-xl bg-white/10 border border-white/20 text-white placeholder:text-grove-300 px-10 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-grove-400"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 rounded-2xl bg-white text-earth-900 font-semibold px-6 py-3.5 shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all active:scale-[0.98] disabled:opacity-60"
              >
                {loading && <Loader2 className="h-5 w-5 animate-spin" />}
                {loading ? 'Procesando...' : isSignUp ? 'Registrarme' : 'Entrar'}
              </button>
            </form>

            <div className="text-center pt-1">
              <button
                type="button"
                onClick={() => { setIsSignUp(!isSignUp); setError(null); }}
                className="text-xs text-grove-300 hover:text-white transition-colors"
              >
                {isSignUp ? 'Ya tienes cuenta? Inicia sesion' : 'No tienes cuenta? Registrate'}
              </button>
            </div>
          </div>

          <p className="mt-3 text-center text-xs text-grove-400">
            Tus datos se guardan en este dispositivo. No se comparten con nadie.
          </p>
        </div>
      </div>

      <footer className="relative text-center pb-6 text-xs text-grove-400">
        <p>AgroSinergia 360 — Plataforma open-source · Gratis · PWA</p>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, label, desc, color }: { icon: React.ReactNode; label: string; desc: string; color: string }) {
  return (
    <div className="rounded-2xl bg-white/10 backdrop-blur p-3 text-center ring-1 ring-white/10">
      <div className={`mx-auto mb-1.5 flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 ${color}`}>
        {icon}
      </div>
      <p className="text-sm font-bold">{label}</p>
      <p className="text-[10px] text-grove-200">{desc}</p>
    </div>
  );
}

function Benefit({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex items-center gap-1.5 rounded-full bg-white/10 backdrop-blur px-3 py-1.5 text-xs font-medium text-grove-100 ring-1 ring-white/10">
      {icon}
      {text}
    </div>
  );
}
