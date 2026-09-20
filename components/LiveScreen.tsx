import { useEffect, useRef, useState } from "react";
import { View, Text, Pressable, StyleSheet, TextInput, ScrollView, Image, Animated } from "react-native";
import LiveCamera from "./LiveCamera";

type Gift = { id:string; name:string; price:number; icon:string; rarity:string };
const guests = ["Guest 1","Guest 2","Guest 3","Guest 4","Guest 5","Guest 6"];
const gifts:Gift[] = [
  {id:"rose",name:"Rose",price:1,icon:"🌹",rarity:"Common"},
  {id:"heart",name:"Heart",price:5,icon:"💗",rarity:"Common"},
  {id:"crown",name:"Crown",price:500,icon:"👑",rarity:"Epic"},
  {id:"lion",name:"Lion",price:1000,icon:"🦁",rarity:"Legendary"},
  {id:"dragon",name:"Dragon",price:2500,icon:"🐉",rarity:"Legendary"},
  {id:"universe",name:"Universe",price:10000,icon:"🌌",rarity:"Ultra"},
];

export default function LiveScreen({onClose}:{onClose:()=>void}) {
  const [giftOpen,setGiftOpen] = useState(false);
  const [guestOpen,setGuestOpen] = useState(true);
  const [coinBalance,setCoinBalance] = useState(1250);
  const [selectedTarget,setSelectedTarget] = useState("HOST");
  const [muted,setMuted] = useState(false);
  const [activeGift,setActiveGift] = useState<Gift|null>(null);
  const [combo,setCombo] = useState(0);
  const scale = useRef(new Animated.Value(.72)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const hideTimer = useRef<ReturnType<typeof setTimeout>|null>(null);

  useEffect(()=>()=>{ if(hideTimer.current) clearTimeout(hideTimer.current); },[]);

  const sendGift = (gift:Gift) => {
    if (coinBalance < gift.price) return;
    setCoinBalance(v=>v-gift.price);
    setGiftOpen(false);
    setActiveGift(gift);
    setCombo(v=>v+1);
    scale.setValue(.72); opacity.setValue(0);
    Animated.parallel([
      Animated.spring(scale,{toValue:1,useNativeDriver:true,friction:6}),
      Animated.timing(opacity,{toValue:1,duration:220,useNativeDriver:true}),
    ]).start();
    if(hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current=setTimeout(()=>{
      Animated.timing(opacity,{toValue:0,duration:450,useNativeDriver:true}).start(()=>setActiveGift(null));
    },5200);
  };

  return <View style={styles.root}>
    <View style={styles.video}>
      <View style={styles.top}>
        <View><Text style={styles.live}>● LIVE</Text><Text style={styles.host}>Creator Name · 12.5K</Text></View>
        <View style={styles.row}>
          <Pressable style={styles.icon}><Text style={styles.iconText}>↗</Text></Pressable>
          <Pressable style={styles.icon} onPress={onClose}><Text style={styles.iconText}>×</Text></Pressable>
        </View>
      </View>

      {guestOpen ? <View style={styles.grid}>
        <View style={[styles.cell,styles.hostCell]}><LiveCamera muted={muted} onToggleMute={()=>setMuted(v=>!v)} /><View style={styles.hostLabel}><Text style={styles.cellText}>HOST</Text></View></View>
        {guests.map((g,i)=><View key={g} style={styles.cell}><View style={styles.guestPlaceholder}><Text style={styles.cellText}>{g}</Text><Text style={styles.viewer}>{(i+1)*1.2}K</Text></View></View>)}
      </View> : <View style={styles.single}><Text style={styles.singleText}>HOST VIDEO</Text></View>}

      <View style={styles.chat}>
        <Text style={styles.msg}>Zain  You are amazing! ❤️</Text>
        <Text style={styles.msg}>Sarah  Great live 🔥</Text>
        <Text style={styles.msg}>Ali  Welcome everyone!</Text>
        <Text style={styles.giftMsg}>Hassan sent {activeGift?.name ?? "Rose"} ×{activeGift ? combo : 1} → {selectedTarget}</Text>
      </View>

      <View style={styles.bottom}>
        <TextInput placeholder="Say something..." placeholderTextColor="#8e8e93" style={styles.input}/>
        <Pressable style={styles.action} onPress={()=>setGiftOpen(true)}><Text style={styles.actionEmoji}>🎁</Text><Text style={styles.actionText}>Gift</Text></Pressable>
        <Pressable style={styles.action} onPress={()=>setGuestOpen(v=>!v)}><Text style={styles.actionEmoji}>👥</Text><Text style={styles.actionText}>Guests</Text></Pressable>
        <Pressable style={styles.action}><Text style={styles.actionEmoji}>•••</Text><Text style={styles.actionText}>More</Text></Pressable>
      </View>
    </View>

    {giftOpen && <View style={styles.sheet}>
      <View style={styles.sheetHead}><View><Text style={styles.sheetTitle}>Send Gift</Text><Text style={styles.sheetSub}>Choose recipient</Text></View><Pressable onPress={()=>setGiftOpen(false)}><Text style={styles.close}>×</Text></Pressable></View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.targetRow}>
        {["HOST",...guests].map(x=><Pressable key={x} onPress={()=>setSelectedTarget(x)} style={[styles.target,{borderColor:selectedTarget===x?"#ff2d72":"#2a2a2a"}]}><Text style={styles.targetText}>{x}</Text></Pressable>)}
      </ScrollView>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabs}>
        {["Popular","Luxury","Love","Special"].map(x=><Text key={x} style={styles.tab}>{x}</Text>)}
      </ScrollView>
      <View style={styles.gifts}>{gifts.map(g=><Pressable key={g.id} style={[styles.gift,g.rarity==="Legendary"&&styles.legendaryGift]} onPress={()=>sendGift(g)}>
        <Text style={styles.giftEmoji}>{g.icon}</Text>
        <Text style={styles.giftName}>{g.name}</Text><Text style={styles.price}>🪙 {g.price.toLocaleString()}</Text>
      </Pressable>)}</View>
      <View style={styles.sendRow}><Text style={styles.balance}>🪙 {coinBalance.toLocaleString()}</Text><Text style={styles.targetLabel}>To: {selectedTarget}</Text></View>
    </View>}

    {activeGift && <Animated.View style={[styles.giftOverlay,{opacity}]}> 
      <View style={styles.giftDim}/>
      <View style={styles.giftBanner}>
        <View style={styles.senderAvatar}><Text style={styles.senderInitial}>H</Text></View>
        <Text style={styles.giftBannerText}><Text style={styles.senderName}>Hassan</Text> sent {activeGift.name}</Text>
        <Text style={styles.giftCount}>×{combo}</Text>
      </View>
      {activeGift.id === "lion" ? <Animated.View style={[styles.lionStage,{transform:[{scale}]}]}><Image source={require("../assets/lion-gift-preview.png")} style={styles.lionImage} resizeMode="cover"/></Animated.View> :
        <Animated.View style={[styles.genericStage,{transform:[{scale}]}]}><Text style={styles.genericIcon}>{activeGift.icon}</Text><Text style={styles.genericTitle}>{activeGift.name.toUpperCase()}</Text><Text style={styles.genericSub}>{activeGift.rarity} Gift · {activeGift.price.toLocaleString()} coins</Text></Animated.View>}
      <View style={styles.giftCaption}><Text style={styles.giftTitle}>{activeGift.name === "Lion" ? "LEGENDARY LION" : activeGift.name.toUpperCase()}</Text><Text style={styles.giftSub}>Sent to {selectedTarget} · {combo} combo</Text></View>
    </Animated.View>}
  </View>
}

