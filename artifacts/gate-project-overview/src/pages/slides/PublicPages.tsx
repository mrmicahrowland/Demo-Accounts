export default function PublicPages() {
  return (
    <div className="w-screen h-screen overflow-hidden relative bg-background text-foreground">
      <div className="absolute left-[6vw] top-[8vh]">
        <div className="mb-[2.5vh] h-[0.8vh] w-[4vw] bg-accent" />
        <h1 className="font-display text-[3.8vw] font-semibold leading-[1.08] tracking-[-0.035em]">A public front door for customers</h1>
      </div>
      <div className="absolute left-[6vw] top-[32vh] grid h-[56vh] w-[88vw] grid-cols-2 gap-x-[8vw] gap-y-[5vh]">
        <div className="border-l-[0.45vw] border-accent pl-[2vw] pt-[1vh]">
          <p className="font-body text-[2.3vw] font-medium leading-[1.3] text-pretty">Request an estimate without signing in</p>
        </div>
        <div className="border-l-[0.45vw] border-accent pl-[2vw] pt-[1vh]">
          <p className="font-body text-[2.3vw] font-medium leading-[1.3] text-pretty">Browse completed gate projects</p>
        </div>
        <div className="border-l-[0.45vw] border-accent pl-[2vw] pt-[1vh]">
          <p className="font-body text-[2.3vw] font-medium leading-[1.3] text-pretty">Search common questions before reaching out</p>
        </div>
        <div className="border-l-[0.45vw] border-accent pl-[2vw] pt-[1vh]">
          <p className="font-body text-[2.3vw] font-medium leading-[1.3] text-pretty">Continue to the client portal to track a request</p>
        </div>
      </div>
    </div>
  );
}
