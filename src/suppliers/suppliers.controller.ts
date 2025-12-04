import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { SuppliersService } from './suppliers.service';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { UpdateSupplierDto } from './dto/update-supplier.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('suppliers')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('suppliers')
export class SuppliersController {
  constructor(private readonly suppliersService: SuppliersService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new supplier' })
  @ApiResponse({ status: 201, description: 'Supplier created successfully' })
  create(@Body() createSupplierDto: CreateSupplierDto) {
    return this.suppliersService.create(createSupplierDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all suppliers for a consumer group' })
  @ApiResponse({ status: 200, description: 'Suppliers retrieved successfully' })
  findAll(
    @Query('consumerGroupId') consumerGroupId: string,
    @Query('activeOnly') activeOnly?: boolean,
  ) {
    return this.suppliersService.findAll(consumerGroupId, activeOnly !== false);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a supplier by ID' })
  @ApiResponse({ status: 200, description: 'Supplier retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Supplier not found' })
  findOne(
    @Param('id') id: string,
    @Query('consumerGroupId') consumerGroupId: string,
  ) {
    return this.suppliersService.findOne(id, consumerGroupId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a supplier' })
  @ApiResponse({ status: 200, description: 'Supplier updated successfully' })
  @ApiResponse({ status: 404, description: 'Supplier not found' })
  update(
    @Param('id') id: string,
    @Query('consumerGroupId') consumerGroupId: string,
    @Body() updateSupplierDto: UpdateSupplierDto,
  ) {
    return this.suppliersService.update(id, consumerGroupId, updateSupplierDto);
  }

  @Patch(':id/toggle-active')
  @ApiOperation({ summary: 'Toggle supplier active status' })
  @ApiResponse({ status: 200, description: 'Supplier status toggled successfully' })
  @ApiResponse({ status: 404, description: 'Supplier not found' })
  toggleActive(
    @Param('id') id: string,
    @Query('consumerGroupId') consumerGroupId: string,
  ) {
    return this.suppliersService.toggleActive(id, consumerGroupId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a supplier' })
  @ApiResponse({ status: 200, description: 'Supplier deleted successfully' })
  @ApiResponse({ status: 404, description: 'Supplier not found' })
  remove(
    @Param('id') id: string,
    @Query('consumerGroupId') consumerGroupId: string,
  ) {
    return this.suppliersService.remove(id, consumerGroupId);
  }
}

