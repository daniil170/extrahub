import { useState } from 'react';
import {
  Modal,
  Button,
  IconAlertCircle,
  IconMonitor,
  IconZap,
  IconLayoutGrid,
  IconWrench,
  IconSettings,
  IconPlus,
} from '../../shared/ui/index.js';
import {
  ISSUE_CATEGORIES,
  ISSUE_CATEGORY_META,
  ISSUE_PRIORITIES,
  ISSUE_PRIORITY_META,
} from '../../entities/equipmentIssue/model.js';

const QUICK_LOCATIONS = [
  'Кабинет 304 (IT-лаборатория)',
  'Кабинет 204 (Физика)',
  'Кабинет 210 (Биология)',
  'Кабинет 102 (Гончарная мастерская)',
  'Большой спортзал',
  'Актовый зал',
];

const CATEGORY_ICONS = {
  hardware: IconMonitor,
  electrical: IconZap,
  furniture: IconLayoutGrid,
  plumbing: IconWrench,
  other: IconSettings,
};

/**
 * Modal dialog for filing a new equipment maintenance request
 * @param {Object} props
 * @param {boolean} props.isOpen
 * @param {() => void} props.onClose
 * @param {(data: any) => Promise<void>} props.onSubmit
 */
export function CreateIssueModal({ isOpen, onClose, onSubmit }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [category, setCategory] = useState(ISSUE_CATEGORIES.HARDWARE);
  const [priority, setPriority] = useState(ISSUE_PRIORITIES.MEDIUM);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState('');

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setFormError('Пожалуйста, выберите файл изображения');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setPhotoPreview(event.target.result);
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = () => {
    setPhotoPreview(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!title.trim() || title.trim().length < 3) {
      setFormError('Введите название неисправности (минимум 3 символа)');
      return;
    }
    if (!location.trim()) {
      setFormError('Укажите кабинет или помещение');
      return;
    }
    if (!description.trim() || description.trim().length < 5) {
      setFormError('Опишите проблему подробнее (минимум 5 символов)');
      return;
    }

    try {
      setLoading(true);
      await onSubmit({
        title: title.trim(),
        description: description.trim(),
        location: location.trim(),
        category,
        priority,
        photoUrl: photoPreview || null,
      });
      // reset form
      setTitle('');
      setDescription('');
      setLocation('');
      setCategory(ISSUE_CATEGORIES.HARDWARE);
      setPriority(ISSUE_PRIORITIES.MEDIUM);
      setPhotoPreview(null);
      onClose();
    } catch (err) {
      console.error('Error submitting equipment issue:', err);
      setFormError(err.message || 'Ошибка при создании заявки');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Подать заявку о поломке оборудования"
      maxWidth="620px"
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
        {formError && (
          <div
            style={{
              padding: '10px 14px',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: 'var(--danger-light)',
              color: 'var(--danger)',
              fontSize: '13px',
              border: '1px solid rgba(230, 57, 70, 0.3)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <IconAlertCircle size={16} />
            <span>{formError}</span>
          </div>
        )}

        {/* Title */}
        <div>
          <label
            htmlFor="issue-title"
            style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}
          >
            Что сломалось? *
          </label>
          <input
            id="issue-title"
            type="text"
            placeholder="Например: Не включается проектор Epson или Протечка батареи"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 12px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-color)',
              backgroundColor: 'var(--bg-surface)',
              color: 'var(--text-primary)',
              fontSize: '14px',
              boxSizing: 'border-box',
            }}
            required
          />
        </div>

        {/* Location & Quick chips */}
        <div>
          <label
            htmlFor="issue-location"
            style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}
          >
            Кабинет / Помещение *
          </label>
          <input
            id="issue-location"
            type="text"
            placeholder="Например: Кабинет 304, Большой спортзал"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 12px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-color)',
              backgroundColor: 'var(--bg-surface)',
              color: 'var(--text-primary)',
              fontSize: '14px',
              boxSizing: 'border-box',
              marginBottom: '8px',
            }}
            required
          />
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {QUICK_LOCATIONS.map((loc) => (
              <button
                key={loc}
                type="button"
                onClick={() => setLocation(loc)}
                style={{
                  fontSize: '11px',
                  padding: '4px 8px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-color)',
                  backgroundColor: location === loc ? 'var(--primary-light)' : 'transparent',
                  color: location === loc ? 'var(--primary)' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  transition: 'all 0.1s ease',
                }}
              >
                + {loc}
              </button>
            ))}
          </div>
        </div>

        {/* Category selection */}
        <div>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
            Категория оборудования *
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(105px, 1fr))', gap: '8px' }}>
            {Object.values(ISSUE_CATEGORIES).map((catKey) => {
              const meta = ISSUE_CATEGORY_META[catKey];
              const isSelected = category === catKey;
              const IconComp = CATEGORY_ICONS[catKey] || IconSettings;
              return (
                <button
                  key={catKey}
                  type="button"
                  onClick={() => setCategory(catKey)}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '10px 8px',
                    borderRadius: 'var(--radius-sm)',
                    border: isSelected ? '2px solid var(--primary)' : '1px solid var(--border-color)',
                    backgroundColor: isSelected ? 'var(--primary-light)' : 'transparent',
                    color: isSelected ? 'var(--primary)' : 'var(--text-primary)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    gap: '6px',
                  }}
                >
                  <IconComp size={18} />
                  <span style={{ fontSize: '12px', fontWeight: isSelected ? 600 : 500 }}>{meta.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Priority selection */}
        <div>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
            Уровень критичности (Приоритет) *
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
            {Object.values(ISSUE_PRIORITIES).map((pKey) => {
              const meta = ISSUE_PRIORITY_META[pKey];
              const isSelected = priority === pKey;
              return (
                <button
                  key={pKey}
                  type="button"
                  onClick={() => setPriority(pKey)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    padding: '10px 6px',
                    borderRadius: 'var(--radius-sm)',
                    border: isSelected ? `2px solid ${meta.color}` : '1px solid var(--border-color)',
                    backgroundColor: isSelected
                      ? pKey === 'critical'
                        ? 'rgba(230, 57, 70, 0.12)'
                        : 'var(--bg-subtle)'
                      : 'transparent',
                    color: isSelected && pKey === 'critical' ? 'var(--danger)' : 'var(--text-primary)',
                    fontWeight: isSelected ? 700 : 500,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <span
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      backgroundColor: meta.color,
                      flexShrink: 0,
                    }}
                  />
                  <span style={{ fontSize: '12px' }}>{meta.label}</span>
                </button>
              );
            })}
          </div>

          {priority === 'critical' && (
            <div
              style={{
                marginTop: '8px',
                padding: '8px 12px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'var(--danger-light)',
                color: 'var(--danger)',
                fontSize: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <IconAlertCircle size={16} />
              <span>
                <b>Критический приоритет:</b> дежурному технику и администрации школы будет немедленно отправлено срочное уведомление!
              </span>
            </div>
          )}
        </div>

        {/* Description */}
        <div>
          <label
            htmlFor="issue-description"
            style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}
          >
            Подробное описание проблемы *
          </label>
          <textarea
            id="issue-description"
            rows={3}
            placeholder="Опишите симптомы поломки, что произошло, при каких обстоятельствах..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 12px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-color)',
              backgroundColor: 'var(--bg-surface)',
              color: 'var(--text-primary)',
              fontSize: '13px',
              boxSizing: 'border-box',
              resize: 'vertical',
            }}
            required
          />
        </div>

        {/* Photo Upload (Preview) */}
        <div>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
            Фотография поломки (опционально)
          </label>
          {photoPreview ? (
            <div style={{ position: 'relative', display: 'inline-block' }}>
              <img
                src={photoPreview}
                alt="Превью"
                style={{
                  width: '120px',
                  height: '90px',
                  objectFit: 'cover',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-color)',
                }}
              />
              <button
                type="button"
                onClick={handleRemovePhoto}
                style={{
                  position: 'absolute',
                  top: '-6px',
                  right: '-6px',
                  background: 'var(--danger)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '50%',
                  width: '20px',
                  height: '20px',
                  fontSize: '12px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                title="Удалить фото"
              >
                ✕
              </button>
            </div>
          ) : (
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              style={{ fontSize: '12px', color: 'var(--text-secondary)' }}
            />
          )}
        </div>

        {/* Buttons */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
          <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
            Отмена
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={loading}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <IconPlus size={16} />
            <span>{loading ? 'Отправка...' : 'Подать заявку'}</span>
          </Button>
        </div>
      </form>
    </Modal>
  );
}
