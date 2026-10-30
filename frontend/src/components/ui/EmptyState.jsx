export default function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center px-6 py-16 text-center">
      {Icon && (
        <span className="mb-4 flex size-14 items-center justify-center rounded-full bg-sunken text-ink-muted">
          <Icon size={24} />
        </span>
      )}
      <p className="text-lg font-semibold text-ink">{title}</p>
      {description && <p className="mt-2 max-w-md text-base text-ink-muted">{description}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
