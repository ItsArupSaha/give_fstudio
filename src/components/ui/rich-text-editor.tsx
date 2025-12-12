"use client";

import { cn } from "@/lib/utils";
import { Bold, Italic, Link as LinkIcon, List, ListOrdered, Underline, X } from "lucide-react";
import { useEffect, useRef } from "react";

type RichTextEditorProps = {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
};

export function RichTextEditor({ value, onChange, placeholder, className }: RichTextEditorProps) {
    const editorRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (editorRef.current && editorRef.current.innerHTML !== value) {
            editorRef.current.innerHTML = value || "";
        }
    }, [value]);

    const exec = (command: string, arg?: string) => {
        document.execCommand(command, false, arg);
        editorRef.current?.focus();
    };

    const handleLink = () => {
        const url = prompt("Enter URL");
        if (url) {
            exec("createLink", url);
        }
    };

    const handleInput = () => {
        if (editorRef.current) {
            onChange(editorRef.current.innerHTML);
        }
    };

    const handleClear = () => {
        if (editorRef.current) {
            editorRef.current.innerHTML = "";
            onChange("");
        }
    };

    return (
        <div className={cn("border rounded-md bg-white", className)}>
            <div className="flex flex-wrap gap-2 px-3 py-2 border-b bg-muted/50">
                <button type="button" className="p-1 hover:text-primary" onClick={() => exec("bold")} aria-label="Bold">
                    <Bold className="h-4 w-4" />
                </button>
                <button type="button" className="p-1 hover:text-primary" onClick={() => exec("italic")} aria-label="Italic">
                    <Italic className="h-4 w-4" />
                </button>
                <button type="button" className="p-1 hover:text-primary" onClick={() => exec("underline")} aria-label="Underline">
                    <Underline className="h-4 w-4" />
                </button>
                <button
                    type="button"
                    className="p-1 hover:text-primary"
                    onClick={() => exec("fontSize", "2")}
                    aria-label="Smaller text"
                >
                    <span className="text-sm leading-none align-middle">A<sup className="text-[10px]">▼</sup></span>
                </button>
                <button
                    type="button"
                    className="p-1 hover:text-primary"
                    onClick={() => exec("fontSize", "4")}
                    aria-label="Larger text"
                >
                    <span className="text-sm leading-none align-middle">A<sup className="text-[10px]">▲</sup></span>
                </button>
                <button type="button" className="p-1 hover:text-primary" onClick={() => exec("insertUnorderedList")} aria-label="Bullet list">
                    <List className="h-4 w-4" />
                </button>
                <button type="button" className="p-1 hover:text-primary" onClick={() => exec("insertOrderedList")} aria-label="Numbered list">
                    <ListOrdered className="h-4 w-4" />
                </button>
                <button type="button" className="p-1 hover:text-primary" onClick={handleLink} aria-label="Insert link">
                    <LinkIcon className="h-4 w-4" />
                </button>
                <button type="button" className="p-1 hover:text-primary" onClick={handleClear} aria-label="Clear">
                    <X className="h-4 w-4" />
                </button>
            </div>
            <div
                ref={editorRef}
                className="min-h-[200px] px-3 py-3 outline-none prose prose-sm max-w-none [&_ul]:list-disc [&_ul]:ml-6 [&_ul]:my-2 [&_ol]:list-decimal [&_ol]:ml-6 [&_ol]:my-2 [&_li]:my-1 [&_a]:text-primary [&_a]:underline [&_strong]:font-bold [&_em]:italic [&_u]:underline"
                contentEditable
                onInput={handleInput}
                suppressContentEditableWarning
                aria-placeholder={placeholder}
            />
        </div>
    );
}

