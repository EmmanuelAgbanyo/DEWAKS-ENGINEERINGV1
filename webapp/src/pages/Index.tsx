const Index = () => {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background">
      {/* Ambient background orbs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="floating-orb absolute left-1/4 top-1/3 h-96 w-96 bg-primary/20"
          style={{ animationDelay: "0s" }}
        />
        <div
          className="floating-orb absolute right-1/4 bottom-1/3 h-80 w-80 bg-accent/15"
          style={{ animationDelay: "2s" }}
        />
        <div
          className="floating-orb absolute left-1/2 top-1/4 h-64 w-64 bg-[hsl(262,80%,60%)]/10"
          style={{ animationDelay: "4s" }}
        />
      </div>

      {/* Subtle grid pattern */}
      <div className="pointer-events-none absolute inset-0 grid-pattern opacity-50" />

      {/* Main content */}
      <div className="relative z-10 text-center px-6 max-w-3xl animate-fade-in">
        {/* Logo/Brand mark */}
        <div className="mb-8 flex justify-center">
          <div className="relative h-16 w-16 rounded-2xl bg-gradient-to-br from-primary via-[hsl(340,75%,60%)] to-[hsl(262,80%,60%)] p-[1px] shadow-glow-md">
            <div className="flex h-full w-full items-center justify-center rounded-2xl bg-background">
              <span className="text-2xl font-bold text-gradient">D</span>
            </div>
          </div>
        </div>

        {/* Main heading with shimmer */}
        <h1
          className="font-display text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold leading-tight tracking-tightest animate-shimmer-sweep"
          style={{
            background:
              "linear-gradient(90deg, hsl(var(--foreground)) 0%, hsl(var(--foreground)) 35%, hsl(var(--primary)) 45%, hsl(var(--accent)) 55%, hsl(var(--foreground)) 65%, hsl(var(--foreground)) 100%)",
            backgroundSize: "200% 100%",
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            color: "transparent",
          }}
        >
          Welcome to Dewaks
        </h1>

        {/* Subtitle */}
        <p className="mt-6 text-lg sm:text-xl text-muted-foreground font-light leading-relaxed max-w-xl mx-auto">
          Premium engineering solutions crafted with precision and excellence.
        </p>

        {/* Decorative line */}
        <div className="mt-10 flex items-center justify-center gap-3">
          <div className="h-px w-12 bg-gradient-to-r from-transparent to-border" />
          <div className="h-2 w-2 rounded-full bg-primary animate-pulse-soft" />
          <div className="h-px w-12 bg-gradient-to-l from-transparent to-border" />
        </div>

        {/* Status indicator */}
        <div className="mt-8 inline-flex items-center gap-2 rounded-full border border-border/50 bg-secondary/30 px-4 py-2 text-sm text-muted-foreground backdrop-blur-sm">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-accent" />
          </span>
          Building something amazing...
        </div>
      </div>
    </div>
  );
};

export default Index;
