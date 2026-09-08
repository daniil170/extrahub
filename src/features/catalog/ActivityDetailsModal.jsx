import { Modal, Badge, Button } from '../../shared/ui/index.js';
import { formatCurrency, formatDaysOfWeek } from '../../shared/utils/index.js';

/**
 * Detailed modal showing full activity content, curriculum syllabus,
 * teacher info, schedule, and learning outcomes.
 */
export function ActivityDetailsModal({ isOpen, onClose, activity, onEnroll }) {
  if (!activity) return null;

  const isFull = activity.isFull;
  const remainingSpots = activity.remainingSpots;
  const groups = activity.groups || [];

  // Default syllabus fallback if activity has no custom syllabus
  const syllabus =
    activity.syllabus && activity.syllabus.length > 0
      ? activity.syllabus
      : [
          {
            module: 'Модуль 1',
            title: 'Введение и основы направления',
            description:
              'Знакомство с дисциплиной, базовые понятия, организация рабочего процесса и техника безопасности.',
            hours: '6 ак. ч.',
          },
          {
            module: 'Модуль 2',
            title: 'Теоретические концепции и практические приёмы',
            description:
              'Углубленное изучение ключевых тем программы, разбор примеров и выполнение практических заданий.',
            hours: '12 ак. ч.',
          },
          {
            module: 'Модуль 3',
            title: 'Проектная работа и демонстрация результатов',
            description:
              'Создание индивидуального или командного проекта, подведение итогов обучения и презентация работ.',
            hours: '10 ак. ч.',
          },
        ];

  const outcomes =
    activity.learningOutcomes && activity.learningOutcomes.length > 0
      ? activity.learningOutcomes
      : [
          'Освоение ключевых навыков и приёмов по направлению',
          'Развитие самостоятельности, креативного и логического мышления',
          'Опыт командного взаимодействия и совместного решения задач',
          'Уверенная презентация собственных результатов и проектов',
        ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>📖 Содержание и программа кружка</span>
        </div>
      }
      maxWidth="720px"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Header Hero Section */}
        <div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '8px',
              flexWrap: 'wrap',
              marginBottom: '10px',
            }}
          >
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              <Badge variant="info">{activity.category}</Badge>
              <Badge variant="default">{activity.ageGroup}</Badge>
            </div>
            <Badge variant={isFull ? 'danger' : 'success'}>
              {isFull ? 'Мест нет' : `Осталось ${remainingSpots} мест`}
            </Badge>
          </div>

          <h2
            style={{
              fontSize: '22px',
              fontWeight: 700,
              color: 'var(--text-primary)',
              margin: '0 0 8px',
              lineHeight: 1.3,
            }}
          >
            {activity.title}
          </h2>

          <p
            style={{
              fontSize: '14.5px',
              color: 'var(--text-secondary)',
              lineHeight: 1.6,
              margin: 0,
            }}
          >
            {activity.description}
          </p>

          {activity.targetAudience && (
            <div
              style={{
                marginTop: '10px',
                fontSize: '13px',
                color: 'var(--text-muted)',
                fontStyle: 'italic',
              }}
            >
              🎯 {activity.targetAudience}
            </div>
          )}
        </div>

        {/* Quick Highlights Info Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '12px',
            backgroundColor: 'var(--bg-subtle)',
            padding: '14px 16px',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-color)',
          }}
        >
          <div>
            <div
              style={{
                fontSize: '11px',
                color: 'var(--text-secondary)',
                textTransform: 'uppercase',
              }}
            >
              Преподаватель
            </div>
            <div
              style={{
                fontSize: '13.5px',
                fontWeight: 600,
                color: 'var(--text-primary)',
                marginTop: '2px',
              }}
            >
              👨‍🏫 {activity.teacherName}
            </div>
          </div>

          <div>
            <div
              style={{
                fontSize: '11px',
                color: 'var(--text-secondary)',
                textTransform: 'uppercase',
              }}
            >
              Локация
            </div>
            <div
              style={{
                fontSize: '13.5px',
                fontWeight: 600,
                color: 'var(--text-primary)',
                marginTop: '2px',
              }}
            >
              📍 {activity.location || 'Школьный корпус'}
            </div>
          </div>

          <div>
            <div
              style={{
                fontSize: '11px',
                color: 'var(--text-secondary)',
                textTransform: 'uppercase',
              }}
            >
              Стоимость
            </div>
            <div
              style={{
                fontSize: '14px',
                fontWeight: 700,
                color: 'var(--primary)',
                marginTop: '2px',
              }}
            >
              {activity.price === 0 ? 'Бесплатно' : `${formatCurrency(activity.price)} / месяц`}
            </div>
          </div>
        </div>

        {/* Section: Содержание программы (Curriculum Syllabus) */}
        <div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '14px',
            }}
          >
            <h3
              style={{
                fontSize: '17px',
                fontWeight: 700,
                color: 'var(--text-primary)',
                margin: 0,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <span>📚 Содержание программы курса</span>
            </h3>
            <span style={{ fontSize: '12.5px', color: 'var(--text-secondary)' }}>
              Всего модулей: {syllabus.length}
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {syllabus.map((item, idx) => (
              <div
                key={idx}
                style={{
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  padding: '14px 16px',
                  backgroundColor: 'var(--bg-surface)',
                  display: 'flex',
                  gap: '14px',
                  alignItems: 'flex-start',
                }}
              >
                <div
                  style={{
                    minWidth: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--primary)',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '13px',
                    fontWeight: 700,
                    marginTop: '2px',
                    flexShrink: 0,
                  }}
                >
                  {idx + 1}
                </div>

                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '6px',
                      marginBottom: '4px',
                    }}
                  >
                    <div
                      style={{ fontSize: '14.5px', fontWeight: 600, color: 'var(--text-primary)' }}
                    >
                      <span style={{ color: 'var(--text-secondary)', marginRight: '6px' }}>
                        {item.module}:
                      </span>
                      {item.title}
                    </div>
                    {item.hours && (
                      <span
                        style={{
                          fontSize: '12px',
                          color: 'var(--primary)',
                          backgroundColor: 'var(--primary-subtle)',
                          padding: '2px 8px',
                          borderRadius: 'var(--radius-sm)',
                          fontWeight: 500,
                        }}
                      >
                        ⏱️ {item.hours}
                      </span>
                    )}
                  </div>
                  <div
                    style={{ fontSize: '13.5px', color: 'var(--text-secondary)', lineHeight: 1.5 }}
                  >
                    {item.description}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Section: Чему научится ребёнок */}
        <div>
          <h3
            style={{
              fontSize: '17px',
              fontWeight: 700,
              color: 'var(--text-primary)',
              margin: '0 0 12px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <span>🎯 Чему научится ребёнок</span>
          </h3>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '10px',
            }}
          >
            {outcomes.map((skill, index) => (
              <div
                key={index}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '10px',
                  padding: '10px 12px',
                  backgroundColor: 'var(--bg-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-color)',
                  fontSize: '13px',
                  color: 'var(--text-primary)',
                  lineHeight: 1.45,
                }}
              >
                <span style={{ color: 'var(--success)', fontWeight: 700, fontSize: '15px' }}>
                  ✓
                </span>
                <span>{skill}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Section: Преподаватель (Bio) */}
        {activity.teacherBio && (
          <div
            style={{
              padding: '14px 16px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border-color)',
              display: 'flex',
              gap: '14px',
              alignItems: 'center',
            }}
          >
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '50%',
                backgroundColor: 'var(--primary-subtle)',
                color: 'var(--primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '22px',
                flexShrink: 0,
              }}
            >
              🎓
            </div>
            <div>
              <div
                style={{
                  fontSize: '12px',
                  color: 'var(--text-secondary)',
                  textTransform: 'uppercase',
                }}
              >
                О преподавателе
              </div>
              <div
                style={{
                  fontSize: '13.5px',
                  color: 'var(--text-primary)',
                  marginTop: '3px',
                  lineHeight: 1.5,
                }}
              >
                {activity.teacherBio}
              </div>
            </div>
          </div>
        )}

        {/* Section: Что потребуется для занятий */}
        {activity.requirements && (
          <div
            style={{
              padding: '12px 16px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: '#FEF3C7',
              border: '1px solid #FCD34D',
              display: 'flex',
              gap: '10px',
              alignItems: 'flex-start',
            }}
          >
            <span style={{ fontSize: '18px' }}>🎒</span>
            <div style={{ fontSize: '13px', color: '#92400E', lineHeight: 1.5 }}>
              <strong>Что потребуется:</strong> {activity.requirements}
            </div>
          </div>
        )}

        {/* Section: Группы и расписание */}
        {groups.length > 0 && (
          <div>
            <h3
              style={{
                fontSize: '16px',
                fontWeight: 700,
                color: 'var(--text-primary)',
                margin: '0 0 10px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <span>📅 Расписание групп</span>
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {groups.map((group) => {
                const gCapacity = Number(group.capacity) || 0;
                const gEnrolled = Number(group.enrolledCount) || 0;
                const gRemaining = Math.max(0, gCapacity - gEnrolled);
                const gIsFull = gCapacity > 0 && gEnrolled >= gCapacity;

                return (
                  <div
                    key={group.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '10px',
                      padding: '10px 14px',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: 'var(--bg-subtle)',
                      border: '1px solid var(--border-color)',
                    }}
                  >
                    <div>
                      <div
                        style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}
                      >
                        {group.name}
                      </div>
                      <div
                        style={{
                          fontSize: '12.5px',
                          color: 'var(--text-secondary)',
                          marginTop: '2px',
                        }}
                      >
                        📅 {formatDaysOfWeek(group.daysOfWeek)} {group.startTime}–{group.endTime}
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <Badge variant={gIsFull ? 'danger' : 'success'}>
                        {gIsFull
                          ? 'Группа заполнена'
                          : `Осталось мест: ${gRemaining} из ${gCapacity}`}
                      </Badge>
                      {onEnroll && (
                        <Button
                          size="sm"
                          variant={gIsFull ? 'secondary' : 'primary'}
                          onClick={() => onEnroll(group)}
                        >
                          {gIsFull ? 'В лист ожидания' : 'Выбрать группу'}
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Modal Actions Footer */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingTop: '16px',
            borderTop: '1px solid var(--border-color)',
            marginTop: '8px',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          <div>
            <div
              style={{
                fontSize: '11px',
                color: 'var(--text-secondary)',
                textTransform: 'uppercase',
              }}
            >
              Итоговая стоимость
            </div>
            <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--primary)' }}>
              {activity.price === 0 ? 'Бесплатно' : `${formatCurrency(activity.price)} / месяц`}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <Button variant="outline" onClick={onClose}>
              Закрыть
            </Button>
            {onEnroll && (
              <Button variant={isFull ? 'secondary' : 'primary'} onClick={() => onEnroll(null)}>
                {isFull ? 'Встать в лист ожидания' : 'Записаться в кружок'}
              </Button>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
}
