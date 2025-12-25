import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Producer } from './entities/producer.entity';
import { CreateProducerDto } from './dto/create-producer.dto';
import { UpdateProducerDto } from './dto/update-producer.dto';

@Injectable()
export class ProducersService {
  constructor(
    @InjectRepository(Producer)
    private readonly producerRepository: Repository<Producer>,
  ) {}

  async create(createProducerDto: CreateProducerDto): Promise<Producer> {
    // Filtrar null values para TypeORM
    const dto = { ...createProducerDto };
    if (dto.supplierId === null) {
      delete dto.supplierId;
    }
    const producer = this.producerRepository.create(dto);
    return this.producerRepository.save(producer);
  }

  async findAll(consumerGroupId: string, activeOnly: boolean = true): Promise<Producer[]> {
    const where: any = { consumerGroupId };
    if (activeOnly) {
      where.isActive = true;
    }

    return this.producerRepository.find({
      where,
      relations: ['supplier'],
      order: { name: 'ASC' },
    });
  }

  async findOne(id: string, consumerGroupId: string): Promise<Producer> {
    const producer = await this.producerRepository.findOne({
      where: { id, consumerGroupId },
      relations: ['supplier'],
    });

    if (!producer) {
      throw new NotFoundException(`Producer with ID ${id} not found`);
    }

    return producer;
  }

  async update(id: string, consumerGroupId: string, updateProducerDto: UpdateProducerDto): Promise<Producer> {
    const producer = await this.findOne(id, consumerGroupId);
    // Filtrar null values para TypeORM
    const dto = { ...updateProducerDto };
    if (dto.supplierId === null) {
      delete dto.supplierId;
    }
    Object.assign(producer, dto);
    return this.producerRepository.save(producer);
  }

  async remove(id: string, consumerGroupId: string): Promise<void> {
    const producer = await this.findOne(id, consumerGroupId);
    await this.producerRepository.remove(producer);
  }

  async toggleActive(id: string, consumerGroupId: string): Promise<Producer> {
    const producer = await this.findOne(id, consumerGroupId);
    producer.isActive = !producer.isActive;
    return this.producerRepository.save(producer);
  }
}

