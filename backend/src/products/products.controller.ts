import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtGuard } from '../auth/jwt.guard';
import { Roles } from '../auth/roles.decorator';
import { ProductsService } from './products.service';

@Controller('products')
@UseGuards(JwtGuard)
@Roles('control_desk', 'supervisor', 'management', 'admin')
export class ProductsController {
  constructor(private readonly products: ProductsService) {}

  @Get()
  list() {
    return this.products.list();
  }
}
