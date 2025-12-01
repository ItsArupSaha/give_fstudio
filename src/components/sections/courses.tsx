import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { PlaceHolderImages } from '@/lib/placeholder-images';

const courses = [
  {
    id: "course-1",
    title: 'Bhagavad-gītā As It Is',
    description: 'An in-depth study of the foundational text of Vaiṣṇava philosophy, exploring its timeless wisdom and practical application.',
    imageId: 'course-1',
  },
  {
    id: "course-2",
    title: 'Śrī Īśopaniṣad',
    description: 'Uncover the esoteric truths of the Vedas in this essential Upanishad, revealing the nature of the Supreme Being.',
    imageId: 'course-2',
  },
  {
    id: "course-3",
    title: 'Bhakti-rasāmṛta-sindhu',
    description: 'Dive deep into the ocean of devotional service with this masterpiece by Rupa Goswami, outlining the science of bhakti-yoga.',
    imageId: 'course-3',
  },
];

export function Courses() {
  return (
    <section id="courses" className="py-16 md:py-24 bg-secondary">
      <div className="container max-w-screen-2xl">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-3xl md:text-4xl font-headline font-bold text-secondary-foreground">Our Courses</h2>
          <p className="mt-4 text-lg text-secondary-foreground/80">
            Deepen your understanding of Vaiṣṇava philosophy and practice with our structured courses.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {courses.map((course) => {
            const courseImage = PlaceHolderImages.find(p => p.id === course.imageId);
            return (
              <Card key={course.id} className="flex flex-col overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-2">
                {courseImage && (
                  <div className="relative h-48 w-full">
                    <Image
                      src={courseImage.imageUrl}
                      alt={courseImage.description}
                      fill
                      className="object-cover"
                      data-ai-hint={courseImage.imageHint}
                    />
                  </div>
                )}
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
            );
          })}
        </div>
      </div>
    </section>
  );
}
