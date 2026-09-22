import { Video, ResizeMode } from 'expo-av';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  PermissionsAndroid,
  Platform,
  Modal,
  Animated,
  Image,
  ScrollView,
} from 'react-native';
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

  return <LiveKitRoom serverUrl={wsUrl} token={token} connect audio video options={{ adaptiveStream: true, dynacast: true }}>
    <RoomGrid role={role} onClose={onClose} />
  </LiveKitRoom>;
}

function RoomGrid({ role, onClose }:{role:'host'|'guest';onClose:()=>void}) {
  const room = useRoomContext();
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteUsers, setInviteUsers] = useState<any[]>([]);
  const [inviteLoading, setInviteLoading] = useState(false);

  type Gift = {
    id: string;
    name: string;
    price: number;
    icon: string;
    rarity: string;
    category: string;
    video?: any;
    duration?: number;
  };

  const giftCatalog: Gift[] = [
    { id: 'rose', name: 'Rose', price: 1, icon: '🌹', rarity: 'Common', category: 'Popular' },
    { id: 'heart', name: 'Heart', price: 5, icon: '💗', rarity: 'Common', category: 'Popular' },
    { id: 'crown', name: 'Crown', price: 500, icon: '👑', rarity: 'Epic', category: 'Royal' },
    { id: 'lion', name: 'Lion', price: 1000, icon: '🦁', rarity: 'Legendary', category: 'Legendary', video: require('../assets/lion-gift.mp4'), duration: 8000 },
    { id: 'dragon', name: 'Dragon', price: 2500, icon: '🐉', rarity: 'Legendary', category: 'Legendary' },
    { id: 'universe', name: 'Universe', price: 10000, icon: '🌌', rarity: 'Ultra', category: 'Ultra' },

    { id: 'desert-drifting', name: 'Desert Drifting', price: 500, icon: '🏜️', rarity: 'Epic', category: 'Action', video: require('../assets/desert-drifting-gift.mp4'), duration: 8000 },
    { id: 'golden-falcon', name: 'Golden Falcon', price: 750, icon: '🦅', rarity: 'Epic', category: 'Animals', video: require('../assets/golden-falcon-gift.mp4'), duration: 8000 },
    { id: 'feature-city', name: 'Feature City', price: 1000, icon: '🌆', rarity: 'Legendary', category: 'Luxury', video: require('../assets/feature-city-gift.mp4'), duration: 8000 },
    { id: 'flying-falcon', name: 'Flying Falcon', price: 1000, icon: '🦅', rarity: 'Legendary', category: 'Animals', video: require('../assets/flying-falcon-gift.mp4'), duration: 8000 },
    { id: 'flying-jets', name: 'Flying Jets', price: 1500, icon: '✈️', rarity: 'Legendary', category: 'Action', video: require('../assets/flying-jets-gift.mp4'), duration: 8000 },
    { id: 'lion-leon', name: 'Lion & Leon', price: 2000, icon: '🦁', rarity: 'Legendary', category: 'Animals', video: require('../assets/lion-leon-gift.mp4'), duration: 8000 },
    { id: 'space-rocket', name: 'Space Rocket', price: 1000, icon: '🚀', rarity: 'Legendary', category: 'Space', video: require('../assets/space-rocket-gift.mp4'), duration: 8000 },
    { id: 'white-tiger', name: 'White Tiger', price: 2000, icon: '🐯', rarity: 'Legendary', category: 'Animals', video: require('../assets/white-tiger-gift.mp4'), duration: 8000 },
    { id: 'white-wolf', name: 'White Wolf', price: 1500, icon: '🐺', rarity: 'Legendary', category: 'Animals', video: require('../assets/white-wolf-gift.mp4'), duration: 8000 },
    { id: 'desert-wolf', name: 'Desert Wolf', price: 1500, icon: '🐺', rarity: 'Legendary', category: 'Animals', video: require('../assets/desert-wolf-gift.mp4'), duration: 8000 },
  ];

  const [giftCategory, setGiftCategory] = useState('Popular');
  const [giftOpen, setGiftOpen] = useState(false);
  const [giftTarget, setGiftTarget] = useState('HOST');
  const [testCoins, setTestCoins] = useState(1250);
  const [activeGift, setActiveGift] = useState<Gift | null>(null);
  const [giftCombo, setGiftCombo] = useState(0);

  const giftScale = useRef(new Animated.Value(0.7)).current;
  const giftOpacity = useRef(new Animated.Value(0)).current;
  const giftTimer = useRef<ReturnType<typeof setTimeout> | null>(null);


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
    <View style={styles.header}><Text style={styles.live}>● LIVE</Text><Text style={styles.roomText}>NEW-LAYOUT-TEST · {room.name} · {role.toUpperCase()}</Text><Pressable onPress={onClose}><Text style={styles.close}>×</Text></Pressable></View>
    <View style={styles.grid}>
      {(() => {
        const hostTrack = role === 'host'
          ? cameraTracks.find((t:any) => t.participant?.identity === localParticipant.identity)
          : cameraTracks[0];

        const guestTracks = cameraTracks.filter((t:any) => t !== hostTrack);
        const guestCount = guestTracks.length;
        const totalGuestSlots = Math.max(2, Math.min(6, guestCount || 2));
        const emptySlots = Math.max(0, totalGuestSlots - guestCount);

        return (
          <>
            {hostTrack && (
              <View style={styles.hostTile}>
                <VideoTrack trackRef={hostTrack} style={styles.video} />
                <View style={styles.label}>
                  <Text style={styles.labelText}>HOST</Text>
                </View>
                <View style={styles.hostBadge}>
                  <Text style={styles.hostBadgeText}>HOST</Text>
                </View>
              </View>
            )}

            <View style={styles.guestArea}>
              {guestTracks.map((t:any, i:number) => (
                <View
                  key={t.publication?.trackSid || `${t.participant?.identity}-${i}`}
                  style={[
                    styles.guestTile,
                    totalGuestSlots <= 2
                      ? styles.guestTwo
                      : totalGuestSlots <= 4
                        ? styles.guestFour
                        : styles.guestSix
                  ]}
                >
                  <VideoTrack trackRef={t} style={styles.video} />
                  <View style={styles.label}>
                    <Text style={styles.labelText}>
                      {t.participant?.identity || 'Guest'}
                    </Text>
                  </View>
                </View>
              ))}

              {Array.from({length: emptySlots}).map((_, i) => (
                <Pressable
                  key={`empty-${i}`}
                  style={[
                    styles.guestTile,
                    styles.empty,
                    totalGuestSlots <= 2
                      ? styles.guestTwo
                      : totalGuestSlots <= 4
                        ? styles.guestFour
                        : styles.guestSix
                  ]}
                  onPress={() => setInviteOpen(true)}
                >
                  <Text style={styles.emptyText}>+ Invite</Text>
                </Pressable>
              ))}
            </View>
          </>
        );
      })()}
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

      <Pressable style={styles.giftControl} onPress={() => setGiftOpen(true)}>
        <Text style={styles.giftControlIcon}>🎁</Text>
        <Text style={styles.giftControlText}>Gift</Text>
      </Pressable>

      <Pressable style={styles.control} onPress={() => { room.disconnect(); onClose(); }}>
        <Text style={styles.end}>Leave</Text>
      </Pressable>
    </View>

    <Modal visible={giftOpen} transparent animationType="slide" onRequestClose={() => setGiftOpen(false)}>
      <View style={styles.giftModal}>
        <View style={styles.giftPanel}>
          <View style={styles.giftGrabber} />
          <View style={styles.giftHeader}>
            <View>
              <Text style={styles.giftHeaderTitle}>Send Gift 🎁</Text>
              <Text style={styles.giftHeaderSub}>Choose recipient</Text>
            </View>
            <Pressable onPress={() => setGiftOpen(false)}>
              <Text style={styles.giftClose}>×</Text>
            </Pressable>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll} contentContainerStyle={styles.categoryContent}>
            {['Popular', 'Royal', 'Animals', 'Action', 'Luxury', 'Space', 'Legendary', 'Ultra'].map(category => (
              <Pressable key={category} onPress={() => setGiftCategory(category)} style={[styles.categoryChip, giftCategory === category && styles.categoryChipActive]}>
                <Text style={[styles.categoryChipText, giftCategory === category && styles.categoryChipTextActive]}>{category}</Text>
              </Pressable>
            ))}
          </ScrollView>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.targetScroll}>
            {['HOST', ...participants.map(p => p.identity)].map(target => (
              <Pressable
                key={target}
                onPress={() => setGiftTarget(target)}
                style={[
                  styles.targetChip,
                  giftTarget === target && styles.targetChipActive
                ]}
              >
                <Text style={styles.targetChipText}>{target}</Text>
              </Pressable>
            ))}
          </ScrollView>

          <Text style={styles.coinBalance}>🪙 Test Coins: {testCoins.toLocaleString()}</Text>
          <View style={styles.testCoinControls}>
            <Pressable style={styles.testCoinButton} onPress={() => setTestCoins(v => v + 1000)}>
              <Text style={styles.testCoinButtonText}>+1K</Text>
            </Pressable>
            <Pressable style={styles.testCoinButton} onPress={() => setTestCoins(v => v + 10000)}>
              <Text style={styles.testCoinButtonText}>+10K</Text>
            </Pressable>
            <Pressable style={styles.testCoinButton} onPress={() => setTestCoins(1250)}>
              <Text style={styles.testCoinButtonText}>RESET</Text>
            </Pressable>
          </View>

          <View style={styles.giftGrid}>
            {giftCatalog.filter(gift => gift.category === giftCategory).map(gift => {
              const disabled = testCoins < gift.price;

              return (
                <Pressable
                  key={gift.id}
                  disabled={disabled}
                  style={[styles.giftCard, disabled && styles.giftDisabled]}
                  onPress={() => {
                    if (testCoins < gift.price) return;

                    setTestCoins(v => v - gift.price);
                    setGiftCombo(v => v + 1);
                    setActiveGift(gift);
                    setGiftOpen(false);

                    giftScale.setValue(0.7);
                    giftOpacity.setValue(0);

                    Animated.parallel([
                      Animated.spring(giftScale, {
                        toValue: 1,
                        useNativeDriver: true,
                        friction: 6,
                      }),
                      Animated.timing(giftOpacity, {
                        toValue: 1,
                        duration: 220,
                        useNativeDriver: true,
                      }),
                    ]).start();

                    if (giftTimer.current) clearTimeout(giftTimer.current);

                    giftTimer.current = setTimeout(() => {
                      Animated.timing(giftOpacity, {
                        toValue: 0,
                        duration: 450,
                        useNativeDriver: true,
                      }).start(() => setActiveGift(null));
                    }, gift.duration ?? 8200);
                  }}
                >
                  {gift.id === 'lion' ? <Image source={require('../assets/lion-gift-preview.png')} style={styles.giftThumbnail} resizeMode='cover' /> : <Text style={styles.giftIcon}>{gift.icon}</Text>}
                  <Text style={styles.giftName}>{gift.name}</Text>
                  <Text style={styles.giftPrice}>{gift.price.toLocaleString()} coins</Text>
                  <Text style={[styles.giftRarity, gift.rarity === 'Common' && styles.rarityCommon, gift.rarity === 'Epic' && styles.rarityEpic, gift.rarity === 'Legendary' && styles.rarityLegendary, gift.rarity === 'Ultra' && styles.rarityUltra]}>{gift.rarity}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      </View>
    </Modal>

    {activeGift && (
      <Animated.View pointerEvents="none" style={[styles.giftOverlay, { opacity: giftOpacity }]}>
        <View style={styles.giftBanner}>
          <Text style={styles.giftBannerText}>
            Hassan sent {activeGift.name} ×{giftCombo}
          </Text>
        </View>

        {activeGift.video ? (
          <Animated.View style={[styles.lionStage, { transform: [{ scale: giftScale }] }]}>
            <Video
              source={activeGift.video}
              style={styles.lionImage}
              resizeMode={ResizeMode.COVER}
              shouldPlay
              isLooping={false}
              isMuted={false}
              useNativeControls={false}
            />
          </Animated.View>
        ) : (
          <Animated.View style={[styles.genericGiftStage, { transform: [{ scale: giftScale }] }]}>
            <Text style={styles.genericGiftIcon}>{activeGift.icon}</Text>
            <Text style={styles.genericGiftTitle}>{activeGift.name.toUpperCase()}</Text>
            <Text style={styles.genericGiftSub}>{activeGift.rarity} Gift</Text>
          </Animated.View>
        )}

        <View style={styles.giftCaption}>
          <Text style={styles.giftTitle}>{activeGift.name === 'Lion' ? 'LEGENDARY LION' : activeGift.name.toUpperCase()}</Text>
          <Text style={styles.giftSub}>Sent to {giftTarget} · {giftCombo} combo</Text>
        </View>
      </Animated.View>
    )}
  </View>;
}

const styles=StyleSheet.create({room:{flex:1,backgroundColor:'#050505'},center:{flex:1,backgroundColor:'#050505',alignItems:'center',justifyContent:'center',padding:24},loading:{color:'#fff',fontSize:17},error:{color:'#ff6d9d',textAlign:'center',marginBottom:18},button:{paddingHorizontal:22,paddingVertical:12,borderRadius:22,backgroundColor:'#ff2d72'},buttonText:{color:'#fff',fontWeight:'800'},header:{height:64,paddingHorizontal:14,flexDirection:'row',alignItems:'center',gap:10},live:{color:'#ff3b78',fontWeight:'900'},roomText:{color:'#ddd',flex:1},close:{color:'#fff',fontSize:30},grid:{
  flex:1,
  flexDirection:'row',
  flexWrap:'wrap',
  alignContent:'flex-start'
},
tile:{
  width:'33.333%',
  height:'25%',
  borderWidth:1,
  borderColor:'#1e1e1e',
  backgroundColor:'#111',
  position:'relative'
},
hostTile:{
  width:'100%',
  height:'70%',
  borderWidth:6,
  borderColor:'#ff0000',
  backgroundColor:'#ff0000',
  position:'relative'
},
guestArea:{
  width:'100%',
  height:'42%',
  flexDirection:'row',
  flexWrap:'wrap',
  alignContent:'flex-start'
},
guestTile:{
  height:'50%',
  borderWidth:1,
  borderColor:'#1e1e1e',
  backgroundColor:'#111',
  position:'relative'
},
guestTwo:{
  width:'50%'
},
guestFour:{
  width:'50%'
},
guestSix:{
  width:'33.333%'
},
hostBadge:{
  position:'absolute',
  top:10,
  left:10,
  backgroundColor:'#ff2d72',
  paddingHorizontal:10,
  paddingVertical:5,
  borderRadius:14
},
hostBadgeText:{
  color:'#fff',
  fontSize:10,
  fontWeight:'900'
},video:{width:'100%',height:'100%'},label:{position:'absolute',left:6,bottom:6,paddingHorizontal:7,paddingVertical:4,borderRadius:10,backgroundColor:'#000b'},labelText:{color:'#fff',fontSize:10,fontWeight:'700'},empty:{alignItems:'center',justifyContent:'center'},emptyText:{color:'#777'},controls:{position:'absolute',bottom:16,left:14,right:14,flexDirection:'row',gap:8,justifyContent:'center'},control:{paddingHorizontal:16,paddingVertical:12,borderRadius:22,backgroundColor:'#191919'},
giftControl:{paddingHorizontal:14,paddingVertical:9,borderRadius:22,backgroundColor:'#ff2d72',alignItems:'center',justifyContent:'center'},
giftControlIcon:{fontSize:18},
giftControlText:{color:'#fff',fontWeight:'800',fontSize:10,marginTop:1},
giftModal:{flex:1,backgroundColor:'rgba(0,0,0,0.55)',justifyContent:'flex-end'},
giftPanel:{backgroundColor:'#0d0d12',borderTopLeftRadius:28,borderTopRightRadius:28,padding:18,paddingBottom:30,maxHeight:'75%'},
giftGrabber:{width:42,height:4,borderRadius:4,backgroundColor:'#555',alignSelf:'center',marginBottom:14},
giftHeader:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',marginBottom:12},
giftHeaderTitle:{color:'#fff',fontSize:23,fontWeight:'900',letterSpacing:0.2},
giftHeaderSub:{color:'#888',fontSize:12,marginTop:3},
giftClose:{color:'#fff',fontSize:26,width:38,height:38,borderRadius:19,backgroundColor:'#1c1c22',textAlign:'center',lineHeight:35},
categoryScroll:{marginBottom:10},categoryContent:{paddingRight:8},categoryChip:{paddingHorizontal:15,paddingVertical:9,borderRadius:19,backgroundColor:'#17171d',borderWidth:1,borderColor:'#292932',marginRight:8},categoryChipActive:{backgroundColor:'#ff2d72',borderColor:'#ff2d72'},categoryChipText:{color:'#9999a5',fontSize:11,fontWeight:'800'},categoryChipTextActive:{color:'#fff'},
targetScroll:{marginBottom:12},
targetChip:{borderWidth:1,borderColor:'#292932',borderRadius:20,paddingHorizontal:15,paddingVertical:9,marginRight:8,backgroundColor:'#17171d'},
targetChipActive:{borderColor:'#ff2d72',backgroundColor:'rgba(255,45,114,0.16)'},
targetChipText:{color:'#fff',fontSize:11,fontWeight:'800'},
coinBalance:{color:'#ffe08a',fontSize:13,fontWeight:'900',marginBottom:10,backgroundColor:'#17171d',borderWidth:1,borderColor:'rgba(255,215,106,0.18)',paddingHorizontal:14,paddingVertical:10,borderRadius:20},
testCoinControls:{flexDirection:'row',gap:8,marginBottom:14},
testCoinButton:{paddingHorizontal:14,paddingVertical:7,borderRadius:16,backgroundColor:'#24242d',borderWidth:1,borderColor:'rgba(255,215,106,0.3)'},
testCoinButtonText:{color:'#ffe08a',fontSize:12,fontWeight:'900'},
giftGrid:{flexDirection:'row',flexWrap:'wrap',gap:9},
giftCard:{width:'31.5%',backgroundColor:'#15151b',borderRadius:19,padding:13,alignItems:'center',justifyContent:'center',borderWidth:1,borderColor:'#25252d',minHeight:126},
giftDisabled:{opacity:0.35},
giftThumbnail:{width:64,height:82,borderRadius:14,marginBottom:3},
giftIcon:{fontSize:40},
giftName:{color:'#fff',fontSize:13,fontWeight:'800',marginTop:4},
giftPrice:{color:'#ffe08a',fontSize:10,fontWeight:'900',marginTop:6},
giftRarity:{color:'#8f8f9a',fontSize:8,fontWeight:'800',marginTop:4,textTransform:'uppercase'},
rarityCommon:{color:'#a7a7b0'},rarityEpic:{color:'#c084fc'},rarityLegendary:{color:'#ffd76a'},rarityUltra:{color:'#ff6bdf'},
giftOverlay:{position:'absolute',left:0,right:0,top:0,bottom:0,zIndex:50,alignItems:'center',justifyContent:'center'},
giftBanner:{position:'absolute',top:72,left:16,right:16,minHeight:56,borderRadius:30,backgroundColor:'rgba(20,12,5,0.94)',borderWidth:1,borderColor:'#f4bd4f',alignItems:'center',justifyContent:'center',paddingHorizontal:16},
giftBannerText:{color:'#fff',fontSize:15,fontWeight:'800'},
lionStage:{width:'48%',height:'58%',borderRadius:30,overflow:'hidden',borderWidth:1,borderColor:'rgba(255,215,106,0.65)',backgroundColor:'transparent',shadowColor:'#f7b942',shadowOpacity:0.65,shadowRadius:24,marginTop:70},
lionImage:{width:'100%',height:'100%'},
genericGiftStage:{width:'82%',height:'48%',borderRadius:30,backgroundColor:'rgba(32,22,10,0.96)',borderWidth:1,borderColor:'#d5a83c',alignItems:'center',justifyContent:'center'},
genericGiftIcon:{fontSize:105},
genericGiftTitle:{color:'#ffe08a',fontSize:28,fontWeight:'900',letterSpacing:2,marginTop:12},
genericGiftSub:{color:'#fff',fontSize:13,marginTop:7,opacity:0.9},
giftCaption:{position:'absolute',bottom:96,alignItems:'center'},
giftTitle:{color:'#ffe08a',fontSize:27,fontWeight:'900',letterSpacing:2,textShadowColor:'#000',textShadowRadius:10},
giftSub:{color:'#fff',fontSize:13,marginTop:4,opacity:0.9},controlText:{color:'#fff',fontWeight:'700'},end:{color:'#ff6b96',fontWeight:'900'},inviteOverlay:{position:'absolute',left:0,right:0,top:0,bottom:0,backgroundColor:'#0009',zIndex:20,justifyContent:'flex-end'},invitePanel:{backgroundColor:'#151515',borderTopLeftRadius:24,borderTopRightRadius:24,padding:18,paddingBottom:32},inviteHeader:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',marginBottom:6},inviteTitle:{color:'#fff',fontSize:21,fontWeight:'900'},inviteClose:{color:'#fff',fontSize:30},inviteSubtitle:{color:'#999',fontSize:13,marginBottom:14},userRow:{height:58,flexDirection:'row',alignItems:'center',borderBottomWidth:1,borderBottomColor:'#292929'},avatar:{width:40,height:40,borderRadius:20,backgroundColor:'#292929',alignItems:'center',justifyContent:'center'},avatarText:{color:'#fff',fontWeight:'900'},userName:{color:'#fff',fontSize:15,fontWeight:'700',flex:1,marginLeft:12},inviteButton:{backgroundColor:'#ff2d72',paddingHorizontal:17,paddingVertical:9,borderRadius:18},inviteButtonText:{color:'#fff',fontWeight:'900'},incomingOverlay:{position:'absolute',left:0,right:0,top:0,bottom:0,backgroundColor:'#000b',zIndex:30,alignItems:'center',justifyContent:'center',padding:24},incomingPanel:{width:'100%',backgroundColor:'#171717',borderRadius:24,padding:22},incomingTitle:{color:'#fff',fontSize:22,fontWeight:'900',marginBottom:8},incomingText:{color:'#bbb',fontSize:15,lineHeight:22,marginBottom:20},incomingActions:{flexDirection:'row',gap:12},rejectButton:{flex:1,backgroundColor:'#292929',paddingVertical:13,borderRadius:22,alignItems:'center'},acceptButton:{flex:1,backgroundColor:'#ff2d72',paddingVertical:13,borderRadius:22,alignItems:'center'},actionText:{color:'#fff',fontWeight:'900'}});
