interface Props {
  remaining: number;
  fraction: number;
}

export function Timer({ remaining, fraction }: Props) {
  const urgent = remaining <= 5;
  const color = urgent ? 'var(--color-danger)' : 'var(--color-primary-light)';

  return (
    <div style={{ textAlign: 'center' }}>
      <div
        style={{
          fontSize: '3rem',
          fontWeight: 700,
          color,
          fontVariantNumeric: 'tabular-nums',
          transition: 'color 0.3s',
        }}
      >
        {remaining}
      </div>
      <div
        style={{
          height: 6,
          borderRadius: 3,
          backgroundColor: 'var(--color-surface)',
          overflow: 'hidden',
          marginTop: 4,
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${fraction * 100}%`,
            backgroundColor: color,
            borderRadius: 3,
            transition: 'width 0.1s linear, background-color 0.3s',
          }}
        />
      </div>
    </div>
  );
}
