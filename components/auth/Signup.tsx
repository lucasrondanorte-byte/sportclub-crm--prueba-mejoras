import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { LogoIcon } from '../common/LogoIcon';
import { BRANCHES } from '../../constants';
import { Branch } from '../../types';

const Spinner = () => <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>;

interface SignupProps {
    onSwitchToLogin: () => void;
}

const Signup: React.FC<SignupProps> = ({ onSwitchToLogin }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [branch, setBranch] = useState<Branch | ''>('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const { signup } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!name || !email || !password || !branch) {
      setError('Todos los campos son obligatorios.');
      return;
    }
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }
    setLoading(true);

    const result = await signup(name, email, password, branch);
    
    if (result.success) {
        setSuccess(result.message);
        // Clear form
        setName('');
        setEmail('');
        setPassword('');
        setBranch('');
        setTimeout(() => {
            onSwitchToLogin();
        }, 2000);
    } else {
        setError(result.message);
    }
    
    setLoading(false);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-brand-bg">
    <div className="w-full max-w-md p-8 space-y-8 bg-brand-surface rounded-2xl shadow-lg border border-brand-border">
        <div className="text-center">
            <LogoIcon className="w-48 mx-auto" />
            <h2 className="mt-4 text-3xl font-bold tracking-tight text-brand-text-primary">
                Crear Cuenta
            </h2>
            <p className="mt-2 text-sm text-brand-text-secondary">
                Regístrate para obtener acceso como Visor.
            </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
        <div className="relative -space-y-px rounded-md shadow-sm">
             <div>
                <label htmlFor="name" className="sr-only">Nombre Completo</label>
                <input
                id="name"
                name="name"
                type="text"
                autoComplete="name"
                required
                className="relative block w-full px-3 py-3 bg-gray-900 text-brand-text-primary placeholder-brand-text-muted/70 border border-brand-border rounded-t-md appearance-none focus:z-10 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-brand-primary sm:text-sm"
                placeholder="Nombre Completo"
                value={name}
                onChange={(e) => setName(e.target.value)}
                />
            </div>
             <div>
                <label htmlFor="email-signup" className="sr-only">Email</label>
                <input
                id="email-signup"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="relative block w-full px-3 py-3 bg-gray-900 text-brand-text-primary placeholder-brand-text-muted/70 border border-brand-border appearance-none focus:z-10 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-brand-primary sm:text-sm"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                />
            </div>
             <div>
                <label htmlFor="password-signup" className="sr-only">Contraseña</label>
                <input
                id="password-signup"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                className="relative block w-full px-3 py-3 bg-gray-900 text-brand-text-primary placeholder-brand-text-muted/70 border border-brand-border appearance-none focus:z-10 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-brand-primary sm:text-sm"
                placeholder="Contraseña (mín. 6 caracteres)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                />
            </div>
            <div>
                <label htmlFor="branch-signup" className="sr-only">Sucursal</label>
                <select
                id="branch-signup"
                name="branch"
                required
                className="relative block w-full px-3 py-3 bg-gray-900 text-brand-text-primary placeholder-brand-text-muted/70 border border-brand-border rounded-b-md appearance-none focus:z-10 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-brand-primary sm:text-sm"
                value={branch}
                onChange={(e) => setBranch(e.target.value as Branch)}
                >
                    <option value="" disabled>Selecciona tu Sucursal</option>
                    {BRANCHES.map(b => <option key={b} value={b}>{b}</option>)}
                </select>
            </div>
        </div>
       
        {error && <p className="text-sm text-red-600">{error}</p>}
        {success && <p className="text-sm text-green-600">{success}</p>}
        <div>
            <button
            type="submit"
            disabled={loading}
            className="relative flex justify-center w-full px-4 py-3 text-sm font-semibold text-white border border-transparent rounded-md group bg-brand-primary hover:bg-brand-primary-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary transition-colors disabled:opacity-50"
            >
            {loading ? <Spinner /> : 'REGISTRARSE'}
            </button>
        </div>
        </form>

         <div className="text-center text-sm">
            <p className="text-brand-text-secondary">
                ¿Ya tienes una cuenta?{' '}
                <button onClick={onSwitchToLogin} className="font-medium text-brand-primary hover:text-brand-primary-hover">
                    Inicia Sesión
                </button>
            </p>
        </div>

    </div>
    </div>
  );
};

export default Signup;