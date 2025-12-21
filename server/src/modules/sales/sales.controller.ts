import { Controller, Get, Post, Body, UseGuards, Query, Param, Delete } from '@nestjs/common';
import { SalesService } from './sales.service';
import { CreateSaleDto } from './dto/sale.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@Controller('api/sales')
@UseGuards(JwtAuthGuard)
export class SalesController {
  constructor(private salesService: SalesService) {}

  @Post()
  async createSale(@Body() createSaleDto: CreateSaleDto) {
    return this.salesService.createSale(createSaleDto);
  }

  @Get()
  async getAllSales(@Query('startDate') startDate?: string, @Query('endDate') endDate?: string) {
    if (startDate && endDate) {
      return this.salesService.getSalesByDateRange(new Date(startDate), new Date(endDate));
    }
    return this.salesService.getAllSales();
  }

  @Get('cashier/:cashierId')
  async getSalesByCashier(@Param('cashierId') cashierId: string) {
    return this.salesService.getSalesByCashier(cashierId);
  }

  @Delete('clear')
  async clearAllSales() {
    await this.salesService.clearAllSales();
    return { message: 'All sales data cleared successfully' };
  }
}
