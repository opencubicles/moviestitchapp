import { Text, View } from "react-native";
import { ActivityIndicator, MD2Colors } from 'react-native-paper';


export default function Index() {
  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <ActivityIndicator animating={true} color={MD2Colors.red800} />
      <Text>Edit app/index.tsx to edit this screen.</Text>
    </View>
  );
}
