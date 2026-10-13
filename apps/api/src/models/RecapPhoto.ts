import {
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
  CreationOptional,
  NonAttribute,
  Model,
} from 'sequelize';
import { sequelize } from '../config/db';

export class RecapPhoto extends Model<InferAttributes<RecapPhoto>, InferCreationAttributes<RecapPhoto>> {
  declare id: CreationOptional<number>;
  declare photo_id: number;
  declare variant_number: CreationOptional<number>;
  declare file_path: string;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;

  declare url: NonAttribute<string | null>;
}

RecapPhoto.init(
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    photo_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'photos', key: 'id' },
    },
    variant_number: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
    file_path: { type: DataTypes.STRING, allowNull: false },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  },
  {
    sequelize,
    tableName: 'recap_photos',
    indexes: [{ unique: true, fields: ['photo_id', 'variant_number'] }],
    getterMethods: {
      url(this: RecapPhoto): string | null {
        const filePath = this.getDataValue('file_path');
        if (!filePath) return null;
        const baseUrl = process.env.BACKEND_URL || 'http://localhost:5000';
        return `${baseUrl}/uploads/recaps/${filePath}`;
      },
    },
  },
);

export default RecapPhoto;
