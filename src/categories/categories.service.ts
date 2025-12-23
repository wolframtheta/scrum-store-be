import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from './entities/category.entity';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
  ) {}

  async create(createCategoryDto: CreateCategoryDto): Promise<Category> {
    const category = this.categoryRepository.create(createCategoryDto);
    return this.categoryRepository.save(category);
  }

  async createBatch(createCategoryDtos: CreateCategoryDto[]): Promise<{ created: number; categories: Category[] }> {
    const categories = this.categoryRepository.create(createCategoryDtos);
    const saved = await this.categoryRepository.save(categories);
    return {
      created: saved.length,
      categories: saved,
    };
  }

  async findAll(consumerGroupId: string): Promise<Category[]> {
    return this.categoryRepository.find({
      where: { consumerGroupId },
      order: {
        category: 'ASC',
        product: 'ASC',
        variety: 'ASC',
      },
    });
  }

  async getCategoryTree(consumerGroupId: string): Promise<any[]> {
    const allRecords = await this.findAll(consumerGroupId);
    const tree: any[] = [];
    const seen = new Set<string>();

    allRecords.forEach(record => {
      // Afegir categoria (només si no s'ha afegit abans)
      const catKey = record.category;
      if (!seen.has(catKey)) {
        seen.add(catKey);
        tree.push({
          category: record.category,
          consumerGroupId: record.consumerGroupId
        });
      }

      // Afegir producte (només si existeix i no s'ha afegit abans)
      if (record.product) {
        const prodKey = `${record.category}|${record.product}`;
        if (!seen.has(prodKey)) {
          seen.add(prodKey);
          tree.push({
            category: record.category,
            product: record.product,
            consumerGroupId: record.consumerGroupId
          });
        }
      }

      // Afegir varietat (només si existeix)
      if (record.variety) {
        const varKey = `${record.category}|${record.product}|${record.variety}`;
        if (!seen.has(varKey)) {
          seen.add(varKey);
          tree.push({
            category: record.category,
            product: record.product,
            variety: record.variety,
            consumerGroupId: record.consumerGroupId
          });
        }
      }
    });

    return tree;
  }

  async findOne(id: string, consumerGroupId: string): Promise<Category> {
    const category = await this.categoryRepository.findOne({
      where: { id, consumerGroupId },
    });

    if (!category) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }

    return category;
  }

  async update(id: string, consumerGroupId: string, updateCategoryDto: UpdateCategoryDto): Promise<Category> {
    const category = await this.findOne(id, consumerGroupId);
    Object.assign(category, updateCategoryDto);
    return this.categoryRepository.save(category);
  }

  async remove(id: string, consumerGroupId: string): Promise<void> {
    const category = await this.findOne(id, consumerGroupId);
    await this.categoryRepository.remove(category);
  }

  async removeByCategory(consumerGroupId: string, category: string): Promise<{ deleted: number }> {
    const result = await this.categoryRepository.delete({
      consumerGroupId,
      category,
    });
    return { deleted: result.affected || 0 };
  }

  async removeByProduct(consumerGroupId: string, category: string, product: string): Promise<{ deleted: number }> {
    const result = await this.categoryRepository.delete({
      consumerGroupId,
      category,
      product,
    });
    return { deleted: result.affected || 0 };
  }

  async removeByVariety(consumerGroupId: string, category: string, product: string, variety: string): Promise<{ deleted: number }> {
    const result = await this.categoryRepository.delete({
      consumerGroupId,
      category,
      product,
      variety,
    });
    return { deleted: result.affected || 0 };
  }

  async updateCategoryName(consumerGroupId: string, oldName: string, newName: string): Promise<{ updated: number }> {
    const result = await this.categoryRepository.update(
      { consumerGroupId, category: oldName },
      { category: newName }
    );
    return { updated: result.affected || 0 };
  }

  async updateProductName(consumerGroupId: string, category: string, oldName: string, newName: string): Promise<{ updated: number }> {
    const result = await this.categoryRepository.update(
      { consumerGroupId, category, product: oldName },
      { product: newName }
    );
    return { updated: result.affected || 0 };
  }

  async updateVarietyName(consumerGroupId: string, category: string, product: string, oldName: string, newName: string): Promise<{ updated: number }> {
    const result = await this.categoryRepository.update(
      { consumerGroupId, category, product, variety: oldName },
      { variety: newName }
    );
    return { updated: result.affected || 0 };
  }

  async findUniqueCategories(consumerGroupId: string): Promise<string[]> {
    const categories = await this.categoryRepository
      .createQueryBuilder('category')
      .select('DISTINCT category.category', 'category')
      .where('category.consumerGroupId = :consumerGroupId', { consumerGroupId })
      .orderBy('category.category', 'ASC')
      .getRawMany();

    return categories.map(c => c.category);
  }

  async findProductsByCategory(consumerGroupId: string, category: string): Promise<string[]> {
    const products = await this.categoryRepository
      .createQueryBuilder('category')
      .select('DISTINCT category.product', 'product')
      .where('category.consumerGroupId = :consumerGroupId', { consumerGroupId })
      .andWhere('category.category = :category', { category })
      .andWhere('category.product IS NOT NULL')
      .orderBy('category.product', 'ASC')
      .getRawMany();

    return products.map(p => p.product).filter(Boolean);
  }

  async findVarietiesByProduct(consumerGroupId: string, category: string, product: string): Promise<string[]> {
    const varieties = await this.categoryRepository
      .createQueryBuilder('category')
      .select('DISTINCT category.variety', 'variety')
      .where('category.consumerGroupId = :consumerGroupId', { consumerGroupId })
      .andWhere('category.category = :category', { category })
      .andWhere('category.product = :product', { product })
      .andWhere('category.variety IS NOT NULL')
      .orderBy('category.variety', 'ASC')
      .getRawMany();

    return varieties.map(v => v.variety).filter(Boolean);
  }
}

