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
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteUsers, setInviteUsers] = useState<any[]>([]);
  const [inviteLoading, setInviteLoading] = useState(false);


  const tracks = useTracks([Track.Source.Camera, Track.Source.ScreenShare], { onlySubscribed: false });
  const { isMicrophoneEnabled, isCameraEnabled, localParticipant } = useLocalParticipant();
  const [muted, setMuted] = useState(!isMicrophoneEnabled);

  useEffect(() => { setMuted(!isMicrophoneEnabled); }, [isMicrophoneEnabled]);

  useEffect(() => {
    if (!inviteOpen) return;

    const loadInviteUsers = async () => {
      try {
        setInviteLoading(true);

        const response = await fetch(
          'https://live-social-app-five.vercel.app/api/users/list'
        );

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result?.error || 'Could not load users.');
        }

        setInviteUsers(result.users || []);
      } catch (error) {
        console.error('Invite users error:', error);
        setInviteUsers([]);
      } finally {
        setInviteLoading(false);
      }
    };

    loadInviteUsers();
  }, [inviteOpen]);
  const cameraTracks = useMemo(() => tracks.filter(t => t.source === Track.Source.Camera).slice(0,7), [tracks]);
  const participants = Array.from(room.remoteParticipants.values()).filter(
    (participant) => participant.identity !== localParticipant.identity
  );

  return <View style={styles.room}>
    <View style={styles.header}><Text style={styles.live}>● LIVE</Text><Text style={styles.roomText}>{room.name} · {role.toUpperCase()}</Text><Pressable onPress={onClose}><Text style={styles.close}>×</Text></Pressable></View>
    <View style={styles.grid}>
      {cameraTracks.map((t:any, i:number) => <View key={t.publication?.trackSid || `${t.participant?.identity}-${i}`} style={styles.tile}><VideoTrack trackRef={t} style={styles.video} /><View style={styles.label}><Text style={styles.labelText}>{t.participant?.identity || 'Participant'}</Text></View></View>)}
      {Array.from({length: Math.max(0, 7-cameraTracks.length)}).map((_,i)=><Pressable key={`empty-${i}`} style={[styles.tile, styles.empty]} onPress={() => setInviteOpen(true)}>
  <Text style={styles.emptyText}>+ Invite</Text>
</Pressable>)}
    </View>


    {inviteOpen && (
      <View style={styles.inviteOverlay}>
        <View style={styles.invitePanel}>
          <View style={styles.inviteHeader}>
            <Text style={styles.inviteTitle}>Invite Guest</Text>
            <Pressable onPress={() => setInviteOpen(false)}>
              <Text style={styles.inviteClose}>×</Text>
            </Pressable>
          </View>

          <Text style={styles.inviteSubtitle}>Invite someone to join your live</Text>

          {inviteLoading ? (
            <Text style={styles.inviteSubtitle}>Loading users...</Text>
          ) : inviteUsers.length === 0 ? (
            <Text style={styles.inviteSubtitle}>No users found</Text>
          ) : inviteUsers.map((user) => (
            <View key={user.id} style={styles.userRow}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{(user.display_name || user.username || '?').charAt(0).toUpperCase()}</Text>
              </View>
              <Text style={styles.userName}>{user.display_name || user.username}</Text>
              <Pressable
                style={styles.inviteButton}
                onPress={async () => {
                  try {
                    const response = await fetch(
                      'https://live-social-app-five.vercel.app/api/invites/create',
                      {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          roomName: room.name,
                          inviterId: localParticipant.identity,
                          inviteeId: user.id
                        })
                      }
                    );

                    const result = await response.json();

                    if (!response.ok) {
                      throw new Error(result?.error || 'Could not send invite.');
                    }

                    alert(`Invitation sent to ${user.display_name || user.username}`);
                    setInviteOpen(false);
                  } catch (error) {
                    console.error('Invite error:', error);
                    alert('Could not send invitation.');
                  }
                }}
              >
                <Text style={styles.inviteButtonText}>Invite</Text>
              </Pressable>
            </View>
          ))}
        </View>
      </View>
    )}

    <View style={styles.controls}>
      <Pressable style={styles.control} onPress={() => localParticipant.setMicrophoneEnabled(!isMicrophoneEnabled)}><Text style={styles.controlText}>{isMicrophoneEnabled ? 'Mic' : 'Muted'}</Text></Pressable>
      <Pressable style={styles.control} onPress={() => localParticipant.setCameraEnabled(!isCameraEnabled)}><Text style={styles.controlText}>{isCameraEnabled ? 'Camera' : 'Camera Off'}</Text></Pressable>
      <Pressable style={styles.control} onPress={() => { room.disconnect(); onClose(); }}><Text style={styles.end}>Leave</Text></Pressable>
    </View>
  </View>;
}

