import Image from 'next/image';

export function Prabhupada() {
  return (
    <section
      id="prabhupada"
      className="relative py-16 md:py-24 bg-gradient-to-b from-secondary via-secondary/95 to-background overflow-hidden"
    >
      {/* soft decorative background glows */}
      <div className="pointer-events-none absolute -top-24 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-primary/25 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 right-0 h-72 w-72 translate-x-1/4 translate-y-1/4 rounded-full bg-primary/15 blur-3xl" />

      <div className="relative container max-w-screen-md text-center">
        <div className="flex flex-col items-center">
          <h2 className="text-2xl md:text-3xl font-headline text-secondary-foreground/80 mb-6">
            Dedicated to the loving service of
          </h2>
          <div className="relative w-48 h-48 md:w-56 md:h-56 rounded-full overflow-hidden shadow-2xl mb-6 border-4 border-white">
            <Image
              src="/SP_1.png"
              alt="Srila Prabhupada smiling."
              fill
              className="object-cover object-top"
              data-ai-hint="elderly monk"
            />
          </div>
          <h1 className="text-3xl md:text-4xl font-headline font-bold text-secondary-foreground">
            His Divine Grace A.C Bhaktivedānta Swāmi Prabhupāda
          </h1>
          <p className="mt-2 text-lg text-secondary-foreground/80">
            Founder-Ācārya: International Society for Kṛṣṇa Consciousness (ISKCON)
          </p>
        </div>
      </div>
    </section>
  );
}
