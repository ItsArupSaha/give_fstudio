import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const testimonials = [
  {
    id: "testimonial-1",
    name: "Arjuna Dasa",
    role: "Bhagavad-gītā Student",
    quote: "The course transformed my understanding of life. The teachers are not just knowledgeable, but truly live the teachings. It has been a life-changing experience.",
    avatarId: 'avatar-1'
  },
  {
    id: "testimonial-2",
    name: "Radhika Devi Dasi",
    role: "Bhakti Sastri Graduate",
    quote: "I'm so grateful for the systematic and deep study provided by GIVE. It has given me the confidence and clarity to share this knowledge with others.",
    avatarId: 'avatar-2'
  },
  {
    id: "testimonial-3",
    name: "Krishna Sharma",
    role: "Introductory Course Attendee",
    quote: "As someone new to the philosophy, I felt completely welcomed. The concepts were explained with such patience and clarity. I can't wait to learn more!",
    avatarId: 'avatar-3'
  },
];

export function Testimonials() {
  return (
    <section id="testimonials" className="py-16 md:py-24 bg-background">
      <div className="container max-w-screen-2xl">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-3xl md:text-4xl font-headline font-bold">Words from Our Students</h2>
          <p className="mt-4 text-lg text-muted-foreground">
            See how studying at GIVE has impacted the lives of our community members.
          </p>
        </div>
        <Carousel
          opts={{
            align: 'start',
            loop: true,
          }}
          className="w-full max-w-4xl mx-auto"
        >
          <CarouselContent>
            {testimonials.map((testimonial) => {
              const avatarImage = PlaceHolderImages.find(p => p.id === testimonial.avatarId);
              return (
              <CarouselItem key={testimonial.id} className="md:basis-1/2 lg:basis-1/3">
                <div className="p-1 h-full">
                  <Card className="flex flex-col justify-between h-full p-6 shadow-md hover:shadow-xl transition-shadow duration-300">
                    <CardContent className="p-0 flex-grow">
                      <p className="italic text-muted-foreground">"{testimonial.quote}"</p>
                    </CardContent>
                    <div className="flex items-center gap-4 mt-6">
                      <Avatar>
                        {avatarImage && <AvatarImage src={avatarImage.imageUrl} alt={avatarImage.description} data-ai-hint={avatarImage.imageHint} />}
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
            )})}
          </CarouselContent>
          <CarouselPrevious />
          <CarouselNext />
        </Carousel>
      </div>
    </section>
  );
}
