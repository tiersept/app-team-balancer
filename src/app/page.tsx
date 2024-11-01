import TeamBalancer from "@/components/TeamBalancer";

export const dynamic = 'force-dynamic'

export default function Home() {
  return (
    <div className="flex items-center justify-center font-[family-name:var(--font-geist-sans)]">
      <TeamBalancer />
    </div>
  );
}
