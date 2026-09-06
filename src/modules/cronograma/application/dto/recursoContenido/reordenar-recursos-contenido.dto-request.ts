import { ArrayMinSize, ArrayUnique, IsArray, IsUUID } from 'class-validator';

export class ReordenarRecursosContenidoDtoRequest {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayUnique()
  @IsUUID(undefined, { each: true })
  id_recursos!: string[];
}
