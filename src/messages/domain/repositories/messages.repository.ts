import type { CreateMessageDto } from '../../dto/create-message.dto';
import type { Message } from '../entities/message';

export abstract class MessagesRepository {
  abstract create(
    senderId: number,
    createMessageDto: CreateMessageDto,
  ): Promise<Message>;

  abstract findByMatchId(matchId: number): Promise<Message[]>;
}
