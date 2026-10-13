import {
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
  CreationOptional,
  NonAttribute,
  Model,
} from 'sequelize';
import { sequelize } from '../config/db';

export class Sponsor extends Model<InferAttributes<Sponsor>, InferCreationAttributes<Sponsor>> {
  declare id: CreationOptional<number>;
  declare name: string;
  declare category: string | null;
  declare logo: string | null;
  declare order: CreationOptional<number>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;

  declare logoUrl: NonAttribute<string | null>;
}

Sponsor.init(
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    name: { type: DataTypes.STRING, allowNull: false },
    category: { type: DataTypes.STRING, allowNull: true },
    logo: { type: DataTypes.STRING, allowNull: true },
    order: { type: DataTypes.INTEGER, defaultValue: 0 },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  },
  {
    sequelize,
    tableName: 'sponsors',
    getterMethods: {
      logoUrl(this: Sponsor): string | null {
        const logo = this.getDataValue('logo');
        if (!logo) return null;
        const baseUrl = process.env.BACKEND_URL || 'http://localhost:5000';
        return `${baseUrl}/uploads/sponsors/${logo}`;
      },
    },
  },
);

export default Sponsor;
