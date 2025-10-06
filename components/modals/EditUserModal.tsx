import React, { useState, useEffect, useMemo } from 'react';
import { User, Role, Branch } from '../../types';
import { api } from '../../services/api';
import { USER_ROLES, BRANCHES } from '../../constants';
import { useAuth } from '../../hooks/useAuth';

interface EditUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (updatedUser: User) => void;
  user: User | null;
}

type FormErrors = {
    name?: string;
}

const EditUserModal: React.FC<EditUserModalProps> = ({ isOpen, onClose, onSuccess, user }) => {
  const [formData, setFormData] = useState<User | null>(null);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user: currentUser } = useAuth();

  useEffect(() => {
    if (user) {
      setFormData({ ...user });
    }
    // Reset errors on open/close
    if(!isOpen) {
        setErrors({});
    }
  }, [user, isOpen]);
  
  const availableRoles = useMemo(() => {
    if (currentUser?.role === Role.Manager) {
      return USER_ROLES.filter(r => r !== Role.Admin);
    }
    return USER_ROLES;
  }, [currentUser]);

  const validateForm = (): boolean => {
    if (!formData) return false;
    const newErrors: FormErrors = {};
    if (!formData.name.trim()) newErrors.name = 'El nombre es obligatorio.';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (formData) {
      setFormData(prev => ({ ...prev!, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData || !validateForm()) return;

    setIsSubmitting(true);
    try {
        const updatedUser = await api.updateUser(formData);
        onSuccess(updatedUser);
        onClose(); // Close on success
    } catch (error) {
      console.error("Failed to update user", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen || !formData) return null;

  const isAdmin = currentUser?.role === Role.Admin;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60" aria-modal="true" role="dialog">
      <div className="bg-brand-surface border border-brand-border rounded-lg shadow-xl w-full max-w-md m-4">
        <form onSubmit={handleSubmit}>
            <div className="p-6 border-b border-brand-border">
                <h2 className="text-2xl font-bold text-brand-text-primary">Editar Usuario</h2>
            </div>

            <div className="p-6 space-y-4">
                <div>
                    <label htmlFor="name" className="block text-sm font-medium text-brand-text-secondary">Nombre Completo</label>
                    <input type="text" name="name" id="name" value={formData.name} onChange={handleChange} className={`mt-1 block w-full bg-brand-bg border rounded-md shadow-sm p-2 text-brand-text-primary focus:ring-brand-primary focus:border-brand-primary ${errors.name ? 'border-red-500' : 'border-brand-border'}`} />
                    {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
                </div>
                <div>
                    <label htmlFor="email" className="block text-sm font-medium text-brand-text-secondary">Email</label>
                    <input type="email" name="email" id="email" value={formData.email} disabled className="mt-1 block w-full border border-brand-border rounded-md shadow-sm p-2 bg-brand-bg/50 cursor-not-allowed text-brand-text-muted" />
                </div>
                 <div>
                    <label htmlFor="branch" className="block text-sm font-medium text-brand-text-secondary">Sucursal</label>
                    <select name="branch" id="branch" value={formData.branch} onChange={handleChange} disabled={!isAdmin} className="mt-1 block w-full bg-brand-bg border border-brand-border rounded-md shadow-sm p-2 text-brand-text-primary focus:ring-brand-primary focus:border-brand-primary disabled:bg-brand-bg/50 disabled:cursor-not-allowed">
                        {BRANCHES.map(b => <option key={b} value={b}>{b}</option>)}
                    </select>
                </div>
                <div>
                    <label htmlFor="role" className="block text-sm font-medium text-brand-text-secondary">Rol</label>
                    <select name="role" id="role" value={formData.role} onChange={handleChange} className="mt-1 block w-full bg-brand-bg border border-brand-border rounded-md shadow-sm p-2 capitalize text-brand-text-primary focus:ring-brand-primary focus:border-brand-primary">
                        {availableRoles.map(r => <option key={r} value={r} className="capitalize">{r}</option>)}
                    </select>
                </div>
            </div>

            <div className="px-6 py-4 bg-black/20 border-t border-brand-border flex justify-end gap-3">
                <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-brand-text-primary bg-brand-border border border-transparent rounded-md shadow-sm hover:bg-gray-600">
                    Cancelar
                </button>
                <button type="submit" disabled={isSubmitting} className="px-4 py-2 text-sm font-medium text-white bg-brand-primary border border-transparent rounded-md shadow-sm hover:bg-brand-primary-hover disabled:opacity-50">
                    {isSubmitting ? 'Guardando...' : 'Guardar Cambios'}
                </button>
            </div>
        </form>
      </div>
    </div>
  );
};

export default EditUserModal;