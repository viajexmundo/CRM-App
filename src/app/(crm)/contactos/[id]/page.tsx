import { notFound } from "next/navigation";
import { getContact } from "@/lib/queries/contacts";
import { ContactDetailClient } from "@/components/contactos/contact-detail-client";

interface ContactDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function ContactDetailPage({
  params,
}: ContactDetailPageProps) {
  const { id } = await params;
  const contact = await getContact(id);

  if (!contact) {
    notFound();
  }

  const mappedContact = {
    ...contact,
    activities: contact.activities?.map((a) => ({
      ...a,
      title: a.title ?? "",
    })),
  };

  return <ContactDetailClient contact={mappedContact} />;
}
