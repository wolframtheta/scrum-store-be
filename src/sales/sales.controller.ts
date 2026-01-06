import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { SalesService } from './sales.service';
import { CreateSaleDto } from './dto/create-sale.dto';
import { RegisterPaymentDto } from './dto/register-payment.dto';
import { SaleResponseDto } from './dto/sale-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { IsManagerGuard } from '../core/guards/is-manager.guard';
import { IsManagerOrPreparerGuard } from '../core/guards/is-manager-or-preparer.guard';
import { PaymentStatus } from './entities/sale.entity';

@ApiTags('sales')
@Controller('sales')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class SalesController {
  constructor(private readonly salesService: SalesService) {}

  @Post()
  @ApiOperation({
    summary: 'Tramitar pedido (crear venta)',
    description: 'Crea una nueva venta para el usuario autenticado. El usuario debe ser miembro del grupo y todos los artículos deben estar en el aparador.',
  })
  @ApiResponse({
    status: 201,
    description: 'Pedido tramitado exitosamente. La venta se crea con estado UNPAID.',
    type: SaleResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Datos inválidos o artículos no disponibles' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'No eres miembro del grupo' })
  async create(@Request() req, @Body() createDto: CreateSaleDto): Promise<SaleResponseDto> {
    return this.salesService.create(req.user.email, createDto);
  }

  @Get('my-sales')
  @ApiOperation({
    summary: 'Obtener ventas del usuario autenticado',
    description: 'Lista todas las ventas del usuario, opcionalmente filtradas por grupo de consumo',
  })
  @ApiQuery({ name: 'groupId', required: false, description: 'Filtrar por grupo de consumo' })
  @ApiResponse({
    status: 200,
    description: 'Lista de ventas del usuario',
    type: [SaleResponseDto],
  })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  async findUserSales(
    @Request() req,
    @Query('groupId') groupId?: string,
  ): Promise<SaleResponseDto[]> {
    return this.salesService.findUserSales(req.user.email, groupId);
  }

  @Get('by-group/:groupId')
  @UseGuards(IsManagerOrPreparerGuard)
  @ApiOperation({
    summary: 'Obtener ventas de un grupo (gestores y preparadores)',
    description: 'Lista todas las ventas de un grupo de consumo. Solo accesible para gestores y preparadores del grupo.',
  })
  @ApiQuery({ 
    name: 'paymentStatus', 
    required: false, 
    enum: PaymentStatus,
    description: 'Filtrar por estado de pago (unpaid, partial, paid)' 
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de ventas del grupo',
    type: [SaleResponseDto],
  })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'No eres gestor del grupo' })
  async findByGroup(
    @Param('groupId', ParseUUIDPipe) groupId: string,
    @Query('paymentStatus') paymentStatus?: PaymentStatus,
  ): Promise<SaleResponseDto[]> {
    return this.salesService.findByGroup(groupId, paymentStatus);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Obtener detalle de una venta',
    description: 'Obtiene el detalle completo de una venta. El usuario debe ser el propietario o gestor del grupo.',
  })
  @ApiResponse({
    status: 200,
    description: 'Detalle de la venta',
    type: SaleResponseDto,
  })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'No tienes acceso a esta venta' })
  @ApiResponse({ status: 404, description: 'Venta no encontrada' })
  async findById(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req,
  ): Promise<SaleResponseDto> {
    await this.salesService.verifySaleAccess(id, req.user.email, false);
    return this.salesService.findById(id);
  }

  @Patch(':id/payment')
  @UseGuards(IsManagerOrPreparerGuard)
  @ApiOperation({
    summary: 'Registrar pago (gestores y preparadores)',
    description: 'Registra un pago para una venta. Puede ser pago total o parcial por items. Solo gestores y preparadores pueden registrar pagos.',
  })
  @ApiResponse({
    status: 200,
    description: 'Pago registrado exitosamente. El estado de la venta se actualiza automáticamente (UNPAID → PARTIAL → PAID).',
    type: SaleResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Datos inválidos o pago excede el total' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'No eres gestor del grupo' })
  @ApiResponse({ status: 404, description: 'Venta no encontrada' })
  async registerPayment(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() paymentDto: RegisterPaymentDto,
    @Request() req,
  ): Promise<SaleResponseDto> {
    await this.salesService.verifySaleAccess(id, req.user.email, true);
    return this.salesService.registerPayment(id, paymentDto);
  }

  @Patch(':id/delivery')
  @UseGuards(IsManagerOrPreparerGuard)
  @ApiOperation({
    summary: 'Marcar venta como entregada (gestores y preparadores)',
    description: 'Marca una venta como entregada o no entregada.',
  })
  @ApiResponse({
    status: 200,
    description: 'Estado de entrega actualizado correctamente.',
    type: SaleResponseDto,
  })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'No eres gestor del grupo' })
  @ApiResponse({ status: 404, description: 'Venta no encontrada' })
  async updateDeliveryStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('isDelivered') isDelivered: boolean,
    @Request() req,
  ): Promise<SaleResponseDto> {
    await this.salesService.verifySaleAccess(id, req.user.email, true);
    return this.salesService.updateDeliveryStatus(id, isDelivered);
  }
}


