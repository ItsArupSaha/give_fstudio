import { About } from "@/components/sections/about";
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
      <About />
      <QuoteCarousel />
      <Courses />
      <Testimonials />
      <Multimedia />
      <Faq />
    </>
  );
}
