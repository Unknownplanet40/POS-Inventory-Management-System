import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../entities/user.entity';
import * as crypto from 'crypto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async getAllUsers() {
    return this.userRepository.find({
      select: ['id', 'username', 'role', 'isActive', 'createdAt', 'lastLoginAt', 'activeSessionToken'],
    });
  }

  async getUserById(id: string) {
    return this.userRepository.findOne({
      where: { id },
      select: ['id', 'username', 'role', 'isActive', 'createdAt', 'lastLoginAt', 'activeSessionToken'],
    });
  }

  async deleteUser(id: string) {
    // Soft delete - set isActive to false instead of deleting
    await this.userRepository.update(id, { isActive: false });
  }

  async reactivateUser(id: string) {
    await this.userRepository.update(id, { isActive: true });
    return this.getUserById(id);
  }

  async updateUser(id: string, updateData: { role?: 'admin' | 'cashier'; password?: string }) {
    const updates: any = {};
    
    if (updateData.role) {
      updates.role = updateData.role;
    }
    
    if (updateData.password) {
      // Hash password using SHA256
      updates.passwordHash = crypto.createHash('sha256').update(updateData.password).digest('hex');
    }
    
    if (Object.keys(updates).length === 0) {
      return this.getUserById(id);
    }
    
    await this.userRepository.update(id, updates);
    return this.getUserById(id);
  }
}
