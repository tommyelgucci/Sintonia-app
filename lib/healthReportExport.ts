import { Platform } from "react-native";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";

export class PopupBlockedError extends Error {
  constructor() {
    super("El navegador bloqueó la ventana del reporte. Habilitá los pop-ups para exportarlo.");
    this.name = "PopupBlockedError";
  }
}

/**
 * Genera y comparte el PDF. Los dos targets necesitan caminos distintos:
 * expo-print en web ignora el HTML que se le pasa y solo llama a
 * window.print() sobre la página actual (ver node_modules/expo-print/src/
 * ExponentPrint.web.ts) — así que ahí abrimos nosotros una ventana con el
 * HTML del reporte e imprimimos esa. En nativo sí genera un PDF real, que
 * se comparte con el selector de apps del sistema.
 */
export async function exportHealthReport(html: string): Promise<void> {
  if (Platform.OS === "web") {
    const reportWindow = window.open("", "_blank");
    if (!reportWindow) throw new PopupBlockedError();
    reportWindow.document.write(html);
    reportWindow.document.close();
    reportWindow.focus();
    reportWindow.print();
    return;
  }

  const { uri } = await Print.printToFileAsync({ html });
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, {
      mimeType: "application/pdf",
      dialogTitle: "Reporte de ciclo",
    });
  }
}
