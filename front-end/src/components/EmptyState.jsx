// Centered message for a screen with nothing to show; children is an optional action.
function EmptyState({ title, description, children }) {
  return (
    <div className="py-20 text-center">
      <h2 className="text-lg font-semibold">{title}</h2>
      {description && (
        <p className="mt-3 text-body text-muted">{description}</p>
      )}
      {children && <div className="mt-4">{children}</div>}
    </div>
  )
}

export default EmptyState
