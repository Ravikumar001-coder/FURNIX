import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { productService } from '../../services/productService';
import {
    SHOP_CATEGORY_TREE,
    SHOP_PRIMARY_CATEGORIES,
    SHOP_SUBCATEGORIES,
    SHOP_SUBCATEGORY_MAP,
} from '../../utils/constants';
import { wishlistService } from '../../services/wishlistService';
import { toast } from 'react-hot-toast';

const GalleryPage = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [primaryCategory, setPrimaryCategory] = useState('ALL');
    const [subcategory, setSubcategory] = useState('ALL');
    const [search, setSearch] = useState('');
    const [searching, setSearching] = useState(false);
    const [materials, setMaterials] = useState({
        oak: false,
        walnut: false,
        pine: false
    });
    const [maxPrice, setMaxPrice] = useState(100000);
    const [wishlistIds, setWishlistIds] = useState([]);

    useEffect(() => {
        setWishlistIds(wishlistService.get().map(p => p.id));
    }, []);

    const loadAllProducts = async () => {
        setLoading(true);
        try {
            const data = await productService.getAll(null, null, 0, 100);
            setProducts(Array.isArray(data) ? data : (data.content || []));
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadAllProducts();
    }, []);

    useEffect(() => {
        if (!search.trim()) {
            loadAllProducts();
            return;
        }

        const timer = setTimeout(async () => {
            setSearching(true);
            try {
                const data = await productService.search(search);
                setProducts(Array.isArray(data) ? data : (data.content || []));
            } catch (err) {
                console.error(err);
            } finally {
                setSearching(false);
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [search]);

    useEffect(() => {
        setSubcategory('ALL');
    }, [primaryCategory]);

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0,
        }).format(amount);
    };

    const getOffsetClass = (idx) => {
        switch (idx % 6) {
            case 0: return '';
            case 1: return 'md:mt-12';
            case 2: return 'xl:mt-24';
            case 3: return '';
            case 4: return 'md:mt-12 xl:mt-0';
            case 5: return 'xl:mt-12';
            default: return '';
        }
    };

    const handleMaterialToggle = (material) => {
        setMaterials(prev => ({ ...prev, [material]: !prev[material] }));
    };

    const matchSubcategory = (product, subcategoryItem) => {
        if (!subcategoryItem) return true;

        const haystack = [product.name, product.description, product.material]
            .filter(Boolean)
            .join(' ')
            .toLowerCase();

        const backendMatch = product.category === subcategoryItem.backendCategory;
        const keywordMatch = subcategoryItem.keywords.some((keyword) => haystack.includes(keyword));
        return backendMatch || keywordMatch;
    };

    // Client-side filtering for materials and price
    const filteredProducts = products.filter(p => {
        // Price check
        if (p.price > maxPrice) return false;

        // Primary category check
        if (primaryCategory !== 'ALL') {
            const selectedPrimary = SHOP_CATEGORY_TREE.find((item) => item.value === primaryCategory);
            if (!selectedPrimary) return false;
            const primaryMatch = selectedPrimary.subcategories.some((sub) => matchSubcategory(p, sub));
            if (!primaryMatch) return false;
        }

        // Subcategory check
        if (subcategory !== 'ALL') {
            const selectedSub = SHOP_SUBCATEGORY_MAP[subcategory];
            if (!matchSubcategory(p, selectedSub)) return false;
        }

        // Material check
        const anyMaterialSelected = materials.oak || materials.walnut || materials.pine;
        if (!anyMaterialSelected) return true; // No material filter active

        const mat = (p.material || '').toLowerCase();
        if (materials.oak && mat.includes('oak')) return true;
        if (materials.walnut && mat.includes('walnut')) return true;
        if (materials.pine && mat.includes('pine')) return true;

        return false;
    });

    return (
        <>
            <main className="flex-grow max-w-screen-2xl mx-auto w-full px-4 md:px-8 py-8 md:py-12 flex flex-col md:flex-row gap-10 lg:gap-24 relative">
                <aside className="w-full md:w-64 flex-shrink-0 flex flex-col gap-8 md:gap-10 md:sticky md:top-32 h-fit">
                    <div className="mb-4 md:hidden">
                        <div className="flex items-center bg-surface-container-high rounded-full px-4 py-2">
                            <span className="material-symbols-outlined text-outline mr-2 text-sm">search</span>
                            <input 
                                className="bg-transparent border-none focus:ring-0 text-sm font-label text-on-surface placeholder-outline-variant w-full" 
                                placeholder="Search gallery..." 
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                    </div>
                    <div>
                        <h3 className="font-headline text-lg text-primary mb-4 tracking-wide uppercase">Category</h3>
                        <div className="space-y-3">
                            <div>
                                <label className="text-xs uppercase tracking-widest text-on-surface-variant mb-2 block">Primary Category</label>
                                <select
                                    value={primaryCategory}
                                    onChange={(e) => setPrimaryCategory(e.target.value)}
                                    className="w-full bg-surface-container-high border border-outline-variant/30 rounded-lg px-3 py-2 text-sm text-on-surface"
                                >
                                    {SHOP_PRIMARY_CATEGORIES.map((categoryOption) => (
                                        <option key={categoryOption.value} value={categoryOption.value}>{categoryOption.label}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="text-xs uppercase tracking-widest text-on-surface-variant mb-2 block">Subcategory</label>
                                <select
                                    value={subcategory}
                                    onChange={(e) => setSubcategory(e.target.value)}
                                    className="w-full bg-surface-container-high border border-outline-variant/30 rounded-lg px-3 py-2 text-sm text-on-surface"
                                >
                                    <option value="ALL">All Subcategories</option>
                                    {SHOP_SUBCATEGORIES
                                        .filter((item) => primaryCategory === 'ALL' || item.primaryValue === primaryCategory)
                                        .map((item) => (
                                            <option key={item.value} value={item.value}>{item.label}</option>
                                        ))}
                                </select>
                            </div>
                        </div>
                    </div>
                    <div>
                        <h3 className="font-headline text-lg text-primary mb-4 tracking-wide uppercase">Material</h3>
                        <div className="flex flex-col gap-3 font-label text-on-surface-variant">
                            <label className="flex items-center gap-3 cursor-pointer group">
                                <input 
                                    className="form-checkbox h-4 w-4 text-primary bg-surface-container-high border-outline-variant rounded-DEFAULT focus:ring-primary focus:ring-opacity-50" 
                                    type="checkbox" 
                                    checked={materials.oak}
                                    onChange={() => handleMaterialToggle('oak')}
                                />
                                <span className={`${materials.oak ? 'text-primary font-medium' : ''} group-hover:text-primary transition-colors`}>White Oak</span>
                            </label>
                            <label className="flex items-center gap-3 cursor-pointer group">
                                <input 
                                    className="form-checkbox h-4 w-4 text-primary bg-surface-container-high border-outline-variant rounded-DEFAULT focus:ring-primary focus:ring-opacity-50" 
                                    type="checkbox" 
                                    checked={materials.walnut}
                                    onChange={() => handleMaterialToggle('walnut')}
                                />
                                <span className={`${materials.walnut ? 'text-primary font-medium' : ''} group-hover:text-primary transition-colors`}>Black Walnut</span>
                            </label>
                            <label className="flex items-center gap-3 cursor-pointer group">
                                <input 
                                    className="form-checkbox h-4 w-4 text-primary bg-surface-container-high border-outline-variant rounded-DEFAULT focus:ring-primary focus:ring-opacity-50" 
                                    type="checkbox" 
                                    checked={materials.pine}
                                    onChange={() => handleMaterialToggle('pine')}
                                />
                                <span className={`${materials.pine ? 'text-primary font-medium' : ''} group-hover:text-primary transition-colors`}>Reclaimed Pine</span>
                            </label>
                        </div>
                    </div>
                    <div>
                        <h3 className="font-headline text-lg text-primary mb-4 tracking-wide uppercase">Max Price: {formatCurrency(maxPrice)}</h3>
                        <div className="flex flex-col gap-4 font-label">
                            <input 
                                className="w-full h-1 bg-surface-container-high rounded-lg appearance-none cursor-pointer accent-primary" 
                                max="200000" 
                                min="1000" 
                                step="1000"
                                type="range" 
                                value={maxPrice} 
                                onChange={(e) => setMaxPrice(Number(e.target.value))}
                            />
                            <div className="flex justify-between text-sm text-on-surface-variant">
                                <span>₹1,000</span>
                                <span>₹200k+</span>
                            </div>
                        </div>
                    </div>
                </aside>

                <section className="flex-grow">
                    <header className="mb-12 md:mb-20">
                        <h1 className="font-headline text-4xl md:text-6xl text-primary mb-4 tracking-wide leading-tight">
                            {subcategory !== 'ALL'
                                ? SHOP_SUBCATEGORY_MAP[subcategory]?.label
                                : primaryCategory !== 'ALL'
                                    ? SHOP_PRIMARY_CATEGORIES.find((item) => item.value === primaryCategory)?.label
                                    : 'Curated Gallery'}
                        </h1>
                        <p className="font-body text-lg text-on-surface-variant max-w-2xl leading-relaxed">
                            {subcategory !== 'ALL'
                                ? `Explore ${SHOP_SUBCATEGORY_MAP[subcategory]?.label?.toLowerCase()} crafted for durability, comfort, and everyday performance.`
                                : primaryCategory !== 'ALL'
                                    ? `Discover ${SHOP_PRIMARY_CATEGORIES.find((item) => item.value === primaryCategory)?.label?.toLowerCase()} pieces designed for long-term use.`
                                    : 'Every piece is built with structure, purpose, and longevity in mind. Built for real living.'}
                        </p>
                    </header>

                    {loading || searching ? (
                        <div className="flex justify-center items-center py-20">
                            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                        </div>
                    ) : filteredProducts.length === 0 ? (
                        <div className="text-center py-20 text-on-surface-variant">
                            <p className="font-body text-lg">No pieces found matching your criteria.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-x-8 gap-y-16">
                            {filteredProducts.map((product, idx) => (
                                <article key={product.id} className={`group relative flex flex-col bg-surface-container-lowest rounded-xl overflow-hidden transition-all duration-500 ease-in-out ${getOffsetClass(idx)}`}>
                                    <div className={`relative ${idx % 2 === 0 ? 'aspect-[4/5]' : 'aspect-[3/4]'} bg-surface-container-low mb-6 overflow-hidden`}>
                                        <img loading="lazy"
                                            alt={product.name} 
                                            className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-700 ease-in-out" 
                                            src={product.imageUrl || 'https://images.unsplash.com/photo-1592078615290-033ee584e267?auto=format&fit=crop&q=80&w=800'} 
                                        />
                                        <div className="absolute top-4 left-4 bg-tertiary-container/90 backdrop-blur-md text-on-tertiary-container font-label text-xs uppercase tracking-widest px-3 py-1 rounded-full">
                                            {product.material || 'Solid Wood'}
                                        </div>
                                        <div className="absolute inset-0 bg-primary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-end justify-center pb-8">
                                            <Link to={`/products/${product.id}`} className="bg-surface/90 backdrop-blur-xl text-primary font-headline text-sm uppercase tracking-widest px-6 py-3 rounded-full shadow-2xl hover:bg-surface transition-colors duration-300">
                                                View Details
                                            </Link>
                                        </div>
                                    </div>
                                    <div className="flex flex-col px-2">
                                        <div className="flex items-start justify-between gap-2">
                                            <h2 className="font-headline text-2xl text-primary mb-1">{product.name}</h2>
                                            <button 
                                                onClick={() => {
                                                    wishlistService.toggle(product);
                                                    const updated = wishlistService.get().map(p => p.id);
                                                    setWishlistIds(updated);
                                                    toast.success(updated.includes(product.id) ? 'Added to wishlist' : 'Removed from wishlist');
                                                }}
                                                className={`p-2 rounded-full transition-colors ${wishlistIds.includes(product.id) ? 'text-primary' : 'text-on-surface-variant hover:text-primary'}`}
                                            >
                                                <span className={`material-symbols-outlined text-[20px] ${wishlistIds.includes(product.id) ? 'fill-1' : ''}`} style={{fontVariationSettings: wishlistIds.includes(product.id) ? "'FILL' 1" : "'FILL' 0"}}>
                                                    favorite
                                                </span>
                                            </button>
                                        </div>
                                        <p className="font-body text-sm text-on-surface-variant mb-4 line-clamp-1">{product.description}</p>
                                        <p className="font-body text-lg text-primary font-medium">{formatCurrency(product.price)}</p>
                                    </div>
                                </article>
                            ))}
                        </div>
                    )}

                    {!loading && filteredProducts.length > 0 && (
                        <div className="mt-24 flex justify-center">
                            <button className="bg-surface-container border border-outline-variant/15 text-primary font-headline text-lg tracking-wide px-12 py-4 rounded-xl hover:bg-surface-container-high transition-colors duration-300">
                                Load More Pieces
                            </button>
                        </div>
                    )}
                </section>
            </main>
        </>
    );
};

export default GalleryPage;
