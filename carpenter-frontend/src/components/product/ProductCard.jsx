import { useNavigate } from 'react-router-dom'
import { formatPrice, truncate } from '../../utils/helpers'

const ProductCard = ({ product }) => {
  const navigate = useNavigate()

  return (
    <div className="wood-card group cursor-pointer overflow-hidden">

      {/* Image */}
      <div className="product-img-wrap h-52 bg-wood-dark relative">
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-4xl opacity-20">🪵</span>
          </div>
        )}
        {/* Category ribbon */}
        <div className="absolute top-3 left-0 bg-bronze/90 px-3 py-1">
          <span className="font-sans text-xs tracking-widest uppercase text-wood-dark font-semibold">
            {product.category}
          </span>
        </div>
      </div>

      {/* Info */}
      <div className="p-4">
        <p className="font-sans text-xs text-cream-muted tracking-widest uppercase mb-1">
          Product Name
        </p>
        <h3 className="font-serif text-lg text-cream mb-2 leading-tight">
          {product.name}
        </h3>
        <p className="font-sans text-xs text-cream-muted/70 mb-4 leading-relaxed">
          {truncate(product.description, 70)}
        </p>

        {/* Detail Button */}
        <div className="flex items-center justify-center">
          <button
            onClick={() => navigate(`/products/${product.id}`)}
            className="btn-bronze w-full py-2 text-xs"
          >
            View Piece
          </button>
        </div>
      </div>
    </div>
  )
}

export default ProductCard