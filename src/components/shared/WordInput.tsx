interface Props {
  index: number;
  value: string;
  onChange: (index: number, value: string) => void;
  onRemove?: (index: number) => void;
  removable?: boolean;
}

export function WordInput({ index, value, onChange, onRemove, removable }: Props) {
  return (
    <div className="flex-row gap-8">
      <input
        type="text"
        placeholder={`Word or saying #${index + 1}`}
        value={value}
        onChange={(e) => onChange(index, e.target.value)}
        maxLength={50}
        autoComplete="off"
      />
      {removable && onRemove && (
        <button
          className="danger"
          onClick={() => onRemove(index)}
          style={{ padding: '8px 12px', minWidth: 'auto', fontSize: '1.2rem' }}
          aria-label="Remove"
        >
          &times;
        </button>
      )}
    </div>
  );
}
