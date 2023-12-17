import { sql } from "@vercel/postgres";
import {
  CustomerField,
  CustomersTable,
  InvoiceForm,
  InvoicesTable,
  LatestInvoiceRaw,
  User,
  Revenue,
  alumneField,
} from "./definitions";
import { formatCurrency } from "./utils";
import { unstable_noStore as noStore } from "next/cache";
import { Dawning_of_a_New_Day } from "next/font/google";

export async function fetchRevenue() {
  // Add noStore() here prevent the response from being cached.
  // This is equivalent to in fetch(..., {cache: 'no-store'}).
  noStore();

  try {
    const data = await sql<Revenue>`SELECT * FROM revenue`;

    return data.rows;
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to fetch revenue data.");
  }
}

export async function fetchLatestInvoices(user: alumneField) {
  noStore();
  const { rows } = await sql`SELECT id FROM users WHERE email = ${user.email}`;
  const id = rows[0].id;

  try {
    const data = await sql<LatestInvoiceRaw>`
      SELECT invoices.amount, customers.name, customers.image_url, customers.email, invoices.id
      FROM customers
JOIN invoices ON invoices.customer_id = customers.id
WHERE (customers.tutor = ${id})
      ORDER BY invoices.date DESC
      LIMIT 5`;

    const latestInvoices = data.rows.map((invoice) => ({
      ...invoice,
      amount: formatCurrency(invoice.amount),
    }));
    return latestInvoices;
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to fetch the latest invoices.");
  }
}

export async function fetchCardData() {
  noStore();

  try {
    // You can probably combine these into a single SQL query
    // However, we are intentionally splitting them to demonstrate
    // how to initialize multiple queries in parallel with JS.
    const invoiceCountPromise = sql`SELECT COUNT(*) FROM invoices`;
    const customerCountPromise = sql`SELECT COUNT(*) FROM customers`;
    const invoiceStatusPromise = sql`SELECT
         SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END) AS "paid",
         SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END) AS "pending"
         FROM invoices`;

    const data = await Promise.all([
      invoiceCountPromise,
      customerCountPromise,
      invoiceStatusPromise,
    ]);

    const numberOfInvoices = Number(data[0].rows[0].count ?? "0");
    const numberOfCustomers = Number(data[1].rows[0].count ?? "0");
    const totalPaidInvoices = formatCurrency(data[2].rows[0].paid ?? "0");
    const totalPendingInvoices = formatCurrency(data[2].rows[0].pending ?? "0");

    return {
      numberOfCustomers,
      numberOfInvoices,
      totalPaidInvoices,
      totalPendingInvoices,
    };
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to fetch card data.");
  }
}
export async function fetchCardDataPerUser(user: alumneField) {
  noStore();
  const { rows } = await sql`SELECT id FROM users WHERE email = ${user.email}`;
  const id = rows[0].id;

  try {
    // You can probably combine these into a single SQL query
    // However, we are intentionally splitting them to demonstrate
    // how to initialize multiple queries in parallel with JS.
    // TOTAL FACTURES X TUTOR
    const invoiceCountPromise = sql`SELECT COUNT(*) AS num_factures
        FROM invoices
        INNER JOIN customers
        ON invoices.customer_id = customers.id
        AND customers.tutor = ${id}`;

    // TOTAL ALUMNES DEL TUTOR
    const customerCountPromise = sql`SELECT COUNT(*) AS num_alumnes
        FROM customers
        WHERE tutor = ${id}`;

    // TOTAL ACUMULAT I PENDENT X TUTOR
    const invoiceStatusPromise = sql`SELECT SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END) AS "paid",
        SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END) AS "pending"
        FROM invoices
        INNER JOIN customers
        ON invoices.customer_id = customers.id
        AND customers.tutor = ${id}`;

    const data = await Promise.all([
      invoiceCountPromise,
      customerCountPromise,
      invoiceStatusPromise,
    ]);

    const numberOfInvoices = Number(data[0].rows[0].num_factures ?? "0");
    const numberOfCustomers = Number(data[1].rows[0].num_alumnes ?? "0");
    const totalPaidInvoices = formatCurrency(data[2].rows[0].paid ?? "0");
    const totalPendingInvoices = formatCurrency(data[2].rows[0].pending ?? "0");

    return {
      numberOfCustomers,
      numberOfInvoices,
      totalPaidInvoices,
      totalPendingInvoices,
    };
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to fetch card data.");
  }
}

