import { useId } from 'react'

// Labelled input with an optional helper line; an error replaces the helper.
// Other props (value, onChange, type, placeholder, ...) go to the <input>.
function TextField({ id, label, helper, error, className = '', ...props }) {
  const generatedId = useId()
  const inputId = id || generatedId
  const noteId = `${inputId}-note`
  const note = error || helper

  return (
    <div className={className}>
      <label htmlFor={inputId} className="mb-1 block text-sm font-medium">
        {label}
      </label>
      <input
        id={inputId}
        aria-invalid={error ? true : undefined}
        aria-describedby={note ? noteId : undefined}
        className={`h-[46px] w-full rounded-lg border bg-white px-3 placeholder:text-muted focus:border-ink focus:ring-1 focus:ring-ink focus:outline-none ${error ? 'border-ink ring-1 ring-ink' : 'border-line'}`}
        {...props}
      />
      {note && (
        <p
          id={noteId}
          className={`mt-1.5 text-sm ${error ? 'font-semibold' : 'text-muted'}`}
        >
          {note}
        </p>
      )}
    </div>
  )
}

export default TextField
