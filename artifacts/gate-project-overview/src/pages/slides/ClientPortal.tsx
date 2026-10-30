export default function ClientPortal() {
  return (
    <div className="w-screen h-screen overflow-hidden relative bg-background text-foreground">
      <div className="absolute left-[6vw] top-[8vh] w-[38vw]">
        <div className="mb-[2.5vh] h-[0.8vh] w-[4vw] bg-accent" />
        <h1 className="font-display text-[3.8vw] font-semibold leading-[1.08] tracking-[-0.035em] text-balance">A client portal for the next steps</h1>
      </div>
      <div className="absolute inset-y-0 right-0 w-[52vw] bg-accent px-[5vw] py-[9vh] text-background">
        <div className="flex h-full flex-col justify-center gap-[3.5vh]">
          <p className="border-b border-background/30 pb-[2.7vh] font-body text-[2.05vw] font-medium leading-[1.28] text-pretty">Clients can review their own estimates and invoices</p>
          <p className="border-b border-background/30 pb-[2.7vh] font-body text-[2.05vw] font-medium leading-[1.28] text-pretty">Job status is available in one place</p>
          <p className="border-b border-background/30 pb-[2.7vh] font-body text-[2.05vw] font-medium leading-[1.28] text-pretty">Staff workflows connect the request to scheduling and service</p>
          <p className="font-body text-[2.05vw] font-medium leading-[1.28] text-pretty">Role-based access keeps each experience focused</p>
        </div>
      </div>
    </div>
  );
}
