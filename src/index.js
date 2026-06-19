import { Client, GatewayIntentBits, ActivityType } from 'discord.js';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

let bot = null;
let currentConfig = null;

async function loadConfig() {
  const { data, error } = await supabase
    .from('bot_config') // Nome da tabela que o painel usa
    .select('*')
    .eq('id', 1) // Assume que tem só um registro principal
    .single();

  if (error) {
    console.error('Erro ao carregar config:', error);
    return null;
  }
  return data;
}

async function startBot(config) {
  if (bot) {
    await bot.destroy();
  }

  bot = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent,
      GatewayIntentBits.GuildMembers,
    ]
  });

  bot.once('ready', () => {
    console.log(`✅ Bot logado como ${bot.user.tag}`);
    
    // Definir atividade
    if (config.activity) {
      bot.user.setActivity(config.activity, { 
        type: ActivityType.Custom 
      });
    }
  });

  bot.on('messageCreate', async message => {
    if (message.author.bot) return;
    
    const prefix = config.prefix || '!';
    if (!message.content.startsWith(prefix)) return;

    const args = message.content.slice(prefix.length).trim().split(/ +/);
    const command = args.shift().toLowerCase();

    // Exemplo de comando básico
    if (command === 'ping') {
      await message.reply('Pong! 🏓');
    }
  });

  await bot.login(config.token);
}

async function main() {
  console.log('🚀 Iniciando Discord Bot Worker...');

  while (true) {
    const config = await loadConfig();
    
    if (config?.active && config?.token) {
      if (!currentConfig || currentConfig.token !== config.token || 
          JSON.stringify(currentConfig) !== JSON.stringify(config)) {
        
        console.log('🔄 Configuração alterada ou bot inativo. Reiniciando...');
        currentConfig = config;
        await startBot(config);
      }
    } else if (bot) {
      console.log('⛔ Bot desativado no painel. Desconectando...');
      await bot.destroy();
      bot = null;
      currentConfig = null;
    }

    await new Promise(r => setTimeout(r, parseInt(process.env.HEARTBEAT_MS) || 15000));
  }
}

main().catch(console.error);
