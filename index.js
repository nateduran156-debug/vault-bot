import { Client, GatewayIntentBits, EmbedBuilder, REST, Routes, SlashCommandBuilder } from 'discord.js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

const anime = JSON.parse(readFileSync(join(__dirname, 'data/anime.json'), 'utf8'));
const males = JSON.parse(readFileSync(join(__dirname, 'data/males.json'), 'utf8'));
const females = JSON.parse(readFileSync(join(__dirname, 'data/females.json'), 'utf8'));
const matching = JSON.parse(readFileSync(join(__dirname, 'data/matching.json'), 'utf8'));

const PREFIX = '.';
const TOKEN = process.env.DISCORD_TOKEN;
const CLIENT_ID = process.env.DISCORD_CLIENT_ID;

if (!TOKEN) {
  console.error('missing DISCORD_TOKEN in environment');
  process.exit(1);
}

const firstWords = [
  'phase', 'safe', 'faded', 'lonely', 'void', 'dark', 'lost', 'echo',
  'drift', 'ghost', 'cold', 'silent', 'numb', 'still', 'slow', 'blur',
  'gray', 'dim', 'hollow', 'broken', 'pale', 'muted', 'haze', 'veil',
  'dusk', 'ash', 'ruin', 'sorrow', 'empty', 'distant', 'faint', 'wither',
  'ache', 'somber', 'grave', 'bleak', 'dreary', 'gloam', 'sullen', 'stark',
  'void', 'nether', 'vague', 'murk', 'nocturne', 'hollow', 'wane', 'shade',
  'gloom', 'barren', 'sparse', 'mellow', 'serene', 'tranquil', 'latent',
  'lull', 'drift', 'sleep', 'wake', 'flux', 'hush', 'still', 'fallow',
];

const secondWords = [
  'run', 'trap', 'nights', 'memories', 'echo', 'drift', 'void', 'shore',
  'light', 'flame', 'wave', 'sky', 'rain', 'fall', 'glow', 'pulse',
  'edge', 'zone', 'core', 'mind', 'walk', 'path', 'realm', 'veil',
  'shift', 'loop', 'trace', 'born', 'ward', 'lock', 'less', 'ward',
  'step', 'break', 'mark', 'call', 'reach', 'hold', 'keep', 'gate',
  'field', 'line', 'form', 'space', 'place', 'state', 'side', 'mode',
  'world', 'land', 'vale', 'rift', 'flow', 'stream', 'deep', 'end',
];

function generateUsername() {
  const styles = [
    () => {
      const w1 = firstWords[Math.floor(Math.random() * firstWords.length)];
      const w2 = secondWords[Math.floor(Math.random() * secondWords.length)];
      return w1 + w2;
    },
    () => {
      const w1 = firstWords[Math.floor(Math.random() * firstWords.length)];
      const w2 = firstWords[Math.floor(Math.random() * firstWords.length)];
      return w1 + w2;
    },
    () => {
      const w1 = firstWords[Math.floor(Math.random() * firstWords.length)];
      const w2 = secondWords[Math.floor(Math.random() * secondWords.length)];
      const num = Math.random() > 0.6 ? Math.floor(Math.random() * 9) : '';
      return w1 + w2 + num;
    },
    () => {
      const combos = [
        'vociular', 'solace', 'reverie', 'lacuna', 'penumbra', 'liminal',
        'vestige', 'ephemeral', 'requiem', 'elegy', 'solstice', 'equinox',
        'tenebrae', 'umbral', 'nocturne', 'lethean', 'morphic', 'phanic',
      ];
      return combos[Math.floor(Math.random() * combos.length)];
    },
  ];

  const style = styles[Math.floor(Math.random() * styles.length)];
  return style();
}

function generateMultipleUsernames(count = 5) {
  const names = new Set();
  while (names.size < count) {
    names.add(generateUsername());
  }
  return [...names];
}

function randomFrom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getPfp(category) {
  switch (category) {
    case 'males': return { url: randomFrom(males), type: 'males' };
    case 'females': return { url: randomFrom(females), type: 'females' };
    case 'anime': return { url: randomFrom(anime), type: 'anime' };
    case 'matching': {
      const pair = randomFrom(matching);
      return { url: pair[0], url2: pair[1], type: 'matching' };
    }
    default: {
      const all = [
        { pool: males, type: 'males' },
        { pool: females, type: 'females' },
        { pool: anime, type: 'anime' },
      ];
      const pick = randomFrom(all);
      return { url: randomFrom(pick.pool), type: pick.type };
    }
  }
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

const slashCommands = [
  new SlashCommandBuilder()
    .setName('generate')
    .setDescription('generates discord usernames for u'),
  new SlashCommandBuilder()
    .setName('pfps')
    .setDescription('sends a random pfp')
    .addStringOption(opt =>
      opt.setName('category')
        .setDescription('what type of pfp u want')
        .setRequired(false)
        .addChoices(
          { name: 'males', value: 'males' },
          { name: 'females', value: 'females' },
          { name: 'anime', value: 'anime' },
          { name: 'matching', value: 'matching' },
          { name: 'random', value: 'random' },
        )
    ),
].map(cmd => cmd.toJSON());

async function registerSlashCommands() {
  if (!CLIENT_ID) {
    console.log('no DISCORD_CLIENT_ID set, skipping slash command registration');
    return;
  }
  try {
    const rest = new REST({ version: '10' }).setToken(TOKEN);
    await rest.put(Routes.applicationCommands(CLIENT_ID), { body: slashCommands });
    console.log('slash commands registered globally');
  } catch (err) {
    console.error('failed to register slash commands:', err);
  }
}

function handleGenerate(replyFn) {
  const names = generateMultipleUsernames(5);
  const embed = new EmbedBuilder()
    .setTitle('username ideas')
    .setColor(0x2b2d31)
    .setDescription(names.map(n => `\`${n}\``).join('\n'))
    .setFooter({ text: 'these might actually be available ngl' });
  return replyFn({ embeds: [embed] });
}

function handlePfps(category, replyFn) {
  const result = getPfp(category || 'random');
  if (result.type === 'matching') {
    return replyFn({ content: `${result.url}\n${result.url2}` });
  }
  return replyFn({ content: result.url });
}

client.once('ready', async () => {
  console.log(`logged in as ${client.user.tag}`);
  await registerSlashCommands();
});

client.on('messageCreate', async (message) => {
  if (message.author.bot) return;
  if (!message.content.startsWith(PREFIX)) return;

  const args = message.content.slice(PREFIX.length).trim().split(/\s+/);
  const command = args[0]?.toLowerCase();

  if (command === 'generate') {
    await handleGenerate((opts) => message.reply(opts));
  } else if (command === 'pfps') {
    const category = args[1]?.toLowerCase() || 'random';
    const validCats = ['males', 'females', 'anime', 'matching', 'random'];
    const cat = validCats.includes(category) ? category : 'random';
    await handlePfps(cat, (opts) => message.reply(opts));
  }
});

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === 'generate') {
    await handleGenerate((opts) => interaction.reply(opts));
  } else if (interaction.commandName === 'pfps') {
    const category = interaction.options.getString('category') || 'random';
    await handlePfps(category, (opts) => interaction.reply(opts));
  }
});

client.login(TOKEN);
