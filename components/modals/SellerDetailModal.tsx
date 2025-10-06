import React from 'react';
import { SellerData, BRAND_CHART_COLORS } from '../views/ReportsView';
import Card from '../common/Card';
import { BarChart, Bar, PieChart, Pie, Cell, ResponsiveContainer, Tooltip, YAxis, Legend, XAxis } from 'recharts';

interface SellerDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: SellerData | null;
}

const KpiCard = ({ title, value, subtext }: { title: string, value: string | number, subtext: string }) => (
    <div className="bg-brand-bg/50 p-4 rounded-lg border border-brand-border text-center flex-1">
        <p className="text-sm text-brand-text-secondary truncate">{title}</p>
        <p className="text-3xl font-bold text-brand-text-primary mt-1">{value}</p>
        <p className="text-xs text-brand-text-muted">{subtext}</p>
    </div>
);

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-brand-sidebar p-3 rounded-lg border border-brand-border shadow-lg text-sm">
        <p className="font-bold text-brand-text-primary">{label || payload[0].name}</p>
        <p className="text-brand-text-secondary mt-1">
            Prospectos: <span className="font-semibold" style={{color: payload[0].color || payload[0].payload.fill}}>{payload[0].value}</span>
        </p>
      </div>
    );
  }
  return null;
};


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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 backdrop-blur-sm" aria-modal="true" role="dialog">
      <div className="bg-brand-surface border border-brand-border rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col m-4">
        {/* Header */}
        <div className="p-5 border-b border-brand-border flex justify-between items-center flex-shrink-0">
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
          <div className="flex flex-col md:flex-row gap-4">
             <KpiCard title="Prospectos Totales" value={data.totalProspects} subtext="Asignados" />
             <KpiCard title="Tasa de Conversión" value={`${data.conversionRate}%`} subtext={`${data.conversions} de ${data.totalProspects}`} />
             <KpiCard title="En Etapa de Prueba" value={data.prospectsInTrial} subtext="Pipeline activo" />
          </div>

          {/* Breakdowns */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card title="Desglose por Etapa">
              {data.funnelData.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={data.funnelData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                        <XAxis type="number" hide />
                        <YAxis type="category" dataKey="name" width={80} tick={{ fill: '#A3A3A3', fontSize: 12 }} tickLine={false} axisLine={false} />
                        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
                        <Bar dataKey="value" barSize={20} radius={[0, 4, 4, 0]}>
                            {data.funnelData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.fill} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-brand-text-muted text-center py-4">Sin datos de etapas.</p>
              )}
            </Card>

            <Card title="Origen de Prospectos">
              {data.sourceData.length > 0 ? (
                 <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                        <Pie data={data.sourceData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={2}>
                            {data.sourceData.map((entry, index) => <Cell key={`cell-${index}`} fill={BRAND_CHART_COLORS[index % BRAND_CHART_COLORS.length]} />)}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                        <Legend iconType="circle" wrapperStyle={{fontSize: "12px"}}/>
                    </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-brand-text-muted text-center py-4">Sin datos de origen.</p>
              )}
            </Card>
          </div>
        </div>


        {/* Footer */}
        <div className="px-6 py-4 bg-black/20 border-t border-brand-border flex justify-end flex-shrink-0">
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