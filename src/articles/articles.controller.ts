import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  ParseUUIDPipe,
  ForbiddenException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { ArticlesService } from './articles.service';
import { CreateArticleDto } from './dto/create-article.dto';
import { UpdateArticleDto } from './dto/update-article.dto';
import { ArticleResponseDto } from './dto/article-response.dto';
import { PriceHistoryResponseDto } from './dto/price-history-response.dto';
import { BatchDeleteDto, BatchToggleShowcaseDto, BatchToggleSeasonalDto, BatchToggleEcoDto } from './dto/batch-actions.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { IsManagerGuard } from '../core/guards/is-manager.guard';
import { StorageService } from '../storage/storage.service';

@ApiTags('articles')
@Controller('articles')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class ArticlesController {
  constructor(
    private readonly articlesService: ArticlesService,
    private readonly storageService: StorageService,
  ) {}

  @Post()
  @UseGuards(IsManagerGuard)
  @ApiOperation({
    summary: 'Crear un nuevo artículo',
    description: 'Solo gestores pueden crear artículos. Se guardará automáticamente el precio inicial en el histórico.',
  })
  @ApiResponse({
    status: 201,
    description: 'Artículo creado exitosamente',
    type: ArticleResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'No eres gestor del grupo' })
  async create(@Body() createDto: CreateArticleDto): Promise<ArticleResponseDto> {
    return this.articlesService.create(createDto);
  }

  @Post('batch')
  @UseGuards(IsManagerGuard)
  @ApiOperation({
    summary: 'Crear múltiples artículos en batch',
    description: 'Solo gestores pueden crear artículos. Crea múltiples artículos en una sola petición. Si un artículo ya existe (basado en hash de producer + category + product + variety), se actualiza en lugar de crear uno nuevo.',
  })
  @ApiResponse({
    status: 201,
    description: 'Artículos creados/actualizados exitosamente',
    schema: {
      type: 'object',
      properties: {
        created: { type: 'number', example: 5, description: 'Número de artículos nuevos creados' },
        updated: { type: 'number', example: 3, description: 'Número de artículos existentes actualizados' },
        failed: { type: 'number', example: 0, description: 'Número de artículos que fallaron' },
        articles: { type: 'array', items: { $ref: '#/components/schemas/ArticleResponseDto' } },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'No eres gestor del grupo' })
  async createBatch(@Body() createDtos: CreateArticleDto[]): Promise<{ created: number; updated: number; failed: number; articles: ArticleResponseDto[] }> {
    return this.articlesService.createBatch(createDtos);
  }

  @Post('batch/check')
  @UseGuards(IsManagerGuard)
  @ApiOperation({
    summary: 'Verificar qué artículos ya existen',
    description: 'Verifica qué artículos de la lista ya existen basándose en su hash. Retorna un array con el índice y si existe.',
  })
  @ApiResponse({
    status: 200,
    description: 'Array con estado de existencia por índice',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          index: { type: 'number' },
          exists: { type: 'boolean' },
        },
      },
    },
  })
  async checkArticlesExist(@Body() createDtos: CreateArticleDto[]): Promise<Array<{ index: number; exists: boolean }>> {
    return this.articlesService.checkArticlesExist(createDtos);
  }

  @Get()
  @ApiOperation({
    summary: 'Listar artículos',
    description: 'Obtiene lista de artículos con filtros opcionales (grupo, aparador, búsqueda)',
  })
  @ApiQuery({ name: 'groupId', required: false, description: 'Filtrar por grupo de consumo' })
  @ApiQuery({ name: 'inShowcase', required: false, type: Boolean, description: 'Filtrar por aparador' })
  @ApiQuery({ name: 'isEco', required: false, type: Boolean, description: 'Filtrar por ecológico' })
  @ApiQuery({ name: 'isSeasonal', required: false, type: Boolean, description: 'Filtrar por de temporada' })
  @ApiQuery({ name: 'categories', required: false, description: 'Filtrar por categorías (array separado por comas)' })
  @ApiQuery({ name: 'search', required: false, description: 'Buscar por nombre, descripción o productor' })
  @ApiQuery({ name: 'productSearch', required: false, description: 'Buscar específicamente por nombre del producto' })
  @ApiQuery({ name: 'producerIds', required: false, description: 'Filtrar por IDs de productores (array separado por comas)' })
  @ApiQuery({ name: 'supplierIds', required: false, description: 'Filtrar por IDs de proveedores (array separado por comas)' })
  @ApiQuery({ name: 'periodId', required: false, description: 'Filtrar por ID de período' })
  @ApiResponse({
    status: 200,
    description: 'Lista de artículos',
    type: [ArticleResponseDto],
  })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  async findAll(
    @Query('groupId') groupId?: string,
    @Query('inShowcase') inShowcase?: string,
    @Query('isEco') isEco?: string,
    @Query('isSeasonal') isSeasonal?: string,
    @Query('categories') categories?: string,
    @Query('search') search?: string,
    @Query('productSearch') productSearch?: string,
    @Query('producerIds') producerIds?: string,
    @Query('supplierIds') supplierIds?: string,
    @Query('periodId') periodId?: string,
  ): Promise<ArticleResponseDto[]> {
    const showcaseFilter = inShowcase === 'true' ? true : inShowcase === 'false' ? false : undefined;
    const ecoFilter = isEco === 'true' ? true : isEco === 'false' ? false : undefined;
    const seasonalFilter = isSeasonal === 'true' ? true : isSeasonal === 'false' ? false : undefined;
    const categoriesFilter = categories && categories.trim() ? categories.split(',').map(c => c.trim()).filter(c => c.length > 0) : undefined;
    const producerIdsFilter = producerIds && producerIds.trim() ? producerIds.split(',').map(id => id.trim()).filter(id => id.length > 0) : undefined;
    const supplierIdsFilter = supplierIds && supplierIds.trim() ? supplierIds.split(',').map(id => id.trim()).filter(id => id.length > 0) : undefined;
    return this.articlesService.findAll(groupId, showcaseFilter, ecoFilter, seasonalFilter, categoriesFilter, search, productSearch, producerIdsFilter, supplierIdsFilter, periodId);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Obtener detalle de un artículo',
    description: 'Obtiene la información completa de un artículo por su ID',
  })
  @ApiQuery({ name: 'groupId', required: false, description: 'ID del grupo de consumo para obtener precio del período actual' })
  @ApiResponse({
    status: 200,
    description: 'Detalle del artículo',
    type: ArticleResponseDto,
  })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 404, description: 'Artículo no encontrado' })
  async findById(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('groupId') groupId?: string,
  ): Promise<ArticleResponseDto> {
    return this.articlesService.findById(id, groupId);
  }

  @Patch(':id')
  @UseGuards(IsManagerGuard)
  @ApiOperation({
    summary: 'Actualizar un artículo',
    description: 'Solo gestores pueden actualizar artículos. Si se cambia el precio, se actualizará el precio del período actual si existe, y se guardará en el histórico automáticamente.',
  })
  @ApiQuery({ name: 'groupId', required: false, description: 'ID del grupo de consumo para actualizar el precio del período actual' })
  @ApiResponse({
    status: 200,
    description: 'Artículo actualizado exitosamente',
    type: ArticleResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'No eres gestor del grupo' })
  @ApiResponse({ status: 404, description: 'Artículo no encontrado' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateDto: UpdateArticleDto,
    @Query('groupId') groupId: string,
    @Request() req,
  ): Promise<ArticleResponseDto> {
    const isOwner = await this.articlesService.verifyArticleOwnership(id, req.user.email);
    if (!isOwner) {
      throw new ForbiddenException('You are not a manager of this consumer group');
    }

    return this.articlesService.update(id, updateDto, groupId);
  }

  @Delete(':id')
  @UseGuards(IsManagerGuard)
  @ApiOperation({
    summary: 'Eliminar un artículo',
    description: 'Solo gestores pueden eliminar artículos. Esta acción es irreversible.',
  })
  @ApiResponse({ status: 200, description: 'Artículo eliminado exitosamente' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'No eres gestor del grupo' })
  @ApiResponse({ status: 404, description: 'Artículo no encontrado' })
  async delete(@Param('id', ParseUUIDPipe) id: string, @Request() req): Promise<{ message: string }> {
    const isOwner = await this.articlesService.verifyArticleOwnership(id, req.user.email);
    if (!isOwner) {
      throw new ForbiddenException('You are not a manager of this consumer group');
    }

    await this.articlesService.delete(id);
    return { message: 'Article deleted successfully' };
  }

  @Patch(':id/toggle-showcase')
  @ApiOperation({
    summary: 'Mostrar/ocultar artículo en el aparador',
    description: 'Solo gestores pueden cambiar la visibilidad en el aparador. Los clientes solo ven artículos en el aparador.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        inShowcase: { type: 'boolean', example: true },
      },
      required: ['inShowcase'],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Visibilidad actualizada exitosamente',
    type: ArticleResponseDto,
  })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'No eres gestor del grupo' })
  @ApiResponse({ status: 404, description: 'Artículo no encontrado' })
  async toggleShowcase(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('inShowcase') inShowcase: boolean,
    @Request() req,
  ): Promise<ArticleResponseDto> {
    // Obtenir l'article per comprovar el consumerGroupId
    const article = await this.articlesService.findById(id);
    
    // Verificar que l'usuari és manager del grup
    const isManager = await this.articlesService.verifyUserIsManager(article.consumerGroupId, req.user.email);
    if (!isManager) {
      throw new ForbiddenException('User is not a manager of this group');
    }

    return this.articlesService.toggleShowcase(id, inShowcase);
  }

  @Get(':id/price-history')
  @ApiOperation({
    summary: 'Obtener histórico de precios',
    description: 'Obtiene el histórico completo de cambios de precio de un artículo, ordenado del más reciente al más antiguo',
  })
  @ApiResponse({
    status: 200,
    description: 'Histórico de precios',
    type: [PriceHistoryResponseDto],
  })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 404, description: 'Artículo no encontrado' })
  async getPriceHistory(@Param('id', ParseUUIDPipe) id: string): Promise<PriceHistoryResponseDto[]> {
    return this.articlesService.getPriceHistory(id);
  }

  @Post(':id/image')
  @UseGuards(IsManagerGuard)
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Subir imagen del artículo',
    description: 'Solo gestores pueden subir imágenes. Formatos permitidos: jpg, png, webp. Tamaño máximo: 5MB',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Imagen subida exitosamente',
    type: ArticleResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Archivo inválido o demasiado grande' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'No eres gestor del grupo' })
  @ApiResponse({ status: 404, description: 'Artículo no encontrado' })
  async uploadImage(
    @Param('id', ParseUUIDPipe) id: string,
    @UploadedFile() file: Express.Multer.File,
    @Request() req,
  ): Promise<ArticleResponseDto> {
    const isOwner = await this.articlesService.verifyArticleOwnership(id, req.user.email);
    if (!isOwner) {
      throw new ForbiddenException('You are not a manager of this consumer group');
    }

    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    const imageUrl = await this.storageService.uploadFile(file, 'articles');
    return this.articlesService.updateImage(id, imageUrl);
  }

  @Delete(':id/image')
  @UseGuards(IsManagerGuard)
  @ApiOperation({
    summary: 'Eliminar imagen del artículo',
    description: 'Solo gestores pueden eliminar imágenes',
  })
  @ApiResponse({
    status: 200,
    description: 'Imagen eliminada exitosamente',
    type: ArticleResponseDto,
  })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'No eres gestor del grupo' })
  @ApiResponse({ status: 404, description: 'Artículo no encontrado' })
  async deleteImage(@Param('id', ParseUUIDPipe) id: string, @Request() req): Promise<ArticleResponseDto> {
    const isOwner = await this.articlesService.verifyArticleOwnership(id, req.user.email);
    if (!isOwner) {
      throw new ForbiddenException('You are not a manager of this consumer group');
    }

    const article = await this.articlesService.findById(id);
    if (article.image) {
      await this.storageService.deleteFile(article.image);
    }

    return this.articlesService.deleteImage(id);
  }

  @Post('batch/delete')
  @UseGuards(IsManagerGuard)
  @ApiOperation({
    summary: 'Eliminar múltiples artículos en batch',
    description: 'Solo gestores pueden eliminar artículos. Esta acción es irreversible.',
  })
  @ApiResponse({
    status: 200,
    description: 'Artículos eliminados exitosamente',
    schema: {
      type: 'object',
      properties: {
        deleted: { type: 'number', example: 5 },
        failed: { type: 'number', example: 0 },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'No eres gestor del grupo' })
  async batchDelete(@Body() batchDto: BatchDeleteDto, @Request() req): Promise<{ deleted: number; failed: number }> {
    // Verificar que l'usuari és manager de tots els grups dels articles
    for (const articleId of batchDto.articleIds) {
      const isOwner = await this.articlesService.verifyArticleOwnership(articleId, req.user.email);
      if (!isOwner) {
        throw new ForbiddenException(`You are not a manager of the consumer group for article ${articleId}`);
      }
    }

    return this.articlesService.batchDelete(batchDto.articleIds);
  }

  @Post('batch/toggle-showcase')
  @UseGuards(IsManagerGuard)
  @ApiOperation({
    summary: 'Cambiar visibilidad en aparador de múltiples artículos en batch',
    description: 'Solo gestores pueden cambiar la visibilidad en el aparador.',
  })
  @ApiResponse({
    status: 200,
    description: 'Visibilidad actualizada exitosamente',
    schema: {
      type: 'object',
      properties: {
        updated: { type: 'number', example: 5 },
        failed: { type: 'number', example: 0 },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'No eres gestor del grupo' })
  async batchToggleShowcase(@Body() batchDto: BatchToggleShowcaseDto, @Request() req): Promise<{ updated: number; failed: number }> {
    // Verificar que l'usuari és manager de tots els grups dels articles
    for (const articleId of batchDto.articleIds) {
      const article = await this.articlesService.findById(articleId);
      const isManager = await this.articlesService.verifyUserIsManager(article.consumerGroupId, req.user.email);
      if (!isManager) {
        throw new ForbiddenException(`You are not a manager of the consumer group for article ${articleId}`);
      }
    }

    return this.articlesService.batchToggleShowcase(batchDto.articleIds, batchDto.inShowcase);
  }

  @Post('batch/toggle-seasonal')
  @UseGuards(IsManagerGuard)
  @ApiOperation({
    summary: 'Cambiar estado de temporada de múltiples artículos en batch',
    description: 'Solo gestores pueden cambiar el estado de temporada.',
  })
  @ApiResponse({
    status: 200,
    description: 'Estado de temporada actualizado exitosamente',
    schema: {
      type: 'object',
      properties: {
        updated: { type: 'number', example: 5 },
        failed: { type: 'number', example: 0 },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'No eres gestor del grupo' })
  async batchToggleSeasonal(@Body() batchDto: BatchToggleSeasonalDto, @Request() req): Promise<{ updated: number; failed: number }> {
    // Verificar que l'usuari és manager de tots els grups dels articles
    for (const articleId of batchDto.articleIds) {
      const isOwner = await this.articlesService.verifyArticleOwnership(articleId, req.user.email);
      if (!isOwner) {
        throw new ForbiddenException(`You are not a manager of the consumer group for article ${articleId}`);
      }
    }

    return this.articlesService.batchToggleSeasonal(batchDto.articleIds, batchDto.isSeasonal);
  }

  @Post('batch/toggle-eco')
  @UseGuards(IsManagerGuard)
  @ApiOperation({
    summary: 'Cambiar estado ecológico de múltiples artículos en batch',
    description: 'Solo gestores pueden cambiar el estado ecológico.',
  })
  @ApiResponse({
    status: 200,
    description: 'Estado ecológico actualizado exitosamente',
    schema: {
      type: 'object',
      properties: {
        updated: { type: 'number', example: 5 },
        failed: { type: 'number', example: 0 },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'No eres gestor del grupo' })
  async batchToggleEco(@Body() batchDto: BatchToggleEcoDto, @Request() req): Promise<{ updated: number; failed: number }> {
    // Verificar que l'usuari és manager de tots els grups dels articles
    for (const articleId of batchDto.articleIds) {
      const isOwner = await this.articlesService.verifyArticleOwnership(articleId, req.user.email);
      if (!isOwner) {
        throw new ForbiddenException(`You are not a manager of the consumer group for article ${articleId}`);
      }
    }

    return this.articlesService.batchToggleEco(batchDto.articleIds, batchDto.isEco);
  }

  @Post('normalize')
  @UseGuards(IsManagerGuard)
  @ApiOperation({
    summary: 'Normalizar todos los artículos',
    description: 'Normaliza todos los artículos capitalizando la primera letra de cada palabra en category, product y variety. También detecta y elimina duplicados causados por diferencias de mayúsculas/minúsculas. Solo gestores pueden ejecutar esta operación.',
  })
  @ApiResponse({
    status: 200,
    description: 'Normalización completada',
    schema: {
      type: 'object',
      properties: {
        normalized: { type: 'number', example: 150 },
        duplicatesFound: { type: 'number', example: 12 },
        errors: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              articleId: { type: 'string' },
              error: { type: 'string' },
            },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'No eres gestor' })
  async normalizeAllArticles(): Promise<{ normalized: number; duplicatesFound: number; errors: Array<{ articleId: string; error: string }> }> {
    return this.articlesService.normalizeAllArticles();
  }
}


