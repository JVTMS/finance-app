// Estado vio (sem transações, sem contas...) com ícone e texto orientativo.

export default function EmptyState({ icon: Icon, title, message, action }) {
  return (
    <div className="empty-state">
      {Icon && (
        <span className="empty-state__icon">
          <Icon size={26} strokeWidth={1.6} aria-hidden />
        </span>
      )}
      <h3 className="empty-state__title">{title}</h3>
      {message && <p className="empty-state__msg">{message}</p>}
      {action}
    </div>
  );
}
