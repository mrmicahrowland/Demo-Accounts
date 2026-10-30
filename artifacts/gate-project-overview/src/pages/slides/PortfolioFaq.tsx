const base = import.meta.env.BASE_URL;

export default function PortfolioFaq() {
  return (
    <div className="w-screen h-screen overflow-hidden relative bg-background text-foreground">
      <div className="absolute left-[6vw] top-[8vh]">
        <div className="mb-[2.5vh] h-[0.8vh] w-[4vw] bg-accent" />
        <h1 className="font-display text-[3.8vw] font-semibold leading-[1.08] tracking-[-0.035em]">Show the work. Answer questions.</h1>
      </div>
      <div className="absolute left-[6vw] top-[31vh] w-[43vw] space-y-[2.4vh]">
        <p className="border-l-[0.4vw] border-accent pl-[1.7vw] font-body text-[2vw] leading-[1.28] text-pretty">Portfolio gallery with residential, commercial, and access-control categories</p>
        <p className="border-l-[0.4vw] border-accent pl-[1.7vw] font-body text-[2vw] leading-[1.28] text-pretty">Project details with images and location information</p>
        <p className="border-l-[0.4vw] border-accent pl-[1.7vw] font-body text-[2vw] leading-[1.28] text-pretty">FAQ page with live search and category browsing</p>
        <p className="border-l-[0.4vw] border-accent pl-[1.7vw] font-body text-[2vw] leading-[1.28] text-pretty">Clear links to request an estimate or explore projects</p>
      </div>
      <div className="absolute right-[6vw] top-[31vh] h-[56vh] w-[42vw] overflow-hidden rounded-[0.9vw] border border-accent/55 bg-surface p-[0.45vw]">
        <img src={base + "images/faq-questions.jpg"} crossOrigin="anonymous" alt="FAQ questions grouped by category" className="h-full w-full rounded-[0.6vw] object-cover" />
      </div>
    </div>
  );
}
