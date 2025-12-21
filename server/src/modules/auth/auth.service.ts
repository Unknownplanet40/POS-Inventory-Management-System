import { Injectable, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User } from '../../entities/user.entity';
import { RegisterDto, LoginDto } from './dto/auth.dto';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto) {
    const existingUser = await this.userRepository.findOne({
      where: { username: registerDto.username },
    });

    if (existingUser) {
      throw new BadRequestException('Username already exists');
    }

    const hashedPassword = await bcrypt.hash(registerDto.password, 10);

    const user = this.userRepository.create({
      id: uuidv4(),
      username: registerDto.username,
      passwordHash: hashedPassword,
      role: registerDto.role,
      isActive: true,
      createdAt: new Date(),
    });

    await this.userRepository.save(user);

    return {
      id: user.id,
      username: user.username,
      role: user.role,
      createdAt: user.createdAt,
    };
  }

  async login(loginDto: LoginDto) {
    const user = await this.userRepository.findOne({
      where: { username: loginDto.username },
    });

    if (!user) {
      throw new BadRequestException('Invalid username or password');
    }

    if (!user.isActive) {
      throw new BadRequestException('This account has been deactivated. Contact an administrator.');
    }

    const isPasswordValid = await bcrypt.compare(loginDto.password, user.passwordHash);

    if (!isPasswordValid) {
      throw new BadRequestException('Invalid username or password');
    }

    // Generate unique session ID
    const sessionId = uuidv4();
    
    const token = this.jwtService.sign({
      sub: user.id,
      username: user.username,
      role: user.role,
      sessionId: sessionId,
    });

    // Update user's active session - this invalidates all previous sessions
    user.activeSessionToken = token;
    user.lastLoginAt = new Date();
    await this.userRepository.save(user);

    console.log(`[LOGIN] User ${user.username} logged in. Token: ${token.substring(0, 20)}...`);

    return {
      token,
      user: {
        userId: user.id,
        username: user.username,
        role: user.role,
        loginAt: new Date().toISOString(),
      },
    };
  }

  async validateSession(userId: string, token: string): Promise<boolean> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user || !user.isActive) {
      console.log(`[SESSION] User ${userId} not found or inactive`);
      return false;
    }

    // Check if the token matches the active session
    const isValid = user.activeSessionToken === token;
    
    if (!isValid) {
      console.log(`[SESSION] Token mismatch for user ${user.username}`);
      console.log(`  Stored: ${user.activeSessionToken?.substring(0, 20)}...`);
      console.log(`  Provided: ${token.substring(0, 20)}...`);
    } else {
      console.log(`[SESSION] Valid session for user ${user.username}`);
    }

    return isValid;
  }

  async logout(userId: string): Promise<void> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (user) {
      user.activeSessionToken = null;
      await this.userRepository.save(user);
      console.log(`[LOGOUT] User ${user.username} logged out`);
    }
  }
}
