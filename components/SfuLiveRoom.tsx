import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Video, ResizeMode } from 'expo-av';
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
import { LionChromaVideo } from './LionChromaVideo';
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
  const [multiGuestOpen, setMultiGuestOpen] = useState(false);
  const [pkBattleOpen, setPkBattleOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);

  type Gift = {
    id: string;
    name: string;
    price: number;
    icon: string;
    rarity: string;
 
  };

  const giftCatalog: Gift[] = [
    { id: 'rose', name: 'Rose', price: 1, icon: '🌹', rarity: 'Common', category: 'Popular' },
    { id: 'heart', name: 'Heart', price: 5, icon: '💗', rarity: 'Common', category: 'Popular' },
    { id: 'crown', name: 'Crown', price: 500, icon: '👑', rarity: 'Epic', category: 'Royal' },
    { id: 'lion', name: 'Lion', price: 1000, icon: '🦁', rarity: 'Legendary', category: 'Legendary', video: require('../assets/lion-gift-green.mp4'), duration: 8000 },
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

  const multiHostTrack = role === 'host'
    ? cameraTracks.find((t:any) => t.participant?.identity === localParticipant.identity)
    : cameraTracks[0];

  const multiGuestTracks = cameraTracks.filter(
    (t:any) => t !== multiHostTrack
  ).slice(0, 6);

  return <View style={styles.room}>
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

            {guestCount > 0 && (
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

              {guestCount > 0 && Array.from({length: emptySlots}).map((_, i) => (
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
            )}
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
      <Pressable style={styles.control} onPress={() => setMultiGuestOpen(true)}>
        <Text style={styles.controlIcon}>👥</Text>
        <Text style={styles.controlLabel}>Guests</Text>
      </Pressable>

      <Pressable style={styles.giftControl} onPress={() => setGiftOpen(true)}>
        <Text style={styles.giftControlIcon}>🎁</Text>
        <Text style={styles.giftControlText}>Gift</Text>
      </Pressable>

      <Pressable style={styles.control} onPress={() => setMoreOpen(true)}>
        <Text style={styles.controlIcon}>•••</Text>
        <Text style={styles.controlLabel}>More</Text>
      </Pressable>

      <Pressable style={styles.control} onPress={() => {}}>
        <Text style={styles.controlIcon}>↗</Text>
        <Text style={styles.controlLabel}>Share</Text>
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
             </Pressable>);
            })}
          </View>
        </View>
      </View>
    </Modal>

    {multiGuestOpen && (
  <View
    style={{
      position:'absolute',
      left:0,
      right:0,
      top:0,
      bottom:0,
      zIndex:40,
      backgroundColor:'#07050c',
      paddingTop:8,
      paddingHorizontal:7,
    }}
  >

    {/* HEADER — SAME PROPORTION AS REFERENCE */}
    <View
      style={{
        height:72,
        flexDirection:'row',
        alignItems:'center',
        paddingHorizontal:7,
      }}
    >
      <View
        style={{
          width:48,
          height:48,
          borderRadius:24,
          borderWidth:2,
          borderColor:'#d77aff',
          backgroundColor:'#171421',
          shadowColor:'#c56cff',
          shadowOpacity:.35,
          shadowRadius:8,
          elevation:5,
          alignItems:'center',
          justifyContent:'center',
        }}
      >
        <Text style={{color:'#fff',fontSize:19,fontWeight:'800'}}>
          {(localParticipant.name ||
            localParticipant.identity ||
            'L').charAt(0).toUpperCase()}
        </Text>
      </View>

      <View style={{marginLeft:9,flex:1}}>
        <Text
          numberOfLines={1}
          style={{
            color:'#fff',
            fontSize:17,
            fontWeight:'800',
            letterSpacing:.2,
          }}
        >
          {localParticipant.name ||
            localParticipant.identity ||
            'Live'}
        </Text>

        <Pressable
          onPress={() => {}}
          style={{
            position:'absolute',
            left:105,
            top:1,
            height:28,
            minWidth:62,
            paddingHorizontal:12,
            borderRadius:14,
            backgroundColor:'#ff3b81',
            alignItems:'center',
            justifyContent:'center',
          }}
        >
          <Text
            style={{
              color:'#fff',
              fontSize:11,
              fontWeight:'800',
            }}
          >
            Follow
          </Text>
        </Pressable>

        <Text
          style={{
            color:'#d77aff',
            fontSize:10,
            fontWeight:'800',
            letterSpacing:1.1,
            marginTop:3,
          }}
        >
          LIVE
        </Text>
      </View>

      <Pressable
        onPress={() => setMultiGuestOpen(false)}
        style={{
          width:42,
          height:52,
          alignItems:'center',
          justifyContent:'center',
        }}
      >
        <Text
          style={{
            color:'#fff',
            fontSize:34,
            fontWeight:'200',
          }}
        >
          ×
        </Text>
      </Pressable>
    </View>

    {/* MAIN VIDEO AREA — REFERENCE SIZE */}
    <View
      style={{
        height:'45%',
        flexDirection:'row',
        gap:7,
      }}
    >

      {/* HOST — 50% */}
      <View
        style={{
          width:'50%',
          borderRadius:12,
          overflow:'hidden',
          backgroundColor:'#100d17',
          borderWidth:1,
          borderColor:'rgba(197,108,255,.72)',
        }}
      >
        {multiHostTrack ? (
          <VideoTrack
            trackRef={multiHostTrack}
            style={{
              position:'absolute',
              left:0,
              right:0,
              top:0,
              bottom:0,
            }}
          />
        ) : (
          <View
            style={{
              flex:1,
              alignItems:'center',
              justifyContent:'center',
            }}
          >
            <Text style={{color:'#777'}}>
              Camera unavailable
            </Text>
          </View>
        )}

        <View
          style={{
            position:'absolute',
            left:8,
            top:8,
            backgroundColor:'#ff315f',
            borderRadius:18,
            paddingHorizontal:12,
            paddingVertical:7,
          }}
        >
          <Text
            style={{
              color:'#fff',
              fontSize:14,
              fontWeight:'900',
            }}
          >
            LIVE
          </Text>
        </View>
      </View>

      {/* 6 REAL GUEST PANELS — 2 x 3 */}
      <View
        style={{
          width:'50%',
          flexDirection:'row',
          flexWrap:'wrap',
          gap:6,
        }}
      >
        {Array.from({length:6}).map((_,i) => {
          const guestTrack = multiGuestTracks[i];

          return (
            <Pressable
              key={i}
              onPress={() => {
                if (!guestTrack) setInviteOpen(true);
              }}
              style={{
                width:'48%',
                height:'32%',
                borderRadius:11,
                overflow:'hidden',
                backgroundColor:'#100d17',
                borderWidth:1,
                borderColor:'rgba(255,255,255,.14)',
              }}
            >
              {guestTrack ? (
                <VideoTrack
                  trackRef={guestTrack}
                  style={{
                    position:'absolute',
                    left:0,
                    right:0,
                    top:0,
                    bottom:0,
                  }}
                />
              ) : (
                <View
                  style={{
                    flex:1,
                    alignItems:'center',
                    justifyContent:'center',
                  }}
                >
                  <View
                    style={{
                      width:42,
                      height:42,
                      borderRadius:21,
                      backgroundColor:'rgba(255,255,255,.96)',
                      alignItems:'center',
                      justifyContent:'center',
                    }}
                  >
                    <Text
                      style={{
                        color:'#e5008f',
                        fontSize:30,
                        fontWeight:'300',
                      }}
                    >
                      +
                    </Text>
                  </View>
                </View>
              )}

              {guestTrack && (
                <View
                  style={{
                    position:'absolute',
                    left:6,
                    right:6,
                    bottom:6,
                    backgroundColor:'rgba(0,0,0,.65)',
                    borderRadius:9,
                    paddingHorizontal:6,
                    paddingVertical:4,
                  }}
                >
                  <Text
                    numberOfLines={1}
                    style={{
                      color:'#fff',
                      fontSize:9,
                      fontWeight:'700',
                    }}
                  >
                    {guestTrack.participant?.name ||
                      guestTrack.participant?.identity ||
                      ''}
                  </Text>
                </View>
              )}
            </Pressable>
          );
        })}
      </View>
    </View>

    {/* COMMENTS SPACE — SAME LARGE LOWER AREA */}
    <View
      style={{
        flex:1,
        marginTop:10,
        marginBottom:8,
        borderRadius:10,
        backgroundColor:'rgba(24,18,30,.82)',
        borderWidth:1,
        borderColor:'rgba(255,255,255,.08)',
        alignItems:'center',
        justifyContent:'center',
      }}
    >
      <Text
        style={{
          color:'#8f8b98',
          fontSize:14,
          fontWeight:'600',
          letterSpacing:.2,
        }}
      >
        No comments yet
      </Text>
    </View>

    {/* BOTTOM INTERACTION BAR — NO FAKE DATA */}
    <View
      style={{
        height:68,
        flexDirection:'row',
        alignItems:'center',
        paddingHorizontal:7,
        gap:8,
      }}
    >
      <View
        style={{
          width:48,
          height:48,
          borderRadius:24,
          backgroundColor:'rgba(25,22,34,.94)',
          borderWidth:1,
          borderColor:'rgba(255,255,255,.12)',
          alignItems:'center',
          justifyContent:'center',
        }}
      >
        <Text style={{color:'#fff',fontSize:25}}>☆</Text>
      </View>

      <View
        style={{
          flex:1,
          height:46,
          borderRadius:23,
          backgroundColor:'rgba(25,22,34,.94)',
          borderWidth:1,
          borderColor:'rgba(255,255,255,.12)',
          justifyContent:'center',
          paddingHorizontal:18,
        }}
      >
        <Text
          style={{
            color:'#96919f',
            fontSize:15,
            fontWeight:'500',
          }}
        >
          Add comment...
        </Text>
      </View>

      <Pressable
        onPress={() => setPkBattleOpen(true)}
        style={{
          width:46,
          height:46,
          borderRadius:23,
          backgroundColor:'rgba(25,22,34,.94)',
          borderWidth:1,
          borderColor:'rgba(255,255,255,.12)',
          alignItems:'center',
          justifyContent:'center',
        }}
      >
        <Text
          style={{
            color:'#ff4b9b',
            fontSize:13,
            fontWeight:'900',
          }}
        >
          PK
        </Text>
      </Pressable>

      <Pressable
        onPress={() => setGiftOpen(true)}
        style={{
          width:46,
          height:46,
          borderRadius:23,
          backgroundColor:'rgba(25,22,34,.94)',
          borderWidth:1,
          borderColor:'rgba(255,255,255,.12)',
          alignItems:'center',
          justifyContent:'center',
        }}
      >
        <Text style={{fontSize:23}}>🎁</Text>
      </Pressable>

      <View
        style={{
          width:46,
          height:46,
          borderRadius:23,
          backgroundColor:'rgba(25,22,34,.94)',
          borderWidth:1,
          borderColor:'rgba(255,255,255,.12)',
          alignItems:'center',
          justifyContent:'center',
        }}
      >
        <Text style={{color:'#fff',fontSize:23}}>↗</Text>
      </View>
    </View>

  </View>
)}

