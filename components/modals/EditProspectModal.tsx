import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Prospect, User, Role, ProspectStage, TaskType, Interaction, ProspectInterest, Task, TaskStatus } from '../../types';
import { useAuth } from '../../hooks/useAuth';
import { api } from '../../services/api';
import { PROSPECT_SOURCES, PROSPECT_INTERESTS, PROSPECT_STAGES, TASK_TYPES } from '../../constants';
import { toInputDateString, formatDateTime } from '../../utils/dateFormatter';

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

const WhatsAppButtonIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.834 8.834 0 01-4.195-1.125l-2.665.89c-.337.112-.718-.268-.606-.605l.89-2.665A8.834 8.834 0 012 10C2 6.134 5.582 3 10 3s8 3.134 8 7zM7 9a1 1 0 100-2 1 1 0 000 2zm4 0a1 1 0 100-2 1 1 0 000 2zm4 0a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" /></svg>;

const activityIcons: { [key in TaskType]: React.ReactElement } = {
    [TaskType.Note]: <NoteIcon />,
    [TaskType.Call]: <CallIcon />,
    [TaskType.Email]: <EmailIcon />,
    [TaskType.WhatsApp]: <WhatsAppIcon />,
    [TaskType.Visit]: <VisitIcon />,
};

type PlanDetails = { fee: number; durationMonths: number };

const PLAN_CONFIG: Record<ProspectInterest, PlanDetails> = {
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
    [ProspectInterest.ACAPlus]: { fee: 8500, durationMonths: 1 },
    [ProspectInterest.ACATOTAL]: { fee: 10000, durationMonths: 1 },
};

const getPlanDetails = (planName: ProspectInterest): PlanDetails => {
    return PLAN_CONFIG[planName] || { fee: 7000, durationMonths: 1 };
};

type Activity = {
  id: string;
  date: string;
  type: TaskType;
  text: string;
  userName: string;
  isTask: boolean;
  status?: TaskStatus;
  result?: string | null;
};

