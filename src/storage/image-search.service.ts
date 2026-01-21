import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class ImageSearchService {
  private readonly logger = new Logger(ImageSearchService.name);
  private readonly googleApiKey: string | undefined;
  private readonly googleEngineId: string | undefined;

  constructor(private readonly configService: ConfigService) {
    this.googleApiKey = this.configService.get<string>('GOOGLE_CUSTOM_SEARCH_API_KEY');
    this.googleEngineId = this.configService.get<string>('GOOGLE_CUSTOM_SEARCH_ENGINE_ID');
  }

  /**
   * Busca una imagen relacionada con el producto del artículo usando Google Custom Search API
   */
  async searchImage(query: string): Promise<string | null> {
    try {
      if (!this.googleApiKey || !this.googleEngineId) {
        this.logger.warn('Google Custom Search API key or Engine ID not configured');
        return null;
      }

      return await this.searchGoogleImages(query);
    } catch (error) {
      this.logger.error(`Error searching image for query "${query}":`, error);
      return null;
    }
  }

  /**
   * Busca en Google Custom Search API (mejor para productos específicos)
   */
  private async searchGoogleImages(query: string): Promise<string | null> {
    try {
      const response = await axios.get(
        'https://www.googleapis.com/customsearch/v1',
        {
          params: {
            key: this.googleApiKey,
            cx: this.googleEngineId,
            q: query,
            searchType: 'image',
            num: 5, // Obtener varias opciones para elegir la mejor
            safe: 'active', // Filtro de contenido seguro
            imgSize: 'medium', // Preferir imágenes medianas
            imgType: 'photo', // Solo fotos, no ilustraciones
          },
          timeout: 8000,
        },
      );

      if (response.data?.items && response.data.items.length > 0) {
        const items = response.data.items;
        
        // Preferir imágenes cuadradas o cercanas a cuadradas
        const squareImage = items.find((item: any) => {
          const width = item.image?.width || item.image?.thumbnailWidth || 0;
          const height = item.image?.height || item.image?.thumbnailHeight || 0;
          if (width > 0 && height > 0) {
            const ratio = width / height;
            return ratio >= 0.8 && ratio <= 1.2; // Permitir un poco de flexibilidad
          }
          return false;
        });
        
        if (squareImage) {
          return squareImage.link;
        }
        
        // Si no hay cuadrada, usar la primera (mejor relevancia)
        return items[0].link;
      }

      return null;
    } catch (error: any) {
      this.logger.warn(`Google Custom Search failed: ${error.message || 'Unknown error'}`);
      return null;
    }
  }


  /**
   * Genera una query de búsqueda basada en el artículo
   * Prioriza términos específicos y concretos para obtener mejores resultados
   */
  generateSearchQuery(article: { product: string; category: string; variety?: string }): string {
    const parts: string[] = [];
    
    // 1. Producto principal (siempre primero, es lo más específico)
    if (article.product && article.product.trim()) {
      parts.push(article.product.trim());
    }
    
    // 2. Variedad (si existe y es relevante, va después del producto)
    if (article.variety && article.variety.trim()) {
      // Solo agregar variedad si no está ya incluida en el nombre del producto
      const productLower = article.product.toLowerCase();
      const varietyLower = article.variety.toLowerCase();
      if (!productLower.includes(varietyLower)) {
        parts.push(article.variety.trim());
      }
    }
    
    // 3. Agregar contexto de alimento/producto fresco si es relevante
    // Esto ayuda a obtener imágenes más específicas de productos alimentarios
    const foodKeywords = this.getFoodKeywords(article.category);
    if (foodKeywords) {
      parts.push(foodKeywords);
    }
    
    // 4. Categoría solo si no es genérica (evitar términos muy amplios)
    if (article.category && article.category.trim()) {
      const categoryLower = article.category.toLowerCase();
      // Evitar categorías genéricas que no aportan especificidad
      const genericCategories = ['productos', 'alimentos', 'comida', 'producte', 'aliment'];
      if (!genericCategories.some(gc => categoryLower.includes(gc))) {
        // Solo agregar si no está ya incluida en el producto
        const productLower = article.product.toLowerCase();
        if (!productLower.includes(categoryLower)) {
          parts.push(article.category.trim());
        }
      }
    }
    
    // Si no hay nada, retornar un término por defecto
    if (parts.length === 0) {
      return 'food product';
    }
    
    // Retornar query limpia, sin duplicados y con máximo 4 términos
    return this.cleanQuery(parts.slice(0, 4).join(' '));
  }

  /**
   * Obtiene palabras clave relacionadas con alimentos según la categoría
   */
  private getFoodKeywords(category: string): string | null {
    if (!category) return null;
    
    const categoryLower = category.toLowerCase();
    
    // Mapeo de categorías a términos específicos que mejoran la búsqueda
    const categoryKeywords: Record<string, string> = {
      'hortalizas': 'fresh vegetables',
      'verduras': 'fresh vegetables',
      'frutas': 'fresh fruits',
      'fruta': 'fresh fruits',
      'aceites': 'olive oil',
      'aceite': 'olive oil',
      'cereales': 'cereals grains',
      'legumbres': 'legumes beans',
      'lacteos': 'dairy products',
      'lácteos': 'dairy products',
      'huevos': 'fresh eggs',
      'carne': 'fresh meat',
      'pescado': 'fresh fish',
      'pan': 'fresh bread',
      'miel': 'honey',
      'mermelada': 'jam',
      'conservas': 'canned food',
    };
    
    // Buscar coincidencias parciales
    for (const [key, value] of Object.entries(categoryKeywords)) {
      if (categoryLower.includes(key)) {
        return value;
      }
    }
    
    return null;
  }

  /**
   * Limpia la query eliminando espacios extra y normalizando
   */
  private cleanQuery(query: string): string {
    return query
      .replace(/\s+/g, ' ') // Múltiples espacios a uno solo
      .trim()
      .toLowerCase();
  }
}
