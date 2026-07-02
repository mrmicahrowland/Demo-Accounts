import { useState } from "react";
import { useListPortfolioItems } from "@workspace/api-client-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogTitle,
} from "@/components/ui/dialog";
import {
  MapPin, Calendar, Star, ArrowRight,
  ChevronLeft, ChevronRight, SplitSquareHorizontal, Phone
} from "lucide-react";
import { cn } from "@/lib/utils";

const CATEGORIES: { value: string; label: string }[] = [
  { value: "all", label: "All Projects" },
  { value: "residential", label: "Residential" },
  { value: "commercial", label: "Commercial" },
  { value: "sliding_gate", label: "Sliding Gates" },
  { value: "single_gate", label: "Single Swing" },
  { value: "dual_gate", label: "Dual Swing" },
  { value: "access_control", label: "Access Control" },
  { value: "repair", label: "Repair" },
];

const PLACEHOLDER_IMAGES: Record<string, string> = {
  residential: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&q=80",
  sliding_gate: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80",
  single_gate: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&q=80",
  dual_gate: "https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800&q=80",
  commercial: "https://images.unsplash.com/photo-1486325212027-8081e485255e?w=800&q=80",
  access_control: "https://images.unsplash.com/photo-1558002038-1055e2dae1d7?w=800&q=80",
  repair: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800&q=80",
  default: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80",
};

function categoryLabel(cat: string) {
  return CATEGORIES.find(c => c.value === cat)?.label ?? cat.replace(/_/g, " ");
}

function getImage(item: {
  imageUrls?: string[] | null;
  afterImageUrl?: string | null;
  category?: string | null;
}) {
  if (item.afterImageUrl) return item.afterImageUrl;
  if (item.imageUrls && item.imageUrls.length > 0) return item.imageUrls[0];
  return PLACEHOLDER_IMAGES[item.category ?? "default"] ?? PLACEHOLDER_IMAGES.default;
}

type PortfolioItem = {
  id: number;
  title: string;
  description?: string | null;
  category: string;
  city?: string | null;
  state?: string | null;
  imageUrls?: string[] | null;
  beforeImageUrl?: string | null;
  afterImageUrl?: string | null;
  brands?: string[] | null;
  completedDate?: string | null;
  featured?: boolean | null;
};

function BeforeAfterSlider({ before, after }: { before: string; after: string }) {
  const [pos, setPos] = useState(50);
  const [dragging, setDragging] = useState(false);

  function handleMove(clientX: number, rect: DOMRect) {
    const pct = Math.min(100, Math.max(0, ((clientX - rect.left) / rect.width) * 100));
    setPos(pct);
  }

  return (
    <div
      className="relative w-full h-full select-none overflow-hidden cursor-col-resize"
      onMouseMove={e => dragging && handleMove(e.clientX, e.currentTarget.getBoundingClientRect())}
      onMouseUp={() => setDragging(false)}
      onMouseLeave={() => setDragging(false)}
      onTouchMove={e => {
        if (dragging) handleMove(e.touches[0].clientX, e.currentTarget.getBoundingClientRect());
      }}
      onTouchEnd={() => setDragging(false)}
    >
      <img src={after} alt="After" className="absolute inset-0 w-full h-full object-cover" />
      <div className="absolute inset-0 overflow-hidden" style={{ width: `${pos}%` }}>
        <img src={before} alt="Before" className="absolute inset-0 w-full h-full object-cover" />
      </div>
      <div
        className="absolute top-0 bottom-0 w-0.5 bg-white shadow-lg"
        style={{ left: `${pos}%` }}
        onMouseDown={() => setDragging(true)}
        onTouchStart={() => setDragging(true)}
      >
        <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 bg-white rounded-full shadow-xl flex items-center justify-center">
          <SplitSquareHorizontal size={14} className="text-gray-700" />
        </div>
      </div>
      <span className="absolute top-3 left-3 bg-black/60 text-white text-xs px-2 py-1 rounded font-medium">Before</span>
      <span className="absolute top-3 right-3 bg-black/60 text-white text-xs px-2 py-1 rounded font-medium">After</span>
    </div>
  );
}

