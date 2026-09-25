import "react-native-get-random-values";
import { Stack } from "expo-router";
import { registerGlobals } from "@livekit/react-native";

registerGlobals();

export default function Layout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}