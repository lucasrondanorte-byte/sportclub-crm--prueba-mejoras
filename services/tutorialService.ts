import { Role } from '../types';
import { View } from '../components/dashboard/Dashboard';

// Para qué sirve: Este archivo define todos los pasos del tutorial para cada vista y rol.
// Al centralizarlo aquí, mantenemos el código de los componentes más limpio.

type TutorialStep = {
  element: string;
  title: string;
  text: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
};

type StepsByRole = {
  [key in Role]?: TutorialStep[];
};

const commonSteps: StepsByRole = {
    [Role.Admin]: [
        {
            element: '[data-tutorial="sidebar"]',
            title: 'Navegación Principal',
            text: '¡Bienvenido al CRM! Este es el menú principal. Desde aquí puedes acceder a todas las secciones: reportes, prospectos, socios, tareas y gestión de usuarios.',
        },
        {
            element: '[data-tutorial="header-bar"]',
            title: 'Tu Perfil y Acciones',
            text: 'En la parte superior, encontrarás información de tu perfil, el botón de ayuda para volver a ver este tutorial, y la opción para cerrar tu sesión de forma segura.',
        },
        {
            element: '[data-tutorial="help-button"]',
            title: 'Botón de Ayuda',
            text: 'Si alguna vez te sientes perdido o quieres repasar las funcionalidades de la pantalla actual, simplemente haz clic en este ícono de interrogación para reiniciar la guía.',
        },
    ],
    [Role.Manager]: [
        {
            element: '[data-tutorial="sidebar"]',
            title: 'Navegación Principal',
            text: '¡Bienvenido al CRM! Este es el menú principal. Desde aquí puedes acceder a todas las secciones relevantes para la gestión de tu sucursal.',
        },
        {
            element: '[data-tutorial="header-bar"]',
            title: 'Tu Perfil y Acciones',
            text: 'En la parte superior, encontrarás información de tu perfil, el botón de ayuda para volver a ver este tutorial, y la opción para cerrar tu sesión de forma segura.',
        },
        {
            element: '[data-tutorial="help-button"]',
            title: 'Botón de Ayuda',
            text: 'Si alguna vez te sientes perdido o quieres repasar las funcionalidades de la pantalla actual, simplemente haz clic en este ícono de interrogación para reiniciar la guía.',
        },
    ],
    [Role.Seller]: [
        {
            element: '[data-tutorial="sidebar"]',
            title: 'Tu Espacio de Trabajo',
            text: '¡Bienvenido! Este es tu menú para navegar entre tus reportes de rendimiento personal, tu lista de prospectos, tus socios convertidos y tus tareas diarias.',
        },
        {
            element: '[data-tutorial="header-bar"]',
            title: 'Tu Perfil y Acciones',
            text: 'En la parte superior, encontrarás tu información de perfil, el botón de ayuda para volver a ver este tutorial, y la opción para cerrar tu sesión de forma segura.',
        },
        {
            element: '[data-tutorial="help-button"]',
            title: 'Botón de Ayuda',
            text: 'Si alguna vez quieres repasar las funcionalidades de la pantalla en la que te encuentras, simplemente haz clic en este ícono para reiniciar esta guía.',
        },
    ],
    [Role.Viewer]: [
         {
            element: '[data-tutorial="sidebar"]',
            title: 'Navegación',
            text: '¡Bienvenido al CRM! Como "Visor", tu rol te permite consultar los reportes de rendimiento para analizar las métricas clave del negocio.',
        },
        {
            element: '[data-tutorial="header-bar"]',
            title: 'Tu Perfil',
            text: 'Aquí puedes ver los detalles de tu cuenta y cerrar la sesión cuando hayas terminado de consultar la información.',
        },
        {
            element: '[data-tutorial="help-button"]',
            title: 'Botón de Ayuda',
            text: 'Si necesitas un recordatorio de lo que significa cada gráfico o tabla, haz clic aquí para volver a ver esta guía.',
        },
    ]
};