function ProjectModal({ item, onClose }: { item: PortfolioItem; onClose: () => void }) {
  const images: string[] = [];
  if (item.imageUrls && item.imageUrls.length > 0) images.push(...item.imageUrls);
  else if (item.afterImageUrl) images.push(item.afterImageUrl);
  else images.push(PLACEHOLDER_IMAGES[item.category] ?? PLACEHOLDER_IMAGES.default);

  const [imgIdx, setImgIdx] = useState(0);
  const [showBA, setShowBA] = useState(false);
  const hasBA = !!(item.beforeImageUrl && item.afterImageUrl);

  return (
    <Dialog open onOpenChange={open => !open && onClose()}>
      <DialogContent className="max-w-3xl p-0 overflow-hidden rounded-2xl gap-0">
        <DialogTitle className="sr-only">{item.title}</DialogTitle>
        {/* Image area */}
        <div className="relative bg-black aspect-[16/9] w-full">
          {showBA && hasBA ? (
            <BeforeAfterSlider before={item.beforeImageUrl!} after={item.afterImageUrl!} />
          ) : (
            <img
              src={images[imgIdx]}
              alt={item.title}
              className="w-full h-full object-cover"
            />
          )}
          {/* Nav for multiple images */}
          {!showBA && images.length > 1 && (
            <>
              <button
                onClick={() => setImgIdx(i => Math.max(0, i - 1))}
                className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/80 text-white rounded-full p-2 transition"
                disabled={imgIdx === 0}
              >
                <ChevronLeft size={18} />
              </button>
              <button
                onClick={() => setImgIdx(i => Math.min(images.length - 1, i + 1))}
                className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/80 text-white rounded-full p-2 transition"
                disabled={imgIdx === images.length - 1}
              >
                <ChevronRight size={18} />
              </button>
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                {images.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setImgIdx(i)}
                    className={cn("w-1.5 h-1.5 rounded-full transition-colors", i === imgIdx ? "bg-white" : "bg-white/40")}
                  />
                ))}
              </div>
            </>
          )}
          {/* Before/After toggle */}
          {hasBA && (
            <button
              onClick={() => setShowBA(v => !v)}
              className={cn(
                "absolute top-3 right-3 flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full transition",
                showBA ? "bg-primary text-primary-foreground" : "bg-black/60 text-white hover:bg-black/80"
              )}
            >
              <SplitSquareHorizontal size={13} />
              {showBA ? "Viewing Before/After" : "Before / After"}
            </button>
          )}
          {item.featured && (
            <div className="absolute top-3 left-3 flex items-center gap-1 bg-[#C9A84C] text-black text-xs font-bold px-2.5 py-1 rounded-full">
              <Star size={11} fill="currentColor" /> Featured
            </div>
          )}
        </div>
        {/* Detail */}
        <div className="p-6 space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-serif font-bold">{item.title}</h2>
              <div className="flex items-center flex-wrap gap-3 mt-1.5 text-sm text-muted-foreground">
                <Badge variant="secondary" className="capitalize">{categoryLabel(item.category)}</Badge>
                {(item.city || item.state) && (
                  <span className="flex items-center gap-1">
                    <MapPin size={13} /> {[item.city, item.state].filter(Boolean).join(", ")}
                  </span>
                )}
                {item.completedDate && (
                  <span className="flex items-center gap-1">
                    <Calendar size={13} /> {item.completedDate}
                  </span>
                )}
              </div>
            </div>
          </div>
          {item.description && <p className="text-muted-foreground text-sm leading-relaxed">{item.description}</p>}
          {item.brands && item.brands.length > 0 && (
            <div>
              <p className="text-xs text-muted-foreground mb-1.5 font-medium uppercase tracking-wide">Equipment Used</p>
              <div className="flex flex-wrap gap-1.5">
                {item.brands.map(b => (
                  <span key={b} className="text-xs border border-border rounded px-2 py-0.5 bg-muted/40">{b}</span>
                ))}
              </div>
            </div>
          )}
          <Link href="/request-estimate">
            <Button className="w-full gap-2 mt-2">
              Request a Similar Project <ArrowRight size={14} />
            </Button>
          </Link>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function PortfolioPage() {
  const { data: items = [], isLoading } = useListPortfolioItems();
  const [activeCategory, setActiveCategory] = useState("all");
  const [selectedItem, setSelectedItem] = useState<PortfolioItem | null>(null);

  const filtered = activeCategory === "all"
    ? (items as PortfolioItem[])
    : (items as PortfolioItem[]).filter(i => i.category === activeCategory);

  const featured = filtered.filter(i => i.featured);
  const rest = filtered.filter(i => !i.featured);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-[#C9A84C] to-[#a0832a] rounded-lg flex items-center justify-center shadow-md">
              <span className="text-black font-bold text-sm font-serif">AG</span>
            </div>
            <div>
              <p className="font-semibold text-sm leading-tight">Automatic Gate & Entryways</p>
              <p className="text-xs text-muted-foreground">Project Portfolio</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <a href="tel:4045550100" className="hidden sm:flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition">
              <Phone size={13} /> (404) 555-0100
            </a>
            <Link href="/request-estimate">
              <Button size="sm" className="gap-1.5">
                Free Estimate <ArrowRight size={13} />
              </Button>
            </Link>
            <Link href="/login">
              <Button variant="outline" size="sm">Login</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <div className="bg-[#111111] text-white py-16 px-4">
        <div className="max-w-6xl mx-auto text-center space-y-4">
          <p className="text-[#C9A84C] text-sm font-medium tracking-widest uppercase">Our Work</p>
          <h1 className="text-4xl sm:text-5xl font-serif font-bold">Project Portfolio</h1>
          <p className="text-gray-400 text-lg max-w-xl mx-auto">
            Browse our completed gate installations across the Atlanta metro area. Every project is built to last and designed to impress.
          </p>
          <div className="flex flex-wrap justify-center gap-6 pt-4 text-sm text-gray-400">
            {[["500+", "Projects Completed"], ["12", "Years Experience"], ["60mi", "Service Radius"], ["4.9★", "Avg. Rating"]].map(([num, label]) => (
              <div key={label} className="text-center">
                <p className="text-2xl font-bold text-white">{num}</p>
                <p>{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="border-b border-border bg-card sticky top-16 z-10">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex gap-1 overflow-x-auto py-3 scrollbar-hide">
            {CATEGORIES.map(cat => (
              <button
                key={cat.value}
                onClick={() => setActiveCategory(cat.value)}
                className={cn(
                  "whitespace-nowrap px-4 py-1.5 rounded-full text-sm font-medium transition-colors flex-shrink-0",
                  activeCategory === cat.value
                    ? "bg-foreground text-background"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                )}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 py-10 space-y-10">
        {isLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-2xl bg-muted animate-pulse aspect-[4/3]" />
            ))}
          </div>
        )}

        {!isLoading && filtered.length === 0 && (
          <div className="text-center py-20 text-muted-foreground space-y-3">
            <p className="text-lg font-medium">No projects in this category yet.</p>
            <p className="text-sm">Check back soon or browse all projects.</p>
            <Button variant="outline" onClick={() => setActiveCategory("all")}>View All Projects</Button>
          </div>
        )}

        {/* Featured row */}
        {featured.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Star size={16} className="text-[#C9A84C]" fill="#C9A84C" />
              <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Featured Projects</h2>
            </div>
            <div className={cn(
              "grid gap-6",
              featured.length === 1 ? "grid-cols-1" : "grid-cols-1 sm:grid-cols-2"
            )}>
              {featured.map(item => (
                <ProjectCard key={item.id} item={item} large onClick={() => setSelectedItem(item)} />
              ))}
            </div>
          </div>
        )}

        {/* All/rest */}
        {rest.length > 0 && (
          <div className="space-y-4">
            {featured.length > 0 && (
              <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">More Projects</h2>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {rest.map(item => (
                <ProjectCard key={item.id} item={item} onClick={() => setSelectedItem(item)} />
              ))}
            </div>
          </div>
        )}

        {/* Bottom CTA */}
        {!isLoading && (
          <div className="mt-12 bg-[#111111] text-white rounded-2xl p-8 sm:p-12 text-center space-y-4">
            <h2 className="text-2xl sm:text-3xl font-serif font-bold">Ready to Start Your Project?</h2>
            <p className="text-gray-400 max-w-md mx-auto">
              Get a free estimate for your gate installation or repair. We'll visit your property and provide a detailed written quote.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
              <Link href="/request-estimate">
                <Button size="lg" className="gap-2 bg-[#C9A84C] hover:bg-[#b8943d] text-black font-semibold">
                  Request Free Estimate <ArrowRight size={16} />
                </Button>
              </Link>
              <a href="tel:4045550100">
                <Button size="lg" variant="outline" className="gap-2 border-white/20 text-white hover:bg-white/10">
                  <Phone size={16} /> Call (404) 555-0100
                </Button>
              </a>
            </div>
          </div>
        )}
      </div>

      {selectedItem && (
        <ProjectModal item={selectedItem} onClose={() => setSelectedItem(null)} />
      )}
    </div>
  );
}

function ProjectCard({
  item,
  large = false,
  onClick,
}: {
  item: PortfolioItem;
  large?: boolean;
  onClick: () => void;
}) {
  const img = getImage(item);
  const hasBA = !!(item.beforeImageUrl && item.afterImageUrl);

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group relative overflow-hidden rounded-2xl bg-card border border-border text-left transition-all hover:shadow-xl hover:-translate-y-0.5",
        large ? "aspect-[16/9]" : "aspect-[4/3]"
      )}
    >
      <img
        src={img}
        alt={item.title}
        className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        onError={e => {
          (e.target as HTMLImageElement).src = PLACEHOLDER_IMAGES.default;
        }}
      />
      {/* Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

      {/* Badges */}
      <div className="absolute top-3 left-3 flex gap-2">
        {item.featured && (
          <span className="flex items-center gap-1 bg-[#C9A84C] text-black text-xs font-bold px-2 py-0.5 rounded-full">
            <Star size={10} fill="currentColor" /> Featured
          </span>
        )}
        {hasBA && (
          <span className="flex items-center gap-1 bg-black/60 text-white text-xs px-2 py-0.5 rounded-full">
            <SplitSquareHorizontal size={10} /> Before/After
          </span>
        )}
      </div>

      {/* Info */}
      <div className="absolute bottom-0 inset-x-0 p-4 text-white">
        <p className="text-xs text-white/70 mb-0.5 capitalize">{categoryLabel(item.category)}</p>
        <p className="font-semibold leading-snug">{item.title}</p>
        <div className="flex items-center gap-3 mt-1 text-xs text-white/60">
          {(item.city || item.state) && (
            <span className="flex items-center gap-1">
              <MapPin size={11} /> {[item.city, item.state].filter(Boolean).join(", ")}
            </span>
          )}
          {item.completedDate && (
            <span className="flex items-center gap-1">
              <Calendar size={11} /> {item.completedDate}
            </span>
          )}
        </div>
      </div>

      {/* Hover view detail hint */}
      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
        <span className="bg-white/10 backdrop-blur-sm border border-white/20 text-white text-sm font-medium px-4 py-2 rounded-full">
          View Project →
        </span>
      </div>
    </button>
  );
}
