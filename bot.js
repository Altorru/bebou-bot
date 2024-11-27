import { Client, GatewayIntentBits, Partials, Collection, ActivityType } from 'discord.js';
import { REST } from '@discordjs/rest';
import { Routes } from 'discord-api-types/v9';
import axios from 'axios';
import * as cheerio from 'cheerio';
const url = 'https://www.ffvbbeach.org/ffvbapp/resu/vbspo_calendrier.php?saison=2024%2F2025&codent=LIPL&poule=RMA&calend=COMPLET&equipe=1&x=9&y=8';

async function fetchNextMatch() {
    try {
        // Récupération du contenu HTML de la page
        const { data } = await axios.get(url);

        // Chargement du contenu HTML avec cheerio
        const $ = cheerio.load(data);

        // Sélection de la 4ème table
        const fourthTable = $('table').eq(3); // Les indices commencent à 0

        if (fourthTable.length === 0) {
            console.log("La quatrième table n'a pas été trouvée.");
            return;
        }

        // Extraction du contenu de la table
        const tableContent = [];
        fourthTable.find('tr').each((_, row) => {
            const rowData = [];
            $(row).find('td').each((_, cell) => {
                rowData.push($(cell).text().trim());
            });

            // N'ajoute que si la ligne n'est pas vide et contient moins de 11 éléments
            if (rowData.length > 1 && rowData.length < 12) {
                tableContent.push(rowData);
            }
        });
        if (tableContent.length === 0) {
            return "Aucun match trouvé pour le moment."; // Message par défaut
        }
        
        // Extraction des données du prochain match
        const nextMatch = tableContent[0]; // Première ligne valide
        const date = nextMatch[1]; // Date du match
        const time = nextMatch[2]; // Heure du match
        const homeTeam = nextMatch[3]; // Équipe à domicile
        const awayTeam = nextMatch[5]; // Équipe visiteuse
        const location = nextMatch[7]; // Lieu du match

        // Formatage de la sortie
        if (homeTeam != "OYA VOLLEY-BALL") {
            return `Le prochain match est le ${date} à ${time} à la ${location}, contre ${homeTeam} :volleyball:`;
        }else return `Le prochain match est le ${date} à ${time} à la ${location}, contre ${awayTeam} :volleyball:`;
    } catch (error) {
        console.error('Erreur lors de la récupération des données:', error.message);
        return "Impossible de récupérer les données pour le prochain match.";
    }
}

// Define your intents
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers
  ]
});

const chut = [
  "Ta geule ptn !!!!",
  "Chhhhhhh...",
  "Tssssssss c'est dingue ça 😮‍💨 😩",
  "La ferme 🤫"
];

// When the bot is ready
client.once('ready', () => {
  setInterval(() => client.user.setPresence({activities: [{ name: 'son Maxi Fiak', type: ActivityType.Streaming, url: 'https://www.twitch.tv/altorru_tv' }],status: 'online'}), 15000);
  console.log('Bot opérationnel');
});

// Registering Slash Commands
const commands = [
  {
    name: 'voc',
    description: 'Mentionne tout le monde pour venir en voc 🎤',
  },
  {
    name: 'match',
    description: 'Renvoie le prochain match de OVB RMA 🏐',
  },
  {
    name: 'tg',
    description: 'Demande à quelqu\'un de se taire avec un message aléatoire 🤫',
    options: [
      {
        name: 'user',
        description: 'Demande à quelqu\'un de se taire avec un message aléatoire 🤫',
        type: 6, // 6 is USER type
        required: true
      }
    ]
  },
  {
    name: 'bn',
    description: 'Souhaite une bonne nuit à tout le monde 🌛 ✨',
  },
  {
    name: 'aprem',
    description: 'Demande qui fait quoi cet après-midi 🕐',
  },
  {
    name: 'clear',
    description: 'Supprime les derniers [n] messages (par défaut 5) 🧹',
    options: [
      {
        name: 'amount',
        description: 'Number of messages to clear',
        type: 4, // 4 is INTEGER type
        required: false
      }
    ]
  },
  {
    name: 'help',
    description: 'Affiche la liste d\'aide',
  }
];

const rest = new REST({ version: '9' }).setToken('TOKEN');

(async () => {
  try {
    console.log('Started refreshing application (/) commands.');

    await rest.put(
      Routes.applicationCommands('904350692477636638'),
      { body: commands },
    );

    console.log('Successfully reloaded application (/) commands.');
  } catch (error) {
    console.error(error);
  }
})();

// Slash Command Handling
client.on('interactionCreate', async interaction => {
  if (!interaction.isCommand()) return;

  const { commandName, options, member } = interaction;

  if (commandName === 'voc') {
    if (member.roles.cache.size > 1) {
      await interaction.reply('@everyone Venez voc 🎤 !!!');
    } else {
      await interaction.reply({ content: "Tu n'as pas la permission d'utiliser cette commande", ephemeral: true });
    }
  }
  
  if (commandName === 'match') {
    if (member.roles.cache.size > 1) {
      const nextMatch = await fetchNextMatch();
      await interaction.reply(nextMatch);
    } else {
      await interaction.reply({ content: "Tu n'as pas la permission d'utiliser cette commande", ephemeral: true });
    }
  }

  if (commandName === 'tg') {
    const user = options.getUser('user');
    if (user) {
      const randomMessage = chut[Math.floor(Math.random() * chut.length)];
      await interaction.reply(`<@${user.id}> ${randomMessage}`);
    } else {
      await interaction.reply({ content: 'Tu dois mentionner un membre valide !', ephemeral: true});
    }
  }

  if (commandName === 'bn') {
    await interaction.reply(`Bonne nuit @here de la part de ${interaction.user} 🌛 ✨`);
  }

  if (commandName === 'aprem') {
    await interaction.reply(`@everyone Qui fait quoi cet aprèm les béboux demande ${interaction.user} ?`);
  }

  if (commandName === 'clear') {
    if (interaction.member.permissions.has('MANAGE_MESSAGES')) {
      const amount = options.getInteger('amount') || 5;
      const messages = await interaction.channel.bulkDelete(amount, true);
      await interaction.reply({ content: `Supprimé ${messages.size} messages 🧹`, ephemeral: true});
    } else {
      await interaction.reply('Tu n\'as pas les permissions de gérer les messages !', { ephemeral: true });
    }
  }

  if (commandName === 'help') {
    await interaction.reply(`
**Liste des commandes disponibles :**
- \`/voc\` : Mentionne tout le monde pour venir en voc 🎤
- \`/match\` : Renvoie le prochain match de OVB RMA 🏐
- \`/tg [@mention]\` : Demande à quelqu'un de se taire avec un message aléatoire 🤫
- \`/bn\` : Souhaite une bonne nuit à tout le monde 🌛 ✨
- \`/aprem\` : Demande qui fait quoi cet après-midi 🕐
- \`/clear [n]\` : Supprime les derniers [n] messages (par défaut 5) 🧹
- \`/help\` : Affiche cette liste d'aide
    `);
  }
});

// Add error handling to prevent crashes
client.on('error', (error) => {
  console.error('An error occurred:', error);
});

client.on('shardError', (error) => {
  console.error('A websocket connection error occurred:', error);
});

// This will handle any unhandled promise rejections and log them
process.on('unhandledRejection', error => {
  console.error('Unhandled promise rejection:', error);
});

// This will catch other unexpected errors
process.on('uncaughtException', error => {
  console.error('Uncaught exception:', error);
});

// Login the bot using the token
client.login('TOKEN');
