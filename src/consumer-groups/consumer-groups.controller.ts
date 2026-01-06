import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Patch, 
  Param, 
  Delete, 
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Request
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { ConsumerGroupsService } from './consumer-groups.service';
import { CreateConsumerGroupDto } from './dto/create-consumer-group.dto';
import { UpdateConsumerGroupDto } from './dto/update-consumer-group.dto';
import { JoinGroupDto } from './dto/join-group.dto';
import { UpdateMemberRoleDto } from './dto/update-member-role.dto';
import { CreateInvitationDto } from './dto/create-invitation.dto';
import { ConsumerGroupResponseDto } from './dto/consumer-group-response.dto';
import { ConsumerGroupWithRoleResponseDto } from './dto/consumer-group-with-role-response.dto';
import { GroupInvitation } from './entities/group-invitation.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { IsManagerGuard } from '../core/guards/is-manager.guard';
import { IsMemberGuard } from '../core/guards/is-member.guard';
import { StorageService } from '../storage/storage.service';

@ApiTags('consumer-groups')
@Controller('consumer-groups')
@ApiBearerAuth('JWT-auth')
export class ConsumerGroupsController {
  constructor(
    private readonly consumerGroupsService: ConsumerGroupsService,
    private readonly storageService: StorageService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Crear nuevo grupo de consumo' })
  @ApiResponse({ status: 201, description: 'Grupo creado', type: ConsumerGroupResponseDto })
  async create(@Body() createDto: CreateConsumerGroupDto, @Request() req): Promise<ConsumerGroupResponseDto> {
    return this.consumerGroupsService.create(createDto, req.user.email);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Listar grupos del usuario autenticado con información de rol' })
  @ApiResponse({ 
    status: 200, 
    description: 'Lista de grupos con rol del usuario (isClient, isManager, isDefault)', 
    type: [ConsumerGroupWithRoleResponseDto] 
  })
  async findUserGroups(@Request() req): Promise<ConsumerGroupWithRoleResponseDto[]> {
    return this.consumerGroupsService.findByUser(req.user.email);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, IsMemberGuard)
  @ApiOperation({ summary: 'Obtener detalle de un grupo' })
  @ApiResponse({ status: 200, description: 'Detalle del grupo', type: ConsumerGroupResponseDto })
  async findOne(@Param('id') id: string): Promise<ConsumerGroupResponseDto> {
    return this.consumerGroupsService.findById(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, IsManagerGuard)
  @ApiOperation({ summary: 'Actualizar grupo (solo gestores)' })
  @ApiResponse({ status: 200, description: 'Grupo actualizado', type: ConsumerGroupResponseDto })
  async update(@Param('id') id: string, @Body() updateDto: UpdateConsumerGroupDto): Promise<ConsumerGroupResponseDto> {
    return this.consumerGroupsService.update(id, updateDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, IsManagerGuard)
  @ApiOperation({ summary: 'Eliminar grupo (solo gestores)' })
  @ApiResponse({ status: 200, description: 'Grupo eliminado' })
  async remove(@Param('id') id: string): Promise<{ message: string }> {
    await this.consumerGroupsService.delete(id);
    return { message: 'Group deleted successfully' };
  }

  @Post(':id/join')
  @UseGuards(JwtAuthGuard, IsManagerGuard)
  @ApiOperation({ summary: 'Añadir miembro al grupo (solo gestores)' })
  @ApiResponse({ status: 201, description: 'Miembro añadido' })
  async joinGroup(@Param('id') id: string, @Body() joinDto: JoinGroupDto): Promise<{ message: string }> {
    await this.consumerGroupsService.addMember(
      id,
      joinDto.userEmail,
      joinDto.isClient ?? true,
      joinDto.isManager ?? false,
    );
    return { message: 'Member added successfully' };
  }

  @Delete(':id/leave')
  @UseGuards(JwtAuthGuard, IsMemberGuard)
  @ApiOperation({ summary: 'Abandonar grupo' })
  @ApiResponse({ status: 200, description: 'Usuario ha abandonado el grupo' })
  async leaveGroup(@Param('id') id: string, @Request() req): Promise<{ message: string }> {
    await this.consumerGroupsService.removeMember(id, req.user.email);
    return { message: 'Left group successfully' };
  }

  @Patch(':id/set-default')
  @UseGuards(JwtAuthGuard, IsMemberGuard)
  @ApiOperation({ summary: 'Marcar grupo como predeterminado' })
  @ApiResponse({ status: 200, description: 'Grupo marcado como predeterminado' })
  async setDefault(@Param('id') id: string, @Request() req): Promise<{ message: string }> {
    await this.consumerGroupsService.setDefaultGroup(req.user.email, id);
    return { message: 'Default group set successfully' };
  }

  @Get(':id/members')
  @UseGuards(JwtAuthGuard, IsManagerGuard)
  @ApiOperation({ summary: 'Listar miembros del grupo (solo gestores)' })
  @ApiResponse({ status: 200, description: 'Lista de miembros' })
  async getMembers(@Param('id') id: string) {
    return this.consumerGroupsService.getMembers(id);
  }

  @Patch(':id/members/:email/role')
  @UseGuards(JwtAuthGuard, IsManagerGuard)
  @ApiOperation({ summary: 'Actualizar rol de miembro (solo gestores)' })
  @ApiResponse({ status: 200, description: 'Rol actualizado' })
  async updateMemberRole(
    @Param('id') id: string,
    @Param('email') email: string,
    @Body() updateRoleDto: UpdateMemberRoleDto,
  ): Promise<{ message: string }> {
    // Decodificar l'email per assegurar-nos que està correctament format
    const decodedEmail = decodeURIComponent(email);
    await this.consumerGroupsService.updateMemberRole(
      id,
      decodedEmail,
      updateRoleDto.isClient,
      updateRoleDto.isManager,
      updateRoleDto.isPreparer,
    );
    return { message: 'Member role updated successfully' };
  }

  @Delete(':id/members/:email')
  @UseGuards(JwtAuthGuard, IsManagerGuard)
  @ApiOperation({ summary: 'Eliminar miembro del grupo (solo gestores)' })
  @ApiResponse({ status: 200, description: 'Miembro eliminado' })
  async removeMember(@Param('id') id: string, @Param('email') email: string): Promise<{ message: string }> {
    await this.consumerGroupsService.removeMember(id, email);
    return { message: 'Member removed successfully' };
  }

  @Post(':id/image')
  @UseGuards(JwtAuthGuard, IsManagerGuard)
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Subir imagen del grupo (solo gestores)' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: 200, description: 'Imagen subida', type: ConsumerGroupResponseDto })
  async uploadImage(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<ConsumerGroupResponseDto> {
    const imageUrl = await this.storageService.uploadFile(file, 'groups');
    return this.consumerGroupsService.updateImage(id, imageUrl);
  }

  @Get(':id/is-open')
  @UseGuards(JwtAuthGuard, IsMemberGuard)
  @ApiOperation({ summary: 'Verificar si el grupo está abierto' })
  @ApiResponse({ status: 200, description: 'Estado de apertura del grupo' })
  async isOpen(@Param('id') id: string): Promise<{ isOpen: boolean }> {
    const isOpen = this.consumerGroupsService.isOpen(id);
    return { isOpen };
  }

  @Post(':id/invitations')
  @UseGuards(JwtAuthGuard, IsManagerGuard)
  @ApiOperation({ summary: 'Crear invitación para unirse al grupo (solo gestores)' })
  @ApiResponse({ status: 201, description: 'Invitación creada', type: GroupInvitation })
  async createInvitation(
    @Param('id') id: string,
    @Body() dto: CreateInvitationDto,
    @Request() req,
  ): Promise<GroupInvitation> {
    // Assignar consumerGroupId des del paràmetre de la URL
    const createDto: CreateInvitationDto = {
      ...dto,
      consumerGroupId: id
    };
    return this.consumerGroupsService.createInvitation(createDto, req.user.email);
  }

  @Get('invitations/:token/validate')
  @ApiOperation({ summary: 'Validar token de invitación (público)' })
  @ApiResponse({ status: 200, description: 'Invitación válida' })
  async validateInvitation(@Param('token') token: string): Promise<{ valid: boolean; groupName?: string }> {
    const invitation = await this.consumerGroupsService.validateInvitation(token);
    const group = await this.consumerGroupsService.findById(invitation.consumerGroupId);
    return { valid: true, groupName: group.name };
  }

  @Post('invitations/use')
  @ApiOperation({ summary: 'Usar token de invitación para unirse al grupo (público)' })
  @ApiResponse({ status: 200, description: 'Usuario añadido al grupo' })
  async useInvitation(@Body() body: { token: string; email: string }): Promise<{ message: string }> {
    await this.consumerGroupsService.useInvitation(body.token, body.email);
    return { message: 'Successfully joined group' };
  }
}

