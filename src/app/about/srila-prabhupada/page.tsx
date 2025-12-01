import { AnimatedSection } from '@/components/layout/animated-section';
import Image from 'next/image';

const images = [
  {
    id: 'prabhupada-1',
    src: 'https://picsum.photos/seed/prabhupada-1/600/800',
    alt: 'Black and white portrait of Srila Prabhupada.',
    hint: 'spiritual leader',
  },
  {
    id: 'prabhupada-2',
    src: 'https://picsum.photos/seed/prabhupada-2/600/800',
    alt: 'Srila Prabhupada smiling.',
    hint: 'elderly monk',
  },
  {
    id: 'prabhupada-3',
    src: 'https://picsum.photos/seed/prabhupada-3/600/800',
    alt: 'Srila Prabhupada writing at his desk.',
    hint: 'spiritual author',
  },
];

export default function SrilaPrabhupadaPage() {
  return (
    <div className="bg-background text-foreground">
      <div className="container max-w-screen-2xl py-16 md:py-24">
        <div className="max-w-4xl mx-auto">
          <AnimatedSection direction="up">
            <div className="text-center mb-12">
              <h1 className="text-3xl md:text-5xl font-headline font-bold">
                His Divine Grace A.C Bhaktivedānta Swāmi Prabhupāda
              </h1>
              <p className="mt-2 text-lg text-muted-foreground">
                Founder-Ācārya: International Society for Kṛṣṇa Consciousness (ISKCON)
              </p>
            </div>
          </AnimatedSection>

          <AnimatedSection direction="up" delay={120}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
              {images.map((img, index) => (
                <div
                  key={index}
                  className={`relative aspect-[3/4] rounded-lg overflow-hidden shadow-lg ${index === 1 ? 'md:col-span-1' : ''} ${
                    index === 0 ? 'md:row-span-1' : ''
                  } ${index === 2 ? 'md:row-span-1' : ''} hover:scale-105 transition-transform duration-300`}
                >
                  <Image
                    src={img.src}
                    alt={img.alt}
                    fill
                    className="object-cover"
                    data-ai-hint={img.hint}
                  />
                </div>
              ))}
            </div>
          </AnimatedSection>

          <AnimatedSection direction="up" delay={220}>
            <div className="prose prose-lg max-w-none mx-auto text-foreground/80 space-y-6">
              <p>
                The International Society for Krishna Consciousness (ISKCON) is the spiritual institution founded by His
                Divine Grace A.C. Bhaktivedanta Swami Prabhupada in July 1966 as a continuation of the
                Brahma-Madhva-Gaudiya sampradaya. ISKCON was personally directed by its Founder-Acarya Srila
                Prabhupada until his departure on November 14, 1977. According to Srila Prabhupada’s will, ISKCON
                continued thereafter under the ultimate managing authority of the Governing Body Commission (GBC).
              </p>
            </div>
          </AnimatedSection>
        </div>
      </div>
    </div>
  );
}
