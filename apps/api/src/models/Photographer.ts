import {
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
  CreationOptional,
  NonAttribute,
  Model,
} from 'sequelize';
import { sequelize } from '../config/db';

export class Photographer extends Model<InferAttributes<Photographer>, InferCreationAttributes<Photographer>> {
  declare id: CreationOptional<number>;
  declare name: string;
  declare team: string | null;
  declare category: string | null;
  declare photo: string | null;
  declare gradient_from: CreationOptional<string>;
  declare gradient_to: CreationOptional<string>;
  declare order: CreationOptional<number>;
  declare is_active: CreationOptional<boolean>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;

  declare photoUrl: NonAttribute<string | null>;
}

Photographer.init(
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    name: { type: DataTypes.STRING, allowNull: false },
    team: { type: DataTypes.STRING, allowNull: true },
    category: { type: DataTypes.STRING, allowNull: true },
    photo: { type: DataTypes.STRING, allowNull: true },
    gradient_from: { type: DataTypes.STRING(7), defaultValue: '#667eea' },
    gradient_to: { type: DataTypes.STRING(7), defaultValue: '#764ba2' },
    order: { type: DataTypes.INTEGER, defaultValue: 0 },
    is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  },
  {
    sequelize,
    tableName: 'photographers',
    getterMethods: {
      photoUrl(this: Photographer): string | null {
        const photo = this.getDataValue('photo');
        if (!photo) return null;
        const baseUrl = process.env.BACKEND_URL || 'http://localhost:5000';
        return `${baseUrl}/uploads/photographers/${photo}`;
      },
    },
    scopes: {
      active: { where: { is_active: true } },
    },
  },
);

export default Photographer;
