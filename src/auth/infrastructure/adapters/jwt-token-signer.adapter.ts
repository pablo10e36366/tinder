import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { TokenSignerPort } from '../../domain/ports/token-signer.port';

@Injectable()
export class JwtTokenSignerAdapter implements TokenSignerPort {
  constructor(private readonly jwtService: JwtService) {}

  async sign(payload: { sub: number; email: string }): Promise<string> {
    return await this.jwtService.signAsync(payload);
  }
}
