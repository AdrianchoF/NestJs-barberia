import { PartialType } from '@nestjs/mapped-types';
import { CreateCompraProductoDto } from './create-compra-producto.dto';

export class UpdateCompraProductoDto extends PartialType(CreateCompraProductoDto) {}
