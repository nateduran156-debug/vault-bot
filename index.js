import { Client, GatewayIntentBits, EmbedBuilder, REST, Routes, SlashCommandBuilder } from 'discord.js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

const anime = JSON.parse(readFileSync(join(__dirname, 'data/anime.json'), 'utf8'));
const males = JSON.parse(readFileSync(join(__dirname, 'data/males.json'), 'utf8'));
const females = JSON.parse(readFileSync(join(__dirname, 'data/females.json'), 'utf8'));
const matching = JSON.parse(readFileSync(join(__dirname, 'data/matching.json'), 'utf8'));
const dark = JSON.parse(readFileSync(join(__dirname, 'data/dark.json'), 'utf8'));
const art = JSON.parse(readFileSync(join(__dirname, 'data/art.json'), 'utf8'));
const cats = JSON.parse(readFileSync(join(__dirname, 'data/cats.json'), 'utf8'));
const vintage = JSON.parse(readFileSync(join(__dirname, 'data/vintage.json'), 'utf8'));

const PREFIX = '.';
const TOKEN = process.env.DISCORD_TOKEN;
const CLIENT_ID = process.env.DISCORD_CLIENT_ID;

if (!TOKEN) {
  console.error('missing DISCORD_TOKEN in environment');
  process.exit(1);
}

const wordParts = {
  first: [
    'phase', 'faded', 'lonely', 'hollow', 'silent', 'broken', 'distant',
    'ghost', 'pale', 'haze', 'dusk', 'ash', 'veil', 'somber', 'wither',
    'muted', 'gloam', 'bleak', 'sullen', 'shade', 'murk', 'barren',
    'serene', 'latent', 'lull', 'flux', 'lucid', 'void', 'numb',
    'cold', 'still', 'dim', 'drift', 'lost', 'wane', 'echo',
    'ruin', 'sorrow', 'ache', 'grave', 'stark', 'nocturne', 'elegy',
    'solace', 'reverie', 'vestige', 'liminal', 'lacuna', 'penumbra',
    'gloom', 'sparse', 'mellow', 'tranquil', 'sleep', 'wake', 'hush',
    'lament', 'embers', 'tender', 'morrow', 'gentle', 'hollow',
  ],
  second: [
    'run', 'trap', 'nights', 'memories', 'echo', 'drift', 'shore',
    'flame', 'wave', 'rain', 'fall', 'pulse', 'edge', 'realm',
    'veil', 'shift', 'trace', 'ward', 'path', 'gate', 'vale',
    'rift', 'flow', 'deep', 'end', 'light', 'break', 'hold',
    'call', 'reach', 'form', 'space', 'world', 'land', 'line',
    'bloom', 'tide', 'grave', 'hymn', 'choir', 'verse', 'lore',
    'borne', 'wraith', 'shade', 'vow', 'pyre', 'dusk', 'dawn',
    'stride', 'bound', 'crest', 'crown', 'less', 'ward', 'fall',
  ],
};

const singleAesthetic = [
  'vociular', 'solace', 'reverie', 'lacuna', 'penumbra', 'liminal',
  'vestige', 'elegy', 'solstice', 'tenebrae', 'umbral', 'nocturne',
  'lethean', 'morphic', 'ephemeral', 'requiem', 'equinox', 'spectre',
  'serein', 'miasma', 'sonder', 'hiraeth', 'kenopsia', 'chrysalism',
  'vellichor', 'desiderium', 'melisma', 'eudaimonia', 'oneiros',
  'aphelion', 'perihelion', 'nadir', 'zenith', 'aurora', 'solaire',
  'noctuary', 'verity', 'auric', 'ombra', 'lunacy', 'astral',
];

function randomFrom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateUsername() {
  const roll = Math.random();
  if (roll < 0.15) return randomFrom(singleAesthetic);
  if (roll < 0.55) return randomFrom(wordParts.first) + randomFrom(wordParts.second);
  return randomFrom(wordParts.first) + randomFrom(wordParts.first);
}