const ITEMS_PER_PAGE = 6;
export async function fetchFilteredInvoices(
  query: string,
  currentPage: number
) {
  noStore();

  const offset = (currentPage - 1) * ITEMS_PER_PAGE;

  try {
    const invoices = await sql<InvoicesTable>`
      SELECT
        invoices.id,
        invoices.amount,
        invoices.date,
        invoices.status,
        customers.name,
        customers.email,
        customers.image_url
      FROM invoices
      JOIN customers ON invoices.customer_id = customers.id
      WHERE
        customers.name ILIKE ${`%${query}%`} OR
        customers.email ILIKE ${`%${query}%`} OR
        invoices.amount::text ILIKE ${`%${query}%`} OR
        invoices.date::text ILIKE ${`%${query}%`} OR
        invoices.status ILIKE ${`%${query}%`}
      ORDER BY invoices.date DESC
      LIMIT ${ITEMS_PER_PAGE} OFFSET ${offset}
    `;

    return invoices.rows;
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to fetch invoices.");
  }
}
export async function fetchFilteredInvoicesPerTutor(
  user: alumneField,
  query: string,
  currentPage: number
) {
  noStore();
  const offset = (currentPage - 1) * ITEMS_PER_PAGE;

  const { rows } = await sql`SELECT id FROM users WHERE email = ${user.email}`;
  const id = rows[0].id;

  try {
    const invoices = await sql<InvoicesTable>`
    SELECT
    invoices.id,
    invoices.amount,
    invoices.date,
    invoices.status,
    customers.name,
    customers.email,
    customers.image_url
FROM customers
JOIN invoices ON invoices.customer_id = customers.id
WHERE (customers.tutor = ${id})
AND (
  customers.name ILIKE ${`%${query}%`} OR
  customers.email ILIKE ${`%${query}%`} OR
  invoices.amount::text ILIKE ${`%${query}%`} OR
  invoices.date::text ILIKE ${`%${query}%`} OR
  invoices.status ILIKE ${`%${query}%`}
)
ORDER BY invoices.date DESC
LIMIT ${ITEMS_PER_PAGE} OFFSET ${offset}

`;

    return invoices.rows;
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to fetch invoices.");
  }
}

