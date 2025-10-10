import React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: React.ReactNode;
  isRtl?: boolean;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, icon, isRtl = false, ...props }, ref) => {
    const iconPadding = icon ? (isRtl ? 'pr-10 pl-4' : 'pl-10 pr-4') : 'px-4';

    return (
      <div className="relative w-full">
        {icon && (
          <div className={`absolute inset-y-0 flex items-center pointer-events-none ${isRtl ? 'right-0 pr-3' : 'left-0 pl-3'}`}>
            {icon}
          </div>
        )}
        <input
          type={type}
          className={`w-full bg-neutral-100 dark:bg-neutral-800 border border-transparent rounded-lg py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition ${iconPadding} ${className}`}
          ref={ref}
          {...props}
        />
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;
