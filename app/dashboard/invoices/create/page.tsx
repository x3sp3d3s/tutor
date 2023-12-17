import Form from "@/app/ui/invoices/create-form";
import Breadcrumbs from "@/app/ui/invoices/breadcrumbs";
import { fetchCustomersPerUser } from "@/app/lib/data";
import { Metadata } from "next";
import { auth } from "@/auth";
export const metadata: Metadata = {
  title: "Create",
};

export default async function Page() {
  const { user } = await auth();
  const customers = await fetchCustomersPerUser(user);

  return (
    <main>
      <Breadcrumbs
        breadcrumbs={[
          { label: "Factures", href: "/dashboard/invoices" },
          {
            label: "Crear Factura",
            href: "/dashboard/invoices/create",
            active: true,
          },
        ]}
      />
      <Form customers={customers} />
    </main>
  );
}
