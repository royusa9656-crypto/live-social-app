import { useState } from 'react';
import { View, Text, Pressable, StyleSheet, TextInput } from 'react-native';
import LiveScreen from '../components/LiveScreen';
import SfuLiveRoom from '../components/SfuLiveRoom';

export default function Home(){
  const [mode,setMode]=useState<'home'|'prototype'|'sfu'>('home');
  const [room,setRoom]=useState('demo-room');
  const [identity,setIdentity]=useState('host-' + Math.floor(Math.random()*10000));
  const [role,setRole]=useState<'host'|'guest'>('host');
  if(mode==='prototype') return <LiveScreen onClose={()=>setMode('home')} />;
  if(mode==='sfu') return <SfuLiveRoom roomName={room} identity={identity} role={role} onClose={()=>setMode('home')} />;
  return <View style={styles.root}>
    <Text style={styles.title}>Live Social</Text><Text style={styles.sub}>V5 · Real SFU live-room foundation</Text>
    <TextInput value={room} onChangeText={setRoom} placeholder="Room name" placeholderTextColor="#777" style={styles.input}/>
    <TextInput value={identity} onChangeText={setIdentity} placeholder="Your identity" placeholderTextColor="#777" style={styles.input}/>
    <View style={styles.roles}><Pressable onPress={()=>setRole('host')} style={[styles.role,role==='host'&&styles.active]}><Text style={styles.roleText}>Host</Text></Pressable><Pressable onPress={()=>setRole('guest')} style={[styles.role,role==='guest'&&styles.active]}><Text style={styles.roleText}>Guest</Text></Pressable></View>
    <Pressable style={styles.primary} onPress={()=>setMode('sfu')}><Text style={styles.primaryText}>Enter Real Live Room</Text></Pressable>
    <Pressable style={styles.secondary} onPress={()=>setMode('prototype')}><Text style={styles.secondaryText}>Preview Gift UI</Text></Pressable>
    <Text style={styles.note}>The real room requires the API + LiveKit server configured from the V5 README.</Text>
  </View>
}
const styles=StyleSheet.create({root:{flex:1,backgroundColor:'#080808',justifyContent:'center',padding:24},title:{color:'#fff',fontSize:34,fontWeight:'900'},sub:{color:'#888',marginTop:7,marginBottom:30},input:{height:50,borderRadius:14,backgroundColor:'#171717',color:'#fff',paddingHorizontal:16,marginBottom:12},roles:{flexDirection:'row',gap:10,marginBottom:16},role:{flex:1,padding:14,borderRadius:14,backgroundColor:'#171717',alignItems:'center',borderWidth:1,borderColor:'#252525'},active:{borderColor:'#ff2d72'},roleText:{color:'#fff',fontWeight:'800'},primary:{backgroundColor:'#ff2d72',padding:16,borderRadius:18,alignItems:'center'},primaryText:{color:'#fff',fontWeight:'900'},secondary:{padding:16,borderRadius:18,alignItems:'center',marginTop:10},secondaryText:{color:'#ddd',fontWeight:'700'},note:{color:'#666',fontSize:12,lineHeight:18,textAlign:'center',marginTop:28}});
