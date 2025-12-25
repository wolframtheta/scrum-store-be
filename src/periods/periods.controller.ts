import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { PeriodsService } from './periods.service';
import { CreatePeriodDto, CreatePeriodArticlesBatchDto } from './dto/create-period.dto';
import { UpdatePeriodDto } from './dto/update-period.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('periods')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('periods')
export class PeriodsController {
  constructor(private readonly periodsService: PeriodsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new period' })
  @ApiResponse({ status: 201, description: 'Period created successfully' })
  create(
    @Body() createPeriodDto: CreatePeriodDto,
    @Query('consumerGroupId') consumerGroupId: string,
  ) {
    return this.periodsService.create(createPeriodDto, consumerGroupId);
  }

  @Get()
  @ApiOperation({ summary: 'Get all periods for a consumer group, optionally filtered by supplier' })
  @ApiResponse({ status: 200, description: 'Periods retrieved successfully' })
  findAll(
    @Query('consumerGroupId') consumerGroupId: string,
    @Query('supplierId') supplierId?: string,
  ) {
    return this.periodsService.findAll(consumerGroupId, supplierId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a period by ID' })
  @ApiResponse({ status: 200, description: 'Period retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Period not found' })
  findOne(
    @Param('id') id: string,
    @Query('consumerGroupId') consumerGroupId: string,
  ) {
    return this.periodsService.findOne(id, consumerGroupId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a period' })
  @ApiResponse({ status: 200, description: 'Period updated successfully' })
  @ApiResponse({ status: 404, description: 'Period not found' })
  update(
    @Param('id') id: string,
    @Query('consumerGroupId') consumerGroupId: string,
    @Body() updatePeriodDto: UpdatePeriodDto,
  ) {
    return this.periodsService.update(id, consumerGroupId, updatePeriodDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a period' })
  @ApiResponse({ status: 200, description: 'Period deleted successfully' })
  @ApiResponse({ status: 404, description: 'Period not found' })
  remove(
    @Param('id') id: string,
    @Query('consumerGroupId') consumerGroupId: string,
  ) {
    return this.periodsService.remove(id, consumerGroupId);
  }

  @Post(':id/articles')
  @ApiOperation({ summary: 'Add an article to a period' })
  @ApiResponse({ status: 201, description: 'Article added to period successfully' })
  addArticle(
    @Param('id') periodId: string,
    @Query('consumerGroupId') consumerGroupId: string,
    @Body('articleId') articleId: string,
    @Body('pricePerUnit') pricePerUnit: number,
  ) {
    return this.periodsService.addArticle(periodId, consumerGroupId, articleId, pricePerUnit);
  }

  @Post(':id/articles/batch')
  @ApiOperation({ summary: 'Add multiple articles to a period in batch' })
  @ApiResponse({ status: 201, description: 'Articles added to period successfully' })
  addArticlesBatch(
    @Param('id') periodId: string,
    @Query('consumerGroupId') consumerGroupId: string,
    @Body() batchDto: CreatePeriodArticlesBatchDto,
  ) {
    return this.periodsService.addArticlesBatch(periodId, consumerGroupId, batchDto.articles);
  }

  @Patch(':id/articles/:articleId')
  @ApiOperation({ summary: 'Update article price in a period' })
  @ApiResponse({ status: 200, description: 'Article price updated successfully' })
  updateArticlePrice(
    @Param('id') periodId: string,
    @Param('articleId') articleId: string,
    @Query('consumerGroupId') consumerGroupId: string,
    @Body('pricePerUnit') pricePerUnit: number,
  ) {
    return this.periodsService.updateArticlePrice(periodId, consumerGroupId, articleId, pricePerUnit);
  }

  @Delete(':id/articles/:articleId')
  @ApiOperation({ summary: 'Remove an article from a period' })
  @ApiResponse({ status: 200, description: 'Article removed from period successfully' })
  removeArticle(
    @Param('id') periodId: string,
    @Param('articleId') articleId: string,
    @Query('consumerGroupId') consumerGroupId: string,
  ) {
    return this.periodsService.removeArticle(periodId, consumerGroupId, articleId);
  }
}

