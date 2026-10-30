export default function ClearPath() {
  return (
    <div className="w-screen h-screen overflow-hidden relative bg-background text-foreground">
      <div className="absolute inset-y-0 right-0 w-[28vw] bg-accent" />
      <div className="absolute inset-y-[12vh] right-[4vw] w-[19vw] gate-slat-dark opacity-80" />
      <div className="absolute left-[6vw] top-[10vh] h-[0.8vh] w-[5vw] bg-accent" />
      <div className="absolute left-[6vw] top-[17vh] w-[61vw]">
        <h1 className="font-display text-[4.25vw] font-semibold leading-[1.06] tracking-[-0.04em] text-balance">One clear path from request to completed work</h1>
      </div>
      <div className="absolute left-[6vw] top-[45vh] flex w-[58vw] flex-col gap-[2.2vh]">
        <p className="border-l-[0.35vw] border-accent pl-[1.6vw] font-body text-[2vw] leading-[1.25] text-pretty">Public pages help customers discover, learn, and request service</p>
        <p className="border-l-[0.35vw] border-accent pl-[1.6vw] font-body text-[2vw] leading-[1.25] text-pretty">The operations platform supports estimating, dispatch, and invoicing</p>
        <p className="border-l-[0.35vw] border-accent pl-[1.6vw] font-body text-[2vw] leading-[1.25] text-pretty">Role-specific views connect office teams, field crews, and clients</p>
        <p className="border-l-[0.35vw] border-accent pl-[1.6vw] font-body text-[2vw] leading-[1.25] text-pretty">Automatic Gate &amp; Entryways brings the customer journey and service workflow together</p>
      </div>
    </div>
  );
}
