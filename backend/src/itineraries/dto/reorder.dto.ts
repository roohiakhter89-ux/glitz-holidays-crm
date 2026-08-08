import { ArrayNotEmpty, IsArray, IsString } from 'class-validator';

/**
 * Drag-drop reorder: the frontend sends the new ordered list of IDs and
 * the service assigns sortOrder = index. Same shape used for both day
 * reordering (send day IDs) and item reordering (send item IDs).
 */
export class ReorderDto {
  @IsArray() @ArrayNotEmpty() @IsString({ each: true })
  ids: string[];
}
