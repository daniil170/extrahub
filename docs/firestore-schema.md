# Архитектура базы данных Firestore: ExtraHub

В данном документе описана структура коллекций, схемы документов, типизация полей, индексы и правила доступа для Cloud Firestore в проекте **ExtraHub**.

---

## 1. Архитектурное решение: Структура коллекций

### Выбор между Top-Level коллекцией и Подколлекцией для `activityGroups`

Было принято решение использовать **отдельную top-level коллекцию `activityGroups`** с внешним ключом `activityId` вместо подколлекции `activities/{activityId}/groups/{groupId}` по следующим причинам:

1. **Глобальные запросы расписания**: для отображения школьного расписания и фильтрации занятий по дням недели (`daysOfWeek`), времени или свободным местам (`enrolledCount < capacity`) плоская коллекция позволяет выполнять прямые запросы без необходимости создания и поддержки `Collection Group Queries`.
2. **Простота и атомарность транзакций**: операции записи (enrollment, waitlist) и Cloud Functions обращаются к группам напрямую по `groupId` без необходимости передавать и формировать составной путь документа.
3. **Безопасность и проверка прав**: проверка `get(/databases/$(database)/documents/activityGroups/$(groupId))` в Security Rules происходит за одно прямое чтение документа, что делает правила более производительными и понятными.

---

## 2. Спецификация коллекций

### 2.1. `users` (`users/{userId}`)
Хранит профили пользователей и их роли в системе.
* **Документ ID**: `userId` (соответствует Firebase Auth `uid`).

| Поле | Тип | Обязательное | Описание / Ограничения |
| :--- | :--- | :--- | :--- |
| `id` | `string` | Да | Идентификатор пользователя (`uid`) |
| `fullName` | `string` | Да | Полное имя (макс. 100 символов) |
| `role` | `string` | Да | Роль: `'student'` \| `'parent'` \| `'teacher'` \| `'coordinator'` \| `'admin'` |
| `email` | `string` | Да | Электронная почта |
| `phone` | `string` | Нет | Номер телефона |
| `status` | `string` | Да | Статус: `'active'` \| `'inactive'` \| `'suspended'` |
| `createdAt` | `timestamp` | Да | Дата и время регистрации |

---

### 2.2. `students` (`students/{studentId}`)
Учетные карточки учащихся школы.
* **Документ ID**: `studentId` (для пользователей-учеников совпадает с `userId`).

| Поле | Тип | Обязательное | Описание / Ограничения |
| :--- | :--- | :--- | :--- |
| `id` | `string` | Да | ID ученика |
| `fullName` | `string` | Да | ФИО ученика |
| `className` | `string` | Да | Класс (например, `"7-Б"`) |
| `birthDate` | `string` | Нет | Дата рождения в формате `YYYY-MM-DD` |
| `parentIds` | `array<string>` | Да | Массив `userId` родителей, имеющих доступ к карточке |
| `schoolId` | `string` | Да | Идентификатор школы |
| `createdAt` | `timestamp` | Да | Время создания записи |

---

### 2.3. `activities` (`activities/{activityId}`)
Справочник кружков, секций и внеурочных программ.

| Поле | Тип | Обязательное | Описание / Ограничения |
| :--- | :--- | :--- | :--- |
| `id` | `string` | Да | ID активности |
| `title` | `string` | Да | Название кружка (макс. 150 символов) |
| `category` | `string` | Да | Категория (Технологии, Спорт, Искусство и т.д.) |
| `description` | `string` | Да | Подробное описание программы |
| `teacherId` | `string` | Да | `userId` основного преподавателя |
| `ageGroup` | `string` | Да | Возрастная категория (например, `"10-14 лет"`) |
| `price` | `number` | Да | Стоимость (0 = бесплатно, число >= 0) |
| `location` | `string` | Да | Место проведения (кабинет, зал) |
| `isActive` | `boolean` | Да | Флаг доступности для записи |
| `createdAt` | `timestamp` | Да | Время создания |

---

