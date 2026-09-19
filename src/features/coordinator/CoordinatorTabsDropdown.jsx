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
            backgroundColor: 'var(--bg-surface)',
            border: isOpen ? '1.5px solid var(--primary)' : '1.5px solid var(--primary-border, var(--primary))',
            borderRadius: 'var(--radius-md)',
            boxShadow: 'var(--shadow-sm)',
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
                backgroundColor: 'var(--primary-light)',
                color: 'var(--primary)',
              }}
            >
              {activeItem?.icon}
            </span>
            <span style={{ color: 'var(--text-primary)' }}>{activeItem?.label}</span>
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

        {/* Dropdown Menu Popup with Solid Theme Background and High z-index */}
        {isOpen && (
          <ul
            role="listbox"
            className="dropdown-menu-animated"
            style={{
              position: 'absolute',
              top: 'calc(100% + 6px)',
              left: 0,
              right: 0,
              backgroundColor: 'var(--bg-surface)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-color)',
              boxShadow: 'var(--shadow-lg)',
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
                      backgroundColor: isSelected ? 'var(--primary-light)' : 'transparent',
                      color: isSelected ? 'var(--primary)' : 'var(--text-primary)',
                      fontWeight: isSelected ? 600 : 500,
                      fontSize: '14px',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'background-color 0.12s ease',
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) e.currentTarget.style.backgroundColor = 'var(--bg-subtle)';
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
                          color: isSelected ? 'var(--primary)' : 'var(--text-secondary)',
                        }}
                      >
                        {tab.icon}
                      </span>
                      <span style={{ color: isSelected ? 'var(--primary)' : 'var(--text-primary)' }}>
                        {tab.label}
                      </span>
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
