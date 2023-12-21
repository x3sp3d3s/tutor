"use client";
import Link from "next/link";
import { UserCircleIcon, EnvelopeIcon } from "@heroicons/react/24/outline";
import { Button } from "@/app/ui/button";
import { createCustomer } from "@/app/lib/actions";
import { useFormState } from "react-dom";
type State = {
  errors: null | {
    customerNom?: string[];
    customerEmail?: string[];
  };
  message: string;
};
function formDataToState(formData: FormData): State {
  const errors: { customerNom?: string[]; customerEmail?: string[] } = {};
  if (formData.get("customerNom")) {
    errors.customerNom = formData
      .get("customerNom")
      ?.toString()
      ?.trim()
      ?.split(",")
      .map((name: string) => name.trim());
  }
  if (formData.get("customerEmail")) {
    errors.customerEmail = formData
      .get("customerEmail")
      ?.toString()
      ?.trim()
      ?.split(",")
      .map((email: string) => email.trim());
  }

  return {
    errors,
    message: "null",
  };
}

function initialFormState() {
  return formDataToState(new FormData());
}

export default function Form() {
  const [state, dispatch] = useFormState(createCustomer, initialFormState());

  console.log("state: ", state);

  return (
    <form action={dispatch}>
      <div className="rounded-md bg-gray-50 p-4 md:p-6">
        {/* Customer Name */}
        <div className="mb-4">
          <label htmlFor="customer" className="mb-2 block text-sm font-medium">
            Nom Alumne
          </label>
          <div className="relative">
            <input
              type="text"
              id="customerNom"
              name="customerNom"
              className="peer block w-full cursor-pointer rounded-md border border-gray-200 py-2 pl-10 text-sm outline-2 placeholder:text-gray-500"
              placeholder="Nom i Cognoms alumne"
              aria-describedby="nom-error"
            />

            <UserCircleIcon className="pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-gray-500" />
          </div>
          <div id="nom-error" aria-live="polite" aria-atomic="true">
            {state?.errors &&
              state.errors?.customerNom.map((error: string) => (
                <p className="mt-2 text-sm text-red-500" key={error}>
                  {error}
                </p>
              ))}
          </div>
        </div>

        {/* Email */}
        <div className="mb-4">
          <label htmlFor="amount" className="mb-2 block text-sm font-medium">
            Email Alumne
          </label>
          <div className="relative mt-2 rounded-md">
            <div className="relative">
              <input
                id="customerEmail"
                name="customerEmail"
                type="email"
                placeholder="Email Alumne"
                className="peer block w-full rounded-md border border-gray-200 py-2 pl-10 text-sm outline-2 placeholder:text-gray-500"
              />
              <EnvelopeIcon className="pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-gray-500 peer-focus:text-gray-900" />
            </div>
            {/* error */}
            <div id="email-error" aria-live="polite" aria-atomic="true">
              {state?.errors &&
                state.errors?.customerEmail.map((error: string) => (
                  <p className="mt-2 text-sm text-red-500" key={error}>
                    {error}
                  </p>
                ))}
            </div>
          </div>
        </div>
      </div>
      <div className="mt-6 flex justify-end gap-4">
        <Link
          href="/dashboard/customers"
          className="flex h-10 items-center rounded-lg bg-gray-100 px-4 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-200"
        >
          Cancela
        </Link>
        <Button type="submit">Crear Alumne </Button>
      </div>
    </form>
  );
}
