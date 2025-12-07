import { ShoppingBag, Plus, Check } from 'lucide-react'

export default function ProductCard({ product, onAddToCart, inCart }) {
    return (
        <div className="glass-effect rounded-xl overflow-hidden hover:scale-105 transition-all duration-300 group">
            {/* Product Image/Icon */}
            <div className="bg-gradient-to-br from-qubic-primary/20 to-qubic-secondary/20 h-48 flex items-center justify-center relative overflow-hidden">
                <div className="text-7xl group-hover:scale-110 transition-transform duration-300">
                    {product.image}
                </div>
                <div className="absolute top-3 right-3 glass-effect px-3 py-1 rounded-full text-xs font-semibold text-qubic-primary">
                    {product.category}
                </div>
            </div>

            {/* Product Info */}
            <div className="p-6">
                <h3 className="text-xl font-bold mb-2 group-hover:text-qubic-primary transition-colors">
                    {product.name}
                </h3>
                <p className="text-gray-400 text-sm mb-4 line-clamp-2">
                    {product.description}
                </p>

                {/* Price and Action */}
                <div className="flex items-center justify-between">
                    <div>
                        <div className="text-2xl font-bold bg-gradient-to-r from-qubic-primary to-qubic-secondary bg-clip-text text-transparent">
                            {product.price}
                        </div>
                        <div className="text-xs text-gray-500">QUBIC</div>
                    </div>

                    <button
                        onClick={() => onAddToCart(product)}
                        className={`px-6 py-3 rounded-lg font-semibold transition-all duration-300 flex items-center space-x-2 ${inCart
                                ? 'bg-green-500/20 text-green-400 border border-green-500/50'
                                : 'bg-gradient-to-r from-qubic-primary to-qubic-secondary hover:shadow-lg hover:shadow-qubic-primary/50'
                            }`}
                    >
                        {inCart ? (
                            <>
                                <Check className="w-4 h-4" />
                                <span>Added</span>
                            </>
                        ) : (
                            <>
                                <Plus className="w-4 h-4" />
                                <span>Add</span>
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    )
}
