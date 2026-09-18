import { Wrench, Clock, ArrowLeft, ShieldAlert } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card, Button, Badge } from '../../shared/ui/index.js';
import { schoolConfig } from '../../app/config/schoolConfig.js';

export function EquipmentMaintenancePausedPage() {
  return (
    <div
      style={{
        maxWidth: '800px',
        margin: '40px auto',
        padding: '0 16px 48px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}
    >
      <Card
        style={{
          width: '100%',
          padding: '48px 32px',
          textAlign: 'center',
          borderRadius: 'var(--radius-lg, 16px)',
          border: '1px solid var(--border-color)',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.01)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        {/* Status Badge */}
        <div style={{ marginBottom: '20px' }}>
          <Badge
            variant="warning"
            style={{
              padding: '6px 14px',
              fontSize: '12.5px',
              fontWeight: 600,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              borderRadius: '999px',
            }}
          >
            <Clock size={14} />
            <span>Скоро • В разработке</span>
          </Badge>
        </div>

        {/* Icon / Illustration */}
        <div
          style={{
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            backgroundColor: 'rgba(245, 158, 11, 0.12)',
            color: '#b45309',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '24px',
            boxShadow: '0 0 0 8px rgba(245, 158, 11, 0.05)',
          }}
        >
          <Wrench size={40} strokeWidth={1.8} />
        </div>

        {/* Title */}
        <h2
          style={{
            fontFamily: 'var(--font-heading)',
            fontSize: '24px',
            fontWeight: 700,
            color: 'var(--text-primary)',
            margin: '0 0 12px',
            letterSpacing: '-0.02em',
          }}
        >
          Модуль заявок на ремонт оборудования временно приостановлен
        </h2>

        {/* Description */}
        <p
          style={{
            fontSize: '15px',
            color: 'var(--text-secondary)',
            lineHeight: 1.6,
            maxWidth: '560px',
            margin: '0 0 28px',
          }}
        >
          Модуль учёта поломок, сервисных заявок и диспетчеризации инженеров сейчас находится
          в разработке и проходит финальное тестирование. Для {schoolConfig.name} он будет
          активирован в следующем обновлении платформы ExtraHub.
        </p>

        {/* Informative notice card */}
        <div
          style={{
            width: '100%',
            maxWidth: '540px',
            padding: '16px 20px',
            backgroundColor: 'var(--bg-subtle, #f8fafc)',
            borderRadius: 'var(--radius-md, 10px)',
            border: '1px solid var(--border-color)',
            marginBottom: '32px',
            textAlign: 'left',
            fontSize: '13px',
            color: 'var(--text-secondary)',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '12px',
          }}
        >
          <ShieldAlert size={20} color="var(--primary)" style={{ flexShrink: 0, marginTop: '2px' }} />
          <div style={{ lineHeight: 1.5 }}>
            <strong style={{ color: 'var(--text-primary)', display: 'block', marginBottom: '2px' }}>
              Экстренные неполадки в кабинетах
            </strong>
            При возникновении срочных аварийных ситуаций (отопление, электричество, сантехника)
            обращайтесь напрямую к дежурному коменданту школы или по адресу{' '}
            <a
              href={`mailto:${schoolConfig.supportEmail}`}
              style={{ color: 'var(--primary)', fontWeight: 600, textDecoration: 'underline' }}
            >
              {schoolConfig.supportEmail}
            </a>.
          </div>
        </div>

        {/* Action Button */}
        <Link to="/catalog" style={{ textDecoration: 'none' }}>
          <Button
            variant="primary"
            size="md"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              fontWeight: 600,
            }}
          >
            <ArrowLeft size={16} />
            <span>Вернуться в каталог кружков</span>
          </Button>
        </Link>
      </Card>
    </div>
  );
}
