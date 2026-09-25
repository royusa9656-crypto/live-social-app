import { useEffect, useState } from 'react';
import { supabase } from '../services/supabase';
import SfuLiveRoom from '../components/SfuLiveRoom';
import AuthScreen from '../components/AuthScreen';

import {
  View,
  Text,
  Pressable,
  StyleSheet,
  FlatList,
  Dimensions,
  StatusBar,
} from 'react-native';

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');

const FEED = [
  {
    id: '1',
    creator: '@alex',
    title: 'Night drive through the city 🌃',
    caption: 'The city looks completely different after midnight.',
    likes: '128K',
    comments: '3,421',
    shares: '8,902',
    gradient: '#171126',
  },
  {
    id: '2',
    creator: '@sarah',
    title: 'Beautiful mountain morning 🏔️',
    caption: 'Fresh air, incredible views and a perfect sunrise.',
    likes: '94K',
    comments: '2,108',
    shares: '5,620',
    gradient: '#10252b',
  },
  {
    id: '3',
    creator: '@daniel',
    title: 'Live from the city 🔥',
    caption: 'Going live soon. Follow for the stream!',
    likes: '76K',
    comments: '1,842',
    shares: '4,311',
    gradient: '#25121d',
  },
];

export default function Home() {
  const [sessionReady, setSessionReady] = useState(false);
  const [session, setSession] = useState<any>(null);
  const [tab, setTab] = useState<'following' | 'foryou'>('foryou');
  const [liked, setLiked] = useState<string | null>(null);
  const [showLive, setShowLive] = useState(false);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session);
      setSessionReady(true);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!mounted) return;
      setSession(nextSession);
      setSessionReady(true);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  if (!sessionReady) {
    return (
      <View style={{ flex: 1, backgroundColor: '#07070b', alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: '#fff' }}>Loading...</Text>
      </View>
    );
  }

  if (!session) {
    return <AuthScreen onAuthenticated={() => {}} />;
  }

  const renderItem = ({ item }: any) => (
    <View style={[styles.video, { backgroundColor: item.gradient }]}>
      <StatusBar barStyle="light-content" />

      {/* Fake cinematic background */}
      <View style={styles.backgroundGlow} />
      <View style={styles.backgroundCircle} />

      {/* Top navigation */}
      <View style={styles.topBar}>
        <Pressable onPress={() => setTab('following')}>
          <Text style={[styles.topTab, tab === 'following' && styles.activeTopTab]}>
            Following
          </Text>
        </Pressable>

        <Pressable onPress={() => setTab('foryou')}>
          <Text style={[styles.topTab, tab === 'foryou' && styles.activeTopTab]}>
            For You
          </Text>
        </Pressable>

        <Pressable style={styles.searchButton}>
          <Text style={styles.searchIcon}>⌕</Text>
        </Pressable>
      </View>

      {/* Right action bar */}
      <View style={styles.actions}>
        <Pressable style={styles.action} onPress={() => setLiked(item.id)}>
          <Text style={[styles.actionIcon, liked === item.id && styles.liked]}>
            ♥
          </Text>
          <Text style={styles.actionText}>{item.likes}</Text>
        </Pressable>

        <Pressable style={styles.action}>
          <Text style={styles.actionIcon}>💬</Text>
          <Text style={styles.actionText}>{item.comments}</Text>
        </Pressable>

        <Pressable style={styles.action}>
          <Text style={styles.actionIcon}>↗</Text>
          <Text style={styles.actionText}>{item.shares}</Text>
        </Pressable>

        <Pressable style={styles.action}>
          <View style={styles.giftCircle}>
            <Text style={styles.giftIcon}>🎁</Text>
          </View>
          <Text style={styles.actionText}>Gift</Text>
        </Pressable>

        <Pressable style={styles.musicButton}>
          <Text style={styles.musicIcon}>♫</Text>
        </Pressable>
      </View>

      {/* Creator information */}
      <View style={styles.creatorArea}>
        <View style={styles.creatorRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {item.creator.replace('@', '').charAt(0).toUpperCase()}
            </Text>
          </View>

          <Text style={styles.creator}>{item.creator}</Text>

          <Pressable style={styles.followButton}>
            <Text style={styles.followText}>Follow</Text>
          </Pressable>
        </View>

        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.caption}>{item.caption}</Text>

        <Text style={styles.sound}>♫ Original sound · Live Social</Text>
      </View>

      {/* Bottom navigation */}
      <View style={styles.bottomNav}>
        <Pressable style={styles.navItem}>
          <Text style={styles.navIconActive}>⌂</Text>
          <Text style={styles.navTextActive}>Home</Text>
        </Pressable>

        <Pressable style={styles.navItem}>
          <Text style={styles.navIcon}>◉</Text>
          <Text style={styles.navText}>Discover</Text>
        </Pressable>

        <Pressable style={styles.createButton}>
          <View style={styles.createInner}>
            <Text style={styles.plus}>+</Text>
          </View>
        </Pressable>

        <Pressable style={styles.navItem} onPress={() => setShowLive(true)}>
          <Text style={styles.navIcon}>LIVE</Text>
          <Text style={styles.navText}>Live</Text>
        </Pressable>

        <Pressable style={styles.navItem} onPress={() => supabase.auth.signOut()}>
          <Text style={styles.navIcon}>●</Text>
          <Text style={styles.navText}>Logout</Text>
        </Pressable>
      </View>
    </View>
  );

  if (showLive) {
    return (
      <SfuLiveRoom
        roomName="layout-test-room"
        identity={`host-${Math.floor(Math.random() * 10000)}`}
        role="host"
        onClose={() => setShowLive(false)}
      />
    );
  }

  return (
    <View style={styles.root}>
      <FlatList
        data={FEED}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        pagingEnabled
        showsVerticalScrollIndicator={false}
        snapToAlignment="start"
        decelerationRate="fast"
        getItemLayout={(_, index) => ({
          length: SCREEN_HEIGHT,
          offset: SCREEN_HEIGHT * index,
          index,
        })}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#000',
  },

  video: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    position: 'relative',
    overflow: 'hidden',
  },

  backgroundGlow: {
    position: 'absolute',
    width: SCREEN_WIDTH * 1.4,
    height: SCREEN_HEIGHT * 0.75,
    borderRadius: SCREEN_WIDTH,
    backgroundColor: '#35205c',
    opacity: 0.35,
    top: SCREEN_HEIGHT * 0.08,
    left: -SCREEN_WIDTH * 0.2,
  },

  backgroundCircle: {
    position: 'absolute',
    width: 230,
    height: 230,
    borderRadius: 115,
    backgroundColor: '#7040a0',
    opacity: 0.18,
    top: SCREEN_HEIGHT * 0.3,
    right: -70,
  },

  topBar: {
    position: 'absolute',
    top: 52,
    left: 0,
    right: 0,
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 28,
    zIndex: 10,
  },

  topTab: {
    color: '#aaa',
    fontSize: 16,
    fontWeight: '700',
  },

  activeTopTab: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '900',
  },

  searchButton: {
    position: 'absolute',
    right: 18,
    padding: 8,
  },

  searchIcon: {
    color: '#fff',
    fontSize: 29,
    fontWeight: '300',
  },

  actions: {
    position: 'absolute',
    right: 13,
    bottom: 155,
    alignItems: 'center',
    zIndex: 10,
  },

  action: {
    alignItems: 'center',
    marginBottom: 19,
  },

  actionIcon: {
    color: '#fff',
    fontSize: 30,
    textShadowColor: '#000',
    textShadowRadius: 5,
  },

  liked: {
    color: '#ff315f',
  },

  actionText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '800',
    marginTop: 3,
  },

  giftCircle: {
    width: 43,
    height: 43,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  giftIcon: {
    fontSize: 24,
  },

  musicButton: {
    width: 43,
    height: 43,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 3,
  },

  musicIcon: {
    color: '#fff',
    fontSize: 23,
  },

  creatorArea: {
    position: 'absolute',
    left: 16,
    right: 75,
    bottom: 105,
    zIndex: 10,
  },

  creatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },

  avatar: {
    width: 43,
    height: 43,
    borderRadius: 22,
    backgroundColor: '#ff2d72',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },

  avatarText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '900',
  },

  creator: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '900',
    marginLeft: 10,
  },

  followButton: {
    marginLeft: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#fff',
  },

  followText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '900',
  },

  title: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 5,
  },

  caption: {
    color: '#eee',
    fontSize: 14,
    lineHeight: 20,
  },

  sound: {
    color: '#fff',
    fontSize: 13,
    marginTop: 9,
    fontWeight: '600',
  },

  bottomNav: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 78,
    backgroundColor: 'rgba(0,0,0,0.82)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 7,
    zIndex: 20,
  },

  navItem: {
    width: 65,
    alignItems: 'center',
    justifyContent: 'center',
  },

  navIcon: {
    color: '#aaa',
    fontSize: 21,
    fontWeight: '800',
  },

  navIconActive: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '900',
  },

  navText: {
    color: '#999',
    fontSize: 10,
    marginTop: 4,
    fontWeight: '700',
  },

  navTextActive: {
    color: '#fff',
    fontSize: 10,
    marginTop: 4,
    fontWeight: '800',
  },

  createButton: {
    width: 58,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },

  createInner: {
    width: 54,
    height: 34,
    borderRadius: 8,
    backgroundColor: '#ff2d72',
    alignItems: 'center',
    justifyContent: 'center',
  },

  plus: {
    color: '#fff',
    fontSize: 29,
    lineHeight: 31,
    fontWeight: '300',
  },
});
