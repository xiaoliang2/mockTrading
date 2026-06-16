import { useState, useEffect } from 'react';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';

interface DateRange {
  startDate: Date | null;
  endDate: Date | null;
}

interface DatePickerProps {
  selectedRange: DateRange;
  onChange: (range: DateRange) => void;
  showPresets?: boolean;
}

export function DatePicker({ selectedRange, onChange, showPresets = true }: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const { startDate, endDate } = selectedRange;

  useEffect(() => {
    if (isOpen) {
      const handleClickOutside = (e: MouseEvent) => {
        const target = e.target as HTMLElement;
        if (!target.closest('.date-picker-container')) {
          setIsOpen(false);
        }
      };
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const formatDate = (date: Date | null): string => {
    if (!date) return '选择日期';
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  const getDaysInMonth = (date: Date): Date[] => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days: Date[] = [];
    
    for (let i = 0; i < firstDay.getDay(); i++) {
      const prevDate = new Date(year, month, -i);
      days.push(prevDate);
    }
    
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push(new Date(year, month, i));
    }
    
    const remainingDays = 42 - days.length;
    for (let i = 1; i <= remainingDays; i++) {
      days.push(new Date(year, month + 1, i));
    }
    
    return days;
  };

  const isSameDate = (date1: Date | null, date2: Date | null): boolean => {
    if (!date1 || !date2) return false;
    return date1.toDateString() === date2.toDateString();
  };

  const isInRange = (date: Date): boolean => {
    if (!startDate || !endDate) return false;
    return date >= new Date(startDate.toDateString()) && 
           date <= new Date(endDate.toDateString());
  };

  const handleDateClick = (date: Date) => {
    const dateStr = date.toDateString();
    
    if (!startDate || (startDate && endDate)) {
      onChange({ startDate: new Date(dateStr), endDate: null });
    } else if (date < startDate) {
      onChange({ startDate: new Date(dateStr), endDate: startDate });
    } else {
      onChange({ startDate, endDate: new Date(dateStr) });
    }
  };

  const handlePreset = (days: number) => {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    onChange({ startDate, endDate });
    setIsOpen(false);
  };

  const prevMonth = () => {
    const newMonth = new Date(currentMonth);
    newMonth.setMonth(newMonth.getMonth() - 1);
    setCurrentMonth(newMonth);
  };

  const nextMonth = () => {
    const newMonth = new Date(currentMonth);
    newMonth.setMonth(newMonth.getMonth() + 1);
    setCurrentMonth(newMonth);
  };

  const days = getDaysInMonth(currentMonth);
  const weekdays = ['日', '一', '二', '三', '四', '五', '六'];

  return (
    <div className="date-picker-container inline-block relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
      >
        <Calendar className="w-4 h-4 text-gray-500" />
        <span className="text-sm text-gray-700">
          {startDate && endDate
            ? `${formatDate(startDate)} - ${formatDate(endDate)}`
            : formatDate(startDate)}
        </span>
      </button>

      {showPresets && isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-lg border border-gray-100 p-3 z-50">
          <div className="flex gap-2 mb-3">
            <button
              onClick={() => handlePreset(7)}
              className="flex-1 px-3 py-1.5 text-xs bg-blue-50 text-blue-600 rounded hover:bg-blue-100 transition-colors"
            >
              近7天
            </button>
            <button
              onClick={() => handlePreset(30)}
              className="flex-1 px-3 py-1.5 text-xs bg-blue-50 text-blue-600 rounded hover:bg-blue-100 transition-colors"
            >
              近30天
            </button>
            <button
              onClick={() => handlePreset(90)}
              className="flex-1 px-3 py-1.5 text-xs bg-blue-50 text-blue-600 rounded hover:bg-blue-100 transition-colors"
            >
              近90天
            </button>
          </div>

          <div className="flex items-center justify-between mb-2">
            <button
              onClick={prevMonth}
              className="p-1 hover:bg-gray-100 rounded"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm font-medium">
              {currentMonth.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long' })}
            </span>
            <button
              onClick={nextMonth}
              className="p-1 hover:bg-gray-100 rounded"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1">
            {weekdays.map((day) => (
              <div key={day} className="text-xs text-center text-gray-400 py-1">
                {day}
              </div>
            ))}
            {days.map((date) => {
              const isCurrentMonth = date.getMonth() === currentMonth.getMonth();
              const isToday = isSameDate(date, new Date());
              const isSelected = isSameDate(date, startDate) || isSameDate(date, endDate);
              const isRange = isInRange(date);
              const isStart = isSameDate(date, startDate);
              const isEnd = isSameDate(date, endDate);

              let className = 'py-1.5 text-sm text-center rounded cursor-pointer transition-colors';
              if (!isCurrentMonth) {
                className += ' text-gray-300';
              } else if (isSelected) {
                className += ' bg-blue-600 text-white';
              } else if (isRange) {
                className += ' bg-blue-100';
              } else if (isToday) {
                className += ' bg-blue-50 text-blue-600 font-medium';
              } else {
                className += ' hover:bg-gray-100';
              }

              return (
                <div
                  key={date.getTime()}
                  className={className}
                  onClick={() => handleDateClick(date)}
                >
                  {date.getDate()}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
