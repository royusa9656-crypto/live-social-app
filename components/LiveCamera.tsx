import { useEffect } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Audio } from 'expo-av';

export default function LiveCamera({ muted, onToggleMute }: { muted: boolean; onToggleMute: () => void }) {
  const [permission, requestPermission] = useCameraPermissions();

  useEffect(() => {
    Audio.requestPermissionsAsync().catch(() => {});
  }, []);

  if (!permission) return <View style={styles.center}><Text style={styles.text}>Checking camera…</Text></View>;
  if (!permission.granted) return (
    <View style={styles.center}>
      <Text style={styles.text}>Camera access is needed for live video.</Text>
      <Pressable style={styles.button} onPress={requestPermission}><Text style={styles.buttonText}>Allow Camera</Text></Pressable>
    </View>
  );

  return <View style={StyleSheet.absoluteFill}>
    <CameraView style={StyleSheet.absoluteFill} facing="front" active />
    <View style={styles.badge}><Text style={styles.badgeText}>● LIVE CAMERA</Text></View>
    <Pressable style={styles.mute} onPress={onToggleMute}>
      <Text style={styles.muteText}>{muted ? '🔇' : '🎙️'}</Text>
    </Pressable>
  </View>;
}

const styles = StyleSheet.create({
  center:{flex:1,backgroundColor:'#111',alignItems:'center',justifyContent:'center',padding:24},
  text:{color:'#fff',textAlign:'center',fontSize:15},
  button:{marginTop:18,paddingHorizontal:20,paddingVertical:12,borderRadius:22,backgroundColor:'#ff2d72'},
  buttonText:{color:'#fff',fontWeight:'800'},
  badge:{position:'absolute',top:76,left:14,paddingHorizontal:10,paddingVertical:6,borderRadius:14,backgroundColor:'#000a'},
  badgeText:{color:'#fff',fontSize:11,fontWeight:'900'},
  mute:{position:'absolute',right:14,bottom:130,width:44,height:44,borderRadius:22,backgroundColor:'#000b',alignItems:'center',justifyContent:'center'},
  muteText:{fontSize:19}
});
