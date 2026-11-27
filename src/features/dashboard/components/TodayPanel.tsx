import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Card from '../../../shared/components/Card';
import Appear from '../../../shared/components/Appear';
import Badge from '../../../shared/components/StatusBadge';
import Touchable from '../../../shared/components/Touchable';
import ContactButtons from '../../../shared/components/ContactButtons';
import { formatMoney } from '../../../core/utils/helpers';
import type { DriverDelivery } from '../../../core/api/types';
import { colors } from '../../../shared/theme';

// Stops still to deliver, the one already on the way first.
const OPEN_ORDER = ['IN_TRANSIT', 'PICKED_UP', 'ASSIGNED'];

export function openStops(deliveries: DriverDelivery[]): DriverDelivery[] {
  const rank = (d: DriverDelivery) => OPEN_ORDER.indexOf(d.status.toUpperCase());
  return deliveries
    .filter((d) => rank(d) >= 0)
    .sort((a, b) => rank(a) - rank(b)
      || (a.scheduledDate ?? '').localeCompare(b.scheduledDate ?? '')
      || a.orderInfo.orderNumber.localeCompare(b.orderInfo.orderNumber));
}

interface Props {
  /** The active trip's deliveries; null when they couldn't be loaded. */
  deliveries: DriverDelivery[] | null;
  deliveredToday: number;
  onOpen: (orderId: string) => void;
}

/** What a driver needs first: where to go next, how many stops are left and the cash to collect. */
export default function TodayPanel({ deliveries, deliveredToday, onOpen }: Props) {
  if (!deliveries) {
    return <Text style={styles.note}>Couldn't load your stops. Pull down to try again.</Text>;
  }

  const stops = openStops(deliveries);
  const next = stops[0];
  const toCollect = stops.reduce((sum, d) => sum + Math.max(0, Number(d.orderInfo.outstanding) || 0), 0);

  return (
    <View style={styles.panel}>
      {next ? (
        <Appear>
          <Card padding={16}>
            <Touchable onPress={() => onOpen(next.orderId)} accessibilityRole="button"
              accessibilityLabel={`Next stop: ${next.customer.name}. Open delivery`}>
              <View style={styles.head}>
                <Text style={styles.caption}>NEXT STOP</Text>
                <Badge status={next.status} compact />
              </View>
              <Text style={styles.name}>{next.customer.name}</Text>
              <Text style={styles.address} numberOfLines={2}>{next.customer.address}</Text>
              {next.orderInfo.outstanding > 0 && (
                <Text style={styles.collect}>Collect {formatMoney(next.orderInfo.outstanding)}</Text>
              )}
            </Touchable>
            <ContactButtons phone={next.customer.phone} address={next.customer.address} />
          </Card>
        </Appear>
      ) : (
        <Text style={styles.note}>
          {deliveries.length ? 'No stops left on this trip.' : 'No active trip. Your stops appear here when one starts.'}
        </Text>
      )}

      <View style={styles.strip}>
        <Figure label="Stops left" value={String(stops.length)} />
        <Figure label="Delivered today" value={String(deliveredToday)} />
        <Figure label="To collect" value={formatMoney(toCollect)} wide />
      </View>
    </View>
  );
}

function Figure({ label, value, wide }: { label: string; value: string; wide?: boolean }) {
  return (
    <View style={wide ? styles.figureWide : styles.figure} accessible accessibilityLabel={`${label}: ${value}`}>
      <Text style={styles.figureLabel}>{label}</Text>
      <Text style={styles.figureValue} numberOfLines={1} adjustsFontSizeToFit>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: { gap: 8, marginTop: 8, marginBottom: 8 },
  head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  caption: { fontFamily: 'IBMPlexMono_500Medium', fontSize: 11, color: colors.textTertiary },
  name: { fontFamily: 'IBMPlexSans_500Medium', fontSize: 17, color: colors.textPrimary },
  address: { fontFamily: 'IBMPlexSans_400Regular', fontSize: 14, color: colors.textSecondary, marginTop: 2 },
  collect: { fontFamily: 'IBMPlexMono_500Medium', fontSize: 14, color: colors.textPrimary, marginTop: 8 },
  note: {
    fontFamily: 'IBMPlexSans_400Regular', fontSize: 14, color: colors.textSecondary,
    backgroundColor: colors.surface, borderRadius: 10, padding: 16, marginTop: 8,
  },
  strip: { flexDirection: 'row', gap: 12, backgroundColor: colors.surface, borderRadius: 10, padding: 12 },
  figure: { flex: 1 },
  figureWide: { flex: 1.6 },
  figureLabel: { fontFamily: 'IBMPlexSans_400Regular', fontSize: 12, color: colors.textSecondary },
  figureValue: { fontFamily: 'IBMPlexMono_500Medium', fontSize: 17, color: colors.textPrimary, marginTop: 2 },
});
