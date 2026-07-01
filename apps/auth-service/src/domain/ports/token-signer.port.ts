export abstract class TokenSignerPort {
  abstract sign(payload: { sub: number; email: string }): Promise<string>;
}
