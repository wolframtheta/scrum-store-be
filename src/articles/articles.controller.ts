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

  @Get()
  @ApiOperation({
    summary: 'Listar artículos',
    description: 'Obtiene lista de artículos con filtros opcionales (grupo, aparador, búsqueda)',
  })
  @ApiQuery({ name: 'groupId', required: false, description: 'Filtrar por grupo de consumo' })
  @ApiQuery({ name: 'inShowcase', required: false, type: Boolean, description: 'Filtrar por aparador' })
  @ApiQuery({ name: 'search', required: false, description: 'Buscar por nombre, descripción o productor' })
  @ApiResponse({
    status: 200,
    description: 'Lista de artículos',
    type: [ArticleResponseDto],
  })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  async findAll(
    @Query('groupId') groupId?: string,
    @Query('inShowcase') inShowcase?: string,
    @Query('search') search?: string,
  ): Promise<ArticleResponseDto[]> {
    const showcaseFilter = inShowcase === 'true' ? true : inShowcase === 'false' ? false : undefined;
    return this.articlesService.findAll(groupId, showcaseFilter, search);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Obtener detalle de un artículo',
    description: 'Obtiene la información completa de un artículo por su ID',
  })
  @ApiResponse({
    status: 200,
    description: 'Detalle del artículo',
    type: ArticleResponseDto,
  })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 404, description: 'Artículo no encontrado' })
  async findById(@Param('id', ParseUUIDPipe) id: string): Promise<ArticleResponseDto> {
    return this.articlesService.findById(id);
  }

  @Patch(':id')
  @UseGuards(IsManagerGuard)
  @ApiOperation({
    summary: 'Actualizar un artículo',
    description: 'Solo gestores pueden actualizar artículos. Si se cambia el precio, se guardará en el histórico automáticamente.',
  })
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
    @Request() req,
  ): Promise<ArticleResponseDto> {
    const isOwner = await this.articlesService.verifyArticleOwnership(id, req.user.email);
    if (!isOwner) {
      throw new ForbiddenException('You are not a manager of this consumer group');
    }

    return this.articlesService.update(id, updateDto);
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
}


