import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
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

        // Komutu kullanan kişiye onay mesajı
        const confirmEmbed = new EmbedBuilder()
            .setColor(0x57F287)
            .setTitle('📨 Offer Gönderildi')
            .setDescription(`${player} kullanıcısına **${team}** teklifi DM olarak gönderildi.`)
            .addFields(
                { name: 'Pozisyon', value: position, inline: true },
                { name: 'Bölge', value: region, inline: true },
                { name: 'Manager', value: `${manager}`, inline: true }
            )
            .setFooter({ text: `VF • ${new Date().toLocaleString('tr-TR')}` });

        await interaction.reply({ embeds: [confirmEmbed], ephemeral: true });

        // Oyuncuya gidecek DM Embed'i
        const offerEmbed = new EmbedBuilder()
            .setColor(0x57F287)
            .setTitle('🤝 Contract Offer!')
            .setDescription(`**${team}** seni kadrosuna katmak istiyor!`)
            .addFields(
                { name: 'Position', value: position, inline: true },
                { name: 'Region', value: region, inline: true },
                { name: '\u200B', value: '\u200B', inline: true },
                { name: 'Player', value: `${player}`, inline: true },
                { name: 'Team', value: team, inline: true },
                { name: 'Manager', value: `${manager}`, inline: true }
            )
            .setThumbnail(player.displayAvatarURL({ dynamic: true }))
            .setFooter({ text: `Teklif • ${new Date().toLocaleString('tr-TR')}` });

        // Kabul / Red butonları
        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId(`offer_accept_${interaction.id}`)
                .setLabel('Kabul Et')
                .setStyle(ButtonStyle.Success),
            new ButtonBuilder()
                .setCustomId(`offer_decline_${interaction.id}`)
                .setLabel('Reddet')
                .setStyle(ButtonStyle.Danger)
        );

        try {
            await player.send({
                content: `Merhaba ${player}, sana bir kontrat teklifi geldi!`,
                embeds: [offerEmbed],
                components: [row]
            });

            logger.info('Offer DM sent successfully', {
                from: interaction.user.id,
                to: player.id,
                team,
                guildId: interaction.guildId
            });
        } catch (error) {
            // Oyuncunun DM'i kapalıysa
            await interaction.followUp({
                content: `❌ ${player} kullanıcısının DM'leri kapalı olduğu için teklif gönderilemedi.`,
                ephemeral: true
            });

            logger.warn('Failed to send offer DM', {
                playerId: player.id,
                error: error.message
            });
        }
    },
};
