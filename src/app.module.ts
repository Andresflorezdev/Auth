import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { SeederModule } from './seeder/seeder.module';

@Module({
  imports: [AuthModule, UsersModule, SeederModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
