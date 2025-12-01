import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import Image from 'next/image';

const courses = [
  {
    id: "course-1",
    title: 'Bhagavad-gītā As It Is',
    description: 'An in-depth study of the foundational text of Vaiṣṇava philosophy, exploring its timeless wisdom and practical application.',
    image: {
      src: 'https://picsum.photos/seed/course-1/600/400',
      alt: 'An ancient, beautifully illustrated manuscript of the Bhagavad-gita, open on a wooden table.',
      hint: 'ancient book',
    },
  },
  {
    id: "course-2",
    title: 'Śrī Īśopaniṣad',
    description: 'Uncover the esoteric truths of the Vedas in this essential Upanishad, revealing the nature of the Supreme Being.',
    image: {
      src: 'https://picsum.photos/seed/course-2/600/400',
      alt: 'A person meditating peacefully at dawn, with soft light illuminating their face.',
      hint: 'peaceful meditation',
    },
  },
  {
    id: "course-3",
    title: 'Bhakti-rasāmṛta-sindhu',
    description: 'Dive deep into the ocean of devotional service with this masterpiece by Rupa Goswami, outlining the science of bhakti-yoga.',
    image: {
      src: 'https://picsum.photos/seed/course-3/600/400',
      alt: 'A group of people sitting in a circle, engaged in a deep and friendly discussion.',
      hint: 'group discussion',
    },
  },
];

export function Courses() {
  return (
    <section
      id="courses"
      className="relative py-16 md:py-24 bg-gradient-to-b from-secondary via-secondary/95 to-background overflow-hidden"
    >
      <div className="relative container max-w-screen-2xl">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-3xl md:text-4xl font-headline font-bold text-secondary-foreground">Our Courses</h2>
          <p className="mt-4 text-lg text-secondary-foreground/80">
            Deepen your understanding of Vaiṣṇava philosophy and practice with our structured courses.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {courses.map((course) => (
            <Card key={course.id} className="flex flex-col overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-2">
              <div className="relative h-48 w-full">
                <Image
                  src={course.image.src}
                  alt={course.image.alt}
                  fill
                  className="object-cover"
                  data-ai-hint={course.image.hint}
                />
              </div>
              <CardHeader>
                <CardTitle className="font-headline text-xl">{course.title}</CardTitle>
              </CardHeader>
              <CardContent className="flex-grow">
                <CardDescription>{course.description}</CardDescription>
              </CardContent>
              <CardFooter>
                <Button className="w-full">Learn More & Register</Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
