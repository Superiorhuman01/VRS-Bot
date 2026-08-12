const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('release')
    .setDescription('Release a player from your team')
    .addUserOption(option =>
      option
        .setName('player')
        .setDescription('The player to release')
        .setRequired(true)
    )
    .addStringOption(option =>
      option
        .setName('reason')
        .setDescription('Reason for the release')
        .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),

  async execute(interaction) {
    const player = interaction.options.getUser('player');
    const reason = interaction.options.getString('reason');
    const releaser = interaction.user;

    const embed = new EmbedBuilder()
      .setColor(0xED4245)
      .setTitle('🔒 Player Released')
      .setDescription(`**${player.username}** has been released by admin/staff`)
      .addFields(
        { name: 'Player', value: `${player}`, inline: true },
        { name: 'Released by', value: `${releaser} (Admin/Staff)`, inline: true },
        { name: 'Reason', value: reason, inline: false }
      )
      .setFooter({
        text: `VF • ${new Date().toLocaleDateString('en-GB')} ${new Date().toLocaleTimeString('en-GB', {
          hour: '2-digit',
          minute: '2-digit'
        })}`
      })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  }
};
