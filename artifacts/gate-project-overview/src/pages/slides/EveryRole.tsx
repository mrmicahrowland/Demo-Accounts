export default function EveryRole() {
  return (
    <div className="w-screen h-screen overflow-hidden relative bg-background text-foreground">
      <div className="absolute left-[6vw] top-[8vh]">
        <div className="mb-[2.5vh] h-[0.8vh] w-[4vw] bg-accent" />
        <h1 className="font-display text-[3.8vw] font-semibold leading-[1.08] tracking-[-0.035em]">The right experience for every role</h1>
      </div>
      <div className="absolute left-[6vw] top-[32vh] grid h-[55vh] w-[88vw] grid-cols-2 gap-x-[6vw] gap-y-[5vh]">
        <div className="border-t border-accent/50 pt-[2.4vh]">
          <p className="font-body text-[2.2vw] leading-[1.35] text-pretty"><span className="font-semibold text-accent">Admin:</span> full platform and team management</p>
        </div>
        <div className="border-t border-accent/50 pt-[2.4vh]">
          <p className="font-body text-[2.2vw] leading-[1.35] text-pretty"><span className="font-semibold text-accent">Manager:</span> estimates, invoices, jobs, and analytics</p>
        </div>
        <div className="border-t border-accent/50 pt-[2.4vh]">
          <p className="font-body text-[2.2vw] leading-[1.35] text-pretty"><span className="font-semibold text-accent">Supervisor and crew:</span> assigned jobs and time tracking</p>
        </div>
        <div className="border-t border-accent/50 pt-[2.4vh]">
          <p className="font-body text-[2.2vw] leading-[1.35] text-pretty"><span className="font-semibold text-accent">Client:</span> their estimates, invoices, and job status</p>
        </div>
      </div>
    </div>
  );
}