### 2.4. `activityGroups` (`activityGroups/{groupId}`)
Конкретные учебные группы кружка с расписанием и лимитом мест.

| Поле | Тип | Обязательное | Описание / Ограничения |
| :--- | :--- | :--- | :--- |
| `id` | `string` | Да | ID группы |
| `activityId` | `string` | Да | Ссылка на `activities/{activityId}` |
| `teacherId` | `string` | Да | `userId` преподавателя данной группы |
| `capacity` | `number` | Да | Максимальная вместимость (целое число > 0) |
| `enrolledCount` | `number` | Да | Текущее число подтвержденных записей (только server-side!) |
| `daysOfWeek` | `array<number>` | Да | Дни недели `[1..7]` (1 = Пн, 7 = Вс) |
| `startTime` | `string` | Да | Время начала (`"HH:MM"`, например `"15:30"`) |
| `endTime` | `string` | Да | Время окончания (`"HH:MM"`, например `"17:00"`) |
| `recurrence` | `string` | Да | Регулярность: `'weekly'` \| `'biweekly'` \| `'custom'` |
| `seasonStart` | `string` | Нет | Дата начала сезона (`YYYY-MM-DD`) |
| `seasonEnd` | `string` | Нет | Дата окончания сезона (`YYYY-MM-DD`) |

---

### 2.5. `enrollments` (`enrollments/{enrollmentId}`)
Заявки и активные записи учащихся в группы кружков.

| Поле | Тип | Обязательное | Описание / Ограничения |
| :--- | :--- | :--- | :--- |
| `id` | `string` | Да | ID записи |
| `studentId` | `string` | Да | ID ученика |
| `groupId` | `string` | Да | ID группы |
| `activityId` | `string` | Да | ID кружка (денормализовано для быстрых запросов) |
| `status` | `string` | Да | `'pending_parent_approval'` \| `'active'` \| `'waitlist'` \| `'cancelled'` \| `'cancelled_by_timeout'` |
| `holdExpiresAt` | `timestamp` | Нет | Срок действия временного резерва места (TTL) |
| `parentApprovedAt` | `timestamp` | Нет | Время подтверждения родителем |
| `approvedByParentId` | `string` | Нет | `userId` подтвердившего родителя |
| `enrolledAt` | `timestamp` | Да | Время создания заявки |
| `cancelledAt` | `timestamp` | Нет | Время отмены |

---

### 2.6. `waitlist` (`waitlist/{waitlistId}`)
Очередь ожидания для заполненных групп.

| Поле | Тип | Обязательное | Описание / Ограничения |
| :--- | :--- | :--- | :--- |
| `id` | `string` | Да | ID записи в очереди |
| `studentId` | `string` | Да | ID ученика |
| `groupId` | `string` | Да | ID группы |
| `position` | `number` | Да | Номер в очереди (1-based) |
| `queuedAt` | `timestamp` | Да | Время постановки в очередь |

---

### 2.7. `attendance` (`attendance/{attendanceId}`)
Журнал посещаемости занятий.

| Поле | Тип | Обязательное | Описание / Ограничения |
| :--- | :--- | :--- | :--- |
| `id` | `string` | Да | ID отметки |
| `enrollmentId` | `string` | Да | ID записи ученика |
| `studentId` | `string` | Да | ID ученика (денормализовано) |
| `groupId` | `string` | Да | ID группы |
| `date` | `string` | Да | Дата занятия (`YYYY-MM-DD`) |
| `status` | `string` | Да | `'present'` \| `'absent'` \| `'late'` |
| `markedBy` | `string` | Да | `userId` преподавателя, выставившего отметку |
| `teacherComment` | `string` | Нет | Комментарий преподавателя |
| `createdAt` | `timestamp` | Да | Время выставления отметки |

---

### 2.8. `payments` (`payments/{paymentId}`)
Учет платежей за платные секции.

