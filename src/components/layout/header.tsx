"use client";

import { UserMenu } from "@/components/auth/user-menu";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useTeacher } from "@/hooks/use-teacher";
import { ChevronDown, Menu } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import * as React from "react";

const mainNavItems = [
  { name: "Testimonials", href: "#testimonials" },
  { name: "Resources", href: "#resources" },
  { name: "Contact", href: "#contact" },
];

const aboutNavItems = [
  { name: "Srila Prabhupada", href: "/about/srila-prabhupada" },
  { name: "ISKCON", href: "/about/iskcon" },
  { name: "GIVE", href: "/about/give" },
];

export default function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const { isTeacher } = useTeacher();
  const pathname = usePathname();
  const isHomePage = pathname === "/";

  const coursesHref = isHomePage ? "#courses" : "/courses";

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-secondary/90 backdrop-blur supports-[backdrop-filter]:bg-secondary/80">
      <div className="container flex h-14 max-w-screen-2xl items-center justify-between">
        <Link href="/" className="flex items-center space-x-2">
          <Image
            src="/GIVE_logo.png"
            alt="GIVE logo"
            width={32}
            height={32}
            className="h-8 w-8"
            priority
          />
          <span className="font-bold font-headline sm:inline-block">
            GIVE
          </span>
        </Link>

        <nav className="hidden lg:flex items-center gap-6 text-sm">
          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-1 font-medium text-foreground/90 transition-colors hover:text-foreground focus:outline-none">
              About <ChevronDown className="h-4 w-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {aboutNavItems.map((item) => (
                <DropdownMenuItem key={item.name} asChild>
                  <Link href={item.href}>{item.name}</Link>
                </DropdownMenuItem>
              ))}
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>Guardians</DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  <DropdownMenuItem asChild>
                    <Link href="/about/srila-bhaktisiddhanta-sarasvati-thakura">
                      Śrīla Bhaktisiddhānta Sarasvatī Ṭhākura
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/about/jayapataka-swami">
                      HH Jayapatākā Swami
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuSubContent>
              </DropdownMenuSub>
            </DropdownMenuContent>
          </DropdownMenu>
          <Link
            href="/classroom"
            className="font-medium text-foreground/90 transition-colors hover:text-foreground"
          >
            Classroom
          </Link>
          {isTeacher && (
            <Link
              href="/teacher"
              className="font-medium text-foreground/90 transition-colors hover:text-foreground"
            >
              Teacher Dashboard
            </Link>
          )}
          <Link
            href={coursesHref}
            className="font-medium text-foreground/90 transition-colors hover:text-foreground"
          >
            Courses
          </Link>
          {mainNavItems.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className="font-medium text-foreground/90 transition-colors hover:text-foreground"
            >
              {item.name}
            </Link>
          ))}
        </nav>

        <div className="hidden lg:flex items-center">
          <UserMenu />
        </div>

        <div className="flex items-center gap-2 lg:hidden">
          <UserMenu />
          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Open Menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left">
              <SheetHeader className="sr-only">
                <SheetTitle>Site navigation</SheetTitle>
              </SheetHeader>
              <div className="flex flex-col h-full">
                <div className="flex items-center border-b pb-4">
                  <Link href="/" className="flex items-center space-x-2" onClick={() => setIsMobileMenuOpen(false)}>
                    <Image
                      src="/GIVE_logo.png"
                      alt="GIVE logo"
                      width={32}
                      height={32}
                      className="h-8 w-8"
                      priority
                    />
                    <span className="font-bold font-headline">GIVE</span>
                  </Link>
                </div>
                <nav className="flex flex-col gap-1 mt-4">
                  <Accordion type="single" collapsible className="w-full border-none">
                    <AccordionItem value="about" className="border-b-0">
                      <AccordionTrigger className="px-4 text-left text-lg font-medium text-foreground/90 transition-colors hover:text-foreground hover:no-underline py-2">
                        About
                      </AccordionTrigger>
                      <AccordionContent className="pl-4">
                        <div className="flex flex-col gap-2 mt-2">
                          {aboutNavItems.map((item) => (
                            <Link
                              key={item.name}
                              href={item.href}
                              className="text-base font-medium text-foreground/90 transition-colors hover:text-foreground"
                              onClick={() => setIsMobileMenuOpen(false)}
                            >
                              {item.name}
                            </Link>
                          ))}
                          <Accordion type="single" collapsible className="w-full border-none">
                            <AccordionItem value="guardians" className="border-b-0">
                              <AccordionTrigger className="px-0 text-left text-base font-medium text-foreground/90 transition-colors hover:text-foreground hover:no-underline py-2">
                                Guardians
                              </AccordionTrigger>
                              <AccordionContent className="pl-4">
                                <div className="flex flex-col gap-2 mt-2">
                                  <Link
                                    href="/about/srila-bhaktisiddhanta-sarasvati-thakura"
                                    className="text-sm font-medium text-foreground/90 transition-colors hover:text-foreground"
                                    onClick={() => setIsMobileMenuOpen(false)}
                                  >
                                    Śrīla Bhaktisiddhānta Sarasvatī Ṭhākura
                                  </Link>
                                  <Link
                                    href="/about/jayapataka-swami"
                                    className="text-sm font-medium text-foreground/90 transition-colors hover:text-foreground"
                                    onClick={() => setIsMobileMenuOpen(false)}
                                  >
                                    HH Jayapatākā Swami
                                  </Link>
                                </div>
                              </AccordionContent>
                            </AccordionItem>
                          </Accordion>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                  <Link
                    href="/classroom"
                    className="px-4 py-2 text-lg font-medium text-foreground/90 transition-colors hover:text-foreground"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Classroom
                  </Link>
                  {isTeacher && (
                    <Link
                      href="/teacher"
                      className="px-4 py-2 text-lg font-medium text-foreground/90 transition-colors hover:text-foreground"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      Teacher Dashboard
                    </Link>
                  )}
                  <Link
                    href={coursesHref}
                    className="px-4 py-2 text-lg font-medium text-foreground/90 transition-colors hover:text-foreground"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Courses
                  </Link>
                  {mainNavItems.map((item) => (
                    <Link
                      key={item.name}
                      href={item.href}
                      className="px-4 py-2 text-lg font-medium text-foreground/90 transition-colors hover:text-foreground"
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
