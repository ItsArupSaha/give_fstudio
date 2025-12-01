import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";

export function Hero() {
  return (
    <section className="relative w-full h-[70vh] min-h-[500px] flex items-center justify-center text-center text-white">
      <Image
        src="/Govardhan.png"
        alt="A serene, beautiful landscape with a path leading towards a sunrise, symbolizing a spiritual journey."
        fill
        className="object-cover"
        priority
        data-ai-hint="spiritual landscape"
      />
      <div className="absolute inset-0 bg-black/50" />
      <div className="relative z-10 max-w-4xl mx-auto px-4 space-y-6">
        <h1 className="text-4xl md:text-6xl lg:text-7xl font-headline font-bold tracking-tight text-shadow-lg">
          Gaura-vāṇī Institute for Vaiṣṇava Education
        </h1>
        <p className="text-lg md:text-xl text-primary-foreground/90 max-w-2xl mx-auto text-shadow">
          Nurturing spiritual growth and understanding through the timeless wisdom of Vaiṣṇava teachings.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button asChild size="lg" className="transform transition-transform duration-300 hover:scale-105">
            <Link href="#courses">Explore Courses</Link>
          </Button>
          <Button asChild size="lg" variant="secondary" className="transform transition-transform duration-300 hover:scale-105">
            <Link href="/about/give">About Us</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
