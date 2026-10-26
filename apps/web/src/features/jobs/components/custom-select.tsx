import React, { useState, useRef, useEffect } from 'react';

export interface SelectOption {
  value: string;
  label: string;
}

export interface CustomSelectProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
}

export function CustomSelect({
  id,
  label,
  value,
  onChange,
  options,
  placeholder = 'Chọn một tùy chọn',
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
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

  const selectedOption = options.find((opt) => opt.value === value);
  const displayLabel = selectedOption ? selectedOption.label : placeholder;

  const handleSelect = (val: string) => {
    onChange(val);
    setIsOpen(false);
  };

  return (
    <div
      ref={containerRef}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-1)',
        position: 'relative',
        userSelect: 'none',
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

      {/* Hidden native select for accessibility and testing support */}
      <select
        id={id}
        aria-label={label}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        tabIndex={-1}
        style={{
          position: 'absolute',
          opacity: 0,
          pointerEvents: 'none',
          width: '1px',
          height: '1px',
          margin: '-1px',
          overflow: 'hidden',
          clip: 'rect(0, 0, 0, 0)',
        }}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>

      {/* Trigger Button mimicking high-end UI in Image 4 */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 16px',
          borderRadius: '14px',
          border: isOpen ? '1px solid var(--blue)' : '1px solid var(--hair2, var(--hair))',
          backgroundColor: 'var(--card)',
          color: 'var(--ink)',
          fontSize: '15px',
          minHeight: '44px',
          outline: 'none',
          cursor: 'pointer',
          boxShadow: isOpen ? '0 0 0 3px rgba(22, 119, 255, 0.15)' : 'none',
          transition: 'border-color 0.2s, box-shadow 0.2s, background-color 0.2s',
          textAlign: 'left',
          width: '100%',
        }}
      >
        <span
          style={{
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            color: selectedOption ? 'var(--ink)' : 'var(--muted)',
            fontWeight: selectedOption ? 500 : 400,
          }}
        >
          {displayLabel}
        </span>
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{
            flexShrink: 0,
            marginLeft: '8px',
            color: 'var(--muted)',
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s ease',
          }}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {/* Dropdown Menu Popup with rounded corners (Image 4 styling) */}
      {isOpen && (
        <div
          role="listbox"
          aria-label={label}
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            left: 0,
            right: 0,
            zIndex: 1000,
            backgroundColor: 'var(--card)',
            borderRadius: '14px',
            border: '1px solid var(--hair2, var(--hair))',
            boxShadow: '0 12px 32px rgba(0, 0, 0, 0.35), 0 4px 12px rgba(0, 0, 0, 0.15)',
            padding: '6px',
            maxHeight: '260px',
            overflowY: 'auto',
            animation: 'fadeIn 0.15s ease-out',
          }}
        >
          {options.map((option) => {
            const isSelected = option.value === value;
            return (
              <div
                key={option.value}
                role="option"
                aria-selected={isSelected}
                tabIndex={0}
                onClick={() => handleSelect(option.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    handleSelect(option.value);
                  }
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '9px 12px',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  backgroundColor: isSelected ? 'rgba(22, 119, 255, 0.12)' : 'transparent',
                  color: isSelected ? 'var(--blue)' : 'var(--ink)',
                  fontSize: '14px',
                  fontWeight: isSelected ? 600 : 400,
                  transition: 'background-color 0.15s, color 0.15s',
                  marginBottom: '2px',
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.backgroundColor = 'var(--sel, rgba(255, 255, 255, 0.06))';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }
                }}
              >
                <span>{option.label}</span>
                {isSelected && (
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="var(--blue)"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