function generateMultipleUsernames(count = 5) {
  const names = new Set();
  let tries = 0;
  while (names.size < count && tries < 200) {
    names.add(generateUsername());
    tries++;
  }
  return [...names];
}

function getRandomUnique(pool, count) {
  const seen = new Set();
  const results = [];
  let tries = 0;
  const limit = Math.min(count, pool.length);
  while (results.length < limit && tries < 300) {
    const url = randomFrom(pool);
    if (!seen.has(url)) {
      seen.add(url);
      results.push(url);
    }
    tries++;
  }
  return results;
}

function buildImageEmbeds(urls) {
  return urls.map(url => new EmbedBuilder().setImage(url).setColor(0x2b2d31));
}

const pools = { males, females, anime, dark, art, cats, vintage };

function getPfpEmbeds(category) {
  if (category === 'matching') {
    const pair = randomFrom(matching);
    return buildImageEmbeds([pair[0], pair[1]]);
  }
  if (category === 'random') {
    const keys = Object.keys(pools);
    const pool = pools[randomFrom(keys)];
    return buildImageEmbeds(getRandomUnique(pool, 10));
  }
  const pool = pools[category];
  if (!pool) return buildImageEmbeds(getRandomUnique(males, 10));
  return buildImageEmbeds(getRandomUnique(pool, 10));
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

const pfpChoices = [
  { name: 'males', value: 'males' },
  { name: 'females', value: 'females' },
  { name: 'anime', value: 'anime' },
  { name: 'matching', value: 'matching' },
  { name: 'dark', value: 'dark' },
  { name: 'art', value: 'art' },
  { name: 'cats', value: 'cats' },
  { name: 'vintage', value: 'vintage' },
  { name: 'random', value: 'random' },
];

const categoryChoices = pfpChoices.filter(c => c.value !== 'matching' && c.value !== 'random');

const slashCommands = [
  new SlashCommandBuilder()
    .setName('generate')
    .setDescription('generates clean aesthetic discord usernames for u'),
  new SlashCommandBuilder()
    .setName('pfps')
    .setDescription('sends up to 10 pfps from a category')
    .addStringOption(opt =>
      opt.setName('category')
        .setDescription('what type of pfp u want')
        .setRequired(false)
        .addChoices(...pfpChoices)
    ),
  new SlashCommandBuilder()
    .setName('category')
    .setDescription('get multiple pfps from a specific category')
    .addStringOption(opt =>
      opt.setName('category')
        .setDescription('which category')
        .setRequired(true)
        .addChoices(...categoryChoices)
    )
    .addIntegerOption(opt =>
      opt.setName('amount')
        .setDescription('how many pfps (1-10, default 3)')
        .setRequired(false)
        .setMinValue(1)
        .setMaxValue(10)
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
  const embeds = getPfpEmbeds(category || 'random');
  return replyFn({ embeds });
}

function handleCategory(category, amount, replyFn) {
  const pool = pools[category];
  if (!pool) return replyFn({ content: 'invalid category' });
  const count = Math.min(Math.max(1, amount || 3), 10);
  return replyFn({ embeds: buildImageEmbeds(getRandomUnique(pool, count)) });
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
    const validCats = pfpChoices.map(c => c.value);
    const cat = validCats.includes(category) ? category : 'random';
    await handlePfps(cat, (opts) => message.reply(opts));
  } else if (command === 'category') {
    const category = args[1]?.toLowerCase();
    const amount = parseInt(args[2]) || 3;
    await handleCategory(category, amount, (opts) => message.reply(opts));
  }
});

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === 'generate') {
    await handleGenerate((opts) => interaction.reply(opts));
  } else if (interaction.commandName === 'pfps') {
    const category = interaction.options.getString('category') || 'random';
    await handlePfps(category, (opts) => interaction.reply(opts));
  } else if (interaction.commandName === 'category') {
    const category = interaction.options.getString('category');
    const amount = interaction.options.getInteger('amount') || 3;
    await handleCategory(category, amount, (opts) => interaction.reply(opts));
  }
});

client.login(TOKEN);
