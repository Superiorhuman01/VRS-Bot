const { SlashCommandBuilder } = require('discord.js');
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

module.exports = {
  data: new SlashCommandBuilder()
    .setName('createtable')
    .setDescription('Create the players table (Admin only)'),

  async execute(interaction) {
    // Sadece sen kullanabilesin diye (kendi Discord ID'ni yaz)
    if (interaction.user.id !== '416087439568928773') {
      return interaction.reply({ content: 'You are not allowed to use this command.', ephemeral: true });
    }

    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS players (
          id SERIAL PRIMARY KEY,
          name VARCHAR(100) NOT NULL UNIQUE,
          club VARCHAR(100) DEFAULT 'Free Agent',
          position VARCHAR(20),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);

      await interaction.reply({ content: 'Players table created successfully!', ephemeral: true });
    } catch (error) {
      console.error(error);
      await interaction.reply({ content: 'Error creating table: ' + error.message, ephemeral: true });
    }
  },
};
