"use client";

import Autoplay from "embla-carousel-autoplay";
import * as React from "react";

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
    <section className="relative py-16 md:py-24 bg-gradient-to-b from-muted/95 via-muted to-background border-t border-border/40 overflow-hidden">
      {/* subtle background accents, distinct band after Prabhupada section */}
      <div className="pointer-events-none absolute -top-24 left-0 h-64 w-64 -translate-x-1/3 rounded-full bg-primary/5 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 right-0 h-72 w-72 translate-x-1/3 translate-y-1/4 rounded-full bg-primary/10 blur-3xl" />

      <div className="relative container max-w-screen-2xl">
        <div className="mb-10 text-center">
          <h2 className="text-3xl md:text-4xl font-headline font-bold text-secondary-foreground">
            Ācārya Vākya
          </h2>
        </div>
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
              <CarouselItem key={index} className="md:basis-1/2 lg:basis-1/3">
                <div className="p-2 h-full">
                  <Card className="h-full flex flex-col justify-center bg-card shadow-sm hover:shadow-lg transition-shadow duration-300">
                    <CardContent className="flex flex-col items-center justify-center p-6 text-center">
                      <p className="text-lg font-body text-card-foreground/80 italic flex-grow">
                        "{item.quote}"
                      </p>
                      <p className="mt-4 text-base font-semibold text-primary">
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
