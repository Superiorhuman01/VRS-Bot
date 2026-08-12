import { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } from 'discord.js';

// Komutu kullanabilecek roller
const ALLOWED_ROLES = [
  '1536076131600441396',
  '1536331089943994378',
  '1536331131882836051'
];

// 16 Takım rolleri
const TEAM_ROLES = [
  '1537060306935881728',
  '1536772729838243921',
  '1537060351009620059',
  '1537060677493989517',
  '1537060640882032640',
  '1536708011983376504',
  '1537060907090452611',
  '1537060935187963914',
  '1537061234216804423',
  '1537061380019064852',
  '1537061080860459119',
  '1537061400583606363',
  '1537061024312725604',
  '1537060848256819330',
  '1537060395057942548'
];

export default {
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
    ),

  async execute(interaction) {
    const member = interaction.member;
    const player = interaction.options.getUser('player');
    const reason = interaction.options.getString('reason');
    const releaser = interaction.user;

    // 1. Komutu kullanma yetkisi kontrolü
    const hasPermission = member.roles.cache.some(role => ALLOWED_ROLES.includes(role.id));
    if (!hasPermission) {
      return interaction.reply({
        content: 'You do not have permission to use this command.',
        ephemeral: true
      });
    }

    // 2. Manager'ın sahip olduğu takım rolünü bul
    const managerTeamRole = member.roles.cache.find(role => TEAM_ROLES.includes(role.id));

    if (!managerTeamRole) {
      return interaction.reply({
        content: 'You do not have any team role.',
        ephemeral: true
      });
    }

    // 3. Oyuncuyu sunucudan çek
    const targetMember = await interaction.guild.members.fetch(player.id).catch(() => null);
    if (!targetMember) {
      return interaction.reply({
        content: 'Player not found in this server.',
        ephemeral: true
      });
    }

    // 4. Oyuncuda aynı takım rolü var mı kontrol et
    if (!targetMember.roles.cache.has(managerTeamRole.id)) {
      return interaction.reply({
        content: `This player is not in your team (**${managerTeamRole.name}**).`,
        ephemeral: true
      });
    }

    // 5. Takım rolünü oyuncudan kaldır
    try {
      await targetMember.roles.remove(managerTeamRole.id);
    } catch (error) {
      console.error(error);
      return interaction.reply({
        content: 'Failed to remove the team role. Check my permissions.',
        ephemeral: true
      });
    }

    // 6. Embed gönder
    const embed = new EmbedBuilder()
      .setColor(0xED4245)
      .setTitle('🔒 Player Released')
      .setDescription(`**${player.username}** has been released by admin/staff`)
      .addFields(
        { name: 'Player', value: `${player}`, inline: true },
        { name: 'Released by', value: `${releaser} (Admin/Staff)`, inline: true },
        { name: 'Reason', value: reason, inline: false },
        { name: 'Team', value: managerTeamRole.name, inline: true }
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
