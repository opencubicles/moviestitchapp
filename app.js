import { useState, useEffect, useRef } from "react";
import { StyleSheet, Alert, Animated, View, Text } from "react-native";
import { useSelector, useDispatch } from "react-redux";
import { Provider as ReduxProvider } from "react-redux";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Provider as PaperProvider } from "react-native-paper";
import store from "./store";
import AsyncStorage from "@react-native-async-storage/async-storage";
import MovieSelectionScreen from "./components/MovieSelectionScreen";
import SceneSelectionScreen from "./components/SceneSelectionScreen";
import VideoPlayerModal from "./components/VideoPlayerModal";
import UploadModal from "./components/UploadModal";
import CommentModal from "./components/CommentModal";
import * as ImagePicker from "expo-image-picker";
import { movieStitchApi } from "./api/movieStitchApi";
import { checkAuthStatus } from "./store";
import LoginScreen from "./components/LoginScreen";
import SignUpScreen from "./components/SignUpScreen";
import ForgotPasswordScreen from "./components/ForgotPassword";

const colors = {
  primaryBg: "#1C2526",
  secondaryBg: "#2A3435",
  text: "#F5F6F5",
  accent: "#FFD700",
  primaryAction: "#D32F2F",
  secondaryAction: "#455A64",
};

export default function AppWrapper() {
  return (
    <ReduxProvider store={store}>
      <SafeAreaProvider>
        <PaperProvider>
          <App />
        </PaperProvider>
      </SafeAreaProvider>
    </ReduxProvider>
  );
}

