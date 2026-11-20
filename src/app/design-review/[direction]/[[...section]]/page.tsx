import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { review, type Direction, type Surface } from "../../_copy";
import { PreviewPage } from "../../_pages";

type Props = { params: Promise<{ direction: string; section?: string[] }> };

async function resolvePage(params: Props["params"]): Promise<{ direction: Direction; surface: Surface }> {
  if (process.env.NODE_ENV !== "development") notFound();
  const {direction, section = []} = await params;
  if ((direction !== "paper" && direction !== "ink") ||
    section.length > 1 || (section.length === 1 && section[0] !== "research")) notFound();
  return { direction, surface: section.length ? "research" : "home" };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { direction, surface } = await resolvePage(params);
  return { title: review.hub.names[direction] + " / " + review.labels[surface] };
}
export default async function Page({ params }: Props) {
  return <PreviewPage {...await resolvePage(params)} />;
}
