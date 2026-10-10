import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule, JwtModuleOptions } from '@nestjs/jwt';
import { ThrottlerModule } from '@nestjs/throttler';

import { UsersModule } from '../users/users.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';

type DuracaoToken = NonNullable<JwtModuleOptions['signOptions']>['expiresIn'];

// @Module({
//   imports: [
//     UsersModule,
//     ThrottlerModule.forRoot([{ name: 'login', limit: 5, ttl: 60_000 }]),
//     // registerAsync porque o segredo vem do ConfigService, que so existe
//     // depois que o ConfigModule terminou de validar o .env.
//     JwtModule.registerAsync({
//       imports: [ConfigModule],
//       inject: [ConfigService],
//       useFactory: (config: ConfigService): JwtModuleOptions => ({
//         secret: config.getOrThrow<string>('JWT_SECRET'),
//         signOptions: {
//           // A tipagem do jsonwebtoken exige um literal como '1h' ou '15m',
//           // nao uma string qualquer. Como o valor vem do .env, o TypeScript
//           // so ve `string` e recusa.
//           //
//           // O cast e seguro porque env.validation.ts ja rejeitou, no boot,
//           // qualquer JWT_EXPIRES_IN fora do padrao /^\d+(ms|s|m|h|d)$/.
//           expiresIn: config.getOrThrow<string>('JWT_EXPIRES_IN') as DuracaoToken,
//         },
//       }),
//     }),
//   ],
//   controllers: [AuthController],
//   providers: [
//     AuthService,
//     // Os dois guards valem para a aplicacao inteira. A ordem importa: o
//     // JwtAuthGuard precisa rodar antes, porque e ele quem popula request.user
//     // que o RolesGuard vai ler.
//     { provide: APP_GUARD, useClass: JwtAuthGuard },
//     { provide: APP_GUARD, useClass: RolesGuard },
//   ],
// })
// export class AuthModule {}

@Module({
  imports: [
    UsersModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService): JwtModuleOptions => ({
        secret: config.getOrThrow<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: config.getOrThrow<string>('JWT_EXPIRES_IN') as DuracaoToken,
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AuthModule {}