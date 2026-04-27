package com.carpenter.service;

import com.carpenter.model.Quote;
import com.carpenter.model.QuoteItem;
import com.lowagie.text.*;
import com.lowagie.text.Font;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import java.awt.*;
import java.io.ByteArrayOutputStream;
import java.io.IOException;

@Service
@Slf4j
public class PdfService {

    public byte[] generateQuotePdf(Quote quote) throws IOException {
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        Document document = new Document(PageSize.A4);
        
        try {
            PdfWriter.getInstance(document, baos);
            document.open();

            // 1. Branding Header
            Font titleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 24, Color.DARK_GRAY);
            Paragraph brand = new Paragraph("FURNIX BESPOKE", titleFont);
            brand.setAlignment(Element.ALIGN_RIGHT);
            document.add(brand);

            Paragraph tagline = new Paragraph("Master Craftsmanship & Design", FontFactory.getFont(FontFactory.HELVETICA, 10, Color.GRAY));
            tagline.setAlignment(Element.ALIGN_RIGHT);
            document.add(tagline);
            
            document.add(new Paragraph("\n"));

            // 2. Quote Info
            Font headerFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 18, Color.BLACK);
            document.add(new Paragraph("QUOTE #" + quote.getId(), headerFont));
            document.add(new Paragraph("Date: " + java.time.LocalDate.now()));
            document.add(new Paragraph("Customer: " + quote.getInquiry().getName()));
            document.add(new Paragraph("\n\n"));

            // 3. Table of Items
            PdfPTable table = new PdfPTable(4);
            table.setWidthPercentage(100);
            table.setSpacingBefore(10f);
            table.setSpacingAfter(10f);

            // Table Header
            String[] headers = {"Item", "Description", "Qty", "Total"};
            for (String h : headers) {
                PdfPCell cell = new PdfPCell(new Phrase(h, FontFactory.getFont(FontFactory.HELVETICA_BOLD)));
                cell.setBackgroundColor(new Color(245, 245, 245));
                cell.setPadding(8);
                table.addCell(cell);
            }

            // Table Content
            for (QuoteItem item : quote.getItems()) {
                table.addCell(item.getName());
                table.addCell(item.getDescription() != null ? item.getDescription() : "");
                table.addCell(String.valueOf(item.getQuantity()));
                table.addCell("Rs. " + String.format("%.2f", item.getTotalPrice()));
            }
            document.add(table);

            // 4. Totals
            Paragraph totals = new Paragraph();
            totals.setAlignment(Element.ALIGN_RIGHT);
            totals.add(new Phrase("Subtotal: Rs. " + String.format("%.2f", quote.getSubtotal()) + "\n"));
            totals.add(new Phrase("Discount: - Rs. " + String.format("%.2f", quote.getDiscount()) + "\n"));
            totals.add(new Phrase("Tax: Rs. " + String.format("%.2f", quote.getTax()) + "\n"));
            totals.add(new Phrase("TOTAL AMOUNT: Rs. " + String.format("%.2f", quote.getTotalAmount()), FontFactory.getFont(FontFactory.HELVETICA_BOLD, 14, Color.RED)));
            document.add(totals);

            // 5. Terms & Signature
            document.add(new Paragraph("\n\nTerms & Conditions:", FontFactory.getFont(FontFactory.HELVETICA_BOLD, 12)));
            Paragraph terms = new Paragraph(quote.getNotes() != null ? quote.getNotes() : "50% advance required to commence production. Valid for 15 days.", FontFactory.getFont(FontFactory.HELVETICA, 10));
            document.add(terms);

            document.close();
        } catch (DocumentException e) {
            log.error("PDF generation failed", e);
            throw new IOException("PDF generation failed: " + e.getMessage());
        }

        return baos.toByteArray();
    }
}
