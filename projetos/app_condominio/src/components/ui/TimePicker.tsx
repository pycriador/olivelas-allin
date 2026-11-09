import React, { forwardRef } from 'react';
import { Clock } from 'lucide-react';
import { Input, InputProps } from './Input';

export interface TimePickerProps extends Omit<InputProps, 'type' | 'leftIcon'> {
  step?: number;
}

export const TimePicker = forwardRef<HTMLInputElement, TimePickerProps>(
  ({ step = 900, ...props }, ref) => {
    return (
      <Input
        ref={ref}
        type="time"
        step={step}
        leftIcon={<Clock className="w-4 h-4" />}
        {...props}
      />
    );
  }
);

TimePicker.displayName = 'TimePicker';
