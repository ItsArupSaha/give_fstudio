import { Prabhupada } from "@/components/sections/prabhupada";
import { Courses } from "@/components/sections/courses";
import { Faq } from "@/components/sections/faq";
import { Hero } from "@/components/sections/hero";
import { Multimedia } from "@/components/sections/multimedia";
import { QuoteCarousel } from "@/components/sections/quote-carousel";
import { Testimonials } from "@/components/sections/testimonials";

export default function Home() {
  return (
    <>
      <Hero />
      <Prabhupada />
      <QuoteCarousel />
      <Courses />
      <Testimonials />
      <Multimedia />
      <Faq />
    </>
  );
}
