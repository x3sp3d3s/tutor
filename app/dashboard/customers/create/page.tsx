import Breadcrumbs from "@/app/ui/invoices/breadcrumbs";
import { Metadata } from "next";
import Form from "@/app/ui/customers/create-form";
export const metadata: Metadata = {
  title: "Alumnes",
};
export default async function Page() {
  return (
    <main>
      <Breadcrumbs
        breadcrumbs={[
          { label: "Alumnes", href: "/dashboard/customers" },
          {
            label: "Nou Alumne",
            href: "/dashboard/customers/create",
            active: true,
          },
        ]}
      />
      <Form />
    </main>
  );
}
