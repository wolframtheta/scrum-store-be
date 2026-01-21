import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Order } from './order.entity';
import { Article } from '../../articles/entities/article.entity';
import { Period } from '../../periods/entities/period.entity';

@Entity('order_items')
export class OrderItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'order_id' })
  orderId: string;

  @ManyToOne(() => Order, order => order.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'order_id' })
  order: Order;

  @Column({ type: 'uuid', name: 'article_id', nullable: true })
  articleId: string | null;

  @ManyToOne(() => Article, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'article_id' })
  article: Article | null;

  @Column({ type: 'uuid', name: 'period_id', nullable: true })
  periodId: string | null;

  @ManyToOne(() => Period, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'period_id' })
  period: Period | null;

  @Column({ type: 'decimal', precision: 10, scale: 3 })
  quantity: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'price_per_unit' })
  pricePerUnit: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'total_price' })
  totalPrice: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'paid_amount', default: 0 })
  paidAmount: number;
}

