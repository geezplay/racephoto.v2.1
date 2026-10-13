import {
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
  CreationOptional,
  Model,
} from 'sequelize';
import { sequelize } from '../config/db';

export interface Brand {
  site_name: string;
  tagline: string;
  contact_email: string;
  contact_phone: string;
  logo_url: string | null;
  siteName: string;
  siteLogo: string | null;
}

export class SiteSetting extends Model<InferAttributes<SiteSetting>, InferCreationAttributes<SiteSetting>> {
  declare id: CreationOptional<number>;
  declare key: string;
  declare value: string | null;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;

  static async getValue(key: string, defaultValue: string | null = null): Promise<string | null> {
    const setting = await SiteSetting.findOne({ where: { key } });
    return setting ? setting.value : defaultValue;
  }

  static async setValue(key: string, value: string | null): Promise<void> {
    await SiteSetting.upsert({ key, value } as SiteSetting);
  }

  static async getBrand(): Promise<Brand> {
    const siteName = (await SiteSetting.getValue('site_name', 'RacePhoto')) || 'RacePhoto';
    const siteLogo = await SiteSetting.getValue('site_logo', null);
    const tagline = (await SiteSetting.getValue('tagline', '')) || '';
    const contactEmail = (await SiteSetting.getValue('contact_email', '')) || '';
    const contactPhone = (await SiteSetting.getValue('contact_phone', '')) || '';

    const baseUrl = process.env.BACKEND_URL || '';
    const logoPath = siteLogo ? `${baseUrl}/uploads/settings/${siteLogo}` : null;

    return {
      site_name: siteName,
      tagline,
      contact_email: contactEmail,
      contact_phone: contactPhone,
      logo_url: logoPath,
      siteName,
      siteLogo: logoPath,
    };
  }
}

SiteSetting.init(
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    key: { type: DataTypes.STRING, allowNull: false, unique: true },
    value: { type: DataTypes.TEXT, allowNull: true },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  },
  { sequelize, tableName: 'site_settings' },
);

export default SiteSetting;