const tutorialSteps: { [key in View]: StepsByRole } = {
  reports: {
    [Role.Admin]: [
      { element: '[data-tutorial="kpi-cards"]', title: 'Indicadores Clave (KPIs)', text: 'Estos son los números más importantes. Miden la salud de tu operación de ventas. Puedes filtrar por sucursal para un análisis más detallado y cambiar entre la vista mensual y diaria.' },
      { element: '[data-tutorial="charts"]', title: 'Análisis Visual', text: 'Estos gráficos te dan una visión instantánea de tu embudo de ventas (cuántos prospectos pasan de una etapa a otra) y de qué canales provienen (Instagram, web, etc.).' },
      { element: '[data-tutorial="performance-tables"]', title: 'Rendimiento Detallado', text: 'Aquí es donde puedes profundizar. Analiza el rendimiento individual de cada vendedor y compara los resultados entre las diferentes sedes para identificar oportunidades de mejora.' },
      { element: '[data-tutorial="data-management"]', title: 'Gestión de Datos', text: 'Desde este menú puedes exportar reportes de prospectos a Excel para análisis externos o realizar copias de seguridad completas de toda la base de datos de la aplicación.' },
    ],
    [Role.Manager]: [
      { element: '[data-tutorial="kpi-cards"]', title: 'KPIs de tu Sucursal', text: 'Estos son los indicadores clave de rendimiento para tu sucursal. Te permiten evaluar rápidamente la efectividad de tu equipo en el día o en el mes.' },
      { element: '[data-tutorial="charts"]', title: 'Análisis de tu Embudo', text: 'Visualiza el proceso de ventas de tu equipo, desde el primer contacto hasta el cierre, y descubre qué canales de marketing están funcionando mejor para tu sede.' },
      { element: '[data-tutorial="performance-tables"]', title: 'Rendimiento del Equipo', text: 'Usa estas tablas para ver el rendimiento detallado de cada vendedor a tu cargo. Es ideal para dar feedback y establecer objetivos.' },
    ],
    [Role.Seller]: [
       { element: '[data-tutorial="kpi-cards"]', title: 'Tus Resultados', text: 'Estos son tus indicadores de rendimiento. Revisa tu tasa de conversión y cuántos nuevos socios has logrado traer. ¡Es tu marcador personal!' },
       { element: '[data-tutorial="performance-tables"]', title: 'Tu Ranking', text: 'Aquí puedes ver cómo vas con respecto a tus metas de conversión. También te muestra tu posición en comparación con otros vendedores.' },
    ],
     [Role.Viewer]: [
       { element: '[data-tutorial="kpi-cards"]', title: 'Indicadores Generales', text: 'Estos paneles muestran las métricas más importantes, como la tasa de conversión total y la cantidad de nuevos socios, permitiéndote tener un pulso rápido del negocio.' },
       { element: '[data-tutorial="charts"]', title: 'Visualización de Datos', text: 'Estos gráficos te ayudan a entender de forma sencilla cómo avanza el proceso de ventas y cuáles son las fuentes de clientes más efectivas.' },
       { element: '[data-tutorial="performance-tables"]', title: 'Tablas de Rendimiento', text: 'Consulta estas tablas para ver estadísticas detalladas del rendimiento, tanto por cada vendedor como por cada una de las sedes.' },
    ],
  },
  prospects: {
    [Role.Admin]: [
       { element: '[data-tutorial="prospects-actions"]', title: 'Acciones Principales', text: 'Desde aquí puedes realizar acciones masivas: agregar un prospecto manualmente, importar una lista (por ejemplo, ex-socios), sincronizar desde una planilla de Google, o reasignar prospectos entre vendedores.' },
       { element: '[data-tutorial="prospects-filters"]', title: 'Filtros Potentes', text: 'Usa estos filtros para segmentar tu base de datos. Puedes buscar por etapa (ej: "Nuevos"), origen (ej: "Instagram"), o ver los prospectos de un vendedor específico.' },
       { element: '[data-tutorial="prospects-table"]', title: 'Lista de Prospectos', text: 'Aquí está toda la base de prospectos. Haz clic en cualquier fila para ver y editar su perfil completo. El ícono de WhatsApp te permite iniciar una conversación directamente.' },
    ],
     [Role.Manager]: [
       { element: '[data-tutorial="prospects-actions"]', title: 'Gestiona Prospectos', text: 'Agrega nuevos prospectos para tu equipo, importa listas o reasigna los prospectos seleccionados a otro vendedor de tu sucursal si es necesario.' },
       { element: '[data-tutorial="prospects-filters"]', title: 'Filtra y Organiza', text: 'Encuentra rápidamente los prospectos que buscas. Puedes filtrar por vendedor para revisar el trabajo de alguien en específico, o por etapa para ver quiénes están cerca de cerrar.' },
       { element: '[data-tutorial="prospects-table"]', title: 'Prospectos de tu Sucursal', text: 'Esta es la lista de todos los prospectos de tu equipo. Haz clic en una fila para revisar su historial, añadir notas o actualizar su estado.' },
    ],
     [Role.Seller]: [
       { element: '[data-tutorial="prospects-actions"]', title: 'Agregar Prospecto', text: '¿Tienes un nuevo interesado? Haz clic aquí para registrarlo en el sistema y empezar a hacerle seguimiento. ¡No dejes que se enfríe!' },
       { element: '[data-tutorial="prospects-filters"]', title: 'Organiza tu Trabajo', text: 'Usa los filtros para planificar tu día. Por ejemplo, filtra por "Etapa: Nuevo" para contactar a los más recientes, o por "Con tarea pendiente" para ver tus seguimientos.' },
       { element: '[data-tutorial="prospects-table"]', title: 'Tu Cartera de Prospectos', text: 'Aquí están todos tus prospectos asignados. Haz clic en uno para ver todo su historial, añadir notas, registrar una llamada o, ¡lo más importante!, convertirlo en socio.' },
    ],
  },
  members: {
      [Role.Admin]: [
       { element: '[data-tutorial="members-filters"]', title: 'Filtro de Socios', text: 'Utiliza este filtro para encontrar socios que tengan tareas de seguimiento pendientes, ideal para supervisar la gestión de retención.' },
       { element: '[data-tutorial="members-table"]', title: 'Base de Datos de Socios', text: 'Aquí se encuentra la lista completa de todos los socios activos del gimnasio. Haz clic en una fila para acceder a su perfil, ver su historial de interacciones y añadir nuevas notas.' },
    ],
      [Role.Manager]: [
       { element: '[data-tutorial="members-filters"]', title: 'Filtro de Socios', text: 'Encuentra rápidamente qué socios de tu sucursal tienen tareas de seguimiento pendientes para asegurar que tu equipo está trabajando en la retención.' },
       { element: '[data-tutorial="members-table"]', title: 'Socios de tu Sucursal', text: 'Esta es la lista de los socios de tu sede. Es una herramienta clave para la gestión post-venta. Accede a sus perfiles para registrar interacciones importantes.' },
    ],
      [Role.Seller]: [
       { element: '[data-tutorial="members-filters"]', title: 'Filtra tus Socios', text: 'Usa este filtro para ver cuáles de los socios que tú convertiste tienen tareas pendientes. Es una buena forma de mantener el contacto y fomentar la lealtad.' },
       { element: '[data-tutorial="members-table"]', title: 'Tu Cartera de Socios', text: '¡Estos son tus éxitos! Aquí puedes ver a todos los prospectos que convertiste en socios. Haz clic para añadir notas o registrar interacciones de seguimiento.' },
    ],
  },
  tasks: {
     [Role.Admin]: [
       { element: '[data-tutorial="tasks-actions"]', title: 'Creación y Objetivos', text: 'Desde aquí puedes crear tareas y asignarlas a cualquier vendedor del sistema. También puedes establecer los objetivos de conversión globales, por sede y por vendedor.' },
       { element: '[data-tutorial="tasks-filters"]', title: 'Supervisión de Tareas', text: 'Estos filtros te permiten tener una visión completa de la productividad. Puedes ver las tareas de un vendedor específico, las que están vencidas, o todas las llamadas programadas, por ejemplo.' },
       { element: '[data-tutorial="tasks-table"]', title: 'Panel General de Tareas', text: 'Monitorea todas las tareas creadas en el sistema. Es el centro de control para asegurar que el seguimiento a prospectos y socios se está realizando correctamente.' },
    ],
     [Role.Manager]: [
       { element: '[data-tutorial="tasks-actions"]', title: 'Asignar y Medir', text: 'Crea nuevas tareas y asígnalas a los vendedores de tu equipo. Usa "Establecer Objetivos" para definir las metas de conversión de tu sucursal y de cada vendedor.' },
       { element: '[data-tutorial="tasks-filters"]', title: 'Filtra por Productividad', text: 'Usa los filtros para revisar la carga de trabajo de tu equipo. Puedes ver las tareas pendientes de un vendedor, las que ya se completaron o las que están por vencer.' },
       { element: '[data-tutorial="tasks-table"]', title: 'Tareas de tu Sucursal', text: 'Este es el panel de control de las actividades de tu equipo. Supervisa qué se está haciendo, qué está pendiente y asegúrate de que ninguna oportunidad se pierda.' },
    ],
     [Role.Seller]: [
       { element: '[data-tutorial="seller-goals"]', title: 'Tu Panel de Objetivos', text: '¡Mantente motivado! Este panel te muestra tu progreso actual en comparación con tus metas de conversión diarias y mensuales.' },
       { element: '[data-tutorial="tasks-actions"]', title: 'Crea tus Tareas', text: 'Esta es tu herramienta de organización. Crea tareas para ti mismo, como "Llamar a prospecto X" o "Enviar promo a socio Y", para no olvidar ningún seguimiento.' },
       { element: '[data-tutorial="tasks-filters"]', title: 'Organiza tu Día', text: 'Filtra tu lista para enfocarte. Puedes ver solo las tareas "Vencidas" para ponerte al día, o las de "Hoy" para planificar tu jornada.' },
       { element: '[data-tutorial="tasks-table"]', title: 'Tu Lista de Pendientes', text: 'Aquí se listan todas tus tareas. Es tu "To-Do List" diario. Una vez que completes una, márcala como "Completada" para mantener tu lista limpia y actualizada.' },
    ],
  },
  users: {
    [Role.Admin]: [
       { element: '[data-tutorial="users-table"]', title: 'Gestión de Cuentas', text: 'Desde esta tabla puedes administrar todos los usuarios del sistema. Haz clic en "Editar" para cambiar el rol (ej: de Vendedor a Gerente) o la sucursal asignada a un usuario.' },
    ],
    [Role.Manager]: [
        { element: '[data-tutorial="users-table"]', title: 'Gestión de tu Equipo', text: 'Aquí puedes ver y editar los perfiles de los usuarios de tu sucursal. Usa el botón "Editar" para cambiar el rol de un miembro de tu equipo (ej: de Visor a Vendedor).' },
    ],
  },
};

export const getTutorialSteps = (view: View, role: Role): TutorialStep[] => {
    // Combine common steps with view-specific steps
    const common = commonSteps[role] || [];
    const viewSpecific = tutorialSteps[view]?.[role] || [];
    return [...common, ...viewSpecific];
};