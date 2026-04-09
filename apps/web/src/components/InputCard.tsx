import { useState, useRef, type KeyboardEvent } from 'react';

interface InputCardProps {
  onSubmit?: (text: string) => void;
}

export function InputCard({ onSubmit }: InputCardProps) {
  const [text, setText] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && text.trim()) {
      onSubmit?.(text.trim());
      setText('');
    }
    if (e.key === 'Escape') {
      setText('');
      inputRef.current?.blur();
    }
  };

  return (
    <div
      className={`bg-surface rounded-xl shadow-sm p-3 transition-shadow duration-150 ease-out lg:hover:shadow-md ${
        isFocused ? 'ring-2 ring-accent' : ''
      }`}
    >
      <label htmlFor="task-input" className="sr-only">
        Add a task
      </label>
      <input
        ref={inputRef}
        id="task-input"
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        onKeyDown={handleKeyDown}
        placeholder="Add a task..."
        className="w-full bg-transparent text-[0.9375rem] font-normal text-text-primary placeholder:text-text-muted outline-none"
      />
    </div>
  );
}
