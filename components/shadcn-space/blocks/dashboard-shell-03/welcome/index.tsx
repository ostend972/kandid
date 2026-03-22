import WelcomeCard from "@/components/shadcn-space/blocks/dashboard-shell-03/welcome/welcome-card";
import SmallCards from "@/components/shadcn-space/blocks/dashboard-shell-03/welcome/small-cards";

export default function Statistic() {
    return (
        <div className="flex items-center xl:flex-row flex-col gap-6">
            <WelcomeCard />
            <div className="flex flex-wrap lg:flex-nowrap items-center sm:justify-center gap-6 w-full">
                <SmallCards />
            </div>
        </div>
    );
}