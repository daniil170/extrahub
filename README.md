# ExtraHub

> **ExtraHub** — современная веб-платформа для управления внеучебной деятельностью в школе (кружки/секции, запись учеников, подтверждение родителями, расписание, журнал посещаемости и аналитика).

---

## 🛠 Технологический стек

- **Frontend**: React 19, JavaScript (ESM, Vite, без TypeScript)
- **Маршрутизация**: React Router v7
- **Backend / BaaS**: Firebase (Firestore, Authentication, Cloud Functions, Hosting)
- **Качество кода**: ESLint (v10 Flat Config), Prettier, JSDoc typedefs

---

## 📁 Архитектурная структура проекта

Проект организован по принципам чистой модульной архитектуры и разделения ответственности:

```text
extrahub/
├── public/                     # Статические ассеты
├── src/
│   ├── app/                    # Корневая конфигурация приложения
│   │   ├── config/             # Конфигурация Firebase SDK (firebase.js)
│   │   ├── providers/          # React Context провайдеры (AppProviders.jsx)
│   │   └── routes/             # Маршрутизация и Guard-компоненты (router.jsx, ProtectedRoute.jsx)
│   │
│   ├── entities/               # Модели предметной области (JSDoc typedef + фабрики)
│   │   ├── user/               # Модель пользователя (роли: student, parent, teacher, coordinator, admin)
│   │   ├── student/            # Модель ученика
│   │   ├── activity/           # Модели кружков и групп расписания (Activity, ActivityGroup)
│   │   ├── enrollment/         # Запись в секцию (статусы, холдирование)
│   │   ├── waitlist/           # Лист ожидания
│   │   ├── attendance/         # Журнал посещаемости
│   │   ├── payment/            # Модель счетов и оплат
│   │   ├── invite/             # Токены приглашений для родителей
│   │   ├── achievement/        # Достижения и награды
│   │   └── notification/       # Модель уведомлений
│   │
│   ├── features/               # Бизнес-модули по доменам (UI + Custom Hooks + API)
│   │   ├── auth/               # Авторизация, управление контекстом пользователя, dev-переключатель ролей
│   │   ├── catalog/            # Каталог кружков и секций (CatalogPage, useCatalog, api.js)
│   │   ├── enrollment/         # Подача и подтверждение заявок (useEnrollment, api.js)
│   │   ├── schedule/           # Расписание занятий (useSchedule, api.js)
│   │   ├── attendance/         # Учёт посещаемости (useAttendance, api.js)
│   │   ├── dashboard/          # Ролевые кабинеты (Student, Parent, Teacher, Coordinator)
│   │   ├── invite/             # Лендинг подтверждения для родителей (/invite/:token)
│   │   └── notifications/      # Уведомления пользователей (useNotifications, api.js)
│   │
│   ├── shared/                 # Переиспользуемые общие ресурсы
│   │   ├── api/                # Базовые обёртки над Firestore и коллекциями
│   │   ├── hooks/              # Общие React-хуки (useAuth)
│   │   ├── ui/                 # UI-компоненты (Button, Card, Badge, Spinner, Layout, Navbar)
│   │   └── utils/              # Хелперы форматирования дат, цен и расписания
│   │
│   ├── App.jsx                 # Главный компонент приложения
│   ├── main.jsx                # Входная точка Vite
│   └── index.css               # Глобальные стили и CSS-переменные
│
├── .env.example                # Шаблон переменных окружения для Firebase
├── eslint.config.js            # Конфигурация ESLint
├── .prettierrc                 # Конфигурация форматирования кода
└── package.json
```

---

## 🚀 Маршруты приложения

| Маршрут | Назначение | Доступность |
| :--- | :--- | :--- |
| `/catalog` | Публичный каталог кружков и секций | Все пользователи |
| `/student` | Личный кабинет ученика (расписание, награды, секции) | `student`, `admin` |
| `/parent` | Кабинет родителя (подтверждение заявок, оплата) | `parent`, `admin` |
| `/teacher` | Кабинет преподавателя (группы, журнал посещаемости) | `teacher`, `admin` |
| `/coordinator` | Панель координатора (аналитика, управление кружками) | `coordinator`, `admin` |
| `/invite/:token`| Лендинг подтверждения записи для родителя | По токену ссылки |
| `/login` | Вход и dev-переключатель ролей для тестирования | Все пользователи |

---

## ⚙️ Установка и запуск

### 1. Клонирование репозитория и установка зависимостей
```bash
git clone <repository-url>
cd extrahub
npm install
```

### 2. Настройка переменных окружения
Скопируйте `.env.example` в `.env` и укажите данные вашего Firebase-проекта:
```bash
cp .env.example .env
```

### 3. Запуск в режиме разработки
```bash
npm run dev
```

### 4. Проверка линтинга и форматирования
```bash
npm run lint
npm run format:check
npm run format
```

### 5. Сборка для продакшена
```bash
npm run build
```

---

## 🌿 Правила Git Workflow

1. **Ветки**:
   - Никогда не коммитить напрямую в `main`.
   - Новые ветки создаются от актуального `main`:
     - `feature/<короткое-описание>` — для нового функционала
     - `fix/<короткое-описание>` — для исправления ошибок
     - `chore/<короткое-описание>` — для настроек, зависимостей и рефакторинга
2. **Коммиты**:
   - Атомарные, на английском языке в повелительном наклонении по стандарту [Conventional Commits](https://www.conventionalcommits.org/):
     - `feat: add enrollment data model`
     - `fix: correct schedule overlap check`
     - `chore: setup eslint and prettier`
