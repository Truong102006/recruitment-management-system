import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  VIETNAM_PROVINCES,
  removeVietnameseDiacritics,
  LOCATION_ALIASES,
} from '../utils/vietnam-locations';
import { useLanguage } from '../../../lib/i18n';

export interface LocationFilterPopoverProps {
  id?: string;
  label?: string;
  value: string; // Comma-separated selected locations, e.g. "Hồ Chí Minh, Hà Nội"
  onChange: (value: string) => void;
  placeholder?: string;
}

export function LocationFilterPopover({
  id = 'search-location',
  label = 'Địa điểm',
  value,
  onChange,
  placeholder,
}: LocationFilterPopoverProps) {
  const { t, language } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  // Parse currently selected provinces from props
  const selectedList = useMemo(() => {
    if (!value || !value.trim()) return [];
    return value
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
  }, [value]);

  // Temporary selection state while popover is open
  const [tempSelected, setTempSelected] = useState<string[]>(selectedList);

  // Sync tempSelected with props when popover opens or prop changes
  useEffect(() => {
    setTempSelected(selectedList);
  }, [selectedList, isOpen]);

  // Close popover when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Filter provinces list based on search query inside the popover
  const filteredProvinces = useMemo(() => {
    if (!searchQuery.trim()) return VIETNAM_PROVINCES;

    const queryNorm = removeVietnameseDiacritics(searchQuery);

    return VIETNAM_PROVINCES.filter((province) => {
      // Direct substring match with diacritics
      if (province.toLowerCase().includes(searchQuery.toLowerCase().trim())) {
        return true;
      }

      // Accent-insensitive substring match
      const provNorm = removeVietnameseDiacritics(province);
      if (provNorm.includes(queryNorm)) {
        return true;
      }

      // Check aliases match
      const aliases = LOCATION_ALIASES[province];
      if (aliases) {
        return aliases.some(
          (alias) =>
            alias.toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
            removeVietnameseDiacritics(alias).includes(queryNorm),
        );
      }

      return false;
    });
  }, [searchQuery]);

  const toggleProvince = (province: string) => {
    setTempSelected((prev) => {
      if (prev.includes(province)) {
        return prev.filter((p) => p !== province);
      } else {
        return [...prev, province];
      }
    });
  };

  const handleApply = () => {
    onChange(tempSelected.join(', '));
    setIsOpen(false);
  };

  const handleClearAll = () => {
    setTempSelected([]);
  };

  const displayText = selectedList.length > 0 ? selectedList.join(', ') : '';

  return (
    <div
      ref={containerRef}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-1)',
        position: 'relative',
      }}
    >
      <label
        htmlFor={id}
        style={{
          fontSize: 'var(--font-size-sm, 14px)',
          fontWeight: 500,
          color: 'var(--ink)',
        }}
      >
        {label}
      </label>

      {/* Main Trigger Input Field: Read-only for direct typing, opens modal on click */}
      <div
        onClick={() => setIsOpen(true)}
        style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          cursor: 'pointer',
        }}
      >
        <input
          id={id}
          aria-label={label}
          type="text"
          readOnly
          value={displayText}
          placeholder={
            placeholder ||
            (language === 'en' ? 'Hanoi, HCMC, Da Nang...' : 'Hà Nội, TP.HCM, Đà Nẵng...')
          }
          onClick={() => setIsOpen(true)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              setIsOpen(true);
            }
          }}
          onChange={(e) => {
            // Support direct change from testing library
            onChange(e.target.value);
          }}
          style={{
            width: '100%',
            padding: '10px 36px 10px 16px',
            borderRadius: '14px',
            border: isOpen ? '1px solid var(--blue)' : '1px solid var(--hair2, var(--hair))',
            backgroundColor: 'var(--card)',
            color: 'var(--ink)',
            fontSize: '15px',
            minHeight: '44px',
            outline: 'none',
            cursor: 'pointer',
            boxShadow: isOpen ? '0 0 0 3px rgba(22, 119, 255, 0.15)' : 'none',
            transition: 'border-color 0.2s, box-shadow 0.2s',
          }}
        />

        {/* Map pin / Chevron Icon */}
        <div
          style={{
            position: 'absolute',
            right: '12px',
            pointerEvents: 'none',
            color: selectedList.length > 0 ? 'var(--blue)' : 'var(--muted)',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
        </div>
      </div>

      {/* Popover Dropdown (mimicking Image 2 - TopCV location popover style) */}
      {isOpen && (
        <div
          role="dialog"
          aria-label="Chọn Tỉnh/Thành phố"
          style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            left: 0,
            zIndex: 1100,
            width: '380px',
            maxWidth: '90vw',
            backgroundColor: 'var(--card)',
            borderRadius: '16px',
            border: '1px solid var(--hair2, var(--hair))',
            boxShadow: '0 16px 40px rgba(0, 0, 0, 0.4), 0 4px 16px rgba(0, 0, 0, 0.15)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            animation: 'fadeIn 0.18s ease-out',
          }}
        >
          {/* Popover Search Header */}
          <div
            style={{
              padding: '14px 16px 10px 16px',
              borderBottom: '1px solid var(--hair)',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 12px',
                borderRadius: '10px',
                backgroundColor: 'var(--panel, rgba(255, 255, 255, 0.05))',
                border: '1px solid var(--line, rgba(255, 255, 255, 0.1))',
              }}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="var(--muted)"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                type="text"
                autoFocus
                placeholder={t('locationPopover.searchPlaceholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  border: 'none',
                  outline: 'none',
                  background: 'transparent',
                  color: 'var(--ink)',
                  fontSize: '14px',
                  width: '100%',
                }}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--muted)',
                    cursor: 'pointer',
                    padding: 0,
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              )}
            </div>
          </div>

          {/* Provinces Checkbox List */}
          <div
            style={{
              maxHeight: '280px',
              overflowY: 'auto',
              padding: '8px',
            }}
          >
            {filteredProvinces.length === 0 ? (
              <div
                style={{
                  padding: '24px 16px',
                  textAlign: 'center',
                  color: 'var(--muted)',
                  fontSize: '14px',
                }}
              >
                {language === 'en'
                  ? 'No matching province or city found'
                  : 'Không tìm thấy tỉnh/thành phố phù hợp'}
              </div>
            ) : (
              filteredProvinces.map((province) => {
                const isChecked = tempSelected.includes(province);
                return (
                  <label
                    key={province}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      userSelect: 'none',
                      backgroundColor: isChecked ? 'rgba(22, 119, 255, 0.08)' : 'transparent',
                      transition: 'background-color 0.15s ease',
                      marginBottom: '2px',
                    }}
                    onMouseEnter={(e) => {
                      if (!isChecked) {
                        e.currentTarget.style.backgroundColor =
                          'var(--sel, rgba(255, 255, 255, 0.05))';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isChecked) {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => toggleProvince(province)}
                      style={{
                        width: '18px',
                        height: '18px',
                        accentColor: 'var(--blue, #1677ff)',
                        cursor: 'pointer',
                        borderRadius: '4px',
                      }}
                    />
                    <span
                      style={{
                        fontSize: '14px',
                        color: isChecked ? 'var(--blue, #1677ff)' : 'var(--ink)',
                        fontWeight: isChecked ? 600 : 400,
                        flex: 1,
                      }}
                    >
                      {province}
                    </span>
                  </label>
                );
              })
            )}
          </div>

          {/* Footer with Clear All and Apply Actions */}
          <div
            style={{
              padding: '12px 16px',
              borderTop: '1px solid var(--hair)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: 'var(--panel, rgba(255, 255, 255, 0.02))',
            }}
          >
            <button
              type="button"
              onClick={handleClearAll}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--muted)',
                fontSize: '14px',
                cursor: 'pointer',
                padding: '6px 8px',
                fontWeight: 500,
                borderRadius: '6px',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--ink)')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--muted)')}
            >
              {t('locationPopover.clearAll')}
            </button>

            <button
              type="button"
              onClick={handleApply}
              style={{
                backgroundColor: 'var(--green, #1fa971)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '24px',
                padding: '8px 24px',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(31, 169, 113, 0.3)',
                transition: 'transform 0.15s ease, background-color 0.15s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.9')}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
            >
              {t('locationPopover.apply')}{' '}
              {tempSelected.length > 0 ? `(${tempSelected.length})` : ''}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
