"use server";

import { z } from "zod";
import { sql } from "@vercel/postgres";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { signIn } from "@/auth";
import { v4 as uuidv4 } from "uuid";
import { auth } from "@/auth";
import { Invoice } from "./definitions";
// midu
const CreateInvoiceFormSchema = z.object({
  id: z.string(),
  customerId: z.string({
    invalid_type_error: "Please select a customer.",
  }),
  amount: z.coerce
    .number()
    .gt(0, { message: "Please enter an amount greater than $0." }),
  status: z.enum(["pending", "paid"], {
    invalid_type_error: "Please select an invoice status.",
  }),
  date: z.string(),
});
const CreateInvoiceSchema = CreateInvoiceFormSchema.omit({
  id: true,
  date: true,
});
//midu

const FormSchema = z.object({
  id: z.string(),
  customerId: z.string({
    invalid_type_error: "Please select a customer.",
  }),
  amount: z.coerce
    .number()
    .gt(0, { message: "Please enter an amount greater than $0." }),
  status: z.enum(["pending", "paid"], {
    invalid_type_error: "Please select an invoice status.",
  }),
  date: z.string(),
});

const CreateCustomer = z.object({
  customerNom: z.string().min(1, "El nom es obligatori."),

  customerEmail: z.string().email("Email invalid i obligatori"),
});

// Use Zod to update the expected types
const UpdateInvoice = FormSchema.omit({ id: true, date: true });

export type State = {
  errors?: {
    customerId?: string[];
    amount?: string[];
    status?: string[];
  };
  message?: string | null;
};
export type StateCustomer = {
  errors?: {
    customerNom?: string[];
    customerEmail?: string[];
  };
  message?: string | null;
};

export async function authenticate(
  prevState: string | undefined,
  formData: FormData
) {
  console.log(Object.fromEntries(formData));

  try {
    await signIn("credentials", Object.fromEntries(formData));
  } catch (error) {
    console.log("ERROR: ", error);
    if ((error as Error).message.includes("CredentialsSignin")) {
      console.log("ERROR TROBAT");

      return "CredentialsSignin";
    }
    throw error;
  }
}

export async function createInvoice(formData: FormData) {
  // Validate form fields using Zod
  const validatedFields = CreateInvoiceSchema.safeParse({
    customerId: formData.get("customerId"),
    amount: formData.get("amount"),
    status: formData.get("status"),
  });
  // If form validation fails, return errors early. Otherwise, continue.
  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: "Missing Fields. Failed to Create Invoice.",
    };
  }

  // Prepare data for insertion into the database
  const { customerId, amount, status } = validatedFields.data;
  // amount en cents
  const amountCents = amount * 100;
  // data
  const [date] = new Date().toISOString().split("T");
  console.log({ customerId, amountCents, status, date });
  // Insert data into the database
  try {
    await sql`
          INSERT INTO invoices (customer_id, amount, status, date)
          VALUES (${customerId}, ${amountCents}, ${status}, ${date})
        `;
  } catch (error) {
    // If a database error occurs, return a more specific error.
    return {
      message: "Database Error: Failed to Create Invoice.",
    };
  }
  // Revalidate the cache for the invoices page and redirect the user.
  revalidatePath("/dashboard/invoices");
  redirect("/dashboard/invoices");
}

export async function updateInvoice(
  id: string,
  prevState: State,
  formData: FormData
) {
  const validatedFields = UpdateInvoice.safeParse({
    customerId: formData.get("customerId"),
    amount: formData.get("amount"),
    status: formData.get("status"),
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: "Missing Fields. Failed to Update Invoice.",
    };
  }

  const { customerId, amount, status } = validatedFields.data;
  const amountInCents = amount * 100;

  try {
    await sql`
        UPDATE invoices
        SET customer_id = ${customerId}, amount = ${amountInCents}, status = ${status}
        WHERE id = ${id}
      `;
  } catch (error) {
    return { message: "Database Error: Failed to Update Invoice." };
  }

  revalidatePath("/dashboard/invoices");
  redirect("/dashboard/invoices");
}
export async function deleteInvoice(id: string) {
  try {
    await sql`DELETE FROM invoices WHERE id = ${id}`;
    revalidatePath("/dashboard/invoices");
    return { message: "Deleted Invoice." };
  } catch (error) {
    return { message: "Database Error: Failed to Delete Invoice." };
  }
}
export async function deleteCustomerWithId(id: string) {
  console.log("Borro id: ", id);
  try {
    await sql`DELETE FROM customers WHERE id = ${id}`;
    revalidatePath("/dashboard/customers");
    return { message: "Alumne eliminat." };
  } catch (error) {
    return { message: "Database Error: Alumne NO eliminat." };
  }
}
export async function createCustomer(formData: FormData) {
  const user = await auth();
  const userData = user?.user || {
    name: "Anónima",
    email: "anonymus@gmail.com",
  };
  const {
    rows,
  } = await sql`SELECT id FROM users WHERE email = ${userData.email}`;
  const id = rows[0].id;

  // Validar formulario usando Zod
  const validatedFields = CreateCustomer.safeParse({
    customerNom: formData.get("customerNom"),
    customerEmail: formData.get("customerEmail"),
  });

  // Si la validación del formulario falla, devuelva errores temprano. De lo contrario, continúe.
  if (!validatedFields.success) {
    console.log("FAIL");

    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: "Falten camps. Impossible crear alumne.",
    };
  }

  // Preparar datos para la inserción en la base de datos
  const { customerNom, customerEmail } = validatedFields.data;
  const uuid = uuidv4();
  const image_url = "/customers/emil-kowalski.png";
  //const tutor = "80c01086-b916-40ff-a3d4-ebc43256a26b";
  console.log("PASS: ", customerNom, customerEmail, uuid, image_url, id);

  // Insertar datos en la base de datos
  try {
    await sql`
        INSERT INTO customers (id, name, email, image_url,tutor)
        VALUES (${uuid},${customerNom}, ${customerEmail},${image_url},${id})
      `;
    console.log("TRY: ", customerNom, customerEmail, uuid);
  } catch (error) {
    // Si se produce un error en la base de datos, devuelva un error más específico.
    return {
      message: "Database Error: Failed to Create Invoice.",
    };
  }
  // Revalidar la caché de la página de facturas y redirigir al usuario.
  revalidatePath("/dashboard/customers");
  redirect("/dashboard/customers");
}
