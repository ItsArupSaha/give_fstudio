import { AnimatedSection } from '@/components/layout/animated-section';
import Image from 'next/image';

export default function JayapatakaSwamiPage() {
  return (
    <div className="bg-background text-foreground">
      <div className="container max-w-screen-2xl py-16 md:py-24">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-12 items-center">
          <div className="md:col-span-3 prose prose-lg max-w-none text-foreground/80 space-y-6">
            <AnimatedSection direction="left">
              <div>
                <h1 className="text-3xl md:text-4xl font-headline font-bold text-foreground mb-6">
                  His Holiness Jayapatākā Swami
                </h1>
                <p className='mb-6'>
                  My dear spiritual son Mani Gopal dasa,
                </p>
                <p>
                  Please accept my blessings. All glories to Srila Prabhupada. I am very glad to hear of your expansion into the teachings of these very important literatures. One thing I see is missing is the study of Srila Prabhupada's life and having some course on Srila Prabhupada as the founder-acarya of ISKCON. I think that would be something very important to have people recognize the great qualities of Srila Prabhupada and his contribution. Your idea of having Bhakti sastri for illiterate, so that they can hear the bhakti sastras and give oral exams, I think that is very important. We would like to establish that everybody understands Srila Prabhupada's books and teachings. I know this that some people after taking the courses they forget the subject matter because they don't use it. If you don't use it, you loose it. They should use the teachings that they have and give it in various ways to others. And this way their bhakti sastri and other sastra's knowledge will stick with them. Studying Srila Prabhupada's books is the shortcut to get Krsna-prema. Thank you very much. Hope this finds you and your good wife in good health and happy in Krsna consciousness.
                </p>
                <p className="font-bold mt-6">
                  Your well-wisher always
                  <br />
                  Jayapataka Swami
                </p>
              </div>
            </AnimatedSection>
          </div>
          <div className="md:col-span-2 flex justify-center md:justify-end">
            <AnimatedSection direction="right" delay={150}>
              <div className="relative">
                <div className="pointer-events-none absolute -inset-6 rounded-[2rem] bg-gradient-to-tr from-primary/45 via-primary/20 to-transparent opacity-75 blur-2xl" />
                <div className="relative rounded-3xl shadow-xl transition-transform duration-300 hover:scale-105">
                  <Image
                    src="/JayapatakaSwamiGM.jpg"
                    alt="His Holiness Jayapatākā Swami"
                    width={600}
                    height={800}
                    className="h-auto w-auto max-w-full rounded-xl"
                  />
                </div>
              </div>
            </AnimatedSection>
          </div>
        </div>
      </div>
    </div>
  );
}
