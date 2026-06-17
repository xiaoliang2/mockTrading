import { useState, useEffect, useRef } from 'react';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';

interface DateRange {
  startDate: Date | null;
  endDate: Date | null;
}

interface SingleDate {
  date: Date | null;
}

type DatePickerProps = {
  selectedRange: DateRange;
  onChange: (range: DateRange) => void;
  showPresets?: boolean;
} | {
  selectedDate: SingleDate;
  onChange: (value: SingleDate) => void;
  showPresets?: boolean;
};

export function DatePicker(props: DatePickerProps) {
  const { showPresets = true } = props;
  const isRangeMode = 'selectedRange' in props;
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);

  const startDate = isRangeMode ? props.selectedRange.startDate : props.selectedDate.date;
  const endDate = isRangeMode ? props.selectedRange.endDate : null;

  useEffect(() => {
    if (isOpen) {
      const handleClickOutside = (e: MouseEvent) => {
        const target = e.target as HTMLElement;
        if (!target.closest('.date-picker-container') && !target.closest('.date-picker-popup')) {
          setIsOpen(false);
        }
      };
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setPosition({
        top: rect.bottom + window.scrollY + 8,
        left: rect.left + window.scrollX,
      });
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
    if (!isRangeMode) {
      props.onChange({ date: new Date(dateStr) });
      setIsOpen(false);
      return;
    }
    if (!startDate || (startDate && endDate)) {
      props.onChange({ startDate: new Date(dateStr), endDate: null });
    } else if (date < startDate) {
      props.onChange({ startDate: new Date(dateStr), endDate: startDate });
    } else {
      props.onChange({ startDate, endDate: new Date(dateStr) });
      setIsOpen(false);
    }
  };

  const handlePreset = (days: number) => {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    if (isRangeMode) {
      props.onChange({ startDate, endDate });
    } else {
      props.onChange({ date: startDate });
    }
    setIsOpen(false);
  };

  const handleToday = () => {
    if (isRangeMode) {
      props.onChange({ startDate: new Date(), endDate: new Date() });
    } else {
      props.onChange({ date: new Date() });
    }
    setIsOpen(false);
  };

  const handleClear = () => {
    if (isRangeMode) {
      props.onChange({ startDate: null, endDate: null });
    } else {
      props.onChange({ date: null });
    }
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
        ref={buttonRef}
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
        <div
          ref={popupRef}
          className="fixed bg-white rounded-lg shadow-2xl border border-gray-200 p-4 date-picker-popup"
          style={{
            top: `${position.top}px`,
            left: `${position.left}px`,
            zIndex: 99999,
            minWidth: '300px',
          }}
        >
          <div className="flex gap-2 mb-3">
            {isRangeMode && (
              <>
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
              </>
            )}
            {!isRangeMode && (
              <>
                <button
                  onClick={handleToday}
                  className="flex-1 px-3 py-1.5 text-xs bg-blue-50 text-blue-600 rounded hover:bg-blue-100 transition-colors"
                >
                  今天
                </button>
                <button
                  onClick={handleClear}
                  className="flex-1 px-3 py-1.5 text-xs bg-gray-50 text-gray-600 rounded hover:bg-gray-100 transition-colors"
                >
                  清除
                </button>
              </>
            )}
          </div>

          <div className="flex items-center justify-between mb-3">
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

          <div className="grid grid-cols-7 gap-1 min-w-[280px]">
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

              let className = 'py-2 text-sm text-center rounded cursor-pointer transition-colors';
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