export async function fetchInvoicesPages(user: alumneField, query: string) {
  noStore();
  const { rows } = await sql`SELECT id FROM users WHERE email = ${user.email}`;
  const id = rows[0].id;
  try {
    const count = await sql`SELECT COUNT(*)
    FROM invoices
    JOIN customers ON invoices.customer_id = customers.id
    WHERE (customers.tutor = ${id})
    AND (
      customers.name ILIKE ${`%${query}%`} OR
      customers.email ILIKE ${`%${query}%`} OR
      invoices.amount::text ILIKE ${`%${query}%`} OR
      invoices.date::text ILIKE ${`%${query}%`} OR
      invoices.status ILIKE ${`%${query}%`}
    )
  `;

    const totalPages = Math.ceil(Number(count.rows[0].count) / ITEMS_PER_PAGE);
    return totalPages;
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to fetch total number of invoices.");
  }
}
/* testing */
export async function fetchCostumersPages(user: alumneField, query: string) {
  noStore();
  const { rows } = await sql`SELECT id FROM users WHERE email = ${user.email}`;
  const id = rows[0].id;
  try {
    const count = await sql`SELECT COUNT(*)
    FROM customers
   WHERE (customers.tutor = ${id})
    AND (
      customers.name ILIKE ${`%${query}%`} OR
      customers.email ILIKE ${`%${query}%`}
    )
  `;

    const totalPages = Math.ceil(Number(count.rows[0].count) / ITEMS_PER_PAGE);
    return totalPages;
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to fetch total number of customers.");
  }
}
export async function fetchFilteredCustomersPerTutor(
  user: alumneField,
  query: string,
  currentPage: number
) {
  noStore();
  const offset = (currentPage - 1) * ITEMS_PER_PAGE;

  const { rows } = await sql`SELECT id FROM users WHERE email = ${user.email}`;
  const id = rows[0].id;

  try {
    const customers = await sql`
    SELECT
    customers.id,
    customers.name,
    customers.email,
    customers.image_url,
    COUNT(*) AS total_invoices,
    SUM(CASE WHEN invoices.status = 'pending' THEN invoices.amount ELSE 0 END) AS total_pending,
    SUM(CASE WHEN invoices.status = 'paid' THEN invoices.amount ELSE 0 END) AS total_paid   
FROM customers
INNER JOIN invoices ON customers.id = invoices.customer_id
WHERE (customers.tutor = ${id})
AND (
  customers.name ILIKE ${`%${query}%`} OR
  customers.email ILIKE ${`%${query}%`}
)
GROUP BY customers.id
LIMIT ${ITEMS_PER_PAGE} OFFSET ${offset}

`;

    return customers.rows;
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to fetch invoices.");
  }
}
/* Fi */
export async function fetchInvoiceById(id: string) {
  noStore();

  try {
    const data = await sql<InvoiceForm>`
      SELECT
        invoices.id,
        invoices.customer_id,
        invoices.amount,
        invoices.status
      FROM invoices
      WHERE invoices.id = ${id};
    `;

    const invoice = data.rows.map((invoice) => ({
      ...invoice,
      // Convert amount from cents to dollars
      amount: invoice.amount / 100,
    }));
    return invoice[0];
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to fetch invoice.");
  }
}

export async function fetchCustomers() {
  noStore();
  try {
    const data = await sql<CustomerField>`
      SELECT
        id,
        name
      FROM customers
      ORDER BY name ASC
    `;

    const customers = data.rows;
    return customers;
  } catch (err) {
    console.error("Database Error:", err);
    throw new Error("Failed to fetch all customers.");
  }
}
export async function fetchCustomersPerUser(user: alumneField) {
  noStore();
  const { rows } = await sql`SELECT id FROM users WHERE email = ${user.email}`;
  const id = rows[0].id;

  try {
    const data = await sql<CustomersTable>`
    SELECT
    customers.id,
    customers.name,
    customers.email,
    customers.image_url,
    COUNT(invoices.id) AS total_invoices,
    SUM(CASE WHEN invoices.status = 'pending' THEN invoices.amount ELSE 0 END) AS total_pending,
    SUM(CASE WHEN invoices.status = 'paid' THEN invoices.amount ELSE 0 END) AS total_paid
  FROM customers

  LEFT JOIN invoices ON customers.id = invoices.customer_id
  WHERE tutor =${id}
  
  GROUP BY customers.id, customers.name, customers.email, customers.image_url
  ORDER BY customers.name ASC

  `;

    const customers = data.rows;
    return customers;
  } catch (err) {
    console.error("Database Error:", err);
    throw new Error("Failed to fetch all customers.");
  }
}
export async function fetchAllCustomers() {
  try {
    const data = await sql<CustomerField>`
      SELECT
        *
      FROM customers
      ORDER BY name ASC
    `;

    const customers = data.rows;
    return customers;
  } catch (err) {
    console.error("Database Error:", err);
    throw new Error("Failed to fetch all customers.");
  }
}
export async function fetchCustomersById() {
  noStore();

  try {
    const data = await sql<CustomersTable>`
		SELECT
      customers.id,
		  customers.name,
		  customers.email,
		  customers.image_url,
		  COUNT(invoices.id) AS total_invoices,
		  SUM(CASE WHEN invoices.status = 'pending' THEN invoices.amount ELSE 0 END) AS total_pending,
		  SUM(CASE WHEN invoices.status = 'paid' THEN invoices.amount ELSE 0 END) AS total_paid
		FROM customers
		LEFT JOIN invoices ON customers.id = invoices.customer_id

		GROUP BY customers.id, customers.name, customers.email, customers.image_url
		ORDER BY customers.name ASC
	  `;

    const customers = data.rows.map((customer) => ({
      ...customer,
      total_pending: formatCurrency(customer.total_pending),
      total_paid: formatCurrency(customer.total_paid),
    }));

    return customers;
  } catch (err) {
    console.error("Database Error:", err);
    throw new Error("Failed to fetch customer table.");
  }
}
export async function fetchFilteredCustomers(query: string) {
  noStore();

  try {
    const data = await sql<CustomersTable>`
		SELECT
		  customers.id,
		  customers.name,
		  customers.email,
		  customers.image_url,
		  COUNT(invoices.id) AS total_invoices,
		  SUM(CASE WHEN invoices.status = 'pending' THEN invoices.amount ELSE 0 END) AS total_pending,
		  SUM(CASE WHEN invoices.status = 'paid' THEN invoices.amount ELSE 0 END) AS total_paid
		FROM customers
		LEFT JOIN invoices ON customers.id = invoices.customer_id
		WHERE
		  customers.name ILIKE ${`%${query}%`} OR
        customers.email ILIKE ${`%${query}%`}
		GROUP BY customers.id, customers.name, customers.email, customers.image_url
		ORDER BY customers.name ASC
	  `;

    const customers = data.rows.map((customer) => ({
      ...customer,
      total_pending: formatCurrency(customer.total_pending),
      total_paid: formatCurrency(customer.total_paid),
    }));

    return customers;
  } catch (err) {
    console.error("Database Error:", err);
    throw new Error("Failed to fetch customer table.");
  }
}

