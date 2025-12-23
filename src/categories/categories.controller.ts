import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { UpdateCategoryNameDto } from './dto/update-category-name.dto';
import { DeleteCategoryByNameDto } from './dto/delete-category-by-name.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('categories')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new category' })
  @ApiResponse({ status: 201, description: 'Category created successfully' })
  create(@Body() createCategoryDto: CreateCategoryDto) {
    return this.categoriesService.create(createCategoryDto);
  }

  @Post('batch')
  @ApiOperation({ summary: 'Create multiple categories in batch' })
  @ApiResponse({ status: 201, description: 'Categories created successfully' })
  createBatch(@Body() createCategoryDtos: CreateCategoryDto[]) {
    return this.categoriesService.createBatch(createCategoryDtos);
  }

  @Get()
  @ApiOperation({ summary: 'Get all categories for a consumer group' })
  @ApiResponse({ status: 200, description: 'Categories retrieved successfully' })
  findAll(@Query('consumerGroupId') consumerGroupId: string) {
    return this.categoriesService.findAll(consumerGroupId);
  }

  @Get('tree')
  @ApiOperation({ summary: 'Get category tree structure for a consumer group' })
  @ApiResponse({ status: 200, description: 'Category tree retrieved successfully' })
  getCategoryTree(@Query('consumerGroupId') consumerGroupId: string) {
    return this.categoriesService.getCategoryTree(consumerGroupId);
  }

  @Get('unique-categories')
  @ApiOperation({ summary: 'Get unique category names' })
  @ApiResponse({ status: 200, description: 'Unique categories retrieved successfully' })
  findUniqueCategories(@Query('consumerGroupId') consumerGroupId: string) {
    return this.categoriesService.findUniqueCategories(consumerGroupId);
  }

  @Get('products')
  @ApiOperation({ summary: 'Get products by category' })
  @ApiResponse({ status: 200, description: 'Products retrieved successfully' })
  findProductsByCategory(
    @Query('consumerGroupId') consumerGroupId: string,
    @Query('category') category: string,
  ) {
    return this.categoriesService.findProductsByCategory(consumerGroupId, category);
  }

  @Get('varieties')
  @ApiOperation({ summary: 'Get varieties by category and product' })
  @ApiResponse({ status: 200, description: 'Varieties retrieved successfully' })
  findVarietiesByProduct(
    @Query('consumerGroupId') consumerGroupId: string,
    @Query('category') category: string,
    @Query('product') product: string,
  ) {
    return this.categoriesService.findVarietiesByProduct(consumerGroupId, category, product);
  }

  @Delete('by-name/category')
  @ApiOperation({ summary: 'Delete all records with a specific category name' })
  @ApiResponse({ status: 200, description: 'Category deleted successfully' })
  removeByCategory(@Body() dto: DeleteCategoryByNameDto) {
    return this.categoriesService.removeByCategory(dto.consumerGroupId, dto.category);
  }

  @Delete('by-name/product')
  @ApiOperation({ summary: 'Delete all records with a specific category and product' })
  @ApiResponse({ status: 200, description: 'Product deleted successfully' })
  removeByProduct(@Body() dto: DeleteCategoryByNameDto) {
    if (!dto.product) {
      throw new Error('Product is required');
    }
    return this.categoriesService.removeByProduct(dto.consumerGroupId, dto.category, dto.product);
  }

  @Delete('by-name/variety')
  @ApiOperation({ summary: 'Delete a specific variety' })
  @ApiResponse({ status: 200, description: 'Variety deleted successfully' })
  removeByVariety(@Body() dto: DeleteCategoryByNameDto) {
    if (!dto.product || !dto.variety) {
      throw new Error('Product and variety are required');
    }
    return this.categoriesService.removeByVariety(dto.consumerGroupId, dto.category, dto.product, dto.variety);
  }

  @Patch('by-name/category')
  @ApiOperation({ summary: 'Update category name' })
  @ApiResponse({ status: 200, description: 'Category updated successfully' })
  updateCategoryName(@Body() dto: UpdateCategoryNameDto) {
    return this.categoriesService.updateCategoryName(dto.consumerGroupId, dto.oldName, dto.newName);
  }

  @Patch('by-name/product')
  @ApiOperation({ summary: 'Update product name' })
  @ApiResponse({ status: 200, description: 'Product updated successfully' })
  updateProductName(@Body() dto: UpdateCategoryNameDto) {
    if (!dto.category) {
      throw new Error('Category is required for updating product');
    }
    return this.categoriesService.updateProductName(dto.consumerGroupId, dto.category, dto.oldName, dto.newName);
  }

  @Patch('by-name/variety')
  @ApiOperation({ summary: 'Update variety name' })
  @ApiResponse({ status: 200, description: 'Variety updated successfully' })
  updateVarietyName(@Body() dto: UpdateCategoryNameDto) {
    if (!dto.category || !dto.product) {
      throw new Error('Category and product are required for updating variety');
    }
    return this.categoriesService.updateVarietyName(dto.consumerGroupId, dto.category, dto.product, dto.oldName, dto.newName);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a category by ID' })
  @ApiResponse({ status: 200, description: 'Category retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Category not found' })
  findOne(
    @Param('id') id: string,
    @Query('consumerGroupId') consumerGroupId: string,
  ) {
    return this.categoriesService.findOne(id, consumerGroupId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a category' })
  @ApiResponse({ status: 200, description: 'Category updated successfully' })
  @ApiResponse({ status: 404, description: 'Category not found' })
  update(
    @Param('id') id: string,
    @Query('consumerGroupId') consumerGroupId: string,
    @Body() updateCategoryDto: UpdateCategoryDto,
  ) {
    return this.categoriesService.update(id, consumerGroupId, updateCategoryDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a category' })
  @ApiResponse({ status: 200, description: 'Category deleted successfully' })
  @ApiResponse({ status: 404, description: 'Category not found' })
  remove(
    @Param('id') id: string,
    @Query('consumerGroupId') consumerGroupId: string,
  ) {
    return this.categoriesService.remove(id, consumerGroupId);
  }
}

