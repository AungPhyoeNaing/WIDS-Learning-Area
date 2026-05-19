import { useState, useEffect, useRef } from 'react';

const BG_TYPES = [
  { subtype: 'Probe Req', info: ch => `Phone probing for saved networks (Ch ${ch})` },
  { subtype: 'Beacon', info: () => 'AP beacon advertisement' },
  { subtype: 'ACK', info: () => '802.11 acknowledgment' },
  { subtype: 'RTS', info: () => 'Request to Send' },
  { subtype: 'CTS', info: () => 'Clear to Send' },
  { subtype: 'Probe Res', info: () => 'AP probe response' }
];

const randomMac = () => {
  const octets = [];
  for (let i = 0; i < 6; i++) {
    octets.push(Math.floor(Math.random() * 256).toString(16).padStart(2, '0'));
  }
  return octets.join(':').toUpperCase();
};

const randomRssi = () => -(Math.floor(Math.random() * 50) + 30);

const INTENSITY_SPEEDS = {
  low: { attack: 1200, normal: 3000 },
  medium: { attack: 600, normal: 2000 },
  high: { attack: 200, normal: 1000 }
};

export const useSimulation = (isAttackActive, attackType, sensorOn, sensorChannel, isMitigated, intensity = 'medium') => {
  const [packets, setPackets] = useState([]);
  const totalCaptured = useRef(0);

  const targetChannel = 6;

  useEffect(() => {
    setPackets([]);
    totalCaptured.current = 0;

    let intervalId;
    if (!sensorOn) return;

    const showAttack = isAttackActive && sensorChannel === targetChannel;
    const speeds = INTENSITY_SPEEDS[intensity] || INTENSITY_SPEEDS.medium;
    const intervalSpeed = showAttack ? speeds.attack : speeds.normal;

    intervalId = setInterval(() => {
      const timestamp = new Date().toISOString().split('T')[1].replace('Z', '');
      const rssi = randomRssi();
      let newPacket;

      if (showAttack) {
        newPacket = {
          id: Math.random().toString(36).substr(2, 9),
          timestamp, rssi,
          source: '00:00:00:00:00:00',
          dest: 'FF:FF:FF:FF:FF:FF',
          subtype: 'Beacon',
          info: 'Standard Beacon Frame',
          isAttack: true, isBlocked: false
        };

        let attackerMac = '';

        if (attackType === 'DEAUTH') {
          attackerMac = 'AA:BB:CC:DD:EE:FF';
          newPacket = { ...newPacket, source: attackerMac, dest: '11:22:33:44:55:66', subtype: 'Dot11Deauth', info: 'Reason Code 7 (Deauth)' };
        } else if (attackType === 'ROGUE_AP') {
          attackerMac = '66:55:44:33:22:11';
          newPacket = { ...newPacket, source: attackerMac, dest: 'FF:FF:FF:FF:FF:FF', subtype: 'Dot11Beacon', info: 'SSID: "Corporate_WiFi" (Rogue)' };
        } else if (attackType === 'MAC_SPOOF') {
          attackerMac = '11:22:33:44:55:66';
          newPacket = { ...newPacket, source: attackerMac, dest: 'AA:BB:CC:DD:EE:FF', subtype: 'QoS Data', info: 'Spoofed Data Injection from trusted MAC' };
        }

        if (isMitigated) {
          newPacket = { ...newPacket, subtype: 'BLOCKED', info: `Firewall dropped malicious packet from ${attackerMac}`, isBlocked: true, isAttack: false };
        }
      } else {
        const bg = BG_TYPES[Math.floor(Math.random() * BG_TYPES.length)];
        newPacket = {
          id: Math.random().toString(36).substr(2, 9),
          timestamp, rssi,
          source: randomMac(),
          dest: Math.random() > 0.3 ? randomMac() : 'FF:FF:FF:FF:FF:FF',
          subtype: bg.subtype,
          info: bg.info(sensorChannel),
          isAttack: false, isBlocked: false
        };
      }

      totalCaptured.current += 1;
      setPackets(prev => {
        const updatedPackets = [newPacket, ...prev];
        return updatedPackets.slice(0, 40);
      });
    }, intervalSpeed);

    return () => { if (intervalId) clearInterval(intervalId); };
  }, [isAttackActive, attackType, sensorOn, sensorChannel, isMitigated, intensity]);

  return { packets, totalCaptured: totalCaptured.current };
};
