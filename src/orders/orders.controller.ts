import { Controller, Get, Post, Body, Param, Patch, Delete, UseGuards, ValidationPipe, Query, ParseUUIDPipe, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderItemDto } from './dto/update-order-item.dto';
import { OrderResponseDto } from './dto/order-response.dto';
import { PeriodPaymentSummaryDto } from './dto/period-payment-summary.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { PaymentStatus } from './entities/order.entity';
import { IsManagerGuard } from '../core/guards/is-manager.guard';
import { IsManagerOrPreparerGuard } from '../core/guards/is-manager-or-preparer.guard';

@ApiTags('orders')
@Controller('orders')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  create(
    @CurrentUser() user: any,
    @Body(new ValidationPipe({ whitelist: true, transform: true })) createOrderDto: CreateOrderDto
  ): Promise<OrderResponseDto> {
    return this.ordersService.create(user.id, createOrderDto);
  }

  @Get()
  findAll(
    @CurrentUser() user: any,
    @Query('groupId') groupId?: string
  ): Promise<OrderResponseDto[]> {
    return this.ordersService.findUserOrders(user.id, groupId);
  }

  @Get('by-group/:groupId')
  @UseGuards(IsManagerOrPreparerGuard)
  findByGroup(
    @Param('groupId') groupId: string,
    @Query('paymentStatus') paymentStatus?: PaymentStatus
  ): Promise<OrderResponseDto[]> {
    return this.ordersService.findByGroup(groupId, paymentStatus);
  }

  @Get('by-period/:periodId')
  @UseGuards(IsManagerOrPreparerGuard)
  @ApiOperation({
    summary: 'Obtenir resum de pagaments per període',
    description: 'Retorna un resum de què ha de pagar cada usuari per un període determinat, incloent subtotals i transport.',
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Resum de pagaments retornat exitosament', 
    type: PeriodPaymentSummaryDto 
  })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'No eres gestor o preparador del grupo' })
  @ApiResponse({ status: 404, description: 'Període no encontrado' })
  getPeriodPaymentSummary(
    @Param('periodId', ParseUUIDPipe) periodId: string,
    @Query('groupId') groupId: string
  ): Promise<PeriodPaymentSummaryDto> {
    if (!groupId) {
      throw new BadRequestException('groupId is required');
    }
    return this.ordersService.getPeriodPaymentSummary(periodId, groupId);
  }

  @Patch('by-period/:periodId/user/:userId/mark-as-paid')
  @UseGuards(IsManagerOrPreparerGuard)
  @ApiOperation({
    summary: 'Marcar comandes d\'un període i usuari com a pagades',
    description: 'Marca totes les comandes d\'un període i usuari com a pagades. Només afecta els items que pertanyen al període especificat.',
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Comandes marcades com a pagades exitosament', 
    type: PeriodPaymentSummaryDto 
  })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'No eres gestor o preparador del grupo' })
  @ApiResponse({ status: 404, description: 'Període o usuari no encontrado' })
  markPeriodUserOrdersAsPaid(
    @Param('periodId', ParseUUIDPipe) periodId: string,
    @Param('userId', ParseUUIDPipe) userId: string,
    @Query('groupId') groupId: string
  ): Promise<PeriodPaymentSummaryDto> {
    if (!groupId) {
      throw new BadRequestException('groupId is required');
    }
    return this.ordersService.markPeriodOrdersAsPaid(periodId, userId, groupId);
  }

  @Patch('by-period/:periodId/user/:userId/mark-as-unpaid')
  @UseGuards(IsManagerOrPreparerGuard)
  @ApiOperation({
    summary: 'Marcar comandes d\'un període i usuari com a no pagades',
    description: 'Marca totes les comandes d\'un període i usuari com a no pagades. Només afecta els items que pertanyen al període especificat.',
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Comandes marcades com a no pagades exitosament', 
    type: PeriodPaymentSummaryDto 
  })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'No eres gestor o preparador del grupo' })
  @ApiResponse({ status: 404, description: 'Període o usuari no encontrado' })
  markPeriodUserOrdersAsUnpaid(
    @Param('periodId', ParseUUIDPipe) periodId: string,
    @Param('userId', ParseUUIDPipe) userId: string,
    @Query('groupId') groupId: string
  ): Promise<PeriodPaymentSummaryDto> {
    if (!groupId) {
      throw new BadRequestException('groupId is required');
    }
    return this.ordersService.markPeriodOrdersAsUnpaid(periodId, userId, groupId);
  }

  @Patch(':orderId/items/:itemId')
  @UseGuards(IsManagerOrPreparerGuard)
  @ApiOperation({
    summary: 'Actualitzar un item d\'una comanda',
    description: 'Actualitza la quantitat i/o les opcions de personalització d\'un item d\'una comanda i recalcula el total. Només gestors i preparadors poden actualitzar items.',
  })
  @ApiResponse({ status: 200, description: 'Item actualitzat exitosament', type: OrderResponseDto })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'No eres gestor o preparador del grupo' })
  @ApiResponse({ status: 404, description: 'Comanda o item no encontrado' })
  updateOrderItem(
    @Param('orderId', ParseUUIDPipe) orderId: string,
    @Param('itemId', ParseUUIDPipe) itemId: string,
    @Body(new ValidationPipe({ whitelist: true, transform: true })) updateDto: UpdateOrderItemDto
  ): Promise<OrderResponseDto> {
    return this.ordersService.updateOrderItem(orderId, itemId, updateDto);
  }

  @Delete(':orderId/items/:itemId')
  @UseGuards(IsManagerOrPreparerGuard)
  @ApiOperation({
    summary: 'Eliminar un item d\'una comanda',
    description: 'Elimina un item específic d\'una comanda per ID i recalcula el total. Només gestors i preparadors poden eliminar items.',
  })
  @ApiResponse({ status: 200, description: 'Item eliminat exitosament', type: OrderResponseDto })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'No eres gestor o preparador del grupo' })
  @ApiResponse({ status: 404, description: 'Comanda o item no encontrado' })
  deleteOrderItem(
    @Param('orderId', ParseUUIDPipe) orderId: string,
    @Param('itemId', ParseUUIDPipe) itemId: string
  ): Promise<OrderResponseDto> {
    return this.ordersService.deleteOrderItemById(orderId, itemId);
  }

  @Delete(':id')
  @UseGuards(IsManagerOrPreparerGuard)
  @ApiOperation({
    summary: 'Eliminar una comanda',
    description: 'Solo gestores y preparadores pueden eliminar comandas. Esta acción es irreversible.',
  })
  @ApiResponse({ status: 200, description: 'Comanda eliminada exitosamente' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'No eres gestor o preparador del grupo' })
  @ApiResponse({ status: 404, description: 'Comanda no encontrada' })
  delete(@Param('id', ParseUUIDPipe) id: string): Promise<{ message: string }> {
    return this.ordersService.delete(id).then(() => ({
      message: 'Order deleted successfully',
    }));
  }

  @Get(':id')
  findOne(
    @CurrentUser() user: any,
    @Param('id', ParseUUIDPipe) id: string
  ): Promise<OrderResponseDto> {
    return this.ordersService.findOne(id, user.id);
  }

  @Patch(':id/delivery')
  @UseGuards(IsManagerOrPreparerGuard)
  updateDelivery(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('isDelivered') isDelivered: boolean
  ): Promise<OrderResponseDto> {
    return this.ordersService.updateDelivery(id, isDelivered);
  }

  @Patch(':id/mark-as-paid')
  @UseGuards(IsManagerOrPreparerGuard)
  @ApiOperation({
    summary: 'Marcar comanda como pagada',
    description: 'Marca una comanda como completamente pagada. Solo gestores y preparadores pueden marcar comandas como pagadas.',
  })
  @ApiResponse({ status: 200, description: 'Comanda marcada como pagada exitosamente', type: OrderResponseDto })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'No eres gestor o preparador del grupo' })
  @ApiResponse({ status: 404, description: 'Comanda no encontrada' })
  markAsPaid(
    @Param('id', ParseUUIDPipe) id: string
  ): Promise<OrderResponseDto> {
    return this.ordersService.markAsPaid(id);
  }
}

