import { Alert, Platform } from "react-native";

/**
 * Diálogos que funcionan en los tres targets.
 *
 * Alert.alert es un no-op completo en react-native-web: el módulo que
 * trae el paquete es literalmente `class Alert { static alert() {} }`. Un
 * aviso perdido es molesto; una confirmación destructiva perdida se lleva
 * puesta la acción entera, porque la lógica vive en el callback que nunca
 * se dispara. Por eso todo diálogo pasa por acá.
 */

export function notify(title: string, message: string) {
  if (Platform.OS === "web") {
    window.alert(message ? `${title}\n\n${message}` : title);
    return;
  }
  Alert.alert(title, message);
}

export function confirmDestructive(
  title: string,
  message: string,
  onConfirm: () => void,
  confirmLabel = "Salir"
) {
  if (Platform.OS === "web") {
    if (window.confirm(`${title}\n\n${message}`)) onConfirm();
    return;
  }
  Alert.alert(title, message, [
    { text: "Cancelar", style: "cancel" },
    { text: confirmLabel, style: "destructive", onPress: onConfirm },
  ]);
}
