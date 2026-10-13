import {
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
  CreationOptional,
  Model,
} from 'sequelize';
import { sequelize } from '../config/db';

export class EventClass extends Model<InferAttributes<EventClass>, InferCreationAttributes<EventClass>> {
  declare id: CreationOptional<number>;
  declare event_id: number;
  declare name: string;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

EventClass.init(
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    event_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'events', key: 'id' },
    },
    name: { type: DataTypes.STRING, allowNull: false },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  },
  { sequelize, tableName: 'event_classes' },
);

export default EventClass;
