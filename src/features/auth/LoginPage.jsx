import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../shared/hooks/useAuth.js';
import { Card, Button, PageHeader } from '../../shared/ui/index.js';

export function LoginPage() {
  const { loginAsMock } = useAuth();
  const navigate = useNavigate();

  const handleSelectRole = (role, redirectPath) => {
    loginAsMock(role);
    navigate(redirectPath);
  };

  const roleOptions = [
    {
      role: 'student',
      title: 'Ученик',
      desc: 'Выбор кружков, просмотр расписания и личных достижений',
      path: '/student',
      icon: '🎓',
    },
    {
      role: 'parent',
      title: 'Родитель',
      desc: 'Подтверждение записи детей на секции и оплата',
      path: '/parent',
      icon: '👨‍👩‍👧',
    },
    {
      role: 'teacher',
      title: 'Преподаватель',
      desc: 'Ведение групп, учет посещаемости и выставление наград',
      path: '/teacher',
      icon: '👨‍🏫',
    },
    {
      role: 'coordinator',
      title: 'Координатор',
      desc: 'Управление активностями, группами, мониторинг и отчёты',
      path: '/coordinator',
      icon: '📊',
    },
  ];

  return (
    <div style={{ maxWidth: '640px', margin: '40px auto' }}>
      <PageHeader
        title="Вход в ExtraHub"
        subtitle="Выберите демонстрационную роль для входа в платформу"
      />

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {roleOptions.map((item) => (
          <Card key={item.role} style={{ cursor: 'pointer' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '16px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <span style={{ fontSize: '32px' }}>{item.icon}</span>
                <div>
                  <h4 style={{ fontSize: '16px', fontWeight: 600 }}>{item.title}</h4>
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{item.desc}</p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleSelectRole(item.role, item.path)}
              >
                Войти как {item.title}
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
