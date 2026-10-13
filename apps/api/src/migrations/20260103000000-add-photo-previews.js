'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const { INTEGER, STRING, TEXT, DATE } = Sequelize;
    const base = {
      created_at: { type: DATE, allowNull: false, defaultValue: Sequelize.fn('now') },
      updated_at: { type: DATE, allowNull: false, defaultValue: Sequelize.fn('now') },
    };

    await queryInterface.createTable('photo_previews', {
      id: { type: INTEGER, primaryKey: true, autoIncrement: true },
      photo_id: {
        type: INTEGER,
        allowNull: false,
        references: { model: 'photos', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      file_path: { type: STRING, allowNull: true },
      variant_count: { type: INTEGER, defaultValue: 0 },
      content_hash: { type: STRING, allowNull: true },
      generated_at: { type: DATE, allowNull: true },
      failed_at: { type: DATE, allowNull: true },
      error: { type: TEXT, allowNull: true },
      ...base,
    });
    await queryInterface.addIndex('photo_previews', ['photo_id'], { unique: true });
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('photo_previews');
  },
};
