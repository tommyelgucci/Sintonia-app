import { useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { sendEmailCode, signOut, verifyEmailCode } from "@/lib/auth";
import {
  isValidEmail,
  isValidOtpCode,
  normalizeEmail,
  OTP_LENGTH,
  type CodeMode,
} from "@/lib/authRules";
import { useAuth } from "@/lib/useAuth";
import { confirmDestructive, notify } from "@/lib/notify";
import { colors, radius, space, type } from "@/lib/theme";
import { Card, Eyebrow, FadeInView, PrimaryButton, QuietButton } from "@/lib/ui";

type Step = "idle" | "code";

export default function AccountScreen() {
  const { state, loading, reload } = useAuth();
  const [step, setStep] = useState<Step>("idle");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [mode, setMode] = useState<CodeMode>("signIn");
  const [busy, setBusy] = useState(false);

  if (loading || !state) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator color={colors.clay} />
      </View>
    );
  }

  async function requestCode() {
    if (!isValidEmail(email)) {
      notify("Revisá el mail", "Escribilo completo, con el arroba y el punto.");
      return;
    }
    setBusy(true);
    try {
      setMode(await sendEmailCode(email));
      setStep("code");
    } catch (error) {
      notify("No se pudo enviar", (error as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function confirmCode() {
    if (!isValidOtpCode(code)) {
      notify("Código incompleto", `Son ${OTP_LENGTH} números, sin espacios.`);
      return;
    }
    setBusy(true);
    try {
      await verifyEmailCode(email, code, mode);
      setStep("idle");
      setCode("");
      await reload();
      notify("Listo", "Tu cuenta quedó asociada a ese mail.");
    } catch (error) {
      notify("No se pudo confirmar", (error as Error).message);
    } finally {
      setBusy(false);
    }
  }

  function confirmSignOut() {
    confirmDestructive(
      "Cerrar sesión",
      "Tus ciclos y registros quedan en este teléfono, no se borra nada. Lo que se corta es la conexión con las personas vinculadas, hasta que vuelvas a entrar con el mismo mail.",
      async () => {
        await signOut();
        await reload();
      },
      "Cerrar sesión"
    );
  }

  if (step === "code") {
    return (
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <FadeInView>
          <Eyebrow>Paso 2 de 2</Eyebrow>
          <Text style={[type.title, styles.pageTitle]}>Escribí el código</Text>
          <Text style={[type.body, { color: colors.inkSoft }]}>
            Te mandamos {OTP_LENGTH} números a {normalizeEmail(email)}. Puede tardar
            un minuto en llegar; si no aparece, mirá en spam.
          </Text>
        </FadeInView>

        <Card index={1}>
          <TextInput
            style={[styles.codeInput, type.title]}
            placeholder="000000"
            placeholderTextColor={colors.inkFaint}
            keyboardType="number-pad"
            maxLength={OTP_LENGTH}
            value={code}
            onChangeText={setCode}
            autoFocus
          />
          <PrimaryButton
            label={busy ? "Confirmando..." : "Confirmar"}
            onPress={confirmCode}
            disabled={busy}
          />
        </Card>

        <QuietButton
          label="Usar otro mail"
          onPress={() => {
            setStep("idle");
            setCode("");
          }}
        />
      </ScrollView>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
      <FadeInView>
        <Eyebrow>Cuenta</Eyebrow>
        <Text style={[type.title, styles.pageTitle]}>
          {state.status === "email" ? "Tu cuenta" : "Solo si querés vincularte"}
        </Text>
        <Text style={[type.body, { color: colors.inkSoft }]}>
          La app funciona entera sin cuenta. El mail sirve para una sola cosa: que
          el vínculo con otra persona sobreviva si cambiás de teléfono.
        </Text>
      </FadeInView>

      {state.status === "email" ? (
        <>
          <Card index={1}>
            <Eyebrow>Entraste como</Eyebrow>
            <Text style={[type.section, styles.cardHeading]}>{state.email}</Text>
            <Text style={[type.bodySmall, { color: colors.inkSoft }]}>
              Desde otro teléfono, entrá con este mismo mail y vas a recuperar tus
              vínculos.
            </Text>
          </Card>
          <QuietButton label="Cerrar sesión" onPress={confirmSignOut} />
        </>
      ) : (
        <>
          {state.status === "anonymous" && (
            <Card index={1}>
              <Eyebrow>Ojo con esto</Eyebrow>
              <Text style={[type.section, styles.cardHeading]}>
                Tus vínculos viven solo en este teléfono
              </Text>
              <Text style={[type.body, { color: colors.inkSoft }]}>
                Te vinculaste sin cuenta, así que si borrás la app o cambiás de
                teléfono se pierden. Poniendo tu mail acá abajo quedan asociados a
                vos, sin perder ninguno de los que ya tenés.
              </Text>
            </Card>
          )}

          <Card index={2}>
            <Eyebrow>{state.status === "anonymous" ? "Asegurar" : "Paso 1 de 2"}</Eyebrow>
            <Text style={[type.section, styles.cardHeading]}>Tu mail</Text>
            <Text style={[type.bodySmall, { color: colors.inkSoft }]}>
              Te llega un código de {OTP_LENGTH} números. No hay contraseña que
              recordar.
            </Text>
            <TextInput
              style={[styles.input, type.body]}
              placeholder="vos@correo.com"
              placeholderTextColor={colors.inkFaint}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              value={email}
              onChangeText={setEmail}
            />
            <PrimaryButton
              label={busy ? "Enviando..." : "Enviarme el código"}
              onPress={requestCode}
              disabled={busy}
            />
          </Card>

          <Card index={3}>
            <Eyebrow>Qué se guarda</Eyebrow>
            <Text style={[type.body, { color: colors.inkSoft, marginTop: space.sm }]}>
              En el servidor queda tu mail y lo que elijas compartir con cada
              persona vinculada. Tus síntomas, tu ánimo y tus notas no salen del
              teléfono salvo que los habilites vos, de a una conexión por vez.
            </Text>
          </Card>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    padding: space.lg,
    gap: space.md,
    paddingBottom: space.xxl,
    backgroundColor: colors.canvas,
  },
  loadingScreen: {
    flex: 1,
    backgroundColor: colors.canvas,
    alignItems: "center",
    justifyContent: "center",
  },
  pageTitle: { color: colors.ink, marginTop: space.xs, marginBottom: space.xs },
  cardHeading: { color: colors.ink, marginTop: space.xs, marginBottom: space.sm },
  input: {
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.md,
    padding: space.md,
    color: colors.ink,
    marginVertical: space.md,
  },
  codeInput: {
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.md,
    padding: space.md,
    color: colors.ink,
    letterSpacing: 8,
    textAlign: "center",
    marginBottom: space.md,
  },
});
