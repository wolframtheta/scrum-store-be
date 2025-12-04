import { Controller, Get, Post, Body, Param, Patch, UseGuards, ValidationPipe } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrderResponseDto } from './dto/order-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { OrderStatus } from './entities/order.entity';

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
  findAll(@CurrentUser() user: any): Promise<OrderResponseDto[]> {
    return this.ordersService.findUserOrders(user.id);
  }

  @Get(':id')
  findOne(
    @CurrentUser() user: any,
    @Param('id') id: string
  ): Promise<OrderResponseDto> {
    return this.ordersService.findOne(id, user.id);
  }

  @Patch(':id/status')
  updateStatus(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body('status') status: OrderStatus
  ): Promise<OrderResponseDto> {
    return this.ordersService.updateStatus(id, user.id, status);
  }
}

