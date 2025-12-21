import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Sale } from '../../entities/sale.entity';
import { CreateSaleDto } from './dto/sale.dto';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class SalesService {
  constructor(
    @InjectRepository(Sale)
    private saleRepository: Repository<Sale>,
  ) {}

  async createSale(createSaleDto: CreateSaleDto) {
    const sale = this.saleRepository.create({
      id: uuidv4(),
      ...createSaleDto,
      createdAt: new Date(),
    });

    return this.saleRepository.save(sale);
  }

  async getAllSales() {
    return this.saleRepository.find();
  }

  async getSalesByDateRange(startDate: Date, endDate: Date) {
    return this.saleRepository
      .createQueryBuilder('sale')
      .where('sale.createdAt >= :startDate', { startDate })
      .andWhere('sale.createdAt <= :endDate', { endDate })
      .orderBy('sale.createdAt', 'DESC')
      .getMany();
  }

  async getSalesByCashier(cashierId: string) {
    return this.saleRepository.find({
      where: { cashierId },
      order: { createdAt: 'DESC' },
    });
  }

  async clearAllSales() {
    return this.saleRepository.clear();
  }
}
