import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, Index } from 'typeorm';
import { Article } from './article.entity';

@Entity('article_price_history')
@Index(['articleId', 'changedAt'])
export class ArticlePriceHistory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'article_id' })
  articleId: string;

  @ManyToOne(() => Article, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'article_id' })
  article: Article;

  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'price_per_unit' })
  pricePerUnit: number;

  @CreateDateColumn({ type: 'timestamp', name: 'changed_at' })
  changedAt: Date;
}


