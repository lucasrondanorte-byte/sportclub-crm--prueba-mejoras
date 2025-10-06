// hooks/useSort.ts
import { useState, useMemo } from 'react';

/**
 * Para qué sirve: Este es un "hook" personalizado que encapsula toda la lógica para ordenar arrays de objetos.
 * Lo usaremos en las tablas de Prospectos y Socios para no repetir código.
 * Maneja orden ascendente/descendente y diferentes tipos de datos (texto, números, fechas).
 */

export type SortDirection = 'ascending' | 'descending';

export interface SortConfig<T> {
  key: keyof T | string; // Permitimos string para poder ordenar por claves especiales o anidadas
  direction: SortDirection;
}

// Función auxiliar para obtener valores de objetos, incluso si están anidados (ej: 'user.name')
const getNestedValue = (obj: any, key: string): any => {
    return key.split('.').reduce((o, k) => (o || {})[k], obj);
}

export const useSort = <T extends object>(
  initialData: T[],
  initialConfig: SortConfig<T> | null = null
) => {
  const [sortConfig, setSortConfig] = useState<SortConfig<T> | null>(initialConfig);

  const sortedData = useMemo(() => {
    if (!sortConfig || !initialData) {
      return initialData;
    }

    // Creamos una copia para no modificar el array original
    const dataCopy = [...initialData];

    dataCopy.sort((a, b) => {
      // Usamos el helper para poder ordenar por cualquier clave
      const aValue = getNestedValue(a, sortConfig.key as string);
      const bValue = getNestedValue(b, sortConfig.key as string);

      // Tratamos los valores nulos o indefinidos para que siempre vayan al final
      if (aValue == null) return 1;
      if (bValue == null) return -1;

      // Hacemos la comparación
      if (aValue < bValue) {
        return sortConfig.direction === 'ascending' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'ascending' ? 1 : -1;
      }
      return 0;
    });

    return dataCopy;
  }, [initialData, sortConfig]);

  // Esta función se llamará al hacer clic en un encabezado de columna
  const requestSort = (key: keyof T | string) => {
    let direction: SortDirection = 'ascending';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  return { sortedData, requestSort, sortConfig };
};
