import { CalculatorIcon } from "@heroicons/react/24/outline";
import { lusitana } from "@/app/ui/fonts";

export default function AcmeLogo() {
  return (
    <div
      className={`${lusitana.className} flex flex-row items-center leading-none text-white`}
    >
      <CalculatorIcon className="h-auto w-auto  mr-2" />
      <p className="text-[44px]">Tutor</p>
    </div>
  );
}
