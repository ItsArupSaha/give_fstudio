import Image from "next/image";

export function Hero() {
  return (
    <section className="relative w-full h-[70vh] min-h-[500px] flex flex-col justify-between text-center text-white">
      <Image
        src="/Govardhan.png"
        alt="A serene, beautiful landscape with a path leading towards a sunrise, symbolizing a spiritual journey."
        fill
        className="object-cover"
        priority
        data-ai-hint="spiritual landscape"
      />
      <div className="absolute inset-0 bg-black/50" />
      {/* Top section - Title */}
      <div className="relative z-10 w-full px-4 pt-12 md:pt-16">
        <div className="max-w-screen-xl mx-auto">
          <h1 className="text-2xl md:text-4xl lg:text-5xl font-headline font-bold tracking-tight text-shadow-lg">
            Gaura-vāṇī Institute for Vaiṣṇava Education (GIVE)
          </h1>
        </div>
      </div>
      {/* Bottom section - Quote */}
      <div className="relative z-10 w-full px-4 pb-8 md:pb-12">
        <div className="max-w-3xl mx-auto space-y-2">
          <p className="text-lg md:text-xl text-white/95 text-shadow font-semibold">
            "Love of God is the highest perfection of life. This is our philosophy."
          </p>
          <p className="text-sm md:text-base text-right text-white/80 text-shadow">
            - Evening Darsana, August 11, 1976, Tehran
          </p>
        </div>
      </div>
    </section>
  );
}
