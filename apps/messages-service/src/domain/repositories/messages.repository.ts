import type { CreateMessageDto } from '../../dto/create-message.dto';

export interface StoredMessage {
  id: number;
  matchId: number;
  senderId: number;
  content: string;
  createdAt: Date;
}

export abstract class MessagesRepository {
  abstract create(
    senderId: number,
    createMessageDto: CreateMessageDto,
  ): Promise<StoredMessage>;

  abstract findByMatchId(matchId: number): Promise<StoredMessage[]>;
}
