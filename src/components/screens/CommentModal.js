import React, { useState } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { handleSubmitComment } from "../../store/index";
import { useDispatch } from "react-redux";

const CommentModal = ({ visible, onClose }) => {
  const [comment, setComment] = useState("");
  const dispatch = useDispatch();

  const handleSubmit = () => {
    if (comment.trim() === "") {
      Alert.alert("Error", "Comment cannot be empty");
      return;
    }
    dispatch(handleSubmitComment(comment));
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.modalCard}>
          <Text style={styles.title}>Add Comment</Text>
          <Text style={styles.subtitle}>
            This will appear with your submission
          </Text>

          <TextInput
            style={styles.input}
            value={comment}
            onChangeText={setComment}
            placeholder="Type your comment here..."
            placeholderTextColor="#888"
            multiline
          />

          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={() => {
                onClose();
                setComment("");
              }}
              accessibilityLabel="Cancel and close the comment modal"
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.submitBtn,
                !comment.trim() && styles.submitBtnDisabled,
              ]}
              onPress={handleSubmit}
              disabled={!comment.trim()}
              accessibilityLabel="Submit your comment"
            >
              <Text
                style={[
                  styles.submitText,
                  !comment.trim() && styles.submitTextDisabled,
                ]}
              >
                Submit
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 20,
    width: "90%",
    maxWidth: 400,
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 6,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1C2526",
    marginBottom: 6,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    color: "#666",
    marginBottom: 16,
    textAlign: "center",
  },
  input: {
    width: "100%",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    color: "#333",
    marginBottom: 20,
    textAlignVertical: "top",
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  cancelBtn: {
    flex: 1,
    marginRight: 10,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#fab81e",
    alignItems: "center",
  },
  cancelText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fab81e",
  },
  submitBtn: {
    flex: 1,
    marginLeft: 10,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: "#fab81e",
    alignItems: "center",
  },
  submitBtnDisabled: {
    backgroundColor: "#ffe680",
  },
  submitText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
  submitTextDisabled: {
    color: "#999",
  },
});

export default CommentModal;
