'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const { INTEGER, STRING, TEXT, DATE } = Sequelize;
    const base = {
      created_at: { type: DATE, allowNull: false, defaultValue: Sequelize.fn('now') },
      updated_at: { type: DATE, allowNull: false, defaultValue: Sequelize.fn('now') },
    };

    await queryInterface.createTable('class_previews', {
      id: { type: INTEGER, primaryKey: true, autoIncrement: true },
      event_id: {
        type: INTEGER,
        allowNull: false,
        references: { model: 'events', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      class_name: { type: STRING, allowNull: false },
      file_path: { type: STRING, allowNull: true },
      photo_count: { type: INTEGER, defaultValue: 0 },
      content_hash: { type: STRING, allowNull: true },
      generated_at: { type: DATE, allowNull: true },
      failed_at: { type: DATE, allowNull: true },
      error: { type: TEXT, allowNull: true },
      ...base,
    });
    await queryInterface.addIndex('class_previews', ['event_id', 'class_name'], { unique: true });
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('class_previews');
  },
};
