import { useCallback, useEffect, useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import QRCode from "react-native-qrcode-svg";
import { supabase } from "@/lib/supabase";
import { ensureProfile } from "@/lib/auth";
import { useAuth } from "@/lib/useAuth";
import { notify } from "@/lib/notify";
import { colors, radius, space, type } from "@/lib/theme";
import { Card, Eyebrow, FadeInView, PrimaryButton } from "@/lib/ui";
import { ChevronRightIcon, ShieldIcon } from "@/lib/icons";

interface Connection {
  connectionId: string;
  partnerId: string;
  displayName: string;
  shareCycleDates: boolean;
  shareSymptoms: boolean;
  shareMood: boolean;
}

function randomCode(): string {
  // 8 caracteres de un alfabeto sin I/O/0/1 para que no se confundan al
  // dictarlo. Es de un solo uso y vence a los 7 días (ver schema.sql).
  return Array.from({ length: 8 }, () =>
    "ABCDEFGHJKMNPQRSTUVWXYZ23456789"[Math.floor(Math.random() * 31)]
  ).join("");
}

export default function LinkScreen() {
  const router = useRouter();
  // Al abrirse vía el QR (sintonia://link?code=ABCD1234), expo-router
  // resuelve "/link" y expone "code" acá.
  const { code: incomingCode } = useLocalSearchParams<{ code?: string }>();
  const { state: auth, loading: authLoading } = useAuth();
  const userId = auth?.userId ?? null;
  const [loading, setLoading] = useState(true);
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [redeemCode, setRedeemCode] = useState("");
  const [redeeming, setRedeeming] = useState(false);
  const [connections, setConnections] = useState<Connection[]>([]);

  useEffect(() => {
    if (incomingCode) setRedeemCode(incomingCode.toUpperCase());
  }, [incomingCode]);

  const loadConnections = useCallback(async (uid: string) => {
    const { data: conns } = await supabase
      .from("connections")
      .select("id, requester_id, addressee_id")
      .eq("status", "accepted")
      .or(`requester_id.eq.${uid},addressee_id.eq.${uid}`);
    if (!conns || conns.length === 0) {
      setConnections([]);
      return;
    }

    const partnerIds = conns.map((c) =>
      c.requester_id === uid ? c.addressee_id : c.requester_id
    );
    const [{ data: profiles }, { data: settings }] = await Promise.all([
      supabase.from("profiles").select("id, display_name").in("id", partnerIds),
      supabase
        .from("share_settings")
        .select("connection_id, share_cycle_dates, share_symptoms, share_mood")
        .eq("user_id", uid)
        .in(
          "connection_id",
          conns.map((c) => c.id)
        ),
    ]);

    setConnections(
      conns.map((c) => {
        const partnerId = c.requester_id === uid ? c.addressee_id : c.requester_id;
        const profile = profiles?.find((p) => p.id === partnerId);
        const setting = settings?.find((s) => s.connection_id === c.id);
        return {
          connectionId: c.id,
          partnerId,
          displayName: profile?.display_name ?? "Sin nombre",
          shareCycleDates: setting?.share_cycle_dates ?? true,
          shareSymptoms: setting?.share_symptoms ?? false,
          shareMood: setting?.share_mood ?? false,
        };
      })
    );
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!userId) {
      setLoading(false);
      return;
    }
    // El perfil hace falta para que la otra persona vea un nombre; se crea
    // acá y no al entrar a la cuenta porque recién en esta pantalla se usa.
    ensureProfile(userId)
      .then(() => loadConnections(userId))
      .catch((err) => notify("No se pudieron cargar tus vínculos", err.message))
      .finally(() => setLoading(false));
  }, [authLoading, userId, loadConnections]);

  async function generateInvite() {
    if (!userId) return;
    const code = randomCode();
    const { error } = await supabase
      .from("connection_invites")
      .insert({ inviter_id: userId, code });
    if (error) {
      notify("Error", error.message);
      return;
    }
    setInviteCode(code);
  }

  async function redeemInvite() {
    if (!userId || !redeemCode.trim()) return;
    setRedeeming(true);
    try {
      const code = redeemCode.trim().toUpperCase();
      const { data: invite, error: inviteError } = await supabase
        .from("connection_invites")
        .select("id, inviter_id, expires_at, used_by")
        .eq("code", code)
        .maybeSingle();

      if (inviteError || !invite) {
        notify("Código inválido", "Revisá el código e intentá de nuevo.");
        return;
      }
      if (invite.used_by) {
        notify("Código ya usado", "Pedile un código nuevo a esa persona.");
        return;
      }
      if (new Date(invite.expires_at) < new Date()) {
        notify("Código vencido", "Pedile un código nuevo a esa persona.");
        return;
      }
      if (invite.inviter_id === userId) {
        notify("Ese código es tuyo", "Compartilo con la otra persona, no lo canjees vos.");
        return;
      }

      const { data: connection, error: connError } = await supabase
        .from("connections")
        .insert({
          requester_id: invite.inviter_id,
          addressee_id: userId,
          status: "accepted",
          responded_at: new Date().toISOString(),
        })
        .select("id")
        .single();
      if (connError || !connection) {
        notify("Error", connError?.message ?? "No se pudo crear el vínculo.");
        return;
      }

      // share_settings de ambas partes las crea un trigger en la base
      // (ver schema.sql) — el cliente no tiene permiso de RLS para
      // insertar la fila de la persona que invitó.
      await supabase
        .from("connection_invites")
        .update({ used_by: userId, used_at: new Date().toISOString() })
        .eq("id", invite.id);

      setRedeemCode("");
      await loadConnections(userId);
      notify("Listo", "Se vincularon las cuentas.");
    } finally {
      setRedeeming(false);
    }
  }

  async function updateShare(
    connectionId: string,
    field: "share_cycle_dates" | "share_symptoms" | "share_mood",
    value: boolean
  ) {
    if (!userId) return;
    await supabase
      .from("share_settings")
      .update({ [field]: value, updated_at: new Date().toISOString() })
      .eq("connection_id", connectionId)
      .eq("user_id", userId);
    await loadConnections(userId);
  }

  if (loading || authLoading) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator color={colors.clay} />
      </View>
    );
  }

  // Vincularse es lo único de la app que necesita servidor: hacen falta dos
  // dispositivos que se reconozcan. Todo lo demás sigue andando sin cuenta.
  if (!userId) {
    return (
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <FadeInView>
          <Eyebrow>Vincular</Eyebrow>
          <Text style={[type.title, styles.pageTitle]}>Hace falta tu mail</Text>
          <Text style={[type.body, { color: colors.inkSoft }]}>
            Para compartir con alguien, las dos partes necesitan una cuenta: es lo
            que permite que el vínculo siga existiendo si cambiás de teléfono.
          </Text>
        </FadeInView>

        <Card index={1}>
          <Eyebrow>Solo para esto</Eyebrow>
          <Text style={[type.body, { color: colors.inkSoft, marginVertical: space.md }]}>
            El resto de la app —tu ciclo, tus registros, el calendario, el reporte—
            funciona sin cuenta y sin conexión, como hasta ahora.
          </Text>
          <PrimaryButton label="Crear mi cuenta" onPress={() => router.push("/account")} />
        </Card>
      </ScrollView>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
      <FadeInView>
        <Eyebrow>Vincular</Eyebrow>
        <Text style={[type.title, styles.pageTitle]}>Compartir con quien vos quieras</Text>
        <Text style={[type.body, { color: colors.inkSoft }]}>
          Pareja, amiga, hermana, quien sea. No importa cómo se identifique ninguna
          de las dos.
        </Text>
      </FadeInView>

      <FadeInView index={1}>
        <View style={styles.privacyRow}>
          <ShieldIcon size={18} color={colors.folicular} />
          <Text style={[type.bodySmall, { color: colors.inkSoft, flex: 1 }]}>
            Arranca compartiendo solo las fechas del ciclo. Los síntomas y el ánimo
            los activás vos, si querés.
          </Text>
        </View>
      </FadeInView>

      {auth?.status === "anonymous" && (
        // Quien se vinculó con una versión anterior sigue funcionando igual,
        // pero sus vínculos se pierden con el teléfono. Se avisa acá, que es
        // donde están, en vez de obligarla a migrar de golpe.
        <FadeInView index={2}>
          <Pressable
            onPress={() => router.push("/account")}
            style={({ pressed }) => [styles.warnRow, pressed && { opacity: 0.9 }]}
          >
            <Text style={[type.bodySmall, { color: colors.ink, flex: 1 }]}>
              Tus vínculos viven solo en este teléfono. Poné tu mail para no
              perderlos si lo cambiás.
            </Text>
            <ChevronRightIcon size={16} color={colors.clay} />
          </Pressable>
        </FadeInView>
      )}

      <Card index={2}>
        <Eyebrow>Invitar</Eyebrow>
        {inviteCode ? (
          <View style={styles.qrBox}>
            <View style={styles.qrFrame}>
              <QRCode
                value={`sintonia://link?code=${inviteCode}`}
                size={160}
                color={colors.ink}
                backgroundColor={colors.surface}
              />
            </View>
            <Text style={[type.title, styles.codeText]}>{inviteCode}</Text>
            <Text style={[type.bodySmall, { color: colors.inkFaint }]}>
              Vence en 7 días · un solo uso
            </Text>
          </View>
        ) : (
          <>
            <Text style={[type.body, { color: colors.inkSoft, marginVertical: space.md }]}>
              Generá un código y compartíselo. Se vincula cuando lo canjee.
            </Text>
            <PrimaryButton label="Generar código" onPress={generateInvite} />
          </>
        )}
      </Card>

      <Card index={3}>
        <Eyebrow>Tengo un código</Eyebrow>
        <TextInput
          style={[styles.codeInput, type.body]}
          placeholder="ABCD1234"
          placeholderTextColor={colors.inkFaint}
          autoCapitalize="characters"
          value={redeemCode}
          onChangeText={setRedeemCode}
        />
        <PrimaryButton
          label={redeeming ? "Vinculando..." : "Vincular"}
          onPress={redeemInvite}
          disabled={redeeming}
        />
      </Card>

      {connections.length > 0 && (
        <>
          <FadeInView index={4}>
            <Eyebrow>Personas vinculadas</Eyebrow>
          </FadeInView>

          {connections.map((c, i) => (
            <Card key={c.connectionId} index={5 + i}>
              <Pressable
                onPress={() =>
                  router.push({
                    pathname: "/partner",
                    params: { partnerId: c.partnerId, displayName: c.displayName },
                  })
                }
                style={({ pressed }) => [styles.partnerRow, pressed && { opacity: 0.82 }]}
              >
                <Text style={[type.cardTitle, { color: colors.ink, flex: 1 }]}>
                  {c.displayName}
                </Text>
                <Text style={[type.bodySmall, { color: colors.clay }]}>Ver su ciclo</Text>
                <ChevronRightIcon size={16} color={colors.clay} />
              </Pressable>

              <View style={styles.divider} />

              <Text style={[type.bodySmall, { color: colors.inkFaint, marginBottom: space.sm }]}>
                Qué ve esta persona de vos
              </Text>
              <ShareRow
                label="Fechas de ciclo"
                value={c.shareCycleDates}
                onChange={(v) => updateShare(c.connectionId, "share_cycle_dates", v)}
              />
              <ShareRow
                label="Síntomas"
                value={c.shareSymptoms}
                onChange={(v) => updateShare(c.connectionId, "share_symptoms", v)}
              />
              <ShareRow
                label="Ánimo"
                value={c.shareMood}
                onChange={(v) => updateShare(c.connectionId, "share_mood", v)}
              />
            </Card>
          ))}
        </>
      )}
    </ScrollView>
  );
}

function ShareRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <View style={styles.shareRow}>
      <Text style={[type.body, { color: colors.ink }]}>{label}</Text>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ false: colors.line, true: colors.folicular }}
        thumbColor={colors.surface}
      />
    </View>
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
  privacyRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.md,
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.md,
    padding: space.md,
  },
  warnRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.md,
    backgroundColor: "#F5E9E3",
    borderRadius: radius.md,
    padding: space.md,
  },
  qrBox: { alignItems: "center", gap: space.sm, paddingVertical: space.lg },
  qrFrame: {
    padding: space.lg,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.line,
  },
  codeText: { color: colors.ink, letterSpacing: 3, marginTop: space.sm },
  codeInput: {
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.md,
    padding: space.md,
    letterSpacing: 3,
    color: colors.ink,
    marginVertical: space.md,
  },
  partnerRow: { flexDirection: "row", alignItems: "center", gap: space.sm },
  divider: { height: 1, backgroundColor: colors.line, marginVertical: space.lg },
  shareRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: space.xs,
  },
});