{pkBattleOpen && (
  <View
    style={{
      position: 'absolute',
      left: 0,
      right: 0,
      top: 0,
      bottom: 0,
      zIndex: 80,
      elevation: 80,
      backgroundColor: '#050509',
    }}
  >

    {/* =========================
        PK TOP HEADER
       ========================= */}
    <View
      style={{
        position: 'absolute',
        top: 12,
        left: 18,
        right: 18,
        height: 104,
        zIndex: 30,
        elevation: 30,
      }}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          height: 72,
        }}
      >

        {/* HOST PROFILE */}
        <View
          style={{
            width: 68,
            height: 68,
            borderRadius: 34,
            backgroundColor: '#25232b',
            borderWidth: 2,
            borderColor: 'rgba(255,255,255,0.22)',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
          }}
        >
          <Text style={{ fontSize: 35 }}>👩🏻</Text>
        </View>

        <View
          style={{
            marginLeft: 10,
            justifyContent: 'center',
          }}
        >
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
            }}
          >
            <Text
              style={{
                color: '#fff',
                fontSize: 23,
                fontWeight: '900',
              }}
            >
              Anna
            </Text>

            <View
              style={{
                width: 20,
                height: 20,
                borderRadius: 10,
                backgroundColor: '#1da1f2',
                marginLeft: 6,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text
                style={{
                  color: '#fff',
                  fontSize: 13,
                  fontWeight: '900',
                }}
              >
                ✓
              </Text>
            </View>
          </View>

          <Text
            style={{
              color: '#fff',
              fontSize: 16,
              marginTop: 2,
              fontWeight: '700',
            }}
          >
            ❤️ 2.5M
          </Text>
        </View>

        {/* FOLLOW */}
        <Pressable
          style={{
            height: 44,
            paddingHorizontal: 17,
            borderRadius: 22,
            backgroundColor: '#ff1687',
            marginLeft: 16,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text
            style={{
              color: '#fff',
              fontSize: 16,
              fontWeight: '900',
            }}
          >
            + Follow
          </Text>
        </Pressable>

        <View style={{ flex: 1 }} />

        {/* SUPPORTERS */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            marginRight: 18,
          }}
        >
          <View
            style={{
              width: 48,
              height: 48,
              borderRadius: 24,
              backgroundColor: '#28232c',
              borderWidth: 2,
              borderColor: '#ff9d22',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{ fontSize: 25 }}>👩🏻</Text>
          </View>

          <View
            style={{
              width: 48,
              height: 48,
              borderRadius: 24,
              backgroundColor: '#28232c',
              borderWidth: 2,
              borderColor: '#398cff',
              alignItems: 'center',
              justifyContent: 'center',
              marginLeft: -10,
            }}
          >
            <Text style={{ fontSize: 25 }}>👩🏼</Text>
          </View>

          <View
            style={{
              position: 'absolute',
              left: 2,
              top: 38,
              paddingHorizontal: 6,
              height: 19,
              borderRadius: 10,
              backgroundColor: 'rgba(20,20,25,0.95)',
              borderWidth: 1,
              borderColor: 'rgba(255,255,255,0.10)',
            }}
          >
            <Text
              style={{
                color: '#fff',
                fontSize: 9,
                fontWeight: '900',
              }}
            >
              10K+
            </Text>
          </View>

          <View
            style={{
              position: 'absolute',
              right: 0,
              top: 38,
              paddingHorizontal: 6,
              height: 19,
              borderRadius: 10,
              backgroundColor: 'rgba(20,20,25,0.95)',
              borderWidth: 1,
              borderColor: 'rgba(255,255,255,0.10)',
            }}
          >
            <Text
              style={{
                color: '#fff',
                fontSize: 9,
                fontWeight: '900',
              }}
            >
              10K+
            </Text>
          </View>
        </View>

        {/* VIEWERS */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            marginRight: 18,
          }}
        >
          <Text style={{ color: '#fff', fontSize: 23 }}>
            ♟
          </Text>
          <Text
            style={{
              color: '#fff',
              fontSize: 19,
              fontWeight: '900',
              marginLeft: 6,
            }}
          >
            12.4K
          </Text>
        </View>

        {/* CLOSE */}
        <Pressable
          onPress={() => setPkBattleOpen(false)}
          style={{
            width: 48,
            height: 48,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text
            style={{
              color: '#fff',
              fontSize: 47,
              fontWeight: '200',
              lineHeight: 48,
            }}
          >
            ×
          </Text>
        </Pressable>
      </View>

      {/* WEEKLY / EXPLORE */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginTop: 6,
        }}
      >
        <View
          style={{
            height: 48,
            paddingHorizontal: 16,
            borderRadius: 24,
            backgroundColor: 'rgba(25,25,31,0.94)',
            borderWidth: 1,
            borderColor: 'rgba(255,255,255,0.08)',
            flexDirection: 'row',
            alignItems: 'center',
          }}
        >
          <Text style={{ fontSize: 27 }}>🔥</Text>
          <Text
            style={{
              color: '#fff',
              fontSize: 17,
              fontWeight: '800',
              marginLeft: 8,
            }}
          >
            Weekly No. 1
          </Text>
        </View>

        <View
          style={{
            height: 48,
            paddingHorizontal: 16,
            borderRadius: 24,
            backgroundColor: 'rgba(25,25,31,0.94)',
            borderWidth: 1,
            borderColor: 'rgba(255,255,255,0.08)',
            flexDirection: 'row',
            alignItems: 'center',
          }}
        >
          <Text style={{ fontSize: 25 }}>🪐</Text>
          <Text
            style={{
              color: '#fff',
              fontSize: 17,
              fontWeight: '800',
              marginLeft: 8,
            }}
          >
            Explore
          </Text>
          <Text
            style={{
              color: '#fff',
              fontSize: 25,
              marginLeft: 7,
            }}
          >
            ›
          </Text>
        </View>
      </View>
    </View>

    {/* =========================
        SCORE BAR
       ========================= */}
    <View
      style={{
        position: 'absolute',
        top: '13%',
        left: 8,
        right: 8,
        height: 52,
        zIndex: 25,
        elevation: 25,
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 26,
        overflow: 'hidden',
        backgroundColor: '#087df7',
      }}
    >
      <View
        style={{
          width: '50%',
          height: '100%',
          backgroundColor: '#ff1687',
          justifyContent: 'center',
          paddingLeft: 28,
        }}
      >
        <Text
          style={{
            color: '#fff',
            fontSize: 24,
            fontWeight: '900',
          }}
        >
          125,600
        </Text>
      </View>

      <View
        style={{
          position: 'absolute',
          left: '50%',
          marginLeft: -15,
          width: 30,
          height: 52,
          backgroundColor: '#ff1687',
          transform: [{ skewX: '-18deg' }],
        }}
      />

      <View
        style={{
          width: '50%',
          height: '100%',
          alignItems: 'flex-end',
          justifyContent: 'center',
          paddingRight: 28,
        }}
      >
        <Text
          style={{
            color: '#fff',
            fontSize: 24,
            fontWeight: '900',
          }}
        >
          98,400
        </Text>
      </View>
    </View>

    {/* =========================
        MAIN PK BATTLE AREA
       ========================= */}
    <View
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        top: '16.75%',
        height: '43.1%',
        flexDirection: 'row',
        zIndex: 10,
        elevation: 10,
      }}
    >

      {/* HOST SIDE */}
      <View
        style={{
          width: '50%',
          height: '100%',
          overflow: 'hidden',
          backgroundColor: '#151116',
          borderTopRightRadius: 14,
          borderBottomRightRadius: 14,
          borderTopWidth: 2,
          borderRightWidth: 2,
          borderBottomWidth: 2,
          borderColor: '#ff1687',
        }}
      >
        {multiHostTrack ? (
          <VideoTrack
            trackRef={multiHostTrack}
            style={{
              width: '100%',
              height: '100%',
            }}
          />
        ) : (
          <View
            style={{
              flex: 1,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#241822',
            }}
          >
            <Text
              style={{
                color: '#fff',
                fontSize: 15,
                fontWeight: '800',
              }}
            >
              HOST CAMERA
            </Text>
          </View>
        )}

        {/* HOST NAME */}
        <View
          style={{
            position: 'absolute',
            top: 12,
            left: 14,
            height: 42,
            paddingHorizontal: 13,
            borderRadius: 21,
            backgroundColor: 'rgba(14,10,17,0.82)',
            borderWidth: 1,
            borderColor: '#ff1687',
            flexDirection: 'row',
            alignItems: 'center',
          }}
        >
          <View
            style={{
              width: 27,
              height: 27,
              borderRadius: 14,
              backgroundColor: '#ff1687',
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: 7,
            }}
          >
            <Text style={{ color: '#fff', fontSize: 15 }}>♟</Text>
          </View>

          <Text
            style={{
              color: '#fff',
              fontSize: 16,
              fontWeight: '900',
            }}
          >
            Host
          </Text>
        </View>

        {/* HOST SUPPORTERS */}
        <View
          style={{
            position: 'absolute',
            left: 25,
            bottom: 12,
            flexDirection: 'row',
          }}
        >
          {['👩🏻','👩🏼','👩🏽'].map((avatar, i) => (
            <View
              key={i}
              style={{
                width: 47,
                height: 47,
                borderRadius: 24,
                backgroundColor: '#242028',
                borderWidth: 2,
                borderColor: '#ff3b9c',
                alignItems: 'center',
                justifyContent: 'center',
                marginLeft: i === 0 ? 0 : -9,
              }}
            >
              <Text style={{ fontSize: 24 }}>{avatar}</Text>

              <View
                style={{
                  position: 'absolute',
                  right: -3,
                  bottom: -4,
                  width: 20,
                  height: 20,
                  borderRadius: 10,
                  backgroundColor: '#ff1687',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text
                  style={{
                    color: '#fff',
                    fontSize: 10,
                    fontWeight: '900',
                  }}
                >
                  {3 - i}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* OPPONENT SIDE */}
      <View
        style={{
          width: '50%',
          height: '100%',
          overflow: 'hidden',
          backgroundColor: '#0d1523',
          borderTopLeftRadius: 14,
          borderBottomLeftRadius: 14,
          borderTopWidth: 2,
          borderLeftWidth: 2,
          borderBottomWidth: 2,
          borderColor: '#148cff',
        }}
      >
        {multiGuestTracks && multiGuestTracks[0] ? (
          <VideoTrack
            trackRef={multiGuestTracks[0]}
            style={{
              width: '100%',
              height: '100%',
            }}
          />
        ) : (
          <View
            style={{
              flex: 1,
              backgroundColor: '#101827',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <View
              style={{
                width: 88,
                height: 88,
                borderRadius: 44,
                backgroundColor: 'rgba(45,130,240,0.16)',
                borderWidth: 1,
                borderColor: 'rgba(80,160,255,0.30)',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={{ fontSize: 42 }}>👤</Text>
            </View>

            <Text
              style={{
                color: '#fff',
                fontSize: 15,
                fontWeight: '800',
                marginTop: 12,
              }}
            >
              Waiting for opponent
            </Text>
          </View>
        )}

        {/* OPPONENT NAME */}
        <View
          style={{
            position: 'absolute',
            top: 12,
            right: 14,
            height: 42,
            paddingHorizontal: 13,
            borderRadius: 21,
            backgroundColor: 'rgba(8,13,23,0.82)',
            borderWidth: 1,
            borderColor: '#148cff',
            flexDirection: 'row',
            alignItems: 'center',
          }}
        >
          <View
            style={{
              width: 27,
              height: 27,
              borderRadius: 14,
              backgroundColor: '#148cff',
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: 7,
            }}
          >
            <Text style={{ color: '#fff', fontSize: 14 }}>2</Text>
          </View>

          <Text
            style={{
              color: '#fff',
              fontSize: 16,
              fontWeight: '900',
            }}
          >
            Liam
          </Text>
        </View>

        {/* OPPONENT SUPPORTERS */}
        <View
          style={{
            position: 'absolute',
            right: 25,
            bottom: 12,
            flexDirection: 'row',
          }}
        >
          {['👨🏻','👩🏻','👨🏼'].map((avatar, i) => (
            <View
              key={i}
              style={{
                width: 47,
                height: 47,
                borderRadius: 24,
                backgroundColor: '#1c2430',
                borderWidth: 2,
                borderColor: '#1b9cff',
                alignItems: 'center',
                justifyContent: 'center',
                marginLeft: i === 0 ? 0 : -9,
              }}
            >
              <Text style={{ fontSize: 24 }}>{avatar}</Text>

              <View
                style={{
                  position: 'absolute',
                  right: -3,
                  bottom: -4,
                  width: 20,
                  height: 20,
                  borderRadius: 10,
                  backgroundColor: '#148cff',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text
                  style={{
                    color: '#fff',
                    fontSize: 10,
                    fontWeight: '900',
                  }}
                >
                  {i + 1}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* CENTER PK TIMER */}
      <View
        style={{
          position: 'absolute',
          left: '50%',
          top: 0,
          marginLeft: -76,
          width: 152,
          height: 60,
          borderBottomLeftRadius: 28,
          borderBottomRightRadius: 28,
          backgroundColor: '#08090f',
          borderLeftWidth: 2,
          borderRightWidth: 2,
          borderBottomWidth: 2,
          borderColor: '#ff1687',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 30,
          elevation: 30,
        }}
      >
        <Text
          style={{
            fontSize: 27,
            fontWeight: '900',
          }}
        >
          <Text style={{ color: '#ff1687', fontStyle: 'italic' }}>
            PK
          </Text>
          <Text style={{ color: '#fff' }}>
            {' '}04:23
          </Text>
        </Text>
      </View>

      {/* CENTER VS */}
      <View
        style={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          width: 92,
          height: 92,
          marginLeft: -46,
          marginTop: -46,
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 40,
          elevation: 40,
        }}
      >
        <Text
          style={{
            fontSize: 72,
            fontWeight: '900',
            fontStyle: 'italic',
            letterSpacing: -9,
            includeFontPadding: false,
            textShadowOffset: { width: 0, height: 4 },
            textShadowRadius: 12,
            textShadowColor: '#ff1687',
          }}
        >
          <Text style={{ color: '#ff4ba8' }}>V</Text>
          <Text
            style={{
              color: '#55a4ff',
              textShadowColor: '#147fff',
            }}
          >
            S
          </Text>
        </Text>
      </View>
    </View>

    {/* =========================
        BATTLE FEED
       ========================= */}
    <View
      style={{
        position: 'absolute',
        left: 18,
        right: 78,
        bottom: 104,
        zIndex: 20,
        elevation: 20,
      }}
    >
      {[
        ['👨🏻', 'James', 'sent Rose', '🌹', 'x 10'],
        ['👨🏼', 'Sophia', 'sent TikTok', '🎵', 'x 5'],
        ['👨🏻', 'Daniel', 'Amazing battle!', '🔥', ''],
        ['👩🏻', 'Emma', 'Team Anna!', '❤️', ''],
        ['👨🏻', 'Ryan', 'Team Liam!', '💙', ''],
        ['👩🏼', 'Isabella', 'This is intense!', '😍', ''],
      ].map((row, i) => (
        <View
          key={i}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            height: i < 2 ? 49 : 43,
          }}
        >
          <View
            style={{
              width: 39,
              height: 39,
              borderRadius: 20,
              backgroundColor: '#27262d',
              borderWidth: 1,
              borderColor: 'rgba(255,255,255,0.20)',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{ fontSize: 21 }}>{row[0]}</Text>
          </View>

          <Text
            style={{
              color: '#fff',
              fontSize: 15,
              fontWeight: i < 2 ? '900' : '700',
              marginLeft: 9,
            }}
          >
            {row[1]}
          </Text>

          <Text
            style={{
              color: '#bcbac3',
              fontSize: 14,
              marginLeft: 12,
            }}
          >
            {row[2]}
          </Text>

          <Text
            style={{
              fontSize: 25,
              marginLeft: 7,
            }}
          >
            {row[3]}
          </Text>

          {row[4] ? (
            <Text
              style={{
                color: '#fff',
                fontSize: 15,
                fontWeight: '900',
                marginLeft: 5,
              }}
            >
              {row[4]}
            </Text>
          ) : null}
        </View>
      ))}
    </View>

    {/* =========================
        RIGHT HEART STREAM
       ========================= */}
    <View
      style={{
        position: 'absolute',
        right: 14,
        bottom: 112,
        width: 48,
        alignItems: 'center',
        zIndex: 25,
        elevation: 25,
      }}
    >
      {['♥','♥','♥','♥','♥'].map((heart, i) => (
        <Text
          key={i}
          style={{
            color: i === 2 ? '#ff238d' : '#ff3c98',
            fontSize: 38 - i * 2,
            marginTop: i === 0 ? 0 : 4,
            opacity: 1 - i * 0.08,
          }}
        >
          {heart}
        </Text>
      ))}
    </View>

    {/* =========================
        BOTTOM ACTION BAR
       ========================= */}
    <View
      style={{
        position: 'absolute',
        left: 14,
        right: 14,
        bottom: 14,
        height: 72,
        flexDirection: 'row',
        alignItems: 'center',
        zIndex: 50,
        elevation: 50,
      }}
    >

      {/* SUBSCRIBE */}
      <Pressable
        style={{
          width: 72,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text style={{ fontSize: 31 }}>⭐</Text>
        <Text
          style={{
            color: '#fff',
            fontSize: 11,
            fontWeight: '700',
            marginTop: 2,
          }}
        >
          Subscribe
        </Text>
      </Pressable>

      {/* COMMENT */}
      <View
        style={{
          flex: 1,
          height: 58,
          borderRadius: 29,
          backgroundColor: 'rgba(31,31,38,0.96)',
          borderWidth: 1,
          borderColor: 'rgba(255,255,255,0.10)',
          justifyContent: 'center',
          paddingHorizontal: 22,
          marginHorizontal: 8,
        }}
      >
        <Text
          style={{
            color: '#9b9aa3',
            fontSize: 17,
          }}
        >
          Comment...
        </Text>
      </View>

      {/* ROSE */}
      <Pressable
        onPress={() => setGiftOpen(true)}
        style={{
          width: 62,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text style={{ fontSize: 30 }}>🌹</Text>
        <Text
          style={{
            color: '#fff',
            fontSize: 11,
            fontWeight: '700',
            marginTop: 2,
          }}
        >
          Rose
        </Text>
      </Pressable>

      {/* GIFT */}
      <Pressable
        onPress={() => setGiftOpen(true)}
        style={{
          width: 62,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text style={{ fontSize: 30 }}>🎁</Text>
        <Text
          style={{
            color: '#fff',
            fontSize: 11,
            fontWeight: '700',
            marginTop: 2,
          }}
        >
          Gift
        </Text>
      </Pressable>

      {/* SHARE */}
      <Pressable
        style={{
          width: 62,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text
          style={{
            color: '#fff',
            fontSize: 32,
            lineHeight: 32,
          }}
        >
          ↗
        </Text>
        <Text
          style={{
            color: '#fff',
            fontSize: 11,
            fontWeight: '700',
            marginTop: 2,
          }}
        >
          Share
        </Text>
      </Pressable>

      {/* MORE */}
      <Pressable
        onPress={() => setMoreOpen(true)}
        style={{
          width: 62,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text
          style={{
            color: '#fff',
            fontSize: 31,
            lineHeight: 28,
            fontWeight: '900',
            letterSpacing: 2,
          }}
        >
          •••
        </Text>
        <Text
          style={{
            color: '#fff',
            fontSize: 11,
            fontWeight: '700',
            marginTop: 4,
          }}
        >
          More
        </Text>
      </Pressable>
    </View>

  </View>
)}

{activeGift && (
  <Animated.View
    pointerEvents="none"
    style={[styles.giftOverlay, { opacity: giftOpacity }]}
  >
    <View style={styles.giftBanner}>
      <Text style={styles.giftBannerText}>
        Hassan sent {activeGift.name} ×{giftCombo}
      </Text>
    </View>

    {activeGift.video ? (
      <Animated.View
        style={[
          styles.lionStage,
          {
            opacity: giftOpacity,
            transform: [{ scale: giftScale }],
          },
        ]}
      >
        <LionChromaVideo source={activeGift.video} />
      </Animated.View>
    ) : (
      <Animated.View
        style={[
          styles.genericGiftStage,
          {
            transform: [{ scale: giftScale }],
          },
        ]}
      >
        <Text style={styles.genericGiftIcon}>
          {activeGift.icon}
        </Text>

        <Text style={styles.genericGiftTitle}>
          {activeGift.name.toUpperCase()}
        </Text>

        <Text style={styles.genericGiftSub}>
          {activeGift.rarity} Gift
        </Text>
      </Animated.View>
    )}
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
  height:'100%',
  position:'relative',
  backgroundColor:'#050505'
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
},video:{width:'100%',height:'100%'},label:{position:'absolute',left:6,bottom:6,paddingHorizontal:7,paddingVertical:4,borderRadius:10,backgroundColor:'#000b'},labelText:{color:'#fff',fontSize:10,fontWeight:'700'},empty:{alignItems:'center',justifyContent:'center'},emptyText:{color:'#777'},controls:{position:'absolute',bottom:18,left:14,right:14,flexDirection:'row',gap:10,justifyContent:'center',alignItems:'center'},control:{minWidth:72,height:44,paddingHorizontal:12,borderRadius:22,backgroundColor:'rgba(15,15,22,0.72)',borderWidth:1,borderColor:'rgba(255,255,255,0.14)',alignItems:'center',justifyContent:'center',flexDirection:'row',gap:7},controlIcon:{fontSize:17,color:'#fff',lineHeight:20},controlLabel:{color:'#fff',fontSize:12,fontWeight:'700'},
giftControl:{width:56,height:56,borderRadius:28,backgroundColor:'rgba(255,45,114,0.9)',borderWidth:1,borderColor:'rgba(255,255,255,0.18)',alignItems:'center',justifyContent:'center'},endControl:{width:56,height:56,borderRadius:28,backgroundColor:'rgba(220,45,65,0.9)',borderWidth:1,borderColor:'rgba(255,255,255,0.18)',alignItems:'center',justifyContent:'center'},endIcon:{color:'#fff',fontSize:18,fontWeight:'900'},endLabel:{color:'#fff',fontSize:9,fontWeight:'800',marginTop:1},
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
giftBanner:{position:'absolute',top:72,left:28,right:28,minHeight:44,borderRadius:22,backgroundColor:'rgba(12,12,16,0.78)',borderWidth:1,borderColor:'rgba(255,215,106,0.45)',alignItems:'center',justifyContent:'center',paddingHorizontal:16,zIndex:5},
giftBannerText:{color:'#fff',fontSize:14,fontWeight:'800',letterSpacing:0.15},
lionStage:{position:'absolute',left:0,right:0,top:70,bottom:95,alignItems:'center',justifyContent:'center',backgroundColor:'transparent',zIndex:2},
lionImage:{width:'100%',height:'100%',transform:[{scale:1.08}]},
genericGiftStage:{width:'82%',height:'48%',borderRadius:30,backgroundColor:'rgba(32,22,10,0.96)',borderWidth:1,borderColor:'#d5a83c',alignItems:'center',justifyContent:'center'},
genericGiftIcon:{fontSize:105},
genericGiftTitle:{color:'#ffe08a',fontSize:28,fontWeight:'900',letterSpacing:2,marginTop:12},
genericGiftSub:{color:'#fff',fontSize:13,marginTop:7,opacity:0.9},
giftCaption:{position:'absolute',bottom:96,alignItems:'center'},
giftTitle:{color:'#ffe08a',fontSize:27,fontWeight:'900',letterSpacing:2,textShadowColor:'#000',textShadowRadius:10},
giftSub:{color:'#fff',fontSize:13,marginTop:4,opacity:0.9},controlText:{color:'#fff',fontWeight:'700'},end:{color:'#ff6b96',fontWeight:'900'},inviteOverlay:{position:'absolute',left:0,right:0,top:0,bottom:0,backgroundColor:'#0009',zIndex:20,justifyContent:'flex-end'},invitePanel:{backgroundColor:'#151515',borderTopLeftRadius:24,borderTopRightRadius:24,padding:18,paddingBottom:32},inviteHeader:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',marginBottom:6},inviteTitle:{color:'#fff',fontSize:21,fontWeight:'900'},inviteClose:{color:'#fff',fontSize:30},inviteSubtitle:{color:'#999',fontSize:13,marginBottom:14},userRow:{height:58,flexDirection:'row',alignItems:'center',borderBottomWidth:1,borderBottomColor:'#292929'},avatar:{width:40,height:40,borderRadius:20,backgroundColor:'#292929',alignItems:'center',justifyContent:'center'},avatarText:{color:'#fff',fontWeight:'900'},userName:{color:'#fff',fontSize:15,fontWeight:'700',flex:1,marginLeft:12},inviteButton:{backgroundColor:'#ff2d72',paddingHorizontal:17,paddingVertical:9,borderRadius:18},inviteButtonText:{color:'#fff',fontWeight:'900'},incomingOverlay:{position:'absolute',left:0,right:0,top:0,bottom:0,backgroundColor:'#000b',zIndex:30,alignItems:'center',justifyContent:'center',padding:24},incomingPanel:{width:'100%',backgroundColor:'#171717',borderRadius:24,padding:22},incomingTitle:{color:'#fff',fontSize:22,fontWeight:'900',marginBottom:8},incomingText:{color:'#bbb',fontSize:15,lineHeight:22,marginBottom:20},incomingActions:{flexDirection:'row',gap:12},rejectButton:{flex:1,backgroundColor:'#292929',paddingVertical:13,borderRadius:22,alignItems:'center'},acceptButton:{flex:1,backgroundColor:'#ff2d72',paddingVertical:13,borderRadius:22,alignItems:'center'},multiGuestOverlay:{position:'absolute',left:0,right:0,top:0,bottom:0,backgroundColor:'rgba(0,0,0,0.48)',zIndex:40,justifyContent:'flex-end'},multiGuestPanel:{backgroundColor:'#101016',borderTopLeftRadius:30,borderTopRightRadius:30,paddingHorizontal:20,paddingTop:10,paddingBottom:32},multiGuestHandle:{width:42,height:4,borderRadius:4,backgroundColor:'#555',alignSelf:'center',marginBottom:18},multiGuestHeader:{flexDirection:'row',alignItems:'center',justifyContent:'space-between'},multiGuestTitle:{color:'#fff',fontSize:24,fontWeight:'900'},multiGuestClose:{color:'#fff',fontSize:30,width:38,height:38,borderRadius:19,backgroundColor:'#202027',textAlign:'center',lineHeight:35},multiGuestSub:{color:'#8f8f9c',fontSize:13,marginTop:5,marginBottom:18},multiGuestAction:{flexDirection:'row',alignItems:'center',backgroundColor:'#181820',borderRadius:20,padding:16,marginBottom:10,borderWidth:1,borderColor:'#272732'},multiGuestActionIcon:{width:48,height:48,borderRadius:16,backgroundColor:'#252532',textAlign:'center',lineHeight:48,fontSize:24,color:'#fff',marginRight:14},multiGuestActionTitle:{color:'#fff',fontSize:16,fontWeight:'800'},multiGuestActionSub:{color:'#8f8f9c',fontSize:12,marginTop:4},actionText:{color:'#fff',fontWeight:'900'}});
