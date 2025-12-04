import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ProducersService } from './producers.service';
import { CreateProducerDto } from './dto/create-producer.dto';
import { UpdateProducerDto } from './dto/update-producer.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('producers')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('producers')
export class ProducersController {
  constructor(private readonly producersService: ProducersService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new producer' })
  @ApiResponse({ status: 201, description: 'Producer created successfully' })
  create(@Body() createProducerDto: CreateProducerDto) {
    return this.producersService.create(createProducerDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all producers for a consumer group' })
  @ApiResponse({ status: 200, description: 'Producers retrieved successfully' })
  findAll(
    @Query('consumerGroupId') consumerGroupId: string,
    @Query('activeOnly') activeOnly?: boolean,
  ) {
    return this.producersService.findAll(consumerGroupId, activeOnly !== false);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a producer by ID' })
  @ApiResponse({ status: 200, description: 'Producer retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Producer not found' })
  findOne(
    @Param('id') id: string,
    @Query('consumerGroupId') consumerGroupId: string,
  ) {
    return this.producersService.findOne(id, consumerGroupId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a producer' })
  @ApiResponse({ status: 200, description: 'Producer updated successfully' })
  @ApiResponse({ status: 404, description: 'Producer not found' })
  update(
    @Param('id') id: string,
    @Query('consumerGroupId') consumerGroupId: string,
    @Body() updateProducerDto: UpdateProducerDto,
  ) {
    return this.producersService.update(id, consumerGroupId, updateProducerDto);
  }

  @Patch(':id/toggle-active')
  @ApiOperation({ summary: 'Toggle producer active status' })
  @ApiResponse({ status: 200, description: 'Producer status toggled successfully' })
  @ApiResponse({ status: 404, description: 'Producer not found' })
  toggleActive(
    @Param('id') id: string,
    @Query('consumerGroupId') consumerGroupId: string,
  ) {
    return this.producersService.toggleActive(id, consumerGroupId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a producer' })
  @ApiResponse({ status: 200, description: 'Producer deleted successfully' })
  @ApiResponse({ status: 404, description: 'Producer not found' })
  remove(
    @Param('id') id: string,
    @Query('consumerGroupId') consumerGroupId: string,
  ) {
    return this.producersService.remove(id, consumerGroupId);
  }
}

