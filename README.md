# ExtraHub — Платформа автоматизации школьных кружков и внеурочной деятельности

![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)
![React Version](https://img.shields.io/badge/react-19.2.8-blue.svg)
![Vite Version](https://img.shields.io/badge/vite-8.2.2-646CFF.svg)
![Firebase](https://img.shields.io/badge/firebase-12.18.0-FFCA28.svg)
![License](https://img.shields.io/badge/license-Proprietary-red.svg)

**ExtraHub** — это современная единая веб-платформа для управления школьными секциями, факультативами, клубами и программами олимпийского резерва. Проект связывает администрацию школы, координаторов внеурочной деятельности, преподавателей, учеников и их родителей, обеспечивая полный цикл: от выбора кружка и онлайн-записи до ведения журнала посещаемости и аналитики оплат.

---

## 🚀 Ключевые возможности (Features)

- **Интерактивный каталог кружков и секций**:
  - Поддержка 3 типов программ: *Обычный кружок (секция)*, *Клуб*, *Олимпийский резерв*.
  - Наглядное отображение количества свободных мест в реальном времени.
  - Фильтрация по параллелям классов (1–11 классы) и сменам обучения (1 и 2 смена).
- **Панель координатора и администратора**:
  - Управление лимитами вместимости групп (Capacity Management).
  - Мониторинг заполняемости групп и листов ожидания (Waitlist).
  - Конструктор учебных программ и создание расписания.
  - Формирование счетов на оплату и финансовый учет.
  - Экспорт аналитики и рейтингов в Excel (`.xlsx`).
- **Личный кабинет преподавателя**:
  - Электронный журнал посещаемости (Attendance Journal).
  - Проверка заявок на вступительные экзамены в секции олимпийского резерва.
  - Просмотр списков учеников и карточек профилей.
- **Кабинет родителя и ученика**:
  - Подача и отслеживание статуса заявок на зачисление.
  - Персональное расписание занятий с учётом смены обучения.
  - Отслеживание начисленных достижений и статусов оплат.
- **Мультишкольный Co-Branding (Multi-School Identity)**:
  - Динамическая кастомизация бренда под конкретное учебное заведение (например, *Pifagor High School*) через переменные окружения без форка базы кода.
- **Модульная система Feature Flags**:
  - Возможность мягкого отключения или заморозки отдельных модулей (например, временно приостановленного модуля `EQUIPMENT_MODULE_ENABLED`).

---

## 🛠 Стек технологий (Tech Stack)

### Frontend
- **Core**: [React 19](https://react.dev/), [React Router DOM v7](https://reactrouter.com/)
- **Build Tool**: [Vite 8](https://vitejs.dev/)
- **UI & Icons**: [Lucide React](https://lucide.dev/)
- **Charts & Visualization**: [Recharts v3](https://recharts.org/)
- **Export & Files**: [SheetJS (xlsx)](https://sheetjs.com/)

### Backend & Database
- **Database & Auth**: [Firebase Firestore](https://firebase.google.com/docs/firestore), [Firebase Authentication](https://firebase.google.com/docs/auth)
- **Admin Utilities**: [Firebase Admin SDK 14](https://firebase.google.com/docs/admin/setup)

### Testing & Quality Assurance
- **Unit Testing**: [Vitest 5](https://vitest.dev/)
- **Code Quality**: [ESLint 10](https://eslint.org/), [Prettier 3](https://prettier.io/)

---

## 📋 Предварительные требования (Prerequisites)

Перед началом установки убедитесь, что в вашей системе установлены:

- **Node.js**: `>= 18.0.0` (рекомендуется LTS 20.x)
- **npm**: `>= 9.0.0`
- **Git**
- Проект в **Firebase Console** с активированными Firestore Database и Authentication (если используется реальный бэкенд).

---

## 📦 Установка и локальный запуск (Getting Started)

### 1. Клонирование репозитория
```bash
git clone https://github.com/daniil170/extrahub.git
cd extrahub
```

### 2. Установка зависимостей
```bash
npm install
```

### 3. Настройка конфигурации окружения
Скопируйте файл `.env.example` в `.env` и заполните параметры вашей школы и Firebase:

```bash
cp .env.example .env
```

### 4. Запуск в режиме разработки (Development Server)
```bash
npm run dev
```
Приложение будет доступно по адресу `http://localhost:5173`.

---

## ⚙️ Конфигурация (Environment Variables)

Все настройки приложения управляются через переменные окружения в файле `.env`:

| Переменная | Описание | Обязательна | Значение по умолчанию |
|---|---|:---:|---|
| `VITE_FIREBASE_API_KEY` | API ключ проекта Firebase | Да | — |
| `VITE_FIREBASE_AUTH_DOMAIN` | Домен авторизации Firebase | Да | — |
| `VITE_FIREBASE_PROJECT_ID` | Идентификатор проекта Firebase | Да | `extrahub-c95af` |
| `VITE_FIREBASE_STORAGE_BUCKET` | Storage Bucket Firebase | Нет | — |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Sender ID для Firebase Messaging | Нет | — |
| `VITE_FIREBASE_APP_ID` | App ID приложения Firebase | Да | — |
| `VITE_SCHOOL_NAME` | Название учебного заведения | Нет | `"Pifagor High School"` |
| `VITE_SCHOOL_DOMAIN` | Почтовый/сетевой домен школы | Нет | `"pifagorschool.kz"` |
| `VITE_ALLOWED_EMAIL_DOMAIN` | Разрешенный домен корпоративных E-mail | Нет | `"pifagorschool.kz"` |
| `VITE_SCHOOL_LOGO_URL` | Путь к логотипу школы | Нет | `"/schools/pifagor-logo.png"` |
| `VITE_SCHOOL_PRIMARY_COLOR` | Основной цвет бренда школы | Нет | `"#009639"` |
| `VITE_SCHOOL_ACCENT_COLOR` | Акцентный цвет бренда школы | Нет | `"#161a38"` |
| `VITE_EXTRAHUB_LOGO_URL` | Логотип платформы ExtraHub | Нет | `"/assets/logo.png"` |
| `VITE_EXTRAHUB_PRIMARY_COLOR` | Основной цвет ExtraHub | Нет | `"#0e7c6b"` |
| `VITE_SCHOOL_SHIFT_CONFIG` | Расписание и название смен в JSON-формате | Нет | JSON со 1 и 2 сменой |
| `VITE_EQUIPMENT_MODULE_ENABLED` | Feature flag модуля заявок на ремонт | Нет | `false` |

---

## 🛠 Полезные npm-скрипты и CLI

В проекте настроены следующие основные команды:

| Скрипт | Описание |
|---|---|
| `npm run dev` | Запуск приложения в режиме разработки с HMR (Vite dev server) |
| `npm run build` | Production-сборка клиентского бандла в каталог `dist/` |
| `npm run preview` | Локальный просмотр собранного production-бандла |
| `npm run lint` | Проверка кода линтером ESLint |
| `npm run format` | Автоматическое форматирование исходного кода с помощью Prettier |
| `npm run test:unit` | Запуск модульного тестирования с помощью Vitest |
| `npm run seed:prod` | Первичная инициализация продуктовых данных в Firestore |
| `npm run cleanup:mock-data` | Безопасное сканирование базы на демо-данные (для очистки требуется `--confirm`) |
| `npm run bootstrap:admin` | Создание/обновление мастер-учетной записи администратора |

### Пример запуска безопасной очистки тестовых данных:
```bash
# Режим сканирования (DRY-RUN, без изменений в базе)
npm run cleanup:mock-data

# Фактическое удаление демо-документов из Firestore
npm run cleanup:mock-data -- --confirm
```

---

## 🧪 Тестирование и проверка качества

Для запуска набора unit-тестов используйте:

```bash
npm run test:unit
```

Проверка форматирования и правил стилей:
```bash
npm run format:check
npm run lint
```

---

## 🚀 Развертывание (Deployment)

### Сборка бандла
Для создания оптимизированного production-бандла выполните:

```bash
npm run build
```

Результат сборки будет помещен в директорию `dist/`.

### Развертывание на статических хостингах
Готовый каталог `dist/` может быть развернут на любом современном статическом хостинге:
- **Firebase Hosting**:
  ```bash
  npx firebase-tools deploy --only hosting
  ```
- **Vercel / Netlify / Cloudflare Pages**: Укажите команду сборки `npm run build` и папку публикации `dist`.

---

## 📄 Лицензия (License)

Данное программное обеспечение является коммерческой собственностью (**Proprietary / Closed Source**). Все права защищены. Использование, копирование или распространение без явного письменного разрешения правообладателя запрещено.
