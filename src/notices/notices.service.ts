import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateNoticeDto } from './dto/create-notice.dto';
import { UpdateNoticeDto } from './dto/update-notice.dto';
import { Notice } from './entities/notice.entity';
import { plainToInstance } from 'class-transformer';
import { NoticeResponseDto } from './dto/notice-response.dto';
import { ConsumerGroupsService } from '../consumer-groups/consumer-groups.service';
import { UsersService } from '../users/users.service';

@Injectable()
export class NoticesService {
  constructor(
    @InjectRepository(Notice)
    private noticesRepository: Repository<Notice>,
    private consumerGroupsService: ConsumerGroupsService,
    private usersService: UsersService,
  ) {}

  async create(
    createNoticeDto: CreateNoticeDto,
    authorEmail: string,
  ): Promise<NoticeResponseDto> {
    // La validació de gestor es fa al guard IsManagerGuard
    const notice = this.noticesRepository.create({
      ...createNoticeDto,
      authorEmail,
    });

    const savedNotice = await this.noticesRepository.save(notice);

    // Obtenir les dades de l'usuari per construir l'objecte author
    const author = await this.usersService.findByEmailOrFail(authorEmail);
    const noticeWithAuthor = {
      ...savedNotice,
      author: {
        email: author.email,
        firstName: author.name,
        lastName: author.surname,
        profileImageUrl: author.profileImage,
      },
    };

    return plainToInstance(NoticeResponseDto, noticeWithAuthor, {
      excludeExtraneousValues: true,
    });
  }

  async findAllByGroup(
    groupId: string,
    userEmail: string,
    page: number = 1,
    limit: number = 20,
  ): Promise<{ notices: NoticeResponseDto[]; total: number; pages: number }> {
    // La validació de membre es fa al guard IsMemberGuard
    const [notices, total] = await this.noticesRepository.findAndCount({
      where: { groupId },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    // Obtenir les dades dels autors per cada avís
    const noticesWithAuthors = await Promise.all(
      notices.map(async (notice) => {
        const author = await this.usersService.findByEmailOrFail(notice.authorEmail);
        return {
          ...notice,
          author: {
            email: author.email,
            firstName: author.name,
            lastName: author.surname,
            profileImageUrl: author.profileImage,
          },
        };
      }),
    );

    const noticesDto = plainToInstance(NoticeResponseDto, noticesWithAuthors, {
      excludeExtraneousValues: true,
    });

    return {
      notices: noticesDto,
      total,
      pages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string, userEmail: string): Promise<NoticeResponseDto> {
    const notice = await this.noticesRepository.findOne({
      where: { id },
    });

    if (!notice) {
      throw new NotFoundException('Notice not found');
    }

    // Verificar que l'usuari és membre del grup
    const isMember = await this.consumerGroupsService.isMember(
      userEmail,
      notice.groupId,
    );

    if (!isMember) {
      throw new ForbiddenException('You are not a member of this group');
    }

    // Obtenir les dades de l'usuari per construir l'objecte author
    const author = await this.usersService.findByEmailOrFail(notice.authorEmail);
    const noticeWithAuthor = {
      ...notice,
      author: {
        email: author.email,
        firstName: author.name,
        lastName: author.surname,
        profileImageUrl: author.profileImage,
      },
    };

    return plainToInstance(NoticeResponseDto, noticeWithAuthor, {
      excludeExtraneousValues: true,
    });
  }

  async update(
    id: string,
    updateNoticeDto: UpdateNoticeDto,
    userEmail: string,
  ): Promise<NoticeResponseDto> {
    const notice = await this.noticesRepository.findOne({
      where: { id },
    });

    if (!notice) {
      throw new NotFoundException('Notice not found');
    }

    // Només el creador de l'avís pot actualitzar-lo
    if (notice.authorEmail !== userEmail) {
      throw new ForbiddenException('You can only update your own notices');
    }

    Object.assign(notice, updateNoticeDto);
    const updatedNotice = await this.noticesRepository.save(notice);

    // Obtenir les dades de l'usuari per construir l'objecte author
    const author = await this.usersService.findByEmailOrFail(updatedNotice.authorEmail);
    const noticeWithAuthor = {
      ...updatedNotice,
      author: {
        email: author.email,
        firstName: author.name,
        lastName: author.surname,
        profileImageUrl: author.profileImage,
      },
    };

    return plainToInstance(NoticeResponseDto, noticeWithAuthor, {
      excludeExtraneousValues: true,
    });
  }

  async remove(id: string, userEmail: string): Promise<void> {
    const notice = await this.noticesRepository.findOne({
      where: { id },
    });

    if (!notice) {
      throw new NotFoundException('Notice not found');
    }

    // Verificar si és el creador o un gestor del grup
    const isAuthor = notice.authorEmail === userEmail;
    const isManager = await this.consumerGroupsService.isManager(
      userEmail,
      notice.groupId,
    );

    if (!isAuthor && !isManager) {
      throw new ForbiddenException(
        'You can only delete your own notices or you must be a manager',
      );
    }

    await this.noticesRepository.remove(notice);
  }

  async updateImage(
    id: string,
    imageUrl: string,
    userEmail: string,
  ): Promise<NoticeResponseDto> {
    const notice = await this.noticesRepository.findOne({
      where: { id },
    });

    if (!notice) {
      throw new NotFoundException('Notice not found');
    }

    // Només el creador de l'avís pot actualitzar la imatge
    if (notice.authorEmail !== userEmail) {
      throw new ForbiddenException('You can only update your own notices');
    }

    notice.imageUrl = imageUrl;
    const updatedNotice = await this.noticesRepository.save(notice);

    // Obtenir les dades de l'usuari per construir l'objecte author
    const author = await this.usersService.findByEmailOrFail(updatedNotice.authorEmail);
    const noticeWithAuthor = {
      ...updatedNotice,
      author: {
        email: author.email,
        firstName: author.name,
        lastName: author.surname,
        profileImageUrl: author.profileImage,
      },
    };

    return plainToInstance(NoticeResponseDto, noticeWithAuthor, {
      excludeExtraneousValues: true,
    });
  }
}
