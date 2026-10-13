import {
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
  CreationOptional,
  NonAttribute,
  Model,
} from 'sequelize';
import { sequelize } from '../config/db';

export class PhotoPreview extends Model<InferAttributes<PhotoPreview>, InferCreationAttributes<PhotoPreview>> {
  declare id: CreationOptional<number>;
  declare photo_id: number;
  declare file_path: string | null;
  declare variant_count: CreationOptional<number>;
  declare content_hash: string | null;
  declare generated_at: Date | null;
  declare failed_at: Date | null;
  declare error: string | null;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;

  declare previewUrl: NonAttribute<string | null>;
}

PhotoPreview.init(
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    photo_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'photos', key: 'id' },
    },
    file_path: { type: DataTypes.STRING, allowNull: true },
    variant_count: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    content_hash: { type: DataTypes.STRING, allowNull: true },
    generated_at: { type: DataTypes.DATE, allowNull: true },
    failed_at: { type: DataTypes.DATE, allowNull: true },
    error: { type: DataTypes.TEXT, allowNull: true },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  },
  {
    sequelize,
    tableName: 'photo_previews',
    indexes: [{ unique: true, fields: ['photo_id'] }],
    getterMethods: {
      previewUrl(this: PhotoPreview): string | null {
        const filePath = this.getDataValue('file_path');
        if (!filePath) return null;
        const baseUrl = process.env.BACKEND_URL || 'http://localhost:5000';
        return `${baseUrl}/uploads/previews/${filePath}`;
      },
    },
  },
);

export default PhotoPreview;
