"use client";

import * as React from "react";
import Link from "next/link";
import { BookOpenText, Menu, X, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { cn } from "@/lib/utils";

const mainNavItems = [
  { name: "Courses", href: "#courses" },
  { name: "Testimonials", href: "#testimonials" },
  { name: "Resources", href: "#resources" },
  { name: "FAQ", href: "#faq" },
  { name: "Contact", href: "#contact" },
];

const aboutNavItems = [
  { name: "Srila Prabhupada", href: "/about/srila-prabhupada" },
];

export default function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 max-w-screen-2xl items-center justify-between">
        <div className="flex">
          <Link href="/" className="flex items-center space-x-2">
            <BookOpenText className="h-6 w-6 text-primary" />
            <span className="font-bold font-headline sm:inline-block">
              GIVE
            </span>
          </Link>
        </div>

        <nav className="hidden gap-6 text-sm md:flex items-center">
          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-1 font-medium text-foreground/60 transition-colors hover:text-foreground/80 focus:outline-none">
              About <ChevronDown className="h-4 w-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {aboutNavItems.map((item) => (
                <DropdownMenuItem key={item.name} asChild>
                  <Link href={item.href}>{item.name}</Link>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          {mainNavItems.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className="font-medium text-foreground/60 transition-colors hover:text-foreground/80"
            >
              {item.name}
            </Link>
          ))}
        </nav>

        <div className="flex items-center md:hidden">
          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Open Menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left">
              <div className="flex flex-col h-full">
                <div className="flex items-center border-b pb-4">
                  <Link href="/" className="flex items-center space-x-2" onClick={() => setIsMobileMenuOpen(false)}>
                    <BookOpenText className="h-6 w-6 text-primary" />
                    <span className="font-bold font-headline">GIVE</span>
                  </Link>
                </div>
                <nav className="flex flex-col gap-1 mt-4">
                  <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="about" className="border-b-0">
                      <AccordionTrigger className="text-lg font-medium text-foreground/80 transition-colors hover:text-foreground hover:no-underline py-2">
                        About
                      </AccordionTrigger>
                      <AccordionContent className="pl-4">
                        <div className="flex flex-col gap-2 mt-2">
                          {aboutNavItems.map((item) => (
                            <Link
                              key={item.name}
                              href={item.href}
                              className="text-base font-medium text-foreground/70 transition-colors hover:text-foreground"
                              onClick={() => setIsMobileMenuOpen(false)}
                            >
                              {item.name}
                            </Link>
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                  {mainNavItems.map((item) => (
                    <Link
                      key={item.name}
                      href={item.href}
                      className="px-4 py-2 text-lg font-medium text-foreground/80 transition-colors hover:text-foreground"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      {item.name}
                    </Link>
                  ))}
                </nav>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
