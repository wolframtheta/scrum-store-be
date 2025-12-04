import { Exclude, Expose, Type } from 'class-transformer';

@Exclude()
class AuthorDto {
  @Expose()
  email: string;

  @Expose()
  firstName: string;

  @Expose()
  lastName: string;

  @Expose()
  profileImageUrl?: string;
}

@Exclude()
export class NoticeResponseDto {
  @Expose()
  id: string;

  @Expose()
  content: string;

  @Expose()
  imageUrl?: string;

  @Expose()
  @Type(() => AuthorDto)
  author: AuthorDto;

  @Expose()
  groupId: string;

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;
}

