import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Animated,
} from "react-native";
import VideoCard from "./VideoCard";
import Icon from "react-native-vector-icons/Feather";
import { Button, Card } from "react-native-paper";
import { useDispatch, useSelector } from "react-redux";
import { setVideoToPlay } from "../store";
import * as WebBrowser from "expo-web-browser";

const colors = {
  primaryBg: "#1C2526",
  secondaryBg: "#2A3435",
  text: "#F5F6F5",
  accent: "#FFD700",
  primaryAction: "#D32F2F",
  secondaryAction: "#455A64",
};

const sceneToVideo = (scene) => {
  return {
    id: scene.id,
    name: scene.title || "Untitled Scene",
    thumbnail: scene.thumbnail || "",
    videoUrl: scene.videoUrl,
    startTime: scene.start_time || 0,
    endTime: scene.end_time || null,
    play_icon: true,
  };
};

const SubSceneSection = ({
  subscene,
  setCurrentSubSceneId,
  sceneId,
  scene,
  uploadVideo,
  captureVideo,
}) => {
  const dispatch = useDispatch();
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const selectedMovie = useSelector((state) => state.movie.selectedMovie);
  const [pdfVisible, setPdfVisible] = useState(false);

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  useEffect(() => {
    if (pdfVisible && subscene.pdfFileKey) {
      WebBrowser.openBrowserAsync(
        `https://docs.google.com/gview?embedded=true&url=${subscene.pdfFileKey}`
      ).finally(() => setPdfVisible(false));
    }
  }, [pdfVisible, subscene.pdfFileKey]);

  const handlePdfOpen = () => {
    setPdfVisible(true);
  };

  const handleUpload = () => {
    setCurrentSubSceneId(subscene.id);
    uploadVideo(subscene.id);
  };

  const handleRecord = () => {
    setCurrentSubSceneId(subscene.id);
    captureVideo(subscene.id);
  };

  const mainVideo = sceneToVideo(scene);

  const playMainVideo = () => {
    dispatch(
      setVideoToPlay({
        videoUrl: mainVideo.videoUrl,
        startTime: subscene.start_time || 1,
        endTime: subscene.end_time,
        isSubscene: true,
      })
    );
  };

  return (
    <View style={styles.sceneContainer}>
      <View style={styles.titleRow}>
        <TouchableOpacity
          onPress={
            selectedMovie?.type === "movies" ? playMainVideo : handlePdfOpen
          }
        >
          <Text style={styles.sceneTitle}>{subscene.name}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.playIconBtn}
          onPress={
            selectedMovie?.type === "movies" ? playMainVideo : handlePdfOpen
          }
        >
          <Icon
            name={selectedMovie?.type === "movies" ? "play" : "file-text"}
            size={10}
            color="#000"
            style={
              selectedMovie?.type === "movies"
                ? styles.playIcon
                : styles.pdfIcon
            }
          />
        </TouchableOpacity>
      </View>

      {!subscene.videos || subscene.videos.length === 0 ? (
        <View style={styles.emptyScene}>
          <Text style={styles.emptySceneText}>No videos yet. Add one now!</Text>

          <Button
            mode="contained"
            onPress={handleUpload}
            style={styles.paperButton}
            labelStyle={styles.paperButtonLabel}
          >
            Upload
          </Button>

          <Button
            mode="contained"
            onPress={handleRecord}
            style={[
              styles.paperButton,
              { marginTop: 10, backgroundColor: colors.accent },
            ]}
            labelStyle={styles.paperButtonLabel}
          >
            Record
          </Button>
        </View>
      ) : (
        <View style={{ maxHeight: 240 }}>
          <ScrollView contentContainerStyle={styles.videoGrid}>
            {subscene.videos.map((video) => (
              <Card key={video.id} style={styles.sceneCardWrapper}>
                <VideoCard
                  video={video}
                  sceneId={sceneId}
                  subSceneId={subscene.id}
                  style={styles.video}
                />
                <Text
                  style={styles.videoName}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  {video.name}
                </Text>
              </Card>
            ))}

            <TouchableOpacity
              style={styles.iconContainer}
              onPress={handleUpload}
            >
              <Icon name="upload" size={24} color="#000" style={styles.icon} />
              <Text style={styles.iconLabel}>Upload</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.iconContainer}
              onPress={handleRecord}
            >
              <Icon name="camera" size={24} color="#000" style={styles.icon} />
              <Text style={styles.iconLabel}>Record</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  sceneContainer: {
    marginBottom: 20,
  },
  titleRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 4,
  },
  sceneTitle: {
    fontSize: 14,
    textAlign: "center",
  },
  emptyScene: {
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    backgroundColor: colors.secondaryBg,
    borderRadius: 12,
  },
  emptySceneText: {
    color: colors.text,
    fontSize: 16,
    marginBottom: 12,
  },
  sceneCardWrapper: {
    margin: "1%",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 1,
  },
  iconContainer: {
    alignItems: "center",
  },
  playIconBtn: {
    alignItems: "center",
  },
  icon: {
    paddingVertical: 7,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: "#ccc",
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 6,
    shadowColor: "#FFD700",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  iconLabel: {
    marginTop: 4,
    fontSize: 14,
    fontWeight: "500",
    color: "#000",
  },
  videoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "flex-start",
    padding: 8,
    gap: 6,
  },
  videoName: {
    padding: 2,
    fontSize: 12,
    fontWeight: "500",
    color: "#000",
    textAlign: "center",
    maxWidth: 60,
    backgroundColor: "#fff",
  },
  playIcon: {
    paddingVertical: 2,
    paddingHorizontal: 3,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: "#ccc",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 4,
    shadowColor: "#FFD700",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  pdfIcon: {
    paddingVertical: 2,
    paddingHorizontal: 3,
    borderRadius: 5,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    color: "rgba(255, 255, 255, 0.9)",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 4,
    shadowColor: "#FFD700",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
});

export default SubSceneSection;
