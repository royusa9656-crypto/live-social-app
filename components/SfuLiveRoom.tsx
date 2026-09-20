import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { AudioSession, LiveKitRoom, useTracks, VideoTrack, useLocalParticipant, useRoomContext } from '@livekit/react-native';
import { Track } from 'livekit-client';
import { fetchLiveKitToken } from '../services/livekit';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'https://live-social-app-five.vercel.app';
const LIVEKIT_URL = process.env.EXPO_PUBLIC_LIVEKIT_URL || '';

export default function SfuLiveRoom({ roomName, identity, role, onClose }: { roomName:string; identity:string; role:'host'|'guest'; onClose:()=>void }) {
  const [token, setToken] = useState<string>();
  const [wsUrl, setWsUrl] = useState(LIVEKIT_URL);
  const [error, setError] = useState('');

  useEffect(() => {
    AudioSession.startAudioSession();
    let mounted = true;
    fetchLiveKitToken(API_BASE_URL, roomName, identity, role)
      .then(data => { if (mounted) { setToken(data.token); setWsUrl(data.wsUrl); } })
      .catch(e => mounted && setError(e?.message || 'Could not get live room token.'));
    return () => { mounted = false; AudioSession.stopAudioSession(); };
  }, [roomName, identity, role]);

  if (error) return <View style={styles.center}><Text style={styles.error}>{error}</Text><Pressable onPress={onClose} style={styles.button}><Text style={styles.buttonText}>Back</Text></Pressable></View>;
  if (!token || !wsUrl) return <View style={styles.center}><Text style={styles.loading}>Connecting to live room…</Text></View>;

  return <LiveKitRoom serverUrl={wsUrl} token={token} connect audio video options={{ adaptiveStream: true, dynacast: true }} style={styles.room}>
    <RoomGrid role={role} onClose={onClose} />
  </LiveKitRoom>;
}

function RoomGrid({ role, onClose }:{role:'host'|'guest';onClose:()=>void}) {
  const room = useRoomContext();
  const tracks = useTracks([Track.Source.Camera, Track.Source.ScreenShare], { onlySubscribed: false });
  const { isMicrophoneEnabled, isCameraEnabled, localParticipant } = useLocalParticipant();
  const [muted, setMuted] = useState(!isMicrophoneEnabled);

  useEffect(() => { setMuted(!isMicrophoneEnabled); }, [isMicrophoneEnabled]);
  const cameraTracks = useMemo(() => tracks.filter(t => t.source === Track.Source.Camera).slice(0,7), [tracks]);

  return <View style={styles.room}>
    <View style={styles.header}><Text style={styles.live}>● LIVE</Text><Text style={styles.roomText}>{room.name} · {role.toUpperCase()}</Text><Pressable onPress={onClose}><Text style={styles.close}>×</Text></Pressable></View>
    <View style={styles.grid}>
      {cameraTracks.map((t:any, i:number) => <View key={t.publication?.trackSid || `${t.participant?.identity}-${i}`} style={styles.tile}><VideoTrack trackRef={t} style={styles.video} /><View style={styles.label}><Text style={styles.labelText}>{t.participant?.identity || 'Participant'}</Text></View></View>)}
      {Array.from({length: Math.max(0, 7-cameraTracks.length)}).map((_,i)=><View key={`empty-${i}`} style={[styles.tile, styles.empty]}><Text style={styles.emptyText}>+ Invite</Text></View>)}
    </View>
    <View style={styles.controls}>
      <Pressable style={styles.control} onPress={() => localParticipant.setMicrophoneEnabled(!isMicrophoneEnabled)}><Text style={styles.controlText}>{isMicrophoneEnabled ? 'Mic' : 'Muted'}</Text></Pressable>
      <Pressable style={styles.control} onPress={() => localParticipant.setCameraEnabled(!isCameraEnabled)}><Text style={styles.controlText}>{isCameraEnabled ? 'Camera' : 'Camera Off'}</Text></Pressable>
      <Pressable style={styles.control} onPress={() => room.disconnect()}><Text style={styles.end}>Leave</Text></Pressable>
    </View>
  </View>;
}

const styles=StyleSheet.create({room:{flex:1,backgroundColor:'#050505'},center:{flex:1,backgroundColor:'#050505',alignItems:'center',justifyContent:'center',padding:24},loading:{color:'#fff',fontSize:17},error:{color:'#ff6d9d',textAlign:'center',marginBottom:18},button:{paddingHorizontal:22,paddingVertical:12,borderRadius:22,backgroundColor:'#ff2d72'},buttonText:{color:'#fff',fontWeight:'800'},header:{height:64,paddingHorizontal:14,flexDirection:'row',alignItems:'center',gap:10},live:{color:'#ff3b78',fontWeight:'900'},roomText:{color:'#ddd',flex:1},close:{color:'#fff',fontSize:30},grid:{flex:1,flexDirection:'row',flexWrap:'wrap'},tile:{width:'33.333%',height:'25%',borderWidth:1,borderColor:'#1e1e1e',backgroundColor:'#111',position:'relative'},video:{width:'100%',height:'100%'},label:{position:'absolute',left:6,bottom:6,paddingHorizontal:7,paddingVertical:4,borderRadius:10,backgroundColor:'#000b'},labelText:{color:'#fff',fontSize:10,fontWeight:'700'},empty:{alignItems:'center',justifyContent:'center'},emptyText:{color:'#777'},controls:{position:'absolute',bottom:16,left:14,right:14,flexDirection:'row',gap:8,justifyContent:'center'},control:{paddingHorizontal:16,paddingVertical:12,borderRadius:22,backgroundColor:'#191919'},controlText:{color:'#fff',fontWeight:'700'},end:{color:'#ff6b96',fontWeight:'900'}});
