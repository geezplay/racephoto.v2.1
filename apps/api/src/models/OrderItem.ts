import {
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
  CreationOptional,
  Model,
} from 'sequelize';
import { sequelize } from '../config/db';

export class OrderItem extends Model<InferAttributes<OrderItem>, InferCreationAttributes<OrderItem>> {
  declare id: CreationOptional<number>;
  declare order_id: number;
  declare photo_id: number | null;
  declare variant: number;
  declare price: number;
  declare snap_photo_url: string | null;
  declare snap_photo_start_no: string | null;
  declare snap_event_name: string | null;
  declare snap_photo_class: string | null;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

OrderItem.init(
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    order_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'orders', key: 'id' },
    },
    photo_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: 'photos', key: 'id' },
    },
    variant: { type: DataTypes.INTEGER, allowNull: false },
    price: { type: DataTypes.INTEGER, allowNull: false },
    snap_photo_url: { type: DataTypes.STRING, allowNull: true },
    snap_photo_start_no: { type: DataTypes.STRING, allowNull: true },
    snap_event_name: { type: DataTypes.STRING, allowNull: true },
    snap_photo_class: { type: DataTypes.STRING, allowNull: true },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  },
  { sequelize, tableName: 'order_items' },
);

export default OrderItem;
