/**
 * Re-export the existing booking-based invoice template under its correct
 * name: "Pro-forma Invoice". The template itself is unchanged — this file
 * exists so the import path makes the document's purpose clear.
 *
 * Booking → Pro-forma Invoice (client-facing payment summary of a booking)
 * Invoice model → Formal Invoice (line-item GST invoice attached to a lead)
 */
export { InvoiceInput as ProFormaInvoiceInput, InvoiceDocument as ProFormaInvoiceDocument } from './invoice';
