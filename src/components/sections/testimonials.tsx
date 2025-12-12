"use client";

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import type { Testimonial } from '@/lib/models/testimonial';
import { subscribeTestimonials } from '@/lib/services/firestore';
import Autoplay from 'embla-carousel-autoplay';
import { Loader2, User } from 'lucide-react';
import React from 'react';

export function Testimonials() {
  const [testimonials, setTestimonials] = React.useState<Testimonial[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const unsubscribe = subscribeTestimonials(
      (testimonialsList) => {
        setTestimonials(testimonialsList);
        setLoading(false);
      },
      (error) => {
        console.error("Error subscribing to testimonials:", error);
        setTestimonials([]);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const autoplayPlugin = React.useRef(
    Autoplay({
      delay: 3000,
      stopOnInteraction: true,
      stopOnMouseEnter: true,
    })
  );

  return (
    <section
      id="testimonials"
      className="relative py-16 md:py-24 bg-gradient-to-b from-muted/95 via-muted to-background border-t border-border/40 overflow-hidden"
    >
      <div className="relative container max-w-screen-2xl">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-3xl md:text-4xl font-headline font-bold">Words of Gratitude</h2>
          <p className="mt-4 text-lg text-muted-foreground">
            See how studying at GIVE has impacted the lives of our community members.
          </p>
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : testimonials.length === 0 ? (
          <Card className="max-w-2xl mx-auto">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <User className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground text-center">
                Nothing is added yet.
              </p>
            </CardContent>
          </Card>
        ) : (
          <Carousel
            plugins={[autoplayPlugin.current]}
            opts={{
              align: 'start',
              loop: testimonials.length > 1,
            }}
            className="w-full max-w-4xl mx-auto"
          >
            <CarouselContent>
              {testimonials.map((testimonial) => (
                <CarouselItem key={testimonial.id} className="md:basis-1/2 lg:basis-1/3">
                  <div className="p-1 h-full">
                    <Card className="flex flex-col justify-between h-full p-6 shadow-md hover:shadow-xl transition-shadow duration-300">
                      <CardContent className="p-0 flex-grow">
                        <p className="italic text-muted-foreground">"{testimonial.quote}"</p>
                      </CardContent>
                      <div className="flex items-center gap-4 mt-6">
                        <Avatar>
                          <AvatarImage
                            src={testimonial.avatarUrl}
                            alt={`${testimonial.name}'s profile picture`}
                          />
                          <AvatarFallback>{testimonial.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-semibold font-headline">{testimonial.name}</p>
                          <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                        </div>
                      </div>
                    </Card>
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious />
            <CarouselNext />
          </Carousel>
        )}
      </div>
    </section>
  );
}
