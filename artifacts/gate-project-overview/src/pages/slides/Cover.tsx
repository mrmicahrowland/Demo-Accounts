const base = import.meta.env.BASE_URL;

export default function Cover() {
  return (
    <div className="w-screen h-screen overflow-hidden relative bg-background text-foreground">
      <div className="absolute inset-y-0 right-0 w-[37vw] bg-accent/15" />
      <div className="absolute inset-y-[12vh] right-[5vw] w-[27vw] gate-slat-field opacity-80" />
      <div className="absolute left-[6vw] top-[22vh] h-[0.8vh] w-[5vw] bg-accent" />
      <div className="absolute left-[6vw] top-[30vh] w-[53vw]">
        <h1 className="font-display text-[5.2vw] font-semibold leading-[1.05] tracking-[-0.04em] text-foreground text-balance">Automatic Gate &amp; Entryways</h1>
        <p className="mt-[5vh] max-w-[47vw] font-body text-[2.15vw] leading-[1.35] text-foreground/80 text-pretty">One connected platform for gate projects, from the first request through field work and invoicing.</p>
      </div>
      <div className="absolute bottom-[9vh] left-[6vw] h-[0.5vh] w-[14vw] bg-accent/60" />
    </div>
  );
}
