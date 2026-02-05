const DIET_LABELS = {
  veg: "Veg",
  nonveg: "Non-Veg",
  vegan: "Vegan",
  gluten_free: "Gluten-Free"
};

export default function MenuItem({ item, onAdd, badge }) {
  const initials = item.name
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  return (
    <article className="flex h-full flex-col justify-between rounded-3xl glass p-6 shadow-lg fade-up">
      <div className="flex flex-wrap gap-4">
        <div className="relative h-28 w-28 flex-shrink-0 overflow-hidden rounded-2xl menu-image">
          {item.image_url ? (
            <img
              src={item.image_url}
              alt={item.name}
              className="h-full w-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-lg font-semibold text-white">
              {initials}
            </div>
          )}
          {badge && (
            <div className="absolute left-2 top-2 rounded-full bg-white/90 px-2 py-1 text-[10px] font-semibold text-amber-600">
              {badge}
            </div>
          )}
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold text-slate-900">{item.name}</h3>
            <span className="rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-white">
              ${item.price.toFixed(2)}
            </span>
          </div>
          <p className="mt-2 text-sm text-slate-600">{item.description}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {item.diet_tag && (
              <span className="brand-chip">
                {DIET_LABELS[item.diet_tag] || item.diet_tag}
              </span>
            )}
            <span className="brand-pill">House Favorite</span>
          </div>
        </div>
      </div>
      <button
        className="mt-6 rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:border-teal-200 hover:bg-teal-50"
        onClick={onAdd}
      >
        Add to cart
      </button>
    </article>
  );
}
