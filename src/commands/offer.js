import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { InteractionHelper } from '../../utils/interactionHelper.js';
import { logger } from '../../utils/logger.js';

export default {
    data: new SlashCommandBuilder()
        .setName('offer')
        .setDescription('Bir oyuncuya kontrat teklifi gönderir')
        .addUserOption(option =>
            option.setName('player')
                .setDescription('Teklif edilecek oyuncu')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('team')
                .setDescription('Takım adı (örnek: Manchester United)')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('position')
                .setDescription('Pozisyon (CB, ST, CM, LW vs.)')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('region')
                .setDescription('Bölge (GMT, TR, EU vs.)')
                .setRequired(true))
        .addUserOption(option =>
            option.setName('manager')
                .setDescription('Manager')
                .setRequired(true))
        .setDMPermission(false),

    async execute(interaction, guildConfig, client) {
        const player = interaction.options.getUser('player');
        const team = interaction.options.getString('team');
        const position = interaction.options.getString('position');
        const region = interaction.options.getString('region');
        const manager = interaction.options.getUser('manager');

        const embed = new EmbedBuilder()
            .setColor(0x57F287)
            .setTitle('🤝 Contract Accepted!')
            .setDescription(`${player} has joined **${team}**`)
            .addFields(
                { name: 'Position', value: position, inline: true },
                { name: 'Region', value: region, inline: true },
                { name: '\u200B', value: '\u200B', inline: true },
                { name: 'Player', value: `${player}`, inline: true },
                { name: 'Team', value: team, inline: true },
                { name: 'Manager', value: `${manager}`, inline: true }
            )
            .setThumbnail(player.displayAvatarURL({ dynamic: true }))
            .setFooter({ text: `VF • ${new Date().toLocaleString('tr-TR')}` });

        await interaction.reply({ embeds: [embed] });

        logger.info('Offer command used', {
            userId: interaction.user.id,
            userTag: interaction.user.tag,
            playerId: player.id,
            team,
            guildId: interaction.guildId
        });
    },
};
