import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';

export function Prabhupada() {
  const prabhupadaImage = PlaceHolderImages.find(p => p.id === 'prabhupada-2');

  return (
    <section id="prabhupada" className="py-16 md:py-24 bg-secondary">
      <div className="container max-w-screen-md text-center">
        <div className="flex flex-col items-center">
          <h2 className="text-2xl md:text-3xl font-headline text-secondary-foreground/80 mb-6">
            Dedicated to the loving service of
          </h2>
          <div className="relative w-48 h-48 md:w-56 md:h-56 rounded-full overflow-hidden shadow-2xl mb-6 border-4 border-white">
            {prabhupadaImage && (
              <Image
                src={prabhupadaImage.imageUrl}
                alt={prabhupadaImage.description}
                fill
                className="object-cover object-top"
                data-ai-hint={prabhupadaImage.imageHint}
              />
            )}
          </div>
          <h1 className="text-3xl md:text-4xl font-headline font-bold text-secondary-foreground">
            His Divine Grace A.C Bhaktivedānta Swāmi Prabhupāda
          </h1>
          <p className="mt-2 text-lg text-secondary-foreground/80">
            Founder-Ācārya: International Society for Kṛṣṇa Consciousness (ISKCON)
          </p>
        </div>
      </div>
    </section>
  );
}
