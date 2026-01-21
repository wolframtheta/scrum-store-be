import { Controller, Get, Post, Body, Param, Patch, Delete, UseGuards, ValidationPipe, Query, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrderResponseDto } from './dto/order-response.dto';
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
}

