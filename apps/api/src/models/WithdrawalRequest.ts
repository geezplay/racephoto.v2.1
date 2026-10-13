import {
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
  CreationOptional,
  Model,
} from 'sequelize';
import { sequelize } from '../config/db';
import type { WithdrawalStatus } from '@racephoto/shared';

export class WithdrawalRequest extends Model<
  InferAttributes<WithdrawalRequest>,
  InferCreationAttributes<WithdrawalRequest>
> {
  declare id: CreationOptional<number>;
  declare user_id: number;
  declare amount: number;
  declare bank_name: string;
  declare account_number: string;
  declare account_name: string;
  declare status: CreationOptional<WithdrawalStatus>;
  declare admin_notes: string | null;
  declare processed_at: Date | null;
  declare processed_by: number | null;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;

  isPending(): boolean {
    return this.status === 'pending';
  }
}

WithdrawalRequest.init(
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'users', key: 'id' },
    },
    amount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      get() {
        return parseFloat(String(this.getDataValue('amount')));
      },
    },
    bank_name: { type: DataTypes.STRING, allowNull: false },
    account_number: { type: DataTypes.STRING, allowNull: false },
    account_name: { type: DataTypes.STRING, allowNull: false },
    status: {
      type: DataTypes.ENUM('pending', 'approved', 'rejected'),
      defaultValue: 'pending',
    },
    admin_notes: { type: DataTypes.TEXT, allowNull: true },
    processed_at: { type: DataTypes.DATE, allowNull: true },
    processed_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: 'users', key: 'id' },
    },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  },
  { sequelize, tableName: 'withdrawal_requests' },
);

export default WithdrawalRequest;
