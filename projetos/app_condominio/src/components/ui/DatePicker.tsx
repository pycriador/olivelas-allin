import React, { InputHTMLAttributes, forwardRef } from 'react';
import { Calendar } from 'lucide-react';
import { Input, InputProps } from './Input';

export interface DatePickerProps extends Omit<InputProps, 'type' | 'leftIcon'> {
  minDate?: string;
  maxDate?: string;
}

export const DatePicker = forwardRef<HTMLInputElement, DatePickerProps>(
  ({ minDate, maxDate, ...props }, ref) => {
    return (
      <Input
        ref={ref}
        type="date"
        leftIcon={<Calendar className="w-4 h-4" />}
        min={minDate}
        max={maxDate}
        {...props}
      />
    );
  }
);

DatePicker.displayName = 'DatePicker';
