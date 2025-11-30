import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';

export default function SrilaPrabhupadaPage() {
  const images = [
    PlaceHolderImages.find(p => p.id === 'prabhupada-1'),
    PlaceHolderImages.find(p => p.id === 'prabhupada-2'),
    PlaceHolderImages.find(p => p.id === 'prabhupada-3'),
  ];

  return (
    <div className="bg-background text-foreground">
      <div className="container max-w-screen-2xl py-16 md:py-24">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-3xl md:text-5xl font-headline font-bold">
              His Divine Grace A.C Bhaktivedānta Swāmi Prabhupāda
            </h1>
            <p className="mt-2 text-lg text-muted-foreground">
              Founder-Ācārya: International Society for Kṛṣṇa Consciousness (ISKCON)
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
            {images.map((img, index) => (
              <div key={index} className={`relative aspect-[3/4] rounded-lg overflow-hidden shadow-lg ${index === 1 ? 'md:col-span-1' : ''} ${index === 0 ? 'md:row-span-1' : ''} ${index === 2 ? 'md:row-span-1' : ''} hover:scale-105 transition-transform duration-300`}>
                {img && (
                  <Image
                    src={img.imageUrl}
                    alt={img.description}
                    fill
                    className="object-cover"
                    data-ai-hint={img.imageHint}
                  />
                )}
              </div>
            ))}
          </div>

          <div className="prose prose-lg max-w-none mx-auto text-foreground/80 space-y-6">
            <p>
              The International Society for Krishna Consciousness (ISKCON) is the spiritual institution founded by His Divine Grace A.C. Bhaktivedanta Swami Prabhupada in July 1966 as a continuation of the Brahma-Madhva-Gaudiya sampradaya. ISKCON was personally directed by its Founder-Acarya Srila Prabhupada until his departure on November 14, 1977. According to Srila Prabhupada’s will, ISKCON continued thereafter under the ultimate managing authority of the Governing Body Commission (GBC).
            </p>

            <h2 className="font-headline text-2xl font-bold text-foreground">The Seven Purposes of ISKCON</h2>
            <p>
              In ISKCON’s incorporating document, Srila Prabhupada imparts the “Seven Purposes of ISKCON”:
            </p>
            <ol className="list-decimal pl-5 space-y-4">
              <li>To systematically propagate spiritual knowledge to society at large and to educate all peoples in the techniques of spiritual life in order to check the imbalance of values in life and to achieve real unity and peace in the world.</li>
              <li>To propagate a consciousness of Krishna as it is revealed in the Bhagavad-gita and Srimad Bhagavatam.</li>
              <li>To bring the members of the Society together with each other and nearer to Krishna, the prime entity, and thus to develop the idea, within the members, and humanity, at large, that each soul is part and parcel of the quality of Godhead (Krishna).</li>
              <li>To teach and encourage the Sankirtan movement of congregational chanting of the holy name of God as revealed in the teachings of Lord Sri Chaitanya Mahaprabhu.</li>
              <li>To erect for the members, and for society at large, a holy place of transcendental pastimes, dedicated to the personality of Krishna.</li>
              <li>To bring the members closer together for the purpose of teaching a simpler and more natural way of life.</li>
              <li>With a view towards achieving the aforementioned purposes, to publish and distribute periodicals, magazines, books and other writings.</li>
            </ol>
            <p>
              Under Srila Prabhupada’s guidance, ISKCON has grown from a small group of disciples assembling in a New York City store front into an international society with scores of centers. At present, there are more than three-hundred ISKCON centers worldwide.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}