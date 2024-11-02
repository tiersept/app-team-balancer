import TeamBalancerSupa from "@/components/TeamBalancerSupa";
import { Suspense } from "react";

// export const dynamic = 'force-dynamic'

export default function Home() {
  return (
    <div className="flex items-center justify-center font-[family-name:var(--font-geist-sans)]">
      <Suspense>
        <TeamBalancerSupa />
      </Suspense>
    </div>
  );
}
