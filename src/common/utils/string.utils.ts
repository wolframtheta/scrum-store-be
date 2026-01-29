/**
 * Normalitza un string per a cerques: elimina accents i converteix a minúscules.
 * Útil per fer filtres insensibles a accents (ex: "café" coincideix amb "cafe").
 */
export function removeAccents(str: string): string {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}
