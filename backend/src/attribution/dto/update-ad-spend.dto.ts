import { PartialType } from '@nestjs/mapped-types';
import { CreateAdSpendDto } from './create-ad-spend.dto';

export class UpdateAdSpendDto extends PartialType(CreateAdSpendDto) {}
