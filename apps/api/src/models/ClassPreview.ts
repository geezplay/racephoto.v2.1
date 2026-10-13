import {
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
  CreationOptional,
  NonAttribute,
  Model,
} from 'sequelize';
import { sequelize } from '../config/db';

export class ClassPreview extends Model<InferAttributes<ClassPreview>, InferCreationAttributes<ClassPreview>> {
  declare id: CreationOptional<number>;
  declare event_id: number;
  declare class_name: string;
  declare file_path: string | null;
  declare photo_count: CreationOptional<number>;
  declare content_hash: string | null;
  declare generated_at: Date | null;
  declare failed_at: Date | null;
  declare error: string | null;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;

  declare previewUrl: NonAttribute<string | null>;
}

ClassPreview.init(
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    event_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'events', key: 'id' },
    },
    class_name: { type: DataTypes.STRING, allowNull: false },
    file_path: { type: DataTypes.STRING, allowNull: true },
    photo_count: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    content_hash: { type: DataTypes.STRING, allowNull: true },
    generated_at: { type: DataTypes.DATE, allowNull: true },
    failed_at: { type: DataTypes.DATE, allowNull: true },
    error: { type: DataTypes.TEXT, allowNull: true },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  },
  {
    sequelize,
    tableName: 'class_previews',
    indexes: [{ unique: true, fields: ['event_id', 'class_name'] }],
    getterMethods: {
      previewUrl(this: ClassPreview): string | null {
        const filePath = this.getDataValue('file_path');
        if (!filePath) return null;
        const baseUrl = process.env.BACKEND_URL || 'http://localhost:5000';
        return `${baseUrl}/uploads/previews/${filePath}`;
      },
    },
  },
);

export default ClassPreview;