| Поле | Тип | Обязательное | Описание / Ограничения |
| :--- | :--- | :--- | :--- |
| `id` | `string` | Да | ID платежа |
| `studentId` | `string` | Да | ID ученика |
| `activityId` | `string` | Да | ID кружка |
| `groupId` | `string` | Нет | ID группы |
| `amount` | `number` | Да | Сумма в рублях (> 0) |
| `dueDate` | `string` | Да | Срок оплаты (`YYYY-MM-DD`) |
| `status` | `string` | Да | `'pending'` \| `'paid'` \| `'overdue'` |
| `updatedBy` | `string` | Нет | `userId` обновившего статус (координатор/бухгалтер) |
| `updatedAt` | `timestamp` | Да | Время последнего обновления |

---

### 2.9. `parentInvites` (`parentInvites/{inviteId}`)
Одноразовые безопасные токены для подтверждения записи родителем без обязательной предварительной авторизации.

| Поле | Тип | Обязательное | Описание / Ограничения |
| :--- | :--- | :--- | :--- |
| `id` | `string` | Да | ID инвайта |
| `studentId` | `string` | Да | ID ученика |
| `enrollmentId` | `string` | Да | ID связанной записи |
| `token` | `string` | Да | Уникальный криптографический токен |
| `status` | `string` | Да | `'active'` \| `'accepted'` \| `'expired'` \| `'revoked'` |
| `expiresAt` | `timestamp` | Да | Срок действия токена |
| `createdAt` | `timestamp` | Да | Время генерации |

---

### 2.10. `achievements` (`achievements/{achievementId}`)
Бейджи и награды учеников за успехи в секциях.

| Поле | Тип | Обязательное | Описание / Ограничения |
| :--- | :--- | :--- | :--- |
| `id` | `string` | Да | ID достижения |
| `studentId` | `string` | Да | ID ученика |
| `activityId` | `string` | Да | ID кружка |
| `title` | `string` | Да | Название достижения |
| `description` | `string` | Да | Описание заслуги |
| `badgeIcon` | `string` | Да | Иконка или эмодзи бейджа |
| `issuedBy` | `string` | Да | `userId` преподавателя или координатора |
| `createdAt` | `timestamp` | Да | Время присвоения |

---

### 2.11. `notifications` (`notifications/{notificationId}`)
Уведомления пользователей о событиях системы.

| Поле | Тип | Обязательное | Описание / Ограничения |
| :--- | :--- | :--- | :--- |
| `id` | `string` | Да | ID уведомления |
| `userId` | `string` | Да | `userId` получателя |
| `type` | `string` | Да | Тип события (например, `'parent_approval_request'`) |
| `text` | `string` | Да | Текст уведомления |
| `channel` | `string` | Да | `'push'` \| `'email'` |
| `isRead` | `boolean` | Да | Флаг прочтения |
| `sentAt` | `timestamp` | Да | Время отправки |

---

## 3. Составные индексы (Composite Indexes)

Для эффективного выполнения сложных запросов настроены следующие composite indexes:

1. **`enrollments`**:
   - `studentId` (ASC), `status` (ASC), `enrolledAt` (DESC) — быстрый просмотр активных записей ученика.
   - `groupId` (ASC), `status` (ASC), `enrolledAt` (ASC) — список зачисленных в группу в порядке очереди.
2. **`activityGroups`**:
   - `activityId` (ASC), `capacity` (ASC), `enrolledCount` (ASC) — выборка свободных мест по активности.
   - `teacherId` (ASC), `daysOfWeek` (ARRAY_CONTAINS) — расписание конкретного преподавателя.
3. **`attendance`**:
   - `groupId` (ASC), `date` (DESC) — журнал группы на дату.
   - `enrollmentId` (ASC), `date` (DESC) — посещаемость конкретного ученика.
4. **`notifications`**:
   - `userId` (ASC), `isRead` (ASC), `sentAt` (DESC) — непрочитанные уведомления пользователя.
5. **`payments`**:
   - `studentId` (ASC), `status` (ASC), `dueDate` (ASC) — неоплаченные счета ученика.
6. **`parentInvites`**:
   - `token` (ASC), `status` (ASC) — поиск и валидация инвайта по токену.
