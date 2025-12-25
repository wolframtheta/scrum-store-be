import { PartialType, OmitType } from '@nestjs/swagger';
import { CreateProducerDto } from './create-producer.dto';

export class UpdateProducerDto extends PartialType(
  OmitType(CreateProducerDto, ['consumerGroupId'] as const)
) {}

