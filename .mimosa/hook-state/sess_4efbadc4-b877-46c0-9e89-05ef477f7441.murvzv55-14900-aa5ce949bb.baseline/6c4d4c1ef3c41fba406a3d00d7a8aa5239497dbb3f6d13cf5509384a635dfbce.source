// Campo com rótulo, dica e mensagem de erro acessível.

import { cx } from '../../utils/format';

export default function Field({ label, htmlFor, error, hint, children, className }) {
  return (
    <div className={cx('field', className)}>
      <label className="field__label" htmlFor={htmlFor}>
        {label}
      </label>
      {children}
      {error ? (
        <p className="field__error" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p className="field__hint">{hint}</p>
      ) : null}
    </div>
  );
}
