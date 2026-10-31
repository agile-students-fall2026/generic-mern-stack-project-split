import { Link } from 'react-router-dom'

// One row of a <ul>. With `to`, the whole row is a link to that screen.
// right holds the value column: an amount, a status, or a small Button.
function ListRow({ title, subtitle, right, to }) {
  const content = (
    <>
      <div className="min-w-0">
        <p className="truncate">{title}</p>
        {subtitle && <p className="text-caption text-muted">{subtitle}</p>}
      </div>
      {right && (
        <div className="shrink-0 text-right font-semibold">{right}</div>
      )}
    </>
  )
  const classes = 'flex items-center justify-between gap-4 pt-6 pb-3'

  return (
    <li className="border-b border-line">
      {to ? (
        <Link to={to} className={classes}>
          {content}
        </Link>
      ) : (
        <div className={classes}>{content}</div>
      )}
    </li>
  )
}

export default ListRow
