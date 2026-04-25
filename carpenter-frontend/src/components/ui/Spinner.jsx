const Spinner = ({ size = 'md', color = 'bronze' }) => {
  const sizes = { sm: 'w-4 h-4', md: 'w-8 h-8', lg: 'w-12 h-12' }
  const colors = {
    bronze: 'border-bronze-light',
    cream:  'border-cream',
  }
  return (
    <div className={`
      ${sizes[size]} ${colors[color]}
      border-2 border-t-transparent rounded-full
      animate-spin
    `} />
  )
}

export default Spinner