import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../shared/hooks/useAuth.js';
import {
  Card,
  Button,
  PageHeader,
  IconGraduationCap,
  IconUsers,
  IconBookOpen,
  IconBarChart,
  IconWrench,
  IconSettings,
} from '../../shared/ui/index.js';

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
      IconComponent: IconGraduationCap,
    },
    {
      role: 'parent',
      title: 'Родитель',
      desc: 'Подтверждение записи детей на секции и оплата',
      path: '/parent',
      IconComponent: IconUsers,
    },
    {
      role: 'teacher',
      title: 'Преподаватель',
      desc: 'Ведение групп, учет посещаемости и выставление наград',
      path: '/teacher',
      IconComponent: IconBookOpen,
    },
    {
      role: 'coordinator',
      title: 'Координатор',
      desc: 'Управление активностями, группами, мониторинг и отчёты',
      path: '/coordinator',
      IconComponent: IconBarChart,
    },
    {
      role: 'technician',
      title: 'Техник / Завхоз',
      desc: 'Обслуживание оборудования, ремонт и исполнение заявок',
      path: '/technician',
      IconComponent: IconWrench,
    },
    {
      role: 'admin',
      title: 'Администратор',
      desc: 'Полный доступ к системе, мониторинг заявок и координация',
      path: '/coordinator',
      IconComponent: IconSettings,
    },
  ];

  return (
    <div style={{ maxWidth: '640px', margin: '40px auto' }}>
      <PageHeader
        title="Вход в ExtraHub"
        subtitle="Выберите демонстрационную роль для входа в платформу"
      />

      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {roleOptions.map((item) => {
          const { IconComponent } = item;
          return (
            <Card key={item.role} style={{ cursor: 'pointer', padding: '16px 20px' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '16px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div
                    style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: 'var(--primary-light)',
                      color: 'var(--primary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <IconComponent size={22} />
                  </div>
                  <div>
                    <h4 style={{ fontSize: '15px', fontWeight: 600, margin: '0 0 2px 0' }}>{item.title}</h4>
                    <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0 }}>{item.desc}</p>
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
          );
        })}
      </div>
    </div>
  );
}
