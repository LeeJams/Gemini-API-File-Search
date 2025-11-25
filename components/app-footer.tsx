import { Github } from "lucide-react";
import Link from "next/link";

export function AppFooter() {
  return (
    <footer className="border-t border-border/40 bg-background/50 backdrop-blur-sm">
      <div className="container flex h-16 items-center justify-center">
        <Link
          href="https://github.com/LeeJams/Gemini-API-File-Search"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <Github className="h-4 w-4" />
          <span className="font-medium">View on GitHub</span>
        </Link>
      </div>
    </footer>
  );
}
