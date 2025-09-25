import React from 'react';
import { SellerData, BRAND_CHART_COLORS } from '../views/ReportsView';
import Card from '../common/Card';

interface SellerDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: SellerData | null;
}

const KpiCard = ({ title, value, subtext }: { title: string, value: string | number, subtext: string }) => (
    <div className="bg-brand-bg/50 p-4 rounded-lg border border-brand-border text-center">
        <p className="text-sm text-brand-text-secondary truncate">{title}</p>
        <p className="text-3xl font-bold text-brand-text-primary mt-1">{value}</p>
        <p className="text-xs text-brand-text-muted">{subtext}</p>
    </div>
);

const SellerDetailModal: React.FC<SellerDetailModalProps> = ({ isOpen, onClose, data }) => {
  if (!isOpen || !data) return null;

  const getInitials = (name: string) => {
    const names = name.split(' ');
    if (names.length > 1) {
      return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70" aria-modal="true" role="dialog">
      <div className="bg-brand-surface border border-brand-border rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col m-4">
        {/* Header */}
        <div className="p-5 border-b border-brand-border flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center bg-brand-primary text-xl font-bold text-white">
              {getInitials(data.sellerName)}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-brand-text-primary">{data.sellerName}</h2>
              <p className="text-sm text-brand-text-secondary">Resumen de Rendimiento Individual</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-3xl font-bold">&times;</button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* KPIs */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
             <KpiCard title="Prospectos Totales" value={data.totalProspects} subtext="Asignados históricamente" />
             <KpiCard title="Tasa de Conversión" value={`${data.conversionRate}%`} subtext={`${data.conversions} de ${data.totalProspects} ganados`} />
             <KpiCard title="En Etapa de Prueba" value={data.prospectsInTrial} subtext="Pipeline activo" />
          </div>

          {/* Breakdowns */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card title="Desglose por Etapa">
              {data.funnelData.length > 0 ? (
                <ul className="space-y-3">
                  {data.funnelData.map((item, index) => (
                    <li key={index} className="flex justify-between items-center text-sm">
                      <div className="flex items-center">
                        <span className="w-3 h-3 rounded-full mr-3" style={{ backgroundColor: item.fill }}></span>
                        <span className="text-brand-text-secondary">{item.name}</span>
                      </div>
                      <span className="font-semibold text-brand-text-primary">{item.value}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-brand-text-muted text-center py-4">Sin datos de etapas.</p>
              )}
            </Card>

            <Card title="Origen de Prospectos">
              {data.sourceData.length > 0 ? (
                <ul className="space-y-3">
                  {data.sourceData.map((item, index) => (
                    <li key={index} className="flex justify-between items-center text-sm">
                      <div className="flex items-center">
                        <span className="w-3 h-3 rounded-full mr-3" style={{ backgroundColor: BRAND_CHART_COLORS[index % BRAND_CHART_COLORS.length] }}></span>
                        <span className="text-brand-text-secondary">{item.name}</span>
                      </div>
                      <span className="font-semibold text-brand-text-primary">{item.value}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-brand-text-muted text-center py-4">Sin datos de origen.</p>
              )}
            </Card>
          </div>
        </div>


        {/* Footer */}
        <div className="px-6 py-4 bg-black/20 border-t border-brand-border flex justify-end">
            <button
                type="button"
                onClick={onClose}
                className="px-6 py-2 text-sm font-medium text-white bg-brand-primary border border-transparent rounded-md shadow-sm hover:bg-brand-primary-hover"
            >
                Cerrar
            </button>
        </div>
      </div>
    </div>
  );
};

export default SellerDetailModal;
