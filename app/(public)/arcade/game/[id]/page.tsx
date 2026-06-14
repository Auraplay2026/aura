import { notFound } from "next/navigation";
import { getArcadeGameById } from "@/lib/arcade-games";
import { ArcadeGameWrapper } from "@/components/arcade/ArcadeGameWrapper";

export default async function ArcadeGamePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const game = getArcadeGameById(resolvedParams.id);

  if (!game) {
    notFound();
  }

  return (
    <div className="min-h-[100dvh] bg-slate-50 p-4 sm:p-6 flex flex-col relative z-0">
      <div className="max-w-7xl mx-auto w-full flex-1 flex flex-col">
        <ArcadeGameWrapper game={game} />
      </div>
    </div>
  );
}
