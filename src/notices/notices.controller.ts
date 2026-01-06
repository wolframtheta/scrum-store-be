import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  UseInterceptors,
  UploadedFile,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { NoticesService } from './notices.service';
import { CreateNoticeDto } from './dto/create-notice.dto';
import { UpdateNoticeDto } from './dto/update-notice.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { IsMemberGuard } from '../core/guards/is-member.guard';
import { IsManagerGuard } from '../core/guards/is-manager.guard';
import { IsManagerOrPreparerGuard } from '../core/guards/is-manager-or-preparer.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { FileInterceptor } from '@nestjs/platform-express';
import { StorageService } from '../storage/storage.service';

@ApiTags('notices')
@ApiBearerAuth('JWT-auth')
@Controller('notices')
@UseGuards(JwtAuthGuard)
export class NoticesController {
  constructor(
    private readonly noticesService: NoticesService,
    private readonly storageService: StorageService,
  ) {}

  @Post()
  @UseGuards(IsManagerOrPreparerGuard)
  @ApiOperation({ summary: 'Crear un nou avís (gestors i preparadors)' })
  @ApiResponse({ status: 201, description: 'Avís creat correctament' })
  @ApiResponse({ status: 403, description: 'No ets gestor ni preparador del grup' })
  create(
    @Body() createNoticeDto: CreateNoticeDto,
    @CurrentUser('email') userEmail: string,
  ) {
    return this.noticesService.create(createNoticeDto, userEmail);
  }

  @Get('group/:groupId')
  @UseGuards(IsMemberGuard)
  @ApiOperation({ summary: 'Obtenir avisos d\'un grup amb paginació' })
  @ApiResponse({ status: 200, description: 'Llista d\'avisos' })
  @ApiResponse({ status: 403, description: 'No ets membre del grup' })
  findAllByGroup(
    @Param('groupId', ParseUUIDPipe) groupId: string,
    @CurrentUser('email') userEmail: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 20;

    return this.noticesService.findAllByGroup(
      groupId,
      userEmail,
      pageNum,
      limitNum,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtenir un avís per ID' })
  @ApiResponse({ status: 200, description: 'Avís trobat' })
  @ApiResponse({ status: 404, description: 'Avís no trobat' })
  @ApiResponse({ status: 403, description: 'No ets membre del grup' })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('email') userEmail: string,
  ) {
    // Obtenir l'avís per obtenir el groupId i validar amb el guard
    const notice = await this.noticesService.findOne(id, userEmail);
    return notice;
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualitzar un avís (només el creador)' })
  @ApiResponse({ status: 200, description: 'Avís actualitzat' })
  @ApiResponse({ status: 403, description: 'No ets el creador de l\'avís' })
  @ApiResponse({ status: 404, description: 'Avís no trobat' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateNoticeDto: UpdateNoticeDto,
    @CurrentUser('email') userEmail: string,
  ) {
    return this.noticesService.update(id, updateNoticeDto, userEmail);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar un avís (creador o gestor)' })
  @ApiResponse({ status: 200, description: 'Avís eliminat' })
  @ApiResponse({
    status: 403,
    description: 'No ets el creador ni gestor del grup',
  })
  @ApiResponse({ status: 404, description: 'Avís no trobat' })
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('email') userEmail: string,
  ) {
    return this.noticesService.remove(id, userEmail);
  }

  @Post(':id/image')
  @UseInterceptors(FileInterceptor('image'))
  @ApiOperation({ summary: 'Pujar imatge a un avís (només el creador)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        image: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Imatge pujada correctament' })
  @ApiResponse({ status: 403, description: 'No ets el creador de l\'avís' })
  @ApiResponse({ status: 404, description: 'Avís no trobat' })
  async uploadImage(
    @Param('id', ParseUUIDPipe) id: string,
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser('email') userEmail: string,
  ) {
    const imageUrl = await this.storageService.uploadFile(
      file,
      `notices/${id}`,
    );

    return this.noticesService.updateImage(id, imageUrl, userEmail);
  }
}
