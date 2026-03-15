import { Injectable, Logger } from '@nestjs/common';
import { CreateUserDto } from 'src/users/dto/create-user.dto';
import { UserRole } from 'src/users/schemas/user.schema';
import { UsersService } from 'src/users/users.service';

const SEED_USERS: CreateUserDto[] = [
  {
    name: 'Admin User',
    email: 'admin@nestapi.com',
    password: 'Admin1234',
    role: UserRole.ADMIN,
  },
  {
    name: 'John User',
    email: 'john@nestapi.com',
    password: 'User1234',
    role: UserRole.USER,
  },
  {
    name: 'Jane User',
    email: 'jane@nestapi.com',
    password: 'User1234',
    role: UserRole.USER,
  },
];

@Injectable()
export class SeederService {
  private readonly logger = new Logger(SeederService.name);

  constructor(private readonly usersService: UsersService) {}

  async runSeeder() {
    let created = 0;

    for (const userData of SEED_USERS) {
      try {
        const existing = await this.usersService.findByEmail(userData.email);
        if (!existing) {
          await this.usersService.createSeed(userData);
          created++;
          this.logger.log(`Created: ${userData.email}`);
        } else {
          this.logger.warn(`Already exists: ${userData.email}`);
        }
      } catch (e: unknown) {
        const errorMessage =
          e instanceof Error ? e.message : 'Unknown seeder error';
        this.logger.error(`Failed: ${userData.email} - ${errorMessage}`);
      }
    }

    return {
      message: `Seeder ejecutado: ${created} usuarios creados`,
      created,
      credentials: {
        admin: { email: 'admin@nestapi.com', password: 'Admin1234' },
        users: SEED_USERS.filter((u) => u.role === UserRole.USER).map((u) => ({
          email: u.email,
          password: u.password,
        })),
      },
    };
  }
  async crearSeeded() {
    const result = await this.usersService.deleteSeeded();
    this.logger.log(`Deactivated ${result.deleted} seeded records`);
    return {
      deleted: result.deleted,
      message:
        result.deleted > 0
          ? `Se desactivaron ${result.deleted} registros del seeder`
          : 'No habia registros del seeder',
    };
  }

  async getStatus() {
    const count = await this.usersService.countSeeded();
    const effectiveMongoUrl =
      process.env.MONGO_URL || 'mongodb://localhost:27017/nest-auth';

    return {
      seededRecordsInDB: count,
      effectiveMongoUrl,
      connection: this.usersService.getConnectionInfo(),
      availableSeeds: SEED_USERS.map(({ name, email, role }) => ({
        name,
        email,
        role,
      })),
    };
  }
}
