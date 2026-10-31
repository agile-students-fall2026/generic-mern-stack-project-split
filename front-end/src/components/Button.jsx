import { Link } from 'react-router-dom'

const variants = {
  primary:
    'bg-ink font-semibold text-white disabled:cursor-not-allowed disabled:bg-disabled disabled:text-faint',
  outline: 'border-[1.5px] border-ink bg-white font-semibold text-ink',
  text: 'font-medium text-ink underline underline-offset-4',
}

// Full width by default; small is the inline row action ("Mark paid", "Options").
// Pass `to` to render a Link that looks like a button.
function Button({
  variant = 'primary',
  small = false,
  to,
  type = 'button',
  className = '',
  ...props
}) {
  const size =
    variant === 'text'
      ? 'mx-auto flex w-fit py-2'
      : small
        ? 'inline-flex h-[34px] rounded-lg px-3 text-sm'
        : 'flex h-12 w-full rounded-[10px] px-4'
  const classes = `items-center justify-center ${size} ${variants[variant]} ${className}`

  if (to) return <Link to={to} className={classes} {...props} />
  return <button type={type} className={classes} {...props} />
}

export default Button
