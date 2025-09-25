
import React from 'react';

interface PrivacyPolicyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PrivacyPolicyModal: React.FC<PrivacyPolicyModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60" aria-modal="true" role="dialog">
      <div className="bg-brand-surface border border-brand-border rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col m-4">
        <div className="p-6 border-b border-brand-border flex justify-between items-center">
          <h2 className="text-2xl font-bold text-brand-text-primary">Política de Privacidad</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-3xl font-bold">&times;</button>
        </div>
        
        <div className="p-8 overflow-y-auto text-brand-text-secondary space-y-4">
          <div>
            <h3 className="text-xl font-semibold mb-2 text-brand-text-primary">1. Introducción</h3>
            <p>
              Bienvenido a SportClub CRM. Esta es una aplicación de demostración y no debe ser utilizada con datos personales reales. La privacidad y la seguridad de los datos son de suma importancia, y aunque esta aplicación utiliza técnicas de encriptación simuladas para fines educativos, no cumple con los estándares de seguridad para producción.
            </p>
          </div>

          <div>
            <h3 className="text-xl font-semibold mb-2 text-brand-text-primary">2. Recopilación de Información</h3>
            <p>
              Esta aplicación de demostración almacena datos en el almacenamiento local (localStorage) de su navegador. Esto incluye:
            </p>
            <ul className="list-disc list-inside pl-4 mt-2 space-y-1">
              <li>Información de usuario (nombre, email, rol) para la sesión.</li>
              <li>Datos de prospectos y socios que usted ingrese.</li>
              <li>Información sensible como DNI y dirección se "encripta" de forma simulada antes de guardarse. <strong>Advertencia:</strong> Esta encriptación es solo una simulación y no es segura.</li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-xl font-semibold mb-2 text-brand-text-primary">3. Uso de la Información</h3>
            <p>
              Los datos ingresados se utilizan únicamente para demostrar las funcionalidades del CRM dentro de su sesión de navegador. Los datos no se transmiten a ningún servidor externo y permanecen en su máquina local.
            </p>
          </div>
          
          <div>
            <h3 className="text-xl font-semibold mb-2 text-brand-text-primary">4. Seguridad de los Datos</h3>
            <p>
              Se ha implementado una simulación de encriptación para campos sensibles. Sin embargo, repetimos que esto <strong>no es seguro para datos reales</strong>. En una aplicación real, se utilizarían protocolos de encriptación estándar de la industria y medidas de seguridad del lado del servidor.
            </p>
          </div>
          
          <div>
            <h3 className="text-xl font-semibold mb-2 text-brand-text-primary">5. Backups y Retención de Datos</h3>
            <p>
              Todos los datos residen en su navegador. Si borra los datos de su navegador (caché, localStorage), la información se perderá permanentemente. La aplicación ofrece una funcionalidad para exportar los datos como un archivo JSON, que sirve como un backup manual bajo su responsabilidad.
            </p>
          </div>

          <div>
            <h3 className="text-xl font-semibold mb-2 text-brand-text-primary">6. Consentimiento</h3>
            <p>
              Al utilizar esta aplicación de demostración, usted reconoce y acepta que está interactuando con un sistema no seguro y se compromete a no ingresar datos personales sensibles o reales.
            </p>
          </div>
        </div>

        <div className="px-6 py-4 bg-gray-50 border-t border-brand-border flex justify-end">
          <button 
            type="button" 
            onClick={onClose} 
            className="px-6 py-2 text-sm font-medium text-white bg-brand-primary border border-transparent rounded-md shadow-sm hover:bg-brand-primary-hover"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicyModal;