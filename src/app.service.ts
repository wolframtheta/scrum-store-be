import { Injectable } from '@nestjs/common';
import { readFileSync } from 'fs';
import { join } from 'path';

@Injectable()
export class AppService {
  getHello(): string {
    return 'Hello World!';
  }

  getVersion(): { version: string; buildTag: string; timestamp: string } {
    try {
      const versionFile = readFileSync(join(process.cwd(), 'version.json'), 'utf8');
      return JSON.parse(versionFile);
    } catch (error) {
      // Fallback a package.json si no existe version.json
      const packageJson = JSON.parse(
        readFileSync(join(process.cwd(), 'package.json'), 'utf8')
      );
      return {
        version: packageJson.version || '0.0.0',
        buildTag: 'unknown',
        timestamp: ''
      };
    }
  }
}
