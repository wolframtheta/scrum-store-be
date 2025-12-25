import { Controller, Get, Post, Body, Param, UseGuards, ValidationPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { OrdersService } from '../orders/orders.service';
import { CreateOrderDto } from '../orders/dto/create-order.dto';
import { OrderResponseDto } from '../orders/dto/order-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { IsMemberGuard } from '../core/guards/is-member.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('consumer-groups')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, IsMemberGuard)
@Controller('consumer-groups/:id/orders')
export class ConsumerGroupsOrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new order for a consumer group' })
  @ApiResponse({ 
    status: 201, 
    description: 'Order created successfully',
    type: OrderResponseDto
  })
  create(
    @Param('id') consumerGroupId: string,
    @CurrentUser() user: any,
    @Body(new ValidationPipe({ whitelist: true, transform: true })) createOrderDto: CreateOrderDto
  ): Promise<OrderResponseDto> {
    // Asegurar que el consumerGroupId del DTO coincida con el de la URL
    createOrderDto.consumerGroupId = consumerGroupId;
    return this.ordersService.create(user.id, createOrderDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all orders for a consumer group' })
  @ApiResponse({ 
    status: 200, 
    description: 'Orders retrieved successfully',
    type: [OrderResponseDto]
  })
  findAll(
    @Param('id') consumerGroupId: string,
    @CurrentUser() user: any
  ): Promise<OrderResponseDto[]> {
    return this.ordersService.findUserOrders(user.id, consumerGroupId);
  }

  @Get(':orderId')
  @ApiOperation({ summary: 'Get a specific order by ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'Order retrieved successfully',
    type: OrderResponseDto
  })
  findOne(
    @Param('id') consumerGroupId: string,
    @Param('orderId') orderId: string,
    @CurrentUser() user: any
  ): Promise<OrderResponseDto> {
    return this.ordersService.findOne(orderId, user.id);
  }
}

