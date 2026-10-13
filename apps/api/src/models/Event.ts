import {
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
  CreationOptional,
  NonAttribute,
  Model,
  Op,
} from 'sequelize';
import { sequelize } from '../config/db';
import type { EventCategory, EventStatus } from '@racephoto/shared';

export class Event extends Model<InferAttributes<Event>, InferCreationAttributes<Event>> {
  declare id: CreationOptional<number>;
  declare name: string;
  declare date: string | null;
  declare start_time: Date | null;
  declare location: string;
  declare image: string | null;
  declare category: CreationOptional<EventCategory>;
  declare external_link: string | null;
  declare is_published: CreationOptional<boolean>;
  declare status: CreationOptional<EventStatus>;
  declare created_by: number | null;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;

  declare imageUrl: NonAttribute<string | null>;
}

Event.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    date: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    start_time: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    location: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    image: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    category: {
      type: DataTypes.ENUM('drag', 'drift', 'rally', 'touring', 'moto', 'road_race'),
      defaultValue: 'road_race',
    },
    external_link: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    is_published: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    status: {
      type: DataTypes.ENUM('approved', 'pending', 'rejected'),
      defaultValue: 'approved',
    },
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
    tableName: 'events',
    getterMethods: {
      imageUrl(this: Event): string | null {
        const image = this.getDataValue('image');
        if (!image) return null;
        const baseUrl = process.env.BACKEND_URL || 'http://localhost:5000';
        return `${baseUrl}/uploads/events/${image}`;
      },
    },
    scopes: {
      approved: { where: { status: 'approved' } },
      pending: { where: { status: 'pending' } },
      upcoming: {
        where: {
          start_time: { [Op.gt]: new Date() },
          is_published: true,
          status: 'approved',
        },
      },
    },
  },
);

export default Event;