export async function getUser(email: string) {
  try {
    const user = await sql`SELECT * FROM users WHERE email=${email}`;
    return user.rows[0] as User;
  } catch (error) {
    console.error("Failed to fetch user:", error);
    throw new Error("Failed to fetch user.");
  }
}
export async function fetchRevenuePerMonth(user: alumneField) {
  // Add noStore() here prevent the response from being cached.
  // This is equivalent to in fetch(..., {cache: 'no-store'}).
  noStore();
  const { rows } = await sql`SELECT id FROM users WHERE email = ${user.email}`;
  const id = rows[0].id;
  const any = new Date().getFullYear();
  const mes = new Date().getMonth() + 1;
  //console.log("any actual: ", any, mes);

  // TODO: filtrar per any
  // TODO: agrupar per mes

  try {
    const data = await sql<any>`SELECT
    date_part('month', date) AS month,
    COUNT(*) AS total_invoices,
    SUM(amount) AS total_amount,
    customers.tutor
  FROM
    invoices
  INNER JOIN
    customers
  ON
    invoices.customer_id = customers.id
  WHERE
    date_part('year', invoices.date) = date_part('year', now())
    AND customers.tutor = '80c01086-b916-40ff-a3d4-ebc43256a26b'
  AND status ='paid'
  GROUP BY
    date_part('month', date),
    customers.tutor
  ORDER BY
    date_part('month', date),
    customers.tutor;
  
    `;
    const info = data.rows;
    /*
    // Creamos un objeto para almacenar el acumulado por mes
    const acumuladoPorMes: { [mes: number]: number } = {};
    // Iteramos sobre las facturas y acumulamos el monto por mes
    for (const invoice of info) {
      const date = new Date(invoice.date);
      if (date.getFullYear() === 2023) {
        const month = date.getMonth() + 1; // Sumamos 1 porque los meses van de 0 a 11 en JavaScript
        acumuladoPorMes[month] =
          (acumuladoPorMes[month] || 0) + invoice.amount / 100;
      }
    } */
    console.log("info ---> ", info);

    return info;
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to fetch revenue data.");
  }
}
