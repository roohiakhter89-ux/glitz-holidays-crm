import * as React from 'react';
import { Injectable } from '@nestjs/common';
import { renderToBuffer } from '@react-pdf/renderer';
import { QuotationDocument, QuotationInput } from './templates/quotation';
import { InvoiceDocument, InvoiceInput } from './templates/invoice';

/**
 * PDF rendering service. Pure: it takes a DTO shape and returns bytes.
 * Doesn't know about Prisma; that mapping happens in whichever controller
 * calls it. That keeps templates independent of the ORM and makes them
 * trivial to unit-test with hand-written fixtures.
 */
@Injectable()
export class PdfService {
  // The `renderToBuffer` type wants a `ReactElement<DocumentProps>` — our
  // wrapper components produce one at runtime, but @react-pdf's generics
  // won't infer that through a function component's props. Local cast.
  async renderQuotation(input: QuotationInput): Promise<Buffer> {
    return renderToBuffer(
      React.createElement(QuotationDocument, { q: input }) as any,
    );
  }

  async renderInvoice(input: InvoiceInput): Promise<Buffer> {
    return renderToBuffer(
      React.createElement(InvoiceDocument, { b: input }) as any,
    );
  }
}
