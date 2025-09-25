import React, { useState, useEffect, useMemo } from 'react';
import { Prospect, User, Role, ProspectStage, TaskType, Interaction, ProspectInterest, MemberStatus } from '../../types';
import { useAuth } from '../../hooks/useAuth';
import { api } from '../../services/api';
import { PROSPECT_SOURCES, PROSPECT_INTERESTS, PROSPECT_STAGES, TASK_TYPES } from '../../constants';

interface EditProspectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (updatedProspect: Prospect) => void;
  users: User[];
  prospect: Prospect | null;
}

type FormErrors = {
    [key in keyof Omit<Prospect, 'id' | 'createdAt' | 'updatedAt' | 'nextActionDate' | 'createdBy' | 'updatedBy'>]?: string;
}

const NoteIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" /><path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" /></svg>;
const CallIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" /></svg>;
const EmailIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" /><path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" /></svg>;
const WhatsAppIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.834 8.834 0 01-4.195-1.125l-2.665.89c-.337.112-.718-.268-.606-.605l.89-2.665A8.834 8.834 0 012 10C2 6.134 5.582 3 10 3s8 3.134 8 7zM7 9a1 1 0 100-2 1 1 0 000 2zm4 0a1 1 0 100-2 1 1 0 000 2zm4 0a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" /></svg>;
const VisitIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" /></svg>;

// FIX: Changed `JSX.Element` to `React.ReactElement` to resolve issue where JSX namespace was not found.
const interactionIcons: { [key in TaskType]: React.ReactElement } = {
    [TaskType.Note]: <NoteIcon />,
    [TaskType.Call]: <CallIcon />,
    [TaskType.Email]: <EmailIcon />,
    [TaskType.WhatsApp]: <WhatsAppIcon />,
    [TaskType.Visit]: <VisitIcon />,
};

type PlanDetails = { fee: number; durationMonths: number };

// In a real-world app, this configuration would likely come from a backend API
// to allow for dynamic pricing and plan management.
const PLAN_CONFIG: Record<ProspectInterest, PlanDetails> = {
    // FIX: Add missing ProspectInterest.NotReported to satisfy the Record type.
    [ProspectInterest.NotReported]: { fee: 0, durationMonths: 0 },
    [ProspectInterest.Flex]: { fee: 7000, durationMonths: 1 },
    [ProspectInterest.FlexAnual1Pago]: { fee: 70000, durationMonths: 12 },
    [ProspectInterest.FlexUsoPlus]: { fee: 8500, durationMonths: 1 },
    [ProspectInterest.FlexUsoTotal]: { fee: 10000, durationMonths: 1 },
    [ProspectInterest.Plus]: { fee: 8500, durationMonths: 1 },
    [ProspectInterest.PlusAnual1Pago]: { fee: 84000, durationMonths: 12 },
    [ProspectInterest.PlusAnual3Cuotas]: { fee: 92400, durationMonths: 12 },
    [ProspectInterest.PlusAnual6Cuotas]: { fee: 92400, durationMonths: 12 },
    [ProspectInterest.Total]: { fee: 10000, durationMonths: 1 },
    [ProspectInterest.TotalAnual1Pago]: { fee: 98000, durationMonths: 12 },
    [ProspectInterest.TotalAnual3Cuotas]: { fee: 107800, durationMonths: 12 },
    [ProspectInterest.TotalAnual6Cuotas]: { fee: 107800, durationMonths: 12 },
    [ProspectInterest.TotalSemestral1Pago]: { fee: 54000, durationMonths: 6 },
    [ProspectInterest.TotalSemestral6Cuotas]: { fee: 59400, durationMonths: 6 },
    [ProspectInterest.Local]: { fee: 7000, durationMonths: 1 },
    [ProspectInterest.LocalTrimestral1Pago]: { fee: 20000, durationMonths: 3 },
    [ProspectInterest.LocalSemestral1Pago]: { fee: 39000, durationMonths: 6 },
    [ProspectInterest.LocalSemestral6Cuotas]: { fee: 42900, durationMonths: 6 },
    [ProspectInterest.LocalAnnual1Pago]: { fee: 70000, durationMonths: 12 },
    [ProspectInterest.LocalAnnual3Cuotas]: { fee: 77000, durationMonths: 12 },
    [ProspectInterest.LocalAnnual6Cuotas]: { fee: 77000, durationMonths: 12 },
    [ProspectInterest.ACAPlus]: { fee: 8500, durationMonths: 1 }, // Assuming ACA plans are monthly
    [ProspectInterest.ACATOTAL]: { fee: 10000, durationMonths: 1 },
};

