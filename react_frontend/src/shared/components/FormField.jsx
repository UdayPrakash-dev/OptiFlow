import React from 'react';

/**
 * Base Tailwind style utilities for form controls.
 * 
 * WHY: Centralizing these classes guarantees that Input, Select, Textarea, and DatePicker
 * all share identical height, padding, borders, rounded corners, and focus ring transitions.
 */
const baseControlClasses =
  'w-full px-3.5 py-2 text-sm text-gray-900 bg-white border rounded-lg shadow-2xs transition-colors duration-150 focus:outline-none focus:ring-2 disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed';

const normalBorderClasses =
  'border-gray-300 focus:border-blue-500 focus:ring-blue-500/20';

const errorBorderClasses =
  'border-red-500 text-red-900 focus:border-red-500 focus:ring-red-500/20';

/**
 * 1. FormField Wrapper
 * 
 * WHY: Forms need accessible labels, required asterisks (*), helpful guidance text,
 * and clear validation error messages. FormField wraps any input with these standard elements.
 * 
 * @param {Object} props
 * @param {string} [props.label] - Text label shown above the input
 * @param {string} [props.htmlFor] - ID of the input element for screen reader accessibility
 * @param {boolean} [props.required=false] - Whether to show a red required asterisk (*)
 * @param {string} [props.error] - Validation error message shown below the input in red
 * @param {string} [props.helpText] - Informational subtitle text shown below the input
 * @param {React.ReactNode} props.children - The actual input/select/textarea component
 * @param {string} [props.className=''] - Additional classes for the field container
 */
export const FormField = ({
  label,
  htmlFor,
  required = false,
  error,
  helpText,
  children,
  className = '',
}) => {
  return (
    <div className={`space-y-1.5 ${className}`}>
      {/* Label with optional required asterisk */}
      {label && (
        <label
          htmlFor={htmlFor}
          className="block text-xs font-semibold text-gray-700 tracking-wide"
        >
          {label}
          {required && <span className="ml-1 text-red-500">*</span>}
        </label>
      )}

      {/* Input Element Slot */}
      <div>{children}</div>

      {/* Validation Error Message (Prioritized over helpText) */}
      {error && (
        <p className="text-xs text-red-600 flex items-center mt-1 animate-fade-in">
          <svg
            className="w-3.5 h-3.5 mr-1 shrink-0"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
          {error}
        </p>
      )}

      {/* Optional Guidance Help Text (Only shown if no error) */}
      {!error && helpText && (
        <p className="text-xs text-gray-500 mt-1">{helpText}</p>
      )}
    </div>
  );
};

/**
 * 2. Styled Input Component
 * 
 * @param {Object} props
 * @param {boolean} [props.error] - If true, highlights input in red
 * @param {string} [props.className=''] - Extra classes
 */
export const Input = React.forwardRef(
  ({ error, className = '', type = 'text', ...props }, ref) => {
    return (
      <input
        ref={ref}
        type={type}
        className={`${baseControlClasses} ${
          error ? errorBorderClasses : normalBorderClasses
        } ${className}`}
        {...props}
      />
    );
  }
);
Input.displayName = 'Input';

/**
 * 3. Styled Select Component
 * 
 * @param {Object} props
 * @param {Array<{ label: string, value: string | number, disabled?: boolean } | string>} [props.options] - List of dropdown options
 * @param {string} [props.placeholder] - Default placeholder prompt (e.g. "Select an option...")
 * @param {boolean} [props.error] - If true, highlights select in red
 * @param {React.ReactNode} [props.children] - Custom option tags if options array is omitted
 * @param {string} [props.className=''] - Extra classes
 */
export const Select = React.forwardRef(
  ({ options, placeholder, error, children, className = '', ...props }, ref) => {
    return (
      <select
        ref={ref}
        className={`${baseControlClasses} ${
          error ? errorBorderClasses : normalBorderClasses
        } cursor-pointer bg-no-repeat ${className}`}
        {...props}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}

        {/* If options array was passed, render them automatically */}
        {options &&
          options.map((opt, idx) => {
            const isObject = typeof opt === 'object' && opt !== null;
            const value = isObject ? opt.value : opt;
            const label = isObject ? opt.label : opt;
            const disabled = isObject ? opt.disabled : false;

            return (
              <option key={value ?? idx} value={value} disabled={disabled}>
                {label}
              </option>
            );
          })}

        {/* Otherwise render manual children <option> tags */}
        {children}
      </select>
    );
  }
);
Select.displayName = 'Select';

/**
 * 4. Styled Textarea Component
 * 
 * @param {Object} props
 * @param {number} [props.rows=3] - Number of visible text lines
 * @param {boolean} [props.error] - If true, highlights textarea in red
 * @param {string} [props.className=''] - Extra classes
 */
export const Textarea = React.forwardRef(
  ({ rows = 3, error, className = '', ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        rows={rows}
        className={`${baseControlClasses} resize-y ${
          error ? errorBorderClasses : normalBorderClasses
        } ${className}`}
        {...props}
      />
    );
  }
);
Textarea.displayName = 'Textarea';

/**
 * 5. Styled DatePicker Component
 * 
 * WHY: Native HTML5 `<input type="date">` is fast, accessible on mobile devices,
 * and requires no massive calendar library dependencies.
 * 
 * @param {Object} props
 * @param {boolean} [props.error] - If true, highlights input in red
 * @param {string} [props.className=''] - Extra classes
 */
export const DatePicker = React.forwardRef(
  ({ error, className = '', ...props }, ref) => {
    return (
      <input
        ref={ref}
        type="date"
        className={`${baseControlClasses} ${
          error ? errorBorderClasses : normalBorderClasses
        } ${className}`}
        {...props}
      />
    );
  }
);
DatePicker.displayName = 'DatePicker';
