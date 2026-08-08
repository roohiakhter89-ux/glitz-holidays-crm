import { PartialType, OmitType } from '@nestjs/mapped-types';
import { CreateItineraryDto } from './create-itinerary.dto';

/** leadId is immutable — an itinerary can't be moved between leads. */
export class UpdateItineraryDto extends PartialType(
  OmitType(CreateItineraryDto, ['leadId'] as const),
) {}
