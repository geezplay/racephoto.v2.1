import {
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
  CreationOptional,
  Model,
} from 'sequelize';
import { sequelize } from '../config/db';
import type { OrderStatus } from '@racephoto/shared';

export class Order extends Model<InferAttributes<Order>, InferCreationAttributes<Order>> {
  declare id: CreationOptional<number>;
  declare email: string;
  declare whatsapp: string;
  declare total_price: number;
  declare status: OrderStatus;
  declare snap_token: string | null;
  declare payment_url: string | null;
  declare invoice_number: string | null;
  declare discount_code: string | null;
  declare discount_amount: CreationOptional<number>;
  declare user_id: number | null;
  declare guest_token: string | null;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

Order.init(
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    email: { type: DataTypes.STRING, allowNull: false },
    whatsapp: { type: DataTypes.STRING, allowNull: false },
    total_price: { type: DataTypes.INTEGER, allowNull: false },
    status: { type: DataTypes.STRING, defaultValue: 'pending' },
    snap_token: { type: DataTypes.STRING, allowNull: true },
    payment_url: { type: DataTypes.TEXT, allowNull: true },
    invoice_number: { type: DataTypes.STRING, allowNull: true },
    discount_code: { type: DataTypes.STRING(50), allowNull: true },
    discount_amount: { type: DataTypes.INTEGER, allowNull: true, defaultValue: 0 },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: 'users', key: 'id' },
    },
    guest_token: { type: DataTypes.STRING, allowNull: true },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  },
  { sequelize, tableName: 'orders' },
);

export default Order;
