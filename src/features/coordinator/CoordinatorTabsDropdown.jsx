import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

export function CoordinatorTabsDropdown({ tabs, activeTab, onSelectTab }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const activeItem = tabs.find((t) => t.id === activeTab) || tabs[0];

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div style={{ marginBottom: '24px', position: 'relative', zIndex: 40 }}>
      {/* Dropdown Container */}
      <div
        ref={dropdownRef}
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: '420px',
        }}
      >
        <label
          htmlFor="coordinator-tab-select"
          style={{
            display: 'block',
            fontSize: '12px',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
            color: 'var(--text-muted)',
            marginBottom: '6px',
          }}
        >
          Раздел панели:
        </label>

        {/* Custom Styled Dropdown Button */}
        <button
          id="coordinator-tab-select"
          type="button"
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          onClick={() => setIsOpen((prev) => !prev)}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '10px 16px',
            backgroundColor: '#ffffff',
            border: '2px solid var(--primary)',
            borderRadius: 'var(--radius-md)',
            boxShadow: '0 2px 6px rgba(0, 0, 0, 0.05)',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 600,
            color: 'var(--text-primary)',
            textAlign: 'left',
            transition: 'all 0.15s ease',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '30px',
                height: '30px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'var(--primary-light, rgba(14, 124, 107, 0.1))',
                color: 'var(--primary)',
              }}
            >
              {activeItem?.icon}
            </span>
            <span>{activeItem?.label}</span>
          </div>

          <ChevronDown
            size={18}
            style={{
              color: 'var(--text-secondary)',
              transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.2s ease',
            }}
          />
        </button>

        {/* Dropdown Menu Popup with Solid Background and High z-index */}
        {isOpen && (
          <ul
            role="listbox"
            style={{
              position: 'absolute',
              top: 'calc(100% + 6px)',
              left: 0,
              right: 0,
              backgroundColor: '#ffffff',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-color)',
              boxShadow: '0 12px 28px rgba(0, 0, 0, 0.18), 0 4px 10px rgba(0, 0, 0, 0.08)',
              zIndex: 9999,
              margin: 0,
              padding: '6px',
              listStyle: 'none',
              maxHeight: '380px',
              overflowY: 'auto',
            }}
          >
            {tabs.map((tab) => {
              const isSelected = tab.id === activeTab;
              return (
                <li key={tab.id} style={{ margin: 0, padding: 0 }}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => {
                      onSelectTab(tab.id);
                      setIsOpen(false);
                    }}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 14px',
                      borderRadius: 'var(--radius-sm)',
                      border: 'none',
                      backgroundColor: isSelected ? 'var(--primary-light, rgba(14, 124, 107, 0.1))' : 'transparent',
                      color: isSelected ? 'var(--primary)' : 'var(--text-primary)',
                      fontWeight: isSelected ? 600 : 500,
                      fontSize: '14px',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'background-color 0.12s ease',
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) e.currentTarget.style.backgroundColor = 'var(--bg-subtle, #f4f4f2)';
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: isSelected ? 'var(--primary)' : 'var(--text-muted)',
                        }}
                      >
                        {tab.icon}
                      </span>
                      <span>{tab.label}</span>
                    </div>

                    {isSelected && <Check size={16} style={{ color: 'var(--primary)' }} />}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
