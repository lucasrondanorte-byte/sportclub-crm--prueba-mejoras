import React, { useState, useEffect, useRef } from 'react';
import { Prospect, User, Role, ProspectStage, TaskType } from '../../types';
import { useAuth } from '../../hooks/useAuth';
import { api } from '../../services/api';
import { PROSPECT_SOURCES, PROSPECT_INTERESTS, PROSPECT_STAGES } from '../../constants';
import { toInputDateString } from '../../utils/dateFormatter';


interface AddProspectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newProspect: Prospect) => void;
  sellers: User[];
}

const getTomorrowDateString = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return toInputDateString(tomorrow.toISOString());
}

const initialFormData = {
  name: '',
  phone: '',
  email: '',
  source: PROSPECT_SOURCES[0],
  interest: PROSPECT_INTERESTS[0],
  stage: ProspectStage.New,
  assignedTo: '',
  dni: '',
  address: '',
  notes: '',
  nextActionDate: getTomorrowDateString(),
};

type FormErrors = {
    [key in keyof typeof initialFormData]?: string;
}

const AddProspectModal: React.FC<AddProspectModalProps> = ({ isOpen, onClose, onSuccess, sellers }) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState(initialFormData);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const firstInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Para qué sirve: Mejora la accesibilidad y la experiencia de usuario.
    // 1. Permite cerrar el modal presionando la tecla "Escape".
    // 2. Pone el foco automáticamente en el primer campo del formulario al abrirse.
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      // Usamos un pequeño delay para asegurar que el input sea visible antes de enfocarlo
      setTimeout(() => firstInputRef.current?.focus(), 100);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);


  useEffect(() => {
    if (user?.role === Role.Seller) {
      setFormData(prev => ({ ...prev, assignedTo: user.id }));
    }
    // Reset form on close
    if(!isOpen) {
        setFormData({ ...initialFormData, nextActionDate: getTomorrowDateString() });
        setErrors({});
    }
  }, [isOpen, user]);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    if (!formData.name.trim()) newErrors.name = 'El nombre es obligatorio.';
    if (!formData.email.trim()) {
        newErrors.email = 'El email es obligatorio.';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
        newErrors.email = 'El formato del email es inválido.';
    }
    if (!formData.assignedTo) newErrors.assignedTo = 'Debe asignar un vendedor.';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
        const newProspectData = {
            ...formData,
            createdBy: user!.id,
            updatedBy: user!.id,
            nextActionDate: formData.nextActionDate ? new Date(formData.nextActionDate).toISOString() : null,
        };

        const newProspect = await api.addProspect(newProspectData);
        
        // If an initial note was added, log it as the first interaction
        if (formData.notes.trim()) {
            await api.addInteraction({
                relatedTo: newProspect.id,
                doneBy: user!.id,
                type: TaskType.Note,
                summary: formData.notes,
                result: 'Nota inicial creada con el prospecto.',
            });
        }

        onSuccess(newProspect);

    } catch (error) {
      console.error("Failed to add prospect or initial interaction", error);
      // Here you could set a general form error state to show the user
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60" aria-modal="true" role="dialog">
      <div className="bg-brand-surface border border-brand-border rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto m-4">
        <form onSubmit={handleSubmit}>
            <div className="p-6 border-b border-brand-border">
                <h2 className="text-2xl font-bold text-brand-text-primary">Agregar Nuevo Prospecto</h2>
                <p className="text-sm text-brand-text-secondary">Complete los detalles a continuación.</p>
            </div>

            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                {/* Fields */}
                <div className="md:col-span-2">
                    <label htmlFor="name" className="block text-sm font-medium text-brand-text-secondary">Nombre Completo</label>
                    <input ref={firstInputRef} type="text" name="name" id="name" value={formData.name} onChange={handleChange} className={`mt-1 block w-full bg-brand-bg border rounded-md shadow-sm p-2 text-brand-text-primary focus:ring-brand-primary focus:border-brand-primary ${errors.name ? 'border-red-500' : 'border-brand-border'}`} />
                    {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
                </div>
                <div>
                    <label htmlFor="email" className="block text-sm font-medium text-brand-text-secondary">Email</label>
                    <input type="email" name="email" id="email" value={formData.email} onChange={handleChange} className={`mt-1 block w-full bg-brand-bg border rounded-md shadow-sm p-2 text-brand-text-primary focus:ring-brand-primary focus:border-brand-primary ${errors.email ? 'border-red-500' : 'border-brand-border'}`} />
                    {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
                </div>
                <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-brand-text-secondary">Teléfono</label>
                    <input type="tel" name="phone" id="phone" value={formData.phone} onChange={handleChange} className="mt-1 block w-full bg-brand-bg border border-brand-border rounded-md shadow-sm p-2 text-brand-text-primary focus:ring-brand-primary focus:border-brand-primary" />
                </div>
                <div>
                    <label htmlFor="source" className="block text-sm font-medium text-brand-text-secondary">Origen</label>
                    <select name="source" id="source" value={formData.source} onChange={handleChange} className="mt-1 block w-full bg-brand-bg border border-brand-border rounded-md shadow-sm p-2 text-brand-text-primary focus:ring-brand-primary focus:border-brand-primary">
                        {PROSPECT_SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                </div>
                <div>
                    <label htmlFor="interest" className="block text-sm font-medium text-brand-text-secondary">Interés</label>
                    <select name="interest" id="interest" value={formData.interest} onChange={handleChange} className="mt-1 block w-full bg-brand-bg border border-brand-border rounded-md shadow-sm p-2 text-brand-text-primary focus:ring-brand-primary focus:border-brand-primary">
                         {PROSPECT_INTERESTS.map(i => <option key={i} value={i}>{i}</option>)}
                    </select>
                </div>
                 <div>
                    <label htmlFor="nextActionDate" className="block text-sm font-medium text-brand-text-secondary">Próxima Acción</label>
                    <input type="date" name="nextActionDate" id="nextActionDate" value={formData.nextActionDate} onChange={handleChange} className="mt-1 block w-full bg-brand-bg border border-brand-border rounded-md shadow-sm p-2 text-brand-text-primary focus:ring-brand-primary focus:border-brand-primary" />
                </div>
                 <div>
                    <label htmlFor="stage" className="block text-sm font-medium text-brand-text-secondary">Etapa</label>
                    <select name="stage" id="stage" value={formData.stage} onChange={handleChange} className="mt-1 block w-full bg-brand-bg border border-brand-border rounded-md shadow-sm p-2 text-brand-text-primary focus:ring-brand-primary focus:border-brand-primary">
                        {PROSPECT_STAGES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                </div>
                <div className="md:col-span-2">
                    <label htmlFor="assignedTo" className="block text-sm font-medium text-brand-text-secondary">Vendedor Asignado</label>
                    <select name="assignedTo" id="assignedTo" value={formData.assignedTo} onChange={handleChange} disabled={user?.role === Role.Seller} className={`mt-1 block w-full bg-brand-bg border rounded-md shadow-sm p-2 text-brand-text-primary focus:ring-brand-primary focus:border-brand-primary ${errors.assignedTo ? 'border-red-500' : 'border-brand-border'} ${user?.role === Role.Seller ? 'bg-gray-700' : ''}`}>
                        <option value="">Seleccionar vendedor...</option>
                        {sellers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                    {errors.assignedTo && <p className="text-xs text-red-500 mt-1">{errors.assignedTo}</p>}
                </div>
                <div>
                    <label htmlFor="dni" className="block text-sm font-medium text-brand-text-secondary">DNI (Sensible)</label>
                    <input type="text" name="dni" id="dni" value={formData.dni} onChange={handleChange} className="mt-1 block w-full bg-brand-bg border border-brand-border rounded-md shadow-sm p-2 text-brand-text-primary focus:ring-brand-primary focus:border-brand-primary" />
                </div>
                 <div>
                    <label htmlFor="address" className="block text-sm font-medium text-brand-text-secondary">Dirección (Sensible)</label>
                    <input type="text" name="address" id="address" value={formData.address} onChange={handleChange} className="mt-1 block w-full bg-brand-bg border border-brand-border rounded-md shadow-sm p-2 text-brand-text-primary focus:ring-brand-primary focus:border-brand-primary" />
                </div>
                 <div className="md:col-span-2">
                    <label htmlFor="notes" className="block text-sm font-medium text-brand-text-secondary">Notas (Sensible)</label>
                    <textarea name="notes" id="notes" value={formData.notes} onChange={handleChange} rows={3} className="mt-1 block w-full bg-brand-bg border border-brand-border rounded-md shadow-sm p-2 text-brand-text-primary focus:ring-brand-primary focus:border-brand-primary"></textarea>
                </div>
            </div>

            <div className="px-6 py-4 bg-black/20 border-t border-brand-border flex justify-end gap-3">
                <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-brand-text-primary bg-brand-border border border-transparent rounded-md shadow-sm hover:bg-gray-600">
                    Cancelar
                </button>
                <button type="submit" disabled={isSubmitting} className="px-4 py-2 text-sm font-medium text-white bg-brand-primary border border-transparent rounded-md shadow-sm hover:bg-brand-primary-hover disabled:opacity-50">
                    {isSubmitting ? 'Guardando...' : 'Guardar Prospecto'}
                </button>
            </div>
        </form>
      </div>
    </div>
  );
};

export default AddProspectModal;
