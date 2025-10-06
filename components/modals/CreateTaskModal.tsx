import React, { useState, useEffect, useMemo } from 'react';
import { Task, User, Role, Prospect, Member, TaskType, TaskStatus } from '../../types';
import { useAuth } from '../../hooks/useAuth';
import { api } from '../../services/api';
import { TASK_TYPES, PROSPECT_STAGES, PROSPECT_SOURCES } from '../../constants';

interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  sellers: User[];
  prospects: Prospect[];
  members: Member[];
}

const initialFormData = {
  title: '',
  type: TaskType.Call,
  dateTime: new Date().toISOString().slice(0, 16),
  relatedTo: '', 
  assignedTo: '',
};

type FormErrors = {
    [key in keyof typeof initialFormData]?: string;
} & { massAssignment?: string };

const CreateTaskModal: React.FC<CreateTaskModalProps> = ({ isOpen, onClose, onSuccess, sellers, prospects, members }) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState(initialFormData);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // State for mass assignment
  const [assignmentMode, setAssignmentMode] = useState<'single' | 'massive'>('single');
  const [massEntityType, setMassEntityType] = useState<'prospects' | 'members'>('prospects');
  
  // Filters for prospects
  const [prospectStageFilter, setProspectStageFilter] = useState('all');
  const [prospectSourceFilter, setProspectSourceFilter] = useState('all');
  
  const [selectedRelatedIds, setSelectedRelatedIds] = useState<string[]>([]);
  
  const selectedSeller = useMemo(() => sellers.find(s => s.id === formData.assignedTo), [sellers, formData.assignedTo]);

  const filteredProspectsForModal = useMemo(() => {
    if (assignmentMode === 'massive' && massEntityType === 'prospects' && !formData.assignedTo) {
        return [];
    }

    return prospects.filter(p => {
        const sellerMatch = !formData.assignedTo || p.assignedTo === formData.assignedTo;
        if (!sellerMatch) return false;
        
        const stageMatch = prospectStageFilter === 'all' || p.stage === prospectStageFilter;
        const sourceMatch = prospectSourceFilter === 'all' || p.source === prospectSourceFilter;
        return stageMatch && sourceMatch;
    });
  }, [prospects, prospectStageFilter, prospectSourceFilter, formData.assignedTo, assignmentMode, massEntityType]);

  const filteredMembersForModal = useMemo(() => {
    if (assignmentMode !== 'massive' || massEntityType !== 'members' || !selectedSeller) {
        return [];
    }

    return members.filter(m => {
        const branchMatch = m.branch === selectedSeller.branch;
        if (!branchMatch) return false;

        return true;
    });
  }, [members, selectedSeller, assignmentMode, massEntityType]);

  const resetLocalState = () => {
      setFormData(initialFormData);
      setErrors({});
      setAssignmentMode('single');
      setMassEntityType('prospects');
      setProspectStageFilter('all');
      setProspectSourceFilter('all');
      setSelectedRelatedIds([]);
  }

  useEffect(() => {
    if (user?.role === Role.Seller) {
      setFormData(prev => ({ ...prev, assignedTo: user.id }));
    }
    if(!isOpen) {
        resetLocalState();
    }
  }, [isOpen, user]);

  useEffect(() => {
    setSelectedRelatedIds([]);
  }, [filteredProspectsForModal, filteredMembersForModal, massEntityType]);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    if (!formData.title.trim()) newErrors.title = 'El título es obligatorio.';
    if (!formData.dateTime) newErrors.dateTime = 'La fecha y hora son obligatorias.';
    if (!formData.assignedTo) newErrors.assignedTo = 'Debe asignar un vendedor.';
    
    if (assignmentMode === 'single' && !formData.relatedTo) {
      newErrors.relatedTo = 'Debe relacionar la tarea a un prospecto o socio.';
    } else if (assignmentMode === 'massive' && selectedRelatedIds.length === 0) {
      newErrors.massAssignment = `Debe seleccionar al menos un ${massEntityType === 'prospects' ? 'prospecto' : 'socio'}.`;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === 'assignedTo') {
      setSelectedRelatedIds([]);
    }
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    const targetList = massEntityType === 'prospects' ? filteredProspectsForModal : filteredMembersForModal;
    if (e.target.checked) {
        setSelectedRelatedIds(targetList.map(p => p.id));
    } else {
        setSelectedRelatedIds([]);
    }
  };

  const handleSelectOne = (e: React.ChangeEvent<HTMLInputElement>, id: string) => {
    if (e.target.checked) {
        setSelectedRelatedIds(prev => [...prev, id]);
    } else {
        setSelectedRelatedIds(prev => prev.filter(prospectId => prospectId !== id));
    }
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
        const isPast = new Date(formData.dateTime) <= new Date();
        const status = isPast ? TaskStatus.Done : TaskStatus.Pending;

        const taskData = {
            title: formData.title,
            type: formData.type,
            dateTime: new Date(formData.dateTime).toISOString(),
            assignedTo: formData.assignedTo,
            status: status,
            result: null,
        };

        if (assignmentMode === 'single') {
            await api.addTask({ ...taskData, relatedTo: formData.relatedTo });
        } else {
            const taskPromises = selectedRelatedIds.map(entityId => 
                api.addTask({ ...taskData, relatedTo: entityId })
            );
            await Promise.all(taskPromises);
        }
        
        onSuccess();

    } catch (error) {
      console.error("Failed to add task(s)", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const submitButtonText = () => {
      if (isSubmitting) return 'Creando...';
      if (assignmentMode === 'massive') {
          return `Crear ${selectedRelatedIds.length > 0 ? selectedRelatedIds.length : ''} Tarea(s)`;
      }
      return 'Crear Tarea';
  };
  
  const totalSelectable = massEntityType === 'prospects' ? filteredProspectsForModal.length : filteredMembersForModal.length;


  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60" aria-modal="true" role="dialog">
      <div className="bg-brand-surface border border-brand-border rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col m-4">
        <form onSubmit={handleSubmit} className="flex flex-col h-full">
            <div className="p-6 border-b border-brand-border">
                <h2 className="text-2xl font-bold text-brand-text-primary">Crear Nueva Tarea</h2>
                <p className="text-sm text-brand-text-secondary">Completa los detalles y a quién(es) se relaciona.</p>
            </div>

            <div className="flex-1 p-6 overflow-y-auto grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Columna Izquierda: Detalles */}
              <div className="space-y-4 flex flex-col">
                  <h3 className="text-lg font-semibold text-brand-text-primary border-b border-brand-border pb-2">Detalles de la Tarea</h3>
                  <div>
                      <label htmlFor="title" className="block text-sm font-medium text-brand-text-secondary">Título</label>
                      <input type="text" name="title" id="title" value={formData.title} onChange={handleChange} className={`mt-1 block w-full bg-brand-bg border rounded-md shadow-sm p-2 text-brand-text-primary focus:ring-brand-primary focus:border-brand-primary ${errors.title ? 'border-red-500' : 'border-brand-border'}`} />
                      {errors.title && <p className="text-xs text-red-500 mt-1">{errors.title}</p>}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="dateTime" className="block text-sm font-medium text-brand-text-secondary">Fecha y Hora</label>
                        <input type="datetime-local" name="dateTime" id="dateTime" value={formData.dateTime} onChange={handleChange} className={`mt-1 block w-full bg-brand-bg border rounded-md shadow-sm p-2 text-brand-text-primary focus:ring-brand-primary focus:border-brand-primary ${errors.dateTime ? 'border-red-500' : 'border-brand-border'}`} />
                        {errors.dateTime && <p className="text-xs text-red-500 mt-1">{errors.dateTime}</p>}
                    </div>
                     <div>
                        <label htmlFor="type" className="block text-sm font-medium text-brand-text-secondary">Tipo</label>
                        <select name="type" id="type" value={formData.type} onChange={handleChange} className="mt-1 block w-full bg-brand-bg border border-brand-border rounded-md shadow-sm p-2 text-brand-text-primary focus:ring-brand-primary focus:border-brand-primary capitalize">
                            {TASK_TYPES.map(t => <option key={t} value={t} className="capitalize">{t}</option>)}
                        </select>
                    </div>
                  </div>
                   <div>
                      <label htmlFor="assignedTo" className="block text-sm font-medium text-brand-text-secondary">Asignar a</label>
                       {user?.role === Role.Seller ? (
                            <div className="mt-1 block w-full bg-gray-700 border border-brand-border rounded-md shadow-sm p-2 text-brand-text-primary">
                                {user.name}
                            </div>
                        ) : (
                            <>
                                <select name="assignedTo" id="assignedTo" value={formData.assignedTo} onChange={handleChange} className={`mt-1 block w-full bg-brand-bg border rounded-md shadow-sm p-2 text-brand-text-primary focus:ring-brand-primary focus:border-brand-primary ${errors.assignedTo ? 'border-red-500' : 'border-brand-border'}`}>
                                    <option value="">Seleccionar vendedor...</option>
                                    {sellers.map(s => <option key={s.id} value={s.id}>{s.name} ({s.branch})</option>)}
                                </select>
                                {errors.assignedTo && <p className="text-xs text-red-500 mt-1">{errors.assignedTo}</p>}
                            </>
                        )}
                  </div>
              </div>

              {/* Columna Derecha: Asociación */}
              <div className="space-y-4 flex flex-col">
                  <h3 className="text-lg font-semibold text-brand-text-primary border-b border-brand-border pb-2">Relacionar Con</h3>
                  <div className="flex border-b border-brand-border">
                    <button type="button" onClick={() => setAssignmentMode('single')} className={`py-2 px-4 text-sm font-medium ${assignmentMode === 'single' ? 'border-b-2 border-brand-primary text-brand-primary' : 'text-brand-text-secondary hover:bg-white/5'}`}>Individual</button>
                    <button type="button" onClick={() => setAssignmentMode('massive')} className={`py-2 px-4 text-sm font-medium ${assignmentMode === 'massive' ? 'border-b-2 border-brand-primary text-brand-primary' : 'text-brand-text-secondary hover:bg-white/5'} disabled:opacity-50 disabled:cursor-not-allowed`} disabled={!formData.assignedTo}>Masiva</button>
                  </div>

                  <div className="flex-1">
                    {assignmentMode === 'single' && (
                      <div>
                          <label htmlFor="relatedTo" className="block text-sm font-medium text-brand-text-secondary sr-only">Relacionado con</label>
                          <select name="relatedTo" id="relatedTo" value={formData.relatedTo} onChange={handleChange} className={`block w-full bg-brand-bg border rounded-md shadow-sm p-2 text-brand-text-primary focus:ring-brand-primary focus:border-brand-primary ${errors.relatedTo ? 'border-red-500' : 'border-brand-border'}`}>
                              <option value="">Seleccionar Prospecto o Socio...</option>
                              <optgroup label="Prospectos">
                                  {prospects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                              </optgroup>
                               <optgroup label="Socios">
                                  {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                              </optgroup>
                          </select>
                          {errors.relatedTo && <p className="text-xs text-red-500 mt-1">{errors.relatedTo}</p>}
                      </div>
                    )}
                    {assignmentMode === 'massive' && (
                       <div className="bg-brand-bg/50 p-4 border border-brand-border rounded-lg space-y-4 h-full flex flex-col">
                           <div className="flex items-center p-1 rounded-lg bg-gray-900/50 self-start mb-2">
                                <button type="button" onClick={() => setMassEntityType('prospects')} className={`px-3 py-1 text-sm rounded-md ${massEntityType === 'prospects' ? 'bg-brand-surface shadow text-brand-primary font-semibold' : 'text-brand-text-secondary'}`}>Prospectos</button>
                                <button type="button" onClick={() => setMassEntityType('members')} className={`px-3 py-1 text-sm rounded-md ${massEntityType === 'members' ? 'bg-brand-surface shadow text-brand-primary font-semibold' : 'text-brand-text-secondary'}`}>Socios</button>
                           </div>

                           {massEntityType === 'prospects' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                  <label htmlFor="prospectStageFilter" className="block text-xs font-medium text-brand-text-secondary">Etapa</label>
                                  <select id="prospectStageFilter" value={prospectStageFilter} onChange={(e) => setProspectStageFilter(e.target.value)} className="mt-1 block w-full p-2 border border-brand-border bg-brand-bg text-brand-text-primary rounded-md shadow-sm text-sm">
                                      <option value="all">Todas</option>
                                      {PROSPECT_STAGES.map(s => <option key={s} value={s}>{s}</option>)}
                                  </select>
                              </div>
                              <div>
                                  <label htmlFor="prospectSourceFilter" className="block text-xs font-medium text-brand-text-secondary">Origen</label>
                                  <select id="prospectSourceFilter" value={prospectSourceFilter} onChange={(e) => setProspectSourceFilter(e.target.value)} className="mt-1 block w-full p-2 border border-brand-border bg-brand-bg text-brand-text-primary rounded-md shadow-sm text-sm">
                                      <option value="all">Todos</option>
                                      {PROSPECT_SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
                                  </select>
                              </div>
                           </div>
                           )}

                           <div className="border-t border-brand-border pt-4 flex-1 flex flex-col">
                              <div className="flex justify-between items-center mb-2">
                                  <label className="flex items-center text-sm font-medium text-brand-text-secondary">
                                      <input type="checkbox" className="h-4 w-4 rounded border-brand-border bg-brand-surface text-brand-primary focus:ring-brand-primary" checked={totalSelectable > 0 && selectedRelatedIds.length === totalSelectable} onChange={handleSelectAll} disabled={totalSelectable === 0} />
                                      <span className="ml-2">Seleccionar todos ({totalSelectable})</span>
                                  </label>
                                  <span className="text-sm font-semibold text-brand-primary">{selectedRelatedIds.length} seleccionados</span>
                              </div>
                               <div className="flex-1 max-h-48 overflow-y-auto border border-brand-border rounded-md bg-brand-bg p-2 space-y-1">
                                  {totalSelectable > 0 ? (
                                      (massEntityType === 'prospects' ? filteredProspectsForModal : filteredMembersForModal).map(p => (
                                      <label key={p.id} className="flex items-center p-1.5 rounded hover:bg-brand-surface cursor-pointer">
                                           <input type="checkbox" className="h-4 w-4 rounded border-brand-border bg-brand-surface text-brand-primary focus:ring-brand-primary" checked={selectedRelatedIds.includes(p.id)} onChange={(e) => handleSelectOne(e, p.id)} />
                                          <span className="ml-3 text-sm text-brand-text-primary">{p.name}</span>
                                      </label>
                                  ))
                                  ) : (
                                      <p className="text-center text-sm text-brand-text-muted py-4">No hay {massEntityType === 'prospects' ? 'prospectos' : 'socios'} que coincidan para el vendedor y sucursal seleccionados.</p>
                                  )}
                               </div>
                               {errors.massAssignment && <p className="text-xs text-red-500 mt-1">{errors.massAssignment}</p>}
                           </div>
                      </div>
                    )}
                  </div>
              </div>
            </div>

            <div className="px-6 py-4 bg-black/20 border-t border-brand-border flex justify-end gap-3 mt-auto">
                <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-brand-text-primary bg-brand-border border border-transparent rounded-md shadow-sm hover:bg-gray-600">
                    Cancelar
                </button>
                <button type="submit" disabled={isSubmitting} className="px-4 py-2 text-sm font-medium text-white bg-brand-primary border border-transparent rounded-md shadow-sm hover:bg-brand-primary-hover disabled:opacity-50 min-w-[120px] text-center">
                    {submitButtonText()}
                </button>
            </div>
        </form>
      </div>
    </div>
  );
};

export default CreateTaskModal;