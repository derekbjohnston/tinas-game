import type { Scores } from '../../types/game';

interface Props {
  scores: Scores;
  activeTeam?: 1 | 2;
}

export function ScoreBoard({ scores, activeTeam }: Props) {
  return (
    <div className="flex-row justify-center gap-16" style={{ fontSize: '1.1rem' }}>
      <div
        style={{
          textAlign: 'center',
          opacity: activeTeam === 2 ? 0.5 : 1,
          transition: 'opacity 0.2s',
        }}
      >
        <div
          style={{
            color: 'var(--color-team1)',
            fontWeight: 700,
            fontSize: '1.5rem',
          }}
        >
          {scores.team1}
        </div>
        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
          Team 1
        </div>
      </div>

      <div style={{ color: 'var(--color-text-muted)', alignSelf: 'center' }}>vs</div>

      <div
        style={{
          textAlign: 'center',
          opacity: activeTeam === 1 ? 0.5 : 1,
          transition: 'opacity 0.2s',
        }}
      >
        <div
          style={{
            color: 'var(--color-team2)',
            fontWeight: 700,
            fontSize: '1.5rem',
          }}
        >
          {scores.team2}
        </div>
        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
          Team 2
        </div>
      </div>
    </div>
  );
}
