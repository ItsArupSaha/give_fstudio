import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';

export default function GivePage() {
  const giveImage = PlaceHolderImages.find(p => p.id === 'give-1');

  return (
    <div className="bg-background text-foreground">
      <div className="container max-w-screen-2xl py-16 md:py-24">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-12 items-start">
          <div className="md:col-span-3 prose prose-lg max-w-none text-foreground/80 space-y-6">
            <h1 className="text-3xl md:text-4xl font-headline font-bold text-foreground">HG Mani Gopal Das</h1>
            <p>
              Born to a religious family, originally hailing from Barrackpore, North Calcutta; Mani Gopal Das came in contact with Krishna consciousness in 1992 by the inspiration of his parents. He started to give classes on Bhagavad Gita when he was only eight. He received spiritual initiation, at the age of eleven, in January 1997 in the line of Brahma-Madhva-Gaudiya parampara from His Holiness Jayapataka Swami Maharaja, a dedicated disciple of HDG A.C Bhaktivedanta Swami Prabhupada, the Founder-Acarya of International Society for Krishna Consciousness.
            </p>
            <p>
              Academically, he holds a master’s degree in International Relations from a renowned university. He completed Bhakti Sastri, Bhakti Vaibhava, Bhakti Vedanta, TTC 1 and 2, BSTTC, IDCTTC and Spiritual Leadership Course. He is also qualified in the deity worship training and yajna samskara courses. Mani Gopal Das got many years of experience in the field of youth preaching in different colleges and universities, delivering speeches in various educational institutions and organisations on the teachings of Bhagavad Gita and other ancient Vedic literatures. He is an accomplished congregational preacher as well, who counselled numerous grihasthas in Krishna conscious family life. What made him truly distinct is his uncompromising yet pragmatic approach in presenting Krishna consciousness based on Srila Prabhupada’s teachings. He is well-known amidst his preaching circle mainly for his strong adherence and unwavering allegiance to the teachings of Srila Prabhupada and traditional vaisnava culture and yet caring personal demeanor. He is an adept sastric teacher for presenting the philosophy in unadulterated yet heart-touching way.
            </p>
            <p>
              Being an avid reader and captivating speaker of Gaura-lila, Mani Gopal Das, instructed by his spiritual masters, has been extensively traveling and giving lectures and seminars, in home and abroad, on the transcendental pastimes of Lord Caitanya and His dear associates. He is especially learned in Sri Caitanya Bhagavat and Sri Caitanya Caritamrita, narrating the transcendental pastimes of Lord Caitanya Mahāprabhu and His intimate associates and the places of their pastimes (gauda-mandala-bhumi). His zeal as well as exceptional skill, added with devotional emotion, in explaining the subtlety of Lord Gauranga’s pastimes, with relevant philosophical context, is deeply absorbing. He regularly conducts Bhakti Sastri, ISKCON Disciples Course; Vaisnava Culture and Sadacara Course and other courses which provides a fundamental stronghold in devotional life.
            </p>
            <p>
              Currently he is serving at the office of his spiritual master in Sridham Mayapur as well as teaching sastric courses in different places through online and onsite. With his spiritual master’s blessings, he is heading the Gaura-vāṇī Institute for Vaiṣṇava Education, affiliated to ISKCON Ministry of Education and an authorised exam center under ISKCON Board of Examinations. Additionally, he is one of the core admin members in the globally renowned online repository of Srila Prabhupada’s teachings – Vanipedia; Prabhupada Network Team (Mayapur) and member of ISKCON Teachers’ Board in Ministry of Education, ISKCON.
            </p>
          </div>
          <div className="md:col-span-2 relative aspect-[3/4] rounded-lg overflow-hidden shadow-lg transition-transform duration-300 hover:scale-105">
            {giveImage && (
              <Image
                src={giveImage.imageUrl}
                alt={giveImage.description}
                fill
                className="object-cover"
                data-ai-hint={giveImage.imageHint}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
