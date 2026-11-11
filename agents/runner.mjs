#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ajan tanımlarını yükle
const definitionsPath = path.join(__dirname, 'definitions.json');
const definitions = JSON.parse(fs.readFileSync(definitionsPath, 'utf8'));

// CLI Argümanlarını Ayrıştır
const args = process.argv.slice(2);
function getArg(key, defaultValue = null) {
  const index = args.indexOf(`--${key}`);
  if (index !== -1 && index + 1 < args.length) {
    return args[index + 1];
  }
  return defaultValue;
}
const hasFlag = (key) => args.includes(`--${key}`);

const agentKey = getArg('agent', 'ali-oda');
const provider = getArg('provider', 'gemini');
const modelName = getArg('model', null);
const promptText = getArg('prompt', null);
const isInteractive = hasFlag('interactive') || hasFlag('i');

const agent = definitions.agents[agentKey];

if (!agent) {
  console.error(`\n❌ Hata: '${agentKey}' adında bir ajan bulunamadı.`);
  console.log('Mevcut Ajanlar:');
  Object.keys(definitions.agents).forEach((k) => {
    console.log(`  - ${k}: ${definitions.agents[k].name} (${definitions.agents[k].title})`);
  });
  process.exit(1);
}

console.log('='.repeat(65));
console.log(`🤖 Ajan: ${agent.name} [${agent.title}]`);
console.log(`🔌 Platform / Sağlayıcı: ${provider.toUpperCase()}`);
console.log('='.repeat(65));

// LLM Çağrı Katmanı (Harici kütüphane gerektirmeyen saf fetch API)
async function callLLM(userPrompt, conversationHistory = []) {
  if (provider === 'gemini') {
    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY veya GOOGLE_API_KEY ortam değişkeni bulunamadı. Lütfen 'set GEMINI_API_KEY=...' ile tanımlayın.");
    }
    const model = modelName || 'gemini-2.5-flash';
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const contents = [
      ...conversationHistory,
      { role: 'user', parts: [{ text: userPrompt }] }
    ];

    const body = {
      systemInstruction: {
        parts: [{ text: agent.system_prompt }]
      },
      contents: contents
    };

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(`Gemini API Hatası: ${data.error?.message || JSON.stringify(data)}`);
    }

    return data.candidates?.[0]?.content?.parts?.[0]?.text || '(Yanıt alınamadı)';
  } else if (provider === 'openai' || provider === 'ollama' || provider === 'deepseek') {
    let apiKey = process.env.OPENAI_API_KEY;
    let baseURL = 'https://api.openai.com/v1';
    let defaultModel = 'gpt-4o-mini';

    if (provider === 'ollama') {
      baseURL = process.env.OLLAMA_BASE_URL || 'http://localhost:11434/v1';
      apiKey = 'ollama';
      defaultModel = 'llama3';
    } else if (provider === 'deepseek') {
      baseURL = 'https://api.deepseek.com/v1';
      apiKey = process.env.DEEPSEEK_API_KEY;
      defaultModel = 'deepseek-chat';
    }

    const model = modelName || defaultModel;

    const messages = [
      { role: 'system', content: agent.system_prompt },
      ...conversationHistory.map(c => ({
        role: c.role === 'model' ? 'assistant' : c.role,
        content: c.parts?.[0]?.text || c.content
      })),
      { role: 'user', content: userPrompt }
    ];

    const res = await fetch(`${baseURL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model,
        messages
      })
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(`${provider} API Hatası: ${data.error?.message || JSON.stringify(data)}`);
    }

    return data.choices?.[0]?.message?.content || '(Yanıt alınamadı)';
  } else {
    throw new Error(`Desteklenmeyen sağlayıcı: ${provider}. (gemini, openai, deepseek, ollama desteklenir)`);
  }
}

// Çalıştırma Modları
async function main() {
  if (promptText) {
    // Tek seferlik komut istemi
    try {
      process.stdout.write(`\n⏳ ${agent.name} düşünüyor...\n\n`);
      const response = await callLLM(promptText);
      console.log(response);
    } catch (err) {
      console.error(`\n❌ [HATA]: ${err.message}`);
      process.exit(1);
    }
  } else if (isInteractive) {
    // Etkileşimli Sohbet Modu
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    const history = [];
    console.log(`\n💬 ${agent.name} ile canlı sohbet modu başlatıldı. Çıkmak için 'exit' veya 'cikis' yazın.\n`);

    const ask = () => {
      rl.question('Siz: ', async (input) => {
        const trimmed = input.trim();
        if (trimmed.toLowerCase() === 'exit' || trimmed.toLowerCase() === 'cikis') {
          console.log(`👋 ${agent.name}: Görüşmek üzere!`);
          rl.close();
          return;
        }
        if (!trimmed) {
          ask();
          return;
        }

        try {
          process.stdout.write(`⏳ ${agent.name} yazıyor...\r`);
          const reply = await callLLM(trimmed, history);
          process.stdout.write(' '.repeat(40) + '\r'); // satırı temizle
          console.log(`\n${agent.name}:\n${reply}\n`);

          // Geçmişe ekle
          if (provider === 'gemini') {
            history.push({ role: 'user', parts: [{ text: trimmed }] });
            history.push({ role: 'model', parts: [{ text: reply }] });
          } else {
            history.push({ role: 'user', content: trimmed });
            history.push({ role: 'assistant', content: reply });
          }
        } catch (err) {
          console.error(`\n❌ [HATA]: ${err.message}\n`);
        }
        ask();
      });
    };
    ask();
  } else {
    console.log(`
Kullanım Şekilleri:
  1. Tek Komut:
     node agents/runner.mjs --agent ${agentKey} --provider gemini --prompt "Sorunuz buraya"

  2. Etkileşimli Canlı Sohbet:
     node agents/runner.mjs --agent ${agentKey} --provider gemini --interactive

  3. Farklı Platformlar:
     --provider [gemini | openai | deepseek | ollama]
    `);
  }
}

main();
