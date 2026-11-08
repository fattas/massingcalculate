import { useState, useEffect } from 'react';

/**
 * NumericInput:
 * - Allows typing freely without forced keyboard arrow button usage
 * - Accepts both dot (.) and comma (,) as decimal separators (e.g. 0,008 or 0.008)
 * - Preserves trailing zeros after decimal point while actively typing (e.g. "0.", "0.0", "0.00")
 * - Allows clearing the field completely with Backspace without snapping back to 0 or 1
 * - Supports keyboard ArrowUp / ArrowDown for optional increment/decrement
 * - showZero: if false (default), 0 or empty is rendered as '' so the input shows its placeholder
 */
export default function NumericInput({
  value,
  onChange,
  onBlur,
  onKeyDown,
  placeholder = '',
  className = '',
  min,
  max,
  step,
  allowDecimal = true,
  allowNegative = false,
  showZero = false,
  disabled = false,
  readOnly = false,
  autoFocus = false,
  ...props
}) {
  const defaultStep = step !== undefined ? step : (allowDecimal ? 0.01 : 1);

  // Local string state to preserve exact keystrokes while the user is typing
  const [text, setText] = useState(() => {
    if (value === null || value === undefined || value === '') return '';
    if (value === 0 && !showZero) return '';
    return String(value);
  });

  const [isFocused, setIsFocused] = useState(false);

  // Sync from external value changes when not actively focused
  useEffect(() => {
    if (!isFocused) {
      if (value === null || value === undefined || value === '' || (value === 0 && !showZero)) {
        setText('');
      } else {
        const parsedCurrent = parseFloat(String(text).replace(/,/g, '.'));
        const parsedNext = Number(value);
        if (isNaN(parsedCurrent) || parsedCurrent !== parsedNext || text === '') {
          setText(String(value));
        }
      }
    }
  }, [value, isFocused, showZero]);

  const handleChange = (e) => {
    const raw = e.target.value;

    // Filter valid characters: digits, at most one dot or comma, optional leading minus
    if (allowDecimal) {
      const regex = allowNegative ? /^-?[0-9]*[.,]?[0-9]*$/ : /^[0-9]*[.,]?[0-9]*$/;
      if (!regex.test(raw)) return;
    } else {
      const regex = allowNegative ? /^-?[0-9]*$/ : /^[0-9]*$/;
      if (!regex.test(raw)) return;
    }

    setText(raw);

    // If empty or incomplete character ("-", ".", ","), notify parent with 0 and raw string
    if (raw === '' || raw === '-' || raw === '.' || raw === ',') {
      if (onChange) onChange(0, raw);
      return;
    }

    const normalized = raw.replace(/,/g, '.');
    const parsedNum = allowDecimal ? parseFloat(normalized) : parseInt(normalized, 10);
    if (!isNaN(parsedNum)) {
      if (onChange) onChange(parsedNum, raw);
    }
  };

  const handleBlur = (e) => {
    setIsFocused(false);

    const raw = text.trim();
    if (raw === '' || raw === '-' || raw === '.' || raw === ',') {
      setText(showZero ? '0' : '');
      if (onChange) onChange(0, '');
    } else {
      const normalized = raw.replace(/,/g, '.');
      let num = allowDecimal ? parseFloat(normalized) : parseInt(normalized, 10);
      if (!isNaN(num)) {
        if (min !== undefined && num < min) num = min;
        if (max !== undefined && num > max) num = max;
        if (num === 0 && !showZero) {
          setText('');
        } else {
          // Preserve comma if the user typed comma
          setText(raw.includes(',') ? String(num).replace('.', ',') : String(num));
        }
        if (onChange) onChange(num, String(num));
      } else {
        setText(showZero ? '0' : '');
        if (onChange) onChange(0, '');
      }
    }

    if (onBlur) onBlur(e);
  };

  const handleFocus = (e) => {
    setIsFocused(true);
    if (props.onFocus) props.onFocus(e);
  };

  const handleKeyDownInternal = (e) => {
    if (!disabled && !readOnly && (e.key === 'ArrowUp' || e.key === 'ArrowDown')) {
      e.preventDefault();
      const stepVal = defaultStep === 'any' ? (allowDecimal ? 0.01 : 1) : Number(defaultStep);
      const delta = e.key === 'ArrowUp' ? stepVal : -stepVal;
      const cur = parseFloat(text.replace(/,/g, '.')) || 0;
      const precision = stepVal < 1 ? String(stepVal).split('.')[1]?.length || 2 : 0;
      let next = parseFloat((cur + delta).toFixed(Math.max(precision, 4)));
      if (min !== undefined && next < min) next = min;
      if (max !== undefined && next > max) next = max;
      const outText = text.includes(',') ? String(next).replace('.', ',') : String(next);
      setText(outText);
      if (onChange) onChange(next, outText);
    }
    if (onKeyDown) onKeyDown(e);
  };

  return (
    <input
      type="text"
      inputMode={allowDecimal ? 'decimal' : 'numeric'}
      value={text}
      onChange={handleChange}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onKeyDown={handleKeyDownInternal}
      placeholder={placeholder}
      className={className}
      disabled={disabled}
      readOnly={readOnly}
      autoFocus={autoFocus}
      {...props}
    />
  );
}
