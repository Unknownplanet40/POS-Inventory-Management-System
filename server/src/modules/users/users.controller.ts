import { Controller, Get, Put, Param, Delete, UseGuards, Body } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@Controller('api/users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get()
  async getAllUsers() {
    return this.usersService.getAllUsers();
  }

  @Get(':id')
  async getUserById(@Param('id') id: string) {
    return this.usersService.getUserById(id);
  }

  @Delete(':id')
  async deleteUser(@Param('id') id: string) {
    await this.usersService.deleteUser(id);
    return { message: 'User deleted successfully' };
  }

  @Put(':id')
  async updateUser(
    @Param('id') id: string,
    @Body() updateData: { role?: 'admin' | 'cashier'; password?: string },
  ) {
    return this.usersService.updateUser(id, updateData);
  }

  @Put(':id/reactivate')
  async reactivateUser(@Param('id') id: string) {
    return this.usersService.reactivateUser(id);
  }
}
