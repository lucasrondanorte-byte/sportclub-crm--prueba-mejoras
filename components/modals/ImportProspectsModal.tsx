import React, { useState, useCallback, useMemo } from 'react';
import { User, Prospect, ProspectStage, ProspectSource, ProspectInterest, Branch } from '../../types';
import { useAuth } from '../../hooks/useAuth';
import { api } from '../../services/api';
import { PROSPECT_INTERESTS, PROSPECT_SOURCES } from '../../constants';

// Let TypeScript know that the XLSX library is available globally
declare var XLSX: any;

interface ImportProspectsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  sellers: User[];
}

type ParsedProspect = {
    documento?: string;
    nombre: string;
    apellido: string;
    email: string;
    celular?: string;
    direccion?: string;
    'fecha de inactivacion'?: any; // Can be a Date object or string
    plan?: string;
    motivo?: string;
};

type Assignment = {
    [rowIndex: number]: string; // sellerId
}

const EXPECTED_HEADERS = ['documento', 'nombre', 'apellido', 'email', 'celular', 'direccion', 'fecha de inactivacion', 'plan', 'motivo'];
const REQUIRED_HEADERS = ['nombre', 'apellido', 'email'];

const UploadIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M12 15l-4-4m0 0l4-4m-4 4h12" /></svg>;
const CheckCircleIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-green-500" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>;
const Spinner = () => <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>;
const DownloadIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>;


