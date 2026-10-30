const base = import.meta.env.BASE_URL;

export default function EstimateRequest() {
  return (
    <div className="w-screen h-screen overflow-hidden relative bg-background text-foreground">
      <div className="absolute left-[6vw] top-[8vh]">
        <div className="mb-[2.5vh] h-[0.8vh] w-[4vw] bg-accent" />
        <h1 className="font-display text-[3.8vw] font-semibold leading-[1.08] tracking-[-0.035em]">A guided estimate request</h1>
      </div>
      <div className="absolute left-[6vw] top-[30vh] flex h-[58vh] w-[88vw] items-center gap-[5vw]">
        <div className="relative w-[39vw] shrink-0 overflow-hidden rounded-[0.9vw] border border-accent/55 bg-surface p-[0.45vw]">
          <img src={base + "images/estimate-form.jpg"} crossOrigin="anonymous" alt="Estimate request form showing its four steps" className="block h-auto w-full rounded-[0.6vw]" />
        </div>
        <div className="flex h-full flex-col justify-center gap-[2.4vh]">
          <p className="border-b border-accent/40 pb-[1.8vh] font-body text-[2vw] leading-[1.28] text-pretty">Your info: name, email, and phone</p>
          <p className="border-b border-accent/40 pb-[1.8vh] font-body text-[2vw] leading-[1.28] text-pretty">Property: service address</p>
          <p className="border-b border-accent/40 pb-[1.8vh] font-body text-[2vw] leading-[1.28] text-pretty">Service: choose a gate type and describe the project</p>
          <p className="border-b border-accent/40 pb-[1.8vh] font-body text-[2vw] leading-[1.28] text-pretty">Review: confirm details and submit</p>
          <p className="font-body text-[2vw] leading-[1.28] text-pretty">The form discloses a $150 site visit fee and explains when it may be waived</p>
        </div>
      </div>
    </div>
  );
}
