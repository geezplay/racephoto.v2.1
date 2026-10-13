import {
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
  CreationOptional,
  Model,
} from 'sequelize';
import { sequelize } from '../config/db';
import type { DiscountType } from '@racephoto/shared';

export class DiscountCode extends Model<InferAttributes<DiscountCode>, InferCreationAttributes<DiscountCode>> {
  declare id: CreationOptional<number>;
  declare code: string;
  declare discount_type: CreationOptional<DiscountType>;
  declare discount_value: number;
  declare max_photos: number | null;
  declare event_ids: number[] | null;
  declare is_active: CreationOptional<boolean>;
  declare usage_limit: number | null;
  declare used_count: CreationOptional<number>;
  declare valid_until: Date | null;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

DiscountCode.init(
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    code: { type: DataTypes.STRING(50), allowNull: false, unique: true },
    discount_type: {
      type: DataTypes.ENUM('percent', 'flat'),
      allowNull: false,
      defaultValue: 'percent',
    },
    discount_value: { type: DataTypes.INTEGER, allowNull: false },
    max_photos: { type: DataTypes.INTEGER, allowNull: true },
    event_ids: { type: DataTypes.JSONB, allowNull: true },
    is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
    usage_limit: { type: DataTypes.INTEGER, allowNull: true },
    used_count: { type: DataTypes.INTEGER, defaultValue: 0 },
    valid_until: { type: DataTypes.DATE, allowNull: true },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  },
  {
    sequelize,
    tableName: 'discount_codes',
  },
);

export default DiscountCode;
