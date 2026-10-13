'use strict';

/** Initial PostgreSQL schema for RacePhoto/GeezPlay. */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    const { INTEGER, STRING, TEXT, DATE, DECIMAL, BOOLEAN, ENUM, JSONB } = Sequelize;
    const base = {
      created_at: { type: DATE, allowNull: false, defaultValue: Sequelize.fn('now') },
      updated_at: { type: DATE, allowNull: false, defaultValue: Sequelize.fn('now') },
    };

    await queryInterface.createTable('users', {
      id: { type: INTEGER, primaryKey: true, autoIncrement: true },
      name: { type: STRING, allowNull: false },
      email: { type: STRING, allowNull: false, unique: true },
      password: { type: STRING, allowNull: true },
      role: { type: ENUM('super_admin', 'admin', 'buyer'), defaultValue: 'buyer' },
      balance: { type: DECIMAL(15, 2), defaultValue: 0 },
      google_id: { type: STRING, allowNull: true, unique: true },
      auth_provider: { type: ENUM('local', 'google'), defaultValue: 'local' },
      ...base,
    });

    await queryInterface.createTable('events', {
      id: { type: INTEGER, primaryKey: true, autoIncrement: true },
      name: { type: STRING, allowNull: false },
      date: { type: STRING, allowNull: true },
      start_time: { type: DATE, allowNull: true },
      location: { type: STRING, allowNull: false },
      image: { type: STRING, allowNull: true },
      category: { type: ENUM('drag', 'drift', 'rally', 'touring', 'moto', 'road_race'), defaultValue: 'road_race' },
      external_link: { type: STRING, allowNull: true },
      is_published: { type: BOOLEAN, defaultValue: true },
      status: { type: ENUM('approved', 'pending', 'rejected'), defaultValue: 'approved' },
      created_by: {
        type: INTEGER,
        allowNull: true,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      ...base,
    });
    await queryInterface.addIndex('events', ['created_by']);
    await queryInterface.addIndex('events', ['status']);

    await queryInterface.createTable('event_classes', {
      id: { type: INTEGER, primaryKey: true, autoIncrement: true },
      event_id: {
        type: INTEGER,
        allowNull: false,
        references: { model: 'events', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      name: { type: STRING, allowNull: false },
      ...base,
    });
    await queryInterface.addIndex('event_classes', ['event_id']);

    await queryInterface.createTable('photos', {
      id: { type: INTEGER, primaryKey: true, autoIncrement: true },
      event_id: {
        type: INTEGER,
        allowNull: false,
        references: { model: 'events', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      class: { type: STRING, allowNull: false },
      start_no: { type: STRING, allowNull: false },
      price: { type: INTEGER, allowNull: false },
      url: { type: STRING, allowNull: false },
      created_by: {
        type: INTEGER,
        allowNull: true,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      ...base,
    });
    await queryInterface.addIndex('photos', ['event_id', 'class']);
    await queryInterface.addIndex('photos', ['created_by']);

    await queryInterface.createTable('recap_photos', {
      id: { type: INTEGER, primaryKey: true, autoIncrement: true },
      photo_id: {
        type: INTEGER,
        allowNull: false,
        references: { model: 'photos', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      variant_number: { type: INTEGER, allowNull: false, defaultValue: 1 },
      file_path: { type: STRING, allowNull: false },
      ...base,
    });
    await queryInterface.addIndex('recap_photos', ['photo_id', 'variant_number'], { unique: true });

    await queryInterface.createTable('sponsors', {
      id: { type: INTEGER, primaryKey: true, autoIncrement: true },
      name: { type: STRING, allowNull: false },
      category: { type: STRING, allowNull: true },
      logo: { type: STRING, allowNull: true },
      order: { type: INTEGER, defaultValue: 0 },
      ...base,
    });

    await queryInterface.createTable('photographers', {
      id: { type: INTEGER, primaryKey: true, autoIncrement: true },
      name: { type: STRING, allowNull: false },
      team: { type: STRING, allowNull: true },
      category: { type: STRING, allowNull: true },
      photo: { type: STRING, allowNull: true },
      gradient_from: { type: STRING(7), defaultValue: '#667eea' },
      gradient_to: { type: STRING(7), defaultValue: '#764ba2' },
      order: { type: INTEGER, defaultValue: 0 },
      is_active: { type: BOOLEAN, defaultValue: true },
      ...base,
    });

    await queryInterface.createTable('site_settings', {
      id: { type: INTEGER, primaryKey: true, autoIncrement: true },
      key: { type: STRING, allowNull: false, unique: true },
      value: { type: TEXT, allowNull: true },
      ...base,
    });

    await queryInterface.createTable('discount_codes', {
      id: { type: INTEGER, primaryKey: true, autoIncrement: true },
      code: { type: STRING(50), allowNull: false, unique: true },
      discount_type: { type: ENUM('percent', 'flat'), allowNull: false, defaultValue: 'percent' },
      discount_value: { type: INTEGER, allowNull: false },
      max_photos: { type: INTEGER, allowNull: true },
      event_ids: { type: JSONB, allowNull: true },
      is_active: { type: BOOLEAN, defaultValue: true },
      usage_limit: { type: INTEGER, allowNull: true },
      used_count: { type: INTEGER, defaultValue: 0 },
      valid_until: { type: DATE, allowNull: true },
      ...base,
    });

    await queryInterface.createTable('orders', {
      id: { type: INTEGER, primaryKey: true, autoIncrement: true },
      email: { type: STRING, allowNull: false },
      whatsapp: { type: STRING, allowNull: false },
      total_price: { type: INTEGER, allowNull: false },
      status: { type: STRING, defaultValue: 'pending' },
      snap_token: { type: STRING, allowNull: true },
      payment_url: { type: TEXT, allowNull: true },
      invoice_number: { type: STRING, allowNull: true },
      discount_code: { type: STRING(50), allowNull: true },
      discount_amount: { type: INTEGER, allowNull: true, defaultValue: 0 },
      user_id: {
        type: INTEGER,
        allowNull: true,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      guest_token: { type: STRING, allowNull: true },
      ...base,
    });
    await queryInterface.addIndex('orders', ['status']);
    await queryInterface.addIndex('orders', ['user_id']);

    await queryInterface.createTable('order_items', {
      id: { type: INTEGER, primaryKey: true, autoIncrement: true },
      order_id: {
        type: INTEGER,
        allowNull: false,
        references: { model: 'orders', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      photo_id: {
        type: INTEGER,
        allowNull: true,
        references: { model: 'photos', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      variant: { type: INTEGER, allowNull: false },
      price: { type: INTEGER, allowNull: false },
      snap_photo_url: { type: STRING, allowNull: true },
      snap_photo_start_no: { type: STRING, allowNull: true },
      snap_event_name: { type: STRING, allowNull: true },
      snap_photo_class: { type: STRING, allowNull: true },
      ...base,
    });
    await queryInterface.addIndex('order_items', ['order_id']);
    await queryInterface.addIndex('order_items', ['photo_id']);

    await queryInterface.createTable('withdrawal_requests', {
      id: { type: INTEGER, primaryKey: true, autoIncrement: true },
      user_id: {
        type: INTEGER,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      amount: { type: DECIMAL(15, 2), allowNull: false },
      bank_name: { type: STRING, allowNull: false },
      account_number: { type: STRING, allowNull: false },
      account_name: { type: STRING, allowNull: false },
      status: { type: ENUM('pending', 'approved', 'rejected'), defaultValue: 'pending' },
      admin_notes: { type: TEXT, allowNull: true },
      processed_at: { type: DATE, allowNull: true },
      processed_by: {
        type: INTEGER,
        allowNull: true,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      ...base,
    });
    await queryInterface.addIndex('withdrawal_requests', ['user_id']);
    await queryInterface.addIndex('withdrawal_requests', ['processed_by']);
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('withdrawal_requests');
    await queryInterface.dropTable('order_items');
    await queryInterface.dropTable('orders');
    await queryInterface.dropTable('discount_codes');
    await queryInterface.dropTable('site_settings');
    await queryInterface.dropTable('photographers');
    await queryInterface.dropTable('sponsors');
    await queryInterface.dropTable('recap_photos');
    await queryInterface.dropTable('photos');
    await queryInterface.dropTable('event_classes');
    await queryInterface.dropTable('events');
    await queryInterface.dropTable('users');
  },
};
