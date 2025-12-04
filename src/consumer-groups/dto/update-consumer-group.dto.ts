import { PartialType } from '@nestjs/swagger';
import { CreateConsumerGroupDto } from './create-consumer-group.dto';

export class UpdateConsumerGroupDto extends PartialType(CreateConsumerGroupDto) {}

