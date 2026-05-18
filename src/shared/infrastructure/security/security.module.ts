import { Module } from '@nestjs/common';
import { PasswordHasherPort } from '../../application/ports/password-hasher.port';
import { BcryptPasswordHasherAdapter } from './bcrypt-password-hasher.adapter';

@Module({
  providers: [
    BcryptPasswordHasherAdapter,
    {
      provide: PasswordHasherPort,
      useExisting: BcryptPasswordHasherAdapter,
    },
  ],
  exports: [PasswordHasherPort],
})
export class SecurityModule {}
