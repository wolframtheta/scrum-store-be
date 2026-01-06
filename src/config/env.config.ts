import * as path from 'path';

/**
 * Determina els arxius d'environment a carregar segons l'entorn.
 * 
 * Ordre de prioritat (ConfigModule carrega en ordre, l'últim té prioritat):
 * 1. .env (base, sempre carregat primer)
 * 2. .env.{environment} (segons ENVIRONMENT o NODE_ENV)
 * 
 * Entorns suportats:
 * - local/development/dev: .env.local (tots utilitzen el mateix arxiu)
 * - pre: .env.pre
 * - pro: .env.pro
 * - production/prod: .env.production
 */
export function getEnvFilePaths(): string[] {
  const rootPath = path.resolve(process.cwd());
  
  // Determinar entorn: pot venir de ENVIRONMENT o NODE_ENV
  // ENVIRONMENT té prioritat sobre NODE_ENV
  const environment = process.env.ENVIRONMENT || process.env.NODE_ENV || 'development';
  
  const envFiles: string[] = [];
  
  // Mapeig d'entorns a arxius
  // development i local utilitzen el mateix arxiu
  const envFileMap: Record<string, string> = {
    local: '.env.local',
    development: '.env.local', // development = local
    dev: '.env.local', // dev també = local
    pre: '.env.pre',
    pro: '.env.pro',
    production: '.env.production',
    prod: '.env.production',
  };
  
  // Sempre afegir .env com a base primer (valors per defecte)
  envFiles.push(path.join(rootPath, '.env'));
  
  // Afegir arxiu específic de l'entorn després (sobrescriu valors base)
  const specificEnvFile = envFileMap[environment.toLowerCase()];
  if (specificEnvFile) {
    envFiles.push(path.join(rootPath, specificEnvFile));
  }
  
  return envFiles;
}

/**
 * Carrega les variables d'entorn usant dotenv.
 * Útil per scripts que no usen ConfigModule de NestJS.
 */
export function loadEnvFiles(): void {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const dotenv = require('dotenv');
    const envFiles = getEnvFilePaths();
    
    // Carregar en ordre invers perquè el primer tingui prioritat
    for (const envFile of envFiles.reverse()) {
      dotenv.config({ path: envFile });
    }
  } catch (e) {
    // dotenv no disponible, usar variables de entorno del sistema
    console.warn('dotenv no disponible, usant variables de entorno del sistema');
  }
}

