import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Globe, Linkedin, Mail, MapPin, Phone } from "lucide-react";
import Link from "next/link";

export default function Footer() {
  return (
    <footer
      id="contact"
      className="w-full bg-gradient-to-b from-muted/95 via-muted to-background border-t border-border/40 text-secondary-foreground py-12 md:py-16"
    >
      <div className="container max-w-screen-2xl grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
        <div className="space-y-4">
          <h3 className="text-2xl font-headline font-bold">Gaura-vāṇī Institute</h3>
          <p className="text-secondary-foreground/80">
            Dedicated to the study and practice of Vaiṣṇava wisdom for a meaningful life.
          </p>
          <div className="space-y-2">
            <div className="flex items-start gap-3">
              <MapPin className="h-5 w-5 mt-1 shrink-0" />
              <span>123 Bhakti Marg, Vrindavan, IN 281121</span>
            </div>
            <div className="flex items-center gap-3">
              <Phone className="h-5 w-5 shrink-0" />
              <span>+91 123 456 7890</span>
            </div>
            <div className="flex items-center gap-3">
              <Mail className="h-5 w-5 shrink-0" />
              <a href="mailto:info@give.edu" className="hover:underline">
                info@give.edu
              </a>
            </div>
          </div>
          <div className="flex space-x-4 pt-2">
            <Link href="#" aria-label="LinkedIn">
              <Linkedin className="h-6 w-6 text-secondary-foreground/80 hover:text-secondary-foreground transition-colors" />
            </Link>
            <Link href="#" aria-label="Website">
              <Globe className="h-6 w-6 text-secondary-foreground/80 hover:text-secondary-foreground transition-colors" />
            </Link>
          </div>
        </div>
        <div className="md:col-span-2 space-y-4">
          <h3 className="text-2xl font-headline font-bold">Get in Touch</h3>
          <p className="text-secondary-foreground/80">
            Have questions? Fill out the form below, and we'll get back to you.
          </p>
          <form className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input id="name" placeholder="Your Name" type="text" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input id="email" placeholder="your.email@example.com" type="email" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="message">Message</Label>
              <Textarea id="message" placeholder="Your question or message..." rows={4} />
            </div>
            <Button type="submit" className="w-full sm:w-auto">Send Message</Button>
          </form>
        </div>
      </div>
      <div className="container max-w-screen-2xl mt-12 text-center text-sm text-secondary-foreground/60">
        <p>&copy; {new Date().getFullYear()} Gaura-vāṇī Institute for Vaiṣṇava Education. All Rights Reserved.</p>
      </div>
    </footer>
  );
}
