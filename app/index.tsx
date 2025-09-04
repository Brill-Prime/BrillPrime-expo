
import { Text, View } from "react-native";

export default function Index() {
  const variant = process.env.APP_VARIANT || "main";
  
  if (variant === "admin") {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text>Brill Prime Admin Panel</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <Text>welcome to brillprime.</Text>
    </View>
  );
}