const getPlanDetails = (planName: ProspectInterest): PlanDetails => {
    return PLAN_CONFIG[planName] || { fee: 7000, durationMonths: 1 }; // Fallback to a basic plan
};

// FIX: Replaced default export with named export and completed the component implementation.
export const EditProspectModal: React.FC<EditProspectModalProps> = ({ isOpen, onClose, onSuccess, users, prospect }) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState<Prospect | null>(null);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [interactions, setInteractions] = useState<Interaction[]>([]);
  const [newInteraction, setNewInteraction] = useState({ type: TaskType.Note, summary: '' });
  const [isAddingInteraction, setIsAddingInteraction] = useState(false);
  
  const isSeller = user?.role === Role.Seller;

  useEffect(() => {
    if (prospect) {
      setFormData({ ...prospect });
      api.getInteractionsByProspectId(prospect.id).then(prospectInteractions => {
        setInteractions(
          prospectInteractions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        );
      });
    } else {
        setFormData(null);
        setInteractions([]);
    }
  }, [prospect, isOpen]);

  const userMap = useMemo(() => new Map(users.map(u => [u.id, u.name])), [users]);
  
  const sellers = useMemo(() => {
    if (user?.role === Role.Admin) return users.filter(u => u.role === Role.Seller || u.role === Role.Manager);
    if (user) return users.filter(u => u.branch === user.branch && (u.role === Role.Seller || u.role === Role.Manager));
    return [];
  }, [users, user]);

  const validateForm = (): boolean => {
    if (!formData) return false;
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
    if (!formData) return;
    const { name, value } = e.target;
    setFormData(prev => prev ? ({ ...prev, [name]: value }) : null);
  };

  const handleUpdate = async () => {
    if (!formData || !validateForm()) return;
    setIsSubmitting(true);
    try {
        const dataToUpdate = {
            ...formData,
            updatedBy: user!.id,
            nextActionDate: formData.nextActionDate ? new Date(formData.nextActionDate).toISOString() : null
        };
        const updatedProspect = await api.updateProspect(dataToUpdate);
        onSuccess(updatedProspect);
    } catch(err) {
        console.error("Failed to update prospect", err);
    } finally {
        setIsSubmitting(false);
    }
  };

  const handleAddInteraction = async () => {
      if (!newInteraction.summary.trim() || !prospect || !user) return;
      setIsAddingInteraction(true);
      try {
          const addedInteraction = await api.addInteraction({
              relatedTo: prospect.id,
              doneBy: user.id,
              type: newInteraction.type,
              summary: newInteraction.summary,
              result: '' // Result can be added later
          });
          setInteractions(prev => [addedInteraction, ...prev]);
          setNewInteraction({ type: TaskType.Note, summary: '' });
      } catch (err) {
          console.error("Failed to add interaction", err);
      } finally {
          setIsAddingInteraction(false);
      }
  };

  const handleConvertToMember = async () => {
      if (!formData || !user) return;
      setIsSubmitting(true);
      try {
          const planDetails = getPlanDetails(formData.interest);
          const startDate = new Date();
          const endDate = new Date();
          endDate.setMonth(endDate.getMonth() + planDetails.durationMonths);
          
          await api.addMember({
              name: formData.name,
              plan: formData.interest,
              fee: planDetails.fee,
              status: MemberStatus.Active,
              startDate: startDate.toISOString(),
              endDate: endDate.toISOString(),
              originalSeller: formData.assignedTo,
              dni: formData.dni,
              address: formData.address,
              notes: `Convertido desde prospecto. Notas originales: ${formData.notes}`,
          });
          
          const updatedProspect = await api.updateProspect({ ...formData, stage: ProspectStage.Won, updatedBy: user.id });
          onSuccess(updatedProspect);
          onClose();

      } catch (err) {
          console.error("Failed to convert prospect to member", err);
      } finally {
          setIsSubmitting(false);
      }
  };

  if (!isOpen || !formData) return null;
  
  const canManage = user?.role === Role.Admin || user?.role === Role.Manager;
  const canBeConverted = ![ProspectStage.Won, ProspectStage.Lost].includes(formData.stage);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60" aria-modal="true" role="dialog">
      <div className="bg-brand-surface border border-brand-border rounded-lg shadow-xl w-full max-w-5xl max-h-[90vh] flex flex-col m-4">
          <div className="p-5 border-b border-brand-border flex justify-between items-center">
              <h2 className="text-2xl font-bold text-brand-text-primary">Editar Prospecto: <span className="text-brand-primary">{formData.name}</span></h2>
              <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-3xl font-bold">&times;</button>
          </div>
          <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 overflow-hidden">
              {/* Left Column: Details Form */}
              <div className="p-6 overflow-y-auto space-y-4 border-r border-brand-border">
                  <h3 className="text-lg font-semibold text-brand-text-primary border-b border-brand-border pb-2">Detalles</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                       <div>
                          <label htmlFor="name" className="block text-sm font-medium text-brand-text-secondary">Nombre</label>
                          <input type="text" name="name" id="name" value={formData.name} onChange={handleChange} className={`mt-1 block w-full bg-brand-bg border rounded-md shadow-sm p-2 text-brand-text-primary focus:ring-brand-primary focus:border-brand-primary ${errors.name ? 'border-red-500' : 'border-brand-border'}`} />
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
                          <label htmlFor="stage" className="block text-sm font-medium text-brand-text-secondary">Etapa</label>
                          <select name="stage" id="stage" value={formData.stage} onChange={handleChange} className="mt-1 block w-full bg-brand-bg border border-brand-border rounded-md shadow-sm p-2 text-brand-text-primary focus:ring-brand-primary focus:border-brand-primary">
                              {PROSPECT_STAGES.map(s => <option key={s} value={s}>{s}</option>)}
                          </select>
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
                          <input type="date" name="nextActionDate" id="nextActionDate" value={formData.nextActionDate?.split('T')[0] || ''} onChange={handleChange} className="mt-1 block w-full bg-brand-bg border border-brand-border rounded-md shadow-sm p-2 text-brand-text-primary focus:ring-brand-primary focus:border-brand-primary" />
                      </div>
                       <div className="md:col-span-2">
                          <label htmlFor="assignedTo" className="block text-sm font-medium text-brand-text-secondary">Vendedor Asignado</label>
                          <select name="assignedTo" id="assignedTo" value={formData.assignedTo} onChange={handleChange} disabled={!canManage} className={`mt-1 block w-full bg-brand-bg border rounded-md shadow-sm p-2 text-brand-text-primary focus:ring-brand-primary focus:border-brand-primary disabled:bg-gray-700 ${errors.assignedTo ? 'border-red-500' : 'border-brand-border'}`}>
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
                          <textarea name="notes" id="notes" value={formData.notes} onChange={handleChange} rows={2} className="mt-1 block w-full bg-brand-bg border border-brand-border rounded-md shadow-sm p-2 text-brand-text-primary focus:ring-brand-primary focus:border-brand-primary"></textarea>
                      </div>
                  </div>
              </div>

              {/* Right Column: Interactions */}
              <div className="p-6 overflow-y-auto flex flex-col">
                  <h3 className="text-lg font-semibold text-brand-text-primary border-b border-brand-border pb-2 mb-4">Interacciones</h3>
                  {/* Add Interaction Form */}
                  <div className="bg-brand-bg/50 p-4 border border-brand-border rounded-lg mb-4">
                      <div className="grid grid-cols-4 gap-2 mb-2">
                         {TASK_TYPES.map(type => (
                             <button key={type} type="button" onClick={() => setNewInteraction(prev => ({...prev, type}))} className={`p-2 rounded-md flex items-center justify-center gap-2 text-sm transition-colors capitalize ${newInteraction.type === type ? 'bg-brand-primary text-white' : 'bg-brand-border hover:bg-gray-600'}`}>
                                 {interactionIcons[type]} {type}
                             </button>
                         ))}
                      </div>
                      <textarea value={newInteraction.summary} onChange={(e) => setNewInteraction(prev => ({...prev, summary: e.target.value}))} placeholder="Escribe un resumen de la interacción..." rows={3} className="w-full bg-brand-bg border border-brand-border rounded-md p-2 text-sm text-brand-text-primary focus:ring-brand-primary focus:border-brand-primary"></textarea>
                      <button onClick={handleAddInteraction} disabled={isAddingInteraction} className="w-full mt-2 px-4 py-2 text-sm font-medium text-white bg-brand-primary rounded-md hover:bg-brand-primary-hover disabled:opacity-50">
                          {isAddingInteraction ? 'Agregando...' : 'Agregar Interacción'}
                      </button>
                  </div>

                  {/* Interactions List */}
                  <div className="flex-1 space-y-3 overflow-y-auto pr-2">
                      {interactions.map(int => (
                          <div key={int.id} className="flex gap-3">
                              <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-gray-700 text-brand-primary`}>{interactionIcons[int.type]}</div>
                              <div>
                                  <p className="text-sm text-brand-text-primary">{int.summary}</p>
                                  <p className="text-xs text-brand-text-muted">
                                      {new Date(int.date).toLocaleString('es-AR', {
                                          year: 'numeric',
                                          month: '2-digit',
                                          day: '2-digit',
                                          hour: '2-digit',
                                          minute: '2-digit',
                                      })} por <span className="font-semibold">{userMap.get(int.doneBy) || 'N/A'}</span>
                                  </p>
                              </div>
                          </div>
                      ))}
                       {interactions.length === 0 && <p className="text-center text-sm text-brand-text-muted py-8">No hay interacciones registradas.</p>}
                  </div>
              </div>
          </div>

          <div className="px-6 py-4 bg-black/20 border-t border-brand-border flex justify-between items-center">
              <div>
                  {canBeConverted && (
                      <button type="button" onClick={handleConvertToMember} disabled={isSubmitting} className="px-4 py-2 text-sm font-medium text-black bg-brand-accent border border-transparent rounded-md shadow-sm hover:bg-brand-accent-hover disabled:opacity-50">
                          {isSubmitting ? 'Convirtiendo...' : 'Convertir a Socio'}
                      </button>
                  )}
              </div>
              <div className="flex gap-3">
                  <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-brand-text-primary bg-brand-border border border-transparent rounded-md shadow-sm hover:bg-gray-600">
                      Cancelar
                  </button>
                  <button type="button" onClick={handleUpdate} disabled={isSubmitting} className="px-4 py-2 text-sm font-medium text-white bg-brand-primary border border-transparent rounded-md shadow-sm hover:bg-brand-primary-hover disabled:opacity-50">
                      {isSubmitting ? 'Guardando...' : 'Guardar Cambios'}
                  </button>
              </div>
          </div>
      </div>
    </div>
  );
};
