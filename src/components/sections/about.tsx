import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';

export function About() {
  const aboutImage = PlaceHolderImages.find(p => p.id === "about-1");

  return (
    <section id="about" className="py-16 md:py-24 bg-secondary">
      <div className="container max-w-screen-2xl">
        <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-center">
          <div className="space-y-6 text-secondary-foreground">
            <h2 className="text-3xl md:text-4xl font-headline font-bold">About The Institute</h2>
            <div className="space-y-4 text-lg">
              <div>
                <h3 className="font-headline text-xl font-semibold mb-2">Our Mission</h3>
                <p className="text-secondary-foreground/80">
                  To provide accessible, authentic, and comprehensive education in Vaiṣṇava philosophy and culture, empowering individuals to lead spiritually fulfilling lives.
                </p>
              </div>
              <div>
                <h3 className="font-headline text-xl font-semibold mb-2">Our Vision</h3>
                <p className="text-secondary-foreground/80">
                  To be a global beacon of spiritual knowledge, fostering a community of sincere practitioners dedicated to personal growth and the welfare of all beings.
                </p>
              </div>
              <div>
                <h3 className="font-headline text-xl font-semibold mb-2">Our History</h3>
                <p className="text-secondary-foreground/80">
                  Founded in 2010, the Gaura-vāṇī Institute has grown from a small study circle to an international institution, sharing timeless wisdom with thousands of students worldwide.
                </p>
              </div>
            </div>
          </div>
          <div className="relative aspect-square md:aspect-[4/3] rounded-lg overflow-hidden shadow-xl">
            {aboutImage && (
              <Image
                src={aboutImage.imageUrl}
                alt={aboutImage.description}
                fill
                className="object-cover transform transition-transform duration-500 hover:scale-105"
                data-ai-hint={aboutImage.imageHint}
              />
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
