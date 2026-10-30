export default function EndToEnd() {
  return (
    <div className="w-screen h-screen overflow-hidden relative bg-background text-foreground">
      <div className="absolute left-[6vw] top-[8vh] w-[38vw]">
        <div className="mb-[2.5vh] h-[0.8vh] w-[4vw] bg-accent" />
        <h1 className="font-display text-[3.8vw] font-semibold leading-[1.08] tracking-[-0.035em] text-balance">A service business, supported end to end</h1>
      </div>
      <div className="absolute inset-y-0 right-0 w-[52vw] bg-accent px-[5vw] py-[12vh] text-background">
        <div className="flex h-full flex-col justify-center gap-[4vh]">
          <p className="border-b border-background/30 pb-[3vh] font-body text-[2.05vw] font-medium leading-[1.25] text-pretty">Capture customer estimate requests</p>
          <p className="border-b border-background/30 pb-[3vh] font-body text-[2.05vw] font-medium leading-[1.25] text-pretty">Manage estimates, invoices, and jobs in one workflow</p>
          <p className="border-b border-background/30 pb-[3vh] font-body text-[2.05vw] font-medium leading-[1.25] text-pretty">Coordinate field teams and time entries</p>
          <p className="font-body text-[2.05vw] font-medium leading-[1.25] text-pretty">Give clients a place to follow estimates, invoices, and job status</p>
        </div>
      </div>
    </div>
  );
}