const styles=StyleSheet.create({room:{flex:1,backgroundColor:'#050505'},center:{flex:1,backgroundColor:'#050505',alignItems:'center',justifyContent:'center',padding:24},loading:{color:'#fff',fontSize:17},error:{color:'#ff6d9d',textAlign:'center',marginBottom:18},button:{paddingHorizontal:22,paddingVertical:12,borderRadius:22,backgroundColor:'#ff2d72'},buttonText:{color:'#fff',fontWeight:'800'},header:{height:64,paddingHorizontal:14,flexDirection:'row',alignItems:'center',gap:10},live:{color:'#ff3b78',fontWeight:'900'},roomText:{color:'#ddd',flex:1},close:{color:'#fff',fontSize:30},grid:{flex:1,flexDirection:'row',flexWrap:'wrap'},tile:{width:'33.333%',height:'25%',borderWidth:1,borderColor:'#1e1e1e',backgroundColor:'#111',position:'relative'},video:{width:'100%',height:'100%'},label:{position:'absolute',left:6,bottom:6,paddingHorizontal:7,paddingVertical:4,borderRadius:10,backgroundColor:'#000b'},labelText:{color:'#fff',fontSize:10,fontWeight:'700'},empty:{alignItems:'center',justifyContent:'center'},emptyText:{color:'#777'},controls:{position:'absolute',bottom:16,left:14,right:14,flexDirection:'row',gap:8,justifyContent:'center'},control:{paddingHorizontal:16,paddingVertical:12,borderRadius:22,backgroundColor:'#191919'},controlText:{color:'#fff',fontWeight:'700'},end:{color:'#ff6b96',fontWeight:'900'},inviteOverlay:{position:'absolute',left:0,right:0,top:0,bottom:0,backgroundColor:'#0009',zIndex:20,justifyContent:'flex-end'},invitePanel:{backgroundColor:'#151515',borderTopLeftRadius:24,borderTopRightRadius:24,padding:18,paddingBottom:32},inviteHeader:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',marginBottom:6},inviteTitle:{color:'#fff',fontSize:21,fontWeight:'900'},inviteClose:{color:'#fff',fontSize:30},inviteSubtitle:{color:'#999',fontSize:13,marginBottom:14},userRow:{height:58,flexDirection:'row',alignItems:'center',borderBottomWidth:1,borderBottomColor:'#292929'},avatar:{width:40,height:40,borderRadius:20,backgroundColor:'#292929',alignItems:'center',justifyContent:'center'},avatarText:{color:'#fff',fontWeight:'900'},userName:{color:'#fff',fontSize:15,fontWeight:'700',flex:1,marginLeft:12},inviteButton:{backgroundColor:'#ff2d72',paddingHorizontal:17,paddingVertical:9,borderRadius:18},inviteButtonText:{color:'#fff',fontWeight:'900'},incomingOverlay:{position:'absolute',left:0,right:0,top:0,bottom:0,backgroundColor:'#000b',zIndex:30,alignItems:'center',justifyContent:'center',padding:24},incomingPanel:{width:'100%',backgroundColor:'#171717',borderRadius:24,padding:22},incomingTitle:{color:'#fff',fontSize:22,fontWeight:'900',marginBottom:8},incomingText:{color:'#bbb',fontSize:15,lineHeight:22,marginBottom:20},incomingActions:{flexDirection:'row',gap:12},rejectButton:{flex:1,backgroundColor:'#292929',paddingVertical:13,borderRadius:22,alignItems:'center'},acceptButton:{flex:1,backgroundColor:'#ff2d72',paddingVertical:13,borderRadius:22,alignItems:'center'},actionText:{color:'#fff',fontWeight:'900'}});