const styles=StyleSheet.create({
root:{flex:1,backgroundColor:"#000"},video:{flex:1,backgroundColor:"#111"},top:{padding:14,paddingTop:18,flexDirection:"row",justifyContent:"space-between",zIndex:3},row:{flexDirection:"row",gap:8},live:{color:"#ff3b78",fontWeight:"800"},host:{color:"#fff",marginTop:3},icon:{width:40,height:40,borderRadius:20,backgroundColor:"#0009",alignItems:"center",justifyContent:"center"},iconText:{color:"#fff",fontSize:22},grid:{position:"absolute",top:0,bottom:0,left:0,right:0,flexDirection:"row",flexWrap:"wrap",paddingTop:70,paddingBottom:115},cell:{width:"33.333%",height:"25%",borderWidth:1,borderColor:"#222",backgroundColor:"#171717",alignItems:"center",justifyContent:"center"},hostCell:{backgroundColor:"#222"},cellText:{color:"#ddd",fontWeight:"700"},guestPlaceholder:{alignItems:"center",justifyContent:"center",flex:1},hostLabel:{position:"absolute",left:8,bottom:8,paddingHorizontal:7,paddingVertical:4,borderRadius:10,backgroundColor:"#0009"},viewer:{color:"#777",fontSize:11,marginTop:4},single:{flex:1,alignItems:"center",justifyContent:"center"},singleText:{color:"#555",fontSize:20,fontWeight:"800"},chat:{position:"absolute",left:14,right:14,bottom:78},msg:{color:"#eee",fontSize:13,marginTop:7},giftMsg:{color:"#ff77a7",fontSize:13,marginTop:7,fontWeight:"700"},bottom:{position:"absolute",left:10,right:10,bottom:10,flexDirection:"row",alignItems:"center",gap:8},input:{flex:1,height:46,borderRadius:23,backgroundColor:"#181818",paddingHorizontal:16,color:"#fff"},action:{alignItems:"center",minWidth:45},actionEmoji:{fontSize:21},actionText:{color:"#ddd",fontSize:10,marginTop:2},
sheet:{position:"absolute",left:0,right:0,bottom:0,backgroundColor:"#111",borderTopLeftRadius:22,borderTopRightRadius:22,padding:16},sheetHead:{flexDirection:"row",justifyContent:"space-between",alignItems:"center"},sheetTitle:{color:"#fff",fontSize:20,fontWeight:"800"},sheetSub:{color:"#888",fontSize:12,marginTop:3},close:{color:"#aaa",fontSize:28},targetRow:{marginVertical:12},target:{borderWidth:1,borderRadius:18,paddingHorizontal:13,paddingVertical:8,marginRight:7},targetText:{color:"#eee",fontSize:11,fontWeight:"700"},tabs:{marginBottom:14},tab:{color:"#bbb",marginRight:24,fontWeight:"700"},gifts:{flexDirection:"row",flexWrap:"wrap",gap:8},gift:{width:"31%",backgroundColor:"#1b1b1b",borderRadius:14,padding:10,alignItems:"center"},legendaryGift:{borderWidth:1,borderColor:"#7a5a20"},giftEmoji:{fontSize:28},giftName:{color:"#fff",marginTop:4},price:{color:"#aaa",fontSize:11,marginTop:2},sendRow:{flexDirection:"row",justifyContent:"space-between",alignItems:"center",marginTop:14},balance:{color:"#ddd",fontWeight:"700"},targetLabel:{color:"#ff77a7",fontSize:12},
giftOverlay:{...StyleSheet.absoluteFillObject,zIndex:50,alignItems:"center",justifyContent:"center"},giftDim:{...StyleSheet.absoluteFillObject,backgroundColor:"rgba(0,0,0,0.3)"},giftBanner:{position:"absolute",top:72,left:16,right:16,height:58,borderRadius:30,backgroundColor:"rgba(20,12,5,0.94)",borderWidth:1,borderColor:"#f4bd4f",flexDirection:"row",alignItems:"center",paddingHorizontal:10,zIndex:3},senderAvatar:{width:40,height:40,borderRadius:20,backgroundColor:"#f4bd4f",alignItems:"center",justifyContent:"center",marginRight:10},senderInitial:{color:"#1a1005",fontSize:18,fontWeight:"900"},giftBannerText:{color:"#fff",fontSize:15,flex:1},senderName:{color:"#ffd76a",fontWeight:"900"},giftCount:{color:"#ffd76a",fontSize:24,fontWeight:"900",marginLeft:8},lionStage:{width:"96%",height:"68%",borderRadius:28,overflow:"hidden",borderWidth:1,borderColor:"rgba(255,215,106,0.55)",shadowColor:"#f7b942",shadowOpacity:.7,shadowRadius:30},lionImage:{width:"100%",height:"100%"},genericStage:{width:"88%",height:"55%",borderRadius:30,backgroundColor:"rgba(32,22,10,.96)",borderWidth:1,borderColor:"#d5a83c",alignItems:"center",justifyContent:"center",shadowColor:"#f7b942",shadowOpacity:.7,shadowRadius:35},genericIcon:{fontSize:120},genericTitle:{color:"#ffe08a",fontSize:30,fontWeight:"900",letterSpacing:2,marginTop:15},genericSub:{color:"#fff",fontSize:13,marginTop:8,opacity:.9},giftCaption:{position:"absolute",bottom:96,alignItems:"center",zIndex:3},giftTitle:{color:"#ffe08a",fontSize:28,fontWeight:"900",letterSpacing:2,textShadowColor:"#000",textShadowRadius:10},giftSub:{color:"#fff",fontSize:13,marginTop:4,opacity:.9}
});
