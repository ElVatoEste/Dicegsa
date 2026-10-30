import { Inject, Injectable } from '@nestjs/common';
import { asc } from 'drizzle-orm';
import { DB, type Db } from '../db/db.module';
import { products } from '../db/schema';

@Injectable()
export class ProductsService {
  constructor(@Inject(DB) private readonly db: Db) {}

  list() {
    return this.db.select().from(products).orderBy(asc(products.name));
  }
}
