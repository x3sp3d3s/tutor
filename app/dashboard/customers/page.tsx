import { Metadata } from "next";
import { lusitana } from "@/app/ui/fonts";
import CustomersTable from "../../ui/customers/table";
import { fetchCostumersPages } from "@/app/lib/data";
import Search from "@/app/ui/search";
import Pagination from "@/app/ui/invoices/pagination";
import { auth } from "@/auth";
import { CreateInvoice } from "@/app/ui/customers/buttons";
import { CustomerTableSkeleton } from "@/app/ui/skeletons";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Customers",
};
export default async function Page({
  searchParams,
}: {
  searchParams?: {
    query?: string;
    page?: string;
  };
}) {
  const user = await auth();
  const userData = user?.user || {
    name: "Anónima",
    email: "anonymus@gmail.com",
  };
  const query = searchParams?.query || "";

  const totalPages = await fetchCostumersPages(userData, query);
  console.log("totalpages", totalPages);

  const currentPage = Number(searchParams?.page) || 1;

  return (
    <div className="w-full">
      <div className="flex w-full items-center justify-between">
        <h1 className={`${lusitana.className} text-2xl`}>Alumnes</h1>
      </div>
      <div className="mt-4 flex items-center justify-between gap-2 md:mt-8">
        <Search placeholder="Buscar Alumne..." />
        <CreateInvoice />
      </div>
      <Suspense key={query + currentPage} fallback={<CustomerTableSkeleton />}>
        <CustomersTable query={query} currentPage={currentPage} />
      </Suspense>
      <div className="mt-5 flex w-full justify-center">
        <Pagination totalPages={totalPages} />
      </div>
    </div>
  );
}