export const EditProspectModal: React.FC<EditProspectModalProps> = ({ isOpen, onClose, onSuccess, users, prospect }) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState<Prospect | null>(null);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [interactions, setInteractions] = useState<Interaction[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newInteraction, setNewInteraction] = useState({ type: TaskType.Note, text: '' });
  const [isAddingInteraction, setIsAddingInteraction] = useState(false);
  const [completingTask, setCompletingTask] = useState<Task | null>(null);
  const [taskResult, setTaskResult] = useState('');
  const firstInputRef = useRef<HTMLInputElement>(null);
  
  const userMap = useMemo(() => new Map(users.map(u => [u.id, u.name])), [users]);

  useEffect(() => {
    // Para qué sirve: Mejora la accesibilidad y la experiencia de usuario.
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      setTimeout(() => firstInputRef.current?.focus(), 100);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);


  const fetchDataForProspect = useCallback(async (prospectId: string) => {
    const [prospectInteractions, allTasks] = await Promise.all([
      api.getInteractionsByRelatedId(prospectId),
      api.getTasks()
    ]);
    setInteractions(prospectInteractions);
    setTasks(allTasks.filter(t => t.relatedTo === prospectId));
  }, []);

  useEffect(() => {
    if (prospect) {
      setFormData({ ...prospect });
      fetchDataForProspect(prospect.id);
    } else {
        setFormData(null);
        setInteractions([]);
        setTasks([]);
    }
  }, [prospect, isOpen, fetchDataForProspect]);
  
  const sellers = useMemo(() => {
    if (user?.role === Role.Admin) return users.filter(u => u.role === Role.Seller);
    if (user) return users.filter(u => u.branch === user.branch && u.role === Role.Seller);
    return [];
  }, [users, user]);

  const { pendingTasks, activityHistory } = useMemo(() => {
    const pending = tasks.filter(t => t.status === TaskStatus.Pending)
        .sort((a,b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime());

    const completedTasks: Activity[] = tasks.filter(t => t.status === TaskStatus.Done).map(t => ({
      id: t.id, date: t.dateTime, type: t.type, text: t.title,
      userName: userMap.get(t.assignedTo) || 'N/A', isTask: true,
      status: t.status, result: t.result,
    }));

    const interactionHistory: Activity[] = interactions.map(i => ({
      id: i.id, date: i.date, type: i.type, text: i.summary,
      userName: userMap.get(i.doneBy) || 'N/A', isTask: false,
    }));

    const history = [...completedTasks, ...interactionHistory]
        .sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    return { pendingTasks: pending, activityHistory: history };
  }, [tasks, interactions, userMap]);


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

  const handleLogInteraction = async () => {
      if (!newInteraction.text.trim() || !prospect || !user) return;
      setIsAddingInteraction(true);
      try {
          // Logged interactions are always considered "done" tasks
          const newInteractionTask: Omit<Task, 'id'> = {
            title: newInteraction.text,
            type: newInteraction.type,
            dateTime: new Date().toISOString(),
            status: TaskStatus.Done,
            relatedTo: prospect.id,
            assignedTo: user.id,
            result: 'Interacción registrada manualmente.',
          };
          await api.addTask(newInteractionTask);
          setNewInteraction({ type: TaskType.Note, text: '' });
          await fetchDataForProspect(prospect.id);
      } catch (err) {
          console.error("Failed to log interaction", err);
      } finally {
          setIsAddingInteraction(false);
      }
  };

  const handleCompleteTask = async () => {
    if (!completingTask || !user) return;
    setIsAddingInteraction(true); // Reuse loading state
    try {
        await api.updateTask({
            ...completingTask,
            status: TaskStatus.Done,
            result: taskResult || 'Completada sin resultado.'
        });
        setCompletingTask(null);
        setTaskResult('');
        await fetchDataForProspect(prospect!.id);
    } catch(err) {
        console.error("Failed to complete task", err);
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
          
          await api.addMember({
              name: formData.name,
              phone: formData.phone,
              plan: formData.interest,
              fee: planDetails.fee,
              startDate: startDate.toISOString(),
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

  // Para qué sirve: Limpiamos el número de teléfono de caracteres no numéricos
  // antes de crear el enlace de WhatsApp, para asegurar que funcione correctamente.
  const sanitizedPhone = formData.phone.replace(/\D/g, '');

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
                        <div className="flex items-center gap-2 mt-1">
                            <input type="tel" name="phone" id="phone" value={formData.phone} onChange={handleChange} className="block w-full bg-brand-bg border border-brand-border rounded-md shadow-sm p-2 text-brand-text-primary focus:ring-brand-primary focus:border-brand-primary" />
                            <a
                                href={`https://wa.me/${sanitizedPhone}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={`flex-shrink-0 p-2 rounded-md bg-green-500 hover:bg-green-600 transition-colors ${!sanitizedPhone ? 'opacity-50 cursor-not-allowed' : ''}`}
                                onClick={(e) => !sanitizedPhone && e.preventDefault()}
                                aria-label="Contactar por WhatsApp"
                                title="Contactar por WhatsApp"
                            >
                                <WhatsAppButtonIcon />
                            </a>
                        </div>
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
                          <input type="date" name="nextActionDate" id="nextActionDate" value={toInputDateString(formData.nextActionDate)} onChange={handleChange} className="mt-1 block w-full bg-brand-bg border border-brand-border rounded-md shadow-sm p-2 text-brand-text-primary focus:ring-brand-primary focus:border-brand-primary" />
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

              {/* Right Column: Activity History & Tasks */}
              <div className="p-6 overflow-y-auto flex flex-col">
                  <div className="space-y-6">
                      {/* Pending Tasks */}
                      <div>
                          <h3 className="text-lg font-semibold text-amber-300 mb-2">Tareas Pendientes</h3>
                           <div className="space-y-3">
                              {pendingTasks.length > 0 ? pendingTasks.map(task => (
                                  <div key={task.id} className="bg-brand-bg p-3 rounded-lg border border-brand-border transition-shadow hover:shadow-md">
                                      <div className="flex items-start gap-4">
                                          <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-brand-surface text-brand-accent mt-1">
                                              {activityIcons[task.type]}
                                          </div>
                                          <div className="flex-1 min-w-0">
                                              <div className="flex justify-between items-start">
                                                  <div>
                                                      <p className="font-semibold text-brand-text-primary leading-tight">{task.title}</p>
                                                      <p className="text-xs text-brand-text-muted mt-1">
                                                          Vence: {formatDateTime(task.dateTime)}
                                                      </p>
                                                  </div>
                                                  <button 
                                                      onClick={() => setCompletingTask(task)} 
                                                      className="ml-2 flex-shrink-0 px-3 py-1 text-xs font-bold text-black bg-brand-accent rounded-md hover:bg-brand-accent-hover transition-colors"
                                                  >
                                                      Completar
                                                  </button>
                                              </div>
                                              <p className="text-xs text-brand-text-muted mt-1">
                                                  Asignado a: <span className="font-medium">{userMap.get(task.assignedTo)}</span>
                                              </p>
                                          </div>
                                      </div>
                                      {completingTask?.id === task.id && (
                                          <div className="mt-3 pt-3 border-t border-brand-border">
                                              <textarea 
                                                  value={taskResult}
                                                  onChange={(e) => setTaskResult(e.target.value)}
                                                  placeholder="Añade un resultado o nota..."
                                                  rows={2}
                                                  className="w-full bg-brand-bg border border-brand-border rounded-md p-2 text-sm text-brand-text-primary focus:ring-brand-primary focus:border-brand-primary"
                                              />
                                              <div className="flex justify-end gap-2 mt-2">
                                                  <button onClick={() => setCompletingTask(null)} className="px-3 py-1 text-xs font-medium text-brand-text-secondary">Cancelar</button>
                                                  <button onClick={handleCompleteTask} disabled={isAddingInteraction} className="px-3 py-1 text-xs font-medium text-white bg-brand-primary rounded-md hover:bg-brand-primary-hover disabled:opacity-50">
                                                      {isAddingInteraction ? 'Guardando...' : 'Guardar Resultado'}
                                                  </button>
                                              </div>
                                          </div>
                                      )}
                                  </div>
                              )) : <p className="text-sm text-brand-text-muted">No hay tareas pendientes.</p>}
                          </div>
                      </div>

                      {/* Log Interaction */}
                       <div>
                           <h3 className="text-lg font-semibold text-brand-text-primary mb-2">Registrar Interacción</h3>
                           <div className="bg-brand-bg/50 p-3 border border-brand-border rounded-lg">
                                <select value={newInteraction.type} onChange={(e) => setNewInteraction(prev => ({...prev, type: e.target.value as TaskType}))} className="w-full bg-brand-bg border border-brand-border rounded-md p-2 text-sm text-brand-text-primary focus:ring-brand-primary focus:border-brand-primary capitalize mb-2">
                                  {TASK_TYPES.map(type => (
                                      <option key={type} value={type} className="capitalize">{type}</option>
                                  ))}
                                </select>
                                <textarea value={newInteraction.text} onChange={(e) => setNewInteraction(prev => ({...prev, text: e.target.value}))} placeholder="Escribe un resumen de la interacción..." rows={2} className="w-full bg-brand-bg border border-brand-border rounded-md p-2 text-sm text-brand-text-primary focus:ring-brand-primary focus:border-brand-primary"></textarea>
                                <button onClick={handleLogInteraction} disabled={isAddingInteraction} className="w-full mt-2 px-4 py-2 text-sm font-medium text-white bg-brand-primary/80 rounded-md hover:bg-brand-primary disabled:opacity-50">
                                    {isAddingInteraction ? 'Registrando...' : 'Registrar'}
                                </button>
                           </div>
                       </div>

                      {/* History */}
                      <div>
                          <h3 className="text-lg font-semibold text-brand-text-primary mb-2">Historial de Actividad</h3>
                          <div className="space-y-4 pr-2">
                              {activityHistory.map(item => (
                                  <div key={item.id} className="flex gap-3">
                                      <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-gray-700 text-brand-primary">
                                          {activityIcons[item.type]}
                                      </div>
                                      <div className="flex-1 opacity-80">
                                          <p className="text-sm text-brand-text-primary">{item.text}</p>
                                          <p className="text-xs text-brand-text-muted">
                                              {formatDateTime(item.date)} por <span className="font-semibold">{item.userName}</span>
                                          </p>
                                           {item.isTask && item.result && (
                                              <div className="text-xs text-green-300/80 mt-1 pl-2 border-l-2 border-green-500/50">
                                                  {item.result}
                                              </div>
                                          )}
                                      </div>
                                  </div>
                              ))}
                              {activityHistory.length === 0 && <p className="text-center text-sm text-brand-text-muted py-8">No hay actividades registradas.</p>}
                          </div>
                      </div>
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