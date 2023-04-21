const db = require("quick.db");
module.exports = {
  name: 'massrole',
  description: 'Ajoute ou enlève un rôle à tous les membres du serveur.',
  usage: 'massrole <@rôle/id> <add/remove> [(@targetRole/ID targetRole)/everyone]',
  permission: "perm7", 
  whitelist: false, 
  cooldown: "10", 
  aliases: [], 
  category: "utile", 
  run: async (client, message, args, Discord, prefix) => {

    if(db.get(`cooldown_massrole_${client.config.clientID}`)){
      let Embed = new Discord.MessageEmbed()
        .setDescription("MASSROLE")
        .setDescription(`Une opération est déjà en cours.`)
        .setColor(client.embed_color)
        .setFooter({ text: client.footer })
      return message.reply({ embeds: [Embed] })

    }
    if(args[0]) roleId = args[0].replace(/[^\d]/g, ''); 
    else {
      let Embed = new Discord.MessageEmbed()
        .setDescription("MASSROLE")
        .setDescription(`Erreur de syntaxe ! Veuillez correctement utiliser la commande: ${prefix}massrole **<@rôle/id>** <add/remove> [(@targetRole/ID targetRole)/everyone]`)
        .setColor(client.embed_color)
        .setFooter({ text: client.footer })
      return message.reply({ embeds: [Embed] })

    }
    const role = message.guild.roles.cache.get(roleId) || message.guild.roles.cache.find(r => r.name === args[0]);
    const action = args[1];
    let targetRole;
    if(args[2]) targetRole = args[2] ? message.guild.roles.cache.get(args[2].replace(/[^\d]/g, '')) : null;
    if (!role) {
      let Embed = new Discord.MessageEmbed()
        .setDescription("MASSROLE")
        .setDescription(`Erreur de syntaxe ! Veuillez correctement utiliser la commande: ${prefix}massrole **<@rôle/id>** <add/remove> [(@targetRole/ID targetRole)/everyone]`)
        .setColor(client.embed_color)
        .setFooter({ text: client.footer })
      return message.reply({ embeds: [Embed] })
    }

    const err1 = new Discord.MessageEmbed()
        .setTitle("MASSROLE")
        .setDescription(`Le rôle ${role} est hiérarchiquement supérieur ou égal à mon rôle le plus haut.`)
        .setColor(client.embed_color)
        .setFooter({ text: client.footer })

    if(message.guild.members.cache.get(client.user.id).roles.highest.position <= role.position)return message.reply({ embeds: [err1] })


    if (!action || !['add', 'remove'].includes(action)) {
      let Embed = new Discord.MessageEmbed()
        .setDescription("MASSROLE")
        .setDescription(`Erreur de syntaxe ! Veuillez correctement utiliser la commande: ${prefix}massrole <@rôle/id> **<add/remove>** [(@targetRole/ID targetRole)/everyone]`)
        .setColor(client.embed_color)
        .setFooter({ text: client.footer })
      return message.reply({ embeds: [Embed] })
    }

    let members;

    if (action === 'add') {
        
        members = targetRole ? targetRole.members.filter(m => !m.roles.cache.has(role.id)) : (await message.guild.members.fetch()).filter(m => !m.roles.cache.has(role.id));
      } else if (action === 'remove') {
        members = targetRole ? targetRole.members.filter(m => m.roles.cache.has(role.id)) : (await message.guild.members.fetch()).filter(m => m.roles.cache.has(role.id));
      }


    const totalMembers = members.size;
    let count = 0;
    let remaining = totalMembers; 
    const start = Date.now();

    message.channel.send(`Opération en cours sur ${totalMembers} membres...`);

    db.set(`cooldown_massrole_${client.config.clientID}`, client.config.clientID)
    let Embed = new Discord.MessageEmbed()
        .setDescription("MASSROLE")
        .setDescription(`Initialisation en cours... ${client.emoji.loading}`)
        .setColor(client.embed_color)
        .setFooter({ text: client.footer })
    message.channel.send({ embeds: [Embed] }).then(async m => {
    


    for (const [memberId, member] of members) {
      try {
        if (action === 'add' && !member.roles.cache.has(role.id)) {
          await member.roles.add(role);
        } else if (action === 'remove'  && member.roles.cache.has(role.id)) {
          await member.roles.remove(role);
        }
        count++;
        remaining--;
        const elapsed = Date.now() - start;
        const averageTime = elapsed / count;
        const estimatedTime = remaining * averageTime;

        let Embed_edit = new Discord.MessageEmbed()
            .setTitle("MASSROLE")
            .setDescription(`Modification en cours sur ${remaining} membres. Temps restant estimé : ${msToTime(estimatedTime)}, action effectuée sur ${member}.`)
            .setColor(client.embed_color)
            .setFooter({ text: client.footer })


        m.edit({ embeds: [Embed_edit] })
        await sleep(2000); 
      } catch (error) {
        console.error(error);
      }
    }

    const elapsed = Date.now() - start;

    let Embed2 = new Discord.MessageEmbed()
        .setTitle("MASSROLE")
        .setDescription(`Opération terminée! ${count} sur ${totalMembers} membres ont été ${action === 'add' ? 'ajoutés' : 'enlevés'} du rôle ${role}. Temps total : ${msToTime(elapsed)}.`)
        .setColor(client.embed_color)
        .setFooter({ text: client.footer })
    message.channel.send({ embeds: [Embed2] })
    db.delete(`cooldown_massrole_${client.config.clientID}`)

    })
},
};


function msToTime(duration) {
  const seconds = Math.floor((duration / 1000) % 60);
  const minutes = Math.floor((duration / (1000 * 60)) % 60);
  const hours = Math.floor((duration / (1000 * 60 * 60)) % 24);

  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}


function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
