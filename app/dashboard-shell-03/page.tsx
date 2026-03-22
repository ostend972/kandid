import AppSidebar from "@/components/shadcn-space/blocks/dashboard-shell-03/app-sidebar"
import Statistic from "@/components/shadcn-space/blocks/dashboard-shell-03/welcome"
import RevenueUpdate from "@/components/shadcn-space/blocks/dashboard-shell-03/revenue-update"
import MonthlyEarning from "@/components/shadcn-space/blocks/dashboard-shell-03/monthly-earnings"
import YearlyBreakup from "@/components/shadcn-space/blocks/dashboard-shell-03/yearly-breakup"
import { WeeklyStats } from "@/components/shadcn-space/blocks/dashboard-shell-03/weekly-stats"
import SalesDownloads from "@/components/shadcn-space/blocks/dashboard-shell-03/sales-downloads"
import RecentTransactions from "@/components/shadcn-space/blocks/dashboard-shell-03/recent-transactions"
import TopProjectsTable from "@/components/shadcn-space/blocks/dashboard-shell-03/top-projects-table"
import UpcomingSchedules from "@/components/shadcn-space/blocks/dashboard-shell-03/upcoming-schedules"


export default function Page() {
    return (
        <AppSidebar>
            <div className="grid grid-cols-12 gap-6 p-6 max-w-7xl mx-auto">
                <div className="col-span-12">
                    <Statistic />
                </div>
                <div className="xl:col-span-8 col-span-12 ">
                    <RevenueUpdate />
                </div>
                <div className="xl:col-span-4 col-span-12 flex flex-col gap-6">
                    <MonthlyEarning />
                    <YearlyBreakup />
                </div>
                <div className="xl:col-span-4 col-span-12">
                    <WeeklyStats />
                </div>
                <div className="xl:col-span-4 col-span-12">
                    <SalesDownloads />
                </div>
                <div className="xl:col-span-4 col-span-12">
                    <RecentTransactions />
                </div>
                <div className="xl:col-span-8 col-span-12">
                    <TopProjectsTable />
                </div>
                <div className="xl:col-span-4 col-span-12">
                    <UpcomingSchedules />
                </div>

            </div>
        </AppSidebar>
    )
}

