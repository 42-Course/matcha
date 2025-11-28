import React from 'react';

type FormSelectProps = {
  label: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  options: string[] | Array<{ value: string; label: string }>;
  required?: boolean;
};

const FormSelect = ({
  label,
  name,
  value,
  onChange,
  options,
  required = false,
}: FormSelectProps) => {
  const isStringArray = typeof options[0] === 'string';

  return (
    <div className="mb-4">
      {label && (
        <label htmlFor={name} className="block text-sm font-medium text-gray-700 dark:text-gray-200">
          {label}
        </label>
      )}
      <select
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
      >
        {label && <option value="">Select {label}</option>}
        {isStringArray
          ? (options as string[]).map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))
          : (options as Array<{ value: string; label: string }>).map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
      </select>
    </div>
  );
};

export default FormSelect;
