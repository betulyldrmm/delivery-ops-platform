import { IsArray, IsOptional, IsString } from "class-validator";

export class OrderItemDto {
  @IsString()
  product_id: string;

  @IsString()
  name: string;

  quantity: number;
  unit_price: number;
}

export class CreateOrderDto {
  @IsString()
  address_id: string;

  @IsArray()
  items: OrderItemDto[];

  @IsString()
  payment_method: string;

  @IsOptional()
  @IsString()
  scheduled_at?: string;
}
