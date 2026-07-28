import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
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

interface Connection {
  connectionId: string;
  partnerId: string;
  displayName: string;
  shareCycleDates: boolean;
  shareSymptoms: boolean;
  shareMood: boolean;
}

function randomCode(): string {
  // 8 caracteres, suficiente entropía para un código de un solo uso que
  // además expira a los 7 días (ver schema.sql).
  return Array.from({ length: 8 }, () =>
    "ABCDEFGHJKMNPQRSTUVWXYZ23456789"[Math.floor(Math.random() * 32)]
  ).join("");
}

/**
 * Garantiza que haya una sesión (anónima si hace falta) y un perfil. La
 * vinculación de pareja necesita un user_id estable en Supabase; pedir
 * login completo antes de esto sería fricción extra para algo que en el
 * MVP solo hace falta al querer compartir con alguien.
 */
async function ensureSessionAndProfile(): Promise<string> {
  let {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    const { data, error } = await supabase.auth.signInAnonymously();
    if (error) throw error;
    session = data.session;
  }
  const userId = session!.user.id;

  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", userId)
    .maybeSingle();

  if (!profile) {
    await supabase.from("profiles").insert({
      id: userId,
      display_name: "Usuaria de Sintonía",
    });
  }

  return userId;
}

export default function LinkScreen() {
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [redeemCode, setRedeemCode] = useState("");
  const [redeeming, setRedeeming] = useState(false);
  const [connections, setConnections] = useState<Connection[]>([]);

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
    ensureSessionAndProfile()
      .then(async (uid) => {
        setUserId(uid);
        await loadConnections(uid);
      })
      .catch((err) => Alert.alert("No se pudo iniciar sesión", err.message))
      .finally(() => setLoading(false));
  }, [loadConnections]);

  async function generateInvite() {
    if (!userId) return;
    const code = randomCode();
    const { error } = await supabase.from("connection_invites").insert({
      inviter_id: userId,
      code,
    });
    if (error) {
      Alert.alert("Error", error.message);
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
        Alert.alert("Código inválido", "Revisá el código e intentá de nuevo.");
        return;
      }
      if (invite.used_by) {
        Alert.alert("Código ya usado", "Pedí un código nuevo a esa persona.");
        return;
      }
      if (new Date(invite.expires_at) < new Date()) {
        Alert.alert("Código vencido", "Pedí un código nuevo a esa persona.");
        return;
      }
      if (invite.inviter_id === userId) {
        Alert.alert("Ese código es tuyo", "Compartilo con la otra persona, no lo canjees vos.");
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
        Alert.alert("Error", connError?.message ?? "No se pudo crear el vínculo.");
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
      Alert.alert("¡Listo!", "Se vincularon las cuentas.");
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

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color="#7B61FF" />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Invitar a alguien</Text>
        <Text style={styles.body}>
          Generá un código o QR y compartíselo a la persona que querés
          vincular — pareja, amiga, quien sea. No importa cómo se identifique
          ninguna de las dos.
        </Text>
        {inviteCode ? (
          <View style={styles.qrBox}>
            <QRCode value={`sintonia://link/${inviteCode}`} size={180} />
            <Text style={styles.codeText}>{inviteCode}</Text>
          </View>
        ) : (
          <Pressable style={styles.primaryButton} onPress={generateInvite}>
            <Text style={styles.primaryButtonText}>Generar código</Text>
          </Pressable>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Tengo un código</Text>
        <TextInput
          style={styles.codeInput}
          placeholder="ABCD1234"
          autoCapitalize="characters"
          value={redeemCode}
          onChangeText={setRedeemCode}
        />
        <Pressable style={styles.primaryButton} onPress={redeemInvite} disabled={redeeming}>
          <Text style={styles.primaryButtonText}>
            {redeeming ? "Vinculando..." : "Vincular"}
          </Text>
        </Pressable>
      </View>

      {connections.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Personas vinculadas</Text>
          {connections.map((c) => (
            <View key={c.connectionId} style={styles.connectionCard}>
              <Text style={styles.connectionName}>{c.displayName}</Text>
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
            </View>
          ))}
        </View>
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
      <Text style={styles.shareLabel}>{label}</Text>
      <Switch value={value} onValueChange={onChange} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, gap: 24 },
  centered: { flex: 1, alignItems: "center", justifyContent: "center" },
  section: { gap: 10 },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: "#2C1A4D" },
  body: { color: "#555", fontSize: 13, lineHeight: 18 },
  qrBox: { alignItems: "center", gap: 10, paddingVertical: 12 },
  codeText: { fontSize: 20, fontWeight: "700", letterSpacing: 2, color: "#2C1A4D" },
  codeInput: {
    borderWidth: 1,
    borderColor: "#D8CFEF",
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    letterSpacing: 2,
  },
  primaryButton: {
    backgroundColor: "#2C1A4D",
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
  },
  primaryButtonText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  connectionCard: {
    backgroundColor: "#F4F1FA",
    borderRadius: 14,
    padding: 14,
    gap: 8,
  },
  connectionName: { fontSize: 15, fontWeight: "700", color: "#2C1A4D" },
  shareRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  shareLabel: { fontSize: 13, color: "#555" },
});
