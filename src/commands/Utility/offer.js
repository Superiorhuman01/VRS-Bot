import { 
    SlashCommandBuilder, 
    EmbedBuilder, 
    ActionRowBuilder, 
    ButtonBuilder, 
    ButtonStyle,
    ComponentType
} from 'discord.js';
import { logger } from '../../utils/logger.js';

export default {
    data: new SlashCommandBuilder()
        .setName('offer')
        .setDescription('Send a contract offer to a player')
        .addUserOption(option =>
            option.setName('player')
                .setDescription('The player to send the offer to')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('team')
                .setDescription('Team name (example: Manchester United)')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('position')
                .setDescription('Position (CB, ST, CM, LW etc.)')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('region')
                .setDescription('Region (GMT, TR, EU etc.)')
                .setRequired(true))
        .addUserOption(option =>
            option.setName('manager')
                .setDescription('Manager')
                .setRequired(true))
        .setDMPermission(false),

    async execute(interaction, guildConfig, client) {
        // ====================== PERMISSION CHECK ======================
        const allowedRoles = [
            '1536331089943994378',
            '1536331131882836051'
        ];

        const member = interaction.member;
        const hasPermission = member.roles.cache.some(role => allowedRoles.includes(role.id));

        if (!hasPermission) {
            return interaction.reply({
                content: '❌ You do not have permission to use this command.',
                ephemeral: true
            });
        }
        // ==============================================================

        const player = interaction.options.getUser('player');
        const team = interaction.options.getString('team');
        const position = interaction.options.getString('position');
        const region = interaction.options.getString('region');
        const manager = interaction.options.getUser('manager');

        // Confirmation embed
        const confirmEmbed = new EmbedBuilder()
            .setColor(0x57F287)
            .setTitle('📨 Offer Sent')
            .setDescription(`The offer for **${team}** has been sent to ${player} via DM.`)
            .addFields(
                { name: 'Position', value: position, inline: true },
                { name: 'Region', value: region, inline: true },
                { name: 'Manager', value: `${manager}`, inline: true }
            )
            .setFooter({ text: `VF • ${new Date().toLocaleString('en-GB')}` });

        await interaction.reply({ embeds: [confirmEmbed], ephemeral: true });

        // Offer embed for the player
        const offerEmbed = new EmbedBuilder()
            .setColor(0x57F287)
            .setTitle('🤝 Contract Offer!')
            .setDescription(`**${team}** wants to add you to their squad!`)
            .addFields(
                { name: 'Position', value: position, inline: true },
                { name: 'Region', value: region, inline: true },
                { name: '\u200B', value: '\u200B', inline: true },
                { name: 'Player', value: `${player}`, inline: true },
                { name: 'Team', value: team, inline: true },
                { name: 'Manager', value: `${manager}`, inline: true }
            )
            .setThumbnail(player.displayAvatarURL({ dynamic: true }))
            .setFooter({ text: `Offer • ${new Date().toLocaleString('en-GB')}` });

        // Buttons
        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId(`offer_accept_${interaction.id}`)
                .setLabel('Accept')
                .setStyle(ButtonStyle.Success),
            new ButtonBuilder()
                .setCustomId(`offer_decline_${interaction.id}`)
                .setLabel('Decline')
                .setStyle(ButtonStyle.Danger)
        );

        try {
            const dmMessage = await player.send({
                content: `Hello ${player}, you have received a contract offer!`,
                embeds: [offerEmbed],
                components: [row]
            });

            logger.info('Offer DM sent successfully', {
                from: interaction.user.id,
                to: player.id,
                team,
                guildId: interaction.guildId
            });

            // ====================== COLLECTOR ======================
            const collector = dmMessage.createMessageComponentCollector({
                componentType: ComponentType.Button,
                time: 24 * 60 * 60 * 1000, // 24 hours
                filter: i => i.user.id === player.id
            });

            collector.on('collect', async (i) => {
                const isAccept = i.customId.startsWith('offer_accept_');

                // Disable buttons
                const disabledRow = new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setCustomId('disabled_accept')
                        .setLabel(isAccept ? '✅ Accepted' : 'Accept')
                        .setStyle(ButtonStyle.Success)
                        .setDisabled(true),
                    new ButtonBuilder()
                        .setCustomId('disabled_decline')
                        .setLabel(!isAccept ? '❌ Declined' : 'Decline')
                        .setStyle(ButtonStyle.Danger)
                        .setDisabled(true)
                );

                const updatedEmbed = EmbedBuilder.from(offerEmbed);

                if (isAccept) {
                    updatedEmbed
                        .setColor(0x57F287)
                        .setTitle('✅ Contract Accepted!')
                        .setDescription(`**${team}** wants to add you to their squad!\n\n**The player has accepted the offer.**`);
                } else {
                    updatedEmbed
                        .setColor(0xED4245)
                        .setTitle('❌ Contract Declined')
                        .setDescription(`**${team}** wants to add you to their squad!\n\n**The player has declined the offer.**`);
                }

                await i.update({
                    embeds: [updatedEmbed],
                    components: [disabledRow]
                });

                // ====================== PUBLIC ANNOUNCEMENT (ONLY ON ACCEPT) ======================
                if (isAccept) {
                    try {
                        const announcementChannel = await client.channels.fetch('1536072163201785897');

                        if (announcementChannel) {
                            const announcementEmbed = new EmbedBuilder()
                                .setColor(0x57F287)
                                .setTitle('🏆 Contract Accepted!')
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
                                .setFooter({ text: `VF • ${new Date().toLocaleString('en-GB')}` })
                                .setTimestamp();

                            await announcementChannel.send({ embeds: [announcementEmbed] });
                        }
                    } catch (err) {
                        logger.error('Failed to send announcement', { error: err.message });
                    }
                }
                // ==================================================================================

                // Notify the manager
                try {
                    const resultEmbed = new EmbedBuilder()
                        .setColor(isAccept ? 0x57F287 : 0xED4245)
                        .setTitle(isAccept ? '✅ Offer Accepted' : '❌ Offer Declined')
                        .setDescription(`${player} has ${isAccept ? '**accepted**' : '**declined**'} the offer from **${team}**.`)
                        .addFields(
                            { name: 'Position', value: position, inline: true },
                            { name: 'Region', value: region, inline: true },
                            { name: 'Manager', value: `${manager}`, inline: true }
                        )
                        .setFooter({ text: `VF • ${new Date().toLocaleString('en-GB')}` })
                        .setTimestamp();

                    await manager.send({ embeds: [resultEmbed] }).catch(() => {
                        logger.warn('Could not send DM to manager', { managerId: manager.id });
                    });

                } catch (err) {
                    logger.error('Offer result notification error', { error: err.message });
                }

                collector.stop();
            });

            collector.on('end', async (collected, reason) => {
                if (reason === 'time' && collected.size === 0) {
                    const expiredRow = new ActionRowBuilder().addComponents(
                        new ButtonBuilder()
                            .setCustomId('expired')
                            .setLabel('Expired')
                            .setStyle(ButtonStyle.Secondary)
                            .setDisabled(true)
                    );

                    const expiredEmbed = EmbedBuilder.from(offerEmbed)
                        .setColor(0x95A5A6)
                        .setTitle('⏰ Offer Expired')
                        .setDescription(`**${team}** wants to add you to their squad!\n\nThis offer has expired.`);

                    await dmMessage.edit({
                        embeds: [expiredEmbed],
                        components: [expiredRow]
                    }).catch(() => {});
                }
            });

        } catch (error) {
            await interaction.followUp({
                content: `❌ Could not send the offer because ${player} has DMs closed.`,
                ephemeral: true
            });

            logger.warn('Failed to send offer DM', {
                playerId: player.id,
                error: error.message
            });
        }
    },
};
