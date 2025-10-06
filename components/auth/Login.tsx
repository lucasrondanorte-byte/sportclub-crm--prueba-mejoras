import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import PrivacyPolicyModal from '../modals/PrivacyPolicyModal';
import { LogoIcon } from '../common/LogoIcon';

const Spinner = () => <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>;

interface LoginProps {
    onSwitchToSignup: () => void;
}

const Login: React.FC<LoginProps> = ({ onSwitchToSignup }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isPrivacyModalOpen, setPrivacyModalOpen] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email || !password) {
      setError('Por favor, ingrese email y contraseña.');
      return;
    }
    setLoading(true);
    
    const success = await login(email, password);
    if (!success) {
      // Add a slight delay on error to prevent brute-force timing attacks
      setTimeout(() => {
        setError('Email o contraseña incorrectos.');
        setLoading(false);
      }, 500);
    }
    // On success, the App component will handle the re-render, so we don't need to setLoading(false) here.
  };

  return (
    <>
        <div className="flex items-center justify-center min-h-screen bg-brand-bg">
        <div className="w-full max-w-md p-8 space-y-8 bg-brand-surface rounded-2xl shadow-lg border border-brand-border">
            <div className="text-center">
                <LogoIcon className="w-48 mx-auto" />
                <h2 className="mt-4 text-3xl font-bold tracking-tight text-brand-text-primary">
                    CRM
                </h2>
                <p className="mt-2 text-sm text-brand-text-secondary">
                    Bienvenido de nuevo. Inicia sesión para continuar.
                </p>
            </div>
            <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div className="relative -space-y-px rounded-md shadow-sm">
                 <div>
                    <label htmlFor="email" className="sr-only">Email</label>
                    <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    className="relative block w-full px-3 py-3 bg-gray-900 text-brand-text-primary placeholder-brand-text-muted/70 border border-brand-border rounded-t-md appearance-none focus:z-10 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-brand-primary sm:text-sm"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    />
                </div>
                 <div>
                    <label htmlFor="password"className="sr-only">Contraseña</label>
                    <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    required
                    className="relative block w-full px-3 py-3 bg-gray-900 text-brand-text-primary placeholder-brand-text-muted/70 border border-brand-border rounded-b-md appearance-none focus:z-10 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-brand-primary sm:text-sm"
                    placeholder="Contraseña"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    />
                </div>
            </div>
           
            {error && <p className="text-sm text-red-500">{error}</p>}
            <div>
                <button
                type="submit"
                disabled={loading}
                className="relative flex justify-center w-full px-4 py-3 text-sm font-semibold text-white border border-transparent rounded-md group bg-brand-primary hover:bg-brand-primary-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary transition-colors disabled:opacity-50"
                >
                {loading ? <Spinner /> : 'INICIAR SESIÓN'}
                </button>
            </div>
            </form>

            <div className="text-center text-sm">
                <p className="text-brand-text-secondary">
                    ¿No tienes una cuenta?{' '}
                    <button onClick={onSwitchToSignup} className="font-medium text-brand-primary hover:text-brand-primary-hover">
                        Regístrate
                    </button>
                </p>
            </div>

             <div className="text-center text-xs text-brand-text-muted">
                Al iniciar sesión, aceptas nuestros Términos de Servicio y 
                <button onClick={() => setPrivacyModalOpen(true)} className="font-medium text-brand-primary hover:text-brand-primary-hover ml-1">
                    Política de Privacidad
                </button>.
            </div>
        </div>
        </div>
        <PrivacyPolicyModal isOpen={isPrivacyModalOpen} onClose={() => setPrivacyModalOpen(false)} />
    </>
  );
};

export default Login;
