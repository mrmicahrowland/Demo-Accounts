import { useState, useMemo } from "react";
import { useListFaqs } from "@workspace/api-client-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  Search, ChevronDown, Phone, Mail, ArrowRight,
  MessageSquare, Shield, Clock, Wrench, DollarSign, Zap,
} from "lucide-react";

const CATEGORY_META: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  general:      { label: "General",          icon: <MessageSquare size={15} />, color: "text-blue-500" },
  pricing:      { label: "Pricing & Costs",  icon: <DollarSign size={15} />,    color: "text-green-500" },
  installation: { label: "Installation",     icon: <Wrench size={15} />,        color: "text-orange-500" },
  maintenance:  { label: "Maintenance",      icon: <Shield size={15} />,        color: "text-purple-500" },
  service:      { label: "Service & Repair", icon: <Zap size={15} />,           color: "text-red-500" },
  timeline:     { label: "Timelines",        icon: <Clock size={15} />,         color: "text-cyan-500" },
};

function getCategoryMeta(cat: string) {
  return CATEGORY_META[cat] ?? { label: cat.replace(/_/g, " "), icon: <MessageSquare size={15} />, color: "text-muted-foreground" };
}

type FaqItem = { id: number; question: string; answer: string; category: string; sortOrder: number };

function AccordionItem({ faq, isOpen, onToggle }: {
  faq: FaqItem;
  isOpen: boolean;
  onToggle: () => void;
}) {
  const meta = getCategoryMeta(faq.category);
  return (
    <div className={cn(
      "border border-border rounded-xl overflow-hidden transition-shadow",
      isOpen && "shadow-md"
    )}>
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-start gap-4 p-5 text-left hover:bg-accent/30 transition-colors"
      >
        <span className={cn("mt-0.5 flex-shrink-0", meta.color)}>{meta.icon}</span>
        <span className="flex-1 font-medium leading-snug">{faq.question}</span>
        <ChevronDown
          size={18}
          className={cn(
            "flex-shrink-0 mt-0.5 text-muted-foreground transition-transform duration-200",
            isOpen && "rotate-180"
          )}
        />
      </button>
      <div className={cn(
        "grid transition-all duration-200",
        isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
      )}>
        <div className="overflow-hidden">
          <div className="px-5 pb-5 pl-14 text-muted-foreground text-sm leading-relaxed">
            {faq.answer}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function FaqPage() {
  const { data: faqs = [], isLoading } = useListFaqs();
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [openId, setOpenId] = useState<number | null>(null);

  const categories = useMemo(() => {
    const seen = new Set<string>();
    (faqs as FaqItem[]).forEach(f => seen.add(f.category));
    return Array.from(seen);
  }, [faqs]);

  const filtered = useMemo(() => {
    let items = faqs as FaqItem[];
    if (activeCategory !== "all") items = items.filter(f => f.category === activeCategory);
    if (search.trim()) {
      const q = search.toLowerCase();
      items = items.filter(f =>
        f.question.toLowerCase().includes(q) || f.answer.toLowerCase().includes(q)
      );
    }
    return items;
  }, [faqs, activeCategory, search]);

  // Group by category for display
  const grouped = useMemo(() => {
    const map = new Map<string, FaqItem[]>();
    filtered.forEach(f => {
      if (!map.has(f.category)) map.set(f.category, []);
      map.get(f.category)!.push(f);
    });
    return map;
  }, [filtered]);

  const toggle = (id: number) => setOpenId(prev => prev === id ? null : id);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-[#C9A84C] to-[#a0832a] rounded-lg flex items-center justify-center shadow-md">
              <span className="text-black font-bold text-sm font-serif">AG</span>
            </div>
            <div>
              <p className="font-semibold text-sm leading-tight">Automatic Gate & Entryways</p>
              <p className="text-xs text-muted-foreground">Frequently Asked Questions</p>
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
        <div className="max-w-5xl mx-auto text-center space-y-5">
          <p className="text-[#C9A84C] text-sm font-medium tracking-widest uppercase">Support</p>
          <h1 className="text-4xl sm:text-5xl font-serif font-bold">Frequently Asked Questions</h1>
          <p className="text-gray-400 text-lg max-w-xl mx-auto">
            Everything you need to know about our gate installation, repair, and service process.
          </p>

          {/* Search */}
          <div className="max-w-lg mx-auto relative mt-6">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={e => { setSearch(e.target.value); setOpenId(null); }}
              placeholder="Search questions…"
              className="w-full bg-white/10 border border-white/20 rounded-xl pl-11 pr-4 py-3 text-white placeholder:text-gray-500 focus:outline-none focus:border-[#C9A84C] focus:ring-1 focus:ring-[#C9A84C] transition text-sm"
            />
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-10">
        <div className="grid lg:grid-cols-4 gap-8">
          {/* Sidebar: category filter */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-1">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3 px-2">Categories</p>
              <button
                onClick={() => { setActiveCategory("all"); setOpenId(null); }}
                className={cn(
                  "w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors text-left",
                  activeCategory === "all"
                    ? "bg-foreground text-background"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                )}
              >
                <MessageSquare size={14} />
                All Questions
                <span className="ml-auto text-xs opacity-60">{(faqs as FaqItem[]).length}</span>
              </button>
              {categories.map(cat => {
                const meta = getCategoryMeta(cat);
                const count = (faqs as FaqItem[]).filter(f => f.category === cat).length;
                return (
                  <button
                    key={cat}
                    onClick={() => { setActiveCategory(cat); setOpenId(null); }}
                    className={cn(
                      "w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors text-left",
                      activeCategory === cat
                        ? "bg-foreground text-background"
                        : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                    )}
                  >
                    <span className={cn(activeCategory === cat ? "text-inherit" : meta.color)}>
                      {meta.icon}
                    </span>
                    <span className="capitalize">{meta.label}</span>
                    <span className="ml-auto text-xs opacity-60">{count}</span>
                  </button>
                );
              })}

              {/* Contact box */}
              <div className="mt-6 border border-border rounded-xl p-4 bg-card space-y-3">
                <p className="font-semibold text-sm">Still have questions?</p>
                <p className="text-xs text-muted-foreground">Our team is available Mon–Fri 7am–7pm.</p>
                <a href="tel:4045550100" className="flex items-center gap-2 text-sm text-primary hover:underline font-medium">
                  <Phone size={13} /> (404) 555-0100
                </a>
                <a href="mailto:info@automaticgate.com" className="flex items-center gap-2 text-sm text-primary hover:underline font-medium">
                  <Mail size={13} /> info@automaticgate.com
                </a>
                <Link href="/request-estimate">
                  <Button size="sm" className="w-full mt-1 gap-1.5">
                    Request Estimate <ArrowRight size={12} />
                  </Button>
                </Link>
              </div>
            </div>
          </div>

          {/* Main: FAQ accordion */}
          <div className="lg:col-span-3 space-y-8">
            {isLoading && (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-16 rounded-xl bg-muted animate-pulse" />
                ))}
              </div>
            )}

            {!isLoading && filtered.length === 0 && (
              <div className="text-center py-16 space-y-3">
                <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mx-auto">
                  <Search size={22} className="text-muted-foreground" />
                </div>
                <p className="font-medium">No results found</p>
                <p className="text-sm text-muted-foreground">
                  {search ? `No questions match "${search}". Try different keywords.` : "No questions in this category yet."}
                </p>
                {search && (
                  <Button variant="outline" size="sm" onClick={() => setSearch("")}>Clear search</Button>
                )}
              </div>
            )}

            {/* Show flat list when searching, grouped by category otherwise */}
            {!isLoading && filtered.length > 0 && search.trim() && (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  {filtered.length} result{filtered.length !== 1 ? "s" : ""} for "{search}"
                </p>
                {filtered.map(faq => (
                  <AccordionItem
                    key={faq.id}
                    faq={faq}
                    isOpen={openId === faq.id}
                    onToggle={() => toggle(faq.id)}
                  />
                ))}
              </div>
            )}

            {!isLoading && filtered.length > 0 && !search.trim() && (
              Array.from(grouped.entries()).map(([cat, items]) => {
                const meta = getCategoryMeta(cat);
                return (
                  <div key={cat} className="space-y-3">
                    <div className="flex items-center gap-2 pb-1 border-b border-border">
                      <span className={meta.color}>{meta.icon}</span>
                      <h2 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">{meta.label}</h2>
                      <span className="text-xs text-muted-foreground ml-1">({items.length})</span>
                    </div>
                    {items.map(faq => (
                      <AccordionItem
                        key={faq.id}
                        faq={faq}
                        isOpen={openId === faq.id}
                        onToggle={() => toggle(faq.id)}
                      />
                    ))}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Bottom CTA */}
        {!isLoading && (
          <div className="mt-16 bg-[#111111] text-white rounded-2xl p-8 sm:p-12 text-center space-y-4">
            <h2 className="text-2xl sm:text-3xl font-serif font-bold">Ready to Get Started?</h2>
            <p className="text-gray-400 max-w-md mx-auto">
              Request a free site visit and written estimate. Our team will contact you within 1 business day.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
              <Link href="/request-estimate">
                <Button size="lg" className="gap-2 bg-[#C9A84C] hover:bg-[#b8943d] text-black font-semibold">
                  Request Free Estimate <ArrowRight size={16} />
                </Button>
              </Link>
              <Link href="/portfolio">
                <Button size="lg" variant="outline" className="gap-2 border-white/20 text-white hover:bg-white/10">
                  View Our Work
                </Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
