import { Controller, Get, Post, Body, Param, Patch, UseGuards, ValidationPipe, Query } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrderResponseDto } from './dto/order-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { PaymentStatus } from './entities/order.entity';
import { IsManagerGuard } from '../core/guards/is-manager.guard';

@Controller('orders')
@UseGuards(JwtAuthGuard)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  create(
    @CurrentUser() user: any,
    @Body(new ValidationPipe({ whitelist: true })) createOrderDto: CreateOrderDto
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
  @UseGuards(IsManagerGuard)
  findByGroup(
    @Param('groupId') groupId: string,
    @Query('paymentStatus') paymentStatus?: PaymentStatus
  ): Promise<OrderResponseDto[]> {
    return this.ordersService.findByGroup(groupId, paymentStatus);
  }

  @Get(':id')
  findOne(
    @CurrentUser() user: any,
    @Param('id') id: string
  ): Promise<OrderResponseDto> {
    return this.ordersService.findOne(id, user.id);
  }

  @Patch(':id/delivery')
  @UseGuards(IsManagerGuard)
  updateDelivery(
    @Param('id') id: string,
    @Body('isDelivered') isDelivered: boolean
  ): Promise<OrderResponseDto> {
    return this.ordersService.updateDelivery(id, isDelivered);
  }
}

