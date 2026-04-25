import { CATEGORIES } from '../../utils/constants'

const CategoryFilter = ({ active, onChange }) => (
  <div className="flex flex-wrap gap-2">
    {CATEGORIES.map((cat) => (
      <button
        key={cat.value}
        onClick={() => onChange(cat.value)}
        className={`filter-btn ${active === cat.value ? 'active' : ''}`}
      >
        {cat.label}
      </button>
    ))}
  </div>
)

export default CategoryFilter