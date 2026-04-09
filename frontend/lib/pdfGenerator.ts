/**
 * PDF Generation utilities for donation letters and documents
 */

import html2pdf from "html2pdf.js";

/**
 * Generates a PDF from an HTML element and triggers download
 * @param element - The HTML element to convert to PDF
 * @param filename - The filename for the downloaded PDF (without .pdf extension)
 */
export const generateDonationLetterPDF = (
  element: HTMLElement,
  filename: string
): void => {
  const element_copy = element.cloneNode(true) as HTMLElement;

  const options = {
    margin: 10,
    filename: `${filename}.pdf`,
    image: { type: "jpeg" as const, quality: 0.98 },
    html2canvas: { scale: 2 },
    jsPDF: {
      orientation: "portrait" as const,
      unit: "mm" as const,
      format: "a4" as const,
    },
  };

  html2pdf().set(options).from(element_copy).save();
};

/**
 * Converts an HTML element to a PDF blob for upload or further processing
 * @param element - The HTML element to convert to PDF
 * @returns Promise that resolves to a Blob containing the PDF
 */
export const convertLetterToBlob = (element: HTMLElement): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    try {
      const element_copy = element.cloneNode(true) as HTMLElement;

      const options = {
        margin: 10,
        filename: "donation-letter.pdf",
        image: { type: "jpeg" as const, quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: {
          orientation: "portrait" as const,
          unit: "mm" as const,
          format: "a4" as const,
        },
      };

      const pdf = html2pdf().set(options);

      pdf
        .from(element_copy)
        .outputPdf("blob")
        .then((blob: Blob) => {
          resolve(blob);
        })
        .catch((error: Error) => {
          reject(new Error(`Failed to generate PDF: ${error.message}`));
        });
    } catch (error) {
      reject(
        new Error(
          `Failed to convert letter to blob: ${
            error instanceof Error ? error.message : String(error)
          }`
        )
      );
    }
  });
};
