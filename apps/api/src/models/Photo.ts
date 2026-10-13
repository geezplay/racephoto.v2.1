import {
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
  CreationOptional,
  NonAttribute,
  Model,
} from 'sequelize';
import { sequelize } from '../config/db';

export class Photo extends Model<InferAttributes<Photo>, InferCreationAttributes<Photo>> {
  declare id: CreationOptional<number>;
  declare event_id: number;
  declare class: string;
  declare start_no: string;
  declare price: number;
  declare url: string;
  declare created_by: number | null;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;

  declare photoUrl: NonAttribute<string | null>;
}

Photo.init(
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    event_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'events', key: 'id' },
    },
    class: { type: DataTypes.STRING, allowNull: false },
    start_no: { type: DataTypes.STRING, allowNull: false },
    price: { type: DataTypes.INTEGER, allowNull: false },
    url: { type: DataTypes.STRING, allowNull: false },
    created_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: 'users', key: 'id' },
    },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  },
  {
    sequelize,
    tableName: 'photos',
    getterMethods: {
      photoUrl(this: Photo): string | null {
        const url = this.getDataValue('url');
        if (!url) return null;
        if (url.startsWith('http')) return url;
        const baseUrl = process.env.BACKEND_URL || 'http://localhost:5000';
        return `${baseUrl}${url}`;
      },
    },
  },
);

export default Photo;
