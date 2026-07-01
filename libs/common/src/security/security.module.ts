import { Module } from '@nestjs/common';

import { BcryptPasswordHasherAdapter } from './bcrypt-password-hasher.adapter';
import { PasswordHasherPort } from './password-hasher.port';

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
