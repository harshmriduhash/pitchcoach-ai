import { AudioLines } from "lucide-react";
import { Link } from "@tanstack/react-router";

export function Brand() {
  return <Link to="/" className="inline-flex items-center gap-2 font-display text-2xl font-black tracking-tight text-foreground"><span className="grid size-9 place-items-center rounded-lg bg-primary text-primary-foreground"><AudioLines className="size-5" /></span>PITCHCOACH <span className="rounded border border-primary px-1.5 text-sm text-primary">AI</span></Link>;
}