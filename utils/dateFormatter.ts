// utils/dateFormatter.ts

/**
 * Para qué sirve: Este archivo centraliza todas las funciones relacionadas con fechas.
 * Así, nos aseguramos de que las fechas se muestren siempre igual y evitamos repetir código.
 */

/**
 * Formatea una fecha ISO a un formato legible para Argentina (DD/MM/YYYY).
 * Devuelve 'N/A' si la fecha no es válida.
 * @param isoString - La fecha en formato ISO (ej: "2023-10-27T10:00:00.000Z").
 */
export const formatDate = (isoString: string | null | undefined): string => {
  if (!isoString) return 'N/A';
  try {
    return new Date(isoString).toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  } catch (e) {
    return 'Fecha inválida';
  }
};

/**
 * Formatea una fecha ISO a un formato con hora (DD/MM/YY, HH:mm).
 * @param isoString - La fecha en formato ISO.
 */
export const formatDateTime = (isoString: string | null | undefined): string => {
    if (!isoString) return 'N/A';
    try {
        return new Date(isoString).toLocaleString('es-AR', {
            day: '2-digit',
            month: '2-digit',
            year: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
        });
    } catch (e) {
        return 'Fecha inválida';
    }
};

/**
 * Convierte una fecha ISO a un string compatible con <input type="date"> (YYYY-MM-DD).
 * Esto es crucial para que los inputs de fecha muestren el valor correcto.
 * @param isoString - La fecha en formato ISO.
 */
export const toInputDateString = (isoString: string | null | undefined): string => {
    if (!isoString) return '';
    try {
        const date = new Date(isoString);
        // Ajusta por la zona horaria para evitar que la fecha cambie un día
        date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
        return date.toISOString().split('T')[0];
    } catch (e) {
        return '';
    }
};

/**
 * Convierte una fecha ISO a un string compatible con <input type="datetime-local"> (YYYY-MM-DDTHH:mm).
 * @param isoString - La fecha en formato ISO.
 */
export const toInputDateTimeString = (isoString: string | null | undefined): string => {
    if (!isoString) return '';
    try {
        const date = new Date(isoString);
        date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
        return date.toISOString().slice(0, 16);
    } catch (e) {
        return '';
    }
};
