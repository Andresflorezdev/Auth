import {
  Injectable,
  ConflictException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { User, UserDocument } from './schemas/user.schema';
import { Model } from 'mongoose';
import { CreateUserDto } from './dto/create-user.dto';
import * as bcrypt from 'bcrypt';
import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
} from 'crypto';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectModel } from '@nestjs/mongoose';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
  ) {}

  private getRecoveryKey(): Buffer {
    const rawSecret =
      process.env.PASSWORD_RECOVERY_SECRET ||
      process.env.JWT_SECRET ||
      'super-secret-key';
    return createHash('sha256').update(rawSecret).digest();
  }

  buildPasswordBackup(password: string): string {
    try {
      const iv = randomBytes(16);
      const cipher = createCipheriv('aes-256-cbc', this.getRecoveryKey(), iv);
      const encrypted = Buffer.concat([
        cipher.update(password, 'utf8'),
        cipher.final(),
      ]);
      return `${iv.toString('base64')}:${encrypted.toString('base64')}`;
    } catch {
      throw new InternalServerErrorException(
        'No se pudo proteger la contraseña recuperable',
      );
    }
  }

  private decodePasswordBackup(encoded: string): string {
    const [ivB64, dataB64] = encoded.split(':');
    if (!ivB64 || !dataB64) {
      throw new InternalServerErrorException(
        'Formato de contraseña recuperable inválido',
      );
    }

    try {
      const iv = Buffer.from(ivB64, 'base64');
      const encrypted = Buffer.from(dataB64, 'base64');
      const decipher = createDecipheriv(
        'aes-256-cbc',
        this.getRecoveryKey(),
        iv,
      );
      return Buffer.concat([
        decipher.update(encrypted),
        decipher.final(),
      ]).toString('utf8');
    } catch {
      throw new InternalServerErrorException(
        'No se pudo recuperar la contraseña',
      );
    }
  }

  async create(dto: CreateUserDto): Promise<UserDocument> {
    const existing = await this.userModel.findOne({ email: dto.email });
    if (existing) throw new ConflictException('El email ya esta registrado');

    const hashed = await bcrypt.hash(dto.password, 12);
    return new this.userModel({
      ...dto,
      password: hashed,
      passwordBackup: this.buildPasswordBackup(dto.password),
    }).save();
  }

  async createSeed(dto: CreateUserDto): Promise<UserDocument> {
    const existing = await this.userModel.findOne({ email: dto.email });
    if (existing) {
      if (existing.isSeeded && !existing.isActive) {
        const hashed = await bcrypt.hash(dto.password, 12);
        const reactivated = await this.userModel.findByIdAndUpdate(
          existing._id,
          {
            name: dto.name,
            role: dto.role,
            password: hashed,
            passwordBackup: this.buildPasswordBackup(dto.password),
            isSeeded: true,
            isActive: true,
            refreshToken: null,
            $inc: { tokenVersion: 1 },
          },
          { new: true },
        );
        if (reactivated) return reactivated;
      }
      return existing;
    }

    const hashed = await bcrypt.hash(dto.password, 12);
    return new this.userModel({
      ...dto,
      password: hashed,
      passwordBackup: this.buildPasswordBackup(dto.password),
      isSeeded: true,
    }).save();
  }

  async findAll(): Promise<UserDocument[]> {
    return this.userModel
      .find({ isActive: true })
      .select('-password -refreshToken')
      .exec();
  }

  async findOne(id: string): Promise<UserDocument> {
    const user = await this.userModel
      .findOne({ _id: id, isActive: true })
      .select('-password -refreshToken');
    if (!user) throw new NotFoundException(`Usuario ${id} no encontrado`);
    return user;
  }

  async findByEmail(email: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ email: email.toLowerCase() });
  }

  async update(id: string, dto: UpdateUserDto): Promise<UserDocument> {
    const user = await this.userModel
      .findByIdAndUpdate(id, dto, { new: true })
      .select('-password -refreshToken');
    if (!user) throw new NotFoundException(`Usuario ${id} no encontrado`);
    return user;
  }

  async remove(id: string): Promise<void> {
    const result = await this.userModel.findByIdAndUpdate(id, {
      isActive: false,
      refreshToken: null,
      $inc: { tokenVersion: 1 },
    });
    if (!result) throw new NotFoundException(`Usuario ${id} no encontrado`);
  }

  async updateRefreshToken(id: string, token: string | null): Promise<void> {
    await this.userModel.findByIdAndUpdate(id, { refreshToken: token });
  }

  async invalidateUserSessions(id: string): Promise<void> {
    await this.userModel.findByIdAndUpdate(id, {
      refreshToken: null,
      $inc: { tokenVersion: 1 },
    });
  }

  async getReadablePasswordByEmail(email: string): Promise<string | null> {
    const user = await this.userModel.findOne({
      email: email.toLowerCase(),
      isActive: true,
    });

    if (!user || typeof user.passwordBackup !== 'string') return null;
    return this.decodePasswordBackup(user.passwordBackup);
  }

  async validatePassword(plain: string, hashed: string): Promise<boolean> {
    return bcrypt.compare(plain, hashed);
  }

  async deleteSeeded(): Promise<{ deleted: number }> {
    const result = await this.userModel.updateMany(
      { isSeeded: true, isActive: true },
      {
        $set: { isActive: false, refreshToken: null },
        $inc: { tokenVersion: 1 },
      },
    );
    return { deleted: result.modifiedCount };
  }

  async countSeeded(): Promise<number> {
    return this.userModel.countDocuments({ isSeeded: true, isActive: true });
  }

  getConnectionInfo() {
    const stateMap: Record<number, string> = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting',
    };

    const { name, host, port, readyState } = this.userModel.db;

    return {
      database: name,
      host,
      port,
      readyState,
      state: stateMap[readyState] || 'unknown',
    };
  }
}
