"use client";

import * as React from "react";
import Autoplay from "embla-carousel-autoplay";

import { Card, CardContent } from "@/components/ui/card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

const quotes = [
  {
    quote: "Religion without philosophy is sentiment, or sometimes fanaticism, while philosophy without religion is mental speculation.",
    author: "Srila Prabhupada",
  },
  {
    quote: "A grain of devotion is more valuable thank tons of faithlessness.",
    author: "Srila Prabhupada",
  },
  {
    quote: "To be controlled by the senses is to be a fool. To control the senses is to be a master.",
    author: "Srila Prabhupada",
  },
  {
    quote: "The purpose of human life is to inquire about the Absolute Truth.",
    author: "Srila Prabhupada",
  },
  {
    quote: "First-class religion is that which teaches you to love God. It doesn't matter what the name of the religion is.",
    author: "Srila Prabhupada",
  },
  {
    quote: "Books are the basis; purity is the force; preaching is the essence; utility is the principle.",
    author: "Srila Prabhupada",
  },
];

export function QuoteCarousel() {
  const plugin = React.useRef(
    Autoplay({ delay: 5000, stopOnInteraction: true })
  );

  return (
    <section className="py-16 md:py-24 bg-background">
      <div className="container max-w-screen-lg">
        <Carousel
          plugins={[plugin.current]}
          className="w-full"
          onMouseEnter={plugin.current.stop}
          onMouseLeave={plugin.current.reset}
          opts={{
            align: "start",
            loop: true,
          }}
        >
          <CarouselContent>
            {quotes.map((item, index) => (
              <CarouselItem key={index}>
                <div className="p-1">
                  <Card className="bg-transparent border-0 shadow-none">
                    <CardContent className="flex flex-col items-center justify-center p-6 text-center">
                      <p className="text-2xl md:text-3xl font-headline text-foreground/80 italic">
                        "{item.quote}"
                      </p>
                      <p className="mt-4 text-lg font-semibold text-primary">
                        — {item.author}
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className="hidden sm:flex" />
          <CarouselNext className="hidden sm:flex" />
        </Carousel>
      </div>
    </section>
  );
}
