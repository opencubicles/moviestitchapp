import { View, Text, StyleSheet, Modal, ActivityIndicator } from "react-native";

const colors = {
  primaryBg: "#1C2526",
  secondaryBg: "#2A3435",
  text: "#F5F6F5",
  accent: "#FFD700",
};

const UploadModal = ({ visible, uploading }) => {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          {uploading && (
            <>
              <ActivityIndicator size="large" color={colors.accent} />
              <Text style={styles.modalText}>Uploading Video...</Text>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.7)",
  },
  modalContent: {
    backgroundColor: colors.secondaryBg,
    borderRadius: 12,
    padding: 24,
    alignItems: "center",
    width: "70%",
  },
  modalText: {
    color: colors.text,
    fontSize: 18,
    marginTop: 12,
  },
});

export default UploadModal;
