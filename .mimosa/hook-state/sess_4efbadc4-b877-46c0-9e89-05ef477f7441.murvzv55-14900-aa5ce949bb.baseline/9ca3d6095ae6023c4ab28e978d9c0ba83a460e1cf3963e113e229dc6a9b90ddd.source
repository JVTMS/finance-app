// Invólucro de vidro para gráficos: título, subtítulo, ações e legenda opcional.

import { cx } from '../../utils/format';

export default function ChartCard({ title, subtitle, actions, children, className = '', footer }) {
  return (
    <section className={cx('chart-card', className)}>
      <header className="chart-card__head">
        <div>
          <h3 className="chart-card__title">{title}</h3>
          {subtitle && <p className="chart-card__subtitle">{subtitle}</p>}
        </div>
        {actions && <div className="chart-card__actions">{actions}</div>}
      </header>
      <div className="chart-card__body">{children}</div>
      {footer && <footer className="chart-card__foot">{footer}</footer>}
    </section>
  );
}
