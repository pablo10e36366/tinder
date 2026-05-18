export class CreateInteractionDto {
  targetUserId!: number;
  type!: 'LIKE' | 'DISLIKE' | 'SUPERLIKE';
}