function App() {
  const dispatch = useDispatch();
  const selectedMovie = useSelector((state) => state.movie.selectedMovie);
  const [uploadModalVisible, setUploadModalVisible] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [currentSubSceneId, setCurrentSubSceneId] = useState(null);
  const [showSignUp, setShowSignUp] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [commentModalVisible, setCommentModalVisible] = useState(false);
  const [tempVideoKey, setTempVideoKey] = useState(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);
  const authLoading = useSelector((state) => state.auth.loading);

  useEffect(() => {
    AsyncStorage.getItem("hasSeenSplash").then((value) => {
      if (value === "true") {
        AsyncStorage.getItem("hasSeenWelcome").then((welcomeValue) => {
          if (welcomeValue === "true") {
            setShowSplash(false);
          } else {
            setShowSplash(false);
            setShowWelcome(true);
          }
        });
      } else {
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }).start();
      }
    });
  }, []);
  useEffect(() => {
    dispatch(checkAuthStatus());
  }, [dispatch]);

  const showSignUpScreen = () => {
    setShowSignUp(true);
  };

  const showLoginScreen = () => {
    setShowSignUp(false);
  };

  const handleSubmitComment = async (comment) => {
    if (!comment) {
      Alert.alert("Error", "Comment cannot be empty.");
      return;
    }
    const submissionData = {
      set_id: currentSubSceneId,
      comment: comment,
      video_file_key: tempVideoKey,
    };
    try {
      await movieStitchApi.addUserSubmission(submissionData);
      Alert.alert("Success", "Video uploaded and submission saved!");
    } catch (submissionError) {
      console.error("Failed to save submission metadata:", submissionError);
      Alert.alert("Error", "Failed to save submission to database.");
    } finally {
      setCommentModalVisible(false);
      setTempVideoKey(null);
      setUploading(false);
      setUploadModalVisible(false);
    }
  };

  const uploadFile = async (fileUri, presignedData) => {
    if (fileUri) {
      try {
        const response = await fetch(fileUri);
        if (!response.ok) {
          throw new Error(
            `Failed to read file: ${response.status} ${response.statusText}`
          );
        }
        const blob = await response.blob();
        if (blob.size === 0) {
          throw new Error("File is empty or could not be read");
        }
        const uploadResponse = await fetch(presignedData.url, {
          method: "PUT",
          body: blob,
          headers: presignedData.headers || {
            "Content-Type": "video/mp4",
          },
        });
        if (!uploadResponse.ok) {
          const errorText = await uploadResponse.text();
          console.error("Upload failed with status:", uploadResponse.status);
          console.error("Error response:", errorText);
          throw new Error(
            `Failed to upload file: ${uploadResponse.status} ${uploadResponse.statusText}`
          );
        }
        return uploadResponse;
      } catch (error) {
        console.error("Upload error:", error);
        setError(`Failed to upload file: ${error.message}`);
        throw error;
      }
    } else {
      throw new Error("No file provided for upload");
    }
  };

  const uploadVideo = async () => {
    try {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission Required",
          "Please grant permission to access your media library."
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["videos"],
        allowsEditing: true,
        quality: 1,
        videoMaxDuration: 60,
      });

      if (!result.canceled && result.assets[0]) {
        const videoAsset = result.assets[0];

        setUploadModalVisible(true);
        setUploading(true);

        try {
          let videoFilename = "video.mp4";

          if (videoAsset.fileName) {
            videoFilename = videoAsset.fileName;
          } else if (videoAsset.uri) {
            const uriParts = videoAsset.uri.split("/");
            const lastPart = uriParts[uriParts.length - 1];
            if (lastPart && lastPart.includes(".")) {
              videoFilename = lastPart;
            } else {
              videoFilename = `video_${Date.now()}.mp4`;
            }
          }

          videoFilename = videoFilename.replace(/[^a-zA-Z0-9._-]/g, "_");

          if (!videoFilename.toLowerCase().endsWith(".mp4")) {
            videoFilename += ".mp4";
          }

          const presignedData = await movieStitchApi.getPresignedUrls(
            videoFilename
          );

          if (!presignedData) {
            throw new Error("No presigned URL received from server");
          }
          const { urls, keys } = presignedData;

          if (!urls.videoUrl || !urls.videoUrl.url) {
            throw new Error(
              "Invalid presigned URL structure received from server"
            );
          }

          if (
            typeof urls.videoUrl.url !== "string" ||
            urls.videoUrl.url === ""
          ) {
            throw new Error("Invalid presigned URL received from server");
          }

          if (!videoAsset.uri || videoAsset.uri === "") {
            throw new Error("Invalid file URI received from ImagePicker");
          }

          if (
            !videoAsset.uri.startsWith("file://") &&
            !videoAsset.uri.startsWith("content://")
          ) {
            console.warn("Unexpected file URI format:", videoAsset.uri);
          }

          const response = await uploadFile(videoAsset.uri, urls.videoUrl);

          if (response.ok) {
            setTempVideoKey(keys.videoKey);
            setCommentModalVisible(true);
          } else {
            throw new Error("Upload failed");
          }
        } catch (error) {
          console.error("Error during upload process:", error);
          Alert.alert("Error", `Upload failed: ${error.message}`);
        } finally {
          setUploading(false);
          setUploadModalVisible(false);
        }
      }
    } catch (error) {
      console.error("Error picking video:", error);
      Alert.alert("Error", "Failed to pick video from library.");
      setUploading(false);
    }
  };

  const captureVideo = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission Required",
          "Please grant permission to access your camera."
        );
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ["videos"],
        allowsEditing: true,
        quality: 1,
        videoMaxDuration: 60,
      });

      if (!result.canceled && result.assets[0]) {
        const videoAsset = result.assets[0];

        setUploadModalVisible(true);
        setUploading(true);

        try {
          let videoFilename = "captured_video.mp4";
          if (videoAsset.uri) {
            const uriParts = videoAsset.uri.split("/");
            const lastPart = uriParts[uriParts.length - 1];
            if (lastPart && lastPart.includes(".")) {
              videoFilename = lastPart;
            } else {
              videoFilename = `video_${Date.now()}.mp4`;
            }
          }

          videoFilename = videoFilename.replace(/[^a-zA-Z0-9._-]/g, "_");
          if (!videoFilename.toLowerCase().endsWith(".mp4")) {
            videoFilename += ".mp4";
          }

          const presignedData = await movieStitchApi.getPresignedUrls(
            videoFilename
          );

          if (!presignedData) {
            throw new Error("No presigned URL received from server");
          }

          const { urls, keys } = presignedData;

          if (!urls.videoUrl || !urls.videoUrl.url) {
            throw new Error(
              "Invalid presigned URL structure received from server"
            );
          }

          const response = await uploadFile(videoAsset.uri, urls.videoUrl);

          if (response.ok) {
            setTempVideoKey(keys.videoKey);
            setCommentModalVisible(true);
          } else {
            throw new Error("Upload failed");
          }
        } catch (error) {
          console.error("Error during upload process:", error);
          Alert.alert("Error", `Upload failed: ${error.message}`);
        } finally {
          setUploading(false);
          setUploadModalVisible(false);
        }
      }
    } catch (error) {
      console.error("Error capturing video:", error);
      Alert.alert("Error", "Failed to capture video.");
      setUploading(false);
    }
  };

  if (!isAuthenticated) {
    if (showForgotPassword) {
      return (
        <ForgotPasswordScreen onDone={() => setShowForgotPassword(false)} />
      );
    }

    if (showSignUp) {
      return <SignUpScreen onShowLogin={showLoginScreen} />;
    } else {
      return (
        <LoginScreen
          onShowSignUp={showSignUpScreen}
          onForgotPassword={() => setShowForgotPassword(true)}
        />
      );
    }
  }

  if (authLoading) {
    return (
      <View
        style={[
          styles.container,
          { justifyContent: "center", alignItems: "center" },
        ]}
      >
        <Text style={{ color: colors.text }}>Loading...</Text>
      </View>
    );
  }

  if (!selectedMovie) {
    return (
      <View style={styles.container}>
        <MovieSelectionScreen />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <SceneSelectionScreen
        uploadVideo={uploadVideo}
        captureVideo={captureVideo}
        setUploadModalVisible={setUploadModalVisible}
        setCurrentSubSceneId={setCurrentSubSceneId}
      >
        <UploadModal
          visible={uploadModalVisible}
          uploading={uploading}
          subSceneId={currentSubSceneId}
          uploadVideo={uploadVideo}
          captureVideo={captureVideo}
          setUploadModalVisible={setUploadModalVisible}
        />
        <CommentModal
          visible={commentModalVisible}
          onClose={() => setCommentModalVisible(false)}
          onSubmit={handleSubmitComment}
        />
        <VideoPlayerModal />
      </SceneSelectionScreen>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
