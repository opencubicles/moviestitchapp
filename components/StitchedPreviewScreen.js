import React, { useEffect, useRef, useState } from "react";
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Dimensions,
  Text,
  ActivityIndicator,
  Alert,
  Animated,
} from "react-native";
import { VideoView, useVideoPlayer } from "expo-video";
import { Ionicons } from "@expo/vector-icons";
import { useDispatch, useSelector } from "react-redux";
import {
  generateMovie,
  setAiMode,
  clearSelectedSceneStitch,
  clearSelectedMovieStitch,
  setSelectedSubmissions,
  clearVideoToPlay,
  downloadMovie,
} from "../store";
import * as WebBrowser from "expo-web-browser";

const { width, height } = Dimensions.get("window");

const StitchedPreviewScreen = ({
  visible,
  onClose,
  sceneId,
  AiMode = false,
}) => {
  const dispatch = useDispatch();

  const {
    generatedMovie,
    generatingMovie,
    generateMovieError,
    downloadingMovie,
  } = useSelector((state) => state.movie);

  const { movies, selectedMovie, selectedSubmissions } = useSelector(
    (state) => state.movie
  );
  const movieId = selectedMovie?.id;
  const [loading, setLoading] = useState(true);
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const hlsVideoUrl = generatedMovie?.output;

  const player = useVideoPlayer(hlsVideoUrl, (player) => {
    player.loop = false;
    player.staysActiveInBackground = false;
  });

  const handleClose = async () => {
    dispatch(clearSelectedSceneStitch(sceneId));
    dispatch(clearSelectedMovieStitch(movieId));
    dispatch(clearVideoToPlay());
    try {
      if (player) {
        player.pause();
      }
    } catch (err) {
      console.warn("Error handling video:", err);
    }
    onClose();
  };

  const handleDownload = async () => {
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 1.2,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    try {
      const result = await dispatch(downloadMovie()).unwrap();
      if (result?.video_url) {
        await WebBrowser.openBrowserAsync(result.video_url, {
          showInRecents: true,
          enableBarCollapsing: true,
          readerMode: false,
          controlsColor: "#fab81e",
        });
      } else {
        Alert.alert("Error", "No video URL received from server");
      }
    } catch (error) {
      Alert.alert("Download Failed", error?.message || "Failed to fetch video");
    }
  };

  const handleReplay = async () => {
    if (player) {
      try {
        player.currentTime = 0;
        player.play();
      } catch (error) {
        console.warn("Error replaying video:", error);
      }
    }
  };

  useEffect(() => {
    const updateVideoSource = async () => {
      if (visible && hlsVideoUrl) {
        try {
          await player.replaceAsync(hlsVideoUrl);
          player.play();
        } catch (error) {
          console.warn("Error updating video source:", error);
        }
      }
    };

    updateVideoSource();
  }, [visible, hlsVideoUrl]);

  useEffect(() => {
    if (visible) {
      setLoading(true);
      const currentMovie = movies.find((m) => m.id === selectedMovie?.id);
      const currentScene = currentMovie?.scenes?.find((s) => s.id === sceneId);

      const sceneSubmissions = {};
      if (currentScene && currentScene.subscenes) {
        currentScene.subscenes.forEach((subscene) => {
          if (selectedSubmissions[subscene.id]) {
            sceneSubmissions[subscene.id] = selectedSubmissions[subscene.id];
          }
        });
      }
      if (Object.keys(sceneSubmissions).length > 0) {
        dispatch(setSelectedSubmissions(sceneSubmissions));
      }

      dispatch(setAiMode(AiMode));
      dispatch(generateMovie());
    }
  }, [visible, dispatch]);

  useEffect(() => {
    if (generatedMovie && generatedMovie.output) {
      setLoading(false);
    }
  }, [generatedMovie]);

  useEffect(() => {
    if (generateMovieError) {
      setLoading(false);
    }
  }, [generateMovieError]);

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.videoContainer}>
          {loading || generatingMovie ? (
            <>
              <ActivityIndicator size="large" color="#fab81e" />
              <Text style={styles.loaderText}>
                {generatingMovie
                  ? "Stitching your video..."
                  : "Preparing video..."}
              </Text>
            </>
          ) : hlsVideoUrl ? (
            <>
              <VideoView
                player={player}
                contentFit="cover"
                fullscreenOptions={{
                  allowsFullscreen: true,
                }}
                allowsPictureInPicture
                nativeControls
                style={StyleSheet.absoluteFillObject}
              />
            </>
          ) : generateMovieError ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>Error generating video</Text>
              <Text style={styles.errorSubtext}>{generateMovieError}</Text>
            </View>
          ) : (
            <View style={styles.noVideoContainer}>
              <Text style={styles.noVideoText}>No video available</Text>
            </View>
          )}

          {!loading && hlsVideoUrl && !downloadingMovie && (
            <View style={styles.bottomLeftButtons}>
              <TouchableOpacity
                onPress={handleReplay}
                style={styles.playAgainButton}
              >
                <Ionicons name="refresh" size={18} color="#fff" />
              </TouchableOpacity>

              <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
                <TouchableOpacity
                  onPress={handleDownload}
                  disabled={downloadingMovie}
                  style={[
                    styles.downloadButton,
                    downloadingMovie && { backgroundColor: "#0056b3" },
                  ]}
                >
                  {downloadingMovie ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Ionicons name="download" size={18} color="#fff" />
                  )}
                </TouchableOpacity>
              </Animated.View>
            </View>
          )}

          <TouchableOpacity
            onPress={handleClose}
            style={styles.closeButton}
            disabled={downloadingMovie}
          >
            <Ionicons name="close" size={18} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  videoContainer: {
    width: width,
    height: height * 0.3,
    backgroundColor: "#000",
    borderTopWidth: 6,
    borderBottomWidth: 6,
    borderColor: "#fab81e",
    justifyContent: "center",
    alignItems: "center",
  },
  loaderText: {
    marginTop: 12,
    color: "#fab81e",
    fontSize: 14,
    fontWeight: "600",
  },
  closeButton: {
    position: "absolute",
    right: 5,
    top: 5,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#dc3545",
    justifyContent: "center",
    alignItems: "center",
    elevation: 4,
  },
  errorContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
  errorText: { color: "red", fontWeight: "700", fontSize: 16 },
  errorSubtext: { color: "#fff", fontSize: 12, marginTop: 4 },
  noVideoContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
  noVideoText: { color: "#fff", fontSize: 14 },
  bottomLeftButtons: {
    position: "absolute",
    left: 5,
    top: 5,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  playAgainButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#28a745",
    justifyContent: "center",
    alignItems: "center",
    elevation: 4,
  },
  downloadButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#007bff",
    justifyContent: "center",
    alignItems: "center",
    elevation: 4,
  },
});

export default StitchedPreviewScreen;