const ImportProspectsModal: React.FC<ImportProspectsModalProps> = ({ isOpen, onClose, onSuccess, sellers }) => {
    const { user } = useAuth();
    const [step, setStep] = useState(1);
    const [parsedData, setParsedData] = useState<ParsedProspect[]>([]);
    const [fileName, setFileName] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [assignmentType, setAssignmentType] = useState<'random' | 'manual' | null>(null);
    const [assignments, setAssignments] = useState<Assignment>({});
    const [selectedSellers, setSelectedSellers] = useState<string[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [importedCount, setImportedCount] = useState(0);
    const [defaultSource, setDefaultSource] = useState<ProspectSource>(ProspectSource.Bajas);

    const resetState = useCallback(() => {
        setStep(1);
        setParsedData([]);
        setFileName('');
        setError(null);
        setAssignmentType(null);
        setAssignments({});
        setSelectedSellers([]);
        setIsSubmitting(false);
        setImportedCount(0);
        setDefaultSource(ProspectSource.Bajas);
    }, []);

    const handleClose = () => {
        resetState();
        onClose();
    };

    const handleFile = (file: File) => {
        setError(null);
        setFileName(file.name);

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target?.result as ArrayBuffer);
                const workbook = XLSX.read(data, { type: 'array', cellDates: true });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                
                const headerRow: any[] = XLSX.utils.sheet_to_json(worksheet, { header: 1 })[0] || [];
                 if (headerRow.length === 0) {
                    setError("El archivo está vacío o la primera fila (cabeceras) está en blanco.");
                    return;
                }
                const headers: string[] = headerRow.map((h: any) => String(h).toLowerCase().trim().replace(/\s+/g, ' '));
                
                const missingHeaders = REQUIRED_HEADERS.filter(rh => !headers.includes(rh));
                if (missingHeaders.length > 0) {
                     setError(`Faltan las siguientes columnas obligatorias: ${missingHeaders.join(', ')}.`);
                    return;
                }

                const json: any[] = XLSX.utils.sheet_to_json(worksheet);

                const normalizedJson = json.map(row => {
                    const newRow: any = {};
                    Object.keys(row).forEach(key => {
                        const normalizedKey = key.toLowerCase().trim().replace(/\s+/g, ' ');
                        if (EXPECTED_HEADERS.includes(normalizedKey)) {
                            newRow[normalizedKey] = row[key];
                        }
                    });
                    return newRow;
                });

                const dataRows = normalizedJson.filter(p => p.nombre && p.apellido && p.email);

                setParsedData(dataRows);
                setStep(2);

            } catch (err) {
                console.error(err);
                setError("Error al procesar el archivo. Asegúrate de que es un formato válido (.xlsx, .csv).");
            }
        };
        reader.readAsArrayBuffer(file);
    };

    const handleDragOver = (e: React.DragEvent) => e.preventDefault();
    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFile(e.dataTransfer.files[0]);
        }
    };
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            handleFile(e.target.files[0]);
        }
    };

    const handleDownloadTemplate = () => {
        const headers = ['Documento', 'Nombre', 'Apellido', 'Email', 'Celular', 'Direccion', 'Fecha de inactivacion', 'Plan', 'Motivo'];
        const exampleData = [
            ['12345678', 'Juan', 'Perez', 'juan.p@example.com', '1122334455', 'Calle Falsa 123, CABA', '31/12/2025', 'Total Anual 1 pago', 'Se mudó'],
            ['87654321', 'Maria', 'Gomez', 'maria.g@example.com', '1199887766', 'Av. Siempreviva 742', '', 'Flex', 'Motivos personales']
        ];

        const wsData = [headers, ...exampleData];
        const ws = XLSX.utils.aoa_to_sheet(wsData);

        ws['!cols'] = [
            { wch: 15 }, // Documento
            { wch: 20 }, // Nombre
            { wch: 20 }, // Apellido
            { wch: 30 }, // Email
            { wch: 15 }, // Celular
            { wch: 30 }, // Direccion
            { wch: 20 }, // Fecha de inactivacion
            { wch: 25 }, // Plan
            { wch: 30 }, // Motivo
        ];

        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Plantilla');
        XLSX.writeFile(wb, 'plantilla_importacion_prospectos.xlsx');
    };


    const handleManualAssignmentChange = (rowIndex: number, sellerId: string) => {
        setAssignments(prev => ({ ...prev, [rowIndex]: sellerId }));
    };

    const handleRandomSellerToggle = (sellerId: string) => {
        setSelectedSellers(prev => 
            prev.includes(sellerId) ? prev.filter(id => id !== sellerId) : [...prev, sellerId]
        );
    };

    const isManualAssignmentComplete = useMemo(() => {
        return parsedData.length > 0 && Object.keys(assignments).length === parsedData.length;
    }, [parsedData, assignments]);

    const handleImport = async () => {
        if (!user) return;
        setIsSubmitting(true);
        // FIX: Corrected the type of prospectsToAdd to match the expected input of the api.addProspect function, which does not require a 'branch' property.
        let prospectsToAdd: Omit<Prospect, 'id' | 'createdAt' | 'updatedAt' | 'branch'>[] = [];
        const nextActionDate = new Date();
        nextActionDate.setDate(nextActionDate.getDate() + 1);

        const allProspectInterests = Object.values(ProspectInterest);

        // FIX: The branch property is derived from the assigned seller in the API, so the return type here should not include 'branch' or 'assignedTo'.
        const mapProspectData = (prospect: ParsedProspect): Omit<Prospect, 'id' | 'createdAt' | 'updatedAt' | 'assignedTo' | 'branch'> => {
            let inactivationNote = '';
            const inactivationDate = prospect['fecha de inactivacion'];
            if (inactivationDate) {
                if (inactivationDate instanceof Date) {
                    inactivationNote = `Fecha de inactivación: ${inactivationDate.toLocaleDateString('es-AR')}. `;
                } else {
                    inactivationNote = `Fecha de inactivación: ${inactivationDate}. `;
                }
            }
            const notes = `${inactivationNote}${prospect.motivo || 'Importado desde archivo.'}`;
            
            const interest = allProspectInterests.find(i => i.toLowerCase() === prospect.plan?.toLowerCase()) || ProspectInterest.Flex;

            return {
                name: `${prospect.nombre || ''} ${prospect.apellido || ''}`.trim(),
                email: prospect.email,
                dni: String(prospect.documento || ''),
                phone: String(prospect.celular || ''),
                source: defaultSource,
                interest: interest,
                stage: ProspectStage.New,
                address: prospect.direccion || '',
                notes: notes,
                createdBy: user.id, 
                updatedBy: user.id,
                nextActionDate: nextActionDate.toISOString(),
            };
        };


        if (assignmentType === 'random') {
            prospectsToAdd = parsedData.map((prospect, index) => ({
                ...mapProspectData(prospect),
                assignedTo: selectedSellers[index % selectedSellers.length],
            }));
        } else if (assignmentType === 'manual') {
             prospectsToAdd = parsedData.map((prospect, index) => ({
                ...mapProspectData(prospect),
                assignedTo: assignments[index],
            }));
        }

        try {
            await Promise.all(prospectsToAdd.map(p => api.addProspect(p)));
            setImportedCount(prospectsToAdd.length);
            setStep(5); // Success step
        } catch (err) {
            console.error("Failed to import prospects", err);
            setError("Ocurrió un error al guardar los prospectos. Por favor, inténtelo de nuevo.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60" aria-modal="true" role="dialog">
            <div className="bg-brand-surface border border-brand-border rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col m-4">
                <div className="p-5 border-b border-brand-border flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-brand-text-primary">Importar Prospectos</h2>
                    <button onClick={handleClose} className="text-gray-400 hover:text-gray-600">&times;</button>
                </div>
                
                <div className="p-6 overflow-y-auto">
                    {/* Step 1: Upload */}
                    {step === 1 && (
                        <div>
                            <div className="mb-4 p-4 bg-blue-900/30 border-l-4 border-blue-500 text-blue-200 rounded-r-lg">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <h4 className="font-bold">Instrucciones</h4>
                                        <p className="text-sm mt-1">Prepara tu archivo .xlsx o .csv. Las columnas 'Nombre', 'Apellido' y 'Email' son obligatorias.</p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={handleDownloadTemplate}
                                        className="flex items-center px-3 py-2 text-sm font-medium text-black bg-brand-accent rounded-md hover:bg-brand-accent-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-accent whitespace-nowrap"
                                    >
                                        <DownloadIcon />
                                        Descargar Plantilla
                                    </button>
                                </div>
                                <p className="text-xs mt-2">Columnas que se tomarán: <strong>Documento, Nombre, Apellido, Email, Celular, Direccion, Fecha de inactivacion, Plan, Motivo</strong>.</p>
                            </div>
                            <div 
                                onDragOver={handleDragOver}
                                onDrop={handleDrop}
                                className="border-2 border-dashed border-brand-border rounded-lg p-10 text-center cursor-pointer hover:border-brand-primary"
                                onClick={() => document.getElementById('file-upload')?.click()}
                            >
                                <UploadIcon />
                                <p className="mt-2 text-brand-text-secondary">Arrastra tu archivo aquí o <span className="font-semibold text-brand-primary">haz clic para seleccionar</span>.</p>
                                <input type="file" id="file-upload" className="hidden" accept=".xlsx, .xls, .csv" onChange={handleFileChange} />
                            </div>
                            {error && <p className="text-red-500 text-sm mt-4">{error}</p>}
                        </div>
                    )}

                    {/* Step 2: Preview & Choose Assignment */}
                    {step === 2 && (
                        <div>
                            <h3 className="text-lg font-semibold mb-2 text-brand-text-primary">Archivo: <span className="font-normal">{fileName}</span></h3>
                            <p className="mb-4 text-green-400">Se han encontrado {parsedData.length} prospectos válidos. Por favor, elige cómo quieres asignarlos.</p>
                            
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div onClick={() => { setAssignmentType('random'); setStep(3); }} className="p-6 border border-brand-border rounded-lg hover:shadow-lg hover:border-brand-primary cursor-pointer text-center">
                                    <h4 className="text-xl font-bold text-brand-text-primary">Asignación Aleatoria</h4>
                                    <p className="text-sm text-brand-text-muted mt-2">Distribuye los prospectos de forma equitativa entre los vendedores que elijas.</p>
                                </div>
                                <div onClick={() => { setAssignmentType('manual'); setStep(4); }} className="p-6 border border-brand-border rounded-lg hover:shadow-lg hover:border-brand-primary cursor-pointer text-center">
                                    <h4 className="text-xl font-bold text-brand-text-primary">Asignación Manual</h4>
                                    <p className="text-sm text-brand-text-muted mt-2">Asigna cada prospecto a un vendedor específico.</p>
                                </div>
                            </div>

                             <div className="mt-6 pt-4 border-t border-brand-border">
                                <label htmlFor="defaultSource" className="block text-sm font-medium text-brand-text-secondary">Origen por defecto para los prospectos</label>
                                <select 
                                    id="defaultSource" 
                                    value={defaultSource} 
                                    onChange={(e) => setDefaultSource(e.target.value as ProspectSource)} 
                                    className="mt-1 block w-full md:w-1/2 p-2 border border-brand-border bg-brand-surface text-brand-text-primary rounded-md shadow-sm"
                                >
                                    {PROSPECT_SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </div>
                        </div>
                    )}
                    
                    {/* Step 3: Random Assignment */}
                    {step === 3 && (
                        <div>
                            <h3 className="text-lg font-semibold mb-2 text-brand-text-primary">Asignación Aleatoria</h3>
                            <p className="text-sm text-brand-text-secondary mb-4">Selecciona los vendedores que participarán en la distribución.</p>
                            <div className="space-y-2 max-h-64 overflow-y-auto p-2 border border-brand-border rounded-md">
                                {sellers.map(seller => (
                                    <label key={seller.id} className="flex items-center p-2 rounded-md hover:bg-white/5 cursor-pointer">
                                        <input type="checkbox" checked={selectedSellers.includes(seller.id)} onChange={() => handleRandomSellerToggle(seller.id)} className="h-4 w-4 rounded border-brand-border bg-brand-surface text-brand-primary focus:ring-brand-primary" />
                                        <span className="ml-3 text-sm font-medium text-brand-text-primary">{seller.name}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Step 4: Manual Assignment */}
                    {step === 4 && (
                         <div className="max-h-[60vh] overflow-auto">
                            <h3 className="text-lg font-semibold mb-2 text-brand-text-primary">Asignación Manual</h3>
                            <p className="text-sm text-brand-text-secondary mb-4">Asigna un vendedor a cada prospecto. El botón de importación se activará cuando todos estén asignados.</p>
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-brand-border">
                                    <thead className="bg-gray-800"><tr>
                                        <th className="px-4 py-2 text-left text-xs font-bold text-gray-300 uppercase">Nombre</th>
                                        <th className="px-4 py-2 text-left text-xs font-bold text-gray-300 uppercase">Apellido</th>
                                        <th className="px-4 py-2 text-left text-xs font-bold text-gray-300 uppercase">Email</th>
                                        <th className="px-4 py-2 text-left text-xs font-bold text-gray-300 uppercase">Asignar a</th>
                                    </tr></thead>
                                    <tbody className="bg-brand-surface divide-y divide-brand-border">
                                        {parsedData.map((prospect, index) => (
                                            <tr key={index}>
                                                <td className="px-4 py-2 whitespace-nowrap text-sm text-brand-text-secondary">{prospect.nombre}</td>
                                                <td className="px-4 py-2 whitespace-nowrap text-sm text-brand-text-secondary">{prospect.apellido}</td>
                                                <td className="px-4 py-2 whitespace-nowrap text-sm text-brand-text-secondary">{prospect.email}</td>
                                                <td className="px-4 py-2 whitespace-nowrap text-sm">
                                                    <select value={assignments[index] || ''} onChange={(e) => handleManualAssignmentChange(index, e.target.value)} className="w-full p-1 border border-brand-border bg-brand-surface rounded-md text-brand-text-primary">
                                                        <option value="" disabled>Seleccionar...</option>
                                                        {sellers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                                    </select>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                    
                    {/* Step 5: Success */}
                    {step === 5 && (
                        <div className="text-center py-10">
                            <CheckCircleIcon />
                            <h3 className="text-2xl font-bold mt-4 text-brand-text-primary">¡Importación Exitosa!</h3>
                            <p className="text-brand-text-secondary mt-2">Se han agregado {importedCount} nuevos prospectos al sistema.</p>
                        </div>
                    )}

                </div>

                <div className="px-6 py-4 bg-black/20 border-t border-brand-border flex justify-between items-center">
                    <div>
                        {step > 1 && step < 5 && <button onClick={() => setStep(step - 1)} className="px-4 py-2 text-sm font-medium text-brand-text-primary bg-brand-border border-transparent rounded-md shadow-sm hover:bg-gray-600">Atrás</button>}
                    </div>
                    <div>
                        {step < 5 && <button onClick={handleClose} className="px-4 py-2 text-sm font-medium text-brand-text-secondary">Cancelar</button>}
                        {step === 3 && <button onClick={handleImport} disabled={selectedSellers.length === 0 || isSubmitting} className="ml-3 px-4 py-2 text-sm font-medium text-white bg-brand-primary rounded-md shadow-sm hover:bg-brand-primary-hover disabled:opacity-50 flex items-center">{isSubmitting ? <><Spinner /> <span className="ml-2">Importando...</span></> : 'Importar y Asignar'}</button>}
                        {step === 4 && <button onClick={handleImport} disabled={!isManualAssignmentComplete || isSubmitting} className="ml-3 px-4 py-2 text-sm font-medium text-white bg-brand-primary rounded-md shadow-sm hover:bg-brand-primary-hover disabled:opacity-50 flex items-center">{isSubmitting ? <><Spinner /> <span className="ml-2">Importando...</span></> : 'Importar y Asignar'}</button>}
                        {step === 5 && <button onClick={() => { onSuccess(); handleClose(); }} className="px-4 py-2 text-sm font-medium text-white bg-brand-primary rounded-md shadow-sm hover:bg-brand-primary-hover">Finalizar</button>}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ImportProspectsModal;