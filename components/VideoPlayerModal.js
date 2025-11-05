import {
  View,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Dimensions,
  Text,
} from "react-native";
import React, { useEffect, useState } from "react";
import { VideoView, useVideoPlayer } from "expo-video";
import { Ionicons } from "@expo/vector-icons";
import { useSelector, useDispatch } from "react-redux";
import { clearVideoToPlay } from "../store";

const { width, height } = Dimensions.get("window");

const VideoPlayerModal = () => {
  const dispatch = useDispatch();
  const video = useSelector((state) => state.movie.videoToPlay);
  const visible = !!video;

  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const player = useVideoPlayer(video?.videoUrl, (player) => {
    player.loop = false;
    player.staysActiveInBackground = false;
  });

  const formatTime = (seconds) => {
    if (!seconds || seconds === 0) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const getTimestampText = () => {
    if (!video) return "";
    const totalDuration = video.endTime || 0;
    return `${formatTime(currentTime)} / ${formatTime(totalDuration)}`;
  };

  useEffect(() => {
    if (!player) return;

    const subscription = player.addListener(
      "playingChange",
      ({ isPlaying }) => {
        setIsPlaying(isPlaying);
      }
    );

    const progressSubscription = player.addListener(
      "progressUpdate",
      ({ currentTime: time }) => {
        setCurrentTime(time / 1000);
        if (video?.endTime && time / 1000 >= video.endTime) {
          player.pause();
          dispatch(clearVideoToPlay());
        }
      }
    );

    const errorSubscription = player.addListener("error", (error) => {
      console.log("Video error:", error);
    });

    return () => {
      subscription.remove();
      progressSubscription.remove();
      errorSubscription.remove();
    };
  }, [player, video]);

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <View style={styles.videoContainer}>
            {video && (
              <VideoView
                player={player}
                contentFit="cover"
                fullscreenOptions={{
                  allowsFullscreen: true,
                }}
                allowsPictureInPicture
                nativeControls={true}
                style={StyleSheet.absoluteFillObject}
              />
            )}

            <TouchableOpacity
              onPress={() => dispatch(clearVideoToPlay())}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={18} color="#fff" />
            </TouchableOpacity>
          </View>

          {video?.isSubscene && (
            <View style={styles.timestampContainer}>
              <Text style={styles.timestampText}>{getTimestampText()}</Text>
            </View>
          )}
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
  modalContainer: {
    width: width,
    alignItems: "center",
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
    position: "relative",
  },
  timestampContainer: {
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    paddingHorizontal: 16,
    paddingVertical: 12,
    width: width,
    alignItems: "center",
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
  },
  timestampText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
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
});

export default VideoPlayerModal;
