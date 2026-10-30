export default function EstimateToField() {
  return (
    <div className="w-screen h-screen overflow-hidden relative bg-background text-foreground">
      <div className="absolute left-[6vw] top-[8vh]">
        <div className="mb-[2.5vh] h-[0.8vh] w-[4vw] bg-accent" />
        <h1 className="font-display text-[3.8vw] font-semibold leading-[1.08] tracking-[-0.035em]">From estimate to field work</h1>
      </div>
      <div className="absolute left-[8vw] top-[45vh] h-[0.55vh] w-[84vw] bg-accent/65" />
      <div className="absolute left-[7.5vw] top-[43.85vh] h-[2.8vh] w-[1.5vw] rounded-full bg-accent" />
      <div className="absolute left-[28.8vw] top-[43.85vh] h-[2.8vh] w-[1.5vw] rounded-full bg-accent" />
      <div className="absolute left-[50.1vw] top-[43.85vh] h-[2.8vh] w-[1.5vw] rounded-full bg-accent" />
      <div className="absolute left-[71.4vw] top-[43.85vh] h-[2.8vh] w-[1.5vw] rounded-full bg-accent" />
      <div className="absolute left-[6vw] top-[52vh] grid w-[88vw] grid-cols-4 gap-[3vw]">
        <p className="border-t border-accent/45 pt-[2.5vh] font-body text-[2vw] leading-[1.3] text-pretty">Review and manage incoming estimates</p>
        <p className="border-t border-accent/45 pt-[2.5vh] font-body text-[2vw] leading-[1.3] text-pretty">Convert an approved estimate into an invoice</p>
        <p className="border-t border-accent/45 pt-[2.5vh] font-body text-[2vw] leading-[1.3] text-pretty">Create and dispatch a job</p>
        <p className="border-t border-accent/45 pt-[2.5vh] font-body text-[2vw] leading-[1.3] text-pretty">Assign crew and record time on site</p>
      </div>
    </div>
  );
}
