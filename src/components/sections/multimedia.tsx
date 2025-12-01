import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen, Mic, Video } from 'lucide-react';
import Link from 'next/link';

const resources = [
  {
    title: 'Video Lectures',
    description: 'Watch recorded classes and seminars from our esteemed faculty on our YouTube channel.',
    href: '#',
    icon: <Video className="h-8 w-8 text-primary" />,
  },
  {
    title: 'Audio Classes',
    description: 'Listen to lectures and kirtans on the go. Available on all major podcast platforms.',
    href: '#',
    icon: <Mic className="h-8 w-8 text-primary" />,
  },
  {
    title: 'Reading Materials',
    description: 'Explore our library of articles, essays, and translations of important Vaiṣṇava texts.',
    href: '#',
    icon: <BookOpen className="h-8 w-8 text-primary" />,
  },
];

export function Multimedia() {
  return (
    <section
      id="resources"
      className="relative py-16 md:py-24 bg-gradient-to-b from-secondary via-secondary/95 to-background overflow-hidden"
    >
      <div className="relative container max-w-screen-2xl">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-3xl md:text-4xl font-headline font-bold text-secondary-foreground">Explore Our Resources</h2>
          <p className="mt-4 text-lg text-secondary-foreground/80">
            Access a wealth of knowledge through our multimedia channels.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {resources.map((resource) => (
            <Link key={resource.title} href={resource.href} target="_blank" rel="noopener noreferrer">
              <Card className="h-full text-center transition-all duration-300 hover:shadow-xl hover:-translate-y-2">
                <CardHeader className="items-center">
                  {resource.icon}
                  <CardTitle className="font-headline mt-4 text-xl">{resource.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{resource.description}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
