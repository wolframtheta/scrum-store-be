import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Supplier } from './entities/supplier.entity';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { UpdateSupplierDto } from './dto/update-supplier.dto';

@Injectable()
export class SuppliersService {
  constructor(
    @InjectRepository(Supplier)
    private readonly supplierRepository: Repository<Supplier>,
  ) {}

  async create(createSupplierDto: CreateSupplierDto): Promise<Supplier> {
    const supplier = this.supplierRepository.create(createSupplierDto);
    return this.supplierRepository.save(supplier);
  }

  async findAll(consumerGroupId: string, activeOnly: boolean = true): Promise<Supplier[]> {
    const where: any = { consumerGroupId };
    if (activeOnly) {
      where.isActive = true;
    }

    return this.supplierRepository.find({
      where,
      order: { name: 'ASC' },
    });
  }

  async findOne(id: string, consumerGroupId: string): Promise<Supplier> {
    const supplier = await this.supplierRepository.findOne({
      where: { id, consumerGroupId },
    });

    if (!supplier) {
      throw new NotFoundException(`Supplier with ID ${id} not found`);
    }

    return supplier;
  }

  async update(id: string, consumerGroupId: string, updateSupplierDto: UpdateSupplierDto): Promise<Supplier> {
    const supplier = await this.findOne(id, consumerGroupId);
    Object.assign(supplier, updateSupplierDto);
    return this.supplierRepository.save(supplier);
  }

  async remove(id: string, consumerGroupId: string): Promise<void> {
    const supplier = await this.findOne(id, consumerGroupId);
    await this.supplierRepository.remove(supplier);
  }

  async toggleActive(id: string, consumerGroupId: string): Promise<Supplier> {
    const supplier = await this.findOne(id, consumerGroupId);
    supplier.isActive = !supplier.isActive;
    return this.supplierRepository.save(supplier);
  }
}

