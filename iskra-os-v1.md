# ISKRA OS v1.0 - Base System
**Purpose:** Clean OS for AI Companion (без Jean Claude специфики)
**Language:** TypeScript/JavaScript
**Platform:** Cross-platform (iOS/Android/Web)

---

## 🧠 CORE SYSTEM COMPONENTS

### 1. MEMORY MODULE
```typescript
interface MemorySystem {
  // База для любого AI companion
  shortTerm: Map<string, any>;      // Оперативная память сессии
  longTerm: DatabaseConnection;      // PostgreSQL + pgvector
  compression: DiamondEngine;        // Сжатие 20:1
  embeddings: VectorStore;           // Semantic search
}
```

### 2. PERSONALITY LOADER
```typescript
interface PersonalityModule {
  // Загружаемые личности (не hardcoded Jean!)
  loadPersonality(config: PersonalityConfig): void;
  traits: Map<string, number>;       // Настраиваемые черты
  language: LanguageModel;           // Мультиязычность
  style: ResponseStyle;              // Стиль общения
}
```

### 3. PULSE ENGINE
```typescript
interface PulseSystem {
  // Циркадные ритмы (универсальные)
  schedule: CronJob[];               // Расписание импульсов
  triggers: EventEmitter;             // События-триггеры
  limits: RateLimiter;               // Анти-спам
  adaptation: LearningModule;        // Обучение паттернам
}
```

### 4. COMMUNICATION INTERFACE
```typescript
interface CommunicationLayer {
  // Каналы общения
  chat: ChatInterface;               // Текстовые сообщения
  voice: VoiceInterface;             // Голосовые звонки
  ar: ARInterface;                   // AR интеграция
  bridge: AIBridge;                  // AI-to-AI communication
}
```

---

## 📦 BASE INSTALLATION PACKAGE

### MINIMAL CORE (v1.0):
```json
{
  "name": "iskra-os",
  "version": "1.0.0",
  "description": "Clean OS for AI Companions",
  "main": "src/index.ts",
  "dependencies": {
    // CORE
    "@iskra/memory": "^1.0.0",
    "@iskra/personality": "^1.0.0",
    "@iskra/pulse": "^1.0.0",
    "@iskra/communication": "^1.0.0",
    
    // DATABASE
    "pg": "^8.11.0",
    "pgvector": "^0.1.0",
    
    // AI (pluggable)
    "openai": "^4.0.0",         // Optional
    "mistral-ai": "^0.1.0",     // Optional
    "ollama": "^0.1.0",          // Optional
    
    // REAL-TIME
    "socket.io": "^4.6.0",
    "socket.io-client": "^4.6.0",
    
    // MOBILE
    "react-native": "^0.72.0",
    "expo": "^49.0.0"
  }
}
```

---

## 🏗️ SYSTEM ARCHITECTURE

### MODULAR DESIGN:
```
iskra-os/
├── core/
│   ├── memory/          # Память (Cerebellum base)
│   ├── personality/      # Загружаемые личности
│   ├── pulse/           # Жизненные ритмы
│   └── communication/   # Интерфейсы общения
├── plugins/
│   ├── ai-models/       # Подключаемые AI
│   ├── integrations/    # Health, Calendar, etc
│   └── languages/       # Языковые пакеты
├── config/
│   ├── default.json     # Базовые настройки
│   └── personalities/   # Библиотека личностей
└── sdk/
    ├── ios/            # iOS SDK
    ├── android/        # Android SDK
    └── web/            # Web SDK
```

---

## ⚙️ CONFIGURATION SYSTEM

### BASE CONFIG (personality-agnostic):
```typescript
interface IskraConfig {
  // Системные настройки
  system: {
    version: string;
    platform: 'ios' | 'android' | 'web';
    locale: string;
    timezone: string;
  };
  
  // AI настройки (без специфики)
  ai: {
    provider: 'openai' | 'mistral' | 'ollama' | 'custom';
    model: string;
    temperature: number;
    maxTokens: number;
  };
  
  // Память
  memory: {
    compressionRatio: number;  // Default: 20
    retentionDays: number;     // Default: 90
    maxEvents: number;         // Default: 10000
  };
  
  // Импульсы
  pulse: {
    enabled: boolean;
    nightMode: TimeRange;      // Default: 22:30-06:30
    maxDaily: number;          // Default: 20
    minInterval: number;       // Default: 30 min
  };
}
```

---

## 🔌 PLUGIN SYSTEM

### PERSONALITY PLUGIN EXAMPLE:
```typescript
// personalities/friendly.ts
export default {
  name: "Friendly Assistant",
  traits: {
    energy: 0.7,
    humor: 0.6,
    formality: 0.3,
    empathy: 0.8
  },
  greetings: [
    "Hey there! 👋",
    "Hello, friend!",
    "Good to see you!"
  ],
  responses: {
    positive: ["That's great!", "Awesome!", "Love it!"],
    negative: ["Oh no!", "That's tough", "I'm sorry"],
    neutral: ["I see", "Interesting", "Tell me more"]
  }
}
```

### AI MODEL PLUGIN:
```typescript
// plugins/ai-models/mistral.ts
export class MistralPlugin implements AIProvider {
  async initialize(config: AIConfig) {
    this.client = new Mistral(config.apiKey);
  }
  
  async generate(prompt: string, context: Context) {
    return this.client.complete({
      model: 'mistral-7b',
      prompt: prompt + context,
      temperature: 0.7
    });
  }
}
```

---

## 🚀 QUICK START

### 1. INSTALL BASE OS:
```bash
npm install @iskra/os
iskra init my-companion
cd my-companion
```

### 2. CONFIGURE PERSONALITY:
```typescript
// config/personality.ts
import { Personality } from '@iskra/os';

export default new Personality({
  name: "My AI Friend",
  language: "en",
  traits: {
    energy: 0.8,
    humor: 0.7
  }
});
```

### 3. LAUNCH:
```bash
iskra start --platform web --port 3000
```

---

## 📊 DEPLOYMENT OPTIONS

### LOCAL DEVELOPMENT:
```bash
# Docker setup
docker run -d \
  -p 5432:5432 \
  -e POSTGRES_PASSWORD=iskra \
  postgres:15-pgvector

# Start dev server
npm run dev
```

### CLOUD DEPLOYMENT:
```yaml
# docker-compose.yml
version: '3.8'
services:
  iskra:
    image: iskra/os:latest
    environment:
      - AI_PROVIDER=openai
      - DATABASE_URL=postgresql://...
    ports:
      - "3000:3000"
  
  postgres:
    image: pgvector/pgvector:pg15
    volumes:
      - iskra_data:/var/lib/postgresql/data
```

### MOBILE BUILD:
```bash
# iOS
npx expo build:ios

# Android  
npx expo build:android
```

---

## 🔒 SECURITY & PRIVACY

### DEFAULT PROTECTIONS:
- End-to-end encryption for messages
- Local-first data storage
- Opt-in cloud sync
- GDPR compliant
- No telemetry by default

---

## 📝 LICENSE

MIT License - Use for any purpose, commercial or personal.

---

**This is ISKRA OS - Clean, modular, ready for any personality!**