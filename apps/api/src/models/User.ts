import {
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
  CreationOptional,
  Model,
} from 'sequelize';
import bcrypt from 'bcryptjs';
import type { Role } from '@racephoto/shared';
import { sequelize } from '../config/db';

export type AuthProvider = 'local' | 'google';

export class User extends Model<InferAttributes<User>, InferCreationAttributes<User>> {
  declare id: CreationOptional<number>;
  declare name: string;
  declare email: string;
  declare password: string | null;
  declare role: CreationOptional<Role>;
  declare balance: CreationOptional<number>;
  declare google_id: string | null;
  declare auth_provider: CreationOptional<AuthProvider>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;

  async matchPassword(enteredPassword: string): Promise<boolean> {
    if (!this.password) return false;
    return bcrypt.compare(enteredPassword, this.password);
  }

  isSuperAdmin(): boolean {
    return this.role === 'super_admin';
  }

  isAdmin(): boolean {
    return this.role === 'super_admin' || this.role === 'admin';
  }

  isBuyer(): boolean {
    return this.role === 'buyer';
  }
}

User.init(
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
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: { isEmail: true },
    },
    password: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    role: {
      type: DataTypes.ENUM('super_admin', 'admin', 'buyer'),
      defaultValue: 'buyer',
    },
    balance: {
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0,
      get() {
        const raw = this.getDataValue('balance');
        return parseFloat(String(raw ?? '0'));
      },
    },
    google_id: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true,
    },
    auth_provider: {
      type: DataTypes.ENUM('local', 'google'),
      defaultValue: 'local',
    },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  },
  {
    sequelize,
    tableName: 'users',
    hooks: {
      beforeSave: async (user: User) => {
        if (user.password && user.changed('password')) {
          const salt = await bcrypt.genSalt(10);
          user.password = await bcrypt.hash(user.password, salt);
        }
      },
    },
  },
);

export default User;
