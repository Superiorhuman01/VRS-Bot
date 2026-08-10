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

            const filter = (i) => i.user.id === player.id;
            const collector = dmMessage.createMessageComponentCollector({ filter, componentType: ComponentType.Button, time: 86400000 });

            collector.on('collect', async (i) => {
                try {
                    // 1. ÇÖZÜM BURADA: Discord'a anında işlemi aldığımızı söylüyoruz.
                    // Bu sayede "Zamanında yanıt vermedi" hatasının 3 saniye kuralını aşıyoruz.
                    await i.deferUpdate();

                    // DİKKAT: BURAYA LOG KANALININ ID'SİNİ YAZMALISIN
                    const logChannelId = 'BURAYA_KANAL_ID_GELECEK'; 
                    let logChannel;
                    
                    try {
                        // cache yerine fetch kullanarak kanalın sunucuda kesinlikle bulunmasını garanti altına alıyoruz
                        if (logChannelId !== 'BURAYA_KANAL_ID_GELECEK') {
                            logChannel = await interaction.guild.channels.fetch(logChannelId);
                        }
                    } catch (err) {
                        console.error('Log kanalı bulunamadı, ID hatalı olabilir:', err);
                    }

                    if (i.customId === `offer_accept_${interaction.id}`) {
                        // deferUpdate yaptığımız için artık i.update yerine i.editReply kullanıyoruz
                        await i.editReply({
                            content: `✅ You have successfully accepted the offer from **${team}**!`,
                            components: []
                        });

                        if (logChannel) {
                            const transferEmbed = new EmbedBuilder()
                                .setColor(0x57F287)
                                .setTitle('🎉 New Transfer Completed!')
                                .setDescription(`${player} has signed with **${team}**!`)
                                .addFields(
                                    { name: 'Player', value: `${player}`, inline: true },
                                    { name: 'Position', value: position, inline: true },
                                    { name: 'Manager', value: `${manager}`, inline: true }
                                )
                                .setThumbnail(player.displayAvatarURL({ dynamic: true }))
                                .setFooter({ text: 'Transfer Confirmed' })
                                .setTimestamp();

                            await logChannel.send({ embeds: [transferEmbed] });
                        }

                    } else if (i.customId === `offer_decline_${interaction.id}`) {
                        await i.editReply({
                            content: `❌ You have declined the offer from **${team}**.`,
                            components: []
                        });

                        if (logChannel) {
                            const declineEmbed = new EmbedBuilder()
                                .setColor(0xED4245)
                                .setTitle('❌ Transfer Cancelled')
                                .setDescription(`${player} has declined the offer from **${team}**.`)
                                .setTimestamp();

                            await logChannel.send({ embeds: [declineEmbed] });
                        }
                    }
                } catch (error) {
                    // Kodda bizim göremediğimiz başka bir hata varsa botun çökmemesi için
                    console.error('Buton işleminde beklenmeyen hata:', error);
                }
            });

            collector.on('end', (collected, reason) => {
                if (reason === 'time') {
                    dmMessage.edit({
                        content: '⏳ This offer has expired.',
                        components: []
                    }).catch(console.error);
                }
            });

        } catch (error) {
            await interaction.followUp({
                content: `❌ The offer could not be sent because ${player} has DMs disabled.`,
                ephemeral: true
            });

            logger.warn('Failed to send offer DM', {
                playerId: player.id,
                error: error.message
            });
        }
