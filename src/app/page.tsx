import { Courses } from "@/components/sections/courses";
import { Faq } from "@/components/sections/faq";
import { Hero } from "@/components/sections/hero";
import { Multimedia } from "@/components/sections/multimedia";
import { Testimonials } from "@/components/sections/testimonials";

export default function Home() {
  return (
    <>
      <Hero />
      <Courses />
      <Testimonials />
      <Multimedia />
      <Faq />
    </>
  );
}
